import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseStorage } from "./storage";

test("crédite les commissions de parrainage sur chacun des achats payants", async () => {
  const service = Object.create(DatabaseStorage.prototype) as DatabaseStorage;
  const accounts = new Map<number, any>([
    [10, { id: 10, fullName: "Filleul", referredBy: "L1", totalEarnings: "0" }],
    [20, { id: 20, fullName: "Niveau 1", referredBy: "L2", totalEarnings: "0" }],
    [30, { id: 30, fullName: "Niveau 2", referredBy: "L3", totalEarnings: "0" }],
    [40, { id: 40, fullName: "Niveau 3", referredBy: null, totalEarnings: "0" }],
  ]);
  const codes = new Map([
    ["L1", accounts.get(20)!],
    ["L2", accounts.get(30)!],
    ["L3", accounts.get(40)!],
  ]);
  const commissions: any[] = [];
  const transactions: any[] = [];

  service.getUser = async (id) => accounts.get(id);
  service.getSettings = async () => ({
    level1Commission: "30",
    level2Commission: "3",
    level3Commission: "2",
  });
  service.getUserByReferralCode = async (code) => codes.get(code);
  service.updateUser = async (id, changes) => {
    const account = accounts.get(id);
    if (!account) throw new Error("test account missing");
    Object.assign(account, changes);
    return account;
  };
  service.createReferralCommission = async (commission) => {
    commissions.push(commission);
    return commission as any;
  };
  service.createTransaction = async (transaction) => {
    transactions.push(transaction);
    return transaction as any;
  };

  await service.processReferralCommissions(10, 1_000, 101);
  await service.processReferralCommissions(10, 2_000, 102);

  assert.equal(commissions.length, 6);
  assert.equal(transactions.length, 6);
  assert.deepEqual(
    commissions.map(({ level, amount, productId }) => ({ level, amount, productId })),
    [
      { level: 1, amount: "300.00", productId: 101 },
      { level: 2, amount: "30.00", productId: 101 },
      { level: 3, amount: "20.00", productId: 101 },
      { level: 1, amount: "600.00", productId: 102 },
      { level: 2, amount: "60.00", productId: 102 },
      { level: 3, amount: "40.00", productId: 102 },
    ],
  );
  assert.equal(accounts.get(20)?.totalEarnings, "900.00");
  assert.equal(accounts.get(30)?.totalEarnings, "90.00");
  assert.equal(accounts.get(40)?.totalEarnings, "60.00");
});
