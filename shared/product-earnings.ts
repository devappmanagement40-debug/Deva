import { normalizeProductType } from "./product-categories";

export type ProductEarningsSettlementInput = {
  productType: unknown;
  dailyEarnings: number;
  cyclesToAccrue: number;
  previousTotal: number;
  previousPending: number;
  cycleCompleted: boolean;
  collectAtEnd: boolean;
};

export type ProductEarningsSettlement = {
  accrued: number;
  totalEarned: number;
  pendingEarnings: number;
  payout: number;
  isExplore: boolean;
};

const roundCurrency = (value: number) => Number(value.toFixed(2));

export function calculateProductEarningsSettlement({
  productType,
  dailyEarnings,
  cyclesToAccrue,
  previousTotal,
  previousPending,
  cycleCompleted,
  collectAtEnd,
}: ProductEarningsSettlementInput): ProductEarningsSettlement {
  const isExplore = normalizeProductType(productType) === "stability";
  const accrued = roundCurrency(dailyEarnings * cyclesToAccrue);
  const totalEarned = roundCurrency(previousTotal + accrued);

  if (isExplore) {
    // Active Explore purchases switch from the old end-of-cycle rule. Until the
    // switch, collectAtEnd purchases kept accrued gains in totalEarned, while
    // other purchases kept them in pendingEarnings.
    const previouslyUnpaid = collectAtEnd
      ? Math.max(previousTotal, previousPending)
      : previousPending;

    return {
      accrued,
      totalEarned,
      pendingEarnings: 0,
      payout: roundCurrency(previouslyUnpaid + accrued),
      isExplore,
    };
  }

  const pendingEarnings = collectAtEnd
    ? previousPending
    : roundCurrency(previousPending + accrued);

  return {
    accrued,
    totalEarned,
    pendingEarnings,
    payout: cycleCompleted
      ? collectAtEnd
        ? totalEarned
        : pendingEarnings
      : 0,
    isExplore,
  };
}
