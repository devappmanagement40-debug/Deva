import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import WheelRulesModal from "@/components/wheel-rules-modal";
import WheelInviteModal from "@/components/wheel-invite-modal";
import WheelHistoryModal from "@/components/wheel-history-modal";
import WheelRankingModal from "@/components/wheel-ranking-modal";
import WheelResultModal from "@/components/wheel-result-modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { BarChart3, ChevronLeft, FileText, Share2 } from "lucide-react";
import { displayCurrencyText } from "@/lib/content";
import wheelBackground from "@assets/generated_images/spin-wheel-palace-bg-optimized.jpg";
import {
  DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT,
  DEFAULT_SPIN_WHEEL_INVITE_TEXT,
  DEFAULT_SPIN_WHEEL_RULES_TEXT,
  DEFAULT_SPIN_WHEEL_SEGMENTS,
  interpolateSpinWheelRewards,
  type SpinWheelSegment,
} from "@shared/spin-wheel";

interface RecentSpin {
  id: number;
  phone: string;
  amount: string;
  description: string;
}

interface SpinResult {
  segmentId: number;
  amount: number;
  label: string;
  spinTokens: number;
  segments: SpinWheelSegment[];
}

function createSpinRequestId(): string {
  if (typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();

  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function pendingSpinStorageKey(userId: number): string {
  return `spin-wheel-pending-request:${userId}`;
}

function loadPendingSpinRequestId(userId: number): string | null {
  try {
    const key = pendingSpinStorageKey(userId);
    const requestId = window.localStorage.getItem(key);
    if (requestId && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(requestId)) {
      return requestId;
    }
    if (requestId) window.localStorage.removeItem(key);
  } catch {
    // The in-memory ref still protects retries when browser storage is unavailable.
  }
  return null;
}

function savePendingSpinRequestId(userId: number, requestId: string): void {
  try {
    window.localStorage.setItem(pendingSpinStorageKey(userId), requestId);
  } catch {
    // Keep the request id in memory if browser storage is unavailable.
  }
}

function clearPendingSpinRequestId(userId: number): void {
  try {
    window.localStorage.removeItem(pendingSpinStorageKey(userId));
  } catch {
    // A stale id can only replay the same request; it cannot credit the prize twice.
  }
}

/* ── Segments ──────────────────────────────────────────────── */
const N   = DEFAULT_SPIN_WHEEL_SEGMENTS.length;
const ARC = (2 * Math.PI) / N;
const SEGMENT_FILLS = ["#fff5d9", "#fff1ca", "#fff8e3", "#ffedc0"];

/* ── Gold coin medallion used in each prize segment ────────── */
function drawCoinStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  ctx.save();
  ctx.shadowColor = "rgba(156, 88, 9, .45)";
  ctx.shadowBlur = r * 0.45;
  ctx.shadowOffsetY = r * 0.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const face = ctx.createRadialGradient(x - r * 0.32, y - r * 0.42, 0, x, y, r);
  face.addColorStop(0, "#fff5a8");
  face.addColorStop(0.45, "#ffc83e");
  face.addColorStop(0.82, "#ed9917");
  face.addColorStop(1, "#c66c08");
  ctx.fillStyle = face;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "#fff1a3";
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.57, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 248, 188, .92)";
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.stroke();
  ctx.fillStyle = "#bd650d";
  ctx.font = `bold ${Math.max(8, r * 0.88)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₣", x, y + r * 0.03);
  ctx.restore();
}

/* ── Draw wheel ─────────────────────────────────────────────── */
function drawWheel(
  canvas: HTMLCanvasElement,
  rotation: number,
  segments: SpinWheelSegment[],
  images: Record<number, HTMLImageElement | null> = {},
) {
  const ctx = canvas.getContext("2d")!;
  const W   = canvas.width;
  const cx  = W / 2;
  const cy  = W / 2;

  const outerR  = cx - 5;          // outer glossy ring edge
  const segR    = outerR - 26;     // cream prize face
  const sepR    = segR * 0.28;     // warm inner separator ring radius
  const centerR = sepR * 0.68;     // GO button radius

  ctx.clearRect(0, 0, W, W);

  /* ── Drop shadow ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy + 10, outerR - 2, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.fill();
  ctx.restore();

  /* ── Glossy red outer ring ── */
  const ringGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
  ringGrad.addColorStop(0,    "#ff7861");
  ringGrad.addColorStop(0.28, "#f33122");
  ringGrad.addColorStop(0.58, "#ff4b2e");
  ringGrad.addColorStop(0.82, "#d91c16");
  ringGrad.addColorStop(1,    "#ff9b64");
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.strokeStyle = "#fff4db";
  ctx.lineWidth = 4;
  ctx.stroke();

  /* ── Draw the cream prize wheel ── */
  for (let i = 0; i < N; i++) {
    const seg   = segments[i];
    const start = rotation + i * ARC - Math.PI / 2;
    const end   = start + ARC;
    const midA  = start + ARC / 2;

    const fillColor = SEGMENT_FILLS[i % SEGMENT_FILLS.length];
    const textColor = "#a9261d";

    /* Segment fill */
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segR, start, end);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(210, 151, 76, .33)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* ── Gold prize medallion in the inner icon zone ── */
    const coinDist = segR * 0.47;
    const coinR    = segR * 0.105;
    const coinCx   = cx + Math.cos(midA) * coinDist;
    const coinCy   = cy + Math.sin(midA) * coinDist;

    const img = (images as Record<number, HTMLImageElement | null>)[seg.id];
    if (img && img.complete && img.naturalWidth > 0) {
      const imgSize = segR * 0.20;
      ctx.save();
      ctx.beginPath();
      ctx.arc(coinCx, coinCy, imgSize * 0.85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, coinCx - imgSize, coinCy - imgSize, imgSize * 2, imgSize * 2);
      ctx.restore();
    } else {
      drawCoinStack(ctx, coinCx, coinCy, coinR);
    }

    /* ── Prize amount on the outer cream ring ── */
    const textDist = segR * 0.80;
    ctx.save();
    ctx.translate(
      cx + Math.cos(midA) * textDist,
      cy + Math.sin(midA) * textDist,
    );
    let tRot = midA + Math.PI / 2;
    if (tRot > Math.PI / 2 && tRot < Math.PI * 1.5) tRot += Math.PI;
    ctx.rotate(tRot);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = textColor;
    ctx.shadowColor  = "rgba(255,255,255,0.7)";
    ctx.shadowBlur   = 2;

    let displayText: string;
    if (seg.label === "😊" || (!seg.canWin && seg.amount === 0)) {
      displayText = "😊";
    } else if (seg.amount > 0) {
      displayText = seg.amount.toLocaleString("fr-FR");
    } else {
      displayText = displayCurrencyText(seg.label);
    }

    const fontSize = Math.max(10, Math.min(15, segR * 0.118));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(displayText, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ── Fine cream-and-gold rings around the center ── */
  ctx.beginPath();
  ctx.arc(cx, cy, segR * 0.62, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(220, 168, 90, .30)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, segR * 0.36, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(220, 168, 90, .25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const sepGrad = ctx.createRadialGradient(cx, cy, centerR, cx, cy, sepR);
  sepGrad.addColorStop(0, "#fff8df");
  sepGrad.addColorStop(0.72, "#fff2cf");
  sepGrad.addColorStop(1, "#ffe4a9");
  ctx.beginPath();
  ctx.arc(cx, cy, sepR, 0, 2 * Math.PI);
  ctx.fillStyle = sepGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.95)";
  ctx.lineWidth = 3;
  ctx.stroke();

  /* ── Warm marquee lights around the red ring ── */
  for (let light = 0; light < 20; light++) {
    const angle = (light / 20) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(angle) * (outerR - 13);
    const ly = cy + Math.sin(angle) * (outerR - 13);
    const radius = light % 3 === 0 ? 4.4 : 3.6;
    ctx.beginPath();
    ctx.arc(lx, ly, radius, 0, Math.PI * 2);
    ctx.fillStyle = light % 3 === 0 ? "#ffe943" : "#fffdf1";
    ctx.shadowColor = light % 3 === 0 ? "rgba(255,225,57,.9)" : "rgba(255,255,255,.85)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* ── Gold halo and center GO button ── */
  ctx.beginPath();
  ctx.arc(cx, cy, centerR * 1.16, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff8df";
  ctx.fill();
  ctx.strokeStyle = "#eab43a";
  ctx.lineWidth = 2;
  ctx.stroke();
  const btnG = ctx.createRadialGradient(
    cx - centerR * 0.3, cy - centerR * 0.3, 0,
    cx, cy, centerR,
  );
  btnG.addColorStop(0,   "#ff8b80");
  btnG.addColorStop(0.43, "#f02e43");
  btnG.addColorStop(1,   "#b71128");
  ctx.beginPath();
  ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
  ctx.fillStyle = btnG;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  /* GO text */
  ctx.fillStyle    = "#FFF";
  ctx.font         = `bold ${Math.round(centerR * 0.62)}px sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.6)";
  ctx.shadowBlur   = 5;
  ctx.fillText("GO", cx, cy);
  ctx.shadowBlur = 0;
}

