// Registry of admin-editable text content shown across the client app.
// Each field is stored as a key in the generic `platformSettings` key/value
// table (reusing the existing /api/settings + /api/admin/settings endpoints),
// so adding a new field here is all that's needed to make it editable from
// Admin > Contenu — no backend changes required.
//
// `key` is the settings key used everywhere (client pages read it with a
// fallback to `defaultValue`, matching the text that used to be hardcoded).

export interface ContentField {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
}

export interface ContentGroup {
  id: string;
  title: string;
  fields: ContentField[];
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "home",
    title: "首页 — 通知弹窗",
    fields: [
      { key: "content_home_popupTitle", label: "Titre de l'annonce", defaultValue: "Annonce DIAMANT" },
      { key: "content_home_popupLine1", label: "Ligne 1", defaultValue: "Bienvenue sur la plateforme DIAMANT.", multiline: true },
      { key: "content_home_popupLine2", label: "Ligne 2", defaultValue: "Les dépôts sont crédités après confirmation du paiement.", multiline: true },
      { key: "content_home_popupLine3", label: "Ligne 3", defaultValue: "Dépôt minimum : 18 XOF.", multiline: true },
      { key: "content_home_popupLine4", label: "Ligne 4", defaultValue: "Retrait minimum : 1 XOF via USDT BEP20, sans frais.", multiline: true },
      { key: "content_home_popupLine5", label: "Ligne 5", defaultValue: "Les retraits et le support sont disponibles de 09:00 à 17:00.", multiline: true },
      { key: "content_home_popupLine6", label: "Ligne 6", defaultValue: "Les gains des produits sont crédités automatiquement à la fin de leur cycle.", multiline: true },
      { key: "content_home_popupLine7", label: "Ligne 7", defaultValue: "Invitez vos amis et gagnez des commissions de parrainage.", multiline: true },
      { key: "content_home_popupLine8", label: "Ligne 8", defaultValue: "Merci de consulter les règles DIAMANT avant toute opération.", multiline: true },
      { key: "content_home_activityLabel", label: "Libellé activité récente", defaultValue: "Votre activité récente" },
      { key: "content_home_balanceLabel", label: "Libellé solde", defaultValue: "Solde du compte" },
      { key: "content_home_earningsLabel", label: "Libellé revenus", defaultValue: "Total des revenus" },
      { key: "content_home_experienceTitle", label: "Titre expérience", defaultValue: "Expérience" },
      { key: "content_home_sustainabilityTitle", label: "Titre durabilité", defaultValue: "Durabilité" },
      { key: "content_home_specialProductsTitle", label: "Titre produits vedettes", defaultValue: "Produits vedettes" },
      { key: "content_home_viewAllLabel", label: "Libellé voir tout", defaultValue: "Voir tout" },
      { key: "content_home_noProductsLabel", label: "Message sans produit", defaultValue: "Aucun produit vedette disponible" },
      { key: "content_home_partnersTitle", label: "Titre partenaires", defaultValue: "Nos partenaires" },
    ],
  },
  {
    id: "rules",
    title: "平台规则弹窗",
    fields: [
      { key: "content_rules_title", label: "弹窗标题", defaultValue: "平台规则" },
      { key: "content_rules_section1Title", label: "第1部分标题", defaultValue: "1. 充值" },
      { key: "content_rules_section1Body", label: "Contenu de la partie 1", defaultValue: "- Minimum : 18 XOF\n- Le dépôt est crédité après confirmation du paiement\n- Vérifiez les informations avant de payer", multiline: true },
      { key: "content_rules_section2Title", label: "Titre de la partie 2", defaultValue: "2. Retraits" },
      { key: "content_rules_section2Body", label: "Contenu de la partie 2", defaultValue: "- Minimum : 1 XOF\n- Réseau accepté : USDT BEP20\n- Aucun frais de retrait\n- Horaires : 09:00 - 17:00\n- Maximum 1 retrait par jour\n- Un produit actif et un portefeuille enregistré sont requis", multiline: true },
      { key: "content_rules_section3Title", label: "Titre de la partie 3", defaultValue: "3. Produits DIAMANT" },
      { key: "content_rules_section3Body", label: "Contenu de la partie 3", defaultValue: "- Chaque produit affiche son prix, sa durée et ses revenus avant l'achat\n- Le premier gain est disponible immédiatement après l'achat\n- Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures", multiline: true },
      { key: "content_rules_section4Title", label: "Titre de la partie 4", defaultValue: "4. Parrainage" },
      { key: "content_rules_section4Body", label: "Contenu de la partie 4", defaultValue: "- Les taux des niveaux 1, 2 et 3 sont ceux affichés dans les paramètres\n- Les commissions sont créditées selon les conditions du programme\n- Toute tentative de manipulation peut entraîner la suspension du compte", multiline: true },
      { key: "content_rules_section5Title", label: "Titre de la partie 5", defaultValue: "5. Sécurité" },
      { key: "content_rules_section5Body", label: "Contenu de la partie 5", defaultValue: "Protégez votre compte et ne partagez jamais vos identifiants ou codes de validation.", multiline: true },
    ],
  },
  {
    id: "team",
    title: "团队 / 推荐",
    fields: [
      { key: "content_team_headerTitle", label: "Titre de la page", defaultValue: "Mon équipe" },
      { key: "content_team_myTeamButton", label: "Bouton membres", defaultValue: "Membres >" },
      { key: "content_team_taskCenterButton", label: "Bouton centre des tâches", defaultValue: "Centre des tâches >" },
      { key: "content_team_inviteTitle", label: "Titre invitation", defaultValue: "Inviter des amis" },
      { key: "content_team_progressTitle", label: "Titre progression", defaultValue: "Ma progression" },
      { key: "content_team_howItWorksTitle", label: "Titre fonctionnement", defaultValue: "Comment ça marche" },
      { key: "content_team_tip", label: "Conseil de bas de page", defaultValue: "Les trois niveaux de votre équipe déterminent les commissions prévues par le programme de parrainage.", multiline: true },
    ],
  },
  {
    id: "tasks",
    title: "任务中心（/tasks）",
    fields: [
      { key: "content_tasks_headerTitle", label: "标题", defaultValue: "推荐计划" },
      { key: "content_tasks_headerSubtitle", label: "副标题", defaultValue: "邀请好友并获得奖励" },
      { key: "content_tasks_tiersTitle", label: "推荐等级标题", defaultValue: "推荐等级" },
      { key: "content_tasks_claimAllButton", label: "全部领取按钮", defaultValue: "全部领取" },
    ],
  },
  {
    id: "salarybonus",
    title: "Centre des tâches (page /salary-bonus)",
    fields: [
      { key: "content_salarybonus_headerTitle", label: "Titre de la page", defaultValue: "Centre des tâches" },
    ],
  },
  {
    id: "checkin",
    title: "Pointage quotidien",
    fields: [
      { key: "content_checkin_headerTitle", label: "Titre de la page", defaultValue: "Pointage" },
      { key: "content_checkin_cardTitle", label: "Titre de la carte", defaultValue: "Pointage quotidien" },
      { key: "content_checkin_cardSubtitle", label: "Sous-titre de la carte", defaultValue: "Recevez une récompense aléatoire chaque jour" },
      { key: "content_checkin_dailyRewardLabel", label: "Libellé « Récompense du jour »", defaultValue: "Récompense du jour" },
      { key: "content_checkin_streakLabel", label: "Libellé « Jours consécutifs »", defaultValue: "Jours consécutifs" },
      { key: "content_checkin_totalLabel", label: "Libellé « Récompenses cumulées »", defaultValue: "Récompenses cumulées" },
      { key: "content_checkin_rule1", label: "Règle 1", defaultValue: "1. À chaque pointage, recevez aléatoirement entre 50 et 100 XOF.", multiline: true },
      { key: "content_checkin_rule2", label: "Règle 2", defaultValue: "2. Connectez-vous une fois par jour pour accumuler des points.", multiline: true },
    ],
  },
  {
    id: "giftcode",
    title: "Code Bonus",
    fields: [
      { key: "content_giftcode_headerTitle", label: "Titre de la page", defaultValue: "Code Bonus" },
      { key: "content_giftcode_infoLine1", label: "Texte d'information 1", defaultValue: "Entrez votre code bonus pour recevoir votre récompense instantanément", multiline: true },
      { key: "content_giftcode_infoLine2", label: "Texte d'information 2", defaultValue: "Les codes sont publiés dans les canaux officiels DIAMANT.", multiline: true },
      { key: "content_giftcode_howToTitle", label: "Titre « Comment obtenir des codes ? »", defaultValue: "Comment obtenir des codes ?", multiline: true },
      { key: "content_giftcode_step1", label: "Étape 1", defaultValue: "Rejoignez notre canal Telegram officiel", multiline: true },
      { key: "content_giftcode_step2", label: "Étape 2", defaultValue: "Suivez les annonces publiées par DIAMANT.", multiline: true },
      { key: "content_giftcode_step3", label: "Étape 3", defaultValue: "Copiez le code et collez-le ici avant expiration", multiline: true },
    ],
  },
  {
    id: "orders",
    title: "Mes commandes",
    fields: [
      { key: "content_orders_headerTitle", label: "Titre de la page", defaultValue: "Mes commandes" },
      { key: "content_orders_infoLine1", label: "Texte d'information 1", defaultValue: "Le premier gain est disponible immédiatement après l'achat. Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures.", multiline: true },
      { key: "content_orders_infoLine2", label: "Texte d'information 2", defaultValue: "Vous pouvez acheter plusieurs machines pour augmenter vos revenus.", multiline: true },
    ],
  },
  {
    id: "products",
    title: "Nos Produits",
    fields: [
      { key: "content_products_headerTitle", label: "Titre de la page", defaultValue: "Nos Produits" },
    ],
  },
  {
    id: "deposit",
    title: "Page Dépôt / Recharge",
    fields: [
      { key: "content_deposit_infoText", label: "Texte d'information principal", defaultValue: "Sur DIAMANT, les dépôts sont possibles par Mobile Money via les pays et opérateurs disponibles, ou par USDT BEP20. Le crédit intervient après validation du paiement.", multiline: true },
      { key: "content_deposit_warning1", label: "Avertissement 1 (coordonnées de paiement)", defaultValue: "Avant de payer, vérifiez le montant, le pays, l’opérateur et les coordonnées affichés. Pour USDT, utilisez uniquement le réseau BEP20.", multiline: true },
      { key: "content_deposit_warning2", label: "Avertissement 2 (problèmes de dépôt)", defaultValue: "Ne payez qu’avec les coordonnées affichées pour votre dépôt. Si le crédit est retardé, signalez l’opération depuis cette page ou contactez le support.", multiline: true },
      { key: "content_deposit_instruction1", label: "Instruction 1", defaultValue: "1. Le minimum de dépôt affiché sur cette page est actualisé depuis les paramètres de la plateforme.", multiline: true },
      { key: "content_deposit_instruction2", label: "Instruction 2", defaultValue: "2. Suivez les consignes du moyen choisi : Mobile Money ou USDT BEP20. Le solde est crédité après validation du paiement.", multiline: true },
    ],
  },
  {
    id: "withdrawal",
    title: "Page Retrait",
    fields: [
      { key: "content_withdrawal_ctaButton", label: "Texte du bouton de retrait", defaultValue: "Retirez votre argent maintenant" },
      { key: "content_withdrawal_instructionsTitle", label: "Titre section instructions", defaultValue: "Instructions de retrait" },
      { key: "content_withdrawal_instruction1", label: "Instruction 1", defaultValue: "1. Le montant minimum de retrait est défini dans les paramètres de la plateforme.", multiline: true },
      { key: "content_withdrawal_instruction2", label: "Instruction 2", defaultValue: "2. Un seul retrait par jour est autorisé, selon les paramètres actuels de la plateforme.", multiline: true },
      { key: "content_withdrawal_instruction3", label: "Instruction 3", defaultValue: "3. Le montant demandé sera reçu intégralement.", multiline: true },
      { key: "content_withdrawal_instruction4", label: "Instruction 4", defaultValue: "4. Les retraits sont disponibles de 09:00 à 17:00. Le délai de traitement dépend de la vérification de la demande.", multiline: true },
      { key: "content_withdrawal_instruction5", label: "Instruction 5", defaultValue: "5. Si le retrait échoue, vérifiez que votre adresse USDT BEP20 est correcte, puis soumettez à nouveau la demande.", multiline: true },
      { key: "content_withdrawal_instruction6", label: "Instruction 6", defaultValue: "6. Consultez les conditions de retrait affichées par la plateforme avant votre demande.", multiline: true },
      { key: "content_withdrawal_warningNoHours", label: "Avertissement hors horaires", defaultValue: "⏰ Retraits fermés actuellement. Réessayez pendant les horaires indiqués.", multiline: true },
      { key: "content_withdrawal_warningNoProduct", label: "Avertissement sans produit actif", defaultValue: "⚠️ Vous devez avoir un produit actif pour effectuer un retrait.", multiline: true },
    ],
  },
  {
    id: "about",
    title: "Détails de l’entreprise DIAMANT",
    fields: [
      { key: "content_about_pageTitle", label: "Titre de la page", defaultValue: "Détails de l’entreprise DIAMANT" },
      { key: "content_about_storyTitle", label: "Titre de l’histoire", defaultValue: "Une entreprise minière fondée en Chine en 2000" },
      { key: "content_about_storyText", label: "Présentation de l’entreprise", defaultValue: "Fondée en Chine en 2000, DIAMANT est une entreprise du secteur minier. Elle s’intéresse aux ressources minérales et aux enjeux qui les entourent, notamment pour l’or, le diamant et le cuivre. Son ambition est de présenter ce domaine avec clarté et de promouvoir une approche réfléchie et responsable.", multiline: true },
      { key: "content_about_s1Title", label: "Titre section 1", defaultValue: "Notre vision du secteur minier" },
      { key: "content_about_s1Text1", label: "Paragraphe 1", defaultValue: "Les ressources minérales jouent un rôle important dans de nombreuses industries. Pour DIAMANT, faire connaître le secteur minier, c’est aussi expliquer les ressources, les filières et les enjeux propres à chaque projet.", multiline: true },
      { key: "content_about_s1Text2", label: "Paragraphe 2", defaultValue: "Notre ambition est de construire une présentation accessible et sérieuse, qui donne aux membres des repères pour mieux comprendre les activités minières sans simplifier leur complexité.", multiline: true },
      { key: "content_about_s2Title", label: "Titre section 2", defaultValue: "Or, diamant et cuivre" },
      { key: "content_about_s2Text", label: "Contenu section 2", defaultValue: "DIAMANT met l’accent sur l’or, le diamant et le cuivre. Chacune de ces ressources possède ses caractéristiques, ses usages et ses enjeux. Leur étude demande de tenir compte des réalités techniques, économiques, environnementales et réglementaires propres à chaque projet.", multiline: true },
      { key: "content_about_s3Title", label: "Titre section 3", defaultValue: "Comprendre les projets miniers" },
      { key: "content_about_s3Text", label: "Contenu section 3", defaultValue: "Un projet minier repose sur des études, des choix techniques adaptés, des autorisations et une analyse des impacts. Les informations présentées par DIAMANT ont vocation à aider les membres à comprendre les différentes dimensions du secteur et à examiner chaque projet selon ses caractéristiques.", multiline: true },
      { key: "content_about_s4Title", label: "Titre section 4", defaultValue: "Clarté et responsabilité" },
      { key: "content_about_s4Text", label: "Contenu section 4", defaultValue: "Le secteur minier exige une information précise et une réflexion à long terme. DIAMANT souhaite présenter ses orientations et ses contenus avec clarté, en rappelant que les conditions et perspectives varient selon les projets. Chaque information doit être examinée dans son contexte avant toute décision.", multiline: true },
    ],
  },
  {
    id: "service",
    title: "Page Service client",
    fields: [
      { key: "content_service_pageTitle", label: "Titre de la page", defaultValue: "Service client" },
      { key: "content_service_withdrawalHoursText", label: "Texte horaires de retrait", defaultValue: "Heures de retrait : 09:00 - 17:00." },
      { key: "content_service_supportHoursLabel", label: "Libellé horaires service client", defaultValue: "Horaires du service client :" },
    ],
  },
  {
    id: "rulespage",
    title: "Page Règles de la plateforme",
    fields: [
      { key: "content_rulespage_pageTitle", label: "Titre de la page", defaultValue: "Règles de la plateforme" },
      { key: "content_rulespage_s1Title", label: "Titre section 1", defaultValue: "1. Investissement" },
      { key: "content_rulespage_s1b1", label: "Section 1 — Règle 1", defaultValue: "Chaque utilisateur peut posséder plusieurs produits d'investissement simultanément.", multiline: true },
      { key: "content_rulespage_s1b2", label: "Section 1 — Règle 2", defaultValue: "Le premier gain est disponible immédiatement après l'achat. Collectez vos gains dans la section Revenu, puis collectez un nouveau gain toutes les 24 heures.", multiline: true },
      { key: "content_rulespage_s1b3", label: "Section 1 — Règle 3", defaultValue: "La durée et les revenus sont ceux indiqués sur la fiche de chaque produit.", multiline: true },
      { key: "content_rulespage_s2Title", label: "Titre section 2", defaultValue: "2. Dépôts et Retraits" },
      { key: "content_rulespage_s3Title", label: "Titre section 3", defaultValue: "3. Système de Parrainage" },
      { key: "content_rulespage_s3b4", label: "Section 3 — Règle anti-fraude", defaultValue: "Les activités frauduleuses ou la création de comptes multiples pour manipuler le système entraîneront la suspension du compte.", multiline: true },
      { key: "content_rulespage_s5Title", label: "Titre section 4", defaultValue: "4. Sécurité" },
      { key: "content_rulespage_s5b1", label: "Section 4 — Règle 1", defaultValue: "Vous êtes responsable de la sécurité de votre mot de passe.", multiline: true },
      { key: "content_rulespage_s5b2", label: "Section 4 — Règle 2", defaultValue: "Ne partagez jamais vos identifiants de connexion avec des tiers.", multiline: true },
      { key: "content_rulespage_s5b3", label: "Section 4 — Règle 3", defaultValue: "Le service client officiel ne vous demandera jamais votre mot de passe.", multiline: true },
    ],
  },
];

export const ALL_CONTENT_FIELDS: ContentField[] = CONTENT_GROUPS.flatMap(g => g.fields);
