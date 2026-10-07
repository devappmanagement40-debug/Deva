import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { PoolClient } from "pg";
import { deposits, users, withdrawals } from "@shared/schema";
import { db, pool } from "./db";
import { getSDK } from "./nowpayments";
import { storage } from "./storage";

const OPEN_DEPOSIT_STATUSES = ["pending", "processing", "review"] as const;
const OPEN_WITHDRAWAL_STATUSES = ["pending", "pending_2fa", "processing", "reconciling"] as const;
const POLL_LOCK_KEY_A = 20261006;
const POLL_LOCK_KEY_B = 260626;
const DAILY_SUMMARY_SETTING = "telegramAdminLastDailySummaryDate";

type TelegramMessage = {
  chat?: { id?: string | number };
  text?: string;
};

type AdminTelegramStats = {
  totalUsers?: number;
  todayUsers?: number;
  totalDeposits?: number;
  todayDeposits?: number;
  totalWithdrawals?: number;
  todayWithdrawals?: number;
  usersWithProducts?: number;
  totalActiveProducts?: number;
  totalCommissions?: number;
};

export type AdminTelegramBalanceSummary = {
  depositBalance: number | string;
  earningsBalance: number | string;
  pendingDepositCount: number | string;
  pendingDepositAmount: number | string;
  pendingWithdrawalCount: number | string;
  pendingWithdrawalGross: number | string;
  pendingWithdrawalNet: number | string;
  pendingWithdrawalFees: number | string;
};

export type AdminTelegramPendingDeposit = {
  id: number;
  amount: number;
  country: string;
  paymentMethod: string;
  status: string;
  createdAt: Date | string;
};

export type AdminTelegramPendingWithdrawal = {
  id: number;
  amount: number;
  netAmount: number;
  fees: number;
  country: string;
  paymentMethod: string;
  status: string;
  createdAt: Date | string;
};

export type AdminTelegramLocalPayment = {
  id: number;
  amount: number;
  status: string;
  nowPaymentsStatus: string | null;
  nowPaymentsExpectedAmount: string | null;
  nowPaymentsExpectedCurrency: string | null;
};

export type AdminTelegramDataSource = {
  hasActiveSiteAdmin(): Promise<boolean>;
  getStats(): Promise<AdminTelegramStats>;
  getBalanceSummary(): Promise<AdminTelegramBalanceSummary>;
  getPendingOperations(): Promise<{
    deposits: AdminTelegramPendingDeposit[];
    withdrawals: AdminTelegramPendingWithdrawal[];
  }>;
  findNowPaymentsDeposit(paymentId: string): Promise<AdminTelegramLocalPayment | undefined>;
};

export type AdminTelegramProvider = {
  getBalance(): Promise<unknown>;
  getPaymentStatus(paymentId: string): Promise<unknown>;
};

export type AdminTelegramNotification =
  | { kind: "signup"; userId: number; country: string }
  | { kind: "admin_login"; userId: number; country: string }
  | { kind: "purchase"; userId: number; country?: string; productName: string; amount: number }
  | {
      kind: "deposit_created";
      id: number;
      userId: number;
      amount: number;
      country: string;
      paymentMethod: string;
      reference: string | null;
      status: string;
    }
  | {
      kind: "deposit_status";
      id: number;
      amount: number;
      country: string;
      paymentMethod: string;
      status: string;
      providerStatus?: string | null;
    }
  | {
      kind: "withdrawal_created" | "withdrawal_status";
      id: number;
      amount: number;
      netAmount: number;
      fees: number;
      country: string;
      paymentMethod: string;
      status: string;
      providerStatus?: string | null;
    }
  | {
      kind: "payment_error";
      provider: "NOWPayments" | "WestPay";
      stage: "deposit" | "withdrawal" | "webhook" | "reconciliation";
      code: string;
      recordId?: number;
    }
  | {
      kind: "security_alert";
      source: "Connexion" | "NOWPayments" | "WestPay";
      issue:
        | "admin_login_failed"
        | "invalid_webhook_signature"
        | "webhook_unmatched_payment";
      userId?: number;
    };

