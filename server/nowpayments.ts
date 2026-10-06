/**
 * NowPayments integration — singleton SDK + raw Payouts API.
 *
 * The official SDK (@nowpaymentsio/nowpayments-sdk-nodejs) handles:
 *   - Payment creation (createDirectPayment, createCheckout, …)
 *   - IPN signature verification + normalization (parseWebhook)
 *   - JWT auth lifecycle: token caching, expiry detection, auto-refresh
 *
 * The Payouts API (POST /payout, POST /payout/:id/verify, GET /payout/:id)
 * is NOT covered by the SDK v0.2.1, so those calls are made via raw fetch
 * using the SDK's own getJwtToken() for auth — no duplicated token logic.
 */

import {
  NowPaymentsSDK,
  type Payment as NowPaymentsPayment,
} from "@nowpaymentsio/nowpayments-sdk-nodejs";

export const SUPPORTED_NOWPAYMENTS_DEPOSIT_CURRENCY = "usdtbsc";
export const XOF_PER_USDT = 500;

export function isSupportedNowPaymentsDepositCurrency(value: unknown): value is string {
  return typeof value === "string"
    && value.trim().toLowerCase() === SUPPORTED_NOWPAYMENTS_DEPOSIT_CURRENCY;
}

export function convertXofToUsdt(amountXof: number): number {
  if (!Number.isSafeInteger(amountXof) || amountXof <= 0) {
    throw new RangeError("Le montant XOF doit être un entier positif.");
  }

  return Number((amountXof / XOF_PER_USDT).toFixed(8));
}

// ---------------------------------------------------------------------------
// Singleton SDK instance
// ---------------------------------------------------------------------------

let _sdk: NowPaymentsSDK | null = null;

/**
 * Returns the shared SDK instance, creating it on first call.
 * Reads env vars at call-time so the instance is created with the correct
 * values even if secrets are injected after module load.
 */
export function getSDK(): NowPaymentsSDK {
  if (_sdk) return _sdk;

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY n'est pas configuré");

  _sdk = new NowPaymentsSDK({
    apiKey,
    ...(process.env.NOWPAYMENTS_IPN_SECRET && {
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
    }),
    // Credentials for JWT-protected endpoints (Payouts API)
    ...(process.env.NOWPAYMENTS_ACCOUNT_EMAIL && {
      email: process.env.NOWPAYMENTS_ACCOUNT_EMAIL,
    }),
    ...(process.env.NOWPAYMENTS_ACCOUNT_PASSWORD && {
      password: process.env.NOWPAYMENTS_ACCOUNT_PASSWORD,
    }),
    // Switch to sandbox by setting NOWPAYMENTS_SANDBOX=true
    ...(process.env.NOWPAYMENTS_SANDBOX === "true" && {
      baseUrl: "https://api-sandbox.nowpayments.io",
    }),
  });

  return _sdk;
}

/** Force re-creation of the singleton (e.g. after env-var changes). */
export function resetSDK(): void {
  _sdk = null;
}

// ---------------------------------------------------------------------------
// Helpers shared by deposit + payout routes
// ---------------------------------------------------------------------------

