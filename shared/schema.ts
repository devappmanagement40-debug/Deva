import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, numeric, serial, uniqueIndex, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { SpinWheelSegment } from "./spin-wheel";
import { isCountryCode } from "./country-codes";

// Countries table (admin-managed)
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  phonePrefix: text("phone_prefix").notNull(),
  operators: text("operators").notNull().default("[]"), // JSON array string
  isActive: boolean("is_active").notNull().default(true),
  autoPaymentEnabled: boolean("auto_payment_enabled").notNull().default(false), // true = auto deposits (Soleaspay), false = manual (payment numbers)
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  password: text("password").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  todayEarnings: decimal("today_earnings", { precision: 15, scale: 2 }).notNull().default("0"),
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).notNull().default("0"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  isWithdrawalBlocked: boolean("is_withdrawal_blocked").notNull().default(false),
  isPromoter: boolean("is_promoter").notNull().default(false),
  mustInviteToWithdraw: boolean("must_invite_to_withdraw").notNull().default(false),
  hasDeposited: boolean("has_deposited").notNull().default(false),
  hasActiveProduct: boolean("has_active_product").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastFreeProductClaim: timestamp("last_free_product_claim"),
  lastDailyBonusClaim: timestamp("last_daily_bonus_claim"),
  promoterSetBy: integer("promoter_set_by"),
  adminSetBy: integer("admin_set_by"),
  adminSetAt: timestamp("admin_set_at"),
  adminPin: text("admin_pin"),
  isAdminPasswordRequired: boolean("is_admin_password_required").notNull().default(true),
  isBanker: boolean("is_banker").notNull().default(false),
  bankerSetBy: integer("banker_set_by"),
  spinTokens: integer("spin_tokens").notNull().default(0),
  telegram: text("telegram"),
  transactionPassword: text("transaction_password"),
  mustResetTransactionPassword: boolean("must_reset_transaction_password").notNull().default(false),
}, (table) => [
  uniqueIndex("users_phone_country_unique").on(table.phone, table.country),
]);

// Legacy referral codes kept so links shared before the code-format migration
// continue to resolve to the same account.
export const referralCodeAliases = pgTable("referral_code_aliases", {
  id: serial("id").primaryKey(),
  aliasCode: text("alias_code").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReferralCodeAlias = typeof referralCodeAliases.$inferSelect;

// Withdrawal wallets
export const withdrawalWallets = pgTable("withdrawal_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  paymentMethod: text("payment_method").notNull(),
  country: text("country").notNull(),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Product series table
export const productSeries = pgTable("product_series", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProductSeries = typeof productSeries.$inferSelect;
export type InsertProductSeries = typeof productSeries.$inferInsert;

// Products table
export const PRODUCT_TYPES = ["all", "stability", "wellness", "activity"] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productType: text("product_type").$type<ProductType>().notNull().default("all"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  dailyEarnings: decimal("daily_earnings", { precision: 15, scale: 2 }).notNull(),
  cycleDays: integer("cycle_days").notNull().default(80),
  totalReturn: decimal("total_return", { precision: 15, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isFree: boolean("is_free").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // Series & purchase conditions
  seriesId: integer("series_id").references(() => productSeries.id),
  minInviteCount: integer("min_invite_count").notNull().default(0),   // 0 = aucune condition
  maxOwned: integer("max_owned").notNull().default(0),                // 0 = illimité
  // Legacy payout mode retained to interpret uncredited earnings on old purchases.
  collectAtEnd: boolean("collect_at_end").notNull().default(false),
  // Stock saturation 0-100 (admin-controlled). At 100 → product is sold out / FAKE
  stockPercentage: integer("stock_percentage").notNull().default(0),
  // Unavailable: product not yet open — purchase blocked, shows "Unavailable" badge
  isUnavailable: boolean("is_unavailable").notNull().default(false),
});

export type ProductSnapshot = typeof products.$inferSelect;

// User products (investments)
export const userProducts = pgTable("user_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productSnapshot: jsonb("product_snapshot").$type<ProductSnapshot>(),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  lastEarningDate: timestamp("last_earning_date"),
  daysRemaining: integer("days_remaining").notNull(),
  totalEarned: decimal("total_earned", { precision: 15, scale: 2 }).notNull().default("0"),
  pendingEarnings: decimal("pending_earnings", { precision: 15, scale: 2 }).notNull().default("0"),
  earningsPaidAt: timestamp("earnings_paid_at"),
  isActive: boolean("is_active").notNull().default(true),
  assignedByAdmin: boolean("assigned_by_admin").notNull().default(false),
});

// Deposits
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  country: text("country").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentChannelId: integer("payment_channel_id"),
  paymentNumberId: integer("payment_number_id"),
  channelName: text("channel_name"),
  screenshot: text("screenshot"),
  paymentMessage: text("payment_message"),
  reference: text("reference"),
  status: text("status").notNull().default("pending"),
  soleaspayReference: text("soleaspay_reference"),
  soleaspayOrderId: text("soleaspay_order_id"),
  inpayOrderNumber: text("inpay_order_number"),
  inpayOutTradeNo: text("inpay_out_trade_no"),
  omnipayId: text("omnipay_id"),
  omnipayReference: text("omnipay_reference"),
  nowPaymentsStatus: text("nowpayments_status"),
  nowPaymentsExpectedAmount: text("nowpayments_expected_amount"),
  nowPaymentsExpectedCurrency: text("nowpayments_expected_currency"),
  nowPaymentsActuallyPaid: text("nowpayments_actually_paid"),
  nowPaymentsOutcomeAmount: text("nowpayments_outcome_amount"),
  nowPaymentsOutcomeCurrency: text("nowpayments_outcome_currency"),
  nowPaymentsError: text("nowpayments_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by"),
}, (table) => ({
  depositIssueReferenceUnique: uniqueIndex("deposits_issue_reference_unique")
    .on(table.reference)
    .where(sql`${table.paymentMethod} = 'Deposit issue' AND ${table.reference} IS NOT NULL`),
}));

// Share information reports
export const shareReports = pgTable("share_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shareLink: text("share_link").notNull(),
  proofImage: text("proof_image").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by"),
});

export type WithdrawalProofStatus = "pending" | "approved" | "rejected";

export const withdrawalProofs = pgTable("withdrawal_proofs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  proofImage: text("proof_image").notNull(),
  proofImage2: text("proof_image_2"),
  message: text("message").notNull(),
  status: text("status").$type<WithdrawalProofStatus>().notNull().default("pending"),
  shareBonusXof: integer("share_bonus_xof").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id, { onDelete: "set null" }),
});