type CommandRequest = { chatId: string | number; text: string };

type CommandDependencies = {
  authorizedChatId: string;
  data: AdminTelegramDataSource;
  provider?: AdminTelegramProvider;
  send(text: string): Promise<void>;
};

type ParsedCommand = { name: string; args: string };

const databaseDataSource: AdminTelegramDataSource = {
  async hasActiveSiteAdmin() {
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.isBanned, false),
          or(eq(users.isAdmin, true), eq(users.isSuperAdmin, true)),
        ),
      )
      .limit(1);
    return Boolean(admin);
  },

  async getStats() {
    return await storage.getStats() as AdminTelegramStats;
  },

  async getBalanceSummary() {
    const [[depositBalance], [earningsBalance], [pendingDeposits], [pendingWithdrawals]] =
      await Promise.all([
        db
          .select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` })
          .from(users),
        db
          .select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` })
          .from(users),
        db
          .select({
            count: sql<number>`count(*)`,
            total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`,
          })
          .from(deposits)
          .where(inArray(deposits.status, [...OPEN_DEPOSIT_STATUSES])),
        db
          .select({
            count: sql<number>`count(*)`,
            gross: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`,
            net: sql<string>`COALESCE(SUM(${withdrawals.netAmount}), 0)`,
            fees: sql<string>`COALESCE(SUM(${withdrawals.fees}), 0)`,
          })
          .from(withdrawals)
          .where(inArray(withdrawals.status, [...OPEN_WITHDRAWAL_STATUSES])),
      ]);

    return {
      depositBalance: depositBalance?.total || 0,
      earningsBalance: earningsBalance?.total || 0,
      pendingDepositCount: pendingDeposits?.count || 0,
      pendingDepositAmount: pendingDeposits?.total || 0,
      pendingWithdrawalCount: pendingWithdrawals?.count || 0,
      pendingWithdrawalGross: pendingWithdrawals?.gross || 0,
      pendingWithdrawalNet: pendingWithdrawals?.net || 0,
      pendingWithdrawalFees: pendingWithdrawals?.fees || 0,
    };
  },

  async getPendingOperations() {
    const [pendingDepositRows, pendingWithdrawalRows] = await Promise.all([
      db
        .select({
          id: deposits.id,
          amount: deposits.amount,
          country: deposits.country,
          paymentMethod: deposits.paymentMethod,
          status: deposits.status,
          createdAt: deposits.createdAt,
        })
        .from(deposits)
        .where(inArray(deposits.status, [...OPEN_DEPOSIT_STATUSES]))
        .orderBy(desc(deposits.createdAt), desc(deposits.id))
        .limit(10),
      db
        .select({
          id: withdrawals.id,
          amount: withdrawals.amount,
          netAmount: withdrawals.netAmount,
          fees: withdrawals.fees,
          country: withdrawals.country,
          paymentMethod: withdrawals.paymentMethod,
          status: withdrawals.status,
          createdAt: withdrawals.createdAt,
        })
        .from(withdrawals)
        .where(inArray(withdrawals.status, [...OPEN_WITHDRAWAL_STATUSES]))
        .orderBy(desc(withdrawals.createdAt), desc(withdrawals.id))
        .limit(10),
    ]);

    return { deposits: pendingDepositRows, withdrawals: pendingWithdrawalRows };
  },

  async findNowPaymentsDeposit(paymentId) {
    const [deposit] = await db
      .select({
        id: deposits.id,
        amount: deposits.amount,
        status: deposits.status,
        nowPaymentsStatus: deposits.nowPaymentsStatus,
        nowPaymentsExpectedAmount: deposits.nowPaymentsExpectedAmount,
        nowPaymentsExpectedCurrency: deposits.nowPaymentsExpectedCurrency,
      })
      .from(deposits)
      .where(
        and(
          eq(deposits.paymentMethod, "NOWPayments"),
          eq(deposits.reference, paymentId),
        ),
      )
      .limit(1);
    return deposit;
  },
};

