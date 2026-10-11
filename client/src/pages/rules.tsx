import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "@shared/withdrawal-fees";
import {
  DEFAULT_DAILY_BONUS_MAX_USDT,
  DEFAULT_DAILY_BONUS_MIN_USDT,
  DEFAULT_MIN_DEPOSIT_USDT,
  DEFAULT_MIN_WITHDRAWAL_USDT,
} from "@shared/financial-settings";
import { getParcoursVipFaqRows, getVipThresholdFaqRows } from "@shared/rules-faq";
import type { Product } from "@shared/schema";
import { getContent, rebrandText } from "@/lib/content";
import { DEFAULT_REFERRAL_COMMISSION_RATES } from "@shared/referral-commission-settings";

function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <article className="space-y-1.5">
      <h3 className="font-semibold text-[#26352d]">{question}</h3>
      <div className="whitespace-pre-line text-sm leading-6 text-[#3f4d45]">{children}</div>
    </article>
  );
}

function formatUsdtAmount(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 6 })} USDT`;
}

function settingAmount(value: string | undefined, fallback: string): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number(fallback);
}

function settingCount(value: string | undefined, fallback: string): string {
  const parsed = Number(value ?? fallback);
  return Number.isSafeInteger(parsed) && parsed >= 0
    ? parsed.toLocaleString("fr-FR")
    : "non configuré";
}

export default function RulesPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const minDeposit = settings?.minDepositUsdt || DEFAULT_MIN_DEPOSIT_USDT;
  const minWithdrawal = settings?.minWithdrawalUsdt || DEFAULT_MIN_WITHDRAWAL_USDT;
  const withdrawalFees = settings?.withdrawalFees ?? String(DEFAULT_WITHDRAWAL_FEE_PERCENT);
  const withdrawalStartHour = settings?.withdrawalStartHour || "9";
  const withdrawalEndHour = settings?.withdrawalEndHour || "17";
  const maxWithdrawalsPerDay = settings?.maxWithdrawalsPerDay || "1";
  const dailyBonusMin = settingAmount(settings?.dailyBonusMinUsdt, DEFAULT_DAILY_BONUS_MIN_USDT);
  const dailyBonusMax = settingAmount(settings?.dailyBonusMaxUsdt, DEFAULT_DAILY_BONUS_MAX_USDT);
  const lv1 = settings?.level1Commission ?? DEFAULT_REFERRAL_COMMISSION_RATES.level1Commission;
  const lv2 = settings?.level2Commission ?? DEFAULT_REFERRAL_COMMISSION_RATES.level2Commission;
  const lv3 = settings?.level3Commission ?? DEFAULT_REFERRAL_COMMISSION_RATES.level3Commission;
  const vipThresholdRows = getVipThresholdFaqRows(settings ?? {});
  const parcoursRequirementRows = getParcoursVipFaqRows(products, settings ?? {});

  const rPageTitle = getContent(settings, "content_rulespage_pageTitle", "Règles de la plateforme DIAMANT");
  const rS1Title = getContent(settings, "content_rulespage_s1Title", "1. Utilisation des produits DIAMANT");
  const rS1b1 = getContent(settings, "content_rulespage_s1b1", "Chaque produit affiche son prix, sa durée et ses conditions avant l'achat.");
  const rS1b2 = getContent(settings, "content_rulespage_s1b2", "Les gains sont crédités automatiquement selon la catégorie : Explore après chaque période complète de 24 heures; Parcours et Offres à la fin du cycle. Aucune collecte manuelle n’est nécessaire.");
  const rS1b3 = getContent(settings, "content_rulespage_s1b3", "Consultez les informations du produit avant de confirmer.");
  const productRangeTitle = getContent(settings, "content_rulespage_productRangeTitle", "FAQ — Gamme des produits Explore, Parcours et Offres");
  const exploreQuestion = getContent(settings, "content_rulespage_exploreQuestion", "Pourquoi la gamme Explore est-elle obligatoire ?");
  const exploreAnswer = getContent(settings, "content_rulespage_exploreAnswer", "Explore est la gamme d’entrée obligatoire. Chaque produit Explore a une durée de 150 jours. Vous devez posséder au moins un produit Explore actif avant de pouvoir acheter un produit Parcours ou Offres. Consultez chaque fiche pour connaître son prix et les revenus annoncés.");
  const parcoursQuestion = getContent(settings, "content_rulespage_parcoursQuestion", "Quelles sont les conditions d’achat des produits Parcours ?");
  const parcoursAnswer = getContent(settings, "content_rulespage_parcoursAnswer", "L’achat d’un produit Explore actif reste nécessaire, mais ne suffit pas à débloquer Parcours. Le premier produit Parcours exige aussi le niveau VIP 1; les produits suivants peuvent exiger un niveau supérieur selon leur fiche. Le niveau VIP dépend du total cumulé de vos achats personnels payants dans Explore, Parcours et Offres, selon les seuils USDT configurés par l’administration. Les achats sont comptés dès leur confirmation; les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas.");
  const offresQuestion = getContent(settings, "content_rulespage_offresQuestion", "Comment fonctionnent les produits Offres ?");
  const offresAnswer = getContent(settings, "content_rulespage_offresAnswer", "De nouveaux produits Offres sont lancés chaque semaine et le nombre d’achats est limité. Ces produits annoncent des revenus potentiellement plus élevés, selon les conditions de leur fiche. Une fois la limite d’achats atteinte, l’offre peut ne plus être disponible. Vérifiez toujours le prix, la durée et les revenus affichés avant l’achat; aucun revenu n’est garanti.");
  const productAccessQuestion = getContent(settings, "content_rulespage_productAccessQuestion", "Un produit Explore doit-il rester actif pour acheter Parcours ou Offres ?");
  const productAccessAnswer = getContent(settings, "content_rulespage_productAccessAnswer", "Oui. Il faut posséder au moins un produit Explore actif pour acheter Parcours ou Offres. Pour Parcours, il faut aussi atteindre le niveau VIP minimum du produit; le premier exige au moins VIP 1. Un produit terminé, révoqué ou inactif ne satisfait pas la condition Explore.");
  const vipProgressQuestion = getContent(settings, "content_rulespage_vipProgressQuestion", "Comment progresse-t-on dans les niveaux VIP ?");
  const vipProgressAnswer = getContent(settings, "content_rulespage_vipProgressAnswer", "Chaque niveau VIP, de VIP 1 à VIP 7, est débloqué lorsque le total cumulé de vos achats personnels payants atteint le seuil configuré par l’administration. Sont comptés les achats Explore, Parcours et Offres dès leur confirmation, sans attendre la fin du cycle. Les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas. Certains produits Parcours exigent un niveau VIP minimum.");
  const vipThresholdsTitle = getContent(settings, "content_rulespage_vipThresholdsTitle", "Seuils actuels des niveaux VIP");
  const vipThresholdsAnswer = getContent(settings, "content_rulespage_vipThresholdsAnswer", "Les montants ci-dessous sont les seuils cumulatifs configurés dans l’administration. Les achats personnels payants en USDT sont additionnés dès leur confirmation.");
  const parcoursRequirementsQuestion = getContent(settings, "content_rulespage_parcoursRequirementsQuestion", "Quel niveau VIP est requis pour chaque produit Parcours ?");
  const parcoursRequirementsAnswer = getContent(settings, "content_rulespage_parcoursRequirementsAnswer", "Le premier produit Parcours exige au minimum VIP 1; les niveaux minimums des autres fiches restent configurables. Le seuil USDT associé à chaque niveau est actualisé automatiquement. Il faut aussi posséder un produit Explore actif.");
  const earningsQuestion = getContent(settings, "content_rulespage_earningsQuestion", "Quand les gains des produits sont-ils crédités ?");
  const earningsAnswer = getContent(settings, "content_rulespage_earningsAnswer", "Explore crédite les gains après chaque période complète de 24 heures. Parcours et Offres créditent leurs gains à la fin du cycle. Les crédits sont automatiques : aucune collecte manuelle n’est nécessaire.");
  const balancesQuestion = getContent(settings, "content_rulespage_balancesQuestion", "Comment les soldes sont-ils utilisés ?");
  const balancesAnswer = getContent(settings, "content_rulespage_balancesAnswer", "Les achats utilisent d’abord le solde de dépôt, puis le solde des gains si nécessaire. Les retraits sont effectués depuis le solde des gains.");
  const rS2Title = getContent(settings, "content_rulespage_s2Title", "2. Dépôts et retraits");
  const depositQuestion = getContent(settings, "content_rulespage_depositQuestion", "Comment déposer des USDT ?");
  const depositAnswer = getContent(settings, "content_rulespage_depositAnswer", "Effectuez votre dépôt en USDT en utilisant exactement le réseau indiqué sur la page de dépôt pour l’adresse ou le QR code sélectionné. N’envoyez pas un autre actif ou depuis un réseau différent.");
  const withdrawalQuestion = getContent(settings, "content_rulespage_withdrawalQuestion", "Quelles sont les conditions de retrait ?");
  const withdrawalAnswer = getContent(settings, "content_rulespage_withdrawalAnswer", "Les retraits sont effectués en USDT BEP20 depuis le solde des gains. Les montants minimum, frais, horaires et limites par jour affichés ci-dessous suivent les réglages actuels.");
  const rS3Title = getContent(settings, "content_rulespage_s3Title", "3. Programme de parrainage");
  const referralQuestion = getContent(settings, "content_rulespage_referralQuestion", "Comment sont calculées les commissions de parrainage ?");
  const referralAnswer = getContent(settings, "content_rulespage_referralAnswer", "Les taux ci-dessous sont ceux configurés pour chaque niveau de parrainage et s’appliquent aux achats payants admissibles de vos filleuls. Consultez les conditions du programme; toute fraude ou création de comptes multiples peut entraîner une suspension.");
  const rS3b4 = getContent(settings, "content_rulespage_s3b4", "Toute fraude, tentative de manipulation ou utilisation de comptes multiples peut entraîner la suspension du compte.");
  const rewardsTitle = getContent(settings, "content_rulespage_rewardsTitle", "4. Bonus et roue");
  const dailyBonusQuestion = getContent(settings, "content_rulespage_dailyBonusQuestion", "Comment fonctionne le pointage quotidien ?");
  const dailyBonusAnswer = getContent(settings, "content_rulespage_dailyBonusAnswer", "Le pointage peut être réclamé une fois par période de 24 heures. Le montant est tiré au sort dans la fourchette USDT actuellement configurée et crédité au solde des gains.");
  const wheelQuestion = getContent(settings, "content_rulespage_wheelQuestion", "Comment obtenir des tours sur la roue ?");
  const wheelAnswer = getContent(settings, "content_rulespage_wheelAnswer", "Les tours sont attribués selon les réglages actuels pour chaque achat payant admissible : au membre qui achète et, lors d’un achat d’un filleul direct, à son parrain direct. Une inscription seule ne donne pas de tour.");
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

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">
            {productRangeTitle}
          </h2>
          <div className="space-y-4">
            <FaqItem question={exploreQuestion}><p>{exploreAnswer}</p></FaqItem>
            <FaqItem question={parcoursQuestion}><p>{parcoursAnswer}</p></FaqItem>
            <FaqItem question={offresQuestion}><p>{offresAnswer}</p></FaqItem>
            <FaqItem question={productAccessQuestion}><p>{productAccessAnswer}</p></FaqItem>
            <FaqItem question={vipProgressQuestion}>
              <p>{vipProgressAnswer}</p>
              <h4 className="mt-3 font-semibold text-[#26352d]">{vipThresholdsTitle}</h4>
              <p>{vipThresholdsAnswer}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {vipThresholdRows.map(({ level, thresholdUsdt }) => (
                  <li key={level}>
                    VIP {level} : {thresholdUsdt === null ? "seuil non configuré" : `${formatUsdtAmount(thresholdUsdt)} cumulés`}
                  </li>
                ))}
              </ul>
            </FaqItem>
            <FaqItem question={parcoursRequirementsQuestion}>
              <p>{parcoursRequirementsAnswer}</p>
              {productsLoading ? (
                <p className="mt-2">Chargement des conditions actuelles…</p>
              ) : productsError ? (
                <p className="mt-2">Impossible de charger les conditions actuelles des produits.</p>
              ) : parcoursRequirementRows.length === 0 ? (
                <p className="mt-2">Aucun produit Parcours USDT actif n’est publié actuellement.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {parcoursRequirementRows.map((product) => (
                    <li key={product.id}>
                      {rebrandText(product.name)} :{" "}
                      {product.requiredVipLevel === null
                        ? "condition VIP non configurée"
                        : product.requiredVipLevel === 0
                          ? "aucun niveau VIP minimum"
                          : product.thresholdUsdt === null
                            ? `VIP ${product.requiredVipLevel} — seuil non configuré`
                            : `VIP ${product.requiredVipLevel} — ${formatUsdtAmount(product.thresholdUsdt)} cumulés`}
                      {product.unavailable ? " (indisponible actuellement)" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </FaqItem>
            <FaqItem question={earningsQuestion}><p>{earningsAnswer}</p></FaqItem>
            <FaqItem question={balancesQuestion}><p>{balancesAnswer}</p></FaqItem>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS2Title}</h2>
          <FaqItem question={depositQuestion}>
            <p>{depositAnswer}</p>
            <p className="mt-2">Minimum actuel : {formatUsdtAmount(settingAmount(minDeposit, DEFAULT_MIN_DEPOSIT_USDT))}.</p>
          </FaqItem>
          <FaqItem question={withdrawalQuestion}>
            <p>{withdrawalAnswer}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Minimum actuel : {formatUsdtAmount(settingAmount(minWithdrawal, DEFAULT_MIN_WITHDRAWAL_USDT))}.</li>
              <li>Frais actuels : {Number(withdrawalFees).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}% du montant demandé.</li>
              <li>Réseau : USDT BEP20.</li>
              <li>Horaires : {withdrawalStartHour}h00 – {withdrawalEndHour}h00.</li>
              <li>Maximum : {maxWithdrawalsPerDay} retrait(s) par jour et par utilisateur.</li>
            </ul>
          </FaqItem>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rS3Title}</h2>
          <FaqItem question={referralQuestion}>
            <p>{referralAnswer}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Niveau 1 : {lv1}%.</li>
              <li>Niveau 2 : {lv2}%.</li>
              <li>Niveau 3 : {lv3}%.</li>
            </ul>
            <p className="mt-2">{rS3b4}</p>
          </FaqItem>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="ielp-rules-heading border-l-4 border-[#00a651] pl-3 text-lg font-bold text-[#087a38]">{rewardsTitle}</h2>
          <FaqItem question={dailyBonusQuestion}>
            <p>{dailyBonusAnswer}</p>
            <p className="mt-2">
              {dailyBonusMin === 0 && dailyBonusMax === 0
                ? "Bonus quotidien actuellement désactivé."
                : `Montant actuel : de ${formatUsdtAmount(dailyBonusMin)} à ${formatUsdtAmount(dailyBonusMax)}.`}
            </p>
          </FaqItem>
          <FaqItem question={wheelQuestion}>
            <p>{wheelAnswer}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Achat personnel payant : {settingCount(settings?.spinWheelSelfPurchaseSpins, "1")} tour(s) attribué(s) à l’acheteur par produit.</li>
              <li>Achat payant d’un filleul direct : {settingCount(settings?.spinWheelReferralPurchaseSpins, "1")} tour(s) attribué(s) au parrain direct par produit.</li>
            </ul>
          </FaqItem>
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
