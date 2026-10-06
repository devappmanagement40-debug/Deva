import { 
  users, products, userProducts, deposits, shareReports, withdrawalProofs, withdrawals, withdrawalWallets,
  paymentChannels, paymentNumbers, depositChannels, stakingProducts, userStakings, referralCommissions, tasks, userTasks, transactions, platformSettings, adminAuditLog,
  giftCodes, giftCodeClaims, countries, supportChatMessages, spinWheelRequests,
  referralCodeAliases,
  type User, type Product, type UserProduct, type Deposit, type ShareReport, type WithdrawalProof, type WithdrawalProofStatus, type Withdrawal, type WithdrawalWallet,
  type PaymentChannel, type PaymentNumber, type DepositChannel, type StakingProduct, type UserStaking, type ReferralCommission, type Task, type UserTask, type Transaction, type PlatformSetting,
  type GiftCode, type GiftCodeClaim, type Country, type SupportChatMessage, type SupportChatSenderRole,
  type SupportChatAttachmentType, type SupportChatConversation
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, asc, desc, sql, gte, lt, lte, or, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { DAILY_BONUS_COOLDOWN_MS, getDailyBonusHoursRemaining } from "./daily-bonus-policy";
import {
  canClaimTask,
  countEligibleDirectReferrals,
  formatTaskRewardAmount,
} from "./task-rewards-policy";
import type { AdminTaskCreateInput, AdminTaskUpdateInput } from "@shared/task-validation";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "./referral-codes";
import {
  parseSpinWheelSegments,
  SPIN_WHEEL_SETTING_KEY,
  type SpinWheelSegment,
} from "@shared/spin-wheel";
import { DEFAULT_REFERRAL_COMMISSION_RATES } from "@shared/referral-commission-settings";
import { pickWinningSpinWheelSegment } from "./spin-wheel-security";
import {
  canPurchaseProductType,
  normalizeProductType,
  ownsActiveStabilityProduct,
} from "@shared/product-categories";
import { calculateVipProgress, isVipLevelUnlocked } from "@shared/vip-progress";

export class TaskHasClaimsError extends Error {
  constructor() {
    super("Cette récompense a déjà été réclamée et doit être désactivée plutôt que supprimée.");
    this.name = "TaskHasClaimsError";
  }
}

export type TaskWithStatus = Task & {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
  claimedName: string | null;
  claimedDescription: string | null;
  claimedRequiredInvites: number | null;
  claimedReward: number | null;
};

// Compares phone numbers regardless of local vs international MSISDN format
// (e.g. "0150839909" vs "+22990150839909") by matching on the last 8 digits.
function normalizePhoneSuffix(phone: string | null | undefined): string {
  return (phone || "").replace(/\D/g, "").slice(-8);
}

function finiteAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

const MAX_WHEEL_PURCHASE_SPINS = 10_000;

function parseWheelPurchaseSpins(value: string | null, fallback: number): number {
  if (value === null || value.trim() === "") return fallback;

  const spins = Number(value);
  if (!Number.isSafeInteger(spins) || spins < 0 || spins > MAX_WHEEL_PURCHASE_SPINS) {
    throw new Error("La configuration des tours de la roue doit être un entier entre 0 et 10 000");
  }
  return spins;
}

type ShareReportUser = Pick<User, "id" | "fullName" | "phone" | "country">;
type WithdrawalProofUser = Pick<User, "id" | "fullName" | "phone" | "country">;
type SpinWheelRequestRow = {
  segment_id: number;
  amount: string;
  label: string;
  spin_tokens_after: number;
  segments_snapshot: SpinWheelSegment[];
};

export interface SpinWheelResult {
  segmentId: number;
  amount: number;
  label: string;
  spinTokens: number;
  segments: SpinWheelSegment[];
}

export type SpinWheelExecutionResult =
  | { status: "completed"; result: SpinWheelResult }
  | { status: "replayed"; result: SpinWheelResult }
  | { status: "user_missing" }
  | { status: "no_tokens" }
  | { status: "no_winnable_segments" };

export type DailyBonusClaimResult =
  | { status: "claimed"; amount: number }
  | { status: "cooldown"; hoursRemaining: number }
  | { status: "user_missing" };

export type WithdrawalRequestCreationResult =
  | { status: "created"; withdrawal: Withdrawal }
  | { status: "user_missing" }
  | { status: "withdrawal_blocked" }
  | { status: "insufficient_balance" }
  | { status: "daily_limit"; limit: number };

function spinWheelResultFromRow(row: SpinWheelRequestRow): SpinWheelResult {
  return {
    segmentId: Number(row.segment_id),
    amount: Number(row.amount),
    label: row.label,
    spinTokens: Number(row.spin_tokens_after),
    segments: row.segments_snapshot,
  };
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string, country: string): Promise<User | undefined>;
  getSuperAdminByPhone(phone: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  migrateLegacyTransactionPasswords(): Promise<number>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(filter?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: Partial<Product>): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<{ archived: boolean }>;
  
  // User Products
  getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]>;
  getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]>;
  purchaseProduct(userId: number, productId: number, assignedByAdmin?: boolean): Promise<UserProduct>;
  updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct>;
  revokeUserProduct(userId: number, userProductId: number): Promise<boolean>;
  processEarnings(): Promise<void>;
  
  // Deposits
  createDeposit(data: Partial<Deposit>): Promise<Deposit>;
  getDeposit(id: number): Promise<Deposit | undefined>;
  getDeposits(status?: string): Promise<(Deposit & { user: User })[]>;
  getUserDeposits(userId: number): Promise<Deposit[]>;
  updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit>;
  getDepositByReference(reference: string): Promise<Deposit | undefined>;
  approveManualDepositExactlyOnce(id: number, processedBy: number): Promise<{ deposit?: Deposit; credited: boolean }>;
  approveNowPaymentsDeposit(reference: string): Promise<{ deposit?: Deposit; credited: boolean }>;
  processNowPaymentsDeposit(input: {
    reference: string;
    action: "tracking" | "review" | "credit";
    gatewayStatus?: string | null;
    actuallyPaid?: string | null;
    payCurrency?: string | null;
    outcomeAmount?: string | null;
    outcomeCurrency?: string | null;
    error?: string | null;
  }): Promise<{ deposit?: Deposit; credited: boolean }>;
  cleanupDepositScreenshots(): Promise<void>;
  createShareReport(data: Partial<ShareReport>): Promise<ShareReport>;
  getShareReports(status?: string): Promise<(ShareReport & { user: ShareReportUser })[]>;
  updateShareReport(id: number, data: Partial<ShareReport>): Promise<ShareReport>;
  createWithdrawalProof(data: {
    userId: number;
    proofImage: string;
    proofImage2?: string | null;
    message: string;
  }): Promise<WithdrawalProof>;
  getWithdrawalProofs(status?: WithdrawalProofStatus | "all", limit?: number): Promise<(WithdrawalProof & { user: WithdrawalProofUser })[]>;
  getWithdrawalProof(id: number): Promise<(WithdrawalProof & { user: WithdrawalProofUser }) | undefined>;
  approvePendingWithdrawalProof(
    id: number,
    data: { shareBonusXof: number; processedAt: Date; processedBy: number },
  ): Promise<WithdrawalProof | undefined>;
  reviewPendingWithdrawalProof(
    id: number,
    data: Pick<WithdrawalProof, "status" | "shareBonusXof" | "processedAt" | "processedBy">,
  ): Promise<WithdrawalProof | undefined>;

  // Internal customer support chat
  getSupportChatMessages(userId: number): Promise<SupportChatMessage[]>;
  createSupportChatMessage(data: {
    userId: number;
    senderId: number;
    senderRole: SupportChatSenderRole;
    message: string;
    attachmentUrl?: string | null;
    attachmentType?: SupportChatAttachmentType | null;
    attachmentName?: string | null;
  }): Promise<SupportChatMessage>;
  updateOwnAdminSupportChatMessage(
    userId: number,
    messageId: number,
    adminId: number,
    message: string,
  ): Promise<SupportChatMessage | undefined>;
  markSupportChatMessagesRead(userId: number, readerRole: SupportChatSenderRole): Promise<void>;
  getSupportChatConversations(): Promise<SupportChatConversation[]>;
  getSupportChatAttachmentUserId(attachmentUrl: string): Promise<number | undefined>;
  
  // Withdrawals
  createWithdrawalRequest(
    data: Partial<Withdrawal>,
    maxPerDay: number,
  ): Promise<WithdrawalRequestCreationResult>;
  getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal>;
  claimWithdrawalForNowPayments(
    id: number,
    processedBy: number,
    externalId: string,
  ): Promise<Withdrawal | undefined>;
  completeNowPaymentsWithdrawal(
    id: number,
    data: Pick<Partial<Withdrawal>, "nowPaymentsStatus" | "nowPaymentsHash" | "nowPaymentsError">,
  ): Promise<Withdrawal | undefined>;
  trackNowPaymentsWithdrawal(
    id: number,
    status: "pending_2fa" | "processing",
    data: Pick<Partial<Withdrawal>, "nowPaymentsStatus" | "nowPaymentsHash" | "nowPaymentsError">,
  ): Promise<Withdrawal | undefined>;
  verifyNowPaymentsWithdrawal(
    id: number,
    processedBy: number,
  ): Promise<Withdrawal | undefined>;
  markNowPaymentsVerificationForReconciliation(
    id: number,
    reason: string,
  ): Promise<Withdrawal | undefined>;
  getWithdrawalByNowPaymentsPayoutId(payoutId: string): Promise<Withdrawal | undefined>;
  getWithdrawalByNowPaymentsBatchId(batchId: string): Promise<Withdrawal | undefined>;
  refundWithdrawal(id: number, status: "rejected" | "failed", reason: string): Promise<Withdrawal | undefined>;
  getUserWithdrawalCountToday(userId: number): Promise<number>;
  
  // Wallets
  getWallets(userId: number): Promise<WithdrawalWallet[]>;
  createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet>;
  deleteWallet(userId: number, id: number): Promise<boolean>;
  setDefaultWallet(userId: number, walletId: number): Promise<boolean>;
  getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined>;
  
  // Payment Channels
  getPaymentChannels(): Promise<PaymentChannel[]>;
  getActivePaymentChannels(): Promise<PaymentChannel[]>;
  getPaymentChannel(id: number): Promise<PaymentChannel | undefined>;
  createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  deletePaymentChannel(id: number): Promise<void>;
  
  // Referrals
  getReferrals(userId: number, level: number): Promise<User[]>;
  createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission>;
  getUserCommissions(userId: number): Promise<number>;
  getTeamStats(userId: number, date?: string): Promise<{ level1Count: number; level2Count: number; level3Count: number; level1ValidCount: number; level2ValidCount: number; level3ValidCount: number; totalCommission: number; level1Commission: number; level2Commission: number; level3Commission: number; level1Invested: number; level2Invested: number; level3Invested: number; level1Recharged: number; teamTotalDeposits: number; teamTotalWithdrawals: number }>;
  getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getAllTasksAdmin(): Promise<Task[]>;
  getTasksWithStatus(userId: number): Promise<TaskWithStatus[]>;
  claimTask(userId: number, taskId: number): Promise<number>;
  createTask(data: AdminTaskCreateInput): Promise<Task>;
  updateTask(id: number, data: AdminTaskUpdateInput): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Transactions
  createTransaction(data: Partial<Transaction>): Promise<Transaction>;
  claimDailyBonus(userId: number, amount: number): Promise<DailyBonusClaimResult>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getUserTransactionsByType(userId: number, type: string): Promise<Transaction[]>;
  getDailyBonusTransactions(userId: number): Promise<Pick<Transaction, "amount" | "createdAt">[]>;
  executeSpinWheel(userId: number, requestKey: string): Promise<SpinWheelExecutionResult>;
  getUserIncomeSummary(userId: number): Promise<{ productEarnings: number; teamEarnings: number }>;
  
  // Settings
  getSetting(key: string): Promise<string | null>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string, modifiedBy?: number): Promise<void>;
  processEarningsForUser(userId: number): Promise<void>;

  // Admin
  getStats(): Promise<any>;
  logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void>;
  resetStats(): Promise<void>;
  
  // Gift Codes
  getAllGiftCodes(): Promise<GiftCode[]>;
  getGiftCodeByCode(code: string): Promise<GiftCode | undefined>;
  createGiftCode(data: {
    code: string;
    amount: string;
    amountMin?: string | null;
    amountMax?: string | null;
    maxUses: number;
    expiresAt: Date;
    createdBy: number;
  }): Promise<GiftCode>;
  deleteGiftCode(id: number): Promise<void>;
  hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean>;
  claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void>;

  // Countries
  getCountries(): Promise<Country[]>;
  getActiveCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(data: Partial<Country>): Promise<Country>;
  updateCountry(id: number, data: Partial<Country>): Promise<Country>;
  deleteCountry(id: number): Promise<void>;

  // Deposit Channels
  getDepositChannels(): Promise<DepositChannel[]>;
  getDepositChannelsByCountry(country: string): Promise<DepositChannel[]>;
  getDepositChannel(id: number): Promise<DepositChannel | undefined>;
  createDepositChannel(data: Partial<DepositChannel>): Promise<DepositChannel>;
  updateDepositChannel(id: number, data: Partial<DepositChannel>): Promise<DepositChannel>;
  deleteDepositChannel(id: number): Promise<void>;

  // Payment Numbers
  getPaymentNumbers(): Promise<PaymentNumber[]>;
  getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]>;
  getPaymentNumbersByChannel(channelId: number): Promise<PaymentNumber[]>;
  createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  deletePaymentNumber(id: number): Promise<void>;

  // Staking
  getStakingProducts(): Promise<StakingProduct[]>;
  getActiveStakingProducts(): Promise<StakingProduct[]>;
  getStakingProduct(id: number): Promise<StakingProduct | undefined>;
  createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct>;
  updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct>;
  deleteStakingProduct(id: number): Promise<void>;
  purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking>;
  getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]>;
  getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]>;
  releaseMaturedStakings(): Promise<void>;

  getAllProductsAdmin(): Promise<Product[]>;
  getProductInviteCount(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  private settingsCache: {
    value: Record<string, string>;
    expiresAt: number;
  } | null = null;
  private settingsLoad: Promise<Record<string, string>> | null = null;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string, country: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.phone, phone), eq(users.country, country)));
    return user || undefined;
  }

  async getSuperAdminByPhone(phone: string): Promise<User | undefined> {
    const phoneSuffix = normalizePhoneSuffix(phone);
    if (!phoneSuffix) return undefined;

    const superAdmins = await db.select().from(users).where(eq(users.isSuperAdmin, true));
    return superAdmins.find((user) => normalizePhoneSuffix(user.phone) === phoneSuffix);
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const normalizedCode = code.trim().toUpperCase();
    const [user] = await db.select().from(users).where(
      sql`UPPER(${users.referralCode}) = ${normalizedCode}`
    );
    if (user) return user;

    const [alias] = await db.select().from(referralCodeAliases).where(
      sql`UPPER(${referralCodeAliases.aliasCode}) = ${normalizedCode}`
    );
    if (!alias) return undefined;

    return this.getUser(alias.userId);
  }

  async createUser(data: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password!, 10);

    return db.transaction(async (tx) => {
      if (!data.country) {
        const error = new Error("Le pays du compte est requis.");
        error.name = "CountryNotAvailableError";
        throw error;
      }

      const [country] = await tx.select({
        code: countries.code,
        isActive: countries.isActive,
      })
        .from(countries)
        .where(eq(countries.code, data.country))
        .for("share");
      if (!country || !country.isActive) {
        const error = new Error("Ce pays n’est pas actif pour les inscriptions.");
        error.name = "CountryNotAvailableError";
        throw error;
      }

      let referralCode = "";
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateReferralCode();
        const [existingUser] = await tx.select({ id: users.id })
          .from(users)
          .where(eq(users.referralCode, candidate));
        if (!existingUser) {
          referralCode = candidate;
          break;
        }
      }
      if (!referralCode) {
        throw new Error("Impossible de générer un code de parrainage unique");
      }

      const [user] = await tx.insert(users).values({
        ...data,
        password: hashedPassword,
        referralCode,
        balance: "0",
        totalEarnings: "0",
      } as any).returning();

      return user;
    });
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async migrateLegacyTransactionPasswords(): Promise<number> {
    const usersWithTransactionPasswords = await db.select({
      id: users.id,
      transactionPassword: users.transactionPassword,
    }).from(users).where(isNotNull(users.transactionPassword));

    let migratedCount = 0;
    for (const user of usersWithTransactionPasswords) {
      const value = user.transactionPassword;
      if (!value || /^\$2[aby]\$\d{2}\$/.test(value)) continue;

      await db.update(users)
        .set({ transactionPassword: await bcrypt.hash(value, 10) })
        .where(eq(users.id, user.id));
      migratedCount += 1;
    }
    return migratedCount;
  }

  async deleteUser(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Gift codes created by this user (createdBy is NOT NULL FK) must be
      // removed along with their claims before the user row can go.
      const createdCodes = await tx.select({ id: giftCodes.id }).from(giftCodes).where(eq(giftCodes.createdBy, id));
      for (const code of createdCodes) {
        await tx.delete(giftCodeClaims).where(eq(giftCodeClaims.giftCodeId, code.id));
      }
      await tx.delete(giftCodes).where(eq(giftCodes.createdBy, id));

      await tx.delete(giftCodeClaims).where(eq(giftCodeClaims.userId, id));
      await tx.delete(userTasks).where(eq(userTasks.userId, id));
      await tx.delete(referralCommissions).where(or(eq(referralCommissions.userId, id), eq(referralCommissions.fromUserId, id)));
      await tx.delete(userStakings).where(eq(userStakings.userId, id));
      await tx.delete(withdrawals).where(eq(withdrawals.userId, id));
      await tx.delete(deposits).where(eq(deposits.userId, id));
      await tx.delete(shareReports).where(eq(shareReports.userId, id));
      await tx.delete(userProducts).where(eq(userProducts.userId, id));
      await tx.delete(withdrawalWallets).where(eq(withdrawalWallets.userId, id));
      await tx.delete(transactions).where(eq(transactions.userId, id));
      // Admin action history performed BY this user (adminId is a NOT NULL FK).
      // Actions performed ON this user (targetUserId, not a FK) are left intact.
      await tx.delete(adminAuditLog).where(eq(adminAuditLog.adminId, id));

      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async getAllUsers(filter?: string, limit: number = 50, offset: number = 0): Promise<{ users: User[], total: number }> {
    let conditions: any[] = [];
    
    if (filter && filter.trim()) {
      const searchTerm = `%${filter.trim().toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${users.phone}) LIKE ${searchTerm}`,
          sql`LOWER(${users.fullName}) LIKE ${searchTerm}`,
          sql`LOWER(${users.referralCode}) LIKE ${searchTerm}`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    
    const userList = await db.select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { users: userList, total: Number(countResult.count) };
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(products.sortOrder);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const [product] = await db.insert(products).values(data as any).returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<{ archived: boolean }> {
    const [existingProduct] = await db.select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!existingProduct) throw new Error("Produit introuvable");

    const [existingPurchase] = await db.select({ id: userProducts.id })
      .from(userProducts)
      .where(eq(userProducts.productId, id))
      .limit(1);

    if (existingPurchase) {
      // Keep the product row for its foreign-key relationship; user purchases
      // use their own snapshot and remain available in the history.
      await db.update(products)
        .set({ isActive: false })
        .where(eq(products.id, id));
      return { archived: true };
    }

    await db.delete(products).where(eq(products.id, id));
    return { archived: false };
  }

  // User Products
  async getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    
    return result.map(r => {
      const snapshot = r.userProduct.productSnapshot ?? r.product;
      return {
        ...r.userProduct,
        product: {
          ...snapshot,
          imageUrl: snapshot.imageUrl || r.product.imageUrl,
          // Card color is presentation-only, so follow the current catalog
          // setting without changing any purchase-time terms in the snapshot.
          cardColor: r.product.cardColor,
        },
      };
    });
  }

  async getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(eq(userProducts.userId, userId));
    
    const purchasesWithSnapshots = result.map(r => {
      const snapshot = r.userProduct.productSnapshot ?? r.product;
      return {
        ...r,
        product: {
          ...snapshot,
          imageUrl: snapshot.imageUrl || r.product.imageUrl,
          cardColor: r.product.cardColor,
        },
      };
    });

    return purchasesWithSnapshots.sort((a, b) => {
      const dateA = a.userProduct.purchaseDate ? new Date(a.userProduct.purchaseDate).getTime() : 0;
      const dateB = b.userProduct.purchaseDate ? new Date(b.userProduct.purchaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  async purchaseProduct(userId: number, productId: number, assignedByAdmin = false): Promise<UserProduct> {
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Produit non trouvé");

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    const isPaidUserPurchase = !product.isFree && !assignedByAdmin;
    let purchaseHistory: { userProduct: UserProduct; product: Product }[] | null = null;
    if (!product.isFree && !assignedByAdmin && !canPurchaseProductType(product.productType, false)) {
      purchaseHistory = await this.getAllUserProducts(userId);
      const hasActiveStabilityProduct = ownsActiveStabilityProduct(purchaseHistory.map(({ userProduct, product: holdingProduct }) => ({
        isActive: userProduct.isActive,
        daysRemaining: userProduct.daysRemaining,
        productType: holdingProduct.productType,
      })));
      if (!canPurchaseProductType(product.productType, hasActiveStabilityProduct)) {
        throw new Error("Vous devez posséder un produit Explore actif avant d'acheter des produits Parcours ou Offres.");
      }
    }

    if (isPaidUserPurchase && normalizeProductType(product.productType) === "wellness") {
      purchaseHistory ??= await this.getAllUserProducts(userId);
      const settings = await this.getSettings();
      const currentVipLevel = calculateVipProgress(purchaseHistory, settings).level;
      if (!isVipLevelUnlocked(currentVipLevel, product.requiredVipLevel)) {
        throw new Error(`Vous devez atteindre le niveau VIP ${product.requiredVipLevel} pour acheter ce produit Parcours.`);
      }
    }

    let buyerSpinReward = 0;
    let referralSpinReward = 0;
    if (isPaidUserPurchase) {
      const [buyerRewardSetting, referralRewardSetting] = await Promise.all([
        this.getSetting("spinWheelSelfPurchaseSpins"),
        this.getSetting("spinWheelReferralPurchaseSpins"),
      ]);
      buyerSpinReward = parseWheelPurchaseSpins(buyerRewardSetting, 3);
      referralSpinReward = parseWheelPurchaseSpins(referralRewardSetting, 2);
    }

    if (!product.isFree && !assignedByAdmin) {
      const parsedDepositBalance = Number.parseFloat(user.balance || "0");
      const parsedEarningsBalance = Number.parseFloat(user.totalEarnings || "0");
      const depositBalance = Number.isFinite(parsedDepositBalance) ? Math.max(0, parsedDepositBalance) : 0;
      const earningsBalance = Number.isFinite(parsedEarningsBalance) ? Math.max(0, parsedEarningsBalance) : 0;
      const productPrice = Number.parseFloat(product.price as string);
      const availableBalance = depositBalance + earningsBalance;
      if (!Number.isFinite(productPrice) || availableBalance < productPrice) {
        throw new Error("Solde insuffisant");
      }

      // Product purchases use the deposit balance first, then the earnings
      // balance for any remaining amount.
      const depositDebit = Math.min(depositBalance, productPrice);
      const earningsDebit = productPrice - depositDebit;
      
      await this.updateUser(userId, { 
        balance: (depositBalance - depositDebit).toFixed(2),
        totalEarnings: (earningsBalance - earningsDebit).toFixed(2),
        hasActiveProduct: true,
      });

      await this.createTransaction({
        userId,
        type: "purchase",
        amount: (-productPrice).toString(),
        description: `Achat ${product.name}`,
      });

      // Pay configured referral commissions on every paid purchase.
      if (isPaidUserPurchase) {
        await this.processReferralCommissions(userId, productPrice, productId);
      }

      // Add spin rewards atomically so concurrent paid purchases cannot overwrite each other.
      if (buyerSpinReward > 0) {
        await db.update(users)
          .set({ spinTokens: sql`COALESCE(${users.spinTokens}, 0) + ${buyerSpinReward}` })
          .where(eq(users.id, userId));
      }

      // Reward the level-1 sponsor for every paid purchase made by their referral.
      if (user.referredBy && referralSpinReward > 0) {
        const sponsor = await this.getUserByReferralCode(user.referredBy);
        if (sponsor) {
          await db.update(users)
            .set({ spinTokens: sql`COALESCE(${users.spinTokens}, 0) + ${referralSpinReward}` })
            .where(eq(users.id, sponsor.id));
        }
      }
    } else {
      await this.updateUser(userId, { hasActiveProduct: true });
    }

    // The full cycle runs before any product gains are credited.
    const [userProduct] = await db.insert(userProducts).values({
      userId,
      productId,
      productSnapshot: product,
      daysRemaining: product.cycleDays,
      assignedByAdmin,
      lastEarningDate: new Date(),
      totalEarned: "0",
      pendingEarnings: "0",
      earningsPaidAt: null,
      isActive: product.cycleDays > 0,
    }).returning();

    return userProduct;
  }

  async updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct> {
    const [updated] = await db.update(userProducts)
      .set(data as any)
      .where(eq(userProducts.id, id))
      .returning();
    return updated;
  }

  async revokeUserProduct(userId: number, userProductId: number): Promise<boolean> {
    // Credit any full 24-hour periods already elapsed before stopping the cycle.
    await this.processEarningsForUser(userId);

    return db.transaction(async (tx) => {
      const [purchase] = await tx.select()
        .from(userProducts)
        .where(and(
          eq(userProducts.id, userProductId),
          eq(userProducts.userId, userId),
        ))
        .for("update");

      if (!purchase) throw new Error("Achat introuvable pour cet utilisateur");
      if (!purchase.isActive) return false;

      await tx.update(userProducts)
        .set({ isActive: false })
        .where(eq(userProducts.id, userProductId));

      const [otherActiveProduct] = await tx.select({ id: userProducts.id })
        .from(userProducts)
        .where(and(
          eq(userProducts.userId, userId),
          eq(userProducts.isActive, true),
        ))
        .limit(1);

      await tx.update(users)
        .set({ hasActiveProduct: Boolean(otherActiveProduct) })
        .where(eq(users.id, userId));

      return true;
    });
  }

  async processReferralCommissions(userId: number, amount: number, productId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const getRate = (value: string | undefined, fallback: string) => {
      const parsed = value?.trim() ? Number(value) : Number.NaN;
      return (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
        ? parsed
        : Number(fallback)) / 100;
    };
    const level1Rate = getRate(settings.level1Commission, DEFAULT_REFERRAL_COMMISSION_RATES.level1Commission);
    const level2Rate = getRate(settings.level2Commission, DEFAULT_REFERRAL_COMMISSION_RATES.level2Commission);
    const level3Rate = getRate(settings.level3Commission, DEFAULT_REFERRAL_COMMISSION_RATES.level3Commission);

    // Level 1
    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission = amount * level1Rate;
      await this.updateUser(level1User.id, {
        totalEarnings: (parseFloat(level1User.totalEarnings) + commission).toFixed(2),
      });
      await this.createReferralCommission({
        userId: level1User.id,
        fromUserId: userId,
        level: 1,
        amount: commission.toFixed(2),
        productId,
      });
      await this.createTransaction({
        userId: level1User.id,
        type: "commission",
        amount: commission.toFixed(2),
        description: `Commission niveau 1 de ${user.fullName}`,
      });

      // Level 2
      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const commission2 = amount * level2Rate;
          await this.updateUser(level2User.id, {
            totalEarnings: (parseFloat(level2User.totalEarnings) + commission2).toFixed(2),
          });
          await this.createReferralCommission({
            userId: level2User.id,
            fromUserId: userId,
            level: 2,
            amount: commission2.toFixed(2),
            productId,
          });
          await this.createTransaction({
            userId: level2User.id,
            type: "commission",
            amount: commission2.toFixed(2),
            description: `Commission niveau 2`,
          });

          // Level 3
          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const commission3 = amount * level3Rate;
              await this.updateUser(level3User.id, {
                totalEarnings: (parseFloat(level3User.totalEarnings) + commission3).toFixed(2),
              });
              await this.createReferralCommission({
                userId: level3User.id,
                fromUserId: userId,
                level: 3,
                amount: commission3.toFixed(2),
                productId,
              });
              await this.createTransaction({
                userId: level3User.id,
                type: "commission",
                amount: commission3.toFixed(2),
                description: `Commission niveau 3`,
              });
            }
          }
        }
      }
    }
  }

  private async accrueProductEarnings(
    productRows: Array<{ userProduct: UserProduct; product: Product }>,
  ): Promise<void> {
    const dayInMilliseconds = 24 * 60 * 60 * 1000;

    for (const { userProduct } of productRows) {
      try {
        await db.transaction(async (tx) => {
          const [current] = await tx.select()
            .from(userProducts)
            .where(eq(userProducts.id, userProduct.id))
            .for("update");
          if (
            !current ||
            !current.isActive ||
            current.daysRemaining <= 0 ||
            current.earningsPaidAt
          ) return;

          const [currentProduct] = await tx.select()
            .from(products)
            .where(eq(products.id, current.productId));
          if (!currentProduct) throw new Error(`Produit introuvable pour l'achat ${current.id}`);
          const originalProduct = current.productSnapshot ?? currentProduct;

          const purchaseDate = new Date(current.purchaseDate);
          const lastEarning = current.lastEarningDate
            ? new Date(current.lastEarningDate)
            : purchaseDate;
          const now = new Date();
          if (!Number.isFinite(purchaseDate.getTime()) || !Number.isFinite(lastEarning.getTime())) {
            throw new Error(`Date de cycle invalide pour l'achat ${current.id}`);
          }

          const cyclesSinceLastEarning = Math.floor(
            (now.getTime() - lastEarning.getTime()) / dayInMilliseconds,
          );
          const daysSincePurchase = Math.floor(
            (now.getTime() - purchaseDate.getTime()) / dayInMilliseconds,
          );
          if (cyclesSinceLastEarning < 1 || daysSincePurchase < 1) return;

          const cyclesToAccrue = Math.min(cyclesSinceLastEarning, current.daysRemaining);
          if (cyclesToAccrue < 1) return;

          const earningsPerCycle = Number(originalProduct.dailyEarnings);
          const previousTotal = Number(current.totalEarned || "0");
          const previousPending = Number(current.pendingEarnings || "0");
          if (
            !Number.isFinite(earningsPerCycle) ||
            earningsPerCycle < 0 ||
            !Number.isFinite(previousTotal) ||
            !Number.isFinite(previousPending)
          ) {
            throw new Error(`Montant de gain invalide pour l'achat ${current.id}`);
          }

          const accrued = Number((earningsPerCycle * cyclesToAccrue).toFixed(2));
          const newTotal = Number((previousTotal + accrued).toFixed(2));
          const newPending = originalProduct.collectAtEnd
            ? previousPending
            : Number((previousPending + accrued).toFixed(2));
          const newDaysRemaining = Math.max(0, current.daysRemaining - cyclesToAccrue);
          const completedAt = newDaysRemaining === 0 ? new Date() : null;
          const newLastEarningDate = new Date(
            lastEarning.getTime() + cyclesToAccrue * dayInMilliseconds,
          );
          const payout = completedAt
            ? originalProduct.collectAtEnd ? newTotal : newPending
            : 0;

          if (payout > 0) {
            const [user] = await tx.select()
              .from(users)
              .where(eq(users.id, current.userId))
              .for("update");
            if (!user) throw new Error(`Utilisateur introuvable pour l'achat ${current.id}`);

            const totalEarnings = Number(user.totalEarnings || "0");
            const todayEarnings = Number(user.todayEarnings || "0");
            if (!Number.isFinite(totalEarnings) || !Number.isFinite(todayEarnings)) {
              throw new Error(`Solde de gains invalide pour l'utilisateur ${current.userId}`);
            }

            await tx.update(users).set({
              totalEarnings: (totalEarnings + payout).toFixed(2),
              todayEarnings: (todayEarnings + payout).toFixed(2),
            }).where(eq(users.id, current.userId));
            await tx.insert(transactions).values({
              userId: current.userId,
              type: "earning",
              amount: payout.toFixed(2),
              description: `Crédit automatique — fin du cycle ${originalProduct.name}`,
            });
          }

          await tx.update(userProducts).set({
            lastEarningDate: newLastEarningDate,
            daysRemaining: newDaysRemaining,
            totalEarned: newTotal.toFixed(2),
            pendingEarnings: completedAt ? "0" : newPending.toFixed(2),
            isActive: !completedAt,
            earningsPaidAt: completedAt,
          }).where(eq(userProducts.id, current.id));
        });
      } catch (productError) {
        console.error(`processEarnings error for product ${userProduct.id}:`, productError);
      }
    }
  }

  private async settleCompletedProductEarnings(userId?: number): Promise<void> {
    const conditions = [
      sql`${userProducts.daysRemaining} <= 0`,
      isNull(userProducts.earningsPaidAt),
    ];
    if (userId !== undefined) conditions.push(eq(userProducts.userId, userId));

    const completedProducts = await db.select({ id: userProducts.id })
      .from(userProducts)
      .where(and(...conditions));

    for (const { id } of completedProducts) {
      try {
        await db.transaction(async (tx) => {
          const [current] = await tx.select()
            .from(userProducts)
            .where(eq(userProducts.id, id))
            .for("update");
          if (!current || current.daysRemaining > 0 || current.earningsPaidAt) return;

          const [product] = await tx.select()
            .from(products)
            .where(eq(products.id, current.productId));
          if (!product) throw new Error(`Produit introuvable pour l'achat ${current.id}`);
          const originalProduct = current.productSnapshot ?? product;

          const unpaidEarnings = Number(
            originalProduct.collectAtEnd ? current.totalEarned || "0" : current.pendingEarnings || "0",
          );
          if (!Number.isFinite(unpaidEarnings) || unpaidEarnings < 0) {
            throw new Error(`Montant de gain invalide pour l'achat ${current.id}`);
          }

          const settledAt = new Date();
          if (unpaidEarnings > 0) {
            const [user] = await tx.select()
              .from(users)
              .where(eq(users.id, current.userId))
              .for("update");
            if (!user) throw new Error(`Utilisateur introuvable pour l'achat ${current.id}`);

            const totalEarnings = Number(user.totalEarnings || "0");
            const todayEarnings = Number(user.todayEarnings || "0");
            if (!Number.isFinite(totalEarnings) || !Number.isFinite(todayEarnings)) {
              throw new Error(`Solde de gains invalide pour l'utilisateur ${current.userId}`);
            }

            await tx.update(users).set({
              totalEarnings: (totalEarnings + unpaidEarnings).toFixed(2),
              todayEarnings: (todayEarnings + unpaidEarnings).toFixed(2),
            }).where(eq(users.id, current.userId));
            await tx.insert(transactions).values({
              userId: current.userId,
              type: "earning",
              amount: unpaidEarnings.toFixed(2),
              description: `Crédit automatique — fin du cycle ${originalProduct.name}`,
            });
          }

          await tx.update(userProducts).set({
            isActive: false,
            pendingEarnings: "0",
            earningsPaidAt: settledAt,
          }).where(eq(userProducts.id, current.id));
        });
      } catch (productError) {
        console.error(`settleCompletedProductEarnings error for product ${id}:`, productError);
      }
    }
  }

  async processEarnings(): Promise<void> {
    const activeProducts = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(and(
        eq(userProducts.isActive, true),
        sql`${userProducts.daysRemaining} > 0`,
        isNull(userProducts.earningsPaidAt),
      ));

    await this.accrueProductEarnings(activeProducts);
    await this.settleCompletedProductEarnings();
  }

  async processEarningsForUser(userId: number): Promise<void> {
    const activeProducts = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(and(
        eq(userProducts.userId, userId),
        eq(userProducts.isActive, true),
        sql`${userProducts.daysRemaining} > 0`,
        isNull(userProducts.earningsPaidAt),
      ));

    await this.accrueProductEarnings(activeProducts);
    await this.settleCompletedProductEarnings(userId);
  }

  // Deposits
  async createDeposit(data: Partial<Deposit>): Promise<Deposit> {
    const [deposit] = await db.insert(deposits).values(data as any).returning();
    return deposit;
  }

  async createShareReport(data: Partial<ShareReport>): Promise<ShareReport> {
    const [shareReport] = await db.insert(shareReports).values(data as any).returning();
    return shareReport;
  }

  async getShareReports(status?: string): Promise<(ShareReport & { user: ShareReportUser })[]> {
    let query = db.select({
      shareReport: shareReports,
      user: {
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        country: users.country,
      },
    }).from(shareReports)
      .innerJoin(users, eq(shareReports.userId, users.id))
      .orderBy(desc(shareReports.createdAt));

    if (status && status !== "all") {
      query = query.where(eq(shareReports.status, status)) as any;
    }

    const results = await query;
    return results.map((result) => ({ ...result.shareReport, user: result.user }));
  }

  async updateShareReport(id: number, data: Partial<ShareReport>): Promise<ShareReport> {
    const [shareReport] = await db.update(shareReports).set(data).where(eq(shareReports.id, id)).returning();
    return shareReport;
  }

  async createWithdrawalProof(data: {
    userId: number;
    proofImage: string;
    proofImage2?: string | null;
    message: string;
  }): Promise<WithdrawalProof> {
    const [proof] = await db.insert(withdrawalProofs).values(data).returning();
    return proof;
  }

  async getWithdrawalProofs(
    status?: WithdrawalProofStatus | "all",
    limit = 100,
  ): Promise<(WithdrawalProof & { user: WithdrawalProofUser })[]> {
    let query = db.select({
      proof: withdrawalProofs,
      user: {
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        country: users.country,
      },
    }).from(withdrawalProofs)
      .innerJoin(users, eq(withdrawalProofs.userId, users.id));

    if (status && status !== "all") {
      query = query.where(eq(withdrawalProofs.status, status)) as any;
    }

    const results = await query
      .orderBy(desc(withdrawalProofs.createdAt))
      .limit(Math.min(Math.max(Math.floor(limit), 1), 500));

    return results.map((result) => ({ ...result.proof, user: result.user }));
  }

  async getWithdrawalProof(id: number): Promise<(WithdrawalProof & { user: WithdrawalProofUser }) | undefined> {
    const [result] = await db.select({
      proof: withdrawalProofs,
      user: {
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        country: users.country,
      },
    }).from(withdrawalProofs)
      .innerJoin(users, eq(withdrawalProofs.userId, users.id))
      .where(eq(withdrawalProofs.id, id))
      .limit(1);

    return result ? { ...result.proof, user: result.user } : undefined;
  }

  async approvePendingWithdrawalProof(
    id: number,
    data: { shareBonusXof: number; processedAt: Date; processedBy: number },
  ): Promise<WithdrawalProof | undefined> {
    return db.transaction(async (tx) => {
      const [proof] = await tx.update(withdrawalProofs)
        .set({ ...data, status: "approved" })
        .where(and(eq(withdrawalProofs.id, id), eq(withdrawalProofs.status, "pending")))
        .returning();
      if (!proof) return undefined;

      if (proof.shareBonusXof > 0) {
        const [creditedUser] = await tx.update(users)
          .set({
            totalEarnings: sql`${users.totalEarnings} + ${proof.shareBonusXof}`,
          })
          .where(eq(users.id, proof.userId))
          .returning({ id: users.id });
        if (!creditedUser) {
          throw new Error("Impossible de créditer la prime de partage au compte du membre");
        }

        await tx.insert(transactions).values({
          userId: proof.userId,
          type: "withdrawal_proof_bonus",
          amount: proof.shareBonusXof.toString(),
          description: `Prime de partage de preuve de retrait #${proof.id}`,
        });
      }

      const bonusDetails = proof.shareBonusXof > 0
        ? `prime de partage ${proof.shareBonusXof} XOF créditée au solde des gains`
        : "aucune prime de partage";
      await tx.insert(adminAuditLog).values({
        adminId: data.processedBy,
        action: "approve_withdrawal_proof",
        targetUserId: proof.userId,
        details: `Preuve de retrait ${proof.id} approuvée; ${bonusDetails}`,
      });

      return proof;
    });
  }

  async reviewPendingWithdrawalProof(
    id: number,
    data: Pick<WithdrawalProof, "status" | "shareBonusXof" | "processedAt" | "processedBy">,
  ): Promise<WithdrawalProof | undefined> {
    const [proof] = await db.update(withdrawalProofs)
      .set(data)
      .where(and(eq(withdrawalProofs.id, id), eq(withdrawalProofs.status, "pending")))
      .returning();
    return proof;
  }

  async getSupportChatMessages(userId: number): Promise<SupportChatMessage[]> {
    return db.select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.userId, userId))
      .orderBy(asc(supportChatMessages.createdAt), asc(supportChatMessages.id));
  }

  async createSupportChatMessage(data: {
    userId: number;
    senderId: number;
    senderRole: SupportChatSenderRole;
    message: string;
    attachmentUrl?: string | null;
    attachmentType?: SupportChatAttachmentType | null;
    attachmentName?: string | null;
  }): Promise<SupportChatMessage> {
    const [message] = await db.insert(supportChatMessages).values(data).returning();
    return message;
  }

  async updateOwnAdminSupportChatMessage(
    userId: number,
    messageId: number,
    adminId: number,
    message: string,
  ): Promise<SupportChatMessage | undefined> {
    const [updatedMessage] = await db.update(supportChatMessages)
      .set({ message })
      .where(and(
        eq(supportChatMessages.userId, userId),
        eq(supportChatMessages.id, messageId),
        eq(supportChatMessages.senderId, adminId),
        eq(supportChatMessages.senderRole, "admin"),
      ))
      .returning();
    return updatedMessage;
  }

  async markSupportChatMessagesRead(userId: number, readerRole: SupportChatSenderRole): Promise<void> {
    const senderRole = readerRole === "admin" ? "user" : "admin";
    await db.update(supportChatMessages)
      .set({ readAt: new Date() })
      .where(and(
        eq(supportChatMessages.userId, userId),
        eq(supportChatMessages.senderRole, senderRole),
        isNull(supportChatMessages.readAt),
      ));
  }

  async getSupportChatConversations(): Promise<SupportChatConversation[]> {
    const result = await pool.query<{
      user_id: number;
      full_name: string;
      phone: string;
      country: string;
      message: string;
      sender_role: SupportChatSenderRole;
      attachment_type: SupportChatAttachmentType | null;
      attachment_name: string | null;
      created_at: Date;
      unread_count: number;
    }>(`
      SELECT
        u.id AS user_id,
        u.full_name,
        u.phone,
        u.country,
        latest.message,
        latest.sender_role,
        latest.attachment_type,
        latest.attachment_name,
        latest.created_at,
        COALESCE(unread.unread_count, 0)::int AS unread_count
      FROM users u
      JOIN LATERAL (
        SELECT message, sender_role, attachment_type, attachment_name, created_at, id
        FROM support_chat_messages
        WHERE user_id = u.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) latest ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS unread_count
        FROM support_chat_messages
        WHERE user_id = u.id
          AND sender_role = 'user'
          AND read_at IS NULL
      ) unread ON TRUE
      ORDER BY latest.created_at DESC, latest.id DESC
    `);

    return result.rows.map((row) => ({
      user: {
        id: row.user_id,
        fullName: row.full_name,
        phone: row.phone,
        country: row.country,
      },
      lastMessage: {
        message: row.message,
        senderRole: row.sender_role,
        attachmentType: row.attachment_type,
        attachmentName: row.attachment_name,
        createdAt: row.created_at,
      },
      unreadCount: Number(row.unread_count),
    }));
  }

  async getSupportChatAttachmentUserId(attachmentUrl: string): Promise<number | undefined> {
    const [message] = await db.select({ userId: supportChatMessages.userId })
      .from(supportChatMessages)
      .where(eq(supportChatMessages.attachmentUrl, attachmentUrl))
      .limit(1);
    return message?.userId;
  }

  async getDeposit(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async getDepositByReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.reference, reference));
    return deposit;
  }

  async getDeposits(status?: string): Promise<(Deposit & { user: User })[]> {
    let query = db.select({
      deposit: deposits,
      user: users,
    }).from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(deposits.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.deposit, user: r.user }));
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  }

  async updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit> {
    const [deposit] = await db.update(deposits).set(data).where(eq(deposits.id, id)).returning();
    return deposit;
  }

  async approveManualDepositExactlyOnce(
    id: number,
    processedBy: number,
  ): Promise<{ deposit?: Deposit; credited: boolean }> {
    return db.transaction(async (tx) => {
      const [deposit] = await tx
        .update(deposits)
        .set({
          status: "approved",
          processedAt: new Date(),
          processedBy,
        })
        .where(
          and(
            eq(deposits.id, id),
            inArray(deposits.status, ["pending", "processing"]),
            ne(deposits.paymentMethod, "NOWPayments"),
          ),
        )
        .returning();

      if (!deposit) {
        const [existing] = await tx.select().from(deposits).where(eq(deposits.id, id));
        return { deposit: existing, credited: false };
      }

      const [creditedUser] = await tx
        .update(users)
        .set({
          balance: sql`(${users.balance}::numeric + ${deposit.amount})::numeric(15, 2)`,
          hasDeposited: true,
        })
        .where(eq(users.id, deposit.userId))
        .returning({ id: users.id });

      if (!creditedUser) {
        throw new Error("Utilisateur du dépôt introuvable");
      }

      await tx.insert(transactions).values({
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.amount.toString(),
        description: deposit.paymentMethod === "Deposit issue"
          ? "Réclamation de dépôt approuvée"
          : "Dépôt validé",
      });

      return { deposit, credited: true };
    });
  }

  /**
   * Credits a NOWPayments deposit exactly once.
   *
   * IPN deliveries can be retried or delivered concurrently. The conditional
   * pending → approved transition acts as the idempotency lock; only the
   * request that wins it can increment the user's balance and create a
   * transaction record.
   */
  async approveNowPaymentsDeposit(
    reference: string,
  ): Promise<{ deposit?: Deposit; credited: boolean }> {
    return this.processNowPaymentsDeposit({
      reference,
      action: "credit",
      gatewayStatus: "FINISHED",
    });
  }

  async processNowPaymentsDeposit(input: {
    reference: string;
    action: "tracking" | "review" | "credit";
    gatewayStatus?: string | null;
    actuallyPaid?: string | null;
    payCurrency?: string | null;
    outcomeAmount?: string | null;
    outcomeCurrency?: string | null;
    error?: string | null;
  }): Promise<{ deposit?: Deposit; credited: boolean }> {
    return db.transaction(async (tx) => {
      const metadata = {
        nowPaymentsStatus: input.gatewayStatus || null,
        nowPaymentsActuallyPaid: input.actuallyPaid || null,
        nowPaymentsOutcomeAmount: input.outcomeAmount || null,
        nowPaymentsOutcomeCurrency: input.outcomeCurrency || null,
        nowPaymentsError: input.error || null,
      };
      const eligibleStatuses = inArray(deposits.status, [
        "pending",
        "processing",
        "review",
      ]);

      if (input.action !== "credit") {
        const [updated] = await tx
          .update(deposits)
          .set({
            ...metadata,
            ...(input.action === "review" ? { status: "review" } : {}),
          })
          .where(
            and(eq(deposits.reference, input.reference), eligibleStatuses),
          )
          .returning();

        if (updated) return { deposit: updated, credited: false };
        const [existing] = await tx
          .select()
          .from(deposits)
          .where(eq(deposits.reference, input.reference));
        return { deposit: existing, credited: false };
      }

      const [deposit] = await tx
        .update(deposits)
        .set({
          ...metadata,
          status: "approved",
          processedAt: new Date(),
        })
        .where(
          and(
            eq(deposits.reference, input.reference),
            eligibleStatuses,
          ),
        )
        .returning();

      if (!deposit) {
        const [existing] = await tx
          .select()
          .from(deposits)
          .where(eq(deposits.reference, input.reference));
        return { deposit: existing, credited: false };
      }

      await tx
        .update(users)
        .set({
          balance: sql`(${users.balance}::numeric + ${deposit.amount})::numeric(15, 2)`,
          hasDeposited: true,
        })
        .where(eq(users.id, deposit.userId));

      await tx.insert(transactions).values({
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.amount.toString(),
        description: `Dépôt crypto confirmé — ${deposit.channelName || "NOWPayments"}`,
      });

      return { deposit, credited: true };
    });
  }

  /* ── WestPay helpers ──────────────────────────────────────── */

  async findProcessingWestpayDeposit(
    amount: number,
    payerPhone: string | null,
    _country: string,
  ): Promise<Deposit | null> {
    const candidates = await db
      .select()
      .from(deposits)
      .where(
        and(
          eq(deposits.status, "processing"),
          eq(deposits.paymentMethod, "WestPay"),
          sql`${deposits.amount} = ${amount}`,
        ),
      )
      .orderBy(asc(deposits.createdAt));

    if (candidates.length === 0) return null;

    if (payerPhone) {
      const normalized = payerPhone.replace(/^\+/, "");
      const match = candidates.find((d) => {
        const stored = (d.accountNumber || "").replace(/^\+/, "");
        return stored === normalized || normalized.endsWith(stored) || stored.endsWith(normalized);
      });
      if (match) return match;
      // Phone given but no match and multiple candidates → don't guess
      if (candidates.length > 1) return null;
    }

    return candidates[0] ?? null;
  }

  async approveWestpayDeposit(
    depositId: number,
    txId: string,
    payerPhone: string | null,
  ): Promise<void> {
    const deposit = await this.getDeposit(depositId);
    if (!deposit) throw new Error("Deposit not found");

    await this.updateDeposit(depositId, {
      status: "approved",
      processedAt: new Date(),
      reference: txId,
      accountNumber: payerPhone || deposit.accountNumber,
    });

    const user = await this.getUser(deposit.userId);
    if (user) {
      const newBalance = parseFloat(user.balance) + deposit.amount;
      await this.updateUser(user.id, {
        balance: newBalance.toFixed(2),
        hasDeposited: true,
      });
      await this.createTransaction({
        userId: user.id,
        type: "deposit",
        amount: deposit.amount.toString(),
        description: "Dépôt WestPay confirmé",
      });
    }
  }

  async cleanupDepositScreenshots(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.update(deposits)
      .set({ screenshot: null })
      .where(
        and(
          sql`${deposits.screenshot} IS NOT NULL`,
          or(
            and(eq(deposits.status, "approved"), lte(deposits.processedAt, cutoff)),
            and(eq(deposits.status, "rejected"), lte(deposits.processedAt, cutoff)),
          )
        )
      );
  }


  // Withdrawals
  async createWithdrawalRequest(
    data: Partial<Withdrawal>,
    maxPerDay: number,
  ): Promise<WithdrawalRequestCreationResult> {
    const userId = Number(data.userId);
    const amount = Number(data.amount);
    if (!Number.isSafeInteger(userId) || userId <= 0 || !Number.isSafeInteger(amount) || amount <= 0) {
      throw new RangeError("Invalid withdrawal reservation data.");
    }
    if (!Number.isSafeInteger(maxPerDay) || maxPerDay <= 0) {
      throw new RangeError("Invalid daily withdrawal limit.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return db.transaction(async (tx) => {
      // Serializing requests on the user's row prevents parallel withdrawals
      // from spending the same earnings balance or passing the daily limit.
      const [user] = await tx
        .select({
          id: users.id,
          totalEarnings: users.totalEarnings,
          isWithdrawalBlocked: users.isWithdrawalBlocked,
        })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      if (!user) return { status: "user_missing" };
      if (user.isWithdrawalBlocked) return { status: "withdrawal_blocked" };

      const availableEarnings = Number(user.totalEarnings || "0");
      if (!Number.isFinite(availableEarnings) || availableEarnings < amount) {
        return { status: "insufficient_balance" };
      }

      const [todayCountRow] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(and(
          eq(withdrawals.userId, userId),
          gte(withdrawals.createdAt, today),
        ));
      const todayCount = Number(todayCountRow?.count ?? 0);
      if (!Number.isSafeInteger(todayCount) || todayCount >= maxPerDay) {
        return { status: "daily_limit", limit: maxPerDay };
      }

      const [debitedUser] = await tx
        .update(users)
        .set({ totalEarnings: sql`${users.totalEarnings} - ${amount}` })
        .where(and(
          eq(users.id, userId),
          sql`${users.totalEarnings} >= ${amount}`,
        ))
        .returning({ id: users.id });
      if (!debitedUser) return { status: "insufficient_balance" };

      const [withdrawal] = await tx
        .insert(withdrawals)
        .values({ ...data, userId, amount } as any)
        .returning();
      if (!withdrawal) throw new Error("The withdrawal request could not be saved.");

      return { status: "created", withdrawal };
    });
  }

  async getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]> {
    let query = db.select({
      withdrawal: withdrawals,
      user: users,
    }).from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(withdrawals.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.withdrawal, user: r.user }));
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal> {
    const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
    return withdrawal;
  }

  /**
   * Claims a pending withdrawal before calling the external payout service.
   * This atomic transition prevents parallel admin requests from double-paying.
   */
  async claimWithdrawalForNowPayments(
    id: number,
    processedBy: number,
    externalId: string,
  ): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .update(withdrawals)
      .set({
        status: "processing",
        processedBy,
        nowPaymentsExternalId: externalId,
        nowPaymentsStatus: "CREATING",
        nowPaymentsError: null,
      })
      .where(
        and(
          eq(withdrawals.id, id),
          eq(withdrawals.status, "pending"),
          sql`${withdrawals.nowPaymentsPayoutId} IS NULL`,
        ),
      )
      .returning();
    return withdrawal || undefined;
  }

  /**
   * A payout completion may only win while the withdrawal is non-terminal.
   * Together with refundWithdrawal's equivalent predicate, this keeps delayed
   * or concurrent signed IPNs from reversing a completed/refunded outcome.
   */
  async completeNowPaymentsWithdrawal(
    id: number,
    data: Pick<Partial<Withdrawal>, "nowPaymentsStatus" | "nowPaymentsHash" | "nowPaymentsError">,
  ): Promise<Withdrawal | undefined> {
    const [updated] = await db
      .update(withdrawals)
      .set({
        ...data,
        status: "approved",
        processedAt: new Date(),
      })
      .where(and(
        eq(withdrawals.id, id),
        sql`${withdrawals.status} NOT IN ('approved', 'rejected', 'failed')`,
      ))
      .returning();
    if (updated) return updated;
    const [existing] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return existing || undefined;
  }

  async trackNowPaymentsWithdrawal(
    id: number,
    status: "pending_2fa" | "processing",
    data: Pick<Partial<Withdrawal>, "nowPaymentsStatus" | "nowPaymentsHash" | "nowPaymentsError">,
  ): Promise<Withdrawal | undefined> {
    const [updated] = await db
      .update(withdrawals)
      .set({
        ...data,
        // A delayed provider "waiting" update can never undo an already
        // submitted admin 2FA verification.
        ...(status === "processing"
          ? { status: sql`CASE WHEN ${withdrawals.status} = 'pending_2fa' THEN ${withdrawals.status} ELSE 'processing' END` }
          : {}),
      })
      .where(and(
        eq(withdrawals.id, id),
        sql`${withdrawals.status} NOT IN ('approved', 'rejected', 'failed')`,
      ))
      .returning();
    if (updated) return updated;
    const [existing] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return existing || undefined;
  }

  /**
   * Applies the admin's successful 2FA verification only if the payout is
   * still awaiting 2FA. A signed terminal IPN that wins the race remains
   * terminal and is never overwritten back to processing.
   */
  async verifyNowPaymentsWithdrawal(
    id: number,
    processedBy: number,
  ): Promise<Withdrawal | undefined> {
    const [updated] = await db
      .update(withdrawals)
      .set({
        status: "processing",
        nowPaymentsStatus: "PROCESSING",
        processedAt: new Date(),
        processedBy,
      })
      .where(and(
        eq(withdrawals.id, id),
        eq(withdrawals.status, "pending_2fa"),
      ))
      .returning();
    return updated || undefined;
  }

  async markNowPaymentsVerificationForReconciliation(
    id: number,
    reason: string,
  ): Promise<Withdrawal | undefined> {
    const [updated] = await db
      .update(withdrawals)
      .set({
        status: "reconciling",
        nowPaymentsStatus: "RECONCILIATION_REQUIRED",
        nowPaymentsError: reason,
      })
      .where(and(
        eq(withdrawals.id, id),
        eq(withdrawals.status, "pending_2fa"),
      ))
      .returning();
    return updated || undefined;
  }

  async getWithdrawalByNowPaymentsPayoutId(payoutId: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.nowPaymentsPayoutId, payoutId));
    return withdrawal || undefined;
  }

  async getWithdrawalByNowPaymentsBatchId(batchId: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.nowPaymentsBatchId, batchId));
    return withdrawal || undefined;
  }

  async refundWithdrawal(
    id: number,
    status: "rejected" | "failed",
    reason: string,
  ): Promise<Withdrawal | undefined> {
    return db.transaction(async (tx) => {
      const [withdrawal] = await tx
        .update(withdrawals)
        .set({
          status,
          processedAt: new Date(),
          nowPaymentsStatus: status.toUpperCase(),
          nowPaymentsError: reason,
        })
        .where(and(
          eq(withdrawals.id, id),
          sql`${withdrawals.status} NOT IN ('approved', 'rejected', 'failed')`,
        ))
        .returning();

      if (!withdrawal) return undefined;

      const [user] = await tx
        .update(users)
        .set({ totalEarnings: sql`${users.totalEarnings} + ${withdrawal.amount}` })
        .where(eq(users.id, withdrawal.userId))
        .returning({ id: users.id });
      if (user) {
        await tx.insert(transactions).values({
          userId: user.id,
          type: "withdrawal_refund",
          amount: withdrawal.amount.toString(),
          description: `Remboursement du retrait ${withdrawal.id}: ${reason}`,
        });
      }

      return withdrawal;
    });
  }

  async getUserWithdrawalCountToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(and(
        eq(withdrawals.userId, userId),
        gte(withdrawals.createdAt, today)
      ));
    
    return result[0]?.count || 0;
  }

  // Wallets
  async getWallets(userId: number): Promise<WithdrawalWallet[]> {
    return await db.select().from(withdrawalWallets).where(eq(withdrawalWallets.userId, userId));
  }

  async createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet> {
    // Set other wallets as non-default
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, data.userId!));
    
    const [wallet] = await db.insert(withdrawalWallets).values({ ...data, isDefault: true } as any).returning();
    return wallet;
  }

  async deleteWallet(userId: number, id: number): Promise<boolean> {
    const deleted = await db.delete(withdrawalWallets)
      .where(and(eq(withdrawalWallets.id, id), eq(withdrawalWallets.userId, userId)))
      .returning({ id: withdrawalWallets.id });
    return deleted.length > 0;
  }

  async setDefaultWallet(userId: number, walletId: number): Promise<boolean> {
    const [wallet] = await db.select({ id: withdrawalWallets.id })
      .from(withdrawalWallets)
      .where(and(
        eq(withdrawalWallets.id, walletId),
        eq(withdrawalWallets.userId, userId),
      ));
    if (!wallet) return false;

    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, userId));
    await db.update(withdrawalWallets)
      .set({ isDefault: true })
      .where(and(eq(withdrawalWallets.id, walletId), eq(withdrawalWallets.userId, userId)));
    return true;
  }

  async getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined> {
    const [wallet] = await db.select().from(withdrawalWallets)
      .where(and(eq(withdrawalWallets.userId, userId), eq(withdrawalWallets.isDefault, true)));
    return wallet || undefined;
  }

  // Payment Channels
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels);
  }

  async getActivePaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels).where(eq(paymentChannels.isActive, true));
  }

  async getPaymentChannel(id: number): Promise<PaymentChannel | undefined> {
    const [channel] = await db.select().from(paymentChannels).where(eq(paymentChannels.id, id));
    return channel || undefined;
  }

  async createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.insert(paymentChannels).values(data as any).returning();
    return channel;
  }

  async updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.update(paymentChannels).set({ ...data, modifiedAt: new Date() }).where(eq(paymentChannels.id, id)).returning();
    return channel;
  }

  async deletePaymentChannel(id: number): Promise<void> {
    await db.delete(paymentChannels).where(eq(paymentChannels.id, id));
  }

  // Referrals
  async getReferrals(userId: number, level: number): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    if (level === 1) {
      return await db.select().from(users).where(eq(users.referredBy, user.referralCode));
    }
    
    // For level 2 and 3, we need recursive queries
    const level1 = await this.getReferrals(userId, 1);
    if (level === 2) {
      const level2: User[] = [];
      for (const l1 of level1) {
        const refs = await db.select().from(users).where(eq(users.referredBy, l1.referralCode));
        level2.push(...refs);
      }
      return level2;
    }
    
    if (level === 3) {
      const level2 = await this.getReferrals(userId, 2);
      const level3: User[] = [];
      for (const l2 of level2) {
        const refs = await db.select().from(users).where(eq(users.referredBy, l2.referralCode));
        level3.push(...refs);
      }
      return level3;
    }
    
    return [];
  }

  async createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission> {
    const [commission] = await db.insert(referralCommissions).values(data as any).returning();
    return commission;
  }

  async getUserCommissions(userId: number): Promise<number> {
    const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    return parseFloat(result[0]?.total || "0");
  }

  async getUserIncomeSummary(userId: number): Promise<{ productEarnings: number; teamEarnings: number }> {
    const [productIncome, teamEarnings] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, "earning"),
        )),
      this.getUserCommissions(userId),
    ]);

    return {
      productEarnings: finiteAmount(productIncome[0]?.total),
      teamEarnings: finiteAmount(teamEarnings),
    };
  }

  async getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }> {
    const user = await this.getUser(userId);
    if (!user) return { level1Count: 0, level2Count: 0, level3Count: 0, totalCommission: 0 };

    const level1Result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredBy, user.referralCode));
    const level1Count = Number(level1Result[0]?.count || 0);

    let level2Count = 0;
    let level3Count = 0;
    
    if (level1Count > 0) {
      const level1Codes = await db.select({ code: users.referralCode })
        .from(users)
        .where(eq(users.referredBy, user.referralCode));
      
      if (level1Codes.length > 0) {
        const level2Result = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
        level2Count = Number(level2Result[0]?.count || 0);
        
        if (level2Count > 0) {
          const level2Codes = await db.select({ code: users.referralCode })
            .from(users)
            .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
          
          if (level2Codes.length > 0) {
            const level3Result = await db.select({ count: sql<number>`count(*)` })
              .from(users)
              .where(sql`${users.referredBy} IN (${sql.join(level2Codes.map(u => sql`${u.code}`), sql`, `)})`);
            level3Count = Number(level3Result[0]?.count || 0);
          }
        }
      }
    }

    const commResult = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    const totalCommission = parseFloat(commResult[0]?.total || "0");

    return { level1Count, level2Count, level3Count, totalCommission };
  }

  async getTeamStats(userId: number, date?: string): Promise<{ level1Count: number; level2Count: number; level3Count: number; level1ValidCount: number; level2ValidCount: number; level3ValidCount: number; totalCommission: number; level1Commission: number; level2Commission: number; level3Commission: number; level1Invested: number; level2Invested: number; level3Invested: number; level1Recharged: number; teamTotalDeposits: number; teamTotalWithdrawals: number }> {
    const dateStart = date ? new Date(`${date}T00:00:00.000Z`) : null;
    if (dateStart && Number.isNaN(dateStart.getTime())) {
      throw new Error("Invalid team statistics date");
    }
    const dateEnd = dateStart ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) : null;
    const includesDate = (member: User) => !dateStart || (
      member.createdAt >= dateStart && member.createdAt < dateEnd!
    );

    const allLevel1 = await this.getReferrals(userId, 1);
    const allLevel2 = await this.getReferrals(userId, 2);
    const allLevel3 = await this.getReferrals(userId, 3);
    const level1 = allLevel1.filter(includesDate);
    const level2 = allLevel2.filter(includesDate);
    const level3 = allLevel3.filter(includesDate);

    const totalCommissionQuery = dateStart && dateEnd
      ? db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(
          eq(referralCommissions.userId, userId),
          gte(referralCommissions.createdAt, dateStart),
          lt(referralCommissions.createdAt, dateEnd),
        ))
      : null;
    const totalCommission = totalCommissionQuery
      ? parseFloat((await totalCommissionQuery)[0]?.total || "0")
      : await this.getUserCommissions(userId);

    const getCommissionByLevel = async (level: number) => {
      const filters = [
        eq(referralCommissions.userId, userId),
        eq(referralCommissions.level, level),
        ...(dateStart && dateEnd
          ? [gte(referralCommissions.createdAt, dateStart), lt(referralCommissions.createdAt, dateEnd)]
          : []),
      ];
      const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(...filters));
      return parseFloat(result[0]?.total || "0");
    };

    const countInvested = async (userList: User[]) => userList.filter((member) => member.hasActiveProduct).length;

    const countRecharged = async (userList: User[]) => {
      let count = 0;
      for (const member of userList) {
        const filters = [
          eq(deposits.userId, member.id),
          eq(deposits.status, "approved"),
          ...(dateStart && dateEnd
            ? [gte(deposits.createdAt, dateStart), lt(deposits.createdAt, dateEnd)]
            : []),
        ];
        const userDeposits = await db.select({ id: deposits.id }).from(deposits)
          .where(and(...filters))
          .limit(1);
        if (userDeposits.length > 0) count++;
      }
      return count;
    };

    const allMembers = [...allLevel1, ...allLevel2, ...allLevel3];
    let teamTotalDeposits = 0;
    let teamTotalWithdrawals = 0;

    for (const member of allMembers) {
      const depositFilters = [
        eq(deposits.userId, member.id),
        eq(deposits.status, "approved"),
        ...(dateStart && dateEnd
          ? [gte(deposits.createdAt, dateStart), lt(deposits.createdAt, dateEnd)]
          : []),
      ];
      const [depositTotal] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
        .from(deposits)
        .where(and(...depositFilters));
      teamTotalDeposits += parseFloat(depositTotal?.total || "0");

      const withdrawalFilters = [
        eq(withdrawals.userId, member.id),
        eq(withdrawals.status, "approved"),
        ...(dateStart && dateEnd
          ? [gte(withdrawals.createdAt, dateStart), lt(withdrawals.createdAt, dateEnd)]
          : []),
      ];
      const [withdrawalTotal] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
        .from(withdrawals)
        .where(and(...withdrawalFilters));
      teamTotalWithdrawals += parseFloat(withdrawalTotal?.total || "0");
    }

    return {
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      level1ValidCount: level1.filter((member) => member.hasDeposited).length,
      level2ValidCount: level2.filter((member) => member.hasDeposited).length,
      level3ValidCount: level3.filter((member) => member.hasDeposited).length,
      totalCommission,
      level1Commission: await getCommissionByLevel(1),
      level2Commission: await getCommissionByLevel(2),
      level3Commission: await getCommissionByLevel(3),
      level1Invested: await countInvested(level1),
      level2Invested: await countInvested(level2),
      level3Invested: await countInvested(level3),
      level1Recharged: await countRecharged(level1),
      teamTotalDeposits,
      teamTotalWithdrawals,
    };
  }

  async getDetailedTeam(userId: number): Promise<any> {
    const level1 = await this.getReferrals(userId, 1);
    const level2 = await this.getReferrals(userId, 2);
    const level3 = await this.getReferrals(userId, 3);

    const enrichUser = async (user: User, vipLevel: number) => {
      const userProductsList = await db.select({ 
        productName: products.name,
        productPrice: products.price,
        purchaseDate: userProducts.purchaseDate,
        isActive: userProducts.isActive,
      })
      .from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(eq(userProducts.userId, user.id));
      
      const totalInvested = userProductsList
        .reduce((sum, p) => sum + finiteAmount(p.productPrice), 0);

      // Bonus earned by current user FROM this specific member
      const bonusResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(
          eq(referralCommissions.userId, userId),
          eq(referralCommissions.fromUserId, user.id),
        ));
      const bonusFromMember = finiteAmount(bonusResult[0]?.total);

      return {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        referralCode: user.referralCode,
        country: user.country,
        balance: user.balance,
        hasActiveProduct: user.hasActiveProduct,
        hasDeposited: user.hasDeposited,
        createdAt: user.createdAt,
        totalInvested,
        vipLevel,
        bonusFromMember,
        products: userProductsList,
      };
    };

    const level1Details = await Promise.all(level1.map(u => enrichUser(u, 1)));
    const level2Details = await Promise.all(level2.map(u => enrichUser(u, 2)));
    const level3Details = await Promise.all(level3.map(u => enrichUser(u, 3)));

    return {
      level1: level1Details,
      level2: level2Details,
      level3: level3Details,
      totalLevel1Invested: level1Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel2Invested: level2Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel3Invested: level3Details.reduce((sum, u) => sum + u.totalInvested, 0),
    };
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.isActive, true))
      .orderBy(asc(tasks.sortOrder), asc(tasks.id));
  }

  async getAllTasksAdmin(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(asc(tasks.sortOrder), asc(tasks.id));
  }

  async createTask(data: AdminTaskCreateInput): Promise<Task> {
    const [task] = await db.insert(tasks).values({ ...data, isActive: true }).returning();
    return task;
  }

  async updateTask(id: number, data: AdminTaskUpdateInput): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const [existingTask] = await db.select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    if (!existingTask) return false;

    const [existingClaim] = await db.select({ id: userTasks.id })
      .from(userTasks)
      .where(eq(userTasks.taskId, id))
      .limit(1);
    if (existingClaim) throw new TaskHasClaimsError();

    try {
      const [deletedTask] = await db.delete(tasks)
        .where(eq(tasks.id, id))
        .returning({ id: tasks.id });
      return Boolean(deletedTask);
    } catch (error: any) {
      // The foreign key remains the final safeguard if a claim races with deletion.
      if (error?.code === "23503") throw new TaskHasClaimsError();
      throw error;
    }
  }

  async getTasksWithStatus(userId: number): Promise<TaskWithStatus[]> {
    const allTasks = await this.getTasks();
    const user = await this.getUser(userId);
    if (!user) return [];

    const level1Refs = await this.getReferrals(userId, 1);
    // Active member = direct referral not banned who has at least one active
    // purchase of a non-free product (VIP 1 or higher).
    // We do NOT use hasActiveProduct because it is also set for free products.
    let currentInvites = 0;
    if (level1Refs.length > 0) {
      const referralIds = level1Refs.map((referral) => referral.id);
      if (referralIds.length > 0) {
        const rows = await db
          .selectDistinct({ userId: userProducts.userId })
          .from(userProducts)
          .innerJoin(products, eq(userProducts.productId, products.id))
          .where(and(
            inArray(userProducts.userId, referralIds),
            eq(products.isFree, false),
            eq(userProducts.isActive, true),
          ));
        currentInvites = countEligibleDirectReferrals(
          level1Refs,
          rows.map((row) => row.userId),
        );
      }
    }

    const completedTasks = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
    const claimsByTaskId = new Map(completedTasks.map((claim) => [claim.taskId, claim]));

    return allTasks.map((task) => {
      const claim = claimsByTaskId.get(task.id);
      const isCompleted = Boolean(claim);
      return {
        ...task,
        isCompleted,
        canClaim: canClaimTask(currentInvites, task.requiredInvites, isCompleted),
        currentInvites,
        claimedName: claim?.taskNameSnapshot ?? null,
        claimedDescription: claim?.taskDescriptionSnapshot ?? null,
        claimedRequiredInvites: claim?.requiredInvitesSnapshot ?? null,
        claimedReward: claim?.rewardSnapshot ?? null,
      };
    });
  }

  async claimTask(userId: number, taskId: number): Promise<number> {
    const tasksStatus = await this.getTasksWithStatus(userId);
    const taskStatus = tasksStatus.find(t => t.id === taskId);

    if (!taskStatus) throw new Error("Tâche non trouvée");
    if (taskStatus.isCompleted) throw new Error("Tâche déjà réclamée");
    if (!taskStatus.canClaim) {
      throw new Error(`Invitations insuffisantes (${taskStatus.currentInvites}/${taskStatus.requiredInvites})`);
    }

    let claimedReward = 0;
    try {
      await db.transaction(async (tx) => {
        const [currentTask] = await tx.select().from(tasks)
          .where(eq(tasks.id, taskId))
          .for("update");
        if (!currentTask || !currentTask.isActive) throw new Error("Tâche non trouvée");

        const existingClaim = await tx.select({ id: userTasks.id })
          .from(userTasks)
          .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)))
          .limit(1);

        if (existingClaim.length > 0) {
          throw new Error("Tâche déjà réclamée");
        }

        if (!canClaimTask(taskStatus.currentInvites, currentTask.requiredInvites, false)) {
          throw new Error(`Invitations insuffisantes (${taskStatus.currentInvites}/${currentTask.requiredInvites})`);
        }

        const rewardAmount = formatTaskRewardAmount(currentTask.reward);
        await tx.insert(userTasks).values({
          userId,
          taskId,
          rewardClaimed: true,
          taskNameSnapshot: currentTask.name,
          taskDescriptionSnapshot: currentTask.description,
          requiredInvitesSnapshot: currentTask.requiredInvites,
          rewardSnapshot: currentTask.reward,
        });

        const updatedUser = await tx.update(users)
          .set({ totalEarnings: sql`${users.totalEarnings} + ${rewardAmount}::numeric` })
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        if (updatedUser.length === 0) throw new Error("Utilisateur non trouvé");

        await tx.insert(transactions).values({
          userId,
          type: "task_reward",
          amount: rewardAmount,
          description: `Récompense: ${currentTask.name}`,
        });

        claimedReward = currentTask.reward;
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new Error("Tâche déjà réclamée");
      }
      throw error;
    }

    return claimedReward;
  }

  // Transactions
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data as any).returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getUserTransactionsByType(userId: number, type: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, type)))
      .orderBy(desc(transactions.createdAt));
  }

  async claimDailyBonus(userId: number, amount: number): Promise<DailyBonusClaimResult> {
    if (!Number.isInteger(amount) || amount < 50 || amount > 100) {
      throw new Error("La récompense de pointage doit être un entier entre 50 et 100 XOF");
    }

    return db.transaction(async (tx) => {
      const [user] = await tx
        .select({ lastDailyBonusClaim: users.lastDailyBonusClaim })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");

      if (!user) return { status: "user_missing" };

      const now = new Date();
      const hoursRemaining = getDailyBonusHoursRemaining(user.lastDailyBonusClaim, now);
      if (hoursRemaining > 0) {
        return { status: "cooldown", hoursRemaining };
      }

      await tx.update(users).set({
        totalEarnings: sql`${users.totalEarnings} + ${amount}`,
        lastDailyBonusClaim: now,
      }).where(eq(users.id, userId));

      await tx.insert(transactions).values({
        userId,
        type: "bonus",
        amount: String(amount),
        description: `Pointage quotidien : +${amount} XOF`,
        createdAt: now,
      });

      return { status: "claimed", amount };
    });
  }

  async getDailyBonusTransactions(
    userId: number,
  ): Promise<Pick<Transaction, "amount" | "createdAt">[]> {
    return db.select({
      amount: transactions.amount,
      createdAt: transactions.createdAt,
    })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, "bonus"),
        sql`LOWER(BTRIM(${transactions.description})) LIKE 'pointage quotidien%'`,
      ))
      .orderBy(desc(transactions.createdAt));
  }

  async executeSpinWheel(userId: number, requestKey: string): Promise<SpinWheelExecutionResult> {
    const client = await pool.connect();
    let transactionOpen = false;

    try {
      await client.query("BEGIN");
      transactionOpen = true;

      const userResult = await client.query<{ spin_tokens: number }>(
        `SELECT spin_tokens
           FROM users
          WHERE id = $1
          FOR UPDATE`,
        [userId],
      );
      const user = userResult.rows[0];
      if (!user) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return { status: "user_missing" };
      }

      const previousResult = await client.query<SpinWheelRequestRow>(
        `SELECT segment_id, amount, label, spin_tokens_after, segments_snapshot
           FROM spin_wheel_requests
          WHERE user_id = $1 AND request_key = $2
          LIMIT 1`,
        [userId, requestKey],
      );
      if (previousResult.rows[0]) {
        await client.query("COMMIT");
        transactionOpen = false;
        return { status: "replayed", result: spinWheelResultFromRow(previousResult.rows[0]) };
      }

      if (!Number.isInteger(user.spin_tokens) || user.spin_tokens <= 0) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return { status: "no_tokens" };
      }

      const settingResult = await client.query<{ value: string }>(
        `SELECT value
           FROM platform_settings
          WHERE key = $1
          LIMIT 1`,
        [SPIN_WHEEL_SETTING_KEY],
      );
      const segments = parseSpinWheelSegments(settingResult.rows[0]?.value);
      if (!segments.some((segment) => segment.canWin)) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return { status: "no_winnable_segments" };
      }
      const winner = pickWinningSpinWheelSegment(segments);
      const selectedSegment = segments.find((segment) => segment.id === winner.id);
      if (
        !selectedSegment ||
        !selectedSegment.canWin ||
        !Number.isFinite(selectedSegment.amount) ||
        selectedSegment.amount < 0 ||
        typeof selectedSegment.label !== "string" ||
        !selectedSegment.label.trim()
      ) {
        throw new Error("Le gain sélectionné pour la roue est invalide.");
      }

      const amount = selectedSegment.amount.toFixed(2);
      const updateResult = await client.query<{ spin_tokens: number }>(
        `UPDATE users
            SET total_earnings = total_earnings + $1::numeric,
                spin_tokens = spin_tokens - 1
          WHERE id = $2 AND spin_tokens > 0
          RETURNING spin_tokens`,
        [amount, userId],
      );
      const updatedUser = updateResult.rows[0];
      if (!updatedUser) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return { status: "no_tokens" };
      }

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES ($1, 'spin_reward', $2, $3)`,
        [userId, amount, `Gain roue : ${selectedSegment.label}`],
      );
      await client.query(
        `INSERT INTO spin_wheel_requests
          (user_id, request_key, segment_id, amount, label, spin_tokens_after, segments_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          userId,
          requestKey,
          selectedSegment.id,
          amount,
          selectedSegment.label,
          updatedUser.spin_tokens,
          JSON.stringify(segments),
        ],
      );

      await client.query("COMMIT");
      transactionOpen = false;
      return {
        status: "completed",
        result: {
          segmentId: selectedSegment.id,
          amount: Number(amount),
          label: selectedSegment.label,
          spinTokens: updatedUser.spin_tokens,
          segments,
        },
      };
    } catch (error) {
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Spin wheel rollback failed:", rollbackError);
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // Settings
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting?.value || null;
  }

  async getSettings(): Promise<Record<string, string>> {
    const now = Date.now();
    if (this.settingsCache && this.settingsCache.expiresAt > now) {
      return { ...this.settingsCache.value };
    }

    // Coalesce concurrent public-page requests during a cold cache.
    if (!this.settingsLoad) {
      this.settingsLoad = (async () => {
        const allSettings = await db.select().from(platformSettings);
        const result: Record<string, string> = {};
        for (const s of allSettings) {
          result[s.key] = s.value;
        }
        this.settingsCache = {
          value: result,
          expiresAt: Date.now() + 5_000,
        };
        return result;
      })().finally(() => {
        this.settingsLoad = null;
      });
    }

    return { ...(await this.settingsLoad) };
  }

  async setSetting(key: string, value: string, modifiedBy?: number): Promise<void> {
    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    if (existing.length > 0) {
      await db.update(platformSettings).set({ value, modifiedBy, modifiedAt: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value, modifiedBy, modifiedAt: new Date() });
    }
    this.settingsCache = null;
  }

  // Admin
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer la date de réinitialisation des stats
    const statsResetDateStr = await this.getSetting("statsResetDate");
    const statsResetDate = statsResetDateStr ? new Date(statsResetDateStr) : new Date(0);
    
    const filterStart = startDate || new Date(0);
    const filterEnd = endDate || new Date();
    filterEnd.setHours(23, 59, 59, 999);

    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, statsResetDate));
    const [todayUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, today));
    const [periodUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(and(gte(users.createdAt, filterStart), lte(users.createdAt, filterEnd)));
    
    const [totalDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, statsResetDate)));
    const [todayDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, today)));
    const [periodDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, filterStart), lte(deposits.createdAt, filterEnd)));
    const [pendingDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`, count: sql<number>`count(*)` })
      .from(deposits).where(eq(deposits.status, "pending"));
    
    const [totalWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, statsResetDate)));
    const [todayWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, today)));
    const [periodWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, filterStart), lte(withdrawals.createdAt, filterEnd)));
    const [pendingWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`, count: sql<number>`count(*)` })
      .from(withdrawals).where(eq(withdrawals.status, "pending"));
    
    const [usersWithProductsResult] = await db.select({ count: sql<number>`count(DISTINCT ${userProducts.userId})` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    // Récupérer les valeurs baseline pour les compteurs cumulatifs
    const baselineBalance = parseFloat(await this.getSetting("baselineTotalBalance") || "0");
    const baselineEarnings = parseFloat(await this.getSetting("baselineTotalEarnings") || "0");
    const baselineCommissions = parseFloat(await this.getSetting("baselineTotalCommissions") || "0");
    
    const [totalBalanceResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalEarningsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalProductsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    const [totalCommissionsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(transactions).where(eq(transactions.type, "commission"));

    // Soustraire les valeurs baseline pour obtenir les stats depuis la réinitialisation
    const adjustedBalance = Math.max(0, parseFloat(totalBalanceResult?.total || "0") - baselineBalance);
    const adjustedEarnings = Math.max(0, parseFloat(totalEarningsResult?.total || "0") - baselineEarnings);
    const adjustedCommissions = Math.max(0, parseFloat(totalCommissionsResult?.total || "0") - baselineCommissions);

    return {
      totalUsers: totalUsersResult?.count || 0,
      todayUsers: todayUsersResult?.count || 0,
      periodUsers: periodUsersResult?.count || 0,
      totalDeposits: parseFloat(totalDepositsResult?.total || "0"),
      todayDeposits: parseFloat(todayDepositsResult?.total || "0"),
      periodDeposits: parseFloat(periodDepositsResult?.total || "0"),
      pendingDeposits: parseFloat(pendingDepositsResult?.total || "0"),
      pendingDepositsCount: pendingDepositsResult?.count || 0,
      totalWithdrawals: parseFloat(totalWithdrawalsResult?.total || "0"),
      todayWithdrawals: parseFloat(todayWithdrawalsResult?.total || "0"),
      periodWithdrawals: parseFloat(periodWithdrawalsResult?.total || "0"),
      pendingWithdrawals: parseFloat(pendingWithdrawalsResult?.total || "0"),
      pendingWithdrawalsCount: pendingWithdrawalsResult?.count || 0,
      usersWithProducts: usersWithProductsResult?.count || 0,
      totalBalance: adjustedBalance,
      totalEarnings: adjustedEarnings,
      totalActiveProducts: totalProductsResult?.count || 0,
      totalCommissions: adjustedCommissions,
    };
  }

  async logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void> {
    await db.insert(adminAuditLog).values({ adminId, action, targetUserId, details });
  }

  async resetStats(): Promise<void> {
    // Stocke la date de réinitialisation - les stats ne comptent que les données après cette date
    await this.setSetting("statsResetDate", new Date().toISOString());
    
    // Stocker les valeurs baseline pour les compteurs cumulatifs (solde et gains)
    const [currentBalance] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` }).from(users);
    const [currentEarnings] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` }).from(users);
    const [currentCommissions] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(transactions).where(eq(transactions.type, "commission"));
    
    await this.setSetting("baselineTotalBalance", currentBalance?.total || "0");
    await this.setSetting("baselineTotalEarnings", currentEarnings?.total || "0");
    await this.setSetting("baselineTotalCommissions", currentCommissions?.total || "0");
  }

  // Gift Codes
  async getAllGiftCodes(): Promise<GiftCode[]> {
    return await db.select().from(giftCodes).orderBy(desc(giftCodes.createdAt));
  }

  async getGiftCodeByCode(code: string): Promise<GiftCode | undefined> {
    const [giftCode] = await db.select().from(giftCodes).where(
      sql`UPPER(${giftCodes.code}) = UPPER(${code})`
    );
    return giftCode || undefined;
  }

  async createGiftCode(data: {
    code: string;
    amount: string;
    amountMin?: string | null;
    amountMax?: string | null;
    maxUses: number;
    expiresAt: Date;
    createdBy: number;
  }): Promise<GiftCode> {
    const [giftCode] = await db.insert(giftCodes).values(data).returning();
    return giftCode;
  }

  async deleteGiftCode(id: number): Promise<void> {
    await db.delete(giftCodes).where(eq(giftCodes.id, id));
  }

  async hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean> {
    const [claim] = await db.select().from(giftCodeClaims).where(
      and(eq(giftCodeClaims.userId, userId), eq(giftCodeClaims.giftCodeId, giftCodeId))
    );
    return !!claim;
  }

  async claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(giftCodeClaims).values({ userId, giftCodeId });
      await tx.update(giftCodes).set({
        currentUses: sql`${giftCodes.currentUses} + 1`
      }).where(eq(giftCodes.id, giftCodeId));
      await tx.update(users).set({
        totalEarnings: sql`${users.totalEarnings} + ${amount}`
      }).where(eq(users.id, userId));
      await tx.insert(transactions).values({
        userId,
        type: "gift_code",
        amount: amount.toString(),
        description: `Bonus code cadeau`
      });
    });
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries).orderBy(asc(countries.name));
  }

  async getActiveCountries(): Promise<Country[]> {
    return await db.select().from(countries)
      .where(eq(countries.isActive, true))
      .orderBy(asc(countries.name));
  }

  async getCountry(id: number): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country || undefined;
  }

  async createCountry(data: Partial<Country>): Promise<Country> {
    const [country] = await db.insert(countries).values(data as any).returning();
    return country;
  }

  async updateCountry(id: number, data: Partial<Country>): Promise<Country> {
    const [country] = await db.update(countries).set(data as any).where(eq(countries.id, id)).returning();
    return country;
  }

  async deleteCountry(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [country] = await tx.select({ id: countries.id, code: countries.code })
        .from(countries)
        .where(eq(countries.id, id))
        .for("update")
        .limit(1);
      if (!country) {
        const error = new Error("Pays introuvable.");
        error.name = "CountryNotFoundError";
        throw error;
      }

      const usersWithCountry = await tx.select({ id: users.id })
        .from(users).where(eq(users.country, country.code)).limit(1);
      const depositsWithCountry = await tx.select({ id: deposits.id })
        .from(deposits).where(eq(deposits.country, country.code)).limit(1);
      const withdrawalsWithCountry = await tx.select({ id: withdrawals.id })
        .from(withdrawals).where(eq(withdrawals.country, country.code)).limit(1);
      const walletsWithCountry = await tx.select({ id: withdrawalWallets.id })
        .from(withdrawalWallets).where(eq(withdrawalWallets.country, country.code)).limit(1);
      const channelsWithCountry = await tx.select({ id: depositChannels.id })
        .from(depositChannels).where(eq(depositChannels.country, country.code)).limit(1);
      const paymentNumbersWithCountry = await tx.select({ id: paymentNumbers.id })
        .from(paymentNumbers).where(eq(paymentNumbers.country, country.code)).limit(1);

      if (
        usersWithCountry.length ||
        depositsWithCountry.length ||
        withdrawalsWithCountry.length ||
        walletsWithCountry.length ||
        channelsWithCountry.length ||
        paymentNumbersWithCountry.length
      ) {
        const error = new Error(
          "Ce pays est encore utilisé par des comptes ou des opérations. Désactivez-le à la place.",
        );
        error.name = "CountryInUseError";
        throw error;
      }

      await tx.delete(countries).where(eq(countries.id, id));
    });
  }

  // Deposit Channels
  async getDepositChannels(): Promise<DepositChannel[]> {
    return await db.select().from(depositChannels)
      .orderBy(depositChannels.sortOrder, depositChannels.createdAt);
  }

  async getDepositChannelsByCountry(country: string): Promise<DepositChannel[]> {
    return await db.select().from(depositChannels)
      .where(and(eq(depositChannels.country, country), eq(depositChannels.isActive, true)))
      .orderBy(depositChannels.sortOrder);
  }

  async getDepositChannel(id: number): Promise<DepositChannel | undefined> {
    const [ch] = await db.select().from(depositChannels).where(eq(depositChannels.id, id));
    return ch || undefined;
  }

  async createDepositChannel(data: Partial<DepositChannel>): Promise<DepositChannel> {
    const [ch] = await db.insert(depositChannels).values(data as any).returning();
    return ch;
  }

  async updateDepositChannel(id: number, data: Partial<DepositChannel>): Promise<DepositChannel> {
    const [ch] = await db.update(depositChannels).set(data as any).where(eq(depositChannels.id, id)).returning();
    return ch;
  }

  async deleteDepositChannel(id: number): Promise<void> {
    await db.delete(depositChannels).where(eq(depositChannels.id, id));
  }

  // Payment Numbers
  async getPaymentNumbers(): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers).orderBy(desc(paymentNumbers.createdAt));
  }

  async getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers)
      .where(and(eq(paymentNumbers.country, country), eq(paymentNumbers.isActive, true)))
      .orderBy(paymentNumbers.operatorName);
  }

  async getPaymentNumbersByChannel(channelId: number): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers)
      .where(and(eq(paymentNumbers.channelId, channelId), eq(paymentNumbers.isActive, true)))
      .orderBy(paymentNumbers.operatorName);
  }

  async createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.insert(paymentNumbers).values(data as any).returning();
    return num;
  }

  async updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.update(paymentNumbers).set(data as any).where(eq(paymentNumbers.id, id)).returning();
    return num;
  }

  async deletePaymentNumber(id: number): Promise<void> {
    await db.delete(paymentNumbers).where(eq(paymentNumbers.id, id));
  }

  // Staking Products
  async getStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts).orderBy(stakingProducts.createdAt);
  }

  async getActiveStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts)
      .where(eq(stakingProducts.isActive, true))
      .orderBy(stakingProducts.launchDate);
  }

  async getStakingProduct(id: number): Promise<StakingProduct | undefined> {
    const [sp] = await db.select().from(stakingProducts).where(eq(stakingProducts.id, id));
    return sp || undefined;
  }

  async createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.insert(stakingProducts).values(data as any).returning();
    return sp;
  }

  async updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.update(stakingProducts).set(data as any).where(eq(stakingProducts.id, id)).returning();
    return sp;
  }

  async deleteStakingProduct(id: number): Promise<void> {
    await db.delete(stakingProducts).where(eq(stakingProducts.id, id));
  }

  async purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking> {
    const sp = await this.getStakingProduct(stakingProductId);
    if (!sp) throw new Error("Produit de staking introuvable");
    if (!sp.isActive) throw new Error("Produit de staking inactif");

    const now = new Date();
    if (sp.launchDate && new Date(sp.launchDate) > now) {
      throw new Error("Ce produit n'est pas encore disponible à l'achat");
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur introuvable");
    if (parseFloat(user.balance) < sp.price) {
      throw new Error(`Solde insuffisant. Il vous manque ${(sp.price - parseFloat(user.balance)).toLocaleString()} XOF`);
    }

    // Check user has at least one active regular product
    const activeProds = await db.select().from(userProducts)
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    if (activeProds.length === 0) {
      throw new Error("Vous devez posséder un produit actif avant d'accéder au Staking");
    }

    const releaseDate = new Date(now.getTime() + sp.lockDays * 24 * 60 * 60 * 1000);

    const [staking] = await db.insert(userStakings).values({
      userId,
      stakingProductId,
      amountPaid: sp.price,
      returnAmount: sp.returnAmount,
      purchasedAt: now,
      releaseDate,
      status: "active",
    }).returning();

    // Deduct balance
    const newBalance = (parseFloat(user.balance) - sp.price).toFixed(2);
    await this.updateUser(userId, { balance: newBalance });

    await this.createTransaction({
      userId,
      type: "staking",
      amount: (-sp.price).toString(),
      description: `Staking: ${sp.name}`,
    });

    return staking;
  }

  async getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .where(eq(userStakings.userId, userId))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product }));
  }

  async getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts, user: users })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .innerJoin(users, eq(userStakings.userId, users.id))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product, user: r.user }));
  }

  async releaseMaturedStakings(): Promise<void> {
    const now = new Date();
    const matured = await db.select().from(userStakings)
      .where(and(eq(userStakings.status, "active"), lte(userStakings.releaseDate, now)));

    for (const staking of matured) {
      try {
        const user = await this.getUser(staking.userId);
        if (!user) continue;
        const newBalance = (parseFloat(user.balance) + staking.returnAmount).toFixed(2);
        await this.updateUser(staking.userId, { balance: newBalance });
        await db.update(userStakings)
          .set({ status: "released", releasedAt: now })
          .where(eq(userStakings.id, staking.id));
        await this.createTransaction({
          userId: staking.userId,
          type: "staking_release",
          amount: staking.returnAmount.toString(),
          description: `Déblocage staking #${staking.id}`,
        });
      } catch (e) {
        console.error("Error releasing staking:", staking.id, e);
      }
    }
  }

  // ── Product Series ──────────────────────────────────────────────────────────
  async getAllProductsAdmin(): Promise<Product[]> {
    return db.select().from(products).orderBy(products.sortOrder);
  }

  async getProductInviteCount(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    const refs = await this.getReferrals(userId, 1);
    return refs.length;
  }
}

export const storage = new DatabaseStorage();
