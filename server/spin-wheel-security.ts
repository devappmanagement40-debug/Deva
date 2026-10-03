import { randomInt } from "node:crypto";
import type { SpinWheelSegment } from "@shared/spin-wheel";

const RANDOM_RANGE = 2 ** 32;

export function pickWinningSpinWheelSegment(segments: SpinWheelSegment[]): SpinWheelSegment {
  const winnable = segments.filter((segment) => segment.canWin);
  if (winnable.length === 0) {
    throw new Error("Aucune section gagnable configurée.");
  }

  const weights = winnable.map((segment) => segment.weight ?? 1);
  if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
    throw new Error("Les probabilités de la roue sont invalides.");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error("Les probabilités de la roue sont invalides.");
  }

  const target = (randomInt(0, RANDOM_RANGE) / RANDOM_RANGE) * totalWeight;
  let cumulativeWeight = 0;
  for (let index = 0; index < winnable.length; index += 1) {
    cumulativeWeight += weights[index];
    if (target < cumulativeWeight) return winnable[index];
  }

  return winnable[winnable.length - 1];
}