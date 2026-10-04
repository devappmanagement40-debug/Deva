import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";

export default function AboutPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const companyPageTitle = "Détails de l’entreprise DIAMANT";
  const storedPageTitle = getContent(settings, "content_about_pageTitle", companyPageTitle);
  const pageTitle = ["A propos de nous", "À propos de DIAMANT"].includes(storedPageTitle)
    ? companyPageTitle
    : storedPageTitle;
  const storyTitle = getContent(settings, "content_about_storyTitle", "Fondée en Chine en 2000");
  const storyText = getContent(
    settings,
    "content_about_storyText",
    "Fondée en Chine en 2000, DIAMANT est née d’une ambition : mettre l’innovation au service de solutions concrètes. Aujourd’hui, la plateforme présente une offre orientée vers la mobilité électrique et les solutions énergétiques, avec des informations destinées à accompagner les membres dans leurs choix.",
  );
  const s1Title = getContent(settings, "content_about_s1Title", "Notre vision");
  const s1Text1 = getContent(settings, "content_about_s1Text1", "DIAMANT souhaite rapprocher technologie, énergie et mobilité à travers des solutions pensées pour répondre aux besoins d’aujourd’hui.");
  const s1Text2 = getContent(settings, "content_about_s1Text2", "La plateforme rassemble les produits, les services et les informations utiles dans un espace conçu pour aider chaque membre à comprendre le fonctionnement et les conditions affichées.");
  const s2Title = getContent(settings, "content_about_s2Title", "Énergie et mobilité au cœur de nos orientations");
  const s2Text = getContent(settings, "content_about_s2Text", "DIAMANT s’intéresse aux solutions de mobilité électrique et aux infrastructures énergétiques intelligentes. La plateforme présente notamment des vélos, scooters, cyclomoteurs et équipements de recharge. Les caractéristiques et conditions de chaque produit sont consultables sur sa fiche.");
  const s3Title = getContent(settings, "content_about_s3Title", "Une plateforme pensée pour les membres");
  const s3Text = getContent(settings, "content_about_s3Text", "L’espace membre permet de consulter les produits disponibles, gérer son solde en XOF, suivre ses opérations et retrouver les règles applicables. Les prix, durées et montants sont indiqués sur les fiches produits afin que chacun puisse les examiner avant de confirmer une opération.");
  const s4Title = getContent(settings, "content_about_s4Title", "Notre engagement : clarté et responsabilité");
  const s4Text = getContent(settings, "content_about_s4Text", "Nous voulons offrir une expérience fondée sur la clarté des informations, la protection des comptes et un accompagnement accessible selon les horaires publiés. Les conditions et règles propres à chaque opération restent consultables sur la plateforme, afin que chacun puisse décider en connaissance de cause.");

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
        <section className="space-y-3 rounded-2xl border border-[#dbe8df] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#087a38]">
            Notre histoire
          </p>
          <h2 className="ielp-about-heading text-xl font-bold text-[#087a38]">{storyTitle}</h2>
          <p className="leading-relaxed text-[#3f4d45]">{storyText}</p>
        </section>
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
