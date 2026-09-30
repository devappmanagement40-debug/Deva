import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";

export default function AboutPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const pageTitle = getContent(settings, "content_about_pageTitle", "À propos de DIAMANT");
  const s1Title   = getContent(settings, "content_about_s1Title", "Qui sommes-nous ?");
  const s1Text1   = getContent(settings, "content_about_s1Text1", "DIAMANT développe des solutions de mobilité électrique et d'infrastructure énergétique intelligente.");
  const s1Text2   = getContent(settings, "content_about_s1Text2", "La plateforme DIAMANT rassemble des produits et services accessibles, avec des informations claires pour chaque membre.");
  const s2Title   = getContent(settings, "content_about_s2Title", "Produits et solutions");
  const s2Text    = getContent(settings, "content_about_s2Text", "DIAMANT propose des solutions de mobilité électrique, notamment des vélos, scooters, cyclomoteurs et équipements de recharge.");
  const s3Title   = getContent(settings, "content_about_s3Title", "Fonctionnement de la plateforme");
  const s3Text    = getContent(settings, "content_about_s3Text", "Les membres peuvent consulter les produits disponibles, gérer leur solde USDT, suivre leurs revenus et demander un retrait selon les règles affichées.");
  const s4Title   = getContent(settings, "content_about_s4Title", "Notre engagement");
  const s4Text    = getContent(settings, "content_about_s4Text", "DIAMANT privilégie des informations à jour, la sécurité du compte, la transparence des conditions et la qualité du support.");

  return (
    <div className="flex min-h-screen flex-col text-[#26352d]" style={{ background: "#f8f9fa", color: "#26352d" }}>
      <header className="ielp-about-header flex items-center border-b border-[#dbe8df] bg-[#087a38] px-4 py-3 text-white">
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 pr-6 text-center text-lg font-semibold text-white">{pageTitle}</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-6 pb-20">
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-about-heading text-xl font-bold text-[#087a38]">{s1Title}</h2>
          <p className="leading-relaxed text-[#3f4d45]">{s1Text1}</p>
          <p className="leading-relaxed text-[#3f4d45]">{s1Text2}</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-about-heading text-xl font-bold text-[#087a38]">{s2Title}</h2>
          <p className="leading-relaxed text-[#3f4d45]">{s2Text}</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-about-heading text-xl font-bold text-[#087a38]">{s3Title}</h2>
          <p className="leading-relaxed text-[#3f4d45]">{s3Text}</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-about-heading text-xl font-bold text-[#087a38]">{s4Title}</h2>
          <p className="leading-relaxed text-[#3f4d45]">{s4Text}</p>
        </div>
      </div>
    </div>
  );
}
