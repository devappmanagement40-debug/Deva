type DirectReferral = { id: number; isBanned: boolean };

export function countEligibleDirectReferrals(
  referrals: readonly DirectReferral[],
  usersWithActivePaidProducts: readonly number[],
): number {
  const activePaidUserIds = new Set(usersWithActivePaidProducts);
  return new Set(
    referrals
      .filter((referral) => !referral.isBanned && activePaidUserIds.has(referral.id))
      .map((referral) => referral.id),
  ).size;
}

export function canClaimTask(
  currentInvites: number,
  requiredInvites: number,
  isCompleted: boolean,
): boolean {
  return !isCompleted
    && Number.isSafeInteger(currentInvites)
    && currentInvites >= 0
    && Number.isSafeInteger(requiredInvites)
    && requiredInvites > 0
    && currentInvites >= requiredInvites;
}

export function formatTaskRewardAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0 || amount > 9_999_999.99999999) {
    throw new Error("Montant de récompense invalide");
  }

  const micros = Math.round(amount * 100_000_000);
  if (!Number.isSafeInteger(micros) || Math.abs(amount * 100_000_000 - micros) >= 1e-5) {
    throw new Error("La récompense doit avoir au plus huit décimales");
  }

  const [whole, fraction = ""] = (micros / 100_000_000).toFixed(8).split(".");
  return `${whole}.${fraction.replace(/0+$/, "").padEnd(2, "0")}`;
}
