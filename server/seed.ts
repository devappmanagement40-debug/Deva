import { db } from "./db";
import { users, referralCodeAliases, products, tasks, paymentChannels, paymentNumbers, platformSettings, countries, stakingProducts, depositChannels, productSeries } from "@shared/schema";
import bcrypt from "bcryptjs";
import { and, asc, eq, sql } from "drizzle-orm";
import { REFERRAL_CODE_PATTERN, generateReferralCode } from "./referral-codes";
import {
  DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT,
  DEFAULT_SPIN_WHEEL_INVITE_TEXT,
  DEFAULT_SPIN_WHEEL_RULES_TEXT,
} from "@shared/spin-wheel";
import { DEFAULT_REFERRAL_COMMISSION_RATES } from "@shared/referral-commission-settings";
import { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "@shared/withdrawal-fees";
import { DEFAULT_WITHDRAWAL_OPERATORS_BY_COUNTRY } from "./country-operator-policy";

const REFERRAL_COMMISSION_DEFAULT_MIGRATION_KEY = "__migration_referral_commission_defaults_v1";
const COUNTRY_BOOTSTRAP_MIGRATION_KEY = "__migration_country_bootstrap_v1";
const COUNTRY_WITHDRAWAL_OPERATOR_POLICY_MIGRATION_KEY = "__migration_country_withdrawal_operator_policy_v1";

async function migrateReferralCodes(): Promise<number> {
  return db.transaction(async (tx) => {
    const existingUsers = await tx.select().from(users).orderBy(asc(users.id));
    let migratedCount = 0;

    for (const user of existingUsers) {
      const originalCode = user.referralCode.trim();
      const normalizedCode = originalCode.toUpperCase();
      if (!normalizedCode) {
        throw new Error(`Utilisateur ${user.id} sans code de parrainage`);
      }

      // New-format codes are already safe to expose. Normalize any legacy
      // lowercase variant without creating an unnecessary alias.
      if (REFERRAL_CODE_PATTERN.test(normalizedCode)) {
        if (originalCode !== normalizedCode) {
          await tx.update(users)
            .set({ referralCode: normalizedCode })
            .where(eq(users.id, user.id));
          await tx.update(users)
            .set({ referredBy: normalizedCode })
            .where(sql`UPPER(${users.referredBy}) = ${normalizedCode}`);
          migratedCount++;
        }
        continue;
      }

      let newCode = "";
      for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = generateReferralCode();
        const [currentCode] = await tx.select({ id: users.id })
          .from(users)
          .where(sql`UPPER(${users.referralCode}) = ${candidate}`);
        const [aliasCode] = await tx.select({ id: referralCodeAliases.id })
          .from(referralCodeAliases)
          .where(sql`UPPER(${referralCodeAliases.aliasCode}) = ${candidate}`);
        if (!currentCode && !aliasCode) {
          newCode = candidate;
          break;
        }
      }
      if (!newCode) {
        throw new Error(`Impossible de générer un nouveau code pour l'utilisateur ${user.id}`);
      }

      const [existingAlias] = await tx.select({ userId: referralCodeAliases.userId })
        .from(referralCodeAliases)
        .where(sql`UPPER(${referralCodeAliases.aliasCode}) = ${normalizedCode}`);
      if (existingAlias && existingAlias.userId !== user.id) {
        throw new Error(`Alias de parrainage en conflit: ${normalizedCode}`);
      }

      await tx.insert(referralCodeAliases)
        .values({ aliasCode: normalizedCode, userId: user.id })
        .onConflictDoNothing({ target: referralCodeAliases.aliasCode });

      await tx.update(users)
        .set({ referralCode: newCode })
        .where(eq(users.id, user.id));

      // Move all stored relationships to the new canonical code. Existing
      // links still resolve through referral_code_aliases.
      await tx.update(users)
        .set({ referredBy: newCode })
        .where(sql`UPPER(${users.referredBy}) = ${normalizedCode}`);

      migratedCount++;
    }

    return migratedCount;
  });
}