export function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function numericValue(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatXof(value: unknown): string {
  const amount = numericValue(value);
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount ?? 0)} XOF`;
}

function escapeTelegramField(value: unknown): string {
  const normalized = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 180);
  return escapeTelegramHtml(normalized || "—");
}

function formatDepositStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "En attente",
    processing: "En traitement",
    review: "À vérifier",
    approved: "Approuvé",
    rejected: "Rejeté",
    failed: "Échoué",
    cancelled: "Annulé",
    expired: "Expiré",
  };
  const normalized = status.trim().toLowerCase();
  return labels[normalized] || normalized.replace(/_/g, " ") || "—";
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 8 }).format(value);
}

function formatCount(value: unknown): string {
  const count = numericValue(value);
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(count ?? 0);
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTelegramCommand(text: string): ParsedCommand | undefined {
  const [head = "", ...rest] = text.trim().split(/\s+/);
  const match = head.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?$/i);
  if (!match) return undefined;
  return { name: match[1].toLowerCase(), args: rest.join(" ").trim() };
}

type NowPaymentsBalanceRow = { currency: string; amount: number };

export function parseNowPaymentsBalance(response: unknown): NowPaymentsBalanceRow[] | undefined {
  if (!isRecord(response) || !Array.isArray(response.result) || response.result.length > 50) {
    return undefined;
  }

  const rows: NowPaymentsBalanceRow[] = [];
  const seenCurrencies = new Set<string>();
  for (const rawRow of response.result) {
    if (!isRecord(rawRow) || typeof rawRow.currency !== "string") return undefined;
    const currency = rawRow.currency.trim().toLowerCase();
    const amount = numericValue(rawRow.amount);
    if (!/^[a-z0-9_-]{2,20}$/.test(currency) || amount === undefined || amount < 0) {
      return undefined;
    }
    if (seenCurrencies.has(currency)) return undefined;
    seenCurrencies.add(currency);
    rows.push({ currency, amount });
  }
  return rows;
}

function helpMessage(): string {
  return [
    "<b>Commandes d’administration DIAMANT</b>",
    "/stats — statistiques du site",
    "/solde — soldes agrégés et opérations ouvertes",
    "/pending — jusqu’à 10 dépôts et 10 retraits ouverts",
    "/nowpayments_solde — solde marchand NOWPayments",
    "/nowpayments &lt;payment_id&gt; — statut et rapprochement local en lecture seule",
    "",
    "CloudPay/Galaxy n’est pas configuré dans ce projet. Les opérations en attente du prestataire ne sont pas séparées dans son solde documenté; consultez /solde et /pending.",
  ].join("\n");
}

function formatStatsMessage(
  stats: AdminTelegramStats,
  pending: AdminTelegramBalanceSummary,
): string {
  return [
    "<b>Statistiques du site</b>",
    `Utilisateurs : <b>${formatCount(stats.totalUsers)}</b>`,
    `Nouvelles inscriptions aujourd’hui : <b>${formatCount(stats.todayUsers)}</b>`,
    `Dépôts approuvés : <b>${formatXof(stats.totalDeposits)}</b> · aujourd’hui : <b>${formatXof(stats.todayDeposits)}</b>`,
    `Retraits approuvés : <b>${formatXof(stats.totalWithdrawals)}</b> · aujourd’hui : <b>${formatXof(stats.todayWithdrawals)}</b>`,
    `Utilisateurs avec produits : <b>${formatCount(stats.usersWithProducts)}</b>`,
    `Produits actifs : <b>${formatCount(stats.totalActiveProducts)}</b>`,
    `Commissions : <b>${formatXof(stats.totalCommissions)}</b>`,
    `Dépôts ouverts : <b>${formatCount(pending.pendingDepositCount)}</b> · <b>${formatXof(pending.pendingDepositAmount)}</b>`,
    `Retraits ouverts : <b>${formatCount(pending.pendingWithdrawalCount)}</b> · net à payer : <b>${formatXof(pending.pendingWithdrawalNet)}</b>`,
  ].join("\n");
}

function formatBalanceSummary(summary: AdminTelegramBalanceSummary): string {
  return [
    "<b>Soldes agrégés du site</b>",
    `Solde de dépôt des comptes : <b>${formatXof(summary.depositBalance)}</b>`,
    `Solde des revenus : <b>${formatXof(summary.earningsBalance)}</b>`,
    `Dépôts ouverts : <b>${formatCount(summary.pendingDepositCount)}</b> · <b>${formatXof(summary.pendingDepositAmount)}</b>`,
    `Retraits ouverts : <b>${formatCount(summary.pendingWithdrawalCount)}</b>`,
    `Brut réservé : <b>${formatXof(summary.pendingWithdrawalGross)}</b> · frais : <b>${formatXof(summary.pendingWithdrawalFees)}</b> · net à payer : <b>${formatXof(summary.pendingWithdrawalNet)}</b>`,
  ].join("\n");
}

function formatPendingOperations(
  depositsList: AdminTelegramPendingDeposit[],
  withdrawalsList: AdminTelegramPendingWithdrawal[],
): string {
  const lines = ["<b>Opérations ouvertes</b>", "", "<b>Dépôts</b>"];
  if (depositsList.length === 0) {
    lines.push("Aucun dépôt ouvert.");
  } else {
    for (const item of depositsList.slice(0, 10)) {
      lines.push(
        `#${item.id} · ${formatXof(item.amount)} · ${escapeTelegramHtml(item.country)} · ${escapeTelegramHtml(item.paymentMethod)} · ${escapeTelegramHtml(item.status)} · ${formatDate(item.createdAt)}`,
      );
    }
  }

  lines.push("", "<b>Retraits</b>");
  if (withdrawalsList.length === 0) {
    lines.push("Aucun retrait ouvert.");
  } else {
    for (const item of withdrawalsList.slice(0, 10)) {
      lines.push(
        `#${item.id} · brut ${formatXof(item.amount)} · net ${formatXof(item.netAmount)} · ${escapeTelegramHtml(item.country)} · ${escapeTelegramHtml(item.paymentMethod)} · ${escapeTelegramHtml(item.status)} · ${formatDate(item.createdAt)}`,
      );
    }
  }
  return lines.join("\n");
}