export type SupportChatSenderRole = "user" | "admin";
export type SupportChatAttachmentType = "image" | "video" | "file";

export const supportChatMessages = pgTable("support_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "set null" }),
  senderRole: text("sender_role").$type<SupportChatSenderRole>().notNull(),
  message: text("message").notNull().default(""),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type").$type<SupportChatAttachmentType>(),
  attachmentName: text("attachment_name"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("support_chat_messages_user_created_idx").on(table.userId, table.createdAt),
  index("support_chat_messages_attachment_url_idx").on(table.attachmentUrl),
]);

// Withdrawals
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  netAmount: integer("net_amount").notNull(),
  fees: integer("fees").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  country: text("country").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  inpayOrderNumber: text("inpay_order_number"),
  inpayOutTradeNo: text("inpay_out_trade_no"),
  omnipayId: text("omnipay_id"),
  omnipayReference: text("omnipay_reference"),
  nowPaymentsPayoutId: text("nowpayments_payout_id"),
  nowPaymentsBatchId: text("nowpayments_batch_id"),
  nowPaymentsExternalId: text("nowpayments_external_id"),
  nowPaymentsStatus: text("nowpayments_status"),
  nowPaymentsHash: text("nowpayments_hash"),
  nowPaymentsError: text("nowpayments_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by"),
});

// Payment channels (kept for withdrawal compatibility)
export const paymentChannels = pgTable("payment_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  redirectUrl: text("redirect_url").notNull(),
  isApi: boolean("is_api").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  modifiedBy: integer("modified_by"),
  modifiedAt: timestamp("modified_at"),
});

// Staking products (created by admin, locked funds)
export const stakingProducts = pgTable("staking_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  returnAmount: integer("return_amount").notNull(),
  lockDays: integer("lock_days").notNull(),
  launchDate: timestamp("launch_date"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
});
export type StakingProduct = typeof stakingProducts.$inferSelect;
export type InsertStakingProduct = typeof stakingProducts.$inferInsert;

// User stakings (purchases)
export const userStakings = pgTable("user_stakings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stakingProductId: integer("staking_product_id").notNull().references(() => stakingProducts.id),
  amountPaid: integer("amount_paid").notNull(),
  returnAmount: integer("return_amount").notNull(),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  releaseDate: timestamp("release_date").notNull(),
  status: text("status").notNull().default("active"),
  releasedAt: timestamp("released_at"),
});
export type UserStaking = typeof userStakings.$inferSelect;
export type InsertUserStaking = typeof userStakings.$inferInsert;