export async function seed() {
  console.log("Seeding database...");

  // ─── Schema migrations (run FIRST, before any table access) ─────────────────
  // Product series table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product_series" (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL,
      "sort_order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp NOT NULL DEFAULT now()
    )
  `);
  // New columns on products
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_type" text NOT NULL DEFAULT 'stability'`);
  await db.execute(sql`ALTER TABLE "products" ALTER COLUMN "product_type" SET DEFAULT 'stability'`);
  await db.execute(sql`UPDATE "products" SET "product_type" = 'stability' WHERE "product_type" IS NULL OR "product_type" = 'all'`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "series_id" integer REFERENCES "product_series"("id")`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_invite_count" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "max_owned" integer NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "collect_at_end" boolean NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock_percentage" integer NOT NULL DEFAULT 0`);

  // Existing purchases did not store the product definition used at purchase.
  // Preserve the currently linked catalog values as their immutable baseline.
  await db.execute(sql`
    UPDATE "user_products" AS up
    SET "product_snapshot" = jsonb_build_object(
      'id', p."id",
      'name', p."name",
      'productType', p."product_type",
      'price', p."price"::text,
      'dailyEarnings', p."daily_earnings"::text,
      'cycleDays', p."cycle_days",
      'totalReturn', p."total_return"::text,
      'imageUrl', p."image_url",
      'isFree', p."is_free",
      'isActive', p."is_active",
      'sortOrder', p."sort_order",
      'seriesId', p."series_id",
      'minInviteCount', p."min_invite_count",
      'maxOwned', p."max_owned",
      'collectAtEnd', p."collect_at_end",
      'stockPercentage', p."stock_percentage",
      'isUnavailable', p."is_unavailable"
    )
    FROM "products" AS p
    WHERE up."product_id" = p."id"
      AND up."product_snapshot" IS NULL
  `);

  // Create session table for connect-pg-simple (if not exists)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);

  // Ensure countries table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "countries" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "currency" text NOT NULL,
      "phone_prefix" text NOT NULL,
      "operators" text NOT NULL DEFAULT '[]',
      "is_active" boolean NOT NULL DEFAULT true
    )
  `);

  // Check if admin already exists
  const adminPhone = "0501682811";
  const existingAdmins = await db.select().from(users).where(eq(users.phone, adminPhone));
  const existingAdmin = existingAdmins.find((user) => user.referralCode === "ADMIN1" || user.isSuperAdmin);
  // Use ADMIN_PASSWORD only when creating the initial account. Existing
  // passwords are managed explicitly and must not be reset on every startup.
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPin = process.env.ADMIN_PIN || "1990";

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword || "44605058", 12);
    await db.insert(users).values({
      fullName: "Super Admin",
      phone: adminPhone,
      country: "CI",
      password: hashedPassword,
      referralCode: "ADMIN1",
      balance: "0",
      isAdmin: true,
      isSuperAdmin: true,
      adminPin,
    });
    console.log("Super admin created");
  } else {
    // Only update the identified admin account. Other countries can now
    // legitimately reuse this local phone number.
    const adminUpdate: {
      country: string;
      isAdmin: boolean;
      isSuperAdmin: boolean;
      adminPin: string;
      password?: string;
    } = { country: "CI", isAdmin: true, isSuperAdmin: true, adminPin };
    if (adminPassword) {
      adminUpdate.password = await bcrypt.hash(adminPassword, 12);
    }
    await db.update(users).set(adminUpdate).where(eq(users.id, existingAdmin.id));
    console.log("Super admin updated");
  }

  const migratedReferralCodes = await migrateReferralCodes();
  if (migratedReferralCodes > 0) {
    console.log(`${migratedReferralCodes} referral code(s) migrated; legacy aliases preserved`);
  }

  // Country defaults are a first-install bootstrap only. Do not recreate a
  // country after an administrator intentionally deletes it.
  const countryDefaults = [
    {
      code: "CD",
      name: "République démocratique du Congo",
      currency: "USDT",
      phonePrefix: "243",
      operators: JSON.stringify(["Airtel Money RDC", "Orange Money RDC", "M-Pesa RDC"]),
      isActive: true,
      autoPaymentEnabled: true,
    },
    {
      code: "CI",
      name: "Côte d’Ivoire",
      currency: "USDT",
      phonePrefix: "225",
      operators: JSON.stringify(DEFAULT_WITHDRAWAL_OPERATORS_BY_COUNTRY.CI),
      isActive: true,
      autoPaymentEnabled: false,
    },
    {
      code: "TG",
      name: "Togo",
      currency: "USDT",
      phonePrefix: "228",
      operators: JSON.stringify(DEFAULT_WITHDRAWAL_OPERATORS_BY_COUNTRY.TG),
      isActive: true,
      autoPaymentEnabled: false,
    },
  ];

  const countryBootstrapClaimed = await db.transaction(async (tx) => {
    const [claim] = await tx.insert(platformSettings)
      .values({ key: COUNTRY_BOOTSTRAP_MIGRATION_KEY, value: "complete" })
      .onConflictDoNothing()
      .returning({ id: platformSettings.id });
    if (!claim) return false;

    const [existingCountry] = await tx.select({ id: countries.id }).from(countries).limit(1);
    if (existingCountry) return false;

    for (const countryData of countryDefaults) {
      await tx.insert(countries).values(countryData);
      console.log(`Country added: ${countryData.name}`);
    }
    return true;
  });
  if (!countryBootstrapClaimed) {
    console.log("Country bootstrap already completed or country settings already exist");
  }

  // Withdrawal operator settings are stored separately from deposit channels
  // and receiving numbers. Apply this country-specific policy once to existing
  // rows, then leave future administrator edits untouched.
  const withdrawalOperatorPolicyMigrated = await db.transaction(async (tx) => {
    const [claim] = await tx.insert(platformSettings)
      .values({ key: COUNTRY_WITHDRAWAL_OPERATOR_POLICY_MIGRATION_KEY, value: "complete" })
      .onConflictDoNothing()
      .returning({ id: platformSettings.id });
    if (!claim) return false;

    for (const [code, operators] of Object.entries(DEFAULT_WITHDRAWAL_OPERATORS_BY_COUNTRY)) {
      const [country] = await tx.select({ id: countries.id })
        .from(countries)
        .where(eq(countries.code, code))
        .limit(1);
      if (!country) continue;

      await tx.update(countries)
        .set({ operators: JSON.stringify(operators) })
        .where(eq(countries.id, country.id));
    }
    return true;
  });
  if (withdrawalOperatorPolicyMigrated) {
    console.log("Country withdrawal operators configured: CI=Wave; TG=TMoney, Moov");
  }

  // Remove obsolete configuration and content fields from the previous rules page.
  for (const obsoleteKey of [
    "signupBonus",
    "signupBonusEnabled",
    "signupBonusAmount",
    "content_rulespage_s4Title",
  ]) {
    await db.delete(platformSettings).where(eq(platformSettings.key, obsoleteKey));
  }

  // Remove free products from DB if any still exist (migration)
  await db.delete(products).where(eq(products.isFree, true));

  // Seed products only if table is empty (first install only — never overwrite admin changes)
  const existingProducts = await db.select().from(products);
  if (existingProducts.filter(p => !p.isFree).length === 0) {
    const defaultProductPrice = 18;
    const defaultProductPriceStep = 10;
    const defaultProducts = [
      { name: "VIP 1", dailyEarnings: "300",   cycleDays: 360, totalReturn: "108000",    imageUrl: null, sortOrder: 1 },
      { name: "VIP 2", dailyEarnings: "800",   cycleDays: 360, totalReturn: "288000",    imageUrl: null, sortOrder: 2 },
      { name: "VIP 3", dailyEarnings: "1500",  cycleDays: 360, totalReturn: "540000",    imageUrl: null, sortOrder: 3 },
      { name: "VIP 4", dailyEarnings: "2000",  cycleDays: 360, totalReturn: "720000",    imageUrl: null, sortOrder: 4 },
      { name: "VIP 5", dailyEarnings: "3500",  cycleDays: 360, totalReturn: "1260000",   imageUrl: null, sortOrder: 5 },
      { name: "VIP 6", dailyEarnings: "10000", cycleDays: 360, totalReturn: "3600000",   imageUrl: null, sortOrder: 6 },
      { name: "VIP 7", dailyEarnings: "30000", cycleDays: 360, totalReturn: "10800000",  imageUrl: null, sortOrder: 7 },
      { name: "VIP 8", dailyEarnings: "60",    cycleDays: 360, totalReturn: "21600",     imageUrl: null, sortOrder: 8 },
      { name: "VIP 9", dailyEarnings: "120",   cycleDays: 360, totalReturn: "43200",     imageUrl: null, sortOrder: 9 },
    ].map((product) => ({
      ...product,
      price: String(defaultProductPrice + (product.sortOrder - 1) * defaultProductPriceStep),
    }));
    await db.insert(products).values(defaultProducts);
    console.log("Products seeded (first install)");
  } else {
    console.log(`Products skipped — ${existingProducts.length} existing products preserved`);
  }

  // Seed the initial catalog once. Afterward, admins are authoritative: intentional
  // deletions must not be recreated on the next application start.
  const newRewardTasks = [
    { name: "🎁 Récompense 1", description: "3 membres actifs requis",  requiredInvites: 3,  reward: 1000,  sortOrder: 1 },
    { name: "🎁 Récompense 2", description: "10 membres actifs requis", requiredInvites: 10, reward: 3000,  sortOrder: 2 },
    { name: "🎁 Récompense 3", description: "30 membres actifs requis", requiredInvites: 30, reward: 5000,  sortOrder: 3 },
    { name: "🎁 Récompense 4", description: "50 membres actifs requis", requiredInvites: 50, reward: 10000, sortOrder: 4 },
    { name: "🎁 Récompense 5", description: "100 membres actifs requis", requiredInvites: 100, reward: 30, sortOrder: 5 },
    { name: "🎁 Récompense 6", description: "150 membres actifs requis", requiredInvites: 150, reward: 70, sortOrder: 6 },
    { name: "🎁 Récompense 7", description: "300 membres actifs requis", requiredInvites: 300, reward: 240, sortOrder: 7 },
    { name: "🎁 Récompense 8", description: "500 membres actifs requis", requiredInvites: 500, reward: 500, sortOrder: 8 },
  ];
  const taskCatalogInitializedKey = "taskRewardsCatalogInitialized";
  await db.transaction(async (tx) => {
    const [initializationClaim] = await tx.insert(platformSettings)
      .values({ key: taskCatalogInitializedKey, value: "true" })
      .onConflictDoNothing()
      .returning({ id: platformSettings.id });
    if (!initializationClaim) return;

    const existingTasks = await tx.select({ id: tasks.id }).from(tasks);
    if (existingTasks.length === 0) {
      await tx.insert(tasks).values(newRewardTasks);
      console.log("Initial reward task catalog seeded");
    } else {
      console.log(`Existing reward task catalog preserved (${existingTasks.length} tasks)`);
    }
  });

  // ── Seed deposit channels CI (Canal 1 & Wave) ─────────────────────────────
  const existingDepositChannels = await db.select().from(depositChannels)
    .then(rows => rows.filter(r => r.country === "CI"));
  const hasCanal1 = existingDepositChannels.some(r => r.name === "Canal 1");
  const existingWaveChannel = existingDepositChannels.find(
    r => r.name === "Wave" || r.name === "Canal 2",
  );
  const hasWaveChannel = !!existingWaveChannel;

  let canal1Id: number | null = existingDepositChannels.find(r => r.name === "Canal 1")?.id ?? null;
  let canal2Id: number | null = existingWaveChannel?.id ?? null;

  if (!hasCanal1) {
    const [c1] = await db.insert(depositChannels).values({
      name: "Canal 1", description: "Paiement automatique via WestPay", country: "CI",
      isActive: true, sortOrder: 1, createdBy: 1,
    }).returning();
    canal1Id = c1.id;
    console.log("Deposit channel seeded: Canal 1 (CI)");
  } else {
    await db.update(depositChannels)
      .set({ description: "Paiement automatique via WestPay", isActive: true, sortOrder: 1 })
      .where(eq(depositChannels.id, canal1Id!));
    console.log("Deposit channel preserved: Canal 1 (CI)");
  }
  if (!hasWaveChannel) {
    const [c2] = await db.insert(depositChannels).values({
      name: "Wave", description: "Paiement manuel Wave", country: "CI",
      isActive: true, sortOrder: 2, createdBy: 1,
    }).returning();
    canal2Id = c2.id;
    console.log("Deposit channel seeded: Wave (CI)");
  } else {
    await db.update(depositChannels)
      .set({ name: "Wave", description: "Paiement manuel Wave", isActive: true, sortOrder: 2 })
      .where(eq(depositChannels.id, canal2Id!));
    console.log("Deposit channel preserved: Wave (CI)");
  }

  // ── Seed the manual Wave number for CI — linked to the Wave channel ─────
  const existingNums = await db.select().from(paymentNumbers);
  const ciByOperator = Object.fromEntries(
    existingNums.filter(n => n.country === "CI").map(n => [n.operatorName, n])
  );

  const waveNumber = ciByOperator["Wave"];
  if (!waveNumber) {
    await db.insert(paymentNumbers).values({
      ownerName: "Konan Yao",
      phone: "0701234567",
      operatorName: "Wave",
      country: "CI",
      channelId: canal2Id,
      logoUrl: null,
      isActive: true,
      createdBy: 1,
    });
    console.log("Payment number seeded: Wave (CI, Wave channel)");
  } else {
    await db.update(paymentNumbers)
      .set({ channelId: canal2Id, isActive: true })
      .where(eq(paymentNumbers.id, waveNumber.id));
    console.log("Payment number linked to Wave channel: Wave (CI)");
  }

  // Disable the old CI manual destinations so the Wave channel only exposes Wave.
  for (const legacyPhone of ["0507654321", "0101122334", "0708899001"]) {
    await db.update(paymentNumbers)
      .set({ isActive: false })
      .where(and(eq(paymentNumbers.country, "CI"), eq(paymentNumbers.phone, legacyPhone)));
  }

  // Check if payment channels exist
  const existingChannels = await db.select().from(paymentChannels);
  if (existingChannels.length === 0) {
    await db.insert(paymentChannels).values([
      { name: "LeekPay", redirectUrl: "https://leekpay.com/pay", isApi: false },
      { name: "FedaPay", redirectUrl: "https://fedapay.com/payment", isApi: false },
    ]);
    console.log("Payment channels seeded");
  }

  // Check if settings exist - apply new values for new keys or update existing
  const existingSettings = await db.select().from(platformSettings);
  for (const obsoleteKey of [
    "dailyBonusEnabled",
    "dailyBonusAmount",
    "taskLevel1Commission",
    "taskLevel2Commission",
    "taskLevel3Commission",
  ]) {
    await db.delete(platformSettings).where(eq(platformSettings.key, obsoleteKey));
  }
  const requiredSettings = [
    { key: "supportLink", value: "" },
    { key: "supportType", value: "telegram" },
    { key: "supportLabel", value: "Support client" },
    { key: "support2Link", value: "" },
    { key: "support2Type", value: "telegram" },
    { key: "support2Label", value: "Support client 2" },
    { key: "channelLink", value: "" },
    { key: "channelType", value: "telegram" },
    { key: "channelLabel", value: "Chaîne officielle" },
    { key: "groupLink", value: "" },
    { key: "groupType", value: "telegram" },
    { key: "groupLabel", value: "Groupe de discussion" },
    { key: "popupButtonLabel", value: "Rejoindre le groupe Telegram" },
    { key: "popupTitle", value: "DIAMANT" },
    { key: "popupLine1", value: "🚀 DIAMANT RDC : lancement officiel le 03/09/2026 !" },
    { key: "popupLine2", value: "🤝 Dépôt minimum : 2 500 XOF — Mobile Money et USDT BEP20" },
    { key: "popupLine3", value: "💚 Les frais de retrait sont affichés avant confirmation." },
    { key: "popupLine4", value: "" },
    { key: "popupLine5", value: "👥 Invitez vos amis et gagnez des commissions" },
    { key: "popupLine6", value: "🕘 Retraits et support disponibles de 09:00 à 17:00" },
    { key: "popupLine7", value: "🔥 Les gains sont crédités automatiquement à la fin du cycle du produit" },
    { key: "popupLine8", value: "📖 Consultez les règles DIAMANT avant toute opération" },
    { key: "floatingSupportTarget", value: "support1" },
    { key: "supportEnabled", value: "true" },
    { key: "support2Enabled", value: "false" },
    { key: "channelEnabled", value: "true" },
    { key: "groupEnabled", value: "false" },
    { key: "minDeposit", value: "2500" },
    { key: "depositPresetAmounts", value: "2500,5000,7000,10000,15000,20000,50000,70000" },
    { key: "minWithdrawal", value: "1000" },
    { key: "withdrawalEnabled", value: "true" },
    { key: "withdrawalMode", value: "manual" },
    { key: "withdrawalFees", value: String(DEFAULT_WITHDRAWAL_FEE_PERCENT) },
    { key: "withdrawalStartHour", value: "9" },
    { key: "withdrawalEndHour", value: "17" },
    { key: "maxWithdrawalsPerDay", value: "1" },
    { key: "level1Commission", value: DEFAULT_REFERRAL_COMMISSION_RATES.level1Commission },
    { key: "level2Commission", value: DEFAULT_REFERRAL_COMMISSION_RATES.level2Commission },
    { key: "level3Commission", value: DEFAULT_REFERRAL_COMMISSION_RATES.level3Commission },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "Soleaspay" },
    { key: "omnipayEnabled", value: "false" },
    { key: "omnipayChannelName", value: "OmniPay" },
    { key: "omnipayCallbackKey", value: "" },
    { key: "westpayMerchantSlug", value: "" },
    { key: "westpayWebhookSecret", value: "" },
    // Clés API WestPay par pays
    { key: "westpayApiKey_CI", value: "" },
    { key: "westpayApiKey_BF", value: "" },
    { key: "westpayApiKey_BJ", value: "" },
    { key: "westpayApiKey_TG", value: "" },
    { key: "westpayApiKey_CM", value: "" },
    { key: "westpayApiKey_ML", value: "" }, // gardé pour WestPay même si Mali retiré du login
    // VIP descriptions & advantages (insert only — never force-update)
    { key: "vip0Description", value: "Membre inscrit n'ayant pas encore investi." },
    { key: "vip0Advantages", value: "Accès à la plateforme. Possibilité de déposer et d'investir." },
    { key: "vip1Description", value: "Nouveau membre ayant réalisé son premier investissement." },
    { key: "vip1Advantages", value: "Accès complet à la plateforme. Gains quotidiens. Commissions de parrainage actives." },
    { key: "vip2Description", value: "Membre actif avec 3 filleuls directs (niveau A)." },
    { key: "vip2Advantages", value: "Statut VIP 2. Reconnaissance de votre activité de recrutement." },
    { key: "vip3Description", value: "Minimum 3 membres directs (A) ayant commencé à construire leur propre réseau (niveau B)." },
    { key: "vip3Advantages", value: "Statut VIP 3. Équipe structurée sur 2 niveaux." },
    { key: "vip4Description", value: "Minimum 100 membres dans l'équipe totale (niveaux A + B + C)." },
    { key: "vip4Advantages", value: "Statut VIP 4. Leader d'équipe confirmé." },
    { key: "vip5Description", value: "Minimum 300 membres dans l'équipe totale." },
    { key: "vip5Advantages", value: "Statut VIP 5. Ambassadeur de la plateforme." },
    { key: "vip6Description", value: "Minimum 600 membres dans l'équipe totale." },
    { key: "vip6Advantages", value: "Statut VIP 6. Partenaire élite." },
    { key: "vip7Description", value: "Minimum 1 000 membres dans l'équipe totale." },
    { key: "vip7Advantages", value: "Statut VIP 7. Rang suprême. Reconnaissance maximale." },
    // VIP labels (insert only)
    { key: "vip0Label", value: "VIP 0" }, { key: "vip1Label", value: "VIP 1" },
    { key: "vip2Label", value: "VIP 2" }, { key: "vip3Label", value: "VIP 3" },
    { key: "vip4Label", value: "VIP 4" }, { key: "vip5Label", value: "VIP 5" },
    { key: "vip6Label", value: "VIP 6" }, { key: "vip7Label", value: "VIP 7" },
    // VIP conditions (insert only — admin can override)
    { key: "vip2MinDirectA",   value: "3"    },
    { key: "vip3MinDirectA",   value: "3"    },
    { key: "vip3MinLevelB",    value: "1"    },
    { key: "vip4MinTotalTeam", value: "100"  },
    { key: "vip5MinTotalTeam", value: "300"  },
    { key: "vip6MinTotalTeam", value: "600"  },
    { key: "vip7MinTotalTeam", value: "1000" },
    // VIP rewards (insert only — admin can override)
    { key: "vip2Reward", value: "500"  },
    { key: "vip3Reward", value: "1000" },
    { key: "vip4Reward", value: "2000" },
    { key: "vip5Reward", value: "3500" },
    { key: "vip6Reward", value: "5000" },
    { key: "vip7Reward", value: "7500" },
    // Spin wheel settings (insert only — admin can override)
    { key: "spinWheelSelfPurchaseSpins", value: "3" },
    { key: "spinWheelReferralPurchaseSpins", value: "2" },
    { key: "spinWheelInviteText", value: DEFAULT_SPIN_WHEEL_INVITE_TEXT },
    { key: "spinWheelInviteHighlight", value: DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT },
    { key: "spinWheelRulesText", value: DEFAULT_SPIN_WHEEL_RULES_TEXT },
    { key: "spinWheelRulesHighlight", value: "" },
    { key: "banner1Images", value: "[]" },
    { key: "banner2Images", value: "[]" },
  ];

  // Aucune clé n'est écrasée au redémarrage : toute valeur déjà en base est conservée
  // (les modifications admin persistent entre redémarrages)
  const FORCE_UPDATE_KEYS = new Set<string>();

  for (const settingData of requiredSettings) {
    const existing = existingSettings.find(s => s.key === settingData.key);
    if (!existing) {
      await db.insert(platformSettings).values(settingData);
      console.log(`Setting added: ${settingData.key}`);
    } else if (FORCE_UPDATE_KEYS.has(settingData.key)) {
      await db.update(platformSettings)
        .set({ value: settingData.value })
        .where(eq(platformSettings.key, settingData.key));
      console.log(`Setting updated: ${settingData.key}`);
    } else {
      console.log(`Setting preserved: ${settingData.key}`);
    }
  }

  // Upgrade only the untouched legacy defaults once. Preserve any rates that
  // an administrator has already customized.
  if (!existingSettings.some(setting => setting.key === REFERRAL_COMMISSION_DEFAULT_MIGRATION_KEY)) {
    const currentRates = Object.fromEntries(
      ["level1Commission", "level2Commission", "level3Commission"].map(key => [
        key,
        existingSettings.find(setting => setting.key === key)?.value,
      ]),
    ) as Record<string, string | undefined>;
    const isLegacyDefaultRates =
      Number(currentRates.level1Commission) === 10 &&
      Number(currentRates.level2Commission) === 2 &&
      Number(currentRates.level3Commission) === 1;

    if (isLegacyDefaultRates) {
      await db.transaction(async tx => {
        for (const key of ["level1Commission", "level2Commission", "level3Commission"] as const) {
          await tx.update(platformSettings)
            .set({ value: DEFAULT_REFERRAL_COMMISSION_RATES[key] })
            .where(eq(platformSettings.key, key));
        }
      });
      console.log("Legacy referral commission defaults upgraded to 30/3/2");
    }

    await db.insert(platformSettings)
      .values({ key: REFERRAL_COMMISSION_DEFAULT_MIGRATION_KEY, value: "1" })
      .onConflictDoNothing();
  }

  // Update only known default copy. Custom admin content remains untouched.
  const knownDefaultCopyUpdates = [
    {
      key: "spinWheelInviteText",
      oldValue: "Invitez vos amis à s'inscrire et vous aurez plus de chances de gagner des prix, jusqu'à 50 fois par jour.",
      newValue: DEFAULT_SPIN_WHEEL_INVITE_TEXT,
    },
    {
      key: "spinWheelInviteText",
      oldValue: "Partagez votre lien de parrainage. Lorsqu’un ami inscrit avec votre lien achète un produit payant, vous gagnez 2 tours.",
      newValue: DEFAULT_SPIN_WHEEL_INVITE_TEXT,
    },
    {
      key: "spinWheelInviteText",
      oldValue: "Partagez votre lien personnel avec vos amis. À chaque achat payant effectué par un ami inscrit grâce à ce lien, l’acheteur reçoit 3 tours et vous recevez 2 tours en tant que parrain direct. Les tours sont crédités automatiquement après l’achat. Chaque tour permet un lancer unique de la roue. Utilisez « Copier mon lien » pour partager facilement votre invitation.",
      newValue: DEFAULT_SPIN_WHEEL_INVITE_TEXT,
    },
    {
      key: "spinWheelInviteHighlight",
      oldValue: "50",
      newValue: DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT,
    },
    {
      key: "spinWheelInviteHighlight",
      oldValue: "2 tours",
      newValue: DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT,
    },
    {
      key: "spinWheelRulesText",
      oldValue: "Achetez un produit pour obtenir des tours gratuits. Chaque tour vous donne une chance de remporter un gain en XOF crédité directement sur votre solde.",
      newValue: DEFAULT_SPIN_WHEEL_RULES_TEXT,
    },
    {
      key: "spinWheelRulesText",
      oldValue: "Achetez un produit pour obtenir des tours gratuits. Chaque tour vous donne une chance de remporter un gain en USDT crédité directement sur votre solde.",
      newValue: DEFAULT_SPIN_WHEEL_RULES_TEXT,
    },
    {
      key: "spinWheelRulesText",
      oldValue: "Vous gagnez 3 tours à chaque achat payant de produit effectué par vous-même, et 2 tours lorsqu’un ami inscrit avec votre lien achète un produit payant. Chaque tour peut vous faire gagner une somme en XOF créditée sur votre solde.",
      newValue: DEFAULT_SPIN_WHEEL_RULES_TEXT,
    },
    {
      key: "spinWheelRulesText",
      oldValue: "Chaque achat payant que vous effectuez vous accorde automatiquement 3 tours. À chaque achat payant effectué par un filleul direct inscrit grâce à votre lien, 2 tours sont crédités sur votre compte. Chaque tour permet un lancer unique de la roue. Les lots pouvant être remportés et leurs probabilités sont définis par la configuration actuelle de la roue. Les gains remportés sont crédités en XOF sur votre solde.",
      newValue: DEFAULT_SPIN_WHEEL_RULES_TEXT,
    },
    {
      key: "popupLine7",
      oldValue: "🔥 Les gains sont crédités chaque jour",
      newValue: "🔥 Les gains sont crédités automatiquement à la fin du cycle du produit",
    },
    {
      key: "popupLine7",
      oldValue: "🔥 Le premier gain est disponible après l'achat. Collectez vos gains dans Revenu toutes les 24 heures",
      newValue: "🔥 Les gains sont crédités automatiquement à la fin du cycle du produit",
    },
    {
      key: "content_orders_infoLine1",
      oldValue: "Les revenus du produit sont crédités automatiquement selon le cycle défini sur sa fiche.",
      newValue: "Les gains du produit sont crédités automatiquement sur le solde des gains à la fin du cycle indiqué. Aucune collecte manuelle n'est nécessaire.",
    },
    {
      key: "content_orders_infoLine1",
      oldValue: "Le premier gain est disponible immédiatement après l'achat. Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures.",
      newValue: "Les gains du produit sont crédités automatiquement sur le solde des gains à la fin du cycle indiqué. Aucune collecte manuelle n'est nécessaire.",
    },
    {
      key: "content_rules_section3Body",
      oldValue: "- Chaque produit affiche son prix, sa durée et ses revenus avant l'achat\n- Les revenus suivent le cycle défini sur la fiche du produit\n- Consultez les conditions du produit avant de confirmer",
      newValue: "- Chaque produit affiche son prix, sa durée et ses revenus avant l'achat\n- Les gains sont crédités automatiquement sur le solde des gains à la fin du cycle\n- Consultez les conditions du produit avant de confirmer",
    },
    {
      key: "content_rules_section3Body",
      oldValue: "- Chaque produit affiche son prix, sa durée et ses revenus avant l'achat\n- Le premier gain est disponible immédiatement après l'achat\n- Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures",
      newValue: "- Chaque produit affiche son prix, sa durée et ses revenus avant l'achat\n- Les gains sont crédités automatiquement sur le solde des gains à la fin du cycle\n- Consultez les conditions du produit avant de confirmer",
    },
    {
      key: "content_rulespage_s1b2",
      oldValue: "Les revenus sont générés quotidiennement et accrédités sur votre solde de compte toutes les 24 heures.",
      newValue: "Les gains du produit sont crédités automatiquement sur le solde des gains à la fin de la durée indiquée. Aucune collecte manuelle n'est nécessaire.",
    },
    {
      key: "content_rulespage_s1b2",
      oldValue: "Le premier gain est disponible immédiatement après l'achat. Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures.",
      newValue: "Les gains du produit sont crédités automatiquement sur le solde des gains à la fin de la durée indiquée. Aucune collecte manuelle n'est nécessaire.",
    },
    {
      key: "content_rulespage_s5Title",
      oldValue: "5. Sécurité",
      newValue: "4. Sécurité",
    },
  ];

  for (const update of knownDefaultCopyUpdates) {
    const existing = existingSettings.find((setting) => setting.key === update.key);
    if (existing?.value === update.oldValue) {
      await db.update(platformSettings)
        .set({ value: update.newValue })
        .where(eq(platformSettings.key, update.key));
      console.log(`Default copy updated: ${update.key}`);
    }
  }

  const retiredRewardCopyPattern =
    /(?:\b(?:bonus|prime)\b[\s\S]{0,60}\b(?:inscription|registration|sign[\s-]?up|welcome|bienvenue)\b|\b(?:inscription|registration|sign[\s-]?up|welcome|bienvenue)\b[\s\S]{0,60}\b(?:bonus|prime)\b)/i;
  const retiredRewardCopyReplacements: Record<string, string> = {
    popupLine4: "",
    content_home_popupLine6: "Les gains des produits sont crédités automatiquement à la fin de leur cycle.",
    content_rules_section5Title: "5. Sécurité",
    content_rules_section5Body: "Protégez votre compte et ne partagez jamais vos identifiants ou codes de validation.",
  };
  for (const setting of existingSettings) {
    if (
      !(setting.key.startsWith("content_") || setting.key.startsWith("popupLine")) ||
      !retiredRewardCopyPattern.test(setting.value)
    ) {
      continue;
    }
    await db.update(platformSettings)
      .set({ value: retiredRewardCopyReplacements[setting.key] ?? "" })
      .where(eq(platformSettings.key, setting.key));
    console.log(`Obsolete announcement copy cleared: ${setting.key}`);
  }

  console.log("Settings check complete");

  // Seed staking products only if table is empty (first install only — never overwrite admin changes)
  const existingStakingProducts = await db.select().from(stakingProducts);
  if (existingStakingProducts.length === 0) {
    await db.insert(stakingProducts).values([
      { name: "Produit 1", description: "5% par jour pendant 3 jours. Capital récupérable à la fin.", price: 2000, returnAmount: 2300, lockDays: 3, isActive: true },
      { name: "Produit 2", description: "5% par jour pendant 7 jours. Capital récupérable à la fin.", price: 5000, returnAmount: 6750, lockDays: 7, isActive: true },
      { name: "Produit 3", description: "5% par jour pendant 12 jours. Capital récupérable à la fin.", price: 10000, returnAmount: 16000, lockDays: 12, isActive: true },
      { name: "Produit 4", description: "5% par jour pendant 16 jours. Capital récupérable à la fin.", price: 20000, returnAmount: 36000, lockDays: 16, isActive: true },
      { name: "Produit 5", description: "5% par jour pendant 20 jours. Capital récupérable à la fin.", price: 50000, returnAmount: 100000, lockDays: 20, isActive: true },
    ]);
    console.log("Staking products seeded (first install)");
  } else {
    console.log(`Staking products skipped — ${existingStakingProducts.length} existing staking products preserved`);
  }

  // ─── Product Series seed data ────────────────────────────────────────────────
  // Seed default series (Série A & Série B) if none exist
  const existingSeries = await db.select({ id: productSeries.id }).from(productSeries).limit(1);
  if (existingSeries.length === 0) {
    const [serieA] = await db.insert(productSeries).values([
      { name: "Série A", sortOrder: 1, isActive: true },
      { name: "Série B", sortOrder: 2, isActive: true },
    ]).returning();
    // Assign all existing products to Série A by default
    await db.execute(sql`UPDATE "products" SET "series_id" = ${serieA.id} WHERE "series_id" IS NULL AND "is_free" = false`);
    console.log("Product series seeded (Série A, Série B) — existing products assigned to Série A");
  } else {
    console.log("Product series skipped — already exists");
  }

  console.log("Database seeding complete!");
}
