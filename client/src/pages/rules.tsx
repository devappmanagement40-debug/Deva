import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";

export default function RulesPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const signupBonus = settings?.signupBonusAmount || "2";
  const minDeposit = settings?.minDeposit || "18";
  const minWithdrawal = settings?.minWithdrawal || "1";
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission || "10";
  const lv2 = settings?.level2Commission || "2";
  const lv3 = settings?.level3Commission || "1";

  const rPageTitle = getContent(settings, "content_rulespage_pageTitle", "Règles de la plateforme DIAMANT");
  const rS1Title = getContent(settings, "content_rulespage_s1Title", "1. Utilisation des produits DIAMANT");
  const rS1b1 = getContent(settings, "content_rulespage_s1b1", "Chaque produit affiche son prix, sa durée et ses conditions avant l'achat.");
  const rS1b2 = getContent(settings, "content_rulespage_s1b2", "Le premier gain est disponible immédiatement après l'achat. Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures.");
  const rS1b3 = getContent(settings, "content_rulespage_s1b3", "Consultez les informations du produit avant de confirmer.");
  const rS2Title = getContent(settings, "content_rulespage_s2Title", "2. Dépôts et retraits");
  const rS3Title = getContent(settings, "content_rulespage_s3Title", "3. Programme de parrainage");
  const rS3b4 = getContent(settings, "content_rulespage_s3b4", "Toute fraude, tentative de manipulation ou utilisation de comptes multiples peut entraîner la suspension du compte.");
  const rS4Title = getContent(settings, "content_rulespage_s4Title", "4. Bonus et récompenses");
  const rS5Title = getContent(settings, "content_rulespage_s5Title", "5. Sécurité");
  const rS5b1 = getContent(settings, "content_rulespage_s5b1", "Chaque membre est responsable de la sécurité de son mot de passe et de ses moyens de paiement.");
  const rS5b2 = getContent(settings, "content_rulespage_s5b2", "Ne partagez jamais vos identifiants, codes de validation ou adresse de portefeuille.");
  const rS5b3 = getContent(settings, "content_rulespage_s5b3", "Le support officiel DIAMANT ne vous demandera jamais votre mot de passe ni vos codes confidentiels.");

  return (
    <div className="flex min-h-screen flex-col text-[#26352d]" style={{ background: "#f8f9fa", color: "#26352d" }}>
      <header className="ielp-rules-header flex items-center border-b border-[#dbe8df] bg-[#087a38] px-4 py-3 text-white">
        <Link href="/account">
          <button className="p-1" data-testid="button-back" aria-label="Retour">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </Link>
        <h1 className="flex-1 pr-6 text-center text-lg font-semibold text-white">{rPageTitle}</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS1Title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#3f4d45]">
            <li>{rS1b1}</li>
            <li>{rS1b2}</li>
            <li>{rS1b3}</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS2Title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#3f4d45]">
            <li>Montant minimum de recharge : {parseInt(minDeposit).toLocaleString()} USDT.</li>
            <li>Montant minimum de retrait : {parseInt(minWithdrawal).toLocaleString()} USDT via USDT BEP20, sans frais.</li>
            <li>Horaires de retrait : {withdrawalStartHour}h00 – {withdrawalEndHour}h00.</li>
            <li>Maximum {maxWithdrawalsPerDay} retrait(s) par jour et par utilisateur.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS3Title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#3f4d45]">
            <li>Commission niveau 1 : {lv1}% selon les conditions du programme.</li>
            <li>Commission niveau 2 : {lv2}% selon les conditions du programme.</li>
            <li>Commission niveau 3 : {lv3}% selon les conditions du programme.</li>
            <li>{rS3b4}</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS4Title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#3f4d45]">
            <li>Chaque nouveau membre reçoit le bonus d'inscription configuré, actuellement de {parseInt(signupBonus).toLocaleString()} USDT.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS5Title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#3f4d45]">
            <li>{rS5b1}</li>
            <li>{rS5b2}</li>
            <li>{rS5b3}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
