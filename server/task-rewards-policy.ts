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
  if (!Number.isFinite(amount) || amount < 0 || amount > 9_999_999_999_999.99) {
    throw new Error("Montant de récompense invalide");
  }

  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(amount * 100 - cents) >= 1e-7) {
    throw new Error("La récompense doit avoir au plus deux décimales");
  }

  return (cents / 100).toFixed(2);
}
