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
  const storyTitle = getContent(settings, "content_about_storyTitle", "Une entreprise minière fondée en Chine en 2000");
  const storyText = getContent(
    settings,
    "content_about_storyText",
    "Fondée en Chine en 2000, DIAMANT est une entreprise du secteur minier. Elle s’intéresse aux ressources minérales et aux enjeux qui les entourent, notamment pour l’or, le diamant et le cuivre. Son ambition est de présenter ce domaine avec clarté et de promouvoir une approche réfléchie et responsable.",
  );
  const s1Title = getContent(settings, "content_about_s1Title", "Notre vision du secteur minier");
  const s1Text1 = getContent(settings, "content_about_s1Text1", "Les ressources minérales jouent un rôle important dans de nombreuses industries. Pour DIAMANT, faire connaître le secteur minier, c’est aussi expliquer les ressources, les filières et les enjeux propres à chaque projet.");
  const s1Text2 = getContent(settings, "content_about_s1Text2", "Notre ambition est de construire une présentation accessible et sérieuse, qui donne aux membres des repères pour mieux comprendre les activités minières sans simplifier leur complexité.");
  const s2Title = getContent(settings, "content_about_s2Title", "Or, diamant et cuivre");
  const s2Text = getContent(settings, "content_about_s2Text", "DIAMANT met l’accent sur l’or, le diamant et le cuivre. Chacune de ces ressources possède ses caractéristiques, ses usages et ses enjeux. Leur étude demande de tenir compte des réalités techniques, économiques, environnementales et réglementaires propres à chaque projet.");
  const s3Title = getContent(settings, "content_about_s3Title", "Comprendre les projets miniers");
  const s3Text = getContent(settings, "content_about_s3Text", "Un projet minier repose sur des études, des choix techniques adaptés, des autorisations et une analyse des impacts. Les informations présentées par DIAMANT ont vocation à aider les membres à comprendre les différentes dimensions du secteur et à examiner chaque projet selon ses caractéristiques.");
  const s4Title = getContent(settings, "content_about_s4Title", "Clarté et responsabilité");
  const s4Text = getContent(settings, "content_about_s4Text", "Le secteur minier exige une information précise et une réflexion à long terme. DIAMANT souhaite présenter ses orientations et ses contenus avec clarté, en rappelant que les conditions et perspectives varient selon les projets. Chaque information doit être examinée dans son contexte avant toute décision.");

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