function normalizeProviderStatus(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim() || value.length > 40) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized === "paid" ? "finished" : normalized;
}

function decimalValuesMatch(left: unknown, right: unknown): boolean | undefined {
  const leftNumber = numericValue(left);
  const rightNumber = numericValue(right);
  if (leftNumber === undefined || rightNumber === undefined) return undefined;
  return Math.abs(leftNumber - rightNumber) <= 0.00000001;
}

function maskPaymentId(paymentId: string): string {
  return `…${paymentId.slice(-4)}`;
}

async function handleNowPaymentsStatus(
  paymentId: string,
  dependencies: CommandDependencies,
): Promise<string> {
  if (!/^[a-z0-9_-]{1,100}$/i.test(paymentId)) {
    return "Identifiant NOWPayments invalide. Utilisez le payment_id du dépôt.";
  }
  if (!dependencies.provider) {
    return "NOWPayments n’est pas configuré pour les consultations.";
  }

  const response = await dependencies.provider.getPaymentStatus(paymentId);
  if (!isRecord(response) || String(response.payment_id ?? "") !== paymentId) {
    return "NOWPayments n’a pas confirmé l’identité de ce paiement; aucun détail n’est affiché.";
  }

  const providerStatus = normalizeProviderStatus(response.payment_status ?? response.status);
  if (!providerStatus) {
    return "Réponse de statut NOWPayments non reconnue; aucun détail n’est affiché.";
  }

  const providerAmount = numericValue(response.pay_amount);
  const providerCurrency =
    typeof response.pay_currency === "string" && /^[a-z0-9_-]{2,20}$/i.test(response.pay_currency)
      ? response.pay_currency.toLowerCase()
      : undefined;
  const local = await dependencies.data.findNowPaymentsDeposit(paymentId);
  const expectedAmount = numericValue(local?.nowPaymentsExpectedAmount);
  const expectedCurrency =
    typeof local?.nowPaymentsExpectedCurrency === "string" &&
    /^[a-z0-9_-]{2,20}$/i.test(local.nowPaymentsExpectedCurrency)
      ? local.nowPaymentsExpectedCurrency.toLowerCase()
      : undefined;
  const lines = [
    `<b>NOWPayments ${escapeTelegramHtml(maskPaymentId(paymentId))}</b>`,
    `Statut prestataire : <b>${escapeTelegramHtml(providerStatus)}</b>`,
    `Montant prestataire : <b>${providerAmount === undefined || !providerCurrency ? "non fourni" : `${formatDecimal(providerAmount)} ${escapeTelegramHtml(providerCurrency)}`}</b>`,
  ];

  if (!local) {
    lines.push("Correspondance locale : <b>aucun dépôt trouvé</b>");
    return lines.join("\n");
  }

  const statusMatch = local.nowPaymentsStatus
    ? normalizeProviderStatus(local.nowPaymentsStatus) === providerStatus
    : undefined;
  const amountMatch = decimalValuesMatch(providerAmount, expectedAmount);
  const currencyMatch = providerCurrency && expectedCurrency
    ? providerCurrency === expectedCurrency
    : undefined;
  const comparisons = [statusMatch, amountMatch, currencyMatch].filter(
    (value): value is boolean => value !== undefined,
  );
  const comparisonLabel = comparisons.length === 0
    ? "incomplète"
    : comparisons.every(Boolean)
      ? "concordante"
      : "écart à vérifier";

  lines.push(
    `Site : dépôt #${local.id} · ${formatXof(local.amount)} · statut ${escapeTelegramHtml(local.status)}`,
      `Attendu local : ${
      expectedAmount !== undefined && expectedCurrency
        ? `${formatDecimal(expectedAmount)} ${escapeTelegramHtml(expectedCurrency)}`
        : "montant crypto non enregistré"
    }`,
    `Comparaison statut/montant/devise : <b>${comparisonLabel}</b>`,
  );
  return lines.join("\n");
}

