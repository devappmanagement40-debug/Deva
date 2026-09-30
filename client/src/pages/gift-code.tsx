import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import productBike from "@assets/generated_images/tgood-product-bike-card.jpg";
import electricScooter from "@assets/generated_images/tgood-scooter.jpg";
import electricMoped from "@assets/generated_images/tgood-moped.jpg";
import chargingStation from "@assets/generated_images/tgood-charging-station-hero.jpg";
import chargingPile from "@assets/image_search/tgood-real-charging-pile-transparent.png";

const GREEN = "#00b80b";
const LOGO_GREEN = "#aed33e";
const GIFT_BANNER_PRODUCTS = [
  { image: productBike, label: "TGOOD electric bike" },
  { image: electricScooter, label: "TGOOD electric scooter" },
  { image: electricMoped, label: "TGOOD electric moped" },
  { image: chargingStation, label: "TGOOD charging station" },
  { image: chargingPile, label: "TGOOD charging pile" },
];

export default function GiftCodePage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [code, setCode] = useState("");

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const groupLink = settings?.channelLink || settings?.groupLink || "";
  const headerTitle = getContent(settings, "content_giftcode_headerTitle", "Code cadeau");
  const infoLine1 = getContent(settings, "content_giftcode_infoLine1", "Entrez votre code cadeau pour recevoir votre récompense.");
  const infoLine2 = getContent(settings, "content_giftcode_infoLine2", "Les codes sont publiés sur les canaux officiels TGOOD.");
  const groupLabel = getContent(settings, "content_giftcode_howToTitle", "Comment obtenir des codes ?");
  const step1 = getContent(settings, "content_giftcode_step1", "Rejoignez un canal officiel TGOOD.");
  const step2 = getContent(settings, "content_giftcode_step2", "Suivez les annonces publiées par TGOOD.");
  const step3 = getContent(settings, "content_giftcode_step3", "Copiez le code et utilisez-le avant son expiration.");

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string) => {
      const res = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setCode("");
      toast({ title: "🎉 " + t.purchaseSuccess, description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: t.errorOccurred, description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!code.trim()) {
      toast({ title: t.errorOccurred, description: t.requiredFields, variant: "destructive" });
      return;
    }
    claimMutation.mutate(code.trim());
  };

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#202020]" data-testid="page-gift-code">
      <section className="min-h-[714px] bg-white">
        <header className="relative h-[143px]">
          <Link href="/account">
            <button
              type="button"
              aria-label="Retour"
              className="absolute left-[24px] top-[67px] flex h-10 w-10 items-center justify-center transition-opacity active:opacity-55"
              data-testid="button-back"
            >
              <ChevronLeft className="h-9 w-9 text-black" strokeWidth={1.8} />
            </button>
          </Link>
          <span
            className="absolute left-[26%] top-[74px] text-[25px] font-bold tracking-[-1.8px] max-[380px]:left-[23%]"
            style={{ color: LOGO_GREEN }}
            aria-label="any"
          >
             TGOOD
          </span>
          <h1
            className="ielp-gift-title absolute right-[10%] top-[80px] whitespace-nowrap text-[18px] font-normal leading-none max-[380px]:right-5 max-[380px]:text-[16px]"
            style={{ color: GREEN }}
          >
             {headerTitle}
          </h1>
        </header>

        <div className="mx-[21px] grid grid-cols-4 gap-[5px]" data-testid="gift-product-grid">
          {Array.from({ length: 12 }, (_, index) => {
            const product = GIFT_BANNER_PRODUCTS[index % GIFT_BANNER_PRODUCTS.length];
            return (
              <div key={index} className="aspect-[101/66] overflow-hidden rounded-[8px] bg-[#f0f5f2]">
                <img src={product.image} alt={product.label} className="h-full w-full object-cover" />
              </div>
            );
          })}
        </div>

        <p className="mx-[21px] mt-[21px] max-w-[419px] text-[18px] leading-[27px] text-[#656565]">
           {infoLine1}
           <br />
           {infoLine2}
        </p>

        <button
          type="button"
          onClick={() => groupLink && window.open(groupLink, "_blank", "noopener,noreferrer")}
          disabled={!groupLink}
          className="mx-[21px] mt-[20px] flex h-[75px] w-[calc(100%-42px)] items-center rounded-[4px] border border-[#e1e3e6] bg-[#f8f9fa] px-[12px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors active:bg-[#eef0f2] max-[380px]:h-[68px] max-[380px]:px-[10px]"
          data-testid="button-gift-telegram"
        >
          <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#179cda] max-[380px]:h-10 max-[380px]:w-10">
            <SiTelegram className="h-[27px] w-[27px] text-white max-[380px]:h-6 max-[380px]:w-6" />
          </span>
          <span className="ml-[19px] flex-1 whitespace-nowrap text-[24px] font-normal leading-none text-[#292929] max-[380px]:ml-[10px] max-[380px]:text-[15px]">
            {groupLink ? "Canal officiel TGOOD" : "Canal officiel non configuré"}
          </span>
          <ChevronRight className="h-7 w-7 shrink-0 text-[#8e979f] max-[380px]:h-5 max-[380px]:w-5" strokeWidth={1.8} />
        </button>

        <div className="mx-[42px] mt-[27px]">
          <label htmlFor="gift-code" className="block text-[19px] font-semibold leading-6 text-[#333]">
            <span className="text-[#ed4d55]">*</span> Code cadeau
          </label>
          <input
            id="gift-code"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Veuillez saisir le code cadeau"
            className="mt-[7px] h-[62px] w-full border-0 border-b border-[#e9e9e9] bg-transparent px-0 text-[19px] text-[#333] outline-none placeholder:text-[#676767] focus:border-[#cfcfcf]"
            data-testid="input-gift-code"
          />
        </div>
        <div className="mx-[42px] mt-[24px] space-y-2 text-[14px] leading-[21px] text-[#656565]">
          <p className="font-semibold text-[#333]">{groupLabel}</p>
          <p>1. {step1}</p>
          <p>2. {step2}</p>
          <p>3. {step3}</p>
        </div>
       </section>

      <footer className="min-h-[310px] bg-[#f3f3f3] pt-[21px]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={claimMutation.isPending}
          className="mx-auto flex h-[61px] w-[calc(100%-154px)] min-w-[260px] max-w-[307px] items-center justify-center rounded-full border-0 text-[31px] font-bold text-white shadow-none transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ background: GREEN }}
          data-testid="button-submit-code"
        >
          {claimMutation.isPending ? <Loader2 className="h-7 w-7 animate-spin" /> : "Confirmer"}
        </button>
      </footer>
    </main>
  );
}