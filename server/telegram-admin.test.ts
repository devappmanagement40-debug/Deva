import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminTelegramCommandHandler,
  escapeTelegramHtml,
  formatAdminTelegramNotification,
  parseNowPaymentsBalance,
  type AdminTelegramDataSource,
  type AdminTelegramProvider,
} from "./telegram-admin";

function makeDataSource(
  overrides: Partial<AdminTelegramDataSource> = {},
  activeAdmin = true,
) {
  const calls = {
    hasActiveSiteAdmin: 0,
    getStats: 0,
    getBalanceSummary: 0,
    getPendingOperations: 0,
    findNowPaymentsDeposit: 0,
  };
  const data: AdminTelegramDataSource = {
    async hasActiveSiteAdmin() {
      calls.hasActiveSiteAdmin += 1;
      return activeAdmin;
    },
    async getStats() {
      calls.getStats += 1;
      return {
        totalUsers: 18,
        todayUsers: 2,
        totalDeposits: 25_000,
        todayDeposits: 5_000,
        totalWithdrawals: 8_000,
        todayWithdrawals: 1_000,
        usersWithProducts: 7,
        totalActiveProducts: 9,
        totalCommissions: 1_250,
      };
    },
    async getBalanceSummary() {
      calls.getBalanceSummary += 1;
      return {
        depositBalance: "10000",
        earningsBalance: "3500",
        pendingDepositCount: 2,
        pendingDepositAmount: "5000",
        pendingWithdrawalCount: 1,
        pendingWithdrawalGross: "1200",
        pendingWithdrawalNet: "1056",
        pendingWithdrawalFees: "144",
      };
    },
    async getPendingOperations() {
      calls.getPendingOperations += 1;
      return {
        deposits: Array.from({ length: 12 }, (_, index) => ({
          id: index + 1,
          amount: 2500,
          country: "CI",
          paymentMethod: "Wave",
          status: "pending",
          createdAt: "2026-10-06T08:00:00.000Z",
        })),
        withdrawals: Array.from({ length: 12 }, (_, index) => ({
          id: index + 1,
          amount: 1200,
          netAmount: 1056,
          fees: 144,
          country: "CI",
          paymentMethod: "Mobile Money",
          status: "pending",
          createdAt: "2026-10-06T08:00:00.000Z",
        })),
      };
    },
    async findNowPaymentsDeposit() {
      calls.findNowPaymentsDeposit += 1;
      return {
        id: 41,
        amount: 2500,
        status: "approved",
        nowPaymentsStatus: "FINISHED",
        nowPaymentsExpectedAmount: "3.20000000",
        nowPaymentsExpectedCurrency: "USDT",
      };
    },
    ...overrides,
  };
  return { data, calls };
}

function makeHarness(options: {
  authorizedChatId?: string;
  activeAdmin?: boolean;
  provider?: AdminTelegramProvider;
  dataOverrides?: Partial<AdminTelegramDataSource>;
} = {}) {
  const sent: string[] = [];
  const { data, calls } = makeDataSource(
    options.dataOverrides,
    options.activeAdmin !== false,
  );
  const handler = createAdminTelegramCommandHandler({
    authorizedChatId: options.authorizedChatId || "123456",
    data,
    provider: options.provider,
    async send(message) {
      sent.push(message);
    },
  });
  return { handler, sent, calls };
}

test("ignore les messages provenant d’un autre chat avant toute lecture en base", async () => {
  const { handler, sent, calls } = makeHarness();
  await handler({ chatId: "999999", text: "/stats" });
  assert.deepEqual(sent, []);
  assert.equal(calls.hasActiveSiteAdmin, 0);
  assert.equal(calls.getStats, 0);
});

test("/start et /help affichent l’aide, y compris avec le suffixe du bot", async () => {
  const { handler, sent } = makeHarness();
  await handler({ chatId: "123456", text: "/start" });
  await handler({ chatId: "123456", text: "/help@DiamantAdminBot" });
  assert.equal(sent.length, 2);
  assert.match(sent[0], /\/stats/);
  assert.match(sent[0], /\/nowpayments_solde/);
  assert.match(sent[1], /CloudPay\/Galaxy n’est pas configuré/);
});

test("suspend les commandes de données si aucun administrateur actif n’existe", async () => {
  const { handler, sent, calls } = makeHarness({ activeAdmin: false });
  await handler({ chatId: "123456", text: "/solde" });
  assert.equal(calls.hasActiveSiteAdmin, 1);
  assert.equal(calls.getBalanceSummary, 0);
  assert.match(sent[0], /aucun compte administrateur actif/);
});