export function createAdminTelegramCommandHandler(dependencies: CommandDependencies) {
  return async ({ chatId, text }: CommandRequest): Promise<void> => {
    if (String(chatId) !== dependencies.authorizedChatId) return;
    const command = parseTelegramCommand(text);
    if (!command) return;

    if (command.name === "start" || command.name === "help") {
      await dependencies.send(helpMessage());
      return;
    }

    if (command.name === "cloudpay" || command.name === "cloudpay_solde") {
      await dependencies.send(
        "CloudPay/Galaxy n’est pas utilisé par ce site. Consultez /nowpayments ou /nowpayments_solde.",
      );
      return;
    }

    const supportedCommands = new Set([
      "stats",
      "solde",
      "pending",
      "nowpayments_solde",
      "nowpayments",
    ]);
    if (!supportedCommands.has(command.name)) {
      await dependencies.send("Commande inconnue. Envoyez /help pour voir les commandes disponibles.");
      return;
    }

    try {
      if (!(await dependencies.data.hasActiveSiteAdmin())) {
        await dependencies.send("Accès suspendu : aucun compte administrateur actif n’est configuré sur le site.");
        return;
      }
      if (command.name === "stats") {
        const [stats, pending] = await Promise.all([
          dependencies.data.getStats(),
          dependencies.data.getBalanceSummary(),
        ]);
        await dependencies.send(formatStatsMessage(stats, pending));
        return;
      }
      if (command.name === "solde") {
        await dependencies.send(formatBalanceSummary(await dependencies.data.getBalanceSummary()));
        return;
      }
      if (command.name === "pending") {
        const pending = await dependencies.data.getPendingOperations();
        await dependencies.send(
          formatPendingOperations(pending.deposits.slice(0, 10), pending.withdrawals.slice(0, 10)),
        );
        return;
      }
      if (command.name === "nowpayments_solde") {
        if (!dependencies.provider) {
          await dependencies.send("NOWPayments n’est pas configuré pour les consultations.");
          return;
        }
        const rows = parseNowPaymentsBalance(await dependencies.provider.getBalance());
        if (!rows) {
          await dependencies.send("Réponse de solde NOWPayments non reconnue; aucun montant n’est affiché.");
          return;
        }
        const balanceLines = rows.length
          ? rows.map(({ currency, amount }) => `${escapeTelegramHtml(currency)} : <b>${formatDecimal(amount)}</b>`)
          : ["Aucun solde retourné."];
        await dependencies.send([
          "<b>Solde marchand NOWPayments</b>",
          ...balanceLines,
          "",
          "L’API ne fournit pas ici de total d’opérations en attente. Consultez /solde et /pending pour les opérations locales.",
        ].join("\n"));
        return;
      }

      await dependencies.send(await handleNowPaymentsStatus(command.args, dependencies));
    } catch {
      await dependencies.send(
        "La consultation a échoué. Aucune transaction ni aucun solde n’a été modifié.",
      );
    }
  };
}

