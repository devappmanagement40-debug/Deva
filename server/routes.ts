import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { getDailyBonusHoursRemaining } from "./daily-bonus-policy";
import bcrypt from "bcryptjs";
import { PRODUCT_TYPES, registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import ConnectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { getDatabaseConfig } from "./database-config";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { isSecureShareLink } from "./share-report-validation";
import { supportChatEditMessageSchema, supportChatMessageSchema } from "./support-chat-validation";
import {
  maskPhoneForWithdrawalProof,
  withdrawalProofReviewSchema,
  withdrawalProofSubmissionSchema,
} from "./withdrawal-proof-validation";

/**
 * Résout les paramètres WestPay.
 * Le secret du webhook utilise TOUJOURS la variable d'environnement en priorité
 * (Plesk), avec la valeur DB uniquement comme fallback de développement.
 * Les autres paramètres restent configurables via le panel admin puis les env vars.
 */
function resolveWestpay(settings: Record<string, string>) {
  const db_  = (key: string) => settings[key] || "";
  const env_ = (key: string) => process.env[key] || "";
  const pick = (dbKey: string, envKey: string) => db_(dbKey) || env_(envKey);
  const pickSecret = (dbKey: string, envKey: string) => env_(envKey) || db_(dbKey);

  return {
    slug:        pick("westpayMerchantSlug",  "WESTPAY_MERCHANT_SLUG"),
    secret:      pickSecret("westpayWebhookSecret", "WESTPAY_WEBHOOK_SECRET"),
    apiKey: {
      CI: pick("westpayApiKey_CI", "WESTPAY_API_KEY_CI"),
      BF: pick("westpayApiKey_BF", "WESTPAY_API_KEY_BF"),
      BJ: pick("westpayApiKey_BJ", "WESTPAY_API_KEY_BJ"),
      TG: pick("westpayApiKey_TG", "WESTPAY_API_KEY_TG"),
      CM: pick("westpayApiKey_CM", "WESTPAY_API_KEY_CM"),
      ML: pick("westpayApiKey_ML", "WESTPAY_API_KEY_ML"),
    } as Record<string, string>,
  };
}

// Telegram usernames are written with "@" in labels, but never in t.me URLs.
// Keep invite links such as https://t.me/+AbCd123 unchanged.
function normalizeTelegramLink(value: string | undefined): string {
  return (value || "")
    .trim()
    .replace(/^(https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/)@/i, "$1");
}

const SPIN_WHEEL_RANKING_SETTING_KEY = "spinWheelRankingConfig";

function normalizePublicSettings(settings: Record<string, string>): Record<string, string> {
  const normalized = { ...settings };
  delete normalized[SPIN_WHEEL_RANKING_SETTING_KEY];
  for (const key of ["supportLink", "support2Link", "channelLink", "groupLink"]) {
    normalized[key] = normalizeTelegramLink(normalized[key]);
  }
  return normalized;
}

const spinWheelRankingConfigSchema = z.object({
  pinnedTransactionIds: z.array(z.number().int().positive()).max(30),
  hiddenTransactionIds: z.array(z.number().int().positive()).max(500),
}).strict().refine((config) =>
  new Set(config.pinnedTransactionIds).size === config.pinnedTransactionIds.length &&
  new Set(config.hiddenTransactionIds).size === config.hiddenTransactionIds.length,
);

type SpinWheelRankingConfig = z.infer<typeof spinWheelRankingConfigSchema>;
type SpinWheelRewardRow = {
  id: number;
  phone: string | null;
  amount: string;
  description: string;
  created_at: Date | string;
};

function parseSpinWheelRankingConfig(value: string | null): SpinWheelRankingConfig {
  if (!value) return { pinnedTransactionIds: [], hiddenTransactionIds: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("La configuration du classement de la roue est invalide.");
  }

  const result = spinWheelRankingConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("La configuration du classement de la roue est invalide.");
  }
  return result.data;
}

function maskSpinWheelPhone(phone: string | null | undefined): string {
  const value = (phone ?? "").replace(/\D/g, "");
  return value.length >= 6 ? `+${value.slice(0, 2)}****${value.slice(-6)}` : `+${value}`;
}

function spinWheelTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function spinWheelTimestampIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

import {
  assessNowPaymentsDeposit,
  createNowPaymentsDirectPayment,
  createPayout,
  getConfiguredAppUrl,
  getConfiguredAppUrlInfo,
  getNowPaymentsCallbackUrl,
  getSDK,
  isNowPaymentsPayoutConfigured,
  isNowPaymentsVerificationCode,
  nextWithdrawalStatusFromPayoutIpn,
  NowPaymentsPayoutError,
  normalizeWithdrawalMode,
  shouldReconcileNowPaymentsPayoutError,
  verifyPayout,
} from "./nowpayments";
import {
  DEFAULT_SPIN_WHEEL_SEGMENTS,
  parseSpinWheelSegments,
  SPIN_WHEEL_SETTING_KEY,
  type SpinWheelSegment,
} from "@shared/spin-wheel";

// --- Brute-force protection (in-memory) ---
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
  return ip;
}

function checkBruteForce(req: Request, res: Response): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && record.blockedUntil > now) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
    res.status(429).json({ message: `Trop de tentatives. Réessayez dans ${minutesLeft} minute(s).` });
    return true;
  }
  return false;
}

function recordFailedAttempt(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    record.count = 0;
  }
  loginAttempts.set(key, record);
}

function clearFailedAttempts(req: Request) {
  loginAttempts.delete(getClientKey(req));
}
// --- end brute-force protection ---

function getNowPaymentsPayoutPayload(body: Record<string, unknown>) {
  const batchId =
    typeof body.batch_withdrawal_id === "string"
      ? body.batch_withdrawal_id
      : typeof body.batchWithdrawalId === "string"
        ? body.batchWithdrawalId
        : null;
  const payoutId =
    typeof body.id === "string"
      ? body.id
      : typeof body.payout_id === "string"
        ? body.payout_id
        : null;
  const status = typeof body.status === "string" ? body.status.toLowerCase() : null;
  const hash =
    typeof body.hash === "string"
      ? body.hash
      : typeof body.payout_hash === "string"
        ? body.payout_hash
        : null;
  const error = typeof body.error === "string" ? body.error : null;

  return { batchId, payoutId, status, hash, error };
}

function isNowPaymentsPayout(body: Record<string, unknown>) {
  return Boolean(
    body.batch_withdrawal_id ||
    body.batchWithdrawalId ||
    body.payout_id ||
    (body.type === "payout" && body.status),
  );
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PgSession = ConnectPgSimple(session);

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
}

function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  const forwardedHost = req.get("x-forwarded-host");
  const requestHost = (forwardedHost || req.get("host") || "").split(",")[0].trim();

  try {
    if (!origin || !requestHost || new URL(origin).host !== requestHost) {
      return res.status(403).json({ message: "Origine de la requête non autorisée" });
    }
  } catch {
    return res.status(403).json({ message: "Origine de la requête non autorisée" });
  }

  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