// Deposit channels (Canal 1, Canal 2 … — admin-managed, groups operators)
export const depositChannels = pgTable("deposit_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),            // "Canal 1", "Canal 2"
  description: text("description"),
  country: text("country").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
});
export type DepositChannel = typeof depositChannels.$inferSelect;
export type InsertDepositChannel = typeof depositChannels.$inferInsert;

// Payment numbers (operators — belong to a deposit channel)
export const paymentNumbers = pgTable("payment_numbers", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  operatorName: text("operator_name").notNull(),
  country: text("country").notNull(),
  channelId: integer("channel_id"),        // FK → deposit_channels.id (soft, nullable)
  logoUrl: text("logo_url"),
  paymentRecipientLabel: text("payment_recipient_label"),
  paymentBadgeLabel: text("payment_badge_label"),
  ussdTemplate: text("ussd_template"),
  paymentUrl: text("payment_url"),
  paymentQrDataUrl: text("payment_qr_data_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
});
export type PaymentNumber = typeof paymentNumbers.$inferSelect;
export type InsertPaymentNumber = typeof paymentNumbers.$inferInsert;

// Referral commissions
export const referralCommissions = pgTable("referral_commissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  level: integer("level").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  productId: integer("product_id").references(() => products.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requiredInvites: integer("required_invites").notNull(),
  reward: numeric("reward", { precision: 15, scale: 2, mode: "number" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// User completed tasks
export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  rewardClaimed: boolean("reward_claimed").notNull().default(true),
  taskNameSnapshot: text("task_name_snapshot"),
  taskDescriptionSnapshot: text("task_description_snapshot"),
  requiredInvitesSnapshot: integer("required_invites_snapshot"),
  rewardSnapshot: numeric("reward_snapshot", { precision: 15, scale: 2, mode: "number" }),
}, (table) => ({
  userTaskUnique: uniqueIndex("user_tasks_user_task_unique").on(table.userId, table.taskId),
}));

// Transaction history
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("transactions_type_created_at_idx").on(table.type, table.createdAt),
  index("transactions_user_type_created_at_idx").on(table.userId, table.type, table.createdAt),
]);

// A successful wheel request and its exact prize display are stored together
// so a retried request can return the original result without a second credit.
export const spinWheelRequests = pgTable("spin_wheel_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestKey: text("request_key").notNull(),
  segmentId: integer("segment_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  label: text("label").notNull(),
  spinTokensAfter: integer("spin_tokens_after").notNull(),
  segmentsSnapshot: jsonb("segments_snapshot").$type<SpinWheelSegment[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userRequestUnique: uniqueIndex("spin_wheel_requests_user_request_unique")
    .on(table.userId, table.requestKey),
}));

// Platform settings
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  modifiedBy: integer("modified_by"),
  modifiedAt: timestamp("modified_at"),
});

// Legacy storage retained to avoid deleting existing records when syncing the schema.
// The Company page, its routes, APIs, and administration have been removed.
export const companyContent = pgTable("company_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Admin audit log
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetUserId: integer("target_user_id"),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Raw webhook delivery log (diagnostic: records every inbound webhook call,
// before signature validation, so we can tell whether the gateway actually
// reached our server vs. never called it).
export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  method: text("method").notNull(),
  headers: text("headers").notNull(),
  body: text("body").notNull(),
  signatureValid: boolean("signature_valid"),
  outcome: text("outcome").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Gift codes
export const giftCodes = pgTable("gift_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  amountMin: decimal("amount_min", { precision: 15, scale: 2 }),
  amountMax: decimal("amount_max", { precision: 15, scale: 2 }),
  maxUses: integer("max_uses").notNull(),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Gift code claims
export const giftCodeClaims = pgTable("gift_code_claims", {
  id: serial("id").primaryKey(),
  giftCodeId: integer("gift_code_id").notNull().references(() => giftCodes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  products: many(userProducts),
  deposits: many(deposits),
  shareReports: many(shareReports),
  withdrawalProofs: many(withdrawalProofs),
  withdrawals: many(withdrawals),
  wallets: many(withdrawalWallets),
  commissionsReceived: many(referralCommissions, { relationName: "receiver" }),
  commissionsGiven: many(referralCommissions, { relationName: "giver" }),
  tasks: many(userTasks),
  transactions: many(transactions),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.referralCode],
    relationName: "referrals",
  }),
  referrals: many(users, { relationName: "referrals" }),
}));