function formatNotification(event: AdminTelegramNotification): string {
  if (event.kind === "signup") {
    return `🎉 <b>Félicitations, vous venez d’accueillir un nouveau membre !</b>\nCompte #<b>${event.userId}</b> · ${escapeTelegramHtml(event.country)}`;
  }
  if (event.kind === "admin_login") {
    return `🔐 <b>Connexion administrateur</b>\nCompte #${event.userId} · ${escapeTelegramHtml(event.country)}`;
  }
  if (event.kind === "purchase") {
    const country = event.country ? ` · ${escapeTelegramHtml(event.country)}` : "";
    return `🛒 <b>Achat confirmé</b>\nCompte #${event.userId}${country}\n${escapeTelegramHtml(event.productName)} · ${formatXof(event.amount)}`;
  }
  if (event.kind === "deposit_created") {
    const lines = [
      "<b>💳 Nouvelle demande de dépôt</b>",
      `<b>ID :</b> <b>${event.id}</b>`,
      `<b>Utilisateur ID :</b> <b>${event.userId}</b>`,
      `<b>Montant :</b> <b>${formatXof(event.amount)}</b>`,
      `<b>Méthode :</b> ${escapeTelegramField(event.paymentMethod)}`,
      `<b>Pays :</b> ${escapeTelegramField(event.country)}`,
      `<b>Référence :</b> <b>${escapeTelegramField(event.reference)}</b>`,
      `<b>Statut :</b> <b>${escapeTelegramField(formatDepositStatusLabel(event.status))}</b>`,
    ];
    return lines.join("\n");
  }
  if (event.kind === "deposit_status") {
    const normalizedProviderStatus =
      typeof event.providerStatus === "string"
        ? event.providerStatus.replace(/[^a-z0-9_-]/gi, "").slice(0, 40)
        : "";
    const providerStatus = normalizedProviderStatus
      ? `\nStatut prestataire : ${escapeTelegramHtml(normalizedProviderStatus)}`
      : "";
    return `💰 <b>Statut du dépôt modifié</b>\nDépôt #${event.id} · ${formatXof(event.amount)}\n${escapeTelegramHtml(event.country)} · ${escapeTelegramHtml(event.paymentMethod)} · ${escapeTelegramHtml(event.status)}${providerStatus}`;
  }
  if (event.kind === "withdrawal_created" || event.kind === "withdrawal_status") {
    const title = event.kind === "withdrawal_created" ? "Nouvelle demande de retrait" : "Statut du retrait modifié";
    const normalizedProviderStatus =
      typeof event.providerStatus === "string"
        ? event.providerStatus.replace(/[^a-z0-9_-]/gi, "").slice(0, 40)
        : "";
    const providerStatus = normalizedProviderStatus
      ? `\nStatut prestataire : ${escapeTelegramHtml(normalizedProviderStatus)}`
      : "";
    return `💸 <b>${title}</b>\nRetrait #${event.id} · brut ${formatXof(event.amount)} · net ${formatXof(event.netAmount)}\n${escapeTelegramHtml(event.country)} · ${escapeTelegramHtml(event.paymentMethod)} · ${escapeTelegramHtml(event.status)}${providerStatus}`;
  }
  if (event.kind === "payment_error") {
    const stageLabel: Record<typeof event.stage, string> = {
      deposit: "dépôt",
      withdrawal: "retrait",
      webhook: "notification prestataire",
      reconciliation: "rapprochement",
    };
    const safeCode = /^[a-z0-9_-]{1,32}$/i.test(event.code) ? event.code : "erreur_non_detaillee";
    return `⚠️ <b>Erreur de paiement</b>\n${event.provider} · ${stageLabel[event.stage]} · ${safeCode}${event.recordId ? ` · #${event.recordId}` : ""}`;
  }

  if (event.kind === "security_alert") {
    const issueLabel: Record<typeof event.issue, string> = {
      admin_login_failed: "échec de connexion à un compte administrateur",
      invalid_webhook_signature: "signature de webhook invalide",
      webhook_unmatched_payment: "notification sans dépôt local correspondant",
    };
    return `🛡️ <b>Alerte de sécurité</b>\n${event.source} · ${issueLabel[event.issue]}${event.userId ? ` · compte #${event.userId}` : ""}`;
  }
  return "Événement administrateur non reconnu.";
}

