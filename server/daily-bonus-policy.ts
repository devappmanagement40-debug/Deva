export const DAILY_BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export function getDailyBonusHoursRemaining(lastClaimAt: Date | null, now: Date): number {
  if (!lastClaimAt) return 0;

  const lastClaimTime = lastClaimAt.getTime();
  const nowTime = now.getTime();
  if (!Number.isFinite(lastClaimTime) || !Number.isFinite(nowTime)) return 24;

  const millisecondsRemaining = lastClaimTime + DAILY_BONUS_COOLDOWN_MS - nowTime;
  return millisecondsRemaining > 0
    ? Math.ceil(millisecondsRemaining / MILLISECONDS_PER_HOUR)
    : 0;
}