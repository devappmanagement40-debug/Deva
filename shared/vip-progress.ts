import { normalizeProductType } from "./product-categories";

export const MAX_VIP_LEVEL = 7;

export interface VipProgress {
  level: number;
  totalInvestmentXof: number;
  progressPercent: number;
  nextLevel: number | null;
  nextThresholdXof: number | null;
  amountRemainingXof: number | null;
}

interface EligiblePurchase {
  amountCents: number;
  purchaseDate: number;
  id: number;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function amountToCents(value: unknown): number {
  const amount = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : 0;
}

function thresholdToCents(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const amount = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER / 100) {
    return null;
  }
  return amount * 100;
}

function getPaidParcoursPurchases(purchases: readonly unknown[]): EligiblePurchase[] {
  const eligible: EligiblePurchase[] = [];

  for (const value of purchases) {
    const root = record(value);
    if (!root) continue;

    const purchase = record(root.userProduct) ?? root;
    const currentProduct = record(root.product) ?? record(purchase.product);
    const snapshot =
      record(purchase.productSnapshot) ??
      record(root.productSnapshot) ??
      currentProduct;

    if (!snapshot) continue;
    if (purchase.assignedByAdmin === true || root.assignedByAdmin === true) continue;
    if (snapshot.isFree === true || currentProduct?.isFree === true) continue;
    if (normalizeProductType(snapshot.productType ?? currentProduct?.productType) !== "wellness") continue;

    const amountCents = amountToCents(snapshot.price ?? currentProduct?.price);
    if (amountCents <= 0) continue;

    const rawDate = purchase.purchaseDate ?? root.purchaseDate ?? root.purchasedAt;
    const parsedDate = rawDate instanceof Date
      ? rawDate.getTime()
      : rawDate
        ? new Date(String(rawDate)).getTime()
        : Number.NaN;
    const rawId = purchase.id ?? root.id;
    const parsedId = Number(rawId);

    eligible.push({
      amountCents,
      purchaseDate: Number.isFinite(parsedDate) ? parsedDate : Number.MAX_SAFE_INTEGER,
      id: Number.isSafeInteger(parsedId) ? parsedId : Number.MAX_SAFE_INTEGER,
    });
  }

  return eligible.sort((a, b) =>
    a.purchaseDate - b.purchaseDate || a.id - b.id
  );
}

/**
 * VIP1 is earned by the first personal paid Parcours purchase. Later ranks use
 * admin-configured cumulative XOF thresholds. The progress bar measures only
 * the current stage, starting from the purchase that reached the current rank.
 */
export function calculateVipProgress(
  purchases: readonly unknown[],
  settings: Record<string, unknown>,
): VipProgress {
  const eligiblePurchases = getPaidParcoursPurchases(purchases);
  if (eligiblePurchases.length === 0) {
    return {
      level: 0,
      totalInvestmentXof: 0,
      progressPercent: 0,
      nextLevel: 1,
      nextThresholdXof: null,
      amountRemainingXof: null,
    };
  }

  let totalCents = 0;
  let level = 0;
  let currentStageStartCents = 0;

  for (const purchase of eligiblePurchases) {
    totalCents += purchase.amountCents;
    if (!Number.isSafeInteger(totalCents)) {
      throw new Error("Le cumul des investissements dépasse la limite autorisée.");
    }

    if (level === 0) {
      level = 1;
      currentStageStartCents = totalCents;
    }

    while (level < MAX_VIP_LEVEL) {
      const nextThresholdCents = thresholdToCents(settings[`vip${level + 1}MinInvestment`]);
      if (nextThresholdCents === null || totalCents < nextThresholdCents) break;
      level++;
      currentStageStartCents = totalCents;
    }
  }

  const nextLevel = level < MAX_VIP_LEVEL ? level + 1 : null;
  const nextThresholdCents = nextLevel === null
    ? null
    : thresholdToCents(settings[`vip${nextLevel}MinInvestment`]);
  const validNextThreshold = nextThresholdCents !== null && nextThresholdCents > currentStageStartCents
    ? nextThresholdCents
    : null;
  const progressPercent = validNextThreshold === null
    ? 0
    : Math.min(
        100,
        Math.max(
          0,
          ((totalCents - currentStageStartCents) /
            (validNextThreshold - currentStageStartCents)) * 100,
        ),
      );

  return {
    level,
    totalInvestmentXof: totalCents / 100,
    progressPercent,
    nextLevel,
    nextThresholdXof: validNextThreshold === null ? null : validNextThreshold / 100,
    amountRemainingXof: validNextThreshold === null
      ? null
      : Math.max(0, validNextThreshold - totalCents) / 100,
  };
}

export function parseVipLevel(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= MAX_VIP_LEVEL
    ? parsed
    : null;
}

export function isVipLevelUnlocked(currentLevel: number, requiredLevel: unknown): boolean {
  const required = parseVipLevel(requiredLevel);
  return required !== null && Number.isSafeInteger(currentLevel) && currentLevel >= required;
}

/**
 * VIP2+ investment thresholds must be positive, contiguous, and strictly
 * increasing. Empty values disable that rank and every rank above it.
 */
export function validateVipInvestmentThresholds(
  settings: Record<string, unknown>,
): string | null {
  let previousThreshold: number | null = null;
  let foundGap = false;

  for (let level = 2; level <= MAX_VIP_LEVEL; level++) {
    const raw = settings[`vip${level}MinInvestment`];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      foundGap = true;
      continue;
    }

    const threshold = typeof raw === "number" ? raw : Number(String(raw).trim());
    if (!Number.isSafeInteger(threshold) || threshold <= 0 || threshold > Number.MAX_SAFE_INTEGER / 100) {
      return `Le seuil de VIP ${level} doit être un montant entier positif en XOF.`;
    }
    if (foundGap) {
      return `Configurez les seuils VIP dans l’ordre, sans laisser de palier vide avant VIP ${level}.`;
    }
    if (previousThreshold !== null && threshold <= previousThreshold) {
      return `Le seuil de VIP ${level} doit être supérieur à celui du niveau précédent.`;
    }
    previousThreshold = threshold;
  }

  return null;
}