export function formatAdminTelegramNotification(event: AdminTelegramNotification): string {
  return formatNotification(event);
}

let activeSender: ((text: string) => Promise<void>) | undefined;
let outgoingMessages = Promise.resolve();
const recentAlertAt = new Map<string, number>();

export function notifyAdminTelegram(event: AdminTelegramNotification): void {
  if (!activeSender) return;
  const dedupeKey = event.kind === "security_alert"
    ? `security:${event.source}:${event.issue}:${event.userId || 0}`
    : event.kind === "payment_error"
      ? `payment:${event.provider}:${event.stage}:${event.code}:${event.recordId || 0}`
      : undefined;
  if (dedupeKey) {
    const now = Date.now();
    const lastSent = recentAlertAt.get(dedupeKey) || 0;
    if (now - lastSent < 120_000) return;
    recentAlertAt.set(dedupeKey, now);
  }

  const message = formatNotification(event);
  const sender = activeSender;
  const delivery = outgoingMessages
    .catch(() => undefined)
    .then(() => sender(message));
  outgoingMessages = delivery.catch(() => undefined);
  void delivery.catch(() => {
    console.warn("[telegram-admin] Notification delivery failed.");
  });
}

class TelegramApiError extends Error {
  constructor(readonly code: number) {
    super("Telegram API request failed");
  }
}

async function telegramRequest(
  token: string,
  method: "getUpdates" | "sendMessage",
  body: Record<string, unknown>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutMs = method === "getUpdates" ? 30_000 : 15_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as
      | { ok?: boolean; result?: unknown; error_code?: number }
      | null;
    if (!response.ok || payload?.ok !== true) {
      throw new TelegramApiError(
        typeof payload?.error_code === "number" ? payload.error_code : response.status,
      );
    }
    return payload.result;
  } catch (error) {
    if (error instanceof TelegramApiError) throw error;
    throw new TelegramApiError(0);
  } finally {
    clearTimeout(timeout);
  }
}

function abidjanDateTime(date: Date): { dateKey: string; hour: string; minute: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Abidjan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: values.hour,
    minute: values.minute,
  };
}

