export interface SpinWheelSegment {
  id: number;
  label: string;
  amount: number;
  color: string;      // segment background color
  dark: string;       // darker shade for stroke / text
  canWin: boolean;
  imageUrl?: string;  // optional image drawn on the segment
  weight?: number;    // relative probability weight (default 1)
}

export const SPIN_WHEEL_SELF_REWARD_TOKEN = "{{selfPurchaseReward}}";
export const SPIN_WHEEL_REFERRAL_REWARD_TOKEN = "{{referralPurchaseReward}}";

export const DEFAULT_SPIN_WHEEL_INVITE_TEXT =
  `Partagez votre lien personnel avec vos amis. À chaque achat payant effectué par un ami inscrit grâce à ce lien, l’acheteur reçoit ${SPIN_WHEEL_SELF_REWARD_TOKEN} et vous recevez ${SPIN_WHEEL_REFERRAL_REWARD_TOKEN} en tant que parrain direct. Les tours sont crédités automatiquement après l’achat. Chaque tour permet un lancer unique de la roue. Utilisez « Copier mon lien » pour partager facilement votre invitation.`;

export const DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT = SPIN_WHEEL_REFERRAL_REWARD_TOKEN;

export const DEFAULT_SPIN_WHEEL_RULES_TEXT =
  `Chaque achat payant que vous effectuez vous accorde automatiquement ${SPIN_WHEEL_SELF_REWARD_TOKEN}. À chaque achat payant effectué par un filleul direct inscrit grâce à votre lien, vous recevez ${SPIN_WHEEL_REFERRAL_REWARD_TOKEN}. Chaque tour permet un lancer unique de la roue. Les lots pouvant être remportés et leurs probabilités sont définis par la configuration actuelle de la roue. Les gains remportés sont crédités en XOF sur votre solde.`;

function spinRewardPhrase(value: number | string, fallback: number): string {
  const count = Number(value);
  const normalizedCount = Number.isSafeInteger(count) && count >= 0 && count <= 10_000
    ? count
    : fallback;
  return `${normalizedCount} ${normalizedCount === 1 ? "tour" : "tours"}`;
}

export function interpolateSpinWheelRewards(
  text: string,
  selfPurchaseSpins: number | string,
  referralPurchaseSpins: number | string,
): string {
  return text
    .split(SPIN_WHEEL_SELF_REWARD_TOKEN)
    .join(spinRewardPhrase(selfPurchaseSpins, 3))
    .split(SPIN_WHEEL_REFERRAL_REWARD_TOKEN)
    .join(spinRewardPhrase(referralPurchaseSpins, 2));
}

export const DEFAULT_SPIN_WHEEL_SEGMENTS: SpinWheelSegment[] = [
  { id: 1, label: "10 XOF",     amount: 10,    color: "#F5C518", dark: "#5C3D00", canWin: true,  weight: 40 },
  { id: 2, label: "200 XOF",    amount: 200,   color: "#FFFDE7", dark: "#7C5200", canWin: true,  weight: 35 },
  { id: 3, label: "😊",         amount: 0,     color: "#F5C518", dark: "#5C3D00", canWin: false, weight: 1  },
  { id: 4, label: "500 XOF",    amount: 500,   color: "#FFFDE7", dark: "#7C5200", canWin: true,  weight: 3  },
  { id: 5, label: "5000 XOF",  amount: 5000,  color: "#F5C518", dark: "#5C3D00", canWin: false, weight: 1  },
  { id: 6, label: "10000 XOF", amount: 10000, color: "#FFFDE7", dark: "#7C5200", canWin: false, weight: 1  },
  { id: 7, label: "20000 XOF", amount: 20000, color: "#F5C518", dark: "#5C3D00", canWin: false, weight: 1  },
  { id: 8, label: "50000 XOF", amount: 50000, color: "#FFFDE7", dark: "#7C5200", canWin: false, weight: 1  },
];

export const SPIN_WHEEL_SETTING_KEY = "spinWheelConfig";

export function parseSpinWheelSegments(value: string | null | undefined): SpinWheelSegment[] {
  if (!value) return DEFAULT_SPIN_WHEEL_SEGMENTS;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_SPIN_WHEEL_SEGMENTS.length) {
      return DEFAULT_SPIN_WHEEL_SEGMENTS;
    }

    return parsed.map((segment, index) => ({
      ...DEFAULT_SPIN_WHEEL_SEGMENTS[index],
      ...segment,
      id: index + 1,
      label: typeof segment.label === "string" && segment.label.trim()
        ? segment.label.trim()
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].label,
      amount: Number.isFinite(Number(segment.amount)) && Number(segment.amount) >= 0
        ? Number(Number(segment.amount).toFixed(2))
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].amount,
      canWin: Boolean(segment.canWin),
      color: typeof segment.color === "string" && /^#[0-9a-f]{6}$/i.test(segment.color)
        ? segment.color
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].color,
      dark: typeof segment.dark === "string" && /^#[0-9a-f]{6}$/i.test(segment.dark)
        ? segment.dark
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].dark,
      imageUrl: typeof segment.imageUrl === "string" && segment.imageUrl.trim()
        ? segment.imageUrl.trim()
        : undefined,
      weight: Number.isFinite(Number(segment.weight)) && Number(segment.weight) > 0
        ? Number(segment.weight)
        : 1,
    }));
  } catch {
    return DEFAULT_SPIN_WHEEL_SEGMENTS;
  }
}

/** Weighted random pick among winnable segments */
export function pickWinningSegment(segments: SpinWheelSegment[]): SpinWheelSegment {
  const winnable = segments.filter((s) => s.canWin);
  if (winnable.length === 0) throw new Error("Aucune section gagnable configurée");

  const totalWeight = winnable.reduce((sum, s) => sum + (s.weight ?? 1), 0);
  const rand = Math.random() * totalWeight;
  let cumulative = 0;
  for (const seg of winnable) {
    cumulative += seg.weight ?? 1;
    if (rand < cumulative) return seg;
  }
  return winnable[winnable.length - 1];
}