/* ── Page ───────────────────────────────────────────────────── */
export default function SpinWheelPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rotRef     = useRef(0);
  const animRef    = useRef<number | null>(null);
  const rafRef     = useRef<number | null>(null);
  const spinning   = useRef(false);
  const spinRequestIdRef = useRef<{ userId: number; requestId: string } | null>(null);

  const [rotation,    setRotation]   = useState(0);
  const [spinning2,   setSpinning2]  = useState(false);
  const [spinTokens,  setSpinTokens] = useState(() => user?.spinTokens ?? 0);
  const [showRules,  setShowRules] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInvite,  setShowInvite] = useState(false);
  const [spinResult,  setSpinResult]  = useState<{ won: boolean; amount: number; label: string } | null>(null);

  /* Platform settings — for popup texts */
  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const selfPurchaseSpins = platformSettings?.spinWheelSelfPurchaseSpins ?? "3";
  const referralPurchaseSpins = platformSettings?.spinWheelReferralPurchaseSpins ?? "2";
  const inviteText = displayCurrencyText(interpolateSpinWheelRewards(
    platformSettings?.spinWheelInviteText ?? DEFAULT_SPIN_WHEEL_INVITE_TEXT,
    selfPurchaseSpins,
    referralPurchaseSpins,
  ));
  const inviteHighlight = displayCurrencyText(interpolateSpinWheelRewards(
    platformSettings?.spinWheelInviteHighlight ?? DEFAULT_SPIN_WHEEL_INVITE_HIGHLIGHT,
    selfPurchaseSpins,
    referralPurchaseSpins,
  ));
  const rulesText = displayCurrencyText(interpolateSpinWheelRewards(
    platformSettings?.spinWheelRulesText ?? DEFAULT_SPIN_WHEEL_RULES_TEXT,
    selfPurchaseSpins,
    referralPurchaseSpins,
  ));
  const rulesHighlight = displayCurrencyText(interpolateSpinWheelRewards(
    platformSettings?.spinWheelRulesHighlight ?? "",
    selfPurchaseSpins,
    referralPurchaseSpins,
  ));
  const { data: recentSpins = [], isLoading: recentSpinsLoading } = useQuery<RecentSpin[]>({
    queryKey: ["/api/spin-wheel/recent"],
    refetchInterval: 15000,
  });
  const [segments, setSegments] = useState<SpinWheelSegment[]>(DEFAULT_SPIN_WHEEL_SEGMENTS);
  const rotDrawRef   = useRef(rotation);
  const segDrawRef   = useRef(segments);
  const imagesRef    = useRef<Record<number, HTMLImageElement | null>>({});

  /* Sync spinTokens when user refreshes */
  useEffect(() => { setSpinTokens(user?.spinTokens ?? 0); }, [user?.spinTokens]);

  /* Load admin-configured segments */
  const { data: configuredSegments } = useQuery<SpinWheelSegment[]>({
    queryKey: ["/api/spin-wheel/config"],
  });
  useEffect(() => {
    if (configuredSegments?.length === N) setSegments(configuredSegments);
  }, [configuredSegments]);

  /* Pre-load segment images whenever segments change */
  useEffect(() => {
    const cache: Record<number, HTMLImageElement | null> = {};
    segments.forEach((seg) => {
      if (seg.imageUrl) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = seg.imageUrl;
        cache[seg.id] = img;
      } else {
        cache[seg.id] = null;
      }
    });
    imagesRef.current = cache;
  }, [segments]);

  /* Keep draw refs in sync */
  useEffect(() => {
    rotDrawRef.current = rotation;
    segDrawRef.current = segments;
  }, [rotation, segments]);

  /* Animate wheel on canvas every frame */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const loop = () => {
      drawWheel(canvas, rotDrawRef.current, segDrawRef.current, imagesRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  /* Spin mutation */
  const spinMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const response = await apiRequest("POST", "/api/spin-wheel/spin", { requestId });
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object") {
        throw new Error("Réponse de tirage invalide. Réessayez sans fermer la page.");
      }

      const result = payload as Partial<SpinResult>;
      const winningSegment = Array.isArray(result.segments)
        ? result.segments.find((segment) => segment.id === result.segmentId)
        : undefined;
      if (
        !Number.isInteger(result.segmentId) ||
        !Number.isFinite(result.amount) ||
        (result.amount as number) < 0 ||
        typeof result.label !== "string" ||
        !Number.isInteger(result.spinTokens) ||
        (result.spinTokens as number) < 0 ||
        !Array.isArray(result.segments) ||
        result.segments.length !== N ||
        !winningSegment ||
        !winningSegment.canWin ||
        !Number.isFinite(winningSegment.amount) ||
        winningSegment.amount < 0 ||
        winningSegment.amount !== result.amount ||
        winningSegment.label !== result.label
      ) {
        throw new Error("Réponse de tirage invalide. Réessayez sans fermer la page.");
      }
      return result as SpinResult;
    },
  });

  const handleSpin = useCallback(() => {
    if (spinning.current || spinMutation.isPending) return;

    if (!user?.id) {
      toast({ title: "Votre session a expiré. Reconnectez-vous.", variant: "destructive" });
      return;
    }
    const pendingRequestId = spinRequestIdRef.current?.userId === user.id
      ? spinRequestIdRef.current.requestId
      : loadPendingSpinRequestId(user.id);

    /* No tours available → toast only */
    if (spinTokens <= 0 && !pendingRequestId) {
      toast({
        title: "Vous n'avez pas de tour disponible",
        variant: "destructive",
      });
      return;
    }

    let requestId: string;
    try {
      requestId = pendingRequestId ?? createSpinRequestId();
    } catch {
      toast({
        title: "Impossible de préparer le tirage",
        description: "Votre navigateur ne permet pas de sécuriser cette demande.",
        variant: "destructive",
      });
      return;
    }

    spinning.current = true;
    setSpinning2(true);
    spinRequestIdRef.current = { userId: user.id, requestId };
    savePendingSpinRequestId(user.id, requestId);

    spinMutation.mutate({ requestId }, {
      onSuccess: (result) => {
        if (spinRequestIdRef.current?.requestId === requestId) {
          spinRequestIdRef.current = null;
        }
        clearPendingSpinRequestId(user.id);
        setSegments(result.segments);
        segDrawRef.current = result.segments;
        queryClient.setQueryData(["/api/spin-wheel/config"], result.segments);
        void queryClient.invalidateQueries({ queryKey: ["/api/spin-wheel/recent"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/spin-wheel/history"] });
        refreshUser();

        const winIdx   = Math.max(0, result.segments.findIndex((s) => s.id === result.segmentId));
        const extra    = Math.PI * 2 * (6 + Math.random() * 4);
        // Align center of winIdx segment with the 12-o'clock pointer.
        // Segment i's midpoint = rotation + (i+0.5)*ARC - π/2.
        // For midpoint = -π/2 (top): rotation = -(i+0.5)*ARC  (mod 2π)
        const base     = rotRef.current + extra;
        const needed   = ((-(winIdx + 0.5) * ARC) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const current  = ((base % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const adj      = (needed - current + 2 * Math.PI) % (2 * Math.PI);
        const targetRot = base + adj;
        const duration  = 3500;
        const startTime = performance.now();
        const startRot  = rotRef.current;

        function ease(p: number) {
          return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        }
        function tick(now: number) {
          const p = Math.min((now - startTime) / duration, 1);
          const c = startRot + (targetRot - startRot) * ease(p);
          rotRef.current = c;
          setRotation(c);
          if (p < 1) {
            animRef.current = requestAnimationFrame(tick);
          } else {
            spinning.current = false;
            setSpinning2(false);
            setSpinTokens(result.spinTokens);
            refreshUser();
            /* Show result popup (win / loss) */
            const won = result.amount > 0;
            setSpinResult({ won, amount: result.amount, label: result.label });
          }
        }
        animRef.current = requestAnimationFrame(tick);
      },
      onError: (error: Error) => {
        spinning.current = false;
        setSpinning2(false);
        refreshUser();
        toast({ title: error.message || t.wheelErrUnavailable, variant: "destructive" });
      },
    });
  }, [spinTokens, spinMutation, toast, t, refreshUser, user?.id]);

  /* Cleanup */
  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (rafRef.current)  cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      <main
        className="spin-wheel-page relative min-h-[100dvh] overflow-x-clip pb-10"
        style={{
          paddingTop: "calc(45px + env(safe-area-inset-top))",
          backgroundColor: "#ff745d",
          backgroundImage: `linear-gradient(180deg, rgba(255, 59, 43, .72) 0%, rgba(255, 112, 83, .34) 34%, rgba(255, 211, 173, .16) 52%, rgba(255, 83, 67, .50) 100%), url("${wheelBackground}")`,
          backgroundSize: "100% max(760px, 82dvh)",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          color: "#481d18",
        }}
      >
        <div className="relative z-10 mx-auto w-full max-w-[480px]">
          <div className="relative flex h-9 items-center justify-center px-12">
            <Link
              href="/account"
              aria-label={t.back}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ color: "#fff", textShadow: "0 1px 3px rgba(100,34,23,.5)" }}
              data-testid="button-back"
            >
              <ChevronLeft className="h-7 w-7" />
            </Link>
            <span
              className="text-lg font-semibold"
              style={{ color: "#fff", textShadow: "0 2px 5px rgba(97,37,19,.4)" }}
            >
              tirage chanceux
            </span>
          </div>

          <p
            className="mt-6 px-4 text-center text-[17px] font-medium"
            style={{ color: "#fff", textShadow: "0 1px 4px rgba(100,39,20,.42)" }}
          >
            Inviter un ami à s'inscrire
          </p>

          <h1
            className="mt-7 text-center font-extrabold leading-none"
            style={{
              color: "#fff",
              fontSize: "clamp(38px, 10vw, 46px)",
              letterSpacing: "-.5px",
              textShadow: "0 3px 0 rgba(142, 59, 29, .5), 0 6px 10px rgba(89, 34, 17, .35)",
            }}
          >
            Sortie chanceuse
          </h1>

          <div
            className="mx-auto mt-6 flex min-h-11 w-[calc(100%-40px)] max-w-[412px] items-center justify-center rounded-full px-4 text-center"
            style={{
              border: "1px solid rgba(255,255,255,.85)",
              background: "linear-gradient(180deg, #fff8e4 0%, #ffeab5 100%)",
              boxShadow: "0 4px 13px rgba(143, 63, 34, .16), inset 0 1px 0 #fff",
              color: "#b8241a",
              fontSize: 17,
              fontWeight: 600,
            }}
            data-testid="wheel-spins-remaining"
          >
            Nombre de tirages restant: {spinTokens}
          </div>

          <div
            className="mx-auto flex justify-center"
            style={{ marginTop: "clamp(26px, 2.6vh, 28px)" }}
          >
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              role="button"
              tabIndex={spinning2 ? -1 : 0}
              aria-label="Lancer la roue"
              data-testid="spin-wheel-canvas"
              style={{
                display: "block",
                width: "min(76vw, 360px)",
                height: "min(76vw, 360px)",
                borderRadius: "50%",
                cursor: spinning2 ? "not-allowed" : "pointer",
                filter: "drop-shadow(0 8px 12px rgba(129, 48, 23, .34))",
                touchAction: "manipulation",
              }}
              onClick={(event) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (event.clientX - rect.left) * scaleX;
                const y = (event.clientY - rect.top) * scaleY;
                const center = canvas.width / 2;
                const segmentRadius = center - 5 - 26;
                const centerRadius = segmentRadius * 0.28 * 0.68;
                if (Math.hypot(x - center, y - center) <= centerRadius) handleSpin();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSpin();
                }
              }}
            />
          </div>

          <div
            className="mx-auto grid w-[calc(100%-36px)] max-w-[430px] items-start"
            style={{
              marginTop: "clamp(92px, 12.1vh, 128px)",
              gridTemplateColumns: "60px minmax(0, 244px) 60px",
              columnGap: 30,
            }}
          >
            <button
              type="button"
              onClick={() => setShowRanking(true)}
              className="flex min-w-0 flex-col items-center active:scale-95 transition-transform"
              data-testid="button-wheel-ranking"
              aria-label="Classement"
            >
              <span
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
                style={{
                  border: "2px solid rgba(255,255,255,.92)",
                  background: "linear-gradient(145deg, #fffdf5, #ffecc4)",
                  boxShadow: "0 4px 10px rgba(121,47,28,.2)",
                  color: "#d42c35",
                }}
              >
                <BarChart3 className="h-6 w-6" strokeWidth={3} />
              </span>
              <span className="mt-1.5 text-center text-[14px] font-bold leading-tight">Classement</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex h-[68px] min-w-0 items-center justify-center gap-2 rounded-full px-2 font-extrabold active:scale-[.98] transition-transform"
              style={{
                alignSelf: "start",
                marginTop: 3,
                border: "7px solid #ff9690",
                background: "linear-gradient(180deg, #fff7df 0%, #ffdc98 100%)",
                boxShadow: "0 5px 13px rgba(153, 52, 34, .24), inset 0 2px 0 rgba(255,255,255,.9)",
                color: "#512218",
                fontSize: "clamp(14px, 4.2vw, 19px)",
                whiteSpace: "nowrap",
              }}
              data-testid="button-wheel-invite"
            >
              <Share2 className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span>Inviter des amis</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="flex min-w-0 flex-col items-center active:scale-95 transition-transform"
              data-testid="button-wheel-history"
              aria-label="Enregistrement"
            >
              <span
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
                style={{
                  border: "2px solid rgba(255,255,255,.92)",
                  background: "linear-gradient(145deg, #fffdf5, #ffecc4)",
                  boxShadow: "0 4px 10px rgba(121,47,28,.2)",
                  color: "#d42c35",
                }}
              >
                <FileText className="h-6 w-6" strokeWidth={2.8} />
              </span>
              <span className="mt-1.5 text-center text-[14px] font-bold leading-tight">Enregistrement</span>
            </button>
          </div>

          <section
            className="mx-auto mt-10 w-[calc(100%-44px)] max-w-[430px] pb-8"
            style={{
              color: "#54251c",
              fontSize: 15,
              lineHeight: 1.48,
              letterSpacing: ".1px",
            }}
          >
            <p className="mb-4 font-medium">Notre programme de parrainage est désormais disponible !</p>
            <p className="mb-5">
              Pour chaque utilisateur qui s'inscrit via votre lien, vous recevrez un tour de roulette gratuit
              avec 100 % de chance de gagner. Vous pourrez retirer jusqu'à 5 000 francs{" "}
              <span style={{ color: "#3389e8", fontWeight: 700 }}>CFA</span> immédiatement.
            </p>
            <p>
              De plus, vous recevrez 20 % de leur investissement en commission. Par exemple, s'ils investissent
              100 000 francs{" "}
              <span style={{ color: "#3389e8", fontWeight: 700 }}>CFA</span>, vous recevrez 20 000 francs{" "}
              <span style={{ color: "#3389e8", fontWeight: 700 }}>CFA</span> de commission. Les commissions
              sont retirables instantanément.
            </p>
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="mt-4 text-sm font-semibold underline underline-offset-2"
              style={{ color: "#713823" }}
              data-testid="button-wheel-rules"
            >
              Règles du jeu
            </button>
          </section>
        </div>
      </main>

      <WheelRulesModal
        open={showRules}
        onClose={() => setShowRules(false)}
        text={rulesText}
        highlight={rulesHighlight}
      />
      <WheelRankingModal
        open={showRanking}
        onClose={() => setShowRanking(false)}
        entries={recentSpins}
        isLoading={recentSpinsLoading}
      />
      <WheelHistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
      <WheelInviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        text={inviteText}
        highlight={inviteHighlight}
        referralCode={user?.referralCode ?? ""}
      />
      <WheelResultModal
        open={spinResult !== null}
        onClose={() => setSpinResult(null)}
        won={spinResult?.won ?? false}
        amount={spinResult?.amount}
        label={spinResult?.label}
      />
    </>
  );
}