async function sendDailySummary(send: (text: string) => Promise<void>): Promise<void> {
  try {
    const { dateKey, hour, minute } = abidjanDateTime(new Date());
    if (hour !== "09" || minute !== "00") return;
    if ((await storage.getSetting(DAILY_SUMMARY_SETTING)) === dateKey) return;

    const [stats, pending] = await Promise.all([
      databaseDataSource.getStats(),
      databaseDataSource.getBalanceSummary(),
    ]);
    await send(
      `<b>Résumé quotidien DIAMANT · ${escapeTelegramHtml(dateKey)}</b>\n${formatStatsMessage(stats, pending)}`,
    );
    await storage.setSetting(DAILY_SUMMARY_SETTING, dateKey);
  } catch {
    console.warn("[telegram-admin] Daily summary could not be sent.");
  }
}

export async function startAdminTelegramBot(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !authorizedChatId) {
    console.info("[telegram-admin] Polling disabled: Telegram bot secrets are not configured.");
    return;
  }
  if (!/^-?\d{1,25}$/.test(authorizedChatId)) {
    console.error("[telegram-admin] Polling disabled: configured chat ID is invalid.");
    return;
  }

  const send = async (text: string) => {
    await telegramRequest(token, "sendMessage", {
      chat_id: authorizedChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  };
  activeSender = send;

  let lockClient: PoolClient | undefined;
  try {
    lockClient = await pool.connect();
    const lockResult = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1, $2) AS locked",
      [POLL_LOCK_KEY_A, POLL_LOCK_KEY_B],
    );
    if (!lockResult.rows[0]?.locked) {
      lockClient.release();
      console.info("[telegram-admin] A poller already holds the database lock; this process is send-only.");
      return;
    }
  } catch {
    lockClient?.release();
    console.error("[telegram-admin] Polling disabled because the database lock could not be acquired.");
    return;
  }
  if (!lockClient) return;
  const client = lockClient;

  let lockHealthy = true;
  client.on("error", () => {
    lockHealthy = false;
  });

  const handleCommand = createAdminTelegramCommandHandler({
    authorizedChatId,
    data: databaseDataSource,
    provider: {
      getBalance: () => getSDK().raw.getBalance(),
      getPaymentStatus: (paymentId) => getSDK().getPaymentStatus(paymentId),
    },
    send,
  });

  const poll = async () => {
    let offset: number | undefined;
    let stoppedByConflict = false;
    try {
      while (lockHealthy) {
        try {
          const updates = await telegramRequest(token, "getUpdates", {
            ...(offset === undefined ? {} : { offset }),
            timeout: 20,
            allowed_updates: ["message"],
          });
          if (!Array.isArray(updates)) throw new TelegramApiError(0);

          for (const update of updates) {
            if (!isRecord(update)) continue;
            const updateId = update.update_id;
            if (typeof updateId === "number" && Number.isSafeInteger(updateId)) {
              offset = updateId + 1;
            }
            const message = update.message as TelegramMessage | undefined;
            if (message && (typeof message.chat?.id === "number" || typeof message.chat?.id === "string")) {
              await handleCommand({
                chatId: message.chat.id,
                text: typeof message.text === "string" ? message.text : "",
              });
            }
          }

          if (!lockHealthy) break;
          await client.query("SELECT 1");
          await sendDailySummary(send);
        } catch (error) {
          if (error instanceof TelegramApiError && error.code === 409) {
            stoppedByConflict = true;
            console.error("[telegram-admin] Polling stopped: Telegram reports another getUpdates consumer for this bot.");
            break;
          }
          if (!lockHealthy) break;
          console.warn("[telegram-admin] Polling request failed; retrying after a short delay.");
          await new Promise((resolve) => setTimeout(resolve, 5_000));
        }
      }
    } finally {
      if (!stoppedByConflict && lockHealthy) {
        try {
          await client.query(
            "SELECT pg_advisory_unlock($1, $2)",
            [POLL_LOCK_KEY_A, POLL_LOCK_KEY_B],
          );
        } catch {
          // PostgreSQL releases a session advisory lock when its connection closes.
        }
      }
      client.release();
    }
  };

  void poll();
  console.info("[telegram-admin] Single production poller started.");
}