async function requireBanker(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin && !user?.isBanker) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trust proxy for production HTTPS (Replit deployment)
  app.set("trust proxy", 1);

  // Health check — verifies DB connectivity without exposing sensitive data
  app.get("/api/health", async (_req, res) => {
    try {
      const result = await pool.query("SELECT current_database() AS db, version() AS pg_version");
      const appUrlInfo = getConfiguredAppUrlInfo();
      const callbackUrl = getNowPaymentsCallbackUrl();
      res.json({
        status: "ok",
        db: result.rows[0].db,
        pg_version: result.rows[0].pg_version,
        runtime: {
          nodeEnv: process.env.NODE_ENV || "development",
          appUrlConfigured: Boolean(appUrlInfo),
          appUrlSource: appUrlInfo?.source || "none",
          appUrlIsHttps: Boolean(callbackUrl),
          nowPaymentsApiKeyConfigured: Boolean(process.env.NOWPAYMENTS_API_KEY),
          nowPaymentsIpnSecretConfigured: Boolean(process.env.NOWPAYMENTS_IPN_SECRET),
          nowPaymentsConfigured: Boolean(
            process.env.NOWPAYMENTS_API_KEY &&
              process.env.NOWPAYMENTS_IPN_SECRET &&
              callbackUrl,
          ),
        },
      });
    } catch (err: any) {
      res.status(503).json({ status: "error", message: err.message });
    }
  });

  const sessionDbConfig = {
    ...getDatabaseConfig(),
    // The session store has its own pool. Apply the same bounds as the main
    // Drizzle pool so a stalled Supabase connection cannot block every API
    // request waiting for a session.
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    query_timeout: 10_000,
    statement_timeout: 10_000,
    keepAlive: true,
  };
  const sessionMiddleware = session({
      store: new PgSession({
        conString: sessionDbConfig.connectionString,
        conObject: sessionDbConfig,
        tableName: "session",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60,
      }),
      secret: (() => {
        const s = process.env.SESSION_SECRET;
        if (!s) throw new Error("SESSION_SECRET environment variable is required but not set");
        return s;
      })(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    });

  // Public bootstrap endpoints do not need a session lookup. Keeping them
  // outside connect-pg-simple removes a database round-trip from the first
  // render and leaves session loading for authenticated routes only.
  const publicApiPathsWithoutSession = new Set([
    "/countries",
    "/settings",
    "/settings/links",
    "/nowpayments/ipn",
  ]);
  app.use("/api", (req, res, next) => {
    if (publicApiPathsWithoutSession.has(req.path)) return next();
    return sessionMiddleware(req, res, next);
  });

  // ── Mode Maintenance ─────────────────────────────────────────────────────
  // Logique :
  //   - Routes /api/admin et /api/auth → toujours accessibles
  //   - Admin connecté (isAdmin=true en DB) → laissé passer
  //   - Tout le reste (visiteurs + membres normaux) → page blanche si maintenance ON
  let _maintenanceCache: { value: boolean; expiry: number } = { value: false, expiry: 0 };
  // Cache du statut admin par userId (TTL 30 s) pour éviter une requête DB à chaque hit
  const _adminCache = new Map<number, { isAdmin: boolean; expiry: number }>();

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // 1. Routes admin/auth et webhook signé → toujours libres. Le webhook
    // NOWPayments vérifie sa signature dans sa propre route, plus bas.
    if (
      req.path.startsWith("/api/admin") ||
      req.path.startsWith("/api/auth") ||
      req.path === "/api/nowpayments/ipn"
    ) {
      return next();
    }

    // 2. Vérifier d'abord si la maintenance est active (cache 5 s)
    let maintenanceOn = false;
    try {
      const now = Date.now();
      if (now > _maintenanceCache.expiry) {
        const val = await storage.getSetting("maintenanceMode");
        _maintenanceCache = { value: val === "true", expiry: now + 5000 };
      }
      maintenanceOn = _maintenanceCache.value;
    } catch {
      // Erreur DB → fail-open (ne pas bloquer le site)
    }

    if (!maintenanceOn) return next();

    // 3. Maintenance active — vérifier si c'est un admin connecté
    const userId = req.session?.userId;
    if (userId) {
      try {
        const now = Date.now();
        const cached = _adminCache.get(userId);
        let isAdmin: boolean;
        if (cached && now < cached.expiry) {
          isAdmin = cached.isAdmin;
        } else {
          const user = await storage.getUser(userId);
          isAdmin = !!(user?.isAdmin);
          _adminCache.set(userId, { isAdmin, expiry: now + 30_000 });
        }
        if (isAdmin) return next(); // admin → laissé passer
      } catch {
        // Erreur DB → bloquer par sécurité
      }
    }

    // 4. Pas admin → page blanche
    return res.status(200).send("");
  });

  // Auth routes
  app.get("/api/auth/captcha", (req, res) => {
    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    const code = Array.from({ length: 4 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join("");
    (req.session as any).registrationCaptcha = {
      code: code.toLowerCase(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="49" viewBox="0 0 90 49"><rect width="90" height="49" rx="4" fill="#fff"/><path d="M5 12L81 37M8 40L72 7M18 47L87 15" stroke="#a682c5" stroke-width="2.1" opacity=".55"/><path d="M2 24L88 31" stroke="#5c82b6" stroke-width="1" opacity=".4"/><text x="45" y="33" text-anchor="middle" font-family="Georgia,serif" font-size="27" font-weight="700" letter-spacing="-2" fill="#19131d" transform="rotate(-5 45 25)">${code}</text></svg>`;
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.json({ image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const captcha = (req.session as any).registrationCaptcha as { code: string; expiresAt: number } | undefined;
      delete (req.session as any).registrationCaptcha;
      const submittedCaptcha = typeof req.body?.captchaCode === "string"
        ? req.body.captchaCode.trim().toLowerCase()
        : "";
      if (!captcha || captcha.expiresAt < Date.now() || !submittedCaptcha || submittedCaptcha !== captcha.code) {
        return res.status(400).json({
          message: captcha && captcha.expiresAt >= Date.now()
            ? "Code de vérification incorrect"
            : "Code de vérification expiré, actualisez l’image",
        });
      }

      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByPhone(data.phone, data.country);
      if (existing) {
        return res.status(400).json({ message: "Ce numéro est déjà utilisé" });
      }

      let referredBy: string | undefined;
      if (data.invitationCode && data.invitationCode.trim()) {
        const cleanCode = data.invitationCode.trim().toUpperCase();
        const referrer = await storage.getUserByReferralCode(cleanCode);
        if (!referrer) {
          return res.status(400).json({ message: "Code d'invitation invalide" });
        }
        referredBy = cleanCode;
      }

      const user = await storage.createUser({
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        password: data.password,
        referredBy,
        transactionPassword: data.transactionPassword
          ? await bcrypt.hash(data.transactionPassword, 10)
          : undefined,
        telegram: data.telegram || undefined,
      });

      req.session.userId = user.id;
      const currentUser = await storage.getUser(user.id);
      res.json({ user: { ...(currentUser || user), password: undefined, transactionPassword: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      if (error?.code === "23505") {
        return res.status(400).json({ message: "Ce numéro est déjà utilisé pour ce pays" });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Impossible de créer le compte pour le moment" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (checkBruteForce(req, res)) return;
    try {
      const data = loginSchema.parse(req.body);
      
      // Normal users must match both phone and country. The super-admin is
      // allowed to sign in by phone suffix as well because the legacy admin
      // account is stored under CI while the global login form defaults to
      // US/+1. This avoids locking the administrator out without weakening
      // country matching for regular accounts.
      const user =
        await storage.getUserByPhone(data.phone, data.country) ||
        await storage.getSuperAdminByPhone(data.phone);
      if (!user) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Compte suspendu" });
      }

      clearFailedAttempts(req);
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined, transactionPassword: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Connexion momentanément indisponible. Réessayez plus tard." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      res.json({ user: { ...user, password: undefined, transactionPassword: undefined } });
    } catch (error: any) {
      console.error("Auth/me error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Veuillez remplir tous les champs" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ success: true, message: "Mot de passe modifie avec succes" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const userProductsList = await storage.getUserProducts(req.session.userId!);
      const user = await storage.getUser(req.session.userId!);
      
      const productCounts = new Map<number, number>();
      userProductsList.forEach(up => {
        if (up.isActive) {
          productCounts.set(up.productId, (productCounts.get(up.productId) || 0) + 1);
        }
      });
      
      const productsWithOwnership = products.map(p => ({
        ...p,
        isOwned: productCounts.has(p.id),
        ownedCount: productCounts.get(p.id) || 0,
      }));

      res.json(productsWithOwnership);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Deprecated compatibility route: product gains can no longer be collected manually.
  app.post("/api/user/collect-final/:userProductId", requireAuth, (_req, res) => {
    return res.status(410).json({
      message: "La collecte manuelle n'est plus disponible. Les gains sont crédités automatiquement à la fin du cycle.",
    });
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id as string);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      
      if (product.isFree) {
        return res.status(400).json({ message: "Ce produit n'est pas disponible à l'achat" });
      }
      if (product.isUnavailable) {
        return res.status(400).json({ message: "Ce produit n'est pas encore disponible" });
      }
      if ((product.stockPercentage ?? 0) >= 100) {
        return res.status(400).json({ message: "Ce produit est épuisé — stock complet" });
      }

      const userId = req.session.userId!;

      // Check invite condition
      const minInvite = Number(product.minInviteCount) || 0;
      if (minInvite > 0) {
        const inviteCount = await storage.getProductInviteCount(userId);
        if (inviteCount < minInvite) {
          return res.status(400).json({
            message: `Vous devez inviter au moins ${minInvite} personne(s) avant d'acheter ce produit (actuellement : ${inviteCount}).`,
          });
        }
      }

      // Check max-owned condition
      const maxOwned = Number(product.maxOwned) || 0;
      if (maxOwned > 0) {
        const userProds = await storage.getUserProducts(userId);
        const owned = userProds.filter(up => up.productId === productId && up.isActive).length;
        if (owned >= maxOwned) {
          return res.status(400).json({
            message: `Vous avez atteint la limite d'achat pour ce produit (max ${maxOwned}).`,
          });
        }
      }

      const userProduct = await storage.purchaseProduct(userId, productId);
      res.json(userProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's purchased products
  app.get("/api/user/products", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      // Accrue full 24-hour periods and automatically pay out when the cycle ends.
      await storage.processEarningsForUser(userId);
      const userProductsList = await storage.getAllUserProducts(userId);
      
      const formattedProducts = userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        purchasedAt: up.userProduct.purchaseDate,
        lastEarningDate: up.userProduct.lastEarningDate,
        daysRemaining: up.userProduct.daysRemaining,
        totalEarned: up.userProduct.totalEarned,
        pendingEarnings: up.userProduct.pendingEarnings,
        nextCollectionAt: up.userProduct.lastEarningDate
          ? new Date(new Date(up.userProduct.lastEarningDate).getTime() + 24 * 60 * 60 * 1000)
          : null,
        status: up.userProduct.isActive && up.userProduct.daysRemaining > 0 ? 'active' : 'completed',
        product: up.product
      }));
      
      res.json(formattedProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Keep the old paths explicit for outdated clients; neither route can pay out manually.
  app.post("/api/user/collect-earnings", requireAuth, (_req, res) => {
    return res.status(410).json({
      message: "La collecte manuelle n'est plus disponible. Les gains sont crédités automatiquement à la fin du cycle.",
    });
  });

  app.get("/api/user/income-summary", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      return res.json(await storage.getUserIncomeSummary(userId));
    } catch (error) {
      console.error("User income summary error:", error);
      return res.status(500).json({ message: "Impossible de charger le récapitulatif des revenus" });
    }
  });

  // Payment Channels
  app.get("/api/payment-channels", requireAuth, async (req, res) => {
    try {
      const [channels, settings] = await Promise.all([
        storage.getPaymentChannels(),
        storage.getSettings(),
      ]);

      // Manual channels created by admin
      const manualChannels = channels.map((ch) => ({ ...ch, gateway: null }));

      res.json(manualChannels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Staking Products (public)
  app.get("/api/staking/products", requireAuth, async (req, res) => {
    try {
      const all = await storage.getActiveStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staking/purchase/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const staking = await storage.purchaseStaking(req.session.userId!, id);
      res.json(staking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/staking/my", requireAuth, async (req, res) => {
    try {
      const stakings = await storage.getUserStakings(req.session.userId!);
      res.json(stakings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Staking
  app.get("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      if (!name || !price || !returnAmount || !lockDays) {
        return res.status(400).json({ message: "Champs requis : nom, prix, retour, durée" });
      }
      const sp = await storage.createStakingProduct({
        name, description: description || null,
        price: parseInt(price),
        returnAmount: parseInt(returnAmount),
        lockDays: parseInt(lockDays),
        launchDate: launchDate ? new Date(launchDate) : null,
        imageUrl: imageUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      const sp = await storage.updateStakingProduct(id, {
        name, description,
        price: price !== undefined ? parseInt(price) : undefined,
        returnAmount: returnAmount !== undefined ? parseInt(returnAmount) : undefined,
        lockDays: lockDays !== undefined ? parseInt(lockDays) : undefined,
        launchDate: launchDate ? new Date(launchDate) : (launchDate === null ? null : undefined),
        imageUrl, isActive,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStakingProduct(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/staking/stakings", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getAllUserStakings();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Deposit Channels (public) ──────────────────────────────────────
  app.get("/api/deposit-channels", requireAuth, async (req, res) => {
    try {
      const country = req.query.country as string | undefined;
      const channels = country
        ? await storage.getDepositChannelsByCountry(country)
        : await storage.getDepositChannels().then(all => all.filter(c => c.isActive));
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit-channels/:id/operators", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const operators = await storage.getPaymentNumbersByChannel(id);
      res.json(operators);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Deposit Channels (admin CRUD) ───────────────────────────────────
  app.get("/api/admin/deposit-channels", requireAdmin, async (req, res) => {
    try {
      res.json(await storage.getDepositChannels());
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposit-channels", requireAdmin, async (req, res) => {
    try {
      const { name, description, country, isActive, sortOrder } = req.body;
      if (!name || !country) return res.status(400).json({ message: "name et country sont requis" });
      const ch = await storage.createDepositChannel({
        name, description: description || null, country,
        isActive: isActive !== false,
        sortOrder: sortOrder ?? 0,
        createdBy: req.session.userId,
      });
      res.json(ch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/deposit-channels/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { name, description, country, isActive, sortOrder } = req.body;
      const ch = await storage.updateDepositChannel(id, { name, description, country, isActive, sortOrder });
      res.json(ch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/deposit-channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteDepositChannel(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment Numbers (public — filtered by country)
  app.get("/api/payment-numbers", requireAuth, async (req, res) => {
    try {
      const country = req.query.country as string;
      if (country) {
        const nums = await storage.getPaymentNumbersByCountry(country);
        return res.json(nums);
      }
      const nums = await storage.getPaymentNumbers();
      res.json(nums.filter(n => n.isActive));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Payment Numbers CRUD
  app.get("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const nums = await storage.getPaymentNumbers();
      res.json(nums);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const { ownerName, phone, operatorName, country, channelId, logoUrl, isActive } = req.body;
      if (!ownerName || !phone || !operatorName || !country) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }
      const num = await storage.createPaymentNumber({
        ownerName, phone, operatorName, country,
        channelId: channelId ? parseInt(channelId) : null,
        logoUrl: logoUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { ownerName, phone, operatorName, country, channelId, logoUrl, isActive } = req.body;
      const num = await storage.updatePaymentNumber(id, {
        ownerName, phone, operatorName, country,
        channelId: channelId ? parseInt(channelId) : null,
        logoUrl, isActive,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentNumber(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // NOWPayments crypto deposits — uses the official SDK direct-payment flow.
  app.post("/api/crypto-deposits", requireAuth, requireSameOrigin, async (req, res) => {
    try {
      const { amount, payCurrency } = req.body as {
        amount?: number;
        payCurrency?: string;
      };
      const user = await storage.getUser(req.session.userId!);
      const amountValue = Number(amount);

      const allowedCurrencies = new Set([
        "usdtbsc", "usdtmatic", "usdttrc20", "usdterc20",
        "usdc", "usdcbsc", "usdcerc20", "usdcsol",
        "trx", "bnbbsc", "eth", "matic", "pyusd",
      ]);

      if (!user) return res.status(401).json({ message: "Non authentifié" });
      if (!process.env.NOWPAYMENTS_API_KEY || !process.env.NOWPAYMENTS_IPN_SECRET) {
        return res.status(503).json({ message: "Le service de paiement crypto n'est pas encore configuré" });
      }
      if (!getNowPaymentsCallbackUrl()) {
        return res.status(503).json({
          message: "Les dépôts automatiques nécessitent APP_URL ou PUBLIC_URL avec l'URL HTTPS publique de l'application",
        });
      }
      if (!Number.isFinite(amountValue) || !Number.isInteger(amountValue) || amountValue <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      if (!payCurrency || !allowedCurrencies.has(payCurrency.toLowerCase())) {
        return res.status(400).json({ message: "Réseau de paiement non disponible" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "18", 10);
      if (amountValue < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} XOF` });
      }

      // Provider-facing IDs are persisted externally; keep this prefix stable across the rebrand.
      const orderId = `tgood-${user.id}-${Date.now()}`;

      // Stablecoins whose value is pegged 1:1 to USD.
      // For these, we set price_currency = pay_currency so NOWPayments charges
      // the exact amount requested (e.g. 16 USDT TRC20 → exactly 16, not ~15.9).
      // For non-stable currencies (TRX, BNB, ETH, MATIC…) we keep price_currency
      // as "usd" so NOWPayments auto-converts the USD value to the right quantity.
      const USD_STABLE_CURRENCIES = new Set([
        "usdtbsc", "usdtmatic", "usdttrc20", "usdterc20",
        "usdc", "usdcbsc", "usdcerc20", "usdcsol", "pyusd",
      ]);
      const payCurrencyLower = payCurrency.toLowerCase();
      const priceCurrency = USD_STABLE_CURRENCIES.has(payCurrencyLower)
        ? payCurrencyLower
        : "usd";

      const payment = await createNowPaymentsDirectPayment({
        amount: amountValue,
        priceCurrency,
        payCurrency: payCurrencyLower,
        orderId,
        description: `Dépôt DIAMANT de ${amountValue} USDT`,
      });

      if (!payment.pay_address || !payment.payment_id) {
        console.error("NOWPayments: missing pay_address or payment_id in response", payment);
        return res.status(502).json({ message: "Impossible de générer l'adresse de dépôt" });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount: Math.round(amountValue),
        accountName: user.fullName,
        accountNumber: payment.pay_address,
        country: user.country,
        paymentMethod: "NOWPayments",
        channelName: payCurrency.toUpperCase(),
        reference: String(payment.payment_id),
        status: "pending",
        nowPaymentsStatus: "WAITING",
        nowPaymentsExpectedAmount: String(payment.pay_amount ?? amountValue),
        nowPaymentsExpectedCurrency: String(payment.pay_currency || payCurrencyLower).toLowerCase(),
      });

      const qrCode = await QRCode.toDataURL(payment.pay_address, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
      });

      return res.json({
        depositId: deposit.id,
        paymentId: String(payment.payment_id),
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount ?? amountValue,
        payCurrency: payment.pay_currency || payCurrency.toLowerCase(),
        payinExtraId: payment.payin_extra_id || undefined,
        network: payment.network || undefined,
        qrCode,
      });
    } catch (error: any) {
      console.error("NOWPayments deposit error:", error);
      const message = error?.details?.message || error?.message || "Une erreur est survenue lors de la création du dépôt";
      return res.status(502).json({ message });
    }
  });

  // NOWPayments IPN webhook — called automatically by NOWPayments when payment status changes.
  // Uses the SDK's HMAC-SHA512 verification before touching any payment data.
  app.post("/api/nowpayments/ipn", async (req, res) => {
    try {
      const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
      const sig = req.headers["x-nowpayments-sig"] as string | undefined;

      if (!ipnSecret) {
        console.error("NOWPayments IPN rejected: NOWPAYMENTS_IPN_SECRET is not configured");
        return res.status(503).json({ message: "NOWPayments IPN is not configured" });
      }
      if (!sig) {
        return res.status(401).json({ message: "Missing signature" });
      }

      const sdk = getSDK();
      if (!sdk.verifyWebhookSignature(req.body, sig)) {
        console.warn("NOWPayments IPN: invalid signature");
        return res.status(401).json({ message: "Invalid signature" });
      }

      if (isNowPaymentsPayout(req.body)) {
        const payout = getNowPaymentsPayoutPayload(req.body);
        const withdrawal =
          (payout.payoutId
            ? await storage.getWithdrawalByNowPaymentsPayoutId(payout.payoutId)
            : undefined) ||
          (payout.batchId
            ? await storage.getWithdrawalByNowPaymentsBatchId(payout.batchId)
            : undefined);

        if (!withdrawal) {
          console.warn(
            `NOWPayments payout IPN: no withdrawal found for payout=${payout.payoutId || "unknown"} batch=${payout.batchId || "unknown"}`,
          );
          return res.status(200).json({ received: true });
        }

        const status = payout.status || "unknown";
        const statusUpdate = {
          nowPaymentsStatus: status.toUpperCase(),
          ...(payout.hash ? { nowPaymentsHash: payout.hash } : {}),
          ...(payout.error ? { nowPaymentsError: payout.error } : {}),
        };

        const nextStatus = nextWithdrawalStatusFromPayoutIpn(
          withdrawal.status,
          status,
        );

        if (nextStatus === "failed" || nextStatus === "rejected") {
          const refunded = await storage.refundWithdrawal(
            withdrawal.id,
            nextStatus,
            payout.error || `NOWPayments payout ${status}`,
          );
          return res.status(200).json({
            received: true,
            status,
            refunded: Boolean(refunded),
          });
        }

        if (nextStatus === "approved") {
          const completed = await storage.completeNowPaymentsWithdrawal(
            withdrawal.id,
            statusUpdate,
          );
          return res.status(200).json({
            received: true,
            status: completed?.status || "approved",
          });
        }

        const tracked = await storage.trackNowPaymentsWithdrawal(
          withdrawal.id,
          nextStatus,
          statusUpdate,
        );
        return res.status(200).json({
          received: true,
          status: tracked?.status || nextStatus,
        });
      }

      // Signature has already been verified above. Avoid the redundant second
      // verification while retaining the SDK's normalized payment status.
      const webhook = sdk.parseWebhook(req.body, sig ?? "", { verify: false });
      if (webhook.type !== "payment.status_changed") {
        return res.status(200).json({ received: true, type: webhook.type });
      }
      const { payment } = webhook;

      if (!payment.payment_id) {
        console.warn("NOWPayments IPN: payment notification missing payment_id");
        return res.status(400).json({ message: "Missing payment id" });
      }

      const reference = String(payment.payment_id);
      const deposit = await storage.getDepositByReference(reference);
      if (!deposit) {
        console.warn(`NOWPayments IPN: no deposit found for payment_id=${payment.payment_id}`);
        return res.status(200).json({ received: true }); // 200 to stop NowPayments retries
      }

      const paymentData = payment as typeof payment & {
        pay_currency?: string;
        outcome_amount?: string | number;
        outcome_currency?: string;
        error?: string;
      };
      // The SDK exposes the final payment status as "paid"; NOWPayments calls
      // the corresponding API/IPN state "finished".
      const gatewayStatus = payment.status === "paid" ? "finished" : payment.status;
      const decision = assessNowPaymentsDeposit({
        gatewayStatus,
        expectedAmount: deposit.nowPaymentsExpectedAmount,
        expectedCurrency: deposit.nowPaymentsExpectedCurrency,
        actuallyPaid: payment.actually_paid,
        payCurrency: paymentData.pay_currency,
      });
      const result = await storage.processNowPaymentsDeposit({
        reference,
        action: decision,
        gatewayStatus,
        actuallyPaid: payment.actually_paid ? String(payment.actually_paid) : null,
        payCurrency: paymentData.pay_currency || null,
        outcomeAmount: paymentData.outcome_amount != null ? String(paymentData.outcome_amount) : null,
        outcomeCurrency: paymentData.outcome_currency || null,
        error: paymentData.error || (
          decision === "review"
            ? "Paiement NOWPayments incomplet, différent ou finalisé dans une devise inattendue"
            : null
        ),
      });

      if (decision === "review") {
        console.warn(
          `NOWPayments IPN: deposit ${deposit.id} requires review (status=${gatewayStatus}, paid=${payment.actually_paid})`,
        );
      }
      return res.status(200).json({
        received: true,
        status: gatewayStatus,
        decision,
        credited: result.credited,
      });
    } catch (error: any) {
      console.error("NOWPayments IPN error:", error);
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Deposits
  const shareReportSchema = z.object({
    shareLink: z.string()
      .trim()
      .url()
      .max(2048)
      .refine(isSecureShareLink, "Le lien de partage doit utiliser HTTPS"),
    proof: z.string()
      .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "Une image de preuve valide est requise")
      .max(4_200_000, "L'image de preuve est trop volumineuse"),
  });

  app.post("/api/share-reports", requireAuth, requireSameOrigin, async (req, res) => {
    try {
      const payload = shareReportSchema.parse(req.body);
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const shareReport = await storage.createShareReport({
        userId: user.id,
        shareLink: payload.shareLink,
        proofImage: payload.proof,
        status: "pending",
      });

      return res.status(201).json({ shareReport });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Informations de partage invalides" });
      }
      console.error("Share report submission error:", error);
      return res.status(500).json({ message: "Impossible d'envoyer le rapport de partage pour le moment" });
    }
  });

  const sendWithdrawalProofImage = (res: Response, dataUrl: string) => {
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match) return res.status(500).json({ message: "Image de preuve invalide" });

    res.setHeader("Content-Type", match[1]);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(Buffer.from(match[2], "base64"));
  };

  app.get("/api/withdrawal-proofs", requireAuth, async (_req, res) => {
    try {
      const proofs = await storage.getWithdrawalProofs("approved", 100);
      return res.json(proofs.map(({ id, message, shareBonusXof, createdAt, user }) => ({
        id,
        message,
        shareBonusXof,
        createdAt,
        maskedPhone: maskPhoneForWithdrawalProof(user.phone),
      })));
    } catch (error) {
      console.error("Withdrawal proof feed error:", error);
      return res.status(500).json({ message: "Impossible de charger les preuves de retrait" });
    }
  });

  app.get("/api/withdrawal-proofs/:id/image", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Identifiant de preuve invalide" });
    }

    try {
      const proof = await storage.getWithdrawalProof(id);
      if (!proof || proof.status !== "approved") return res.status(404).json({ message: "Image introuvable" });
      return sendWithdrawalProofImage(res, proof.proofImage);
    } catch (error) {
      console.error("Withdrawal proof image error:", error);
      return res.status(500).json({ message: "Impossible de charger cette image" });
    }
  });

  app.post("/api/withdrawal-proofs", requireAuth, requireSameOrigin, async (req, res) => {
    try {
      const payload = withdrawalProofSubmissionSchema.parse(req.body);
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const proof = await storage.createWithdrawalProof({
        userId: user.id,
        proofImage: payload.proof,
        message: payload.message,
      });
      return res.status(201).json({ id: proof.id, status: proof.status });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Preuve de retrait invalide" });
      }
      console.error("Withdrawal proof submission error:", error);
      return res.status(500).json({ message: "Impossible d'envoyer la preuve de retrait pour le moment" });
    }
  });

  app.get("/api/support-chat/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      await storage.markSupportChatMessagesRead(userId, "user");
      return res.json(await storage.getSupportChatMessages(userId));
    } catch (error) {
      console.error("Support chat history error:", error);
      return res.status(500).json({ message: "Impossible de charger la conversation" });
    }
  });

  app.post("/api/support-chat/messages", requireAuth, requireSameOrigin, async (req, res) => {
    try {
      const payload = supportChatMessageSchema.parse(req.body);
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const message = await storage.createSupportChatMessage({
        userId,
        senderId: userId,
        senderRole: "user",
        message: payload.message,
        attachmentUrl: payload.attachmentUrl ?? null,
        attachmentType: payload.attachmentType ?? null,
        attachmentName: payload.attachmentName ?? null,
      });
      return res.status(201).json(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Message invalide" });
      }
      console.error("Support chat send error:", error);
      return res.status(500).json({ message: "Impossible d'envoyer le message pour le moment" });
    }
  });

  app.post("/api/deposit-issues", requireAuth, requireSameOrigin, async (req, res) => {
    try {
      const data = z.object({
        transactionId: z.string().trim().min(1, "L’identifiant de transaction est requis").max(180),
        amount: z.number().int().positive().max(2_000_000_000),
        depositNumber: z.string().trim().min(1, "Le numéro de dépôt est requis").max(100),
        screenshot: z.string()
          .max(4_200_000)
          .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "La capture doit être une image JPG, PNG ou WebP valide"),
      }).parse(req.body);

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

      const settings = await storage.getSettings();
      const minDeposit = Number.parseInt(settings.minDeposit || "18", 10);
      if (data.amount < minDeposit) {
        return res.status(400).json({
          message: `Montant minimum : ${minDeposit.toLocaleString()} XOF`,
        });
      }

      const existingReference = await storage.getDepositByReference(data.transactionId);
      if (existingReference) {
        return res.status(409).json({ message: "Cet identifiant de transaction a déjà été déclaré ou traité." });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount: data.amount,
        accountName: user.fullName || user.phone,
        accountNumber: user.phone,
        country: user.country,
        paymentMethod: "Deposit issue",
        channelName: data.depositNumber,
        screenshot: data.screenshot,
        reference: data.transactionId,
        status: "pending",
      });

      return res.status(201).json({ deposit });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Informations de dépôt invalides" });
      }
      if (error?.code === "23505" && error?.constraint === "deposits_issue_reference_unique") {
        return res.status(409).json({ message: "Cet identifiant de transaction a déjà été déclaré." });
      }
      console.error("Deposit issue submission error:", error);
      return res.status(500).json({ message: "Impossible d’envoyer le signalement pour le moment." });
    }
  });

  app.post("/api/deposits", requireAuth, async (req, res) => {
    try {
      const { amount, accountName, accountNumber, paymentMethod, country, paymentChannelId,
        depositChannelId, paymentNumberId, channelName, screenshot, paymentMessage, reference } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "18");
      if (amount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} XOF` });
      }

      if (!accountName || !accountNumber || !paymentMethod || !country) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      let resolvedChannelName = channelName || null;
      if (depositChannelId) {
        const depositChannel = await storage.getDepositChannel(Number(depositChannelId));
        if (!depositChannel || !depositChannel.isActive || depositChannel.country !== user.country) {
          return res.status(400).json({ message: "Canal de dépôt invalide" });
        }
        resolvedChannelName = depositChannel.name;

        if (user.country === "CI" && depositChannel.name === "Canal 1") {
          return res.status(400).json({ message: "Le Canal 1 utilise WestPay. Veuillez choisir le canal Wave pour un paiement manuel." });
        }
        if (
          user.country === "CI" &&
          depositChannel.name === "Wave" &&
          String(paymentMethod).toLowerCase() !== "wave"
        ) {
          return res.status(400).json({ message: "Le canal Wave accepte uniquement les paiements manuels Wave." });
        }
      }

      const deposit = await storage.createDeposit({
        userId: req.session.userId!,
        amount,
        accountName,
        accountNumber,
        country,
        paymentMethod,
        paymentChannelId: paymentChannelId && paymentChannelId > 0 ? paymentChannelId : null,
        paymentNumberId: paymentNumberId || null,
        channelName: resolvedChannelName,
        screenshot: screenshot || null,
        paymentMessage: paymentMessage || null,
        reference: reference || null,
        status: "pending",
      });

      res.json({ deposit });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ── WestPay : initiate hosted payment ──────────────────────────────────
  app.post("/api/deposits/westpay/initiate", requireAuth, async (req, res) => {
    try {
      const { amount, channelId } = req.body;
      if (!amount || Number(amount) <= 0)
        return res.status(400).json({ message: "Montant invalide" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      let westpayChannelName: string | null = null;
      if (user.country === "CI") {
        const channel = channelId
          ? await storage.getDepositChannel(Number(channelId))
          : undefined;
        if (!channel || !channel.isActive || channel.country !== user.country || channel.name !== "Canal 1") {
          return res.status(400).json({ message: "En Côte d'Ivoire, WestPay est disponible via le Canal 1." });
        }
        westpayChannelName = channel.name;
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "18");
      if (Number(amount) < minDeposit)
        return res.status(400).json({
          message: `Montant minimum : ${minDeposit.toLocaleString()} XOF`,
        });

      // Résolution DB → env var pour tous les paramètres WestPay
      const wp = resolveWestpay(settings);
      if (!wp.slug)
        return res.status(500).json({
          message: "WestPay non configuré. Ajoutez le slug marchand dans les paramètres admin.",
        });

      // Map internal country code → WestPay country name
      const countryMap: Record<string, string> = {
        CI: "Cote d'Ivoire",
        BF: "Burkina Faso",
        ML: "Mali",
        BJ: "Benin",
        SN: "Senegal",
        TG: "Togo",
        CM: "Cameroun",
        GN: "Guinée",
        NE: "Niger",
        CG: "Congo Brazzaville",
        CD: "Congo RDC",
        GA: "Gabon",
        KE: "Kenya",
        GH: "Ghana",
        NG: "Nigeria",
      };
      const wpCountry = countryMap[user.country || "CI"] ?? "Cote d'Ivoire";

      // Create a processing deposit record to track this payment
      const deposit = await storage.createDeposit({
        userId: user.id,
        amount: Number(amount),
        accountName: user.fullName || user.phone,
        accountNumber: user.phone,
        country: user.country || "CI",
        paymentMethod: "WestPay",
        channelName: westpayChannelName,
        status: "processing",
        reference: null,
      });

      // Build the WestPay hosted-payment URL
      const appBase = getConfiguredAppUrl();
      if (!appBase) {
        throw new Error("APP_URL doit être configurée dans l'environnement Plesk");
      }
      const redirectUrl = new URL(
        `/deposit?wp_deposit=${deposit.id}&wp_return=1`,
        appBase.endsWith("/") ? appBase : `${appBase}/`,
      ).toString();

      const payUrl = new URL("https://westpay.cfd/pay");
      payUrl.searchParams.set("merchant", wp.slug);
      payUrl.searchParams.set("amount",   String(Math.round(Number(amount))));
      payUrl.searchParams.set("country",  wpCountry);
      payUrl.searchParams.set("redirect", redirectUrl);
      // Clé API par pays (DB → env var) — ajoutée si disponible
      const apiKey = wp.apiKey[user.country || "CI"];
      if (apiKey) payUrl.searchParams.set("api_key", apiKey);

      res.json({ depositId: deposit.id, payUrl: payUrl.toString() });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verify deposit status
  app.get("/api/deposits/:id/verify", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id as string);
      const deposit = await storage.getDeposit(depositId);
      if (!deposit) return res.status(404).json({ message: "Depot non trouve" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Acces refuse" });
      return res.json({ status: deposit.status });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposits/history", requireAuth, async (req, res) => {
    try {
      const deposits = await storage.getUserDeposits(req.session.userId!);
      const publicDeposits = deposits.map((deposit) => {
        const {
          nowPaymentsStatus,
          nowPaymentsExpectedAmount,
          nowPaymentsExpectedCurrency,
          nowPaymentsActuallyPaid,
          nowPaymentsOutcomeAmount,
          nowPaymentsOutcomeCurrency,
          nowPaymentsError,
          ...publicDeposit
        } = deposit;
        return {
          ...publicDeposit,
          paymentMethod: publicDeposit.paymentMethod?.toLowerCase() === "nowpayments"
            ? "OkayPay"
            : publicDeposit.paymentMethod,
        };
      });
      res.json(publicDeposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Unified history: deposits + withdrawals + all transactions merged & sorted
  app.get("/api/history/all", requireAuth, async (req, res) => {
    try {
      const uid = req.session.userId!;
      const [deposits, withdrawals, txs] = await Promise.all([
        storage.getUserDeposits(uid),
        storage.getUserWithdrawals(uid),
        storage.getUserTransactions(uid),
      ]);

      const items: any[] = [
        ...deposits.map((d: any) => ({
          id: `dep-${d.id}`,
          category: "deposit",
          amount: d.amount,
          status: d.status,
          description: d.paymentMethod?.toLowerCase() === "nowpayments" ? "OkayPay" : (d.paymentMethod || "Dépôt"),
          createdAt: d.createdAt,
          extra: {
            fees: null,
            netAmount: null,
            paymentMethod: d.paymentMethod?.toLowerCase() === "nowpayments" ? "OkayPay" : d.paymentMethod,
            reference: d.reference,
          },
        })),
        ...withdrawals.map((w: any) => ({
          id: `wd-${w.id}`,
          category: "withdrawal",
          amount: w.amount,
          status: w.status,
          description: w.paymentMethod || "Retrait",
          createdAt: w.createdAt,
          extra: { fees: w.fees, netAmount: w.netAmount, paymentMethod: w.paymentMethod },
        })),
        ...txs.map((t: any) => ({
          id: `tx-${t.id}`,
          category: t.type,
          amount: t.amount,
          status: "completed",
          description: t.description,
          createdAt: t.createdAt,
          extra: {},
        })),
      ];

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // Withdrawals
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const amount = Number(req.body.amount);
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      // Vérifier que l'utilisateur possède au moins un produit actif
      const activeProducts = await storage.getUserProducts(req.session.userId!);
      if (activeProducts.length === 0) {
        return res.status(400).json({ message: "Vous devez posséder un produit actif pour effectuer un retrait." });
      }

      if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
        return res.status(400).json({ message: "Montant de retrait invalide" });
      }

      const settingsForWithdrawal = await storage.getSettings();
      if (settingsForWithdrawal.withdrawalEnabled === "false") {
        return res.status(400).json({ message: "Les retraits sont temporairement désactivés par l'administration" });
      }

      // ── Vérification jour + heure (fuseau Côte d'Ivoire = UTC+0) ──
      {
        const nowCI = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Abidjan" }));
        const currentDay = nowCI.getDay();   // 0=Dim, 1=Lun … 6=Sam
        const currentHour = nowCI.getHours();
        const allowedDays = (settingsForWithdrawal.withdrawalDays || "1,2,3,4,5")
          .split(",").map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
        const startHour = parseInt(settingsForWithdrawal.withdrawalStartHour || "10");
        const endHour   = parseInt(settingsForWithdrawal.withdrawalEndHour   || "16");

        const DAY_NAMES: Record<number, string> = {
          0: "Dimanche", 1: "Lundi", 2: "Mardi", 3: "Mercredi",
          4: "Jeudi", 5: "Vendredi", 6: "Samedi",
        };
        if (!allowedDays.includes(currentDay)) {
          const dayLabels = allowedDays.map((d: number) => DAY_NAMES[d] || d).join(", ");
          return res.status(400).json({ message: `Les retraits sont disponibles uniquement : ${dayLabels}` });
        }
        if (currentHour < startHour || currentHour >= endHour) {
          return res.status(400).json({ message: `Les retraits sont disponibles de ${startHour}h à ${endHour}h` });
        }
      }
      const minWithdrawal = parseInt(settingsForWithdrawal.minWithdrawal || "1");
      if (amount < minWithdrawal) {
        return res.status(400).json({ message: `Montant minimum : ${minWithdrawal.toLocaleString()} XOF` });
      }
      const maxWithdrawal = parseInt(settingsForWithdrawal.maxWithdrawal || "1000000");
      if (amount > maxWithdrawal) {
        return res.status(400).json({ message: `Montant maximum : ${maxWithdrawal.toLocaleString()} XOF` });
      }

      if (user.isWithdrawalBlocked) {
        return res.status(400).json({ message: "Retraits bloqués sur ce compte" });
      }

      if (user.mustInviteToWithdraw) {
        const stats = await storage.getTeamStats(user.id);
        if (stats.level1Invested < 1) {
          return res.status(400).json({ message: "Invitez quelqu'un qui investit" });
        }
      }

      const earningsBalance = parseFloat(user.totalEarnings || "0");
      if (amount > earningsBalance) {
        return res.status(400).json({ message: "Solde insuffisant" });
      }

      // Récupérer le portefeuille USDT BEP20 sélectionné.
      const walletId = Number(req.body.walletId);
      let wallet: any = null;
      if (walletId) {
        const wallets = await storage.getWallets(user.id);
        wallet = wallets.find((w: any) => w.id === walletId) || null;
      }
      if (!wallet) {
        wallet = await storage.getDefaultWallet(user.id);
      }
      if (!wallet) {
        return res.status(400).json({ message: "Veuillez ajouter un portefeuille USDT BEP20 avant de retirer" });
      }
      if (wallet.paymentMethod !== "USDT BEP20") {
        return res.status(400).json({ message: "Les retraits sont disponibles uniquement via USDT BEP20. Ajoutez une adresse BSC." });
      }

      const todayCount = await storage.getUserWithdrawalCountToday(user.id);
      const maxPerDay = parseInt(settingsForWithdrawal.maxWithdrawalsPerDay || "1");
      if (todayCount >= maxPerDay) {
        return res.status(400).json({ message: `Maximum ${maxPerDay} retrait${maxPerDay > 1 ? 's' : ''} par jour` });
      }

      // Withdrawals can only use the earnings balance, never the deposit balance.
      await storage.updateUser(user.id, {
        totalEarnings: (earningsBalance - amount).toFixed(2),
      });

      // Both modes create an auditable pending request. In semi-automatic
      // mode, an administrator explicitly starts the external payout and then
      // confirms NOWPayments 2FA; the user-facing request never calls the API.
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount,
        netAmount: amount,
        fees: 0,
        accountName: wallet.accountName,
        accountNumber: wallet.accountNumber,
        country: user.country,
        paymentMethod: "USDT BEP20",
        status: "pending",
      });
      return res.json({
        ...withdrawal,
        withdrawalMode: normalizeWithdrawalMode(settingsForWithdrawal.withdrawalMode),
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals/history", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.session.userId!);
      const publicWithdrawals = withdrawals.map((withdrawal) => {
        const {
          nowPaymentsPayoutId,
          nowPaymentsBatchId,
          nowPaymentsExternalId,
          nowPaymentsStatus,
          nowPaymentsHash,
          nowPaymentsError,
          ...publicWithdrawal
        } = withdrawal;
        return {
          ...publicWithdrawal,
          paymentMethod: publicWithdrawal.paymentMethod?.toLowerCase() === "nowpayments"
            ? "OkayPay"
            : publicWithdrawal.paymentMethod,
        };
      });
      res.json(publicWithdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/verify-nowpayments", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id as string, 10);
      const verificationCode = String(req.body.verificationCode || "").trim();
      if (!isNowPaymentsVerificationCode(verificationCode)) {
        return res.status(400).json({ message: "Le code 2FA NOWPayments doit contenir 6 chiffres" });
      }

      const withdrawals = await storage.getWithdrawals();
      const withdrawal = withdrawals.find((item) => item.id === withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (!withdrawal.nowPaymentsBatchId) {
        return res.status(400).json({ message: "Ce retrait n'a pas de payout NOWPayments à vérifier" });
      }
      if (withdrawal.status !== "pending_2fa") {
        return res.status(400).json({ message: "Ce retrait n'est plus en attente de validation 2FA" });
      }

      await verifyPayout(withdrawal.nowPaymentsBatchId, verificationCode);
      const updated = await storage.verifyNowPaymentsWithdrawal(
        withdrawal.id,
        req.session.userId!,
      );
      if (!updated) {
        return res.status(409).json({
          message: "Le statut du payout a changé pendant la validation; consultez son état actuel avant toute nouvelle action",
        });
      }
      await storage.logAdminAction(
        req.session.userId!,
        "verify_nowpayments_withdrawal",
        withdrawal.userId,
        `Payout NOWPayments vérifié pour le retrait ${withdrawal.id}`,
      );
      return res.json(updated);
    } catch (error: any) {
      if (shouldReconcileNowPaymentsPayoutError(error)) {
        const withdrawalId = parseInt(req.params.id as string, 10);
        const reconciled = await storage.markNowPaymentsVerificationForReconciliation(
          withdrawalId,
          `Validation 2FA NOWPayments possiblement acceptée : ${error.message || "réponse ambiguë"}`,
        );
        return res.status(502).json({
          message: reconciled
            ? "La réponse à la validation 2FA est ambiguë. Le retrait est conservé pour rapprochement et ne doit pas être relancé."
            : "La réponse à la validation 2FA est ambiguë. Consultez l'état actuel du retrait avant toute nouvelle action.",
        });
      }
      return res.status(400).json({
        message: error?.message || "La validation du payout NOWPayments a échoué",
      });
    }
  });

  // Wallets
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(req.session.userId!);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const { accountName, accountNumber, paymentMethod, country } = req.body;
      const normalizedPaymentMethod = String(paymentMethod || "").trim().toUpperCase();

      if (!accountName || !accountName.trim()) {
        return res.status(400).json({ message: "Le nom du titulaire est requis" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Utilisateur introuvable" });
      }
      if (normalizedPaymentMethod !== "USDT BEP20") {
        return res.status(400).json({ message: "Le seul moyen de retrait disponible est USDT BEP20" });
      }
      const userCountry = country || req.body.country || "CD";
      const address = String(accountNumber || "").trim();
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          message: "Adresse USDT BEP20 invalide — utilisez une adresse BSC commençant par 0x",
        });
      }

      const wallet = await storage.createWallet({
        userId: req.session.userId!,
        accountName: accountName.trim(),
         accountNumber: address,
         paymentMethod: "USDT BEP20",
        country: userCountry,
      });
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteWallet(req.session.userId!, parseInt(req.params.id as string));
      if (!deleted) {
        return res.status(404).json({ message: "Portefeuille introuvable" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      const updated = await storage.setDefaultWallet(req.session.userId!, parseInt(req.params.id as string));
      if (!updated) {
        return res.status(404).json({ message: "Portefeuille USDT BEP20 introuvable" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Team
  app.get("/api/team/stats", requireAuth, async (req, res) => {
    try {
      const rawDate = req.query.date;
      let date: string | undefined;
      if (rawDate !== undefined) {
        if (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          return res.status(400).json({ message: "Date invalide" });
        }
        const parsedDate = new Date(`${rawDate}T00:00:00.000Z`);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== rawDate) {
          return res.status(400).json({ message: "Date invalide" });
        }
        date = rawDate;
      }
      const stats = await storage.getTeamStats(req.session.userId!, date);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/team/details", requireAuth, async (req, res) => {
    try {
      const team = await storage.getDetailedTeam(req.session.userId!);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksWithStatus(req.session.userId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/:id/claim", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id as string);
      const userId = req.session.userId!;

      const reward = await storage.claimTask(userId, taskId);

      res.json({
        success: true,
        amount: reward,
        message: `Félicitations ! Vous avez reçu ${reward.toLocaleString()} XOF`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Daily check-in reward
  app.post("/api/claim-daily-bonus", requireAuth, async (req, res) => {
    try {
      const result = await storage.claimDailyBonus(
        req.session.userId!,
        crypto.randomInt(50, 101),
      );
      if (result.status === "user_missing") {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      if (result.status === "cooldown") {
        return res.status(400).json({
          message: `Vous pourrez pointer dans ${result.hoursRemaining}h`,
          canClaim: false,
          nextClaimIn: result.hoursRemaining,
        });
      }

      return res.json({
        success: true,
        amount: result.amount,
        message: `Pointage validé : +${result.amount} XOF ajouté à votre solde des gains`,
      });
    } catch (error: any) {
      console.error("Daily check-in claim failed:", error?.message || error);
      return res.status(500).json({ message: "Impossible de valider le pointage pour le moment. Réessayez." });
    }
  });

  app.get("/api/daily-bonus-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      const hoursRemaining = getDailyBonusHoursRemaining(lastClaim, new Date());
      const canClaim = hoursRemaining === 0;
      const bonusTransactions = await storage.getDailyBonusTransactions(user.id);
      const totalBonusClaimed = bonusTransactions.reduce(
        (total, transaction) => {
          const amount = Number(transaction.amount);
          return total + (Number.isFinite(amount) ? amount : 0);
        },
        0,
      );

      return res.json({
        canClaim,
        hoursRemaining,
        totalBonusClaimed: Number(totalBonusClaimed.toFixed(2)),
        daysPointed: bonusTransactions.length,
        checkinHistory: bonusTransactions.map((transaction) => ({
          claimedAt: transaction.createdAt.toISOString(),
          amount: Number(transaction.amount),
        })),
      });
    } catch (error: any) {
      console.error("Daily check-in status failed:", error?.message || error);
      return res.status(500).json({ message: "Impossible de charger l'historique du pointage pour le moment." });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.session.userId!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      // Never expose secret keys via this public (unauthenticated) endpoint
      const {
        omnipayCallbackKey, soleaspayEnabled, soleaspayChannelName, soleaspayCountries,
        westpayWebhookSecret, westpayMerchantSlug,
        westpayApiKey_CI, westpayApiKey_BF, westpayApiKey_BJ,
        westpayApiKey_TG, westpayApiKey_CM, westpayApiKey_ML,
        __migration_referral_commission_defaults_v1,
        ...publicSettings
      } = settings;
       res.json(normalizePublicSettings(publicSettings));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  let publicHomeStatsCache: {
    expiresAt: number;
    value: { totalUsers: number; totalProduction: number };
  } | undefined;
  app.get("/api/home/stats", requireAuth, async (_req, res) => {
    const now = Date.now();
    if (publicHomeStatsCache && publicHomeStatsCache.expiresAt > now) {
      return res.json(publicHomeStatsCache.value);
    }
    try {
      const stats = await storage.getStats();
      const value = {
        totalUsers: Number(stats.totalUsers) || 0,
        totalProduction: Number(stats.totalEarnings) || 0,
      };
      publicHomeStatsCache = { expiresAt: now + 60_000, value };
      res.json(value);
    } catch (error: any) {
      console.error("Home stats error:", error);
      res.status(500).json({ message: "Statistiques temporairement indisponibles" });
    }
  });

  app.get("/api/settings/links", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const normalizedSettings = normalizePublicSettings(settings);
      res.json({
        supportLink: normalizedSettings.supportLink || "",
        support2Link: normalizedSettings.support2Link || "",
        channelLink: normalizedSettings.channelLink || "",
        groupLink: normalizedSettings.groupLink || "",
        supportType: normalizedSettings.supportType || "telegram",
        support2Type: normalizedSettings.support2Type || "telegram",
        channelType: normalizedSettings.channelType || "telegram",
        groupType: normalizedSettings.groupType || "telegram",
        supportLabel: normalizedSettings.supportLabel || "Support client",
        support2Label: normalizedSettings.support2Label || "Support client 2",
        channelLabel: normalizedSettings.channelLabel || "Chaîne officielle",
        groupLabel: normalizedSettings.groupLabel || "Groupe officiel",
        supportEnabled: normalizedSettings.supportEnabled ?? "true",
        support2Enabled: normalizedSettings.support2Enabled ?? "true",
        channelEnabled: normalizedSettings.channelEnabled ?? "true",
        groupEnabled: normalizedSettings.groupEnabled ?? "true",
        withdrawalStartHour: normalizedSettings.withdrawalStartHour || "9",
        withdrawalEndHour: normalizedSettings.withdrawalEndHour || "17",
        floatingSupportTarget: normalizedSettings.floatingSupportTarget || "support1",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/withdrawal", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        withdrawalEnabled: settings.withdrawalEnabled !== "false",
        withdrawalStartHour: parseInt(settings.withdrawalStartHour || "9"),
        withdrawalEndHour: parseInt(settings.withdrawalEndHour || "17"),
        withdrawalDays: settings.withdrawalDays || "1,2,3,4,5",
        maxWithdrawalsPerDay: parseInt(settings.maxWithdrawalsPerDay || "1"),
        minWithdrawal: parseInt(settings.minWithdrawal || "1"),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // The wheel configuration is public to authenticated users so every prize
  // is visible. The actual winning section is always selected on the server.
  app.get("/api/spin-wheel/config", requireAuth, async (_req, res) => {
    try {
      const value = await storage.getSetting(SPIN_WHEEL_SETTING_KEY);
      res.json(parseSpinWheelSegments(value));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/spin-wheel/spin", requireAuth, async (req, res) => {
    try {
      const input = z.object({ requestId: z.string().uuid() }).strict().safeParse(req.body);
      if (!input.success) {
        return res.status(400).json({ message: "Identifiant de tirage invalide." });
      }
      const requestId = input.data.requestId;

      const result = await storage.executeSpinWheel(req.session.userId!, requestId);
      if (result.status === "user_missing") {
        return res.status(401).json({ message: "Utilisateur introuvable" });
      }
      if (result.status === "no_tokens") {
        return res.status(400).json({
          message: "Aucun tour disponible. Achetez un produit pour obtenir des tours.",
        });
      }
      if (result.status === "no_winnable_segments") {
        return res.status(400).json({ message: "Aucun gain n'est actuellement disponible." });
      }

      res.json(result.result);
    } catch (error: any) {
      console.error("Spin wheel error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/spin-wheel/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getUserTransactionsByType(req.session.userId!, "spin_reward");
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Recent real spin activity, with masked phones and admin-configured ranking order.
  app.get("/api/spin-wheel/recent", requireAuth, async (_req, res) => {
    try {
      const config = parseSpinWheelRankingConfig(
        await storage.getSetting(SPIN_WHEEL_RANKING_SETTING_KEY),
      );
      const rows = await pool.query<SpinWheelRewardRow>(
        `SELECT t.id, u.phone, t.amount, t.description, t.created_at
           FROM transactions t
           JOIN users u ON u.id = t.user_id
          WHERE t.type = 'spin_reward'
            AND t.amount > 0
          ORDER BY t.created_at DESC
          LIMIT 30`,
      );
      const pinnedRows = config.pinnedTransactionIds.length
        ? await pool.query<SpinWheelRewardRow>(
            `SELECT t.id, u.phone, t.amount, t.description, t.created_at
               FROM transactions t
               JOIN users u ON u.id = t.user_id
              WHERE t.type = 'spin_reward'
                AND t.amount > 0
                AND t.id = ANY($1::int[])`,
            [config.pinnedTransactionIds],
          )
        : { rows: [] };

      const rowsById = new Map<number, SpinWheelRewardRow>();
      for (const row of pinnedRows.rows) rowsById.set(Number(row.id), row);
      for (const row of rows.rows) rowsById.set(Number(row.id), row);

      const pinnedOrder = new Map(config.pinnedTransactionIds.map((id, index) => [id, index]));
      const hiddenIds = new Set(config.hiddenTransactionIds);
      const result = Array.from(rowsById.values())
        .filter((row) => !hiddenIds.has(Number(row.id)))
        .sort((a, b) => {
          const aPinned = pinnedOrder.get(Number(a.id));
          const bPinned = pinnedOrder.get(Number(b.id));
          if (aPinned !== undefined || bPinned !== undefined) {
            if (aPinned === undefined) return 1;
            if (bPinned === undefined) return -1;
            return aPinned - bPinned;
          }
          const amountOrder = Number(b.amount) - Number(a.amount);
          if (amountOrder !== 0) return amountOrder;
          return spinWheelTimestamp(b.created_at) - spinWheelTimestamp(a.created_at);
        })
        .map((row) => ({
          id: Number(row.id),
          phone: maskSpinWheelPhone(row.phone),
          amount: row.amount,
          description: row.description,
        }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await storage.getStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const deposits = await storage.getDeposits(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? deposits : deposits.filter(d => d.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/share-reports", requireAdmin, async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      const shareReports = await storage.getShareReports(status === "all" ? undefined : status);
      return res.json(shareReports);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawal-proofs", requireAdmin, async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      if (!["pending", "approved", "rejected", "all"].includes(status)) {
        return res.status(400).json({ message: "Filtre de preuve invalide" });
      }

      const proofs = await storage.getWithdrawalProofs(
        status as "pending" | "approved" | "rejected" | "all",
        250,
      );
      return res.json(proofs.map(({ proofImage: _proofImage, ...proof }) => proof));
    } catch (error) {
      console.error("Admin withdrawal proofs list error:", error);
      return res.status(500).json({ message: "Impossible de charger les preuves de retrait" });
    }
  });

  app.get("/api/admin/withdrawal-proofs/:id/image", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Identifiant de preuve invalide" });
    }

    try {
      const proof = await storage.getWithdrawalProof(id);
      if (!proof) return res.status(404).json({ message: "Image introuvable" });
      return sendWithdrawalProofImage(res, proof.proofImage);
    } catch (error) {
      console.error("Admin withdrawal proof image error:", error);
      return res.status(500).json({ message: "Impossible de charger cette image" });
    }
  });

  app.post("/api/admin/withdrawal-proofs/:id/review", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: "Identifiant de preuve invalide" });
      }

      const payload = withdrawalProofReviewSchema.parse(req.body);
      const current = await storage.getWithdrawalProof(id);
      if (!current) return res.status(404).json({ message: "Preuve introuvable" });
      if (current.status !== "pending") {
        return res.status(409).json({ message: "Cette preuve a déjà été traitée" });
      }

      const action = payload.action;
      const processedAt = new Date();
      const processedBy = req.session.userId!;
      if (action === "approve") {
        const updated = await storage.approvePendingWithdrawalProof(id, {
          shareBonusXof: payload.shareBonusXof,
          processedAt,
          processedBy,
        });
        if (!updated) return res.status(409).json({ message: "Cette preuve a déjà été traitée" });
        return res.json(updated);
      }

      const updated = await storage.reviewPendingWithdrawalProof(id, {
        status: "rejected",
        shareBonusXof: 0,
        processedAt,
        processedBy,
      });
      if (!updated) return res.status(409).json({ message: "Cette preuve a déjà été traitée" });
      await storage.logAdminAction(
        processedBy,
        "reject_withdrawal_proof",
        current.userId,
        `Preuve de retrait ${id} rejetée`,
      );
      return res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Décision invalide" });
      }
      console.error("Admin withdrawal proof review error:", error);
      return res.status(500).json({ message: "Impossible de traiter cette preuve pour le moment" });
    }
  });

  app.get("/api/admin/support-chat/conversations", requireAdmin, async (_req, res) => {
    try {
      return res.json(await storage.getSupportChatConversations());
    } catch (error) {
      console.error("Admin support chat list error:", error);
      return res.status(500).json({ message: "Impossible de charger les conversations" });
    }
  });

  app.get("/api/admin/support-chat/conversations/:userId/messages", requireAdmin, async (req, res) => {
    try {
      const userId = Number.parseInt(String(req.params.userId), 10);
      if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({ message: "Identifiant de membre invalide" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Membre introuvable" });

      await storage.markSupportChatMessagesRead(userId, "admin");
      return res.json(await storage.getSupportChatMessages(userId));
    } catch (error) {
      console.error("Admin support chat history error:", error);
      return res.status(500).json({ message: "Impossible de charger cette conversation" });
    }
  });

  app.post("/api/admin/support-chat/conversations/:userId/messages", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const userId = Number.parseInt(String(req.params.userId), 10);
      if (!Number.isInteger(userId) || userId < 1) {
        return res.status(400).json({ message: "Identifiant de membre invalide" });
      }

      const payload = supportChatMessageSchema.parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Membre introuvable" });

      const message = await storage.createSupportChatMessage({
        userId,
        senderId: req.session.userId!,
        senderRole: "admin",
        message: payload.message,
        attachmentUrl: payload.attachmentUrl ?? null,
        attachmentType: payload.attachmentType ?? null,
        attachmentName: payload.attachmentName ?? null,
      });
      return res.status(201).json(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Message invalide" });
      }
      console.error("Admin support chat send error:", error);
      return res.status(500).json({ message: "Impossible d'envoyer la réponse pour le moment" });
    }
  });

  app.patch("/api/admin/support-chat/conversations/:userId/messages/:messageId", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const messageId = Number(req.params.messageId);
      if (!Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(messageId) || messageId < 1) {
        return res.status(400).json({ message: "Identifiant de conversation ou de message invalide" });
      }

      const payload = supportChatEditMessageSchema.parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Membre introuvable" });

      const updatedMessage = await storage.updateOwnAdminSupportChatMessage(
        userId,
        messageId,
        req.session.userId!,
        payload.message,
      );
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message introuvable ou non modifiable" });
      }

      return res.json(updatedMessage);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Message invalide" });
      }
      console.error("Admin support chat edit error:", error);
      return res.status(500).json({ message: "Impossible de modifier le message pour le moment" });
    }
  });

  app.post("/api/admin/share-reports/:id/:action", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const reportId = Number.parseInt(req.params.id as string, 10);
      const action = String(req.params.action);
      if (!Number.isInteger(reportId) || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Action de rapport invalide" });
      }

      const reports = await storage.getShareReports();
      const report = reports.find((item) => item.id === reportId);
      if (!report) return res.status(404).json({ message: "Rapport introuvable" });
      if (report.status !== "pending") {
        return res.status(400).json({ message: "Ce rapport a déjà été traité" });
      }

      const updatedReport = await storage.updateShareReport(reportId, {
        status: action === "approve" ? "approved" : "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      await storage.logAdminAction(
        req.session.userId!,
        `${action}_share_report`,
        report.userId,
        `Rapport de partage ${report.id} ${action === "approve" ? "approuvé" : "rejeté"}`,
      );
      return res.json(updatedReport);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/approve", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id as string, 10);
      const existing = await storage.getDeposit(depositId);
      if (!existing) return res.status(404).json({ message: "Dépôt introuvable" });
      if (existing.paymentMethod === "NOWPayments") {
        return res.status(400).json({
          message: "Les dépôts NOWPayments sont crédités uniquement après rapprochement IPN validé",
        });
      }
      if (!["pending", "processing"].includes(existing.status)) {
        return res.status(409).json({ message: "Ce dépôt a déjà été traité" });
      }
      const approval = await storage.approveManualDepositExactlyOnce(depositId, req.session.userId!);
      if (!approval.deposit) return res.status(404).json({ message: "Dépôt introuvable" });
      if (!approval.credited) return res.status(409).json({ message: "Ce dépôt a déjà été traité" });
      const deposit = approval.deposit;

      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé: ${deposit.amount} XOF`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/reject", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const { ban } = req.body;
      const deposit = await storage.updateDeposit(parseInt(req.params.id as string), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });

      if (ban) {
        await storage.updateUser(deposit.userId, { isBanned: true });
        await storage.logAdminAction(req.session.userId!, "ban_user", deposit.userId, `Utilisateur banni pour fraude`);
      }

      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/verify-pin", requireAuth, async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Acces refuse" });
      }
      
      // If password is not required for this admin, auto-verify
      if (user.isAdminPasswordRequired === false) {
        return res.json({ success: true });
      }

      if (!user.adminPin) {
        return res.status(400).json({ message: "Code PIN non configure" });
      }
      
      if (user.adminPin !== pin) {
        return res.status(401).json({ message: "Code PIN incorrect" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const withdrawals = await storage.getWithdrawals(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? withdrawals : withdrawals.filter(w => w.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/start-nowpayments", requireAdmin, requireSameOrigin, async (req, res) => {
    let claimedWithdrawalId: number | undefined;
    let payoutMayExist = false;
    try {
      const settings = await storage.getSettings();
      if (normalizeWithdrawalMode(settings.withdrawalMode) !== "semi_auto") {
        return res.status(400).json({ message: "Le mode semi-automatique NOWPayments est désactivé" });
      }
      if (!isNowPaymentsPayoutConfigured()) {
        return res.status(503).json({
          message: "NOWPayments payout n'est pas entièrement configuré (API, IPN HTTPS et identifiants de compte requis)",
        });
      }

      const withdrawalId = parseInt(req.params.id as string, 10);
      if (!Number.isInteger(withdrawalId)) {
        return res.status(400).json({ message: "Identifiant de retrait invalide" });
      }
      // NOWPayments uses this durable reference for reconciliation; do not rename it.
      const externalId = `tgood-withdrawal-${withdrawalId}`;
      const withdrawal = await storage.claimWithdrawalForNowPayments(
        withdrawalId,
        req.session.userId!,
        externalId,
      );
      if (!withdrawal) {
        return res.status(409).json({
          message: "Ce retrait est déjà en cours de traitement ou a déjà été envoyé",
        });
      }
      claimedWithdrawalId = withdrawal.id;

      const payout = await createPayout({
        address: withdrawal.accountNumber,
        currency: "usdtbsc",
        amount: Number(withdrawal.netAmount),
        uniqueExternalId: withdrawal.nowPaymentsExternalId || externalId,
        description: `Retrait DIAMANT #${withdrawal.id}`,
      });
      payoutMayExist = true;
      const payoutItem = payout.withdrawals?.[0];
      const payoutId = payoutItem?.id;
      const batchId = payoutItem?.batchWithdrawalId || payoutItem?.batch_withdrawal_id || payout.id;
      if (!payoutId || !batchId) {
        throw new Error("NOWPayments n'a pas retourné les identifiants de payout attendus");
      }

      const updated = await storage.updateWithdrawal(withdrawal.id, {
        status: "pending_2fa",
        nowPaymentsPayoutId: payoutId,
        nowPaymentsBatchId: batchId,
        nowPaymentsStatus: (payoutItem.status || "PENDING_2FA").toUpperCase(),
        nowPaymentsError: null,
      });
      await storage.logAdminAction(
        req.session.userId!,
        "start_nowpayments_withdrawal",
        withdrawal.userId,
        `Retrait ${withdrawal.id} envoyé à NOWPayments; validation 2FA requise`,
      );
      return res.json(updated);
    } catch (error: any) {
      const requestMayHaveReachedProvider =
        payoutMayExist ||
        (error instanceof NowPaymentsPayoutError && error.requestMayHaveReachedProvider);
      if (claimedWithdrawalId && !requestMayHaveReachedProvider) {
        await storage.refundWithdrawal(
          claimedWithdrawalId,
          "failed",
          `Échec de création du payout NOWPayments: ${error.message || "erreur inconnue"}`,
        );
      }
      if (claimedWithdrawalId && requestMayHaveReachedProvider) {
        try {
          await storage.updateWithdrawal(claimedWithdrawalId, {
            status: "reconciling",
            nowPaymentsStatus: "RECONCILIATION_REQUIRED",
            nowPaymentsError: `Payout NOWPayments possiblement créé : ${error.message || "réponse ambiguë"}`,
          });
        } catch (reconciliationError) {
          console.error(
            `NOWPayments reconciliation state could not be saved for withdrawal ${claimedWithdrawalId}:`,
            reconciliationError,
          );
        }
        return res.status(502).json({
          message: "La réponse NOWPayments est ambiguë. Le retrait est conservé pour rapprochement et n'a pas été remboursé automatiquement.",
        });
      }
      return res.status(502).json({ message: error.message || "Impossible de créer le payout NOWPayments" });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (normalizeWithdrawalMode(settings.withdrawalMode) !== "manual") {
        return res.status(400).json({ message: "Utilisez l'action NOWPayments en mode semi-automatique" });
      }
      const withdrawalId = parseInt(req.params.id as string);
      const existingWithdrawal = await storage.getWithdrawals();
      const withdrawalData = existingWithdrawal.find(w => w.id === withdrawalId);
      
      if (!withdrawalData) {
        return res.status(404).json({ message: "Retrait non trouve" });
      }
      if (withdrawalData.status !== "pending") {
        return res.status(409).json({ message: "Ce retrait a déjà été traité" });
      }

      const withdrawal = await storage.updateWithdrawal(withdrawalId, {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé: ${withdrawalData.netAmount} XOF`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id as string, 10);
      const withdrawals = await storage.getWithdrawals();
      const existing = withdrawals.find((item) => item.id === withdrawalId);
      if (!existing) return res.status(404).json({ message: "Retrait non trouvé" });
      if (existing.status !== "pending") {
        return res.status(409).json({ message: "Seul un retrait en attente peut être rejeté" });
      }
      const withdrawal = await storage.refundWithdrawal(
        withdrawalId,
        "rejected",
        "Retrait rejeté par l'administration",
      );
      if (!withdrawal) {
        return res.status(409).json({ message: "Ce retrait a déjà été traité" });
      }

      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = (req.query.search as string) || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { users: allUsers, total } = await storage.getAllUsers(search, limit, offset);
      const usersWithTeam = await Promise.all(allUsers.map(async (user) => {
        const teamStats = await storage.getTeamStatsSimple(user.id);
        return {
          ...user,
          password: undefined,
          transactionPassword: undefined,
          ...teamStats,
          referrerName: null,
        };
      }));
      res.json({ users: usersWithTeam, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const adminUser = await storage.getUser(req.session.userId!);
      const targetUser = await storage.getUser(userId);

      if (!targetUser) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
      }
      if ((targetUser.isAdmin || targetUser.isSuperAdmin) && !adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Seul un super admin peut supprimer un administrateur" });
      }
      if (targetUser.isSuperAdmin) {
        return res.status(403).json({ message: "Impossible de supprimer un super administrateur" });
      }

      await storage.deleteUser(userId);
      await storage.logAdminAction(req.session.userId!, "delete_user", userId, `Utilisateur ${targetUser.phone} supprimé définitivement`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/team", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const team = await storage.getDetailedTeam(userId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/:action", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const action = req.params.action;
      const { value } = req.body;
      const adminUser = await storage.getUser(req.session.userId!);

      switch (action) {
        case "balance":
          await storage.updateUser(userId, { balance: value.toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_balance", userId, `Solde modifié: ${value} XOF`);
          break;
        case "password":
          await storage.updateUser(userId, { password: value });
          await storage.logAdminAction(req.session.userId!, "reset_password", userId, `Mot de passe réinitialisé`);
          break;
        case "toggle-ban":
          const user1 = await storage.getUser(userId);
          await storage.updateUser(userId, { isBanned: !user1?.isBanned });
          await storage.logAdminAction(req.session.userId!, "toggle_ban", userId, `Statut banni: ${!user1?.isBanned}`);
          break;
        case "toggle-withdrawal":
          const user2 = await storage.getUser(userId);
          await storage.updateUser(userId, { isWithdrawalBlocked: !user2?.isWithdrawalBlocked });
          await storage.logAdminAction(req.session.userId!, "toggle_withdrawal", userId, `Retrait bloqué: ${!user2?.isWithdrawalBlocked}`);
          break;
        case "toggle-promoter":
          const user3 = await storage.getUser(userId);
          await storage.updateUser(userId, { isPromoter: !user3?.isPromoter, promoterSetBy: req.session.userId });
          await storage.logAdminAction(req.session.userId!, "toggle_promoter", userId, `Promoteur: ${!user3?.isPromoter}`);
          break;
        case "toggle-must-invite":
          const user4 = await storage.getUser(userId);
          await storage.updateUser(userId, { mustInviteToWithdraw: !user4?.mustInviteToWithdraw });
          await storage.logAdminAction(req.session.userId!, "toggle_must_invite", userId, `Doit inviter: ${!user4?.mustInviteToWithdraw}`);
          break;
        case "toggle-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const user5 = await storage.getUser(userId);
          const newAdminStatus = !user5?.isAdmin;
          await storage.updateUser(userId, { 
            isAdmin: newAdminStatus,
            adminSetBy: req.session.userId,
            adminSetAt: new Date(),
            adminPin: newAdminStatus && value ? value : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_admin", userId, `Admin: ${newAdminStatus}`);
          break;
        case "update-admin-pin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { adminPin: value });
          await storage.logAdminAction(req.session.userId!, "update_admin_pin", userId, `PIN admin mis à jour`);
          break;
        case "toggle-password-required":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { isAdminPasswordRequired: value });
          await storage.logAdminAction(req.session.userId!, "toggle_password_required", userId, `Mot de passe admin requis: ${value}`);
          break;
        case "assign-product":
          await storage.purchaseProduct(userId, value, true);
          await storage.logAdminAction(req.session.userId!, "assign_product", userId, `Produit ${value} attribué`);
          break;
        case "revoke-product":
          await storage.removeUserProduct(userId, value);
          await storage.logAdminAction(req.session.userId!, "revoke_product", userId, `Produit ${value} révoqué`);
          break;
        case "toggle-super-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const userSA = await storage.getUser(userId);
          const newSuperAdminStatus = !userSA?.isSuperAdmin;
          await storage.updateUser(userId, {
            isSuperAdmin: newSuperAdminStatus,
            isAdmin: newSuperAdminStatus ? true : userSA?.isAdmin,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_super_admin", userId, `Super Admin: ${newSuperAdminStatus}`);
          break;
        case "toggle-banker":
          if (!adminUser?.isSuperAdmin && !adminUser?.isAdmin) {
            return res.status(403).json({ message: "Action réservée aux admins" });
          }
          const userBanker = await storage.getUser(userId);
          const newBankerStatus = !userBanker?.isBanker;
          await storage.updateUser(userId, { 
            isBanker: newBankerStatus,
            bankerSetBy: newBankerStatus ? req.session.userId : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_banker", userId, `Bankier: ${newBankerStatus}`);
          break;
        case "total-earnings":
          await storage.updateUser(userId, { totalEarnings: Number(value).toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_total_earnings", userId, `Solde des gains modifié: ${value} XOF`);
          break;
        default:
          return res.status(400).json({ message: "Action invalide" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/products/all", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getAllProductsAdmin();
      res.json(allProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/products", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id as string);
      const userProductsList = await storage.getAllUserProducts(userId);
      res.json(userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        productName: up.product.name,
        productPrice: up.product.price,
        dailyEarnings: up.product.dailyEarnings,
        isActive: up.userProduct.isActive,
        purchaseDate: up.userProduct.purchaseDate,
        daysClaimed: up.product.cycleDays - up.userProduct.daysRemaining,
        totalCycle: up.product.cycleDays,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { name, price, dailyEarnings, cycleDays, imageUrl, minInviteCount, maxOwned, stockPercentage } = req.body;
      const productType = req.body.productType ?? "all";
      if (!name || !price || !dailyEarnings || !cycleDays) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      if (!PRODUCT_TYPES.includes(productType)) {
        return res.status(400).json({ message: "Type de produit invalide" });
      }
      const priceNum = parseFloat(price);
      const dailyNum = parseFloat(dailyEarnings);
      const cycleInt = parseInt(cycleDays);
      if (
        !Number.isFinite(priceNum) || priceNum <= 0 ||
        !Number.isFinite(dailyNum) || dailyNum <= 0 ||
        !Number.isInteger(cycleInt) || cycleInt <= 0
      ) {
        return res.status(400).json({ message: "Prix, gains et durée doivent être des valeurs positives valides" });
      }
      const product = await storage.createProduct({
        name,
        productType,
        price: String(priceNum),
        dailyEarnings: String(dailyNum),
        cycleDays: cycleInt,
        totalReturn: String((dailyNum * cycleInt).toFixed(2)),
        imageUrl: imageUrl || null,
        isFree: false,
        isActive: true,
        sortOrder: 0,
        seriesId: null,
        minInviteCount: parseInt(minInviteCount) || 0,
        maxOwned: parseInt(maxOwned) || 0,
        collectAtEnd: false,
        stockPercentage: Math.min(100, Math.max(0, parseInt(stockPercentage) || 0)),
      });
      await storage.logAdminAction(req.session.userId!, "create_product", null, `Produit ${product.name} créé`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      // This legacy switch no longer controls payout behavior. Preserve stored
      // values so existing purchases can still be interpreted correctly.
      delete body.collectAtEnd;
      if (body.productType !== undefined && !PRODUCT_TYPES.includes(body.productType)) {
        return res.status(400).json({ message: "Type de produit invalide" });
      }
      // Normalize numeric fields when present
      if (body.minInviteCount !== undefined) body.minInviteCount = parseInt(body.minInviteCount) || 0;
      if (body.maxOwned !== undefined) body.maxOwned = parseInt(body.maxOwned) || 0;
      if (body.stockPercentage !== undefined) body.stockPercentage = Math.min(100, Math.max(0, parseInt(body.stockPercentage) || 0));
      const product = await storage.updateProduct(parseInt(req.params.id as string), body);
      await storage.logAdminAction(req.session.userId!, "update_product", null, `Produit ${product.id} modifié`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteProduct(id);
      await storage.logAdminAction(req.session.userId!, "delete_product", null, `Produit ${id} supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ─── Admin Tasks CRUD ───────────────────────────────────────────────────────
  app.get("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasksAdmin();
      res.json(allTasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/tasks", requireAdmin, async (req, res) => {
    try {
      const { name, description, requiredInvites, reward, sortOrder } = req.body;
      if (!name || !description || requiredInvites == null || reward == null) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const task = await storage.createTask({
        name,
        description,
        requiredInvites: parseInt(requiredInvites),
        reward: parseFloat(reward),
        sortOrder: parseInt(sortOrder ?? 0),
        isActive: true,
      });
      await storage.logAdminAction(req.session.userId!, "create_task", null, `Tâche "${name}" créée`);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const data = req.body;
      if (data.requiredInvites != null) data.requiredInvites = parseInt(data.requiredInvites);
      if (data.reward != null) data.reward = parseFloat(data.reward);
      if (data.sortOrder != null) data.sortOrder = parseInt(data.sortOrder);
      const task = await storage.updateTask(id, data);
      await storage.logAdminAction(req.session.userId!, "update_task", null, `Tâche ${id} modifiée`);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteTask(id);
      await storage.logAdminAction(req.session.userId!, "delete_task", null, `Tâche ${id} supprimée`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channels = await storage.getPaymentChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.createPaymentChannel({
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "create_channel", null, `Canal ${channel.name} créé`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.updatePaymentChannel(parseInt(req.params.id as string), {
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "update_channel", null, `Canal ${channel.name} modifié`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentChannel(parseInt(req.params.id as string));
      await storage.logAdminAction(req.session.userId!, "delete_channel", null, `Canal supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(normalizePublicSettings(settings));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/spin-wheel/ranking", requireAdmin, async (req, res) => {
    try {
      const config = parseSpinWheelRankingConfig(
        await storage.getSetting(SPIN_WHEEL_RANKING_SETTING_KEY),
      );
      const phoneTerm = typeof req.query.phone === "string" ? req.query.phone.trim() : "";
      const phoneDigits = phoneTerm.replace(/\D/g, "");
      if (phoneTerm && phoneDigits.length < 4) {
        return res.status(400).json({ message: "Saisis au moins 4 chiffres pour rechercher un numéro." });
      }

      const configuredIds = Array.from(new Set([
        ...config.pinnedTransactionIds,
        ...config.hiddenTransactionIds,
      ]));
      const validConfiguredRows = configuredIds.length
        ? await pool.query<{ id: number }>(
            `SELECT id
               FROM transactions
              WHERE type = 'spin_reward'
                AND amount > 0
                AND id = ANY($1::int[])`,
            [configuredIds],
          )
        : { rows: [] };
      const validConfiguredIds = new Set(validConfiguredRows.rows.map((row) => Number(row.id)));
      const pinnedTransactionIds = config.pinnedTransactionIds.filter((id) => validConfiguredIds.has(id));
      const hiddenTransactionIds = config.hiddenTransactionIds.filter((id) => validConfiguredIds.has(id));

      let pinnedRows: SpinWheelRewardRow[] = [];
      if (pinnedTransactionIds.length > 0) {
        pinnedRows = (await pool.query<SpinWheelRewardRow>(
          `SELECT t.id, u.phone, t.amount, t.description, t.created_at
             FROM transactions t
             JOIN users u ON u.id = t.user_id
            WHERE t.type = 'spin_reward'
              AND t.amount > 0
              AND t.id = ANY($1::int[])`,
          [pinnedTransactionIds],
        )).rows;
      }

      const candidates = phoneDigits
        ? await pool.query<SpinWheelRewardRow>(
            `SELECT t.id, u.phone, t.amount, t.description, t.created_at
               FROM transactions t
               JOIN users u ON u.id = t.user_id
              WHERE t.type = 'spin_reward'
                AND t.amount > 0
                AND regexp_replace(COALESCE(u.phone, ''), '[^0-9]', '', 'g') LIKE $1
              ORDER BY t.created_at DESC
              LIMIT 30`,
            [`%${phoneDigits}%`],
          )
        : await pool.query<SpinWheelRewardRow>(
            `SELECT t.id, u.phone, t.amount, t.description, t.created_at
               FROM transactions t
               JOIN users u ON u.id = t.user_id
              WHERE t.type = 'spin_reward'
                AND t.amount > 0
              ORDER BY t.created_at DESC
              LIMIT 30`,
          );

      const rowsById = new Map<number, SpinWheelRewardRow>();
      for (const row of pinnedRows) rowsById.set(Number(row.id), row);
      for (const row of candidates.rows) rowsById.set(Number(row.id), row);

      const pinnedOrder = new Map(pinnedTransactionIds.map((id, index) => [id, index]));
      const hiddenIds = new Set(hiddenTransactionIds);
      const entries = Array.from(rowsById.values())
        .sort((a, b) => {
          const aPinned = pinnedOrder.get(Number(a.id));
          const bPinned = pinnedOrder.get(Number(b.id));
          if (aPinned !== undefined || bPinned !== undefined) {
            if (aPinned === undefined) return 1;
            if (bPinned === undefined) return -1;
            return aPinned - bPinned;
          }
          return spinWheelTimestamp(b.created_at) - spinWheelTimestamp(a.created_at);
        })
        .map((row) => ({
          id: Number(row.id),
          phone: maskSpinWheelPhone(row.phone),
          amount: row.amount,
          description: row.description,
          createdAt: spinWheelTimestampIso(row.created_at),
          isVisible: !hiddenIds.has(Number(row.id)),
        }));

      res.json({ entries, pinnedTransactionIds, hiddenTransactionIds });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/spin-wheel/ranking", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const parsed = spinWheelRankingConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "La liste des gains épinglés ou masqués est invalide.",
        });
      }

      const config = parsed.data;
      const configuredIds = Array.from(new Set([
        ...config.pinnedTransactionIds,
        ...config.hiddenTransactionIds,
      ]));
      if (configuredIds.length > 0) {
        const validRows = await pool.query<{ id: number }>(
          `SELECT id
             FROM transactions
            WHERE type = 'spin_reward'
              AND amount > 0
              AND id = ANY($1::int[])`,
          [configuredIds],
        );
        const validIds = new Set(validRows.rows.map((row) => Number(row.id)));
        if (configuredIds.some((id) => !validIds.has(id))) {
          return res.status(400).json({
            message: "Seuls les gains de roue réellement enregistrés peuvent être ajoutés au classement.",
          });
        }
      }

      await storage.setSetting(
        SPIN_WHEEL_RANKING_SETTING_KEY,
        JSON.stringify(config),
        req.session.userId,
      );
      await storage.logAdminAction(
        req.session.userId!,
        "update_spin_wheel_ranking",
        null,
        `${config.pinnedTransactionIds.length} gain(s) épinglé(s), ${config.hiddenTransactionIds.length} gain(s) masqué(s)`,
      );
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/spin-wheel/config", requireAdmin, async (_req, res) => {
    try {
      const value = await storage.getSetting(SPIN_WHEEL_SETTING_KEY);
      res.json(parseSpinWheelSegments(value));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/spin-wheel/config", requireAdmin, async (req, res) => {
    try {
      const input = req.body?.segments;
      if (!Array.isArray(input) || input.length !== DEFAULT_SPIN_WHEEL_SEGMENTS.length) {
        return res.status(400).json({ message: "La roue doit contenir exactement 8 sections." });
      }

      const segments: SpinWheelSegment[] = input.map((segment: any, index: number) => {
        const amount = Number(segment.amount);
        if (!Number.isFinite(amount) || amount < 0) {
          throw new Error(`Montant invalide pour la section ${index + 1}`);
        }
        if (typeof segment.label !== "string" || !segment.label.trim()) {
          throw new Error(`Nom obligatoire pour la section ${index + 1}`);
        }
        if (typeof segment.color !== "string" || !/^#[0-9a-f]{6}$/i.test(segment.color)) {
          throw new Error(`Couleur invalide pour la section ${index + 1}`);
        }
        const weight = Number(segment.weight);
        return {
          ...DEFAULT_SPIN_WHEEL_SEGMENTS[index],
          id: index + 1,
          label: segment.label.trim().slice(0, 40),
          amount,
          color: segment.color,
          dark: typeof segment.dark === "string" && /^#[0-9a-f]{6}$/i.test(segment.dark)
            ? segment.dark
            : DEFAULT_SPIN_WHEEL_SEGMENTS[index].dark,
          canWin: Boolean(segment.canWin),
          imageUrl: typeof segment.imageUrl === "string" && segment.imageUrl.trim()
            ? segment.imageUrl.trim()
            : undefined,
          weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        };
      });

      if (!segments.some((segment) => segment.canWin)) {
        return res.status(400).json({ message: "Au moins une section doit être gagnable." });
      }

      await storage.setSetting(SPIN_WHEEL_SETTING_KEY, JSON.stringify(segments), req.session.userId);
      await storage.logAdminAction(req.session.userId!, "update_spin_wheel", null, "Configuration de la roue modifiée");
      res.json(segments);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/settings", requireAdmin, requireSameOrigin, async (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ message: "Paramètres invalides" });
      }

      // Existing admin editors submit one setting as { key, value }; newer
      // editors may submit a whole key/value map in one request.
      const isSingleSettingPayload =
        typeof body.key === "string" &&
        Object.prototype.hasOwnProperty.call(body, "value") &&
        Object.keys(body).length === 2;
      const entries: [string, unknown][] = isSingleSettingPayload
        ? [[body.key, body.value]]
        : Object.entries(body);
      const spinRewardSettingKeys = new Set([
        "spinWheelSelfPurchaseSpins",
        "spinWheelReferralPurchaseSpins",
      ]);
      const referralCommissionSettingKeys = new Set([
        "level1Commission",
        "level2Commission",
        "level3Commission",
      ]);

      // Validate all configurable spin rewards before saving any part of a
      // bulk update, so malformed values cannot leave the panel half-saved.
      for (const [key, value] of entries) {
        if (!spinRewardSettingKeys.has(key)) continue;
        const spins = typeof value === "number"
          ? value
          : typeof value === "string" && value.trim() !== ""
            ? Number(value.trim())
            : Number.NaN;
        if (!Number.isSafeInteger(spins) || spins < 0 || spins > 10_000) {
          return res.status(400).json({
            message: "Le nombre de tours doit être un entier entre 0 et 10 000",
          });
        }
      }

      for (const [key, value] of entries) {
        if (!referralCommissionSettingKeys.has(key)) continue;
        const rate = typeof value === "number"
          ? value
          : typeof value === "string" && value.trim() !== ""
            ? Number(value.trim())
            : Number.NaN;
        if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
          return res.status(400).json({
            message: "Chaque taux de commission doit être un nombre entre 0 et 100",
          });
        }
      }

      for (const [key, value] of entries) {
        if (key === "withdrawalMode") {
          const mode = normalizeWithdrawalMode(typeof value === "string" ? value : undefined);
          if (
            typeof value !== "string" ||
            !["manual", "semi_auto", "auto"].includes(value)
          ) {
            return res.status(400).json({ message: "Mode de retrait invalide" });
          }
          await storage.setSetting(key, mode, req.session.userId);
        } else if (spinRewardSettingKeys.has(key)) {
          const spins = typeof value === "number" ? value : Number(String(value).trim());
          await storage.setSetting(key, String(spins), req.session.userId);
        } else if (referralCommissionSettingKeys.has(key)) {
          const rate = typeof value === "number" ? value : Number(String(value).trim());
          await storage.setSetting(key, String(rate), req.session.userId);
        } else {
          const normalizedValue = typeof value === "string" && [
            "supportLink",
            "support2Link",
            "channelLink",
            "groupLink",
          ].includes(key)
            ? normalizeTelegramLink(value)
            : value;
          await storage.setSetting(key, normalizedValue as string, req.session.userId);
        }
      }
      await storage.logAdminAction(req.session.userId!, "update_settings", null, `Paramètres modifiés`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset stats route (Super Admin only)
  app.post("/api/admin/reset-stats", requireAdmin, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Action réservée au super admin" });
      }

      await storage.resetStats();
      await storage.logAdminAction(req.session.userId!, "reset_stats", null, "Réinitialisation des statistiques de la plateforme");
      res.json({ success: true, message: "Statistiques réinitialisées" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Gift Codes Routes
  app.get("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllGiftCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const createGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
    amount: z.preprocess(
      (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
      z.number().positive("Le montant doit etre positif").optional(),
    ),
    amountMin: z.preprocess(
      (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
      z.number().positive("Le montant minimum doit etre positif").optional(),
    ),
    amountMax: z.preprocess(
      (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
      z.number().positive("Le montant maximum doit etre positif").optional(),
    ),
    randomAmount: z.boolean().optional().default(false),
    maxUses: z.number().int().positive("Le nombre d'utilisations doit etre positif"),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Date d'expiration invalide"),
  }).superRefine((data, ctx) => {
    if (data.randomAmount) {
      if (data.amountMin === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountMin"], message: "Le montant minimum est requis" });
      }
      if (data.amountMax === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountMax"], message: "Le montant maximum est requis" });
      }
      if (data.amountMin !== undefined && data.amountMax !== undefined && data.amountMin > data.amountMax) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountMax"], message: "Le maximum doit etre superieur ou egal au minimum" });
      }
    } else if (data.amount === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "Le montant est requis" });
    }
  });

  app.post("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const parseResult = createGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Donnees invalides" });
      }

      const { code, amount, amountMin, amountMax, randomAmount, maxUses, expiresAt } = parseResult.data;

      const existingCode = await storage.getGiftCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Ce code existe deja" });
      }

      const giftCode = await storage.createGiftCode({
        code,
        amount: (randomAmount ? amountMin : amount)!.toString(),
        amountMin: randomAmount ? amountMin!.toString() : null,
        amountMax: randomAmount ? amountMax!.toString() : null,
        maxUses,
        expiresAt: new Date(expiresAt),
        createdBy: req.session.userId!,
      });

      const amountLabel = randomAmount
        ? `${amountMin} à ${amountMax} XOF (aléatoire)`
        : `${amount} XOF`;
      await storage.logAdminAction(req.session.userId!, "create_gift_code", null, `Code cadeau cree: ${code} - ${amountLabel}`);
      res.json(giftCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/gift-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteGiftCode(id);
      await storage.logAdminAction(req.session.userId!, "delete_gift_code", null, `Code cadeau supprimé: #${id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const claimGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
  });

  app.post("/api/gift-codes/claim", requireAuth, async (req, res) => {
    try {
      const parseResult = claimGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Le code est requis" });
      }

      const code = parseResult.data.code.trim().toUpperCase();
      const userId = req.session.userId!;

      const giftCode = await storage.getGiftCodeByCode(code);
      if (!giftCode) {
        return res.status(404).json({ message: "Code invalide" });
      }

      if (!giftCode.isActive) {
        return res.status(400).json({ message: "Ce code n'est plus actif" });
      }

      if (new Date() > new Date(giftCode.expiresAt)) {
        return res.status(400).json({ message: "Ce code a expiré" });
      }

      if (giftCode.currentUses >= giftCode.maxUses) {
        return res.status(400).json({ message: "Ce code a atteint sa limite d'utilisation" });
      }

      const hasClaimed = await storage.hasUserClaimedGiftCode(userId, giftCode.id);
      if (hasClaimed) {
        return res.status(400).json({ message: "Vous avez déjà utilisé ce code" });
      }

      let rewardAmount = parseFloat(giftCode.amount);
      if (giftCode.amountMin !== null && giftCode.amountMax !== null) {
        const minCents = Math.round(parseFloat(giftCode.amountMin) * 100);
        const maxCents = Math.round(parseFloat(giftCode.amountMax) * 100);
        rewardAmount = crypto.randomInt(minCents, maxCents + 1) / 100;
      }

      await storage.claimGiftCode(userId, giftCode.id, rewardAmount);
      
      res.json({ 
        success: true, 
        message: `Félicitations! Vous avez reçu ${rewardAmount.toLocaleString()} XOF`,
        amount: rewardAmount
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Countries routes (public)
  app.get("/api/countries", async (req, res) => {
    try {
       const activeCountries = await storage.getActiveCountries();
       res.json(activeCountries.map((country) => ({ ...country, currency: "USDT" })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Le portefeuille USDT BEP20 est le seul moyen de retrait, pour tous les pays.
  app.get("/api/countries/:code/operators", requireAuth, async (req, res) => {
    try {
      const codeParam = req.params.code;
      const code = (Array.isArray(codeParam) ? codeParam[0] : codeParam).toUpperCase();
      const allCountries = await storage.getActiveCountries();
      const country = allCountries.find((c: any) => c.code === code);
       if (!country) return res.json([]);
       res.json(["USDT BEP20"]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin country routes
  app.get("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
       const allCountries = await storage.getCountries();
       res.json(allCountries.map((country) => ({ ...country, currency: "USDT" })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const { code, name, phonePrefix, operators, isActive, autoPaymentEnabled } = req.body;
      if (!code || !name || !phonePrefix) {
        return res.status(400).json({ message: "Code, nom, devise et indicatif sont requis" });
      }
      if (String(code).toUpperCase() !== "CD") {
        return res.status(400).json({ message: "Seule la République démocratique du Congo est disponible." });
      }
      const country = await storage.createCountry({
        code: code.toUpperCase(),
        name,
        currency: "USDT",
        phonePrefix,
        operators: operators || "[]",
        isActive: isActive !== undefined ? isActive : true,
        autoPaymentEnabled: autoPaymentEnabled !== undefined ? autoPaymentEnabled : false,
      });
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { name, phonePrefix, operators, isActive, autoPaymentEnabled } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      updateData.currency = "USDT";
      if (phonePrefix !== undefined) updateData.phonePrefix = phonePrefix;
      if (operators !== undefined) updateData.operators = operators;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (autoPaymentEnabled !== undefined) updateData.autoPaymentEnabled = autoPaymentEnabled;
      const country = await storage.updateCountry(id, updateData);
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteCountry(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== FILE UPLOAD ====================
  const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const supportChatUploadsDir = path.join(process.cwd(), "uploads", "support-chat");
  if (!fs.existsSync(supportChatUploadsDir)) fs.mkdirSync(supportChatUploadsDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase() || ".jpg";
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Seules les images sont acceptées"));
    },
  });

  app.post("/api/admin/upload", requireAdmin, upload.single("file"), (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const supportChatFileRules: Record<string, { extension: string; type: "image" | "video" | "file" }> = {
    "image/jpeg": { extension: ".jpg", type: "image" },
    "image/png": { extension: ".png", type: "image" },
    "image/webp": { extension: ".webp", type: "image" },
    "image/gif": { extension: ".gif", type: "image" },
    "video/mp4": { extension: ".mp4", type: "video" },
    "video/webm": { extension: ".webm", type: "video" },
    "application/pdf": { extension: ".pdf", type: "file" },
  };

  const supportChatUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, supportChatUploadsDir),
      filename: (_req, file, cb) => {
        const rule = supportChatFileRules[file.mimetype];
        cb(null, `support-${crypto.randomBytes(16).toString("hex")}${rule?.extension || ".bin"}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (supportChatFileRules[file.mimetype]) cb(null, true);
      else cb(new Error("Formats acceptés : image, vidéo MP4/WebM ou PDF"));
    },
  });

  app.get("/api/support-chat/files/:fileName", requireAuth, async (req, res) => {
    try {
      const fileName = String(req.params.fileName);
      if (!/^support-[a-f0-9]{32}\.(?:jpg|png|webp|gif|mp4|webm|pdf)$/i.test(fileName)) {
        return res.status(404).json({ message: "Fichier introuvable" });
      }

      const viewer = await storage.getUser(req.session.userId!);
      if (!viewer) return res.status(401).json({ message: "Non authentifié" });

      const attachmentUrl = `/api/support-chat/files/${fileName}`;
      const ownerId = await storage.getSupportChatAttachmentUserId(attachmentUrl);
      if (ownerId === undefined || (!viewer.isAdmin && ownerId !== viewer.id)) {
        return res.status(404).json({ message: "Fichier introuvable" });
      }

      const filePath = path.join(supportChatUploadsDir, fileName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Fichier introuvable" });

      res.setHeader("X-Content-Type-Options", "nosniff");
      if (path.extname(fileName).toLowerCase() === ".pdf") {
        res.setHeader("Content-Disposition", "attachment; filename=\"piece-jointe.pdf\"");
      }
      return res.sendFile(filePath);
    } catch (error) {
      console.error("Support chat attachment access error:", error);
      return res.status(500).json({ message: "Impossible d'ouvrir cette pièce jointe" });
    }
  });

  app.post("/api/support-chat/upload", requireAuth, requireSameOrigin, (req, res) => {
    supportChatUpload.single("file")(req, res, (error: any) => {
      if (error) {
        const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({ message: error.message || "Impossible de recevoir le fichier" });
      }
      if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu" });

      const rule = supportChatFileRules[req.file.mimetype];
      if (!rule) return res.status(400).json({ message: "Format de fichier non accepté" });

      const name = path.basename(req.file.originalname).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "Fichier";
      return res.status(201).json({
        url: `/api/support-chat/files/${req.file.filename}`,
        type: rule.type,
        mimeType: req.file.mimetype,
        name,
      });
    });
  });

  // ==================== BANKER ROUTES ====================
  // Accessible to both admins and bankers

  app.get("/api/banker/deposits", requireBanker, async (req, res) => {
    try {
      const deposits = await storage.getDeposits();
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/banker/withdrawals", requireBanker, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/approve", requireBanker, requireSameOrigin, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id as string, 10);
      const existing = await storage.getDeposit(depositId);
      if (!existing) return res.status(404).json({ message: "Dépôt introuvable" });
      if (existing.paymentMethod === "NOWPayments") {
        return res.status(400).json({
          message: "Les dépôts NOWPayments sont crédités uniquement après rapprochement IPN validé",
        });
      }
      if (!["pending", "processing"].includes(existing.status)) {
        return res.status(409).json({ message: "Ce dépôt a déjà été traité" });
      }
      const approval = await storage.approveManualDepositExactlyOnce(depositId, req.session.userId!);
      if (!approval.deposit) return res.status(404).json({ message: "Dépôt introuvable" });
      if (!approval.credited) return res.status(409).json({ message: "Ce dépôt a déjà été traité" });
      const deposit = approval.deposit;
      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé par bankier: ${deposit.amount} XOF`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/reject", requireBanker, requireSameOrigin, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id as string, 10);
      const existing = await storage.getDeposit(depositId);
      if (!existing) return res.status(404).json({ message: "Dépôt introuvable" });
      if (!["pending", "processing", "review"].includes(existing.status)) {
        return res.status(409).json({ message: "Ce dépôt a déjà été traité" });
      }
      const deposit = await storage.updateDeposit(depositId, {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });
      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté par bankier`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/approve", requireBanker, requireSameOrigin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (normalizeWithdrawalMode(settings.withdrawalMode) !== "manual") {
        return res.status(400).json({ message: "Le mode semi-automatique exige le lancement et le 2FA NOWPayments par un administrateur" });
      }
      const allWithdrawals = await storage.getWithdrawals();
      const withdrawalData = allWithdrawals.find(w => w.id === parseInt(req.params.id as string));
      if (!withdrawalData) return res.status(404).json({ message: "Retrait non trouvé" });
      if (withdrawalData.status !== "pending") {
        return res.status(409).json({ message: "Ce retrait a déjà été traité" });
      }
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id as string), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé par bankier: ${withdrawalData.netAmount} XOF`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/reject", requireBanker, requireSameOrigin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id as string, 10);
      const allWithdrawals = await storage.getWithdrawals();
      const existing = allWithdrawals.find((item) => item.id === withdrawalId);
      if (!existing) return res.status(404).json({ message: "Retrait non trouvé" });
      if (existing.status !== "pending") {
        return res.status(409).json({ message: "Seul un retrait en attente peut être rejeté" });
      }
      const withdrawal = await storage.refundWithdrawal(
        withdrawalId,
        "rejected",
        "Retrait rejeté par le banker",
      );
      if (!withdrawal) {
        return res.status(409).json({ message: "Ce retrait a déjà été traité" });
      }
      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté par bankier et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ── WestPay webhook ────────────────────────────────────────────────────
  // Must be declared BEFORE the static-file catch-all.
  // WestPay sends: POST with X-RobotPay-Signature + X-RobotPay-Event headers.
  // A GET/empty POST health check is safe because it never processes a payment.
  app.get("/api/webhook/westpay", (_req, res) => {
    res.status(200).json({ received: true, service: "westpay-webhook" });
  });

  app.post("/api/webhook/westpay", async (req, res) => {
    try {
      const signature = (req.headers["x-robotpay-signature"] as string) || "";
      const event     = (req.headers["x-robotpay-event"]     as string) || "";
      const hasBody = req.body && typeof req.body === "object" && Object.keys(req.body).length > 0;

      // Some merchant dashboards only perform a connectivity ping. A ping
      // cannot approve a deposit, so acknowledge it without bypassing HMAC
      // verification for any non-empty payment event.
      if (!signature && !event && !hasBody) {
        return res.status(200).json({ received: true, service: "westpay-webhook" });
      }

      const settings = await storage.getSettings();
      const wp = resolveWestpay(settings);
      const secret = wp.secret;

      if (!secret) {
        console.error("[WestPay webhook] Secret non configuré — requête ignorée");
        return res.status(200).json({ received: true }); // 200 so WestPay doesn't retry endlessly
      }

      // Verify HMAC-SHA256 over the raw JSON body
      const rawBody: Buffer | undefined = (req as any).rawBody;
      const bodyStr = rawBody ? rawBody.toString("utf8") : JSON.stringify(req.body ?? {});
      const expected = crypto.createHmac("sha256", secret).update(bodyStr).digest("hex");

      let sigValid = false;
      try {
        sigValid =
          signature.length === expected.length &&
          crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
      } catch {
        sigValid = false;
      }

      if (!sigValid) {
        console.error("[WestPay webhook] Signature invalide");
        return res.status(401).json({ error: "Signature invalide" });
      }

      if (event === "payment.confirmed") {
        const { txId, amount, payer, country } = req.body;
        const numAmount  = Number(amount);
        const payerPhone = payer ? String(payer).replace(/^\+/, "") : null;

        const deposit = await storage.findProcessingWestpayDeposit(numAmount, payerPhone, country || "");
        if (deposit) {
          await storage.approveWestpayDeposit(deposit.id, txId, payer || null);
          console.log(
            `[WestPay webhook] Dépôt #${deposit.id} approuvé — ${numAmount} USDT (txId: ${txId})`,
          );
        } else {
          console.warn(
            `[WestPay webhook] Aucun dépôt en attente pour amount=${numAmount} country=${country}`,
          );
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("[WestPay webhook] Erreur:", error.message);
      res.status(500).json({ message: "Internal error" });
    }
  });

  return httpServer;
}
