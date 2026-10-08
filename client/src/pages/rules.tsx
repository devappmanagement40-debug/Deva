import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "@shared/withdrawal-fees";
import { DEFAULT_MIN_DEPOSIT_XOF, DEFAULT_MIN_WITHDRAWAL_XOF } from "@shared/financial-settings";
import { getContent } from "@/lib/content";
import { DEFAULT_REFERRAL_COMMISSION_RATES } from "@shared/referral-commission-settings";

export default function RulesPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const minDeposit = settings?.minDeposit || String(DEFAULT_MIN_DEPOSIT_XOF);
  const minWithdrawal = settings?.minWithdrawal || String(DEFAULT_MIN_WITHDRAWAL_XOF);
  const withdrawalFees = settings?.withdrawalFees ?? String(DEFAULT_WITHDRAWAL_FEE_PERCENT);
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const lv1 = settings?.level1Commission ?? DEFAULT_REFERRAL_COMMISSION_RATES.level1Commission;
  const lv2 = settings?.level2Commission ?? DEFAULT_REFERRAL_COMMISSION_RATES.level2Commission;
  const lv3 = settings?.level3Commission ?? DEFAULT_REFERRAL_COMMISSION_RATES.level3Commission;

  const rPageTitle = getContent(settings, "content_rulespage_pageTitle", "Règles de la plateforme DIAMANT");
  const rS1Title = getContent(settings, "content_rulespage_s1Title", "1. Utilisation des produits DIAMANT");
  const rS1b1 = getContent(settings, "content_rulespage_s1b1", "Chaque produit affiche son prix, sa durée et ses conditions avant l'achat.");
  const rS1b2 = getContent(settings, "content_rulespage_s1b2", "Les gains du produit sont crédités automatiquement sur le solde des gains à la fin de la durée indiquée. Aucune collecte manuelle n'est nécessaire.");
  const rS1b3 = getContent(settings, "content_rulespage_s1b3", "Consultez les informations du produit avant de confirmer.");
  const productRangeTitle = getContent(settings, "content_rulespage_productRangeTitle", "FAQ — Gamme des produits Explore, Parcours et Offres");
  const exploreQuestion = getContent(settings, "content_rulespage_exploreQuestion", "Pourquoi la gamme Explore est-elle obligatoire ?");
  const exploreAnswer = getContent(settings, "content_rulespage_exploreAnswer", "Explore est la gamme d’entrée obligatoire. Chaque produit Explore a une durée de 150 jours. Vous devez posséder au moins un produit Explore actif avant de pouvoir acheter un produit Parcours ou Offres. Consultez chaque fiche pour connaître son prix et les revenus annoncés.");
  const parcoursQuestion = getContent(settings, "content_rulespage_parcoursQuestion", "Quelles sont les conditions d’achat des produits Parcours ?");
  const parcoursAnswer = getContent(settings, "content_rulespage_parcoursAnswer", "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Chaque produit Parcours peut avoir ses propres conditions, notamment un niveau VIP minimum. Le niveau VIP dépend du total cumulé de vos achats personnels payants dans Explore, Parcours et Offres; le seuil de chaque niveau, dès VIP 1, est configuré par l’administration. Les achats sont comptés dès leur confirmation; les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas.");
  const offresQuestion = getContent(settings, "content_rulespage_offresQuestion", "Comment fonctionnent les produits Offres ?");
  const offresAnswer = getContent(settings, "content_rulespage_offresAnswer", "De nouveaux produits Offres sont lancés chaque semaine et le nombre d’achats est limité. Ces produits annoncent des revenus potentiellement plus élevés, selon les conditions de leur fiche. Une fois la limite d’achats atteinte, l’offre peut ne plus être disponible. Vérifiez toujours le prix, la durée et les revenus affichés avant l’achat; aucun revenu n’est garanti.");
  const productAccessQuestion = getContent(settings, "content_rulespage_productAccessQuestion", "Un produit Explore doit-il rester actif pour acheter Parcours ou Offres ?");
  const productAccessAnswer = getContent(settings, "content_rulespage_productAccessAnswer", "Oui. Il faut posséder au moins un produit Explore actif. Un produit terminé, révoqué ou inactif ne satisfait pas cette condition.");
  const vipProgressQuestion = getContent(settings, "content_rulespage_vipProgressQuestion", "Comment progresse-t-on dans les niveaux VIP ?");
  const vipProgressAnswer = getContent(settings, "content_rulespage_vipProgressAnswer", "Chaque niveau VIP, de VIP 1 à VIP 7, est débloqué lorsque le total cumulé de vos achats personnels payants atteint le seuil configuré par l’administration. Sont comptés les achats Explore, Parcours et Offres dès leur confirmation, sans attendre la fin du cycle. Les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas. Certains produits Parcours exigent un niveau VIP minimum.");
  const rS2Title = getContent(settings, "content_rulespage_s2Title", "2. Dépôts et retraits");
  const rS3Title = getContent(settings, "content_rulespage_s3Title", "3. Programme de parrainage");
  const rS3b4 = getContent(settings, "content_rulespage_s3b4", "Toute fraude, tentative de manipulation ou utilisation de comptes multiples peut entraîner la suspension du compte.");
  const rS5Title = getContent(settings, "content_rulespage_s5Title", "4. Sécurité");
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

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">
            {productRangeTitle}
          </h2>
          <div className="space-y-4">
            {[
              { question: exploreQuestion, answer: exploreAnswer },
              { question: parcoursQuestion, answer: parcoursAnswer },
              { question: offresQuestion, answer: offresAnswer },
              { question: productAccessQuestion, answer: productAccessAnswer },
              { question: vipProgressQuestion, answer: vipProgressAnswer },
            ].map(({ question, answer }) => (
              <article key={question} className="space-y-1.5">
                <h3 className="font-semibold text-[#26352d]">{question}</h3>
                <p className="whitespace-pre-line text-sm leading-6 text-[#3f4d45]">{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS2Title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#3f4d45]">
            <li>Montant minimum de recharge : {parseInt(minDeposit).toLocaleString()} XOF.</li>
            <li>Moyens de recharge : Mobile Money et USDT BEP20, selon les options disponibles.</li>
            <li>Montant minimum de retrait : {parseInt(minWithdrawal).toLocaleString()} XOF.</li>
            <li>Frais de retrait : {Number(withdrawalFees).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} % retenus sur le montant demandé.</li>
            <li>Moyens disponibles : Mobile Money ou USDT BEP20, selon les options du pays.</li>
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