function normalizeConfiguredAppUrl(rawAppUrl: string | undefined): string | undefined {
  if (!rawAppUrl?.trim()) return undefined;
  // Plesk may preserve wrapping quotes when a value is pasted from a config
  // file. Strip only those wrappers; the value still comes exclusively from
  // the process environment and is validated below.
  const appUrl = rawAppUrl.replace(/^(['"])(.*)\1$/, "$2").trim();
  if (!appUrl) return undefined;

  // A bare host is normalized to HTTPS, while an explicitly supplied HTTP
  // URL remains invalid in getNowPaymentsCallbackUrl.
  return /^[a-z][a-z\d+.-]*:\/\//i.test(appUrl) ? appUrl : `https://${appUrl}`;
}

export const DEFAULT_PUBLIC_APP_URL = "https://zoksilll.online";

export type ConfiguredAppUrlSource = "APP_URL" | "PUBLIC_URL" | "DEFAULT";

export function getConfiguredAppUrlInfo(): {
  url: string;
  source: ConfiguredAppUrlSource;
} | undefined {
  for (const source of ["APP_URL", "PUBLIC_URL"] as const) {
    const url = normalizeConfiguredAppUrl(process.env[source]);
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && parsed.hostname) {
        return { url, source };
      }
    } catch {
      // Try the next environment variable when this value is malformed.
    }
  }

  // Plesk deployments can omit custom environment variables from the
  // Passenger process. Keep payments functional with the verified public URL
  // while still allowing APP_URL/PUBLIC_URL to override it when available.
  return { url: DEFAULT_PUBLIC_APP_URL, source: "DEFAULT" };
}

export function getConfiguredAppUrl(): string | undefined {
  return getConfiguredAppUrlInfo()?.url;
}

export function getNowPaymentsCallbackUrl(): string | undefined {
  const appUrl = getConfiguredAppUrl();
  if (!appUrl) return undefined;

  try {
    const baseUrl = new URL(appUrl.endsWith("/") ? appUrl : `${appUrl}/`);
    if (baseUrl.protocol !== "https:") return undefined;
    return new URL("api/nowpayments/ipn", baseUrl).toString();
  } catch {
    return undefined;
  }
}

export type NowPaymentsDepositDecision = "tracking" | "review" | "credit";

/**
 * Determines whether a signed IPN can safely credit a requested deposit.
 * Credit is deliberately strict: a final status, the expected payment asset,
 * and a received amount at least equal to the quoted payment amount are all
 * required. Any short/incorrect/terminal payment stays visible for review.
 */
export function assessNowPaymentsDeposit(input: {
  gatewayStatus?: string | null;
  expectedAmount?: string | number | null;
  expectedCurrency?: string | null;
  actuallyPaid?: string | number | null;
  payCurrency?: string | null;
}): NowPaymentsDepositDecision {
  const status = (input.gatewayStatus || "").trim().toLowerCase();
  const terminalForReview = new Set([
    "partially_paid",
    "failed",
    "expired",
    "refunded",
    "cancelled",
  ]);

  if (status !== "finished") {
    return terminalForReview.has(status) ? "review" : "tracking";
  }

  const expectedCurrency = (input.expectedCurrency || "").trim().toLowerCase();
  const receivedCurrency = (input.payCurrency || "").trim().toLowerCase();
  if (!expectedCurrency || expectedCurrency !== receivedCurrency) return "review";

  const expectedAmount = Number(input.expectedAmount);
  const actuallyPaid = Number(input.actuallyPaid);
  // Amounts are supplied by NOWPayments as decimal strings. A very small
  // tolerance only absorbs floating-point representation noise; it never
  // turns a materially partial payment into a credit.
  if (
    !Number.isFinite(expectedAmount) ||
    expectedAmount <= 0 ||
    !Number.isFinite(actuallyPaid) ||
    actuallyPaid + 0.00000001 < expectedAmount
  ) {
    return "review";
  }

  return "credit";
}

/** Legacy "auto" settings map to the explicit semi-automatic payout mode. */
export function normalizeWithdrawalMode(
  value: string | null | undefined,
): "manual" | "semi_auto" {
  return value === "semi_auto" || value === "auto" ? "semi_auto" : "manual";
}

export function isNowPaymentsVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function isNowPaymentsDepositConfigured(): boolean {
  return Boolean(
    process.env.NOWPAYMENTS_API_KEY &&
      process.env.NOWPAYMENTS_IPN_SECRET &&
      getNowPaymentsCallbackUrl(),
  );
}

export function isNowPaymentsPayoutConfigured(): boolean {
  return Boolean(
    isNowPaymentsDepositConfigured() &&
      process.env.NOWPAYMENTS_ACCOUNT_EMAIL &&
      process.env.NOWPAYMENTS_ACCOUNT_PASSWORD,
  );
}

/**
 * Creates a direct payment for the in-app crypto-deposit UI.
 *
 * Direct payments are the SDK flow that returns a payment ID and destination
 * address immediately. The SDK performs its supported-currency, estimate and
 * minimum-amount preflight before creating the payment.
 */
export async function createNowPaymentsDirectPayment(input: {
  amount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId: string;
  description: string;
}): Promise<NowPaymentsPayment> {
  const ipnCallbackUrl = getNowPaymentsCallbackUrl();
  if (!ipnCallbackUrl) {
    throw new Error(
      "APP_URL ou PUBLIC_URL doit être configurée avec l'URL HTTPS publique de l'application pour les dépôts automatiques",
    );
  }

  return getSDK().createDirectPayment({
    amount: input.amount,
    currency: input.priceCurrency,
    payCurrency: input.payCurrency,
    orderId: input.orderId,
    description: input.description,
    ipnCallbackUrl,
  });
}

// ---------------------------------------------------------------------------
// Payouts API — raw fetch, JWT token from the SDK (handles caching + refresh)
// ---------------------------------------------------------------------------

const PAYOUTS_API_BASE =
  process.env.NOWPAYMENTS_SANDBOX === "true"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

export type NowPaymentsWithdrawal = {
  id?: string;
  batchWithdrawalId?: string;
  batch_withdrawal_id?: string;
  status?: string;
  hash?: string | null;
  error?: string | null;
  address?: string;
  currency?: string;
  amount?: string | number;
};

export type NowPaymentsPayoutResponse = {
  id?: string;
  withdrawals?: NowPaymentsWithdrawal[];
};

export type NowPaymentsPayoutStatus = NowPaymentsWithdrawal & {
  batch_withdrawal_id?: string;
};

/**
 * An error from a payout call that tells the caller whether the provider could
 * have received the request. Network errors after dispatch are intentionally
 * treated as ambiguous: refunding locally in that case could create a funded
 * payout plus a returned user balance.
 */
export class NowPaymentsPayoutError extends Error {
  constructor(
    message: string,
    public readonly requestMayHaveReachedProvider: boolean,
  ) {
    super(message);
    this.name = "NowPaymentsPayoutError";
  }
}

export function shouldReconcileNowPaymentsPayoutError(error: unknown): boolean {
  return (
    error instanceof NowPaymentsPayoutError &&
    error.requestMayHaveReachedProvider
  );
}

async function parsePayoutResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `NOWPayments API returned HTTP ${response.status}`;
    // A validation/business rejection (4xx except request-timeout/rate-limit)
    // is definitive. Server/gateway failures can occur after the provider has
    // accepted an idempotent payout, so they must be reconciled, never refunded.
    const requestMayHaveReachedProvider =
      response.status >= 500 ||
      response.status === 408 ||
      response.status === 409 ||
      response.status === 429;
    throw new NowPaymentsPayoutError(message, requestMayHaveReachedProvider);
  }
  return body;
}