export const userProductsRelations = relations(userProducts, ({ one }) => ({
  user: one(users, { fields: [userProducts.userId], references: [users.id] }),
  product: one(products, { fields: [userProducts.productId], references: [products.id] }),
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  user: one(users, { fields: [deposits.userId], references: [users.id] }),
  channel: one(paymentChannels, { fields: [deposits.paymentChannelId], references: [paymentChannels.id] }),
}));

export const shareReportsRelations = relations(shareReports, ({ one }) => ({
  user: one(users, { fields: [shareReports.userId], references: [users.id] }),
}));

export const withdrawalProofsRelations = relations(withdrawalProofs, ({ one }) => ({
  user: one(users, { fields: [withdrawalProofs.userId], references: [users.id] }),
  reviewer: one(users, { fields: [withdrawalProofs.processedBy], references: [users.id] }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, { fields: [withdrawals.userId], references: [users.id] }),
}));

export const referralCommissionsRelations = relations(referralCommissions, ({ one }) => ({
  receiver: one(users, { fields: [referralCommissions.userId], references: [users.id], relationName: "receiver" }),
  giver: one(users, { fields: [referralCommissions.fromUserId], references: [users.id], relationName: "giver" }),
  product: one(products, { fields: [referralCommissions.productId], references: [products.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  todayEarnings: true,
  totalEarnings: true,
  isAdmin: true,
  isSuperAdmin: true,
  isBanned: true,
  isWithdrawalBlocked: true,
  isPromoter: true,
  mustInviteToWithdraw: true,
  mustResetTransactionPassword: true,
  hasDeposited: true,
  hasActiveProduct: true,
  createdAt: true,
  lastFreeProductClaim: true,
  promoterSetBy: true,
  adminSetBy: true,
  adminSetAt: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({ id: true });

export const registerSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().refine(
    isCountryCode,
    "Le code pays doit contenir deux lettres majuscules",
  ),
  password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères"),
  invitationCode: z.string().optional(),
  transactionPassword: z.string().optional(),
  telegram: z.string().optional(),
  captchaCode: z.string().trim().min(1, "Le code de vérification est requis"),
});

export const loginSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().refine(
    isCountryCode,
    "Le code pays doit contenir deux lettres majuscules",
  ),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const depositSchema = z.object({
  amount: z.number().min(1, "Le montant minimum est de 1 XOF"),
  accountName: z.string().min(2, "Le nom du compte est requis"),
  accountNumber: z.string().min(8, "Le numéro de paiement est requis"),
  country: z.string().min(2, "Le pays est requis"),
  paymentMethod: z.string().min(2, "Le moyen de paiement est requis"),
  paymentChannelId: z.number(),
});

export const withdrawalSchema = z.object({
  amount: z.number().min(1, "Le montant minimum est de 1 XOF"),
});

export const walletSchema = z.object({
  accountName: z.string().min(2, "Le nom du compte est requis"),
  accountNumber: z.string().min(8, "Le numéro est requis"),
  paymentMethod: z.string().min(2, "Le moyen de paiement est requis"),
  country: z.string().min(2, "Le pays est requis"),
});

export const giftCodeSchema = z.object({
  code: z.string().min(4, "Le code doit avoir au moins 4 caracteres"),
  amount: z.number().min(1, "Le montant doit etre positif").optional(),
  amountMin: z.number().min(0.01, "Le montant minimum doit etre positif").optional(),
  amountMax: z.number().min(0.01, "Le montant maximum doit etre positif").optional(),
  randomAmount: z.boolean().optional(),
  maxUses: z.number().min(1, "Le nombre d'utilisations doit etre au moins 1"),
  expiresAt: z.string(),
});

// Types
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type UserProduct = typeof userProducts.$inferSelect;
export type Deposit = typeof deposits.$inferSelect;
export type ShareReport = typeof shareReports.$inferSelect;
export type WithdrawalProof = typeof withdrawalProofs.$inferSelect;
export type SupportChatMessage = typeof supportChatMessages.$inferSelect;
export type SupportChatConversation = {
  user: Pick<User, "id" | "fullName" | "phone" | "country">;
  lastMessage: Pick<SupportChatMessage, "message" | "senderRole" | "attachmentType" | "attachmentName" | "createdAt">;
  unreadCount: number;
};
export type Withdrawal = typeof withdrawals.$inferSelect;
export type WithdrawalWallet = typeof withdrawalWallets.$inferSelect;
export type PaymentChannel = typeof paymentChannels.$inferSelect;
export type ReferralCommission = typeof referralCommissions.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type UserTask = typeof userTasks.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type GiftCode = typeof giftCodes.$inferSelect;
export type GiftCodeClaim = typeof giftCodeClaims.$inferSelect;