test("/stats, /solde et /pending utilisent les données du site", async () => {
  const { handler, sent, calls } = makeHarness();
  await handler({ chatId: "123456", text: "/stats" });
  await handler({ chatId: "123456", text: "/solde" });
  await handler({ chatId: "123456", text: "/pending" });

  assert.match(sent[0], /Utilisateurs : <b>18<\/b>/);
  assert.match(sent[0], /Dépôts approuvés/);
  assert.match(sent[1], /Solde des revenus/);
  assert.match(sent[1], /net à payer/);
  const [depositSection, withdrawalSection = ""] = sent[2].split("<b>Retraits</b>");
  assert.equal((depositSection.match(/#[0-9]+ ·/g) || []).length, 10);
  assert.equal((withdrawalSection.match(/#[0-9]+ ·/g) || []).length, 10);
  assert.equal(calls.getPendingOperations, 1);
});

test("le solde NOWPayments n’affiche que la réponse documentée et refuse une forme inconnue", async () => {
  const good = makeHarness({
    provider: {
      async getBalance() {
        return { result: [{ currency: "USDT", amount: "12.75" }] };
      },
      async getPaymentStatus() {
        throw new Error("Not expected");
      },
    },
  });
  await good.handler({ chatId: "123456", text: "/nowpayments_solde" });
  assert.match(good.sent[0], /usdt : <b>12,75<\/b>/);
  assert.match(good.sent[0], /ne fournit pas ici de total d’opérations en attente/);

  const malformed = makeHarness({
    provider: {
      async getBalance() {
        return { result: "unknown response shape" };
      },
      async getPaymentStatus() {
        throw new Error("Not expected");
      },
    },
  });
  await malformed.handler({ chatId: "123456", text: "/nowpayments_solde" });
  assert.match(malformed.sent[0], /aucun montant n’est affiché/);
});

test("la balance parser refuse les valeurs négatives, doublons et réponses non documentées", () => {
  assert.deepEqual(parseNowPaymentsBalance({ result: [{ currency: "usdt", amount: "1.25" }] }), [
    { currency: "usdt", amount: 1.25 },
  ]);
  assert.equal(parseNowPaymentsBalance({ available: "3.00" }), undefined);
  assert.equal(
    parseNowPaymentsBalance({ result: [{ currency: "usdt", amount: 1 }, { currency: "USDT", amount: 2 }] }),
    undefined,
  );
  assert.equal(parseNowPaymentsBalance({ result: [{ currency: "usdt", amount: -1 }] }), undefined);
});

test("/nowpayments compare le statut, le montant et la devise sans opération d’écriture", async () => {
  const providerCalls: string[] = [];
  const { handler, sent, calls } = makeHarness({
    provider: {
      async getBalance() {
        throw new Error("Not expected");
      },
      async getPaymentStatus(paymentId) {
        providerCalls.push(paymentId);
        return {
          payment_id: paymentId,
          payment_status: "finished",
          pay_amount: "3.2",
          pay_currency: "usdt",
        };
      },
    },
  });

  await handler({ chatId: "123456", text: "/nowpayments NP-1001" });
  assert.deepEqual(providerCalls, ["NP-1001"]);
  assert.equal(calls.findNowPaymentsDeposit, 1);
  assert.match(sent[0], /Comparaison statut\/montant\/devise : <b>concordante<\/b>/);
  assert.doesNotMatch(sent[0], /NP-1001/);
});

test("refuse d’afficher les détails d’un paiement si l’identité retournée ne correspond pas", async () => {
  const { handler, sent, calls } = makeHarness({
    provider: {
      async getBalance() {
        throw new Error("Not expected");
      },
      async getPaymentStatus() {
        return { payment_id: "another-payment", payment_status: "finished", pay_amount: "3.2" };
      },
    },
  });
  await handler({ chatId: "123456", text: "/nowpayments NP-1001" });
  assert.equal(calls.findNowPaymentsDeposit, 0);
  assert.match(sent[0], /n’a pas confirmé l’identité/);
  assert.doesNotMatch(sent[0], /3,2/);
});

test("échappe le HTML dans les notifications Telegram dynamiques", () => {
  assert.equal(escapeTelegramHtml(`<x a="b">&'`), "&lt;x a=&quot;b&quot;&gt;&amp;&#39;");
  const message = formatAdminTelegramNotification({
    kind: "purchase",
    userId: 12,
    country: "CI",
    productName: "<VIP & 1>",
    amount: 5000,
  });
  assert.match(message, /&lt;VIP &amp; 1&gt;/);
  assert.doesNotMatch(message, /<VIP/);
});