async function payoutRequest(
  path: string,
  init: RequestInit = {},
): Promise<Record<string, unknown>> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPayments payouts are not fully configured");

  // Delegate JWT lifecycle entirely to the SDK (caching + auto-refresh).
  // getJwtToken() returns null when email/password are not configured —
  // detect that early so the error message is clear.
  const sdk = getSDK();
  if (!sdk.hasAuthCredentials()) {
    throw new Error(
      "NOWPayments payouts requièrent NOWPAYMENTS_ACCOUNT_EMAIL et NOWPAYMENTS_ACCOUNT_PASSWORD",
    );
  }
  const token = await sdk.getJwtToken();
  if (!token) {
    throw new Error(
      "NOWPayments n'a pas retourné de token JWT — vérifiez vos identifiants",
    );
  }

  const headers = new Headers(init.headers as HeadersInit);
  headers.set("x-api-key", apiKey);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${PAYOUTS_API_BASE}${path}`, {
      ...init,
      headers,
    });
  } catch (error: any) {
    throw new NowPaymentsPayoutError(
      error?.message || "La requête NOWPayments n'a pas reçu de réponse",
      true,
    );
  }
  return parsePayoutResponse(response);
}

/**
 * IPNs may be delivered out of order. A provider "waiting" or "processing"
 * update must never move a locally pending-2FA payout past the admin's
 * mandatory verification step.
 */
export function nextWithdrawalStatusFromPayoutIpn(
  currentStatus: string,
  gatewayStatus: string,
): "pending_2fa" | "processing" | "approved" | "failed" | "rejected" {
  if (["approved", "failed", "rejected"].includes(currentStatus)) {
    return currentStatus as "approved" | "failed" | "rejected";
  }
  const normalized = gatewayStatus.toLowerCase();
  if (normalized === "finished") return "approved";
  if (normalized === "failed") return "failed";
  if (normalized === "rejected") return "rejected";
  return currentStatus === "pending_2fa" ? "pending_2fa" : "processing";
}

/**
 * Create a payout batch with a single withdrawal.
 * Requires NOWPAYMENTS_ACCOUNT_EMAIL + NOWPAYMENTS_ACCOUNT_PASSWORD for JWT.
 */
export async function createPayout(input: {
  address: string;
  currency: string;
  amount: number;
  uniqueExternalId: string;
  description: string;
}): Promise<NowPaymentsPayoutResponse> {
  const callbackUrl = getNowPaymentsCallbackUrl();
  return payoutRequest("/payout", {
    method: "POST",
    body: JSON.stringify({
      ...(callbackUrl ? { ipn_callback_url: callbackUrl } : {}),
      withdrawals: [
        {
          address: input.address,
          currency: input.currency,
          amount: Number(input.amount.toFixed(6)),
          ...(callbackUrl ? { ipn_callback_url: callbackUrl } : {}),
          payout_description: input.description,
          unique_external_id: input.uniqueExternalId,
        },
      ],
    }),
  }) as Promise<NowPaymentsPayoutResponse>;
}

/**
 * Submit the 2FA verification code to release a pending payout batch.
 */
export async function verifyPayout(
  batchWithdrawalId: string,
  verificationCode: string,
): Promise<Record<string, unknown>> {
  return payoutRequest(
    `/payout/${encodeURIComponent(batchWithdrawalId)}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ verification_code: verificationCode }),
    },
  );
}

/**
 * Fetch the current status of a single payout.
 */
export async function getPayoutStatus(
  payoutId: string,
): Promise<NowPaymentsPayoutStatus | NowPaymentsPayoutStatus[]> {
  return payoutRequest(`/payout/${encodeURIComponent(payoutId)}`, {
    method: "GET",
  }) as Promise<NowPaymentsPayoutStatus | NowPaymentsPayoutStatus[]>;
}
