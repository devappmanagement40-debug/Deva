import assert from "node:assert/strict";
import test from "node:test";
import {
  assessNowPaymentsDeposit,
  getConfiguredAppUrlInfo,
  getNowPaymentsCallbackUrl,
  isSupportedNowPaymentsDepositCurrency,
  isNowPaymentsVerificationCode,
  NowPaymentsPayoutError,
  normalizeWithdrawalMode,
  nextWithdrawalStatusFromPayoutIpn,
  shouldReconcileNowPaymentsPayoutError,
} from "./nowpayments";

test("only permits USDT BEP20 for new crypto deposits", () => {
  assert.equal(isSupportedNowPaymentsDepositCurrency("usdtbsc"), true);
  assert.equal(isSupportedNowPaymentsDepositCurrency("USDTBSC"), true);
  assert.equal(isSupportedNowPaymentsDepositCurrency("usdttrc20"), false);
  assert.equal(isSupportedNowPaymentsDepositCurrency("eth"), false);
  assert.equal(isSupportedNowPaymentsDepositCurrency(undefined), false);
});

test("reads the public payment callback URL from APP_URL", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousPublicUrl = process.env.PUBLIC_URL;
  try {
    process.env.APP_URL = '"https://example.com"';
    process.env.PUBLIC_URL = "https://fallback.example.com";
    assert.equal(
      getNowPaymentsCallbackUrl(),
      "https://example.com/api/nowpayments/ipn",
    );
    assert.equal(getConfiguredAppUrlInfo()?.source, "APP_URL");
  } finally {
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
});

test("uses PUBLIC_URL when APP_URL is not valid", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousPublicUrl = process.env.PUBLIC_URL;
  try {
    process.env.APP_URL = "http://invalid.example.com";
    process.env.PUBLIC_URL = "fallback.example.com";
    assert.equal(getConfiguredAppUrlInfo()?.source, "PUBLIC_URL");
    assert.equal(
      getNowPaymentsCallbackUrl(),
      "https://fallback.example.com/api/nowpayments/ipn",
    );
  } finally {
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
});

test("uses the verified public URL when Plesk provides no URL variables", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousPublicUrl = process.env.PUBLIC_URL;
  try {
    delete process.env.APP_URL;
    delete process.env.PUBLIC_URL;
    assert.equal(getConfiguredAppUrlInfo()?.source, "DEFAULT");
    assert.equal(
      getNowPaymentsCallbackUrl(),
      "https://zoksilll.online/api/nowpayments/ipn",
    );
  } finally {
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
});

test("credits only a finished NOWPayments deposit with the quoted asset and amount", () => {
  assert.equal(
    assessNowPaymentsDeposit({
      gatewayStatus: "finished",
      expectedAmount: "12.5",
      expectedCurrency: "usdtbsc",
      actuallyPaid: "12.5",
      payCurrency: "usdtbsc",
    }),
    "credit",
  );
});

test("keeps partial, underpaid, and wrong-asset deposits for review", () => {
  const base = {
    expectedAmount: "12.5",
    expectedCurrency: "usdtbsc",
    actuallyPaid: "12.4",
    payCurrency: "usdtbsc",
  };
  assert.equal(assessNowPaymentsDeposit({ ...base, gatewayStatus: "partially_paid" }), "review");
  assert.equal(assessNowPaymentsDeposit({ ...base, gatewayStatus: "finished" }), "review");
  assert.equal(
    assessNowPaymentsDeposit({ ...base, actuallyPaid: "12.5", payCurrency: "trx", gatewayStatus: "finished" }),
    "review",
  );
});

test("tracks non-final statuses without changing the balance", () => {
  assert.equal(
    assessNowPaymentsDeposit({
      gatewayStatus: "confirming",
      expectedAmount: "12.5",
      expectedCurrency: "usdtbsc",
      actuallyPaid: "12.5",
      payCurrency: "usdtbsc",
    }),
    "tracking",
  );
});

test("maps legacy auto settings to explicit semi-automatic mode", () => {
  assert.equal(normalizeWithdrawalMode("manual"), "manual");
  assert.equal(normalizeWithdrawalMode("auto"), "semi_auto");
  assert.equal(normalizeWithdrawalMode("semi_auto"), "semi_auto");
});

test("requires a six-digit 2FA code before a payout can be verified", () => {
  assert.equal(isNowPaymentsVerificationCode("123456"), true);
  assert.equal(isNowPaymentsVerificationCode("12345"), false);
  assert.equal(isNowPaymentsVerificationCode("12a456"), false);
});

test("does not let an out-of-order payout IPN bypass pending 2FA", () => {
  assert.equal(nextWithdrawalStatusFromPayoutIpn("pending_2fa", "waiting"), "pending_2fa");
  assert.equal(nextWithdrawalStatusFromPayoutIpn("pending_2fa", "processing"), "pending_2fa");
  assert.equal(nextWithdrawalStatusFromPayoutIpn("processing", "finished"), "approved");
  assert.equal(nextWithdrawalStatusFromPayoutIpn("processing", "failed"), "failed");
});

test("keeps terminal payout states absorbing when delayed IPNs arrive", () => {
  assert.equal(nextWithdrawalStatusFromPayoutIpn("approved", "waiting"), "approved");
  assert.equal(nextWithdrawalStatusFromPayoutIpn("approved", "failed"), "approved");
  assert.equal(nextWithdrawalStatusFromPayoutIpn("failed", "finished"), "failed");
});

test("moves ambiguous payout request failures to reconciliation instead of retrying", () => {
  assert.equal(
    shouldReconcileNowPaymentsPayoutError(
      new NowPaymentsPayoutError("timeout", true),
    ),
    true,
  );
  assert.equal(
    shouldReconcileNowPaymentsPayoutError(
      new NowPaymentsPayoutError("invalid verification code", false),
    ),
    false,
  );
});