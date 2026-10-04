import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ENGLISH_TRANSLATIONS } from "./i18n-en.generated";
import { ARABIC_TRANSLATIONS, CHINESE_TRANSLATIONS } from "./i18n-generated-locales";

export type Lang = "fr" | "en" | "ar" | "zh";

export function localeForLang(lang: Lang): string {
  return lang === "fr" ? "fr-FR" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "en-US";
}

export const LANGUAGES: { code: Lang; label: string; shortLabel: string; nativeName: string; flag: string }[] = [
  { code: "fr", label: "French", shortLabel: "FR", nativeName: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", shortLabel: "EN", nativeName: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", shortLabel: "ع", nativeName: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "Chinese", shortLabel: "中", nativeName: "中文", flag: "🇨🇳" },
];

export type Translations = {
  yourNumber: string;
  yourPassword: string;
  rememberMe: string;
  loginBtn: string;
  loginLoading: string;
  noAccount: string;
  createAccount: string;
  registerBtn: string;
  registerLoading: string;
  repeatPassword: string;
  referralCode: string;
  terms: string;
  errInvalidPhone: string;
  errPasswordRequired: string;
  errMinPassword: string;
  errConfirmPassword: string;
  errPasswordMismatch: string;
  errTransactionPasswordRequired: string;
  errInvitationCodeRequired: string;
  errTelegramRequired: string;
  errTelegramFormat: string;
  errTermsRequired: string;
  errLoginFailed: string;
  errRegisterFailed: string;
  successRegister: string;
  welcomeMsg: string;
  languageLabel: string;
  selectCountry: string;
  authPhoneLabel: string;
  authPasswordLabel: string;
  authPinLabel: string;
  authCaptchaLabel: string;
  authCaptchaRequired: string;
  authNoAccountPrompt: string;
  authHasAccountPrompt: string;
  authHome: string;
  authRememberMe: string;
  phonePlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  transactionPasswordPlaceholder: string;
  invitationCodePlaceholder: string;
  telegramPlaceholder: string;
  rememberPassword: string;
  loginImmediately: string;
  registerNow: string;
  noAccountRegister: string;
  alreadyHaveAccountLogin: string;
  home: string;
  products: string;
  earnings: string;
  team: string;
  me: string;
  deposit: string;
  withdraw: string;
  customerService: string;
  shareInformation: string;
  informationCenter: string;
  previous: string;
  next: string;
  notification: string;
  loading: string;
  noProducts: string;
  price: string;
  dailyRevenue: string;
  totalRevenue: string;
  duration: string;
  period: string;
  buy: string;
  purchased: string;
  purchaseSuccess: string;
  purchaseSuccessDescription: string;
  errorOccurred: string;
  accountBalance: string;
  revenue: string;
  adminPanel: string;
  adminAccessCode: string;
  adminPinHint: string;
  pinPlaceholder: string;
  confirm: string;
  cancel: string;
  history: string;
  security: string;
  redeem: string;
  about: string;
  wallet: string;
  commonFunctions: string;
  logout: string;
  // account suspended
  accountSuspended: string;
  accountSuspendedDesc: string;
  // change password page/modal
  back: string;
  changePassword: string;
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  saving: string;
  processing: string;
  requiredFields: string;
  fillAllFields: string;
  passwordTooShort: string;
  minSixCharsRequired: string;
  passwordSuccess: string;
  passwordSuccessDesc: string;
  currentPasswordPlaceholder: string;
  newPasswordPlaceholder: string;
  confirmNewPasswordPlaceholder: string;
  // history / empty states
  noWithdrawals: string;
  noTransactions: string;
  withdrawalHistory: string;
  // status labels
  statusApproved: string;
  statusPending: string;
  statusRejected: string;
  // withdrawal page
  invalidAmount: string;
  minAmountPrefix: string;
  addressRequired: string;
  selectUsdtWallet: string;
  // wallet form
  walletHolderName: string;
  walletHolderNamePlaceholder: string;
  walletAddressInvalid: string;
  walletHolderRequired: string;
  // deposit orders
  noDeposits: string;
  depositOrders: string;
  depositHistory: string;
  depositLabel: string;
  // members page
  membersTitle: string;
  membersLevel: string;
  membersTotalMembers: string;
  membersBonusReceived: string;
  membersNoneAtLevel: string;
  membersInviteFriends: string;
  membersBonus: string;
  // salary-bonus / task center page
  salaryPageTitle: string;
  salaryRewardLabel: string;
  salaryActiveMembers: string;
  salaryActiveMemberDef: string;
  salaryUnlocked: string;
  salaryClaimed: string;
  salaryMissing: string;
  salaryTotalRewards: string;
  salaryTotalPeople: string;
  salaryInviteDesc: string;
  salaryCurrent: string;
  salaryTarget: string;
  salaryProgress: string;
  salaryClaim: string;
  salaryInProgress: string;
  // tasks page toasts
  tasksRewardClaimed: string;
  tasksRewardClaimedDesc: string;
  tasksTierFallback: string;
  taskPageTitle: string;
  taskRewardTitle: string;
  taskRewardNote: string;
  taskValidInvitation: string;
  taskRewardLabel: string;
  taskReceived: string;
  // my-products page
  myProductsTitle: string;
  myProductsDevice: string;
  myProductsEarnings: string;
  myProductsSettledEvery24h: string;
  myProductsNone: string;
  myProductsNoneDesc: string;
  myProductsDailyRevenue: string;
  myProductsEarned: string;
  myProductsDuration: string;
  myProductsDays: string;
  myProductsProgress: string;
  myProductsRevenueReceived: string;
  myProductsPending: string;
  myProductsCollect: string;
  myProductsNextCollection: string;
  // rewards / gains page
  rewardsTitle: string;
  rewardsSubtitle: string;
  rewardsTaskList: string;
  rewardsRewardLabel: string;
  rewardsClaimed: string;
  rewardsClaim: string;
  rewardsReceived: string;
  rewardsSuccessTitle: string;
  rewardsSuccessDesc: string;
  // account balance labels
  accountBalanceLabel: string;
  revenueLabel: string;
  // deposit page
  depositAmount: string;
  depositMinimum: string;
  depositSelectNetwork: string;
  depositRechargeNow: string;
  depositNetworkTip: string;
  depositAddressTitle: string;
  depositExactAmount: string;
  depositGenerating: string;
  depositCopied: string;
  depositCopy: string;
  depositDone: string;
  depositDoneDesc: string;
  depositSecurity: string;
  depositSec1: string;
  depositSec3: string;
  depositCopiedToast: string;
  depositCopiedDesc: string;
  depositCopyFail: string;
  depositCopyFailDesc: string;
  depositCreateFail: string;
  depositModify: string;
  depositDefaultHelp: string;
  // home popup buttons
  popupOk: string;
  popupJoinGroup: string;
  // team page
  teamTitle: string;
  teamInviteSection: string;
  teamInviteCode: string;
  teamInviteLink: string;
  teamCopy: string;
  teamCodeCopied: string;
  teamLinkCopied: string;
  teamDepositsLabel: string;
  teamWithdrawalsLabel: string;
  teamLevel1: string;
  teamLevel2: string;
  teamLevel3: string;
  teamRechargeAmount: string;
  teamTotalCount: string;
  teamCommissionRate: string;
  teamViewAll: string;
  // tasks page
  taskTierBronze: string;
  taskTierSilver: string;
  taskTierGold: string;
  taskTierPlatinum: string;
  taskTierDiamond: string;
  taskTierElite: string;
  taskEarned: string;
  taskCompleted: string;
  taskClaimable: string;
  taskInviteDesc: string;
  taskDone: string;
  taskClaim: string;
  taskWaiting: string;
  taskNone: string;
  // orders page
  ordersOngoing: string;
  ordersCompleted: string;
  ordersNone: string;
  ordersStatusActive: string;
  ordersStatusDone: string;
  ordersDailyLbl: string;
  ordersCycleLbl: string;
  ordersDaysLbl: string;
  ordersRemainingLbl: string;
  ordersTotalEarnedLbl: string;
  ordersDateLbl: string;
  // invest page
  investConfirmDesc: string;
  investCycleDays: string;
  investInsufficient: string;
  investOnePerDay: string;
  // withdraw modal
  withdrawTitle: string;
  withdrawMinFee: string;
  withdrawNotAvailable: string;
  withdrawNeedDeposit: string;
  withdrawNeedProduct: string;
  withdrawNeedWallet: string;
  withdrawBlocked: string;
  withdrawMustInvite: string;
  withdrawAdminDisabled: string;
  withdrawWalletLabel: string;
  withdrawAvailableBalance: string;
  withdrawAmountLabel: string;
  withdrawMinPlaceholder: string;
  withdrawAmountRow: string;
  withdrawNetAmount: string;
  withdrawSubmitBtn: string;
  withdrawSuccess: string;
  withdrawSuccessDesc: string;
  // wallet modal
  walletTitle: string;
  walletDefault: string;
  walletNone: string;
  walletNameLabel: string;
  walletAddressLabel: string;
  walletNamePlaceholder: string;
  walletOnlyMethod: string;
  walletAddBtn: string;
  walletAdded: string;
  walletDeleted: string;
  walletDefaultUpdated: string;
  walletAddLabel: string;
  // service page
  serviceCustomerServiceFallback: string;
  serviceCustomerService2Fallback: string;
  serviceOfficialChannelFallback: string;
  serviceDiscussionGroupFallback: string;
  // deposit modal
  depositPaymentInfo: string;
  depositSubmitted: string;
  depositSubmittedDesc: string;
  depositCustomAmountPlaceholder: string;
  depositContinueBtn: string;
  depositChannelLabel: string;
  depositSelectChannel: string;
  depositAccountNameLabel: string;
  depositAccountNumberLabel: string;
  depositAccountNumberPlaceholder: string;
  depositPaymentMethodLabel: string;
  depositSelectOption: string;
  depositSubmitPayment: string;
  depositAmountLbl: string;
  depositMinDesc: string;
  // transaction history modal
  transactionHistoryTitle: string;
  transactionNetAmountLabel: string;
  // service modal
  serviceTitle: string;
  serviceOnlineConsult: string;
  serviceHoursLabel: string;
  serviceOnlineNow: string;
  serviceOfflineNow: string;
  serviceAnnouncements: string;
  serviceCommunity: string;
  // home
  // deposit-callback page
  depositSuccessTitle: string;
  depositSuccessDesc: string;
  depositRefLabel: string;
  depositViewHistory: string;
  depositGoHome: string;
  depositFailTitle: string;
  depositFailDesc: string;
  depositRetry: string;
  depositPendingTitle: string;
  depositPendingDesc: string;
  depositContactSupport: string;
  depositVerifyingTitle: string;
  depositVerifyingDesc: string;
  // withdrawal page
  withdrawalEarningsBalance: string;
  withdrawalAddressLabel: string;
  withdrawalSelectBep20: string;
  withdrawalAddWallet: string;
  withdrawalAmountPlaceholder: string;
  withdrawalNetAmountLabel: string;
  withdrawalMinimumNote: string;
  withdrawalSubmitting: string;
  // checkin
  checkinBtn: string;
  checkinComeBack: string;
  checkinHeading: string;
  checkinCalendarTitle: string;
  checkinPreviousMonth: string;
  checkinNextMonth: string;
  checkinDayClaimed: string;
  checkinDayNotClaimed: string;
  // account
  pinMinLength: string;
  // about modal
  aboutTitle: string;
  aboutDesc1: string;
  aboutDesc2: string;
  aboutSpecialties: string;
  aboutSpec1: string;
  aboutSpec2: string;
  aboutSpec3: string;
  aboutSpec4: string;
  aboutVersion: string;
  // products
  productNeedMore: string;
  // task center
  taskCenterTitle: string;
  // news
  articleNotFound: string;
  // spin wheel page
  wheelTitle: string;
  wheelMyAccount: string;
  wheelTotalRewardsLabel: string;
  wheelSpinsLeft: string;
  wheelNoSpins: string;
  wheelCongrats: string;
  wheelWonDesc: string;
  wheelResultWinTitle: string;
  wheelResultWinMessage: string;
  wheelResultLossTitle: string;
  wheelResultLossMessage: string;
  wheelResultNoSpinsTitle: string;
  wheelResultNoSpinsMessage: string;
  wheelResultConfirm: string;
  wheelErrUnavailable: string;
  wheelRulesBtn: string;
  wheelSaveBtn: string;
  wheelTickerWon: string;
  wheelTickerWonGrandPrize: string;
  wheelTickerWonSpecialBonus: string;
  wheelSegmentUnavailable: string;
  wheelCopyMyLink: string;
  wheelLinkCopied: string;
  wheelLinkCopyError: string;
  // wheel rules modal
  wheelRulesTitle: string;
  wheelRulesHowToGet: string;
  wheelRulesBuyGet: string;
  wheelRulesReferralGet: string;
  wheelRulesHowToPlay: string;
  wheelRulesHowToPlayDesc: string;
  wheelRulesSpinOnce: string;
  wheelRulesRewards: string;
  wheelRulesGainCredit: string;
  wheelRulesTokenNote: string;
  // wheel history modal
  wheelHistoryTitle: string;
  wheelHistoryEmpty: string;
  wheelHistoryNoGain: string;
  // history page
  historyTitle: string;
  historyTabDeposit: string;
  historyTabWithdrawal: string;
  withdrawalLabel: string;
  statusProcessing: string;
  status2FA: string;
  statusFailed: string;
  levelLabel: string;
  registeredOn: string;
  amountLabel: string;
  methodLabel: string;
  checkinBonusTitle: string;
  checkinBonusDesc: string;
  // banker page
  bankerTitle: string;
  bankerPendingDepositsLabel: string;
  bankerPendingWithdrawalsLabel: string;
  bankerDepositApproved: string;
  bankerDepositRejected: string;
  bankerWithdrawalApproved: string;
  bankerWithdrawalRejectedRefunded: string;
  bankerAll: string;
  bankerDepositsTab: string;
  bankerWithdrawalsTab: string;
  bankerHistoryTab: string;
  bankerNoHistory: string;
  depositProcessed: string;
  withdrawalProcessed: string;
  comingSoon: string;
  withdrawalCreated: string;
  withdrawalSubmitted: string;
  withdrawalCreatedDesc: string;
  withdrawalSubmittedDesc: string;
  searchPlaceholder: string;
  // wallet page extras
  walletAddCard: string;
  walletAddMethod: string;
  walletWithdrawalMethod: string;
  teamMembersLabel: string;
  statusLabel: string;
  dateLabel: string;
  notFoundTitle: string;
  notFoundDesc: string;
  searchCountryPlaceholder: string;
  incorrectPin: string;
  // team-details page
  teamHistoryTitle: string;
  teamMemberAccount: string;
  teamMemberDate: string;
  // gift-code page
  giftCodeLabel: string;
  giftCodeInputPlaceholder: string;
  giftCodeReceiveBtn: string;
  // wheel history extras
  wheelFirstSpinHint: string;
  wheelWinnersCount: string;
  wheelHistoryDividerLabel: string;
  // admin tab labels
  adminTabDashboard: string;
  adminTabDeposits: string;
  adminTabWithdrawals: string;
  adminTabUsers: string;
  adminTabProducts: string;
  adminTabNumbers: string;
  adminTabCountries: string;
  adminTabGiftCodes: string;
  adminTabSettings: string;
  adminTabTasks: string;
  adminTabWheel: string;
  adminTabContent: string;
  // ─── Team / Admin extended ─────────────────────────────────────────────────
  teamRegisteredOn: string;
  teamActiveProduct: string;
  teamDeposited: string;
  teamTotalInvested: string;
  teamPurchasedProducts: string;
  teamActiveStatus: string;
  teamEndedStatus: string;
  teamNoProductPurchased: string;
  teamLevel: string;
  teamMember: string;
  teamTotalTeamInvested: string;
  teamLevelShort: string;
  teamNoLevel1: string;
  teamNoLevel2: string;
  teamNoLevel3: string;
  teamUserNotFound: string;
  teamTeamOf: string;
  adminCancel: string;
  adminSave: string;
  adminCreate: string;
  adminConfirmDelete: string;
  adminSearchByPhoneOrName: string;
  adminSearchDeposit: string;
  adminChannelName: string;
  adminRedirectUrl: string;
  adminApiPayment: string;
  adminNoChannel: string;
  adminEditChannel: string;
  adminNewChannel: string;
  adminAutoMode: string;
  adminManualMode: string;
  adminManualModeActivated: string;
  adminAutoModeActivated: string;
  adminManualModeLabel: string;
  adminAutoModeLabel: string;
  adminManualModeDesc: string;
  adminAutoModeDesc: string;
  adminNoWithdrawals: string;
  adminManualPayment: string;
  adminUserActive: string;
  adminUserDeposited: string;
  adminUserTeamTitle: string;
  adminUserRegisteredOn: string;
  adminUserNotProvided: string;
  adminUserTransactionPwd: string;
  adminUserInvitedBy: string;
  adminUserReferralCode: string;
  adminEditBalance: string;
  adminNewBalance: string;
  adminEditEarnings: string;
  adminNewEarnings: string;
  adminResetPasswordLabel: string;
  adminNewPassword: string;
  adminAssignProduct: string;
  adminChooseProduct: string;
  adminUserProductsLabel: string;
  adminNoProduct: string;
  adminPinCode: string;
  adminTaskName: string;
  adminTaskNamePlaceholder: string;
  adminTaskDescriptionLabel: string;
  adminTaskDescriptionPlaceholder: string;
  adminTaskRequiredInvites: string;
  adminTaskReward: string;
  adminTaskSortOrder: string;
  adminTaskNew: string;
  adminTaskEdit: string;
  adminTaskActive: string;
  adminTaskInactive: string;
  adminTaskCreated: string;
  adminTaskUpdated: string;
  adminTaskDeleted: string;
  adminTaskDeleteWarning: string;
  adminTaskDelete: string;
  adminNoTasks: string;
  adminTaskCenterTitle: string;
  adminTaskCenterDesc: string;
  // Admin: channel toasts
  adminChannelCreated: string;
  adminChannelUpdated: string;
  adminChannelDeleted: string;
  // Admin: countries
  adminCountriesTitle: string;
  adminAddCountry: string;
  adminEditCountry: string;
  adminDeleteCountryTitle: string;
  adminCountryIrreversible: string;
  adminCountryActiveLabel: string;
  adminCountryCodeLabel: string;
  adminCountryCurrencyLabel: string;
  adminCountryNameLabel: string;
  adminCountryPhoneLabel: string;
  adminCountryOperatorsLabel: string;
  adminCountryOperatorsHint: string;
  adminCountryPhoneDisplay: string;
  adminCountryUpdated: string;
  adminCountryAdded: string;
  adminCountryDeleted: string;
  adminNoCountries: string;
  // Admin: content editor
  adminContentDesc: string;
  adminContentSaved: string;
  adminContentSave: string;
  // Admin: wheel
  adminWheelTitle: string;
  adminWheelDesc: string;
  adminWheelSection: string;
  adminWheelCanWin: string;
  adminWheelCannotWin: string;
  adminWheelDisplayName: string;
  adminWheelDisplayNamePlaceholder: string;
  adminWheelAmount: string;
  adminWheelColor: string;
  adminWheelWarning: string;
  adminWheelSave: string;
  adminWheelSaved: string;
  adminWheelSaveError: string;
  // Admin: withdrawals extra
  adminWithdrawalAutoBtn: string;
  adminWithdrawalManualBtn: string;
  adminWithdrawalSearchPlaceholder: string;
  adminWithdrawal2FA: string;
  adminWithdrawal2FALabel: string;
  adminWithdrawal2FAFailed: string;
  adminWithdrawal2FAValidated: string;
  adminWithdrawal2FAProcessing: string;
  adminWithdrawalPayoutId: string;
  adminWithdrawalNowPaymentsId: string;
  adminWithdrawalNowPaymentsValidated: string;
  adminWithdrawalNowPaymentsValidatedDesc: string;
  adminWithdrawalNowPaymentsFailed: string;
  adminWithdrawalServerError: string;
  adminWithdrawalAt: string;
  // Admin: settings
  adminSettingsSaved: string;
  adminSettingsGoOnline: string;
  adminSettingsGoOffline: string;
  adminSettingsMaintenanceMode: string;
  adminSettingsMaintenanceActive: string;
  adminSettingsRunning: string;
  // Admin action labels used in deposits/withdrawals/banker panels
  approve: string;
  reject: string;
  rejectAndBan: string;
  amount: string;
  operator: string;
  payerNumber: string;
  date: string;
  recipientNumber: string;
  reference: string;
  paymentMessageReceived: string;
  screenshot: string;
  grossAmount: string;
  netAmount: string;
  fees: string;
  method: string;
  bep20Address: string;
  dateTime: string;
  enter2FACode: string;
  promoter: string;
  channel: string;
  beneficiary: string;
  country: string;
};

const fr: Translations = {
    yourNumber:         "votre numéro",
    yourPassword:       "votre mot de passe",
    rememberMe:         "se souvenir de moi",
    loginBtn:           "Se connecter",
    loginLoading:       "Connexion...",
    noAccount:          "Je n'ai pas de compte.",
    createAccount:      "Créer un compte",
    registerBtn:        "S'inscrire",
    registerLoading:    "Inscription...",
    repeatPassword:     "répéter le mot de passe",
    referralCode:       "code de parrainage",
    terms:              "En cochant cette case, vous acceptez les Conditions Générales d'Utilisation de DIAMANT",
    errInvalidPhone:    "Numéro de téléphone invalide",
    errPasswordRequired:"Le mot de passe est requis",
    errMinPassword:     "Au moins 6 caractères",
    errConfirmPassword: "Confirmez le mot de passe",
    errPasswordMismatch:"Les mots de passe ne correspondent pas",
    errTransactionPasswordRequired: "Le mot de passe de transaction est obligatoire",
    errInvitationCodeRequired: "Le code d'invitation est obligatoire",
    errTelegramRequired: "Le compte Telegram est obligatoire",
    errTelegramFormat: "Le compte Telegram doit commencer par @",
    errTermsRequired:   "Veuillez accepter les conditions d'utilisation",
    errLoginFailed:     "Vérifiez vos informations",
    errRegisterFailed:  "Une erreur est survenue",
    successRegister:    "Inscription réussie !",
    welcomeMsg:         "Bienvenue sur DIAMANT !",
    languageLabel:      "Langue",
    selectCountry:      "Sélectionnez un pays",
    authPhoneLabel:     "Téléphone",
    authPasswordLabel:  "Mot de passe",
    authPinLabel:       "Code PIN de sécurité",
    authCaptchaLabel:   "Code",
    authCaptchaRequired:"Saisissez le code affiché",
    authNoAccountPrompt:"Pas de compte ?",
    authHasAccountPrompt:"Vous avez un compte ?",
    authHome:           "Maison",
    authRememberMe:     "Souviens-toi de moi",
    phonePlaceholder:   "Veuillez saisir votre numéro de téléphone",
    passwordPlaceholder:"Veuillez saisir votre mot de passe",
    confirmPasswordPlaceholder: "Veuillez confirmer votre mot de passe",
    transactionPasswordPlaceholder: "Veuillez saisir votre mot de passe de transaction",
    invitationCodePlaceholder: "Veuillez saisir le code d'invitation",
    telegramPlaceholder:"Telegram",
    rememberPassword:   "Mémoriser le mot de passe",
    loginImmediately:   "Se connecter",
    registerNow:        "S'inscrire maintenant",
    noAccountRegister:  "Pas de compte ? S'inscrire",
    alreadyHaveAccountLogin: "Déjà un compte ? Se connecter",
    home:               "Accueil",
    products:           "Produits",
    earnings:           "Gains",
    team:               "Équipe",
    me:                 "Moi",
    deposit:            "Recharger",
    withdraw:           "Retirer",
    customerService:    "Service client",
    shareInformation:   "Partager les informations",
    informationCenter:  "Centre d'information",
    previous:           "Précédent",
    next:               "Suivant",
    notification:       "Notification",
    loading:            "Chargement...",
    noProducts:         "Aucun produit disponible",
    price:              "Prix",
    dailyRevenue:       "Revenu quotidien",
    totalRevenue:       "Revenu total",
    duration:           "Durée",
    period:             "Période",
    buy:                "Acheter",
    purchased:          "Acheté",
    purchaseSuccess:    "Produit acheté !",
    purchaseSuccessDescription: "Vos gains sont crédités automatiquement sur votre solde de gains à la fin du cycle. Aucune collecte manuelle n'est nécessaire.",
    errorOccurred:      "Une erreur est survenue",
    accountBalance:     "Solde du compte",
    revenue:            "Revenus",
    adminPanel:         "Panel Admin",
    adminAccessCode:    "Code d'accès administrateur",
    adminPinHint:       "Entrez votre code PIN pour accéder au panel administrateur",
    pinPlaceholder:     "Code PIN",
    confirm:            "Confirmer",
    cancel:             "Annuler",
    history:            "Historique",
    security:           "Sécurité",
    redeem:             "Échanger",
    about:              "À propos",
    wallet:             "Portefeuille",
    commonFunctions:    "Fonctions communes",
    logout:             "Déconnexion",
    accountSuspended:   "Compte suspendu",
    accountSuspendedDesc: "Votre compte a été suspendu. Contactez le support.",
    back:               "Retour",
    changePassword:     "Changer le mot de passe",
    oldPassword:        "Ancien mot de passe",
    newPassword:        "Nouveau mot de passe",
    confirmNewPassword: "Re-mot de passe",
    saving:             "Enregistrement...",
    processing:         "Modification...",
    requiredFields:     "Champs requis",
    fillAllFields:      "Veuillez remplir tous les champs",
    passwordTooShort:   "Mot de passe trop court",
    minSixCharsRequired:"Minimum 6 caractères requis",
    passwordSuccess:    "Succès",
    passwordSuccessDesc:"Mot de passe modifié avec succès",
    currentPasswordPlaceholder: "Mot de passe actuel",
    newPasswordPlaceholder:     "Nouveau mot de passe",
    confirmNewPasswordPlaceholder: "Confirmer le nouveau mot de passe",
    noWithdrawals:      "Aucun retrait pour le moment",
    noTransactions:     "Aucune transaction pour le moment",
    withdrawalHistory:  "Historique des retraits",
    statusApproved:     "SUCCÈS",
    statusPending:      "EN ATTENTE",
    statusRejected:     "REFUSÉ",
    invalidAmount:      "Montant invalide",
    minAmountPrefix:    "Le montant minimum est de",
    addressRequired:    "Adresse requise",
    selectUsdtWallet:   "Veuillez sélectionner une adresse USDT BEP20",
    walletHolderName:   "Nom du titulaire",
    walletHolderNamePlaceholder: "Entrez le nom du titulaire",
    walletAddressInvalid: "Adresse BEP20 invalide (format 0x + 40 caractères)",
    walletHolderRequired: "Nom du titulaire requis",
    noDeposits:         "Aucun dépôt pour le moment",
    depositOrders:      "Ordre du dépôt",
    depositHistory:     "Historique des dépôts",
    depositLabel:       "DÉPÔT",
    depositAmount:      "Montant de la recharge",
    depositMinimum:     "Minimum",
    depositSelectNetwork: "Sélectionnez le réseau de paiement",
    depositRechargeNow: "Rechargez maintenant",
    depositNetworkTip:  "Choisissez ensuite le réseau exact utilisé par votre portefeuille avant d'envoyer les fonds.",
    depositAddressTitle:"Adresse de dépôt",
    depositExactAmount: "Montant exact à envoyer",
    depositGenerating:  "Génération de votre adresse…",
    depositCopied:      "Copié",
    depositCopy:        "Copier",
    depositDone:        "Dépôt effectué",
    depositDoneDesc:    "Votre dépôt sera crédité après confirmation du paiement.",
    depositSecurity:    "Instructions de sécurité",
    depositSec1:        "1. Copiez l'adresse ci-dessus ou scannez le QR code.",
    depositSec3:        "3. Le solde sera crédité après la confirmation de la transaction par le réseau.",
    depositCopiedToast: "Adresse copiée",
    depositCopiedDesc:  "L'adresse de dépôt est dans votre presse-papiers.",
    depositCopyFail:    "Copie impossible",
    depositCopyFailDesc:"Maintenez l'adresse appuyée pour la copier.",
    depositCreateFail:  "Impossible de créer le dépôt",
    depositModify:      "Modifier",
    depositDefaultHelp: "Envoyez uniquement la devise et le réseau sélectionnés vers l'adresse affichée. Un mauvais réseau peut entraîner la perte des fonds.",
    popupOk:            "OK",
    popupJoinGroup:     "Rejoindre le groupe Telegram >",
    teamTitle:          "Équipe",
    teamInviteSection:  "Code et lien d'invitation",
    teamInviteCode:     "Code d'invitation :",
    teamInviteLink:     "Lien d'invitation :",
    teamCopy:           "Copier",
    teamCodeCopied:     "Code d'invitation copié !",
    teamLinkCopied:     "Lien copié !",
    teamDepositsLabel:  "Total recharges équipe",
    teamWithdrawalsLabel:"Total retraits équipe",
    teamLevel1:         "Équipe Niveau 1",
    teamLevel2:         "Équipe Niveau 2",
    teamLevel3:         "Équipe Niveau 3",
    teamRechargeAmount: "Montant rechargé",
    teamTotalCount:     "Total membres",
    teamCommissionRate: "Taux de commission",
    teamViewAll:        "Voir tous les membres",
    taskTierBronze:     "Référence Bronze",
    taskTierSilver:     "Référence Argent",
    taskTierGold:       "Référence Or",
    taskTierPlatinum:   "Référence Platine",
    taskTierDiamond:    "Référence Diamant",
    taskTierElite:      "Référence Élite",
    taskEarned:         "Gagné",
    taskCompleted:      "Terminé",
    taskClaimable:      "À réclamer",
    taskInviteDesc:     "Inviter {0} personnes ayant rechargé",
    taskDone:           "✓ Terminé",
    taskClaim:          "Réclamer",
    taskWaiting:        "En attente",
    taskNone:           "Aucune tâche disponible",
    ordersOngoing:      "Actifs",
    ordersCompleted:    "Terminés",
    ordersNone:         "Aucun produit dans cette catégorie",
    ordersStatusActive: "Actif",
    ordersStatusDone:   "Terminé",
    ordersDailyLbl:     "Revenus quotidiens",
    ordersCycleLbl:     "Cycle",
    ordersDaysLbl:      "jours",
    ordersRemainingLbl: "Jours restants",
    ordersTotalEarnedLbl:"Gains cumulés",
    ordersDateLbl:      "Date",
    investConfirmDesc:  "Après l'achat, vos gains sont crédités automatiquement sur votre solde de gains à la fin du cycle. Aucune collecte manuelle n'est nécessaire.",
    investCycleDays:    "Cycle valide",
    investInsufficient: "Solde insuffisant, il manque {0}.",
    investOnePerDay:    "Une seule commande par personne par jour.",
    withdrawTitle:      "Retrait",
    withdrawMinFee:     "Montant minimum : {0} XOF",
    withdrawNotAvailable:"Retrait temporairement indisponible",
    withdrawNeedDeposit:"Veuillez d'abord recharger",
    withdrawNeedProduct:"Veuillez d'abord acheter un produit",
    withdrawNeedWallet: "Veuillez enregistrer un portefeuille",
    withdrawBlocked:    "Votre fonction de retrait a été bloquée",
    withdrawMustInvite: "Veuillez inviter un utilisateur à investir",
    withdrawAdminDisabled:"L'administrateur a désactivé les retraits",
    withdrawWalletLabel:"Portefeuille de retrait",
    withdrawAvailableBalance:"Solde disponible",
    withdrawAmountLabel:"Montant du retrait",
    withdrawMinPlaceholder:"Minimum {0}",
    withdrawAmountRow:  "Montant",
    withdrawNetAmount:  "Montant reçu",
    withdrawSubmitBtn:  "Demander retrait",
    withdrawSuccess:    "Demande de retrait soumise !",
    withdrawSuccessDesc:"Votre retrait est en cours de traitement.",
    walletTitle:        "Gestion du portefeuille",
    walletDefault:      "Défaut",
    walletNone:         "Aucun portefeuille enregistré",
    walletNameLabel:    "Nom du compte",
    walletAddressLabel: "Adresse BEP20",
    walletNamePlaceholder:"Entrez votre nom",
    walletOnlyMethod:   "Méthode unique",
    walletAddBtn:       "Ajouter un portefeuille",
    walletAdded:        "Portefeuille ajouté !",
    walletDeleted:      "Portefeuille supprimé !",
    walletDefaultUpdated:"Portefeuille par défaut mis à jour !",
    walletAddLabel:     "Ajouter",
    serviceCustomerServiceFallback: "Service client",
    serviceCustomerService2Fallback:"Service client 2",
    serviceOfficialChannelFallback: "Chaîne officielle",
    serviceDiscussionGroupFallback: "Groupe de discussion",
    membersTitle:        "Mes Membres",
    membersLevel:        "Niveau",
    membersTotalMembers: "Total membres",
    membersBonusReceived:"Bonus reçus",
    membersNoneAtLevel:  "Aucun membre au niveau {0}",
    membersInviteFriends:"Invitez des amis pour agrandir votre équipe",
    membersBonus:        "Bonus",
    salaryPageTitle:        "Récompenses de parrainage",
    salaryRewardLabel:      "Récompense",
    salaryActiveMembers:    "Membres actifs",
    salaryActiveMemberDef:  "Filleul direct ayant acheté au minimum VIP 1",
    salaryUnlocked:         "Débloquée",
    salaryClaimed:          "Réclamée ✓",
    salaryMissing:          "Il vous manque {0} membres actifs",
    salaryTotalRewards: "Total des récompenses",
    salaryTotalPeople:  "Total de personnes",
    salaryInviteDesc:   "Invitez {0} investisseurs de niveau 1 pour obtenir :",
    salaryCurrent:      "Actuel",
    salaryTarget:       "Objectif",
    salaryProgress:     "Progression",
    salaryClaim:        "Réclamer",
    salaryInProgress:   "En cours",
    tasksRewardClaimed: "Récompense réclamée !",
    tasksRewardClaimedDesc: "Le bonus a été ajouté à votre compte.",
    tasksTierFallback:  "Palier",
     taskPageTitle:       "Tâche",
     taskRewardTitle:     "Récompense de tâche",
     taskRewardNote:      "Remarque : votre ami doit acheter au moins un vélo pour être une invitation valide.",
     taskValidInvitation: "invitation valide",
     taskRewardLabel:     "Récompense",
     taskReceived:        "Reçu",
    myProductsTitle:    "Mes Produits",
    myProductsDevice:   "Mon appareil",
    myProductsEarnings: "Mes revenus",
     myProductsSettledEvery24h: "⏱️ Vos gains sont crédités automatiquement sur votre solde de gains à la fin du cycle.",
    myProductsNone:     "Aucun produit DIAMANT",
    myProductsNoneDesc: "Achetez des produits pour commencer à gagner",
    myProductsDailyRevenue: "Revenu/jour",
    myProductsEarned:   "Gagné",
    myProductsDuration: "Durée",
    myProductsDays:     "jours",
    myProductsProgress: "Progression",
    myProductsRevenueReceived: "Gains cumulés",
     myProductsPending: "Gains en attente de fin de cycle",
     myProductsCollect: "Crédit automatique",
     myProductsNextCollection: "Crédit à la fin du cycle",
    rewardsTitle:       "Recevoir",
    rewardsSubtitle:    "Remplissez ces tâches pour obtenir {0} {1}",
    rewardsTaskList:    "Liste des tâches",
    rewardsRewardLabel: "Récompense",
    rewardsClaimed:     "Complet",
    rewardsClaim:       "Recevoir",
    rewardsReceived:    "Reçu",
    rewardsSuccessTitle:"Félicitations",
    rewardsSuccessDesc: "Récompense reçue avec succès !",
    accountBalanceLabel:"Solde du compte",
    revenueLabel:       "Revenus",
    depositPaymentInfo: "Informations de paiement",
    depositSubmitted:   "Recharge soumise !",
    depositSubmittedDesc: "Votre recharge est en attente de validation.",
    depositCustomAmountPlaceholder: "Montant personnalisé",
    depositContinueBtn: "Continuer",
    depositChannelLabel: "Canal de recharge",
    depositSelectChannel: "Choisir un canal",
    depositAccountNameLabel: "Nom du compte de paiement",
    depositAccountNumberLabel: "Numéro de paiement",
    depositAccountNumberPlaceholder: "Entrez le numéro",
    depositPaymentMethodLabel: "Mode de paiement",
    depositSelectOption: "Sélectionner",
    depositSubmitPayment: "Soumettre le paiement",
    depositAmountLbl:   "Montant",
    depositMinDesc:     "Montant minimum :",
    transactionHistoryTitle: "Historique des transactions",
    transactionNetAmountLabel: "Reçu :",
    serviceTitle:       "Service client",
    serviceOnlineConsult: "Consultation en ligne",
    serviceHoursLabel:  "Horaires du service client",
    serviceOnlineNow:   "En ligne maintenant",
    serviceOfflineNow:  "Hors ligne actuellement",
    serviceAnnouncements: "Annonces et actualités",
    serviceCommunity:   "Échanger avec les membres",
    depositSuccessTitle: "Recharge réussie !",
    depositSuccessDesc: "Votre solde a bien été crédité.",
    depositRefLabel:    "Référence :",
    depositViewHistory: "Voir l'historique des recharges",
    depositGoHome:      "Retour à l'accueil",
    depositFailTitle:   "Paiement échoué",
    depositFailDesc:    "Votre paiement n'a pas pu être traité. Aucun montant n'a été débité.",
    depositRetry:       "Réessayer",
    depositPendingTitle: "En attente de confirmation",
    depositPendingDesc: "Votre paiement est en cours de traitement. Si votre solde n'est pas crédité dans 10 minutes, contactez le support avec votre numéro de référence.",
    depositContactSupport: "Contacter le support",
    depositVerifyingTitle: "Vérification en cours…",
    depositVerifyingDesc: "Confirmation de votre paiement en cours, veuillez patienter.",
    withdrawalEarningsBalance: "Solde des gains",
    withdrawalAddressLabel: "Adresse de retrait",
    withdrawalSelectBep20: "Sélectionner une adresse BEP20",
    withdrawalAddWallet: "Ajouter un portefeuille de retrait",
    withdrawalAmountPlaceholder: "Entrez le montant du retrait",
    withdrawalNetAmountLabel: "Montant reçu :",
    withdrawalMinimumNote: "(Min. {0} {1})",
    withdrawalSubmitting: "Envoi en cours...",
    checkinBtn:         "Pointer",
    checkinComeBack:    "Revenez dans {0} heures",
    checkinHeading: "Connexion quotidienne",
    checkinCalendarTitle: "Calendrier du mois",
    checkinPreviousMonth: "Mois précédent",
    checkinNextMonth: "Mois suivant",
    checkinDayClaimed: "Pointage validé",
    checkinDayNotClaimed: "Aucun pointage",
    pinMinLength:       "Entrez au moins 4 caractères pour le PIN",
    aboutTitle:         "À propos de DIAMANT",
    aboutDesc1:         "DIAMANT est une entreprise technologique engagée dans les solutions énergétiques et les infrastructures électriques intelligentes.",
    aboutDesc2:         "Notre mission : offrir des opportunités d'investissement accessibles et transparentes à tous, avec un support disponible 7j/7.",
    aboutSpecialties:   "Ce que nous offrons :",
    aboutSpec1:         "- Revenus quotidiens automatiques",
    aboutSpec2:         "- Retraits en USDT BEP20",
    aboutSpec3:         "- Programme de parrainage rémunérateur",
    aboutSpec4:         "- Support client disponible 7j/7",
    aboutVersion:       "Version 1.0.0 - Tous droits réservés",
    productNeedMore:    "Il manque {0} pour acheter ce produit.",
    taskCenterTitle:    "Centre de tâches",
    articleNotFound:    "Article introuvable",
    wheelTitle:         "Tirage Au Sort",
    wheelMyAccount:     "Mon Compte",
    wheelTotalRewardsLabel: "Récompenses Totales :",
    wheelSpinsLeft:     "Tours restants : {0}",
    wheelNoSpins:       "Aucun tour disponible",
    wheelCongrats:      "🎉 Félicitations !",
    wheelWonDesc:       "Vous avez gagné : {0} XOF",
    wheelResultWinTitle:   "Félicitations, vous avez gagné !",
    wheelResultWinMessage: "Vous avez remporté {0}. Le gain a été crédité automatiquement sur votre solde des gains.",
    wheelResultLossTitle:  "Pas de gain cette fois",
    wheelResultLossMessage:"Votre tour a été utilisé, mais vous n'avez remporté aucun gain. Vous pourrez rejouer avec un prochain tour.",
    wheelResultNoSpinsTitle:   "Aucun tour disponible",
    wheelResultNoSpinsMessage: "Vous n'avez aucun tour à jouer. Achetez un produit payant ou faites acheter un produit par un filleul pour recevoir de nouveaux tours.",
    wheelResultConfirm:    "Fermer",
    wheelErrUnavailable:"Le tirage est indisponible",
    wheelRulesBtn:      "Règles",
    wheelSaveBtn:       "Historique",
    wheelTickerWon:             "{0} a gagné {1} XOF",
    wheelTickerWonGrandPrize:   "{0} a gagné le grand prix",
    wheelTickerWonSpecialBonus: "{0} a gagné un bonus spécial",
    wheelSegmentUnavailable:    "indisponible",
    wheelCopyMyLink:            "Copier mon lien",
    wheelLinkCopied:            "Lien de parrainage copié.",
    wheelLinkCopyError:         "Impossible de copier le lien. Veuillez réessayer.",
    wheelRulesTitle:    "Règles du Tirage",
    wheelRulesHowToGet: "Comment obtenir des tours",
    wheelRulesBuyGet:   "Achetez un produit payant → 3 tours crédités immédiatement",
    wheelRulesReferralGet: "Un filleul achète un produit payant → 2 tours crédités sur votre compte",
    wheelRulesHowToPlay:"Comment jouer",
    wheelRulesHowToPlayDesc: "Appuyez sur la roue pour lancer le tirage",
    wheelRulesSpinOnce: "1 tour consommé par tirage",
    wheelRulesRewards:  "Les gains",
    wheelRulesGainCredit: "Chaque gain est crédité sur votre solde de retrait",
    wheelRulesTokenNote: "Vos tours ne expirent jamais",
    wheelHistoryTitle:  "Historique des tirages",
    wheelHistoryEmpty:  "Aucun tirage pour le moment",
    wheelHistoryNoGain: "Pas de gain",
    historyTitle:       "Détails",
    historyTabDeposit:  "Recharger",
    historyTabWithdrawal: "Retirer",
    withdrawalLabel:    "RETRAIT",
    statusProcessing:   "En cours",
    status2FA:          "En cours de traitement",
    statusFailed:       "Échoué — remboursé",
    levelLabel:         "Niveau",
    registeredOn:       "Inscrit le",
    amountLabel:        "Montant",
    methodLabel:        "Méthode",
    checkinBonusTitle:  "Félicitations !",
    checkinBonusDesc:   "Vous avez reçu {0}. Cette récompense a été ajoutée à votre solde des gains.",
    bankerTitle:            "Espace Bankier",
    bankerPendingDepositsLabel: "Dépôts en attente",
    bankerPendingWithdrawalsLabel: "Retraits en attente",
    bankerDepositApproved:  "Dépôt validé !",
    bankerDepositRejected:  "Dépôt rejeté",
    bankerWithdrawalApproved: "Retrait approuvé !",
    bankerWithdrawalRejectedRefunded: "Retrait rejeté et remboursé",
    bankerAll:              "Tous",
    bankerDepositsTab:      "Dépôts",
    bankerWithdrawalsTab:   "Retraits",
    bankerHistoryTab:       "Historique",
    bankerNoHistory:        "Aucun historique trouvé",
    depositProcessed:       "Dépôt traité !",
    withdrawalProcessed:    "Retrait traité !",
    comingSoon:             "Bientôt disponible.",
    withdrawalCreated:      "Retrait créé",
    withdrawalSubmitted:    "Demande envoyée",
    withdrawalCreatedDesc:  "Votre demande de retrait a été soumise et est en cours de traitement.",
    withdrawalSubmittedDesc:"Votre demande de retrait a été envoyée.",
    searchPlaceholder:      "Rechercher nom, téléphone, référence...",
    walletAddCard:          "Ajouter une carte",
    walletAddMethod:            "Ajouter un moyen de retrait",
    walletWithdrawalMethod:     "Moyen de retrait",
    teamMembersLabel:           "Membres de l'équipe",
    statusLabel:                "État",
    dateLabel:                  "Date",
    notFoundTitle:              "404 Page introuvable",
    notFoundDesc:               "Cette page n'existe pas.",
    searchCountryPlaceholder:   "Rechercher un pays ou indicatif…",
    incorrectPin:               "Code PIN incorrect",
    teamHistoryTitle:       "Historique d'équipe",
    teamMemberAccount:      "Compte :",
    teamMemberDate:         "Date :",
    giftCodeLabel:          "Code cadeau",
    giftCodeInputPlaceholder: "Saisir le code ici",
    giftCodeReceiveBtn:     "Recevoir ma récompense",
    wheelFirstSpinHint:     "Faites votre premier tirage pour voir vos résultats ici.",
    wheelWinnersCount:      "{0} gagnants",
    wheelHistoryDividerLabel: "Historique des tirages",
    adminTabDashboard:      "Tableau de bord",
    adminTabDeposits:       "Dépôts",
    adminTabWithdrawals:    "Retraits",
    adminTabUsers:          "Utilisateurs",
    adminTabProducts:       "Produits",
    adminTabNumbers:        "Numéros",
    adminTabCountries:      "Pays",
    adminTabGiftCodes:      "Codes Cadeaux",
    adminTabSettings:       "Paramètres",
    adminTabTasks:          "Tâches",
    adminTabWheel:          "Roue",
    adminTabContent:        "Contenu",
    teamRegisteredOn: "Date d'inscription",
    teamActiveProduct: "Produit actif",
    teamDeposited: "Déposé",
    teamTotalInvested: "Total investi",
    teamPurchasedProducts: "Produits achetés",
    teamActiveStatus: "Actif",
    teamEndedStatus: "Terminé",
    teamNoProductPurchased: "Aucun produit",
    teamLevel: "Niveau",
    teamMember: "Membre",
    teamTotalTeamInvested: "Total investi par l'équipe",
    teamLevelShort: "Nv.",
    teamNoLevel1: "Aucun membre niveau 1",
    teamNoLevel2: "Aucun membre niveau 2",
    teamNoLevel3: "Aucun membre niveau 3",
    teamUserNotFound: "Utilisateur introuvable",
    teamTeamOf: "Équipe de",
    adminCancel: "Annuler",
    adminSave: "Enregistrer",
    adminCreate: "Créer",
    adminConfirmDelete: "Confirmer la suppression",
    adminSearchByPhoneOrName: "Rechercher par téléphone ou nom...",
    adminSearchDeposit: "Rechercher un dépôt...",
    adminChannelName: "Nom du canal",
    adminRedirectUrl: "URL de redirection",
    adminApiPayment: "Paiement API automatique",
    adminNoChannel: "Aucun canal configuré",
    adminEditChannel: "Modifier le canal",
    adminNewChannel: "Nouveau canal",
    adminAutoMode: "Mode Automatique",
    adminManualMode: "Mode Manuel",
    adminManualModeActivated: "✋ Mode Manuel activé",
    adminAutoModeActivated: "⚡ Mode Semi-automatique activé",
    adminManualModeLabel: "Mode Manuel",
    adminAutoModeLabel: "Mode Semi-automatique NOWPayments",
    adminManualModeDesc: "Vous validez chaque retrait manuellement",
    adminAutoModeDesc: "L'admin lance NOWPayments puis valide le code 2FA",
    adminNoWithdrawals: "Aucun retrait trouvé",
    adminManualPayment: "Paiement manuel",
    adminUserActive: "Actif",
    adminUserDeposited: "A déposé",
    adminUserTeamTitle: "Équipe",
    adminUserRegisteredOn: "Inscrit le",
    adminUserNotProvided: "Non renseigné",
    adminUserTransactionPwd: "Mot de passe transaction",
    adminUserInvitedBy: "Parrainé par",
    adminUserReferralCode: "Code de parrainage",
    adminEditBalance: "Modifier le solde",
    adminNewBalance: "Nouveau solde",
    adminEditEarnings: "Modifier les gains",
    adminNewEarnings: "Nouveaux gains",
    adminResetPasswordLabel: "Réinitialiser le mot de passe",
    adminNewPassword: "Nouveau mot de passe",
    adminAssignProduct: "Attribuer un produit",
    adminChooseProduct: "Choisir un produit",
    adminUserProductsLabel: "Produits de l'utilisateur",
    adminNoProduct: "Aucun produit",
    adminPinCode: "Code PIN",
    adminTaskName: "Nom de la tâche",
    adminTaskNamePlaceholder: "Entrez le nom de la tâche...",
    adminTaskDescriptionLabel: "Description",
    adminTaskDescriptionPlaceholder: "Entrez la description...",
    adminTaskRequiredInvites: "Invitations requises",
    adminTaskReward: "Récompense",
    adminTaskSortOrder: "Ordre",
    adminTaskNew: "Nouvelle tâche",
    adminTaskEdit: "Modifier la tâche",
    adminTaskActive: "Actif",
    adminTaskInactive: "Inactif",
    adminTaskCreated: "Tâche créée",
    adminTaskUpdated: "Tâche mise à jour",
    adminTaskDeleted: "Tâche supprimée",
    adminTaskDeleteWarning: "Cette action est irréversible.",
    adminTaskDelete: "Supprimer",
    adminNoTasks: "Aucune tâche",
    adminTaskCenterTitle: "Centre des tâches",
    adminTaskCenterDesc: "Gérer les tâches et récompenses",
    adminChannelCreated: "Canal créé !",
    adminChannelUpdated: "Canal mis à jour !",
    adminChannelDeleted: "Canal supprimé !",
    adminCountriesTitle: "Gestion des Pays",
    adminAddCountry: "Ajouter un pays",
    adminEditCountry: "Modifier le pays",
    adminDeleteCountryTitle: "Supprimer ce pays ?",
    adminCountryIrreversible: "Cette action est irréversible.",
    adminCountryActiveLabel: "Pays actif",
    adminCountryCodeLabel: "Code pays (ex: CM)",
    adminCountryCurrencyLabel: "Devise (ex: USDT)",
    adminCountryNameLabel: "Nom du pays",
    adminCountryPhoneLabel: "Indicatif téléphonique (sans +)",
    adminCountryOperatorsLabel: "Opérateurs (séparés par virgule)",
    adminCountryOperatorsHint: "Exemple: Airtel Money, Moov Money",
    adminCountryPhoneDisplay: "Indicatif: +",
    adminCountryUpdated: "Pays mis à jour !",
    adminCountryAdded: "Pays ajouté !",
    adminCountryDeleted: "Pays supprimé !",
    adminNoCountries: "Aucun pays configuré",
    adminContentDesc: "Modifiez ici tous les textes, messages et pop-up de l'application. Les modifications sont appliquées après enregistrement.",
    adminContentSaved: "Textes enregistrés !",
    adminContentSave: "Enregistrer les textes",
    adminWheelTitle: "Configuration de la roue",
    adminWheelDesc: "Les 8 prix restent visibles sur la roue. Une case désactivée reste affichée, mais ne peut jamais être tirée comme gain.",
    adminWheelSection: "Section",
    adminWheelCanWin: "Gagnable",
    adminWheelCannotWin: "Non gagnable",
    adminWheelDisplayName: "Nom affiché",
    adminWheelDisplayNamePlaceholder: "Ex. Petit gain",
    adminWheelAmount: "Montant (XOF)",
    adminWheelColor: "Couleur",
    adminWheelWarning: "Activez au moins une section gagnable avant d'enregistrer.",
    adminWheelSave: "Enregistrer la roue",
    adminWheelSaved: "Configuration de la roue enregistrée !",
    adminWheelSaveError: "Impossible d'enregistrer la roue",
    adminWithdrawalAutoBtn: "Semi-auto",
    adminWithdrawalManualBtn: "Manuel",
    adminWithdrawalSearchPlaceholder: "Rechercher par numéro ou nom...",
    adminWithdrawal2FA: "2FA NOWPayments",
    adminWithdrawalNowPaymentsId: "Payout NOWPayments :",
    adminWithdrawalNowPaymentsValidated: "Payout NOWPayments validé",
    adminWithdrawalNowPaymentsValidatedDesc: "Le retrait est maintenant en cours de traitement.",
    adminWithdrawalNowPaymentsFailed: "Validation NOWPayments échouée",
    adminWithdrawalServerError: "Erreur serveur",
    adminWithdrawalAt: " à ",
    adminSettingsSaved: "Paramètres enregistrés !",
    adminSettingsGoOnline: "Remettre le site en ligne",
    adminSettingsGoOffline: "Mettre le site hors service",
    adminSettingsMaintenanceMode: "Mode maintenance",
    adminSettingsMaintenanceActive: "En maintenance",
    adminSettingsRunning: "En ligne",
    approve: "Approuver",
    reject: "Rejeter",
    rejectAndBan: "Rejeter et bannir",
    amount: "Montant",
    operator: "Opérateur",
    payerNumber: "Numéro payeur",
    date: "Date",
    recipientNumber: "Numéro destinataire",
    reference: "Référence",
    paymentMessageReceived: "Message de paiement reçu",
    screenshot: "Capture d'écran",
    grossAmount: "Montant brut",
    netAmount: "Montant net",
    fees: "Frais",
    method: "Méthode",
    bep20Address: "Adresse BEP-20",
    dateTime: "Date/Heure",
    enter2FACode: "Saisir le code 2FA",
    promoter: "Promoteur",
    channel: "Canal",
    beneficiary: "Bénéficiaire",
    country: "Pays",
    adminWithdrawal2FALabel: "2FA",
    adminWithdrawal2FAFailed: "Validation NOWPayments échouée",
    adminWithdrawal2FAValidated: "Payout NOWPayments validé",
    adminWithdrawal2FAProcessing: "Le retrait est maintenant en cours de traitement.",
    adminWithdrawalPayoutId: "Payout NOWPayments :",
};

const TRANSLATION_OVERRIDES: Record<Exclude<Lang, "fr">, Partial<Translations>> = {
  en: {
    languageLabel: "Language",
    shareInformation: "Share information",
    yourNumber: "your phone number",
    yourPassword: "your password",
    rememberMe: "remember me",
    loginBtn: "Sign in",
    loginLoading: "Signing in...",
    noAccount: "I don't have an account.",
    createAccount: "Create an account",
    registerBtn: "Sign up",
    registerLoading: "Signing up...",
    repeatPassword: "repeat password",
    referralCode: "referral code",
    selectCountry: "Select a country",
    phonePlaceholder: "Enter your phone number",
    passwordPlaceholder: "Enter your password",
    confirmPasswordPlaceholder: "Confirm your password",
    invitationCodePlaceholder: "Enter your referral code",
    noAccountRegister: "No account? Sign up",
    alreadyHaveAccountLogin: "Already have an account? Sign in",
    home: "Home",
    products: "Products",
    earnings: "Earnings",
    team: "Team",
    me: "Me",
    deposit: "Recharge",
    withdraw: "Withdraw",
    customerService: "Customer service",
    informationCenter: "Information center",
    previous: "Previous",
    next: "Next",
    notification: "Notification",
    loading: "Loading...",
    price: "Price",
    dailyRevenue: "Daily reward",
    totalRevenue: "Total revenue",
    duration: "Duration",
    period: "Period",
    buy: "Buy",
    confirm: "Confirm",
    cancel: "Cancel",
    history: "History",
    security: "Security",
    redeem: "Redeem",
    about: "About",
    wallet: "Wallet",
    commonFunctions: "Common actions",
    logout: "Log out",
    accountBalance: "Account balance",
    revenue: "Revenue",
    changePassword: "Change password",
    withdrawalHistory: "Withdrawal history",
    statusApproved: "Approved",
    statusPending: "Pending",
    statusRejected: "Rejected",
    invalidAmount: "Invalid amount",
    minAmountPrefix: "Minimum amount:",
    depositOrders: "Deposit orders",
    depositHistory: "Deposit history",
    depositLabel: "Deposit",
    checkinBtn: "Check in",
    checkinComeBack: "Come back in {0} hours",
    checkinHeading: "Daily check-in",
    checkinCalendarTitle: "Monthly calendar",
    checkinPreviousMonth: "Previous month",
    checkinNextMonth: "Next month",
    checkinDayClaimed: "Check-in completed",
    checkinDayNotClaimed: "No check-in",
    withdrawalCreated: "Withdrawal created",
    withdrawalSubmitted: "Request submitted",
    withdrawalCreatedDesc: "Your withdrawal request has been submitted and is being processed.",
    withdrawalSubmittedDesc: "Your withdrawal request has been submitted.",
  },
  ar: {
    languageLabel: "اللغة",
    yourNumber: "رقم هاتفك",
    yourPassword: "كلمة المرور",
    rememberMe: "تذكرني",
    loginBtn: "تسجيل الدخول",
    loginLoading: "جارٍ تسجيل الدخول...",
    noAccount: "ليس لدي حساب.",
    createAccount: "إنشاء حساب",
    registerBtn: "إنشاء حساب",
    registerLoading: "جارٍ إنشاء الحساب...",
    repeatPassword: "تأكيد كلمة المرور",
    referralCode: "رمز الإحالة",
    selectCountry: "اختر دولة",
    phonePlaceholder: "أدخل رقم هاتفك",
    passwordPlaceholder: "أدخل كلمة المرور",
    confirmPasswordPlaceholder: "أكّد كلمة المرور",
    invitationCodePlaceholder: "أدخل رمز الإحالة",
    noAccountRegister: "ليس لديك حساب؟ أنشئ حساباً",
    alreadyHaveAccountLogin: "لديك حساب بالفعل؟ سجّل الدخول",
    home: "الرئيسية",
    products: "المنتجات",
    earnings: "الأرباح",
    team: "الفريق",
    me: "حسابي",
    deposit: "إيداع",
    withdraw: "سحب",
    customerService: "خدمة العملاء",
    informationCenter: "مركز المعلومات",
    previous: "السابق",
    next: "التالي",
    notification: "الإشعارات",
    loading: "جارٍ التحميل...",
    price: "السعر",
    dailyRevenue: "المكافأة اليومية",
    totalRevenue: "إجمالي الأرباح",
    duration: "المدة",
    period: "الفترة",
    buy: "شراء",
    confirm: "تأكيد",
    cancel: "إلغاء",
    history: "السجل",
    security: "الأمان",
    redeem: "استبدال",
    about: "حول",
    wallet: "المحفظة",
    commonFunctions: "الإجراءات الشائعة",
    logout: "تسجيل الخروج",
    accountBalance: "رصيد الحساب",
    revenue: "الأرباح",
    changePassword: "تغيير كلمة المرور",
    withdrawalHistory: "سجل السحوبات",
    statusApproved: "تمت الموافقة",
    statusPending: "قيد الانتظار",
    statusRejected: "مرفوض",
    invalidAmount: "مبلغ غير صالح",
    minAmountPrefix: "الحد الأدنى:",
    depositOrders: "طلبات الإيداع",
    depositHistory: "سجل الإيداعات",
    depositLabel: "إيداع",
    checkinBtn: "تسجيل الحضور",
    checkinComeBack: "ارجع بعد {0} ساعة",
    checkinHeading: "تسجيل الحضور اليومي",
    checkinCalendarTitle: "تقويم الشهر",
    checkinPreviousMonth: "الشهر السابق",
    checkinNextMonth: "الشهر التالي",
    checkinDayClaimed: "تم تسجيل الحضور",
    checkinDayNotClaimed: "لم يتم التسجيل",
    checkinBonusTitle: "تهانينا!",
    checkinBonusDesc: "لقد تلقيت {0}. تمت إضافة المكافأة إلى رصيد أرباحك.",
    withdrawalCreated: "تم إنشاء السحب",
    withdrawalSubmitted: "تم إرسال الطلب",
    withdrawalCreatedDesc: "تم إرسال طلب السحب الخاص بك وهو قيد المعالجة.",
    withdrawalSubmittedDesc: "تم إرسال طلب السحب الخاص بك.",
    serviceTitle: "خدمة العملاء",
    serviceOnlineConsult: "استشارة عبر الإنترنت",
    serviceHoursLabel: "ساعات خدمة العملاء",
    serviceOnlineNow: "متصل الآن",
    serviceOfflineNow: "غير متصل حالياً",
    serviceAnnouncements: "الإعلانات والأخبار",
    serviceCommunity: "الدردشة مع الأعضاء",
  },
  zh: {
    languageLabel: "语言",
    yourNumber: "您的手机号",
    yourPassword: "您的密码",
    rememberMe: "记住我",
    loginBtn: "登录",
    loginLoading: "登录中...",
    noAccount: "我没有账户。",
    createAccount: "创建账户",
    registerBtn: "注册",
    registerLoading: "注册中...",
    repeatPassword: "重复密码",
    referralCode: "推荐码",
    selectCountry: "选择国家",
    phonePlaceholder: "请输入您的手机号码",
    passwordPlaceholder: "请输入密码",
    confirmPasswordPlaceholder: "请确认密码",
    invitationCodePlaceholder: "请输入推荐码",
    noAccountRegister: "没有账户？注册",
    alreadyHaveAccountLogin: "已有账户？登录",
    home: "首页",
    products: "产品",
    earnings: "收益",
    team: "团队",
    me: "我的",
    deposit: "充值",
    withdraw: "提现",
    customerService: "客服",
    informationCenter: "信息中心",
    previous: "上一页",
    next: "下一页",
    notification: "通知",
    loading: "加载中...",
    price: "价格",
    dailyRevenue: "每日奖励",
    totalRevenue: "总收益",
    duration: "期限",
    period: "周期",
    buy: "购买",
    confirm: "确认",
    cancel: "取消",
    history: "历史记录",
    security: "安全",
    redeem: "兑换",
    about: "关于我们",
    wallet: "钱包",
    commonFunctions: "常用功能",
    logout: "退出登录",
    accountBalance: "账户余额",
    revenue: "收益",
    changePassword: "修改密码",
    withdrawalHistory: "提现记录",
    statusApproved: "已批准",
    statusPending: "待处理",
    statusRejected: "已拒绝",
    invalidAmount: "金额无效",
    minAmountPrefix: "最低金额：",
    depositOrders: "充值订单",
    depositHistory: "充值记录",
    depositLabel: "充值",
    checkinBtn: "签到",
    checkinComeBack: "{0} 小时后再来",
    checkinHeading: "每日签到",
    checkinCalendarTitle: "本月日历",
    checkinPreviousMonth: "上个月",
    checkinNextMonth: "下个月",
    checkinDayClaimed: "已签到",
    checkinDayNotClaimed: "未签到",
    checkinBonusTitle: "恭喜！",
    checkinBonusDesc: "您已收到 {0}，奖励已加入您的收益余额。",
    withdrawalCreated: "提现已创建",
    withdrawalSubmitted: "申请已提交",
    withdrawalCreatedDesc: "您的提现申请已提交，正在处理中。",
    withdrawalSubmittedDesc: "您的提现申请已提交。",
    serviceTitle: "客服",
    serviceOnlineConsult: "在线咨询",
    serviceHoursLabel: "客服服务时间",
    serviceOnlineNow: "当前在线",
    serviceOfflineNow: "当前离线",
    serviceAnnouncements: "公告和新闻",
    serviceCommunity: "与会员聊天",
  },
};

/**
 * English used to inherit the whole French catalog and override only a handful
 * of keys. That made the selected English interface silently fall back to
 * French throughout the app. Keep the explicit reviewed translations above,
 * then translate the legacy French catalog before it is ever exposed as EN.
 */
const ENGLISH_PHRASES: Record<string, string> = {
  "Veuillez sélectionner votre carte bancaire": "Please select your bank card",
  "Entrez le montant du retrait": "Enter the withdrawal amount",
  "Veuillez saisir le montant du retrait": "Please enter the withdrawal amount",
  "Montant reçu": "Amount received",
  "Taux de frais": "Fee rate",
  "Les retraits sont actuellement désactivés.": "Withdrawals are currently disabled.",
  "Sélectionnez un compte": "Select an account",
  "Veuillez lier un compte de retrait.": "Please link a withdrawal account.",
  "Le montant maximum est": "The maximum amount is",
  "Les deux derniers chiffres du montant doivent être 00": "The last two digits of the amount must be 00",
  "Vous devez posséder un produit actif pour effectuer un retrait.": "You must have an active product to make a withdrawal.",
  "Vous pouvez effectuer des retraits à tout moment.": "You can make withdrawals at any time.",
  "Les retraits sont disponibles sous 4 à 24 heures.": "Withdrawals are available within 4 to 24 hours.",
  "Aucune opération pour le moment": "No transactions yet",
  "Vos dépôts XOF apparaîtront ici.": "Your XOF deposits will appear here.",
  "Vos retraits USDT BEP20 apparaîtront ici.": "Your USDT BEP20 withdrawals will appear here.",
  "Vos gains, commissions et bonus apparaîtront ici.": "Your earnings, commissions and bonuses will appear here.",
  "Invitez vos amis à participer et gagnez une commission de 39 %": "Invite your friends to participate and earn a 39% commission",
  "Taux de rendement quotidien": "Daily return rate",
  "Les gains du produit sont crédités automatiquement à la fin du cycle.": "Product earnings are credited automatically at the end of the cycle.",
  "Achetez plusieurs appareils pour multiplier vos gains": "Buy multiple devices to increase your earnings",
  "Invitez vos amis à s'inscrire grâce à votre lien.": "Invite your friends to sign up using your link.",
  "Lorsqu'ils achètent un produit, vous obtenez des tours gratuits.": "When they buy a product, you get free spins.",
  "Vous pouvez aussi jouer vous-même pour gagner des tours.": "You can also play yourself to earn spins.",
  "Félicitations !": "Congratulations!",
  "Vous avez gagné": "You won",
  "crédité directement sur votre solde.": "credited directly to your balance.",
  "Réessayez lors de votre prochain tour.": "Try again on your next spin.",
  "À propos": "About",
  "Aucune commande": "No orders",
  "Aucune tâche disponible": "No tasks available",
  "Aucun produit": "No product",
  "Aucun produit disponible": "No products available",
  "Aucun retrait trouvé": "No withdrawals found",
  "Aucun retrait pour le moment": "No withdrawals yet",
  "Aucun dépôt pour le moment": "No deposits yet",
  "Aucune transaction pour le moment": "No transactions yet",
  "Aucun historique trouvé": "No history found",
  "Aucun pays trouvé": "No country found",
  "Aucun membre niveau 1": "No level 1 members",
  "Aucun membre niveau 2": "No level 2 members",
  "Aucun membre niveau 3": "No level 3 members",
  "Ajouter un portefeuille": "Add wallet",
  "Ajouter un moyen de retrait": "Add withdrawal method",
  "Adresse de retrait": "Withdrawal address",
  "Adresse de dépôt": "Deposit address",
  "Adresse copiée": "Address copied",
  "Adresse requise": "Address required",
  "Annuler": "Cancel",
  "Approuver": "Approve",
  "Approuvé": "Approved",
  "Bientôt disponible.": "Coming soon.",
  "Chargement...": "Loading...",
  "Choisir un canal": "Choose a channel",
  "Choisir un produit": "Choose a product",
  "Code cadeau": "Gift code",
  "Code PIN incorrect": "Incorrect PIN",
  "Confirmer": "Confirm",
  "Date": "Date",
  "Dépôt": "Deposit",
  "Dépôts": "Deposits",
  "Dépôt traité !": "Deposit processed!",
  "Dépôt validé !": "Deposit approved!",
  "Détails": "Details",
  "Échec": "Failed",
  "En attente": "Pending",
  "En cours": "Processing",
  "Enregistrer": "Save",
  "Erreur": "Error",
  "Erreur serveur": "Server error",
  "Frais": "Fees",
  "Historique": "History",
  "Historique des dépôts": "Deposit history",
  "Historique des retraits": "Withdrawal history",
  "Informations de paiement": "Payment information",
  "Méthode": "Method",
  "Montant": "Amount",
  "Montant net": "Net amount",
  "Mot de passe": "Password",
  "Niveau": "Level",
  "Non renseigné": "Not provided",
  "Paiement manuel": "Manual payment",
  "Paramètres": "Settings",
  "Pays": "Countries",
  "Portefeuille": "Wallet",
  "Référence": "Reference",
  "Rejeter": "Reject",
  "Rejeté": "Rejected",
  "Retrait": "Withdrawal",
  "Retraits": "Withdrawals",
  "Retrait traité !": "Withdrawal processed!",
  "Sélectionner": "Select",
  "Sélectionnez un pays": "Select a country",
  "Service client": "Customer service",
  "Solde du compte": "Account balance",
  "Soumettre": "Submit",
  "Succès": "Success",
  "Tableau de bord": "Dashboard",
  "Tâches": "Tasks",
  "Utilisateur introuvable": "User not found",
  "Utilisateurs": "Users",
  "Vérification en cours…": "Verification in progress…",
};

const ENGLISH_WORDS: Record<string, string> = {
  "acceptez": "agree", "accueil": "home", "achat": "purchase", "Achetez": "Buy",
  "achetez": "buy", "acheté": "purchased", "achetés": "purchased", "agrandir": "grow",
  "ajoutez": "add", "amis": "friends", "annonces": "announcements", "appareil": "device",
  "aperçu": "preview", "Appuyez": "Tap", "appuyez": "tap", "attente": "pending",
  "au": "to", "aux": "to", "bien": "successfully", "bientôt": "soon", "bloc": "block",
  "bénéficiaire": "beneficiary", "caractères": "characters", "ces": "these", "champs": "fields",
  "choisissez": "choose", "choses": "things", "ci-dessus": "above", "cochant": "checking",
  "coller": "paste", "comme": "as", "commencerez": "will start", "commencer": "start",
  "commençant": "starting", "commencez": "start", "compagnie": "company", "confirmez": "confirm",
  "confirmation": "confirmation", "conditions": "terms", "connecter": "connect",
  "consommé": "used", "contactez": "contact", "continuer": "continue", "copiage": "copying",
  "copiez": "copy", "cours": "progress", "création": "creation", "crédit": "credit",
  "crédités": "credited", "créditée": "credited", "créditer": "credit", "demain": "tomorrow",
  "demander": "request", "détails": "details", "diamant": "diamond", "doit": "must",
  "donc": "therefore", "droits": "rights", "durée": "duration", "effectuer": "make",
  "engagée": "committed", "enregistrement": "saving", "enregistrés": "saved",
  "enregistré": "saved", "enregistrée": "saved", "ensuite": "then", "entreprise": "company",
  "entrez": "enter", "faites": "make", "félicitations": "congratulations", "filleul": "referral",
  "fonds": "funds", "gagner": "earn", "gagnants": "winners", "génération": "generation",
  "gérer": "manage", "gestion": "management", "grands": "grand", "gratuits": "free",
  "ici": "here", "il": "it", "impératif": "mandatory", "inaccessible": "unavailable",
  "inclus": "included", "indisponible": "unavailable", "inférieur": "lower",
  "informations": "information", "inscrit": "registered", "inviter": "invite", "invitez": "invite",
  "investissement": "investment", "investir": "invest", "irréversible": "irreversible",
  "jamais": "never", "jouer": "play", "lancer": "launch", "leur": "their", "ligne": "online",
  "ma": "my", "maintenant": "now", "maintenez": "hold", "mais": "but", "manque": "missing",
  "masqué": "hidden", "mémoriser": "remember", "mes": "my", "mise": "update",
  "modification": "change", "modifications": "changes", "mots": "words", "moyen": "method",
  "ne": "not", "net": "net", "niveau": "level", "nom": "name", "notre": "our",
  "nouveaux": "new", "numéros": "numbers", "obligatoire": "required", "offrir": "offer",
  "on": "on", "opérateurs": "operators", "optionnelle": "optional", "ou": "or",
  "page": "page", "palier": "tier", "parrainé": "referred", "passe": "password",
  "patienter": "wait", "personnalisé": "custom", "personne": "person", "plateforme": "platform",
  "platine": "platinum", "presse-papiers": "clipboard", "progression": "progress",
  "pu": "could", "quand": "when", "quotidiens": "daily", "rechargez": "recharge",
  "rechargé": "recharged", "recharges": "recharges", "réalisée": "completed",
  "récompenses": "rewards", "réclamée": "claimed", "réclamer": "claim", "réglés": "settled",
  "remboursé": "refunded", "remplissez": "complete", "rendu": "made", "requis": "required",
  "respectez": "follow", "reste": "remaining", "restants": "remaining", "retour": "back",
  "réussie": "successful", "réseau": "network", "sans": "without", "sauf": "except",
  "scannez": "scan", "se": "", "sera": "will be", "seront": "will be", "ses": "their",
  "si": "if", "soumise": "submitted", "soumettre": "submit", "support": "support",
  "suspendu": "suspended", "taux": "rate", "technologique": "technology", "tel": "such",
  "telle": "such", "terminal": "terminal", "terminé": "completed", "tes": "your",
  "texte": "text", "textes": "texts", "tirage": "draw", "titre": "title", "titulaire": "holder",
  "toujours": "always", "toutes": "all", "tours": "spins", "traduire": "translate",
  "transparentes": "transparent", "trois": "three", "trop": "too", "uniquement": "only",
  "validez": "validate", "verifiez": "check", "version": "version", "veuillez": "please",
  "via": "via", "virgule": "comma", "voir": "view", "vous": "you", "y": "there",
  "Bénin": "Benin", "Côte": "Coast", "demandé": "requested", "intégralement": "in full",
  "L'adresse": "The address", "l'adresse": "the address", "L'administrateur": "The administrator",
  "l'administrateur": "the administrator", "L'application": "The app", "l'application": "the app",
  "L'appareil": "The device", "l'appareil": "the device", "L'accueil": "Home",
  "l'accueil": "home", "L'équipe": "The team", "l'équipe": "the team",
  "L'historique": "The history", "l'historique": "the history", "L'image": "The image",
  "l'image": "the image", "d'accès": "access", "d'ajouter": "to add",
  "d'amis": "of friends", "d'argent": "of money", "d'envoyer": "to send",
  "d'inscription": "registration", "d'invitation": "invitation", "d'utilisation": "use",
  "À": "To", "à": "to", "Accueil": "Home", "Achat": "Purchase", "Acheter": "Buy",
  "Actif": "Active", "Actuelle": "Current", "Actuel": "Current", "administrateur": "administrator",
  "administration": "administration", "Ajouter": "Add", "ajouter": "add", "Ancien": "Old",
  "Ancienne": "Old", "annulée": "cancelled", "annulé": "cancelled", "après": "after",
  "aucun": "no", "Aucun": "No", "aucune": "no", "Aucune": "No",
  "automatique": "automatic", "Automatique": "Automatic", "avec": "with", "avant": "before",
  "banque": "bank", "bonus": "bonus", "canal": "channel", "Canal": "Channel",
  "carte": "card", "ce": "this", "Ce": "This", "cette": "this", "Cette": "This",
  "chaîne": "channel", "choisir": "choose", "Choisir": "Choose", "code": "code",
  "Code": "Code", "commande": "order", "Commandes": "Orders", "compte": "account",
  "Compte": "Account", "confirmer": "confirm", "Confirmer": "Confirm", "contenu": "content",
  "Contenu": "Content", "copié": "copied", "Copier": "Copy", "créer": "create",
  "Créer": "Create", "créée": "created", "Créée": "Created", "créé": "created",
  "Créé": "Created", "crédité": "credited", "cumulé": "cumulative", "d'": "of ",
  "dans": "in", "de": "of", "Défaut": "Default", "demande": "request", "Demande": "Request",
  "depuis": "since", "dernière": "last", "des": "of the", "Désactivé": "Disabled",
  "désactivé": "disabled", "dépôt": "deposit", "Dépôt": "Deposit", "dépôts": "deposits",
  "Dépôts": "Deposits", "devise": "currency", "Devise": "Currency", "disponible": "available",
  "Disponible": "Available", "données": "data", "du": "of the", "échec": "failure",
  "Échec": "Failure", "équipe": "team", "Équipe": "Team", "en": "in", "En": "In",
  "enregistrer": "save", "Enregistrer": "Save", "envoyé": "sent", "Envoyer": "Send",
  "erreur": "error", "Erreur": "Error", "est": "is", "et": "and", "Étape": "Step",
  "exemple": "example", "Exemple": "Example", "facultatif": "optional", "Frais": "Fees",
  "frais": "fees", "gagné": "earned", "Gagné": "Earned", "gains": "earnings",
  "Gains": "Earnings", "groupe": "group", "Groupe": "Group", "historique": "history",
  "Historique": "History", "image": "image", "Image": "Image", "inscription": "registration",
  "invitation": "invitation", "Invitations": "Invitations", "jour": "day", "jours": "days",
  "le": "the", "Le": "The", "les": "the", "Les": "The", "lien": "link", "Lien": "Link",
  "liste": "list", "Liste": "List", "manuellement": "manually", "manuel": "manual",
  "Manuel": "Manual", "membre": "member", "Membre": "Member", "membres": "members",
  "Membres": "Members", "message": "message", "Message": "Message", "méthode": "method",
  "Méthode": "Method", "mettre": "put", "minimum": "minimum", "Minimum": "Minimum",
  "mis": "updated", "Mode": "Mode", "mode": "mode", "modifié": "updated", "Modifier": "Edit",
  "mon": "my", "Mon": "My", "montant": "amount", "Montant": "Amount", "mot": "word",
  "Mot": "Word", "nouveau": "new", "Nouveau": "New", "nouvelle": "new", "Nouvelle": "New",
  "numéro": "number", "Numéro": "Number", "obtenir": "get", "officiel": "official",
  "paiement": "payment", "Paiement": "Payment", "pays": "country", "Pays": "Country",
  "par": "by", "Par": "By", "parrainage": "referral", "pas": "not", "personnes": "people",
  "place": "place", "plus": "more", "pour": "for", "Portefeuille": "Wallet",
  "premier": "first", "prix": "price", "produit": "product", "Produit": "Product",
  "produits": "products", "Produits": "Products", "profil": "profile", "quantité": "quantity",
  "recharge": "recharge", "Recharge": "Recharge", "rechercher": "search", "Rechercher": "Search",
  "récompense": "reward", "Récompense": "Reward", "reçu": "received", "Reçu": "Received",
  "référence": "reference", "Référence": "Reference", "refusé": "rejected", "Refusé": "Rejected",
  "réinitialiser": "reset", "Rejoindre": "Join", "rejeté": "rejected", "Rejeté": "Rejected",
  "retrait": "withdrawal", "Retrait": "Withdrawal", "retraits": "withdrawals", "Retraits": "Withdrawals",
  "revenu": "revenue", "Revenu": "Revenue", "revenus": "earnings", "Revenus": "Earnings",
  "roue": "wheel", "Roue": "Wheel", "saisir": "enter", "Saisir": "Enter", "semaine": "week",
  "sélectionner": "select", "Sélectionner": "Select", "solde": "balance", "Solde": "Balance",
  "sont": "are", "statut": "status", "Statut": "Status", "supprimer": "delete", "Supprimer": "Delete",
  "sur": "on", "tâche": "task", "Tâche": "Task", "tâches": "tasks", "Tâches": "Tasks",
  "téléphone": "phone", "Téléphone": "Phone", "tous": "all", "Tous": "All", "total": "total",
  "Total": "Total", "transaction": "transaction", "traitement": "processing", "Traitement": "Processing",
  "un": "a", "Un": "A", "une": "a", "Une": "A", "utilisateur": "user", "Utilisateur": "User",
  "valider": "validate", "Validé": "Approved", "validation": "validation", "valide": "valid",
  "valeur": "value", "vérification": "verification", "votre": "your", "Votre": "Your",
  "vos": "your", "Vos": "Your", "vue": "view",
  "Acheté": "Purchased", "Aperçu": "Preview", "Approuvé": "Approved", "Approuvés": "Approved",
  "Après": "After", "Bannière": "Banner", "Bannières": "Banners", "Bientôt": "Coming soon",
  "Bénéficiaire": "Beneficiary", "Chaîne": "Channel", "Clé": "Key", "Clés": "Keys",
  "Copié": "Copied", "Crédite": "Credits", "Créez": "Create", "Dernières": "Latest",
  "Durabilité": "Sustainability", "Durée": "Duration", "DÉPÔT": "DEPOSIT",
  "Déblocage": "Unlocking", "Débloquée": "Unlocked", "Déconnexion": "Log out",
  "Découvrez": "Discover", "Défaite": "Loss", "Déjà": "Already", "Déposé": "Deposited",
  "Désélectionnez": "Deselect", "Détails": "Details", "Effectué": "Completed",
  "Expérience": "Experience", "Français": "French", "Félicitations": "Congratulations",
  "Générales": "General", "Génération": "Generation", "Gérer": "Manage", "Gérez": "Manage",
  "Icône": "Icon", "Invité": "Invited", "Libéré": "Released", "Masqué": "Hidden",
  "Mémoriser": "Remember", "Numéros": "Numbers", "Opérateur": "Operator",
  "Opérateurs": "Operators", "Paramètres": "Settings", "Parrainé": "Referred",
  "Planifié": "Scheduled", "Probabilité": "Probability", "Probabilités": "Probabilities",
  "Problème": "Issue", "Précédent": "Previous", "Préparation": "Preparing",
  "Présentez": "Present", "Période": "Period", "Qualité": "Quality", "REFUSÉ": "REJECTED",
  "Rejetés": "Rejected", "Règlement": "Rules", "Règles": "Rules", "Réclamer": "Claim",
  "Réclamée": "Claimed", "Récompenses": "Rewards", "Réessayer": "Try again",
  "Réessayez": "Try again", "Réinitialiser": "Reset", "Réseau": "Network",
  "SUCCÈS": "SUCCESS", "Succès": "Success", "Supprimé": "Deleted", "Sécurité": "Security",
  "Sélectionnez": "Select", "Séparateur": "Separator", "Terminé": "Completed",
  "Trophée": "Trophy", "Télécharger": "Download", "Utilisé": "Used",
  "Vélo": "Bike", "Vérification": "Verification", "Vérifiez": "Check",
  "accéder": "access", "achète": "buys", "achètent": "buy", "activité": "activity",
  "activé": "enabled", "actualités": "news", "adaptés": "suitable", "affiché": "displayed",
  "affichée": "displayed", "affichées": "displayed", "affichés": "displayed",
  "ajouté": "added", "ajoutés": "added", "aléatoire": "random", "aléatoirement": "randomly",
  "améliore": "improves", "août": "August", "apparaît": "appears", "apparaîtront": "will appear",
  "appliquées": "applied", "approuvé": "approved", "appuyée": "pressed", "associées": "associated",
  "autorisés": "authorized", "avancés": "advanced", "bannière": "banner", "bloqué": "blocked",
  "bloquée": "blocked", "calculés": "calculated", "centrée": "centered", "clarté": "clarity",
  "cochée": "checked", "codées": "coded", "collectés": "collected", "complète": "complete",
  "configuré": "configured", "configurés": "configured", "confirmés": "confirmed",
  "conçus": "designed", "copiée": "copied", "cumulés": "accumulated", "d'entrée": "input",
  "d'écran": "screen", "d'écraser": "overwrite", "d'énergie": "energy", "d'équipe": "team",
  "d'équipements": "equipment", "deuxième": "second", "dès": "from", "débité": "debited",
  "début": "start", "déclenche": "triggers", "déduits": "deducted", "défaut": "default",
  "défilantes": "scrolling", "défilement": "scrolling", "définies": "defined",
  "définitivement": "permanently", "délai": "delay", "délais": "delays", "dépasse": "exceeds",
  "dépasser": "exceed", "dépendances": "dependencies", "déposer": "deposit", "déposé": "deposited",
  "désactiver": "disable", "désactivée": "disabled", "désactivées": "disabled",
  "désactivés": "disabled", "développe": "develops", "effectué": "completed",
  "entraîner": "lead to", "envoyée": "sent", "estimé": "estimated", "expirées": "expired",
  "fenêtre": "window", "fiabilité": "reliability", "fidèle": "loyal", "financières": "financial",
  "grâce": "thanks to", "génère": "generates", "généreux": "generous", "généré": "generated",
  "générées": "generated", "hexadécimaux": "hexadecimal", "illimité": "unlimited",
  "immédiatement": "immediately", "indiqué": "indicated", "inférieurs": "lower",
  "installée": "installed", "instantanément": "instantly", "intermédiaires": "intermediate",
  "intérêts": "interests", "jusqu'à": "until", "l'expérience": "the experience",
  "l'identité": "the identity", "l'opérateur": "the operator", "l'écran": "the screen",
  "libéré": "released", "liés": "related", "masqués": "hidden", "mobilité": "mobility",
  "même": "same", "opportunités": "opportunities", "opérateur": "operator",
  "opération": "transaction", "paramètre": "setting", "paramètres": "settings",
  "partagés": "shared", "pensées": "thoughts", "pièces": "coins", "planifié": "scheduled",
  "pointés": "checked in", "possède": "has", "posséder": "have", "pressé": "pressed",
  "privilégions": "prioritize", "probabilités": "probabilities", "propriétaire": "owner",
  "protéger": "protect", "protégées": "protected", "présentés": "presented",
  "prétendant": "claiming", "qu'à": "than", "qualité": "quality", "remplacée": "replaced",
  "renseigné": "provided", "représenter": "represent", "retiré": "withdrawn",
  "retirée": "withdrawn", "retirés": "withdrawn", "reversé": "refunded", "reçoit": "receives",
  "reçue": "received", "reçus": "received", "règles": "rules", "récent": "recent",
  "réinitialisations": "resets", "rémunérateur": "rewarding", "répond": "answers",
  "répondre": "answer", "réservés": "reserved", "résultat": "result", "résultats": "results",
  "réutilisable": "reusable", "s'élèvent": "amount to", "sauvegardée": "saved",
  "sauvegardées": "saved", "sauvegardés": "saved", "spécial": "special", "spéciaux": "special",
  "succès": "success", "supprimé": "deleted", "supprimée": "deleted", "systèmes": "systems",
  "sécurisé": "secure", "sécurité": "security", "sélection": "selection",
  "sélectionné": "selected", "sélectionnés": "selected", "séparément": "separately",
  "séparés": "separate", "séries": "series", "tirée": "drawn", "traité": "processed",
  "troisième": "third", "trouvé": "found", "télécharger": "download",
  "téléphonique": "phone", "téléverser": "upload", "tête": "header", "unifié": "unified",
  "utilisé": "used", "validé": "approved", "versés": "credited", "vélos": "bikes",
  "zÀ": "to", "Échanger": "Redeem", "Échoué": "Failed", "Élite": "Elite", "Épuisé": "Exhausted",
  "État": "Status", "échoué": "failed", "échouée": "failed", "écrasées": "overwritten",
  "électrique": "electric", "électriques": "electric", "élevé": "high", "élevés": "high",
  "énergétiques": "energy", "épuisé": "exhausted", "été": "been", "évite": "avoids",
  "éviter": "avoid", "être": "be",
  "Mobilité": "Mobility", "Méfiez": "Beware", "Mémo": "Note", "Réseaux": "Networks",
  "TÊTES": "HEADS", "bannières": "banners", "clé": "key", "déconnecter": "log out",
  "découvrir": "discover", "expérience": "experience", "répéter": "repeat", "vélo": "bike",
};

function translateLegacyFrenchToEnglish(source: string) {
  if (!source) return source;
  const exact = ENGLISH_PHRASES[source];
  if (exact) return exact;
  return source.replace(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)?/g, (word) => {
    const normalized = word.replace("’", "'");
    return ENGLISH_WORDS[normalized] ?? ENGLISH_WORDS[word] ?? word;
  });
}

const en: Translations = Object.fromEntries(
  Object.entries(fr).map(([key, value]) => [
    key,
    (ENGLISH_TRANSLATIONS as unknown as Partial<Translations>)[key as keyof Translations] ??
      TRANSLATION_OVERRIDES.en[key as keyof Translations] ??
      translateLegacyFrenchToEnglish(value),
  ]),
) as Translations;

export const I18N_CATALOG: Record<Lang, Translations> = {
  fr,
  en,
  ar: { ...ARABIC_TRANSLATIONS, ...TRANSLATION_OVERRIDES.ar } as Translations,
  zh: { ...CHINESE_TRANSLATIONS, ...TRANSLATION_OVERRIDES.zh } as Translations,
};

type StaticTranslationRow = readonly [string, string, string, string];

// Older screens still contain some static labels directly in their JSX. Keep
// these in one shared catalog so changing the app language also updates those
// labels while the screens are progressively moved to typed translation keys.
const STATIC_UI_TRANSLATIONS: StaticTranslationRow[] = [
  ["Retour", "Back", "رجوع", "返回"],
  ["Annuler", "Cancel", "إلغاء", "取消"],
  ["Confirmer", "Confirm", "تأكيد", "确认"],
  ["Traitement…", "Processing…", "جاري المعالجة…", "处理中…"],
  ["Informations du moyen de retrait", "Withdrawal method info", "معلومات وسيلة السحب", "提现方式信息"],
  ["Type", "Type", "النوع", "类型"],
  ["Réseau", "Network", "الشبكة", "网络"],
  ["Adresse du réseau", "Network address", "عنوان الشبكة", "网络地址"],
  ["Moyen de retrait ajouté avec succès", "Withdrawal method added", "تمت إضافة وسيلة السحب بنجاح", "提现方式添加成功"],
  ["Moyen de retrait", "Withdrawal method", "وسيلة السحب", "提现方式"],
  ["Ajouter un moyen de retrait", "Add withdrawal method", "إضافة وسيلة سحب", "添加提现方式"],
  ["Adresse USDT BEP20", "USDT BEP20 address", "عنوان USDT BEP20", "USDT BEP20地址"],
  ["Mot de passe de transaction", "Transaction password", "كلمة مرور المعاملة", "交易密码"],
  ["Saisissez votre mot de passe", "Enter password", "أدخل كلمة المرور", "输入密码"],
  ["Afficher le mot de passe", "Show password", "إظهار كلمة المرور", "显示密码"],
  ["Masquer le mot de passe", "Hide password", "إخفاء كلمة المرور", "隐藏密码"],
  ["Afficher la confirmation du mot de passe", "Show password confirmation", "إظهار تأكيد كلمة المرور", "显示确认密码"],
  ["Masquer la confirmation du mot de passe", "Hide password confirmation", "إخفاء تأكيد كلمة المرور", "隐藏确认密码"],
  ["Portefeuille par défaut", "Default wallet", "المحفظة الافتراضية", "默认钱包"],
  ["Supprimer", "Delete", "حذف", "删除"],
  ["Aucun moyen de retrait enregistré", "No withdrawal method found", "لا توجد وسيلة سحب مسجلة", "未记录提现方式"],
  ["Paiement crypto", "Crypto payment", "دفع بالعملات الرقمية", "加密货币支付"],
  ["Envoyez exactement", "Send exactly", "أرسل بالضبط", "准确发送"],
  ["Sélectionnez la devise", "Select currency", "اختر العملة", "选择货币"],
  ["Problème de rechargement", "Recharge issue", "مشكلة في إعادة الشحن", "充值问题"],
  ["Paiement DIAMANT", "DIAMANT payment", "دفع DIAMANT", "DIAMANT支付"],
  ["Partager", "Share", "مشاركة", "分享"],
  ["RECHARGEMENT", "RECHARGE", "إعادة شحن", "充值"],
  ["Montant du rechargement", "Recharge amount", "مبلغ إعادة الشحن", "充值金额"],
  ["Méthode de rechargement", "Recharge method", "طريقة إعادة الشحن", "充值方式"],
  ["Banque de dépôt", "Deposit bank", "بنك الإيداع", "存款银行"],
  ["Soumettre", "Submit", "إرسال", "提交"],
  ["Paiement indisponible", "Payment unavailable", "الدفع غير متاح", "支付不可用"],
  ["Image requise", "Image required", "الصورة مطلوبة", "需要图片"],
  ["Adresse copiée", "Address copied", "تم نسخ العنوان", "地址已复制"],
  ["Impossible de copier l’adresse", "Cannot copy address", "تعذر نسخ العنوان", "无法复制地址"],
  ["Montant minimum", "Minimum amount", "الحد الأدنى للمبلغ", "最低金额"],
  ["Votre numéro de portefeuille", "Your wallet number", "رقم محفظتك", "您的钱包号码"],
  ["Justificatif de rechargement", "Recharge proof", "إثبات إعادة الشحن", "充值凭证"],
  ["Temps", "Time", "الوقت", "时间"],
  ["Historique des dépôts", "Deposit history", "سجل الإيداعات", "存款历史"],
  ["Historique des retraits", "Withdrawal history", "سجل السحوبات", "提现历史"],
  ["Titulaire", "Account holder", "صاحب الحساب", "持有人"],
  ["Montant trop élevé", "Amount too high", "المبلغ مرتفع جداً", "金额过高"],
  ["Montant invalide", "Invalid amount", "مبلغ غير صالح", "金额无效"],
  ["Sélectionnez un compte", "Select an account", "اختر حساباً", "选择账户"],
  ["Veuillez lier un compte de retrait.", "Please link a withdrawal account.", "يرجى ربط حساب سحب.", "请绑定提现账户。"],
  ["Veuillez saisir le montant du retrait", "Please enter withdrawal amount", "يرجى إدخال مبلغ السحب", "请输入提现金额"],
  ["Voir l’historique des retraits", "View withdrawal history", "عرض سجل السحوبات", "查看提现历史"],
  ["Adresse de retrait", "Withdrawal address", "عنوان السحب", "提现地址"],
  ["Retrait", "Withdraw", "سحب", "提现"],
  ["Dépôt", "Deposit", "إيداع", "存款"],
  ["En attente", "Pending", "قيد الانتظار", "待处理"],
  ["Approuvé", "Approved", "مقبول", "已批准"],
  ["Rejeté", "Rejected", "مرفوض", "已拒绝"],
  ["Échec", "Failed", "فشل", "失败"],
  ["Frais", "Fee", "رسوم", "费用"],
  ["Montant net", "Net amount", "صافي المبلغ", "净额"],
  ["Sélectionner un pays", "Select country", "اختر دولة", "选择国家"],
  ["Rechercher un pays ou un indicatif", "Search country or code", "بحث عن دولة أو رمز", "搜索国家或代码"],
  ["Rechercher", "Search", "بحث", "搜索"],
  ["Search", "Search", "بحث", "搜索"],
  ["Aucun pays trouvé", "No country found", "لم يتم العثور على دولة", "未找到国家"],
  ["Pays sélectionné", "Selected country", "الدولة المختارة", "已选国家"],
  ["Liste des pays", "Country list", "قائمة الدول", "国家列表"],
  ["Total", "Total", "الإجمالي", "总计"],
  ["Aujourd’hui", "Today", "اليوم", "今日"],
  ["Revenus totaux", "Total earnings", "إجمالي الأرباح", "总收益"],
  ["Revenu cumulé", "Cumulative income", "الدخل التراكمي", "累计收益"],
  ["Gains reçus", "Received earnings", "الأرباح المستلمة", "已收收益"],
  ["Disponible en fin de cycle", "Available at cycle end", "متاح في نهاية الدورة", "周期结束时可用"],
  ["Mon produit", "My product", "منتجي", "我的产品"],
  ["Mes revenus", "My earnings", "أرباحي", "我的收益"],
  ["Aucun produit disponible", "No product available", "لا يوجد منتج متاح", "暂无产品"],
  ["Les gains du produit sont crédités automatiquement à la fin du cycle.", "Product earnings are credited automatically at the end of the cycle.", "تُضاف أرباح المنتج تلقائيًا عند نهاية الدورة.", "产品周期结束时，收益将自动计入收益余额。"],
  ["Vous pouvez acheter plusieurs appareils pour augmenter vos revenus", "Buy multiple devices to boost earnings", "يمكنك شراء عدة أجهزة لزيادة أرباحك", "购买多台设备以增加收益"],
  ["Règles DIAMANT", "DIAMANT rules", "قواعد DIAMANT", "DIAMANT规则"],
  ["Utilisation des produits DIAMANT", "Using DIAMANT products", "استخدام منتجات DIAMANT", "使用DIAMANT产品"],
  ["Rechargement & retrait", "Recharge & withdrawal", "إعادة الشحن والسحب", "充值与提现"],
  ["Programme de parrainage", "Referral program", "برنامج الإحالة", "推荐计划"],
  ["Bonus & récompenses", "Bonus & rewards", "المكافآت والجوائز", "奖金与奖励"],
  ["Sécurité & assistance", "Security & support", "الأمان والدعم", "安全与支持"],
  ["Chaque nouveau membre reçoit un bonus de", "Each new member gets a bonus of", "يحصل كل عضو جديد على مكافأة قدرها", "每位新成员获得奖金"],
  ["à l’inscription.", "upon registration.", "عند التسجيل.", "注册即可获得。"],
  ["Récompense aléatoire", "Random reward", "مكافأة عشوائية", "随机奖励"],
  ["Chaque pointage attribue automatiquement entre 50 et 100 XOF.", "Each check-in grants 50-100 XOF.", "كل تسجيل حضور يمنح تلقائياً ما بين 50 و100 XOF.", "每次签到自动获得50至100 XOF。"],
  ["Paramètres enregistrés !", "Settings saved!", "تم حفظ الإعدادات!", "设置已保存！"],
  ["Actif", "Active", "نشط", "激活"],
  ["Inactif", "Inactive", "غير نشط", "未激活"],
  ["Nom affiché", "Display name", "اسم العرض", "显示名称"],
  ["Réseau social", "Social network", "شبكة التواصل الاجتماعي", "社交网络"],
  ["Choisir…", "Choose…", "اختر…", "请选择…"],
  ["URL du lien", "Link URL", "رابط URL", "链接URL"],
  ["Portefeuille DIAMANT", "DIAMANT wallet", "محفظة DIAMANT", "DIAMANT 钱包"],
  ["Vos dépôts XOF", "Your XOF deposits", "إيداعاتك XOF", "您的 XOF 充值"],
  ["Vos retraits USDT BEP20", "Your USDT BEP20 withdrawals", "سحوباتك USDT BEP20", "您的 USDT BEP20 提现"],
  ["Vos gains et bonus", "Your earnings and bonuses", "أرباحك ومكافآتك", "您的收益和奖金"],
  ["Dépôts XOF", "XOF deposits", "إيداعات XOF", "XOF 充值"],
  ["Retraits USDT BEP20", "USDT BEP20 withdrawals", "سحوبات USDT BEP20", "USDT BEP20 提现"],
  ["Dépôt XOF", "XOF deposit", "إيداع XOF", "XOF 充值"],
  ["Retrait XOF", "XOF withdrawal", "سحب XOF", "XOF 提现"],
  ["Montant", "Amount", "المبلغ", "金额"],
  ["Référence", "Reference", "المرجع", "参考编号"],
  ["Date", "Date", "التاريخ", "日期"],
  ["Validé", "Approved", "تمت الموافقة", "已批准"],
  ["En cours", "Processing", "قيد المعالجة", "处理中"],
  ["Vérification requise", "Verification required", "التحقق مطلوب", "需要验证"],
  ["Refusé", "Rejected", "مرفوض", "已拒绝"],
  ["Échoué", "Failed", "فشل", "失败"],
  ["Net reçu", "Net received", "الصافي المستلم", "实际到账"],
  ["Aucune opération pour le moment", "No transactions yet", "لا توجد عمليات حالياً", "暂无交易"],
  ["Vos dépôts XOF apparaîtront ici.", "Your XOF deposits will appear here.", "ستظهر إيداعاتك XOF هنا.", "您的 XOF 充值将显示在这里。"],
  ["Vos retraits USDT BEP20 apparaîtront ici.", "Your USDT BEP20 withdrawals will appear here.", "ستظهر سحوباتك USDT BEP20 هنا.", "您的 USDT BEP20 提现将显示在这里。"],
  ["Aucun gain ou bonus pour le moment", "No earnings or bonuses yet", "لا توجد أرباح أو مكافآت حالياً", "暂无收益或奖金"],
  ["Vos gains, commissions et bonus apparaîtront ici.", "Your earnings, commissions and bonuses will appear here.", "ستظهر أرباحك وعمولاتك ومكافآتك هنا.", "您的收益、佣金和奖金将显示在这里。"],
  ["Rechercher un pays ou un indicatif", "Search country or code", "ابحث عن دولة أو رمز", "搜索国家或区号"],
  ["Liste des pays", "Country list", "قائمة الدول", "国家列表"],
  ["Pays sélectionné", "Selected country", "الدولة المختارة", "已选国家"],
  ["Selected country", "Selected country", "الدولة المختارة", "已选国家"],
  ["Search", "Search", "بحث", "搜索"],
  ["Latest transactions", "Latest transactions", "أحدث المعاملات", "最近交易"],
  ["Navigation principale", "Main navigation", "التنقل الرئيسي", "主导航"],
  ["Retour", "Back", "رجوع", "返回"],
  ["Back", "Back", "رجوع", "返回"],
  ["Crypto payment", "Crypto payment", "الدفع بالعملات الرقمية", "加密货币支付"],
  ["Send exactly", "Send exactly", "أرسل المبلغ بالضبط", "准确发送"],
  ["Recharge issue", "Recharge issue", "مشكلة في الشحن", "充值问题"],
  ["Enter your wallet number", "Enter your wallet number", "أدخل رقم محفظتك", "输入您的钱包号码"],
  ["Enter the recharge amount", "Enter the recharge amount", "أدخل مبلغ الشحن", "输入充值金额"],
  ["Recharge amount", "Recharge amount", "مبلغ الشحن", "充值金额"],
  ["Recharge method", "Recharge method", "طريقة الشحن", "充值方式"],
  ["Deposit bank", "Deposit bank", "بنك الإيداع", "存款银行"],
  ["If you have a recharge order that was not received, please submit the recharge information.", "If you have a recharge order that was not received, please submit the recharge information.", "إذا كان طلب الشحن لم يصل، يرجى إرسال معلومات الشحن.", "如果充值订单未到账，请提交充值信息。"],
  ["1. Your wallet number", "1. Your wallet number", "1. رقم محفظتك", "1. 您的钱包号码"],
  ["2. Recharge proof", "2. Recharge proof", "2. إثبات الشحن", "2. 充值凭证"],
  ["3. The latest recharge order has been processing for more than 20 minutes", "3. The latest recharge order has been processing for more than 20 minutes", "3. تتم معالجة أحدث طلب شحن منذ أكثر من 20 دقيقة", "3. 最新充值订单已处理超过 20 分钟"],
  ["DIAMANT member", "DIAMANT member", "عضو DIAMANT", "DIAMANT 会员"],
  ["My account", "My account", "حسابي", "我的账户"],
  ["More", "More", "المزيد", "更多"],
  ["Commission", "Commission", "العمولة", "佣金"],
  ["Users", "Users", "المستخدمون", "用户"],
  ["Rewards", "Rewards", "المكافآت", "奖励"],
  ["Utilisateurs totaux", "Total users", "إجمالي المستخدمين", "用户总数"],
  ["Récompenses totales", "Total rewards", "إجمالي المكافآت", "奖励总额"],
  ["Once your team members invest, the commission is credited to your account immediately and can be withdrawn instantly.", "Once your team members invest, the commission is credited to your account immediately and can be withdrawn instantly.", "عند استثمار أعضاء فريقك، تُضاف العمولة إلى حسابك فوراً ويمكن سحبها مباشرة.", "团队成员投资后，佣金会立即记入您的账户并可即时提现。"],
  ["No product purchased", "No product purchased", "لم يتم شراء أي منتج", "尚未购买产品"],
  ["Active product", "Active product", "المنتج النشط", "活跃产品"],
  ["Please select an image as your share proof.", "Please select an image as your share proof.", "يرجى اختيار صورة كإثبات للمشاركة.", "请选择一张图片作为分享证明。"],
  ["Please enter your share link and upload your share proof.", "Please enter your share link and upload your share proof.", "يرجى إدخال رابط المشاركة ورفع إثبات المشاركة.", "请输入分享链接并上传分享证明。"],
  ["Please enter your share link", "Please enter your share link", "يرجى إدخال رابط المشاركة", "请输入分享链接"],
  ["Back to currency selection", "Back to currency selection", "العودة إلى اختيار العملة", "返回货币选择"],
  ["Back to deposit amount", "Back to deposit amount", "العودة إلى مبلغ الشحن", "返回充值金额"],
  ["Back to deposit", "Back to deposit", "العودة إلى الشحن", "返回充值"],
  ["Back to home", "Back to home", "العودة إلى الرئيسية", "返回首页"],
  ["Deposit history", "Deposit history", "سجل الإيداعات", "充值记录"],
  ["Withdrawal type", "Withdrawal type", "نوع السحب", "提现类型"],
  ["Close selection", "Close selection", "إغلاق الاختيار", "关闭选择"],
  ["Open account settings", "Open account settings", "فتح إعدادات الحساب", "打开账户设置"],
  ["Share information form", "Share information form", "نموذج مشاركة المعلومات", "分享信息表单"],
  ["Go to previous page", "Go to previous page", "الانتقال إلى الصفحة السابقة", "转到上一页"],
  ["Go to next page", "Go to next page", "الانتقال إلى الصفحة التالية", "转到下一页"],
  ["Previous slide", "Previous slide", "الشريحة السابقة", "上一张幻灯片"],
  ["Next slide", "Next slide", "الشريحة التالية", "下一张幻灯片"],
  ["More pages", "More pages", "المزيد من الصفحات", "更多页面"],
  ["Close", "Close", "إغلاق", "关闭"],
  ["Conducteur rechargeant une voiture électrique dans une station DIAMANT", "Driver charging an electric car at a DIAMANT station", "سائق يشحن سيارة كهربائية في محطة DIAMANT", "司机正在 DIAMANT 充电站为电动汽车充电"],
  ["Borne de recharge DIAMANT", "DIAMANT charging station", "محطة شحن DIAMANT", "DIAMANT 充电桩"],
  ["Masquer le mot de passe", "Hide password", "إخفاء كلمة المرور", "隐藏密码"],
  ["Afficher le mot de passe", "Show password", "إظهار كلمة المرور", "显示密码"],
  ["Masquer la confirmation du mot de passe", "Hide password confirmation", "إخفاء تأكيد كلمة المرور", "隐藏密码确认"],
  ["Afficher la confirmation du mot de passe", "Show password confirmation", "إظهار تأكيد كلمة المرور", "显示密码确认"],
  ["Veuillez saisir le code cadeau", "Enter the gift code", "يرجى إدخال رمز الهدية", "请输入礼品码"],
  ["Use your browser menu to install the app.", "Use your browser menu to install the app.", "استخدم قائمة المتصفح لتثبيت التطبيق。", "请使用浏览器菜单安装应用。"],
  ["App installed successfully!", "App installed successfully!", "تم تثبيت التطبيق بنجاح！", "应用已成功安装！"],
  ["View all", "View all", "عرض الكل", "查看全部"],
  ["Voir tout", "View all", "عرض الكل", "查看全部"],
  ["Our partners", "Our partners", "شركاؤنا", "我们的合作伙伴"],
  ["Nos partenaires", "Our partners", "شركاؤنا", "我们的合作伙伴"],
  ["🔥 Les gains sont crédités automatiquement à la fin du cycle du produit", "🔥 Product earnings are automatically credited at the end of the product cycle", "🔥 تُضاف أرباح المنتج تلقائيًا عند انتهاء دورة المنتج", "🔥 产品周期结束时，收益将自动计入收益余额"],
  ["Les gains du produit sont crédités automatiquement sur le solde des gains à la fin du cycle indiqué. Aucune collecte manuelle n'est nécessaire.", "Product earnings are automatically credited to the earnings balance at the end of the specified cycle. No manual collection is needed.", "تُضاف أرباح المنتج تلقائيًا إلى رصيد الأرباح عند نهاية الدورة المحددة. لا حاجة إلى التحصيل اليدوي.", "产品收益将在指定周期结束时自动计入收益余额，无需手动领取。"],
  ["Les gains du produit sont crédités automatiquement sur le solde des gains à la fin de la durée indiquée. Aucune collecte manuelle n'est nécessaire.", "Product earnings are automatically credited to the earnings balance at the end of the listed cycle. No manual collection is needed.", "تُضاف أرباح المنتج تلقائيًا إلى رصيد الأرباح عند نهاية المدة المحددة. لا حاجة إلى التحصيل اليدوي.", "产品收益将在所示周期结束时自动计入收益余额，无需手动领取。"],
  ["- Chaque produit affiche son prix, sa durée et ses revenus avant l'achat\n- Les gains sont crédités automatiquement sur le solde des gains à la fin du cycle\n- Consultez les conditions du produit avant de confirmer", "- Each product shows its price, duration, and earnings before purchase\n- Earnings are credited automatically to the earnings balance at the end of the cycle\n- Review the product terms before confirming", "- يعرض كل منتج سعره ومدته وأرباحه قبل الشراء\n- تُضاف الأرباح تلقائيًا إلى رصيد الأرباح عند نهاية الدورة\n- راجع شروط المنتج قبل التأكيد", "- 每件产品在购买前都会显示价格、周期和收益\n- 周期结束时，收益将自动计入收益余额\n- 确认前请查看产品条款"],
];

const STATIC_UI_LOOKUP = new Map<string, StaticTranslationRow>();
STATIC_UI_TRANSLATIONS.forEach((row) => row.forEach((value) => STATIC_UI_LOOKUP.set(value, row)));

const WITHDRAWAL_PROOF_STATIC_TRANSLATIONS: StaticTranslationRow[] = [
  ["DIAMANT · COMMUNAUTÉ", "DIAMANT · COMMUNITY", "DIAMANT · المجتمع", "DIAMANT · 社区"],
  ["Preuves de retrait", "Withdrawal proofs", "إثباتات السحب", "提现证明"],
  ["Partager une preuve", "Share a proof", "شارك إثباتًا", "分享凭证"],
  ["Montrez votre retrait à la communauté", "Show your withdrawal to the community", "اعرض عملية السحب على المجتمع", "向社区展示您的提现"],
  ["VOTRE CONTRIBUTION", "YOUR CONTRIBUTION", "مساهمتك", "您的分享"],
  ["Ajouter une preuve", "Add a proof", "إضافة إثبات", "添加凭证"],
  ["Votre message", "Your message", "رسالتك", "您的留言"],
  ["Racontez brièvement votre expérience de retrait…", "Briefly describe your withdrawal experience…", "اكتب باختصار عن تجربة السحب…", "简要分享您的提现体验…"],
  ["Image prête", "Image ready", "الصورة جاهزة", "图片已就绪"],
  ["Aperçu de la preuve sélectionnée", "Preview of the selected proof", "معاينة الإثبات المحدد", "所选凭证预览"],
  ["Ajouter une capture", "Add a screenshot", "إضافة لقطة شاشة", "添加截图"],
  ["PNG, JPEG ou WebP · 5 Mo maximum", "PNG, JPEG, or WebP · 5 MB maximum", "PNG أو JPEG أو WebP · بحد أقصى 5 ميغابايت", "PNG、JPEG 或 WebP · 最大 5 MB"],
  ["Votre preuve ne sera visible par les autres membres qu’après validation par l’administration.", "Other members will only see your proof after the administration approves it.", "لن يظهر إثباتك للأعضاء الآخرين إلا بعد موافقة الإدارة.", "管理员批准后，其他成员才能看到您的凭证。"],
  ["Envoyer pour vérification", "Submit for review", "إرسال للمراجعة", "提交审核"],
  ["Envoi en cours…", "Sending…", "جارٍ الإرسال…", "正在发送…"],
  ["RETOURS DE LA COMMUNAUTÉ", "COMMUNITY SHARES", "مشاركات المجتمع", "社区分享"],
  ["Retraits vérifiés", "Verified withdrawals", "عمليات سحب موثقة", "已核实的提现"],
  ["Chargement des preuves", "Loading proofs", "جارٍ تحميل الإثباتات", "正在加载凭证"],
  ["Le fil ne peut pas être chargé", "The feed could not be loaded", "تعذر تحميل المنشورات", "无法加载动态"],
  ["Vérifiez votre connexion puis réessayez.", "Check your connection and try again.", "تحقق من اتصالك ثم أعد المحاولة.", "请检查网络连接后重试。"],
  ["Réessayer", "Try again", "أعد المحاولة", "重试"],
  ["Les premières preuves arrivent bientôt", "The first proofs will appear soon", "ستظهر أولى الإثباتات قريبًا", "首批凭证即将发布"],
  ["Vous pouvez aider la communauté en partageant votre expérience de retrait.", "Help the community by sharing your withdrawal experience.", "يمكنك مساعدة المجتمع بمشاركة تجربة السحب الخاصة بك.", "分享您的提现体验，帮助社区成员。"],
  ["Partager la première preuve", "Share the first proof", "شارك أول إثبات", "分享第一份凭证"],
  ["Vérifié", "Verified", "تم التحقق", "已核实"],
  ["Capture de retrait partagée", "Shared withdrawal screenshot", "لقطة شاشة لعملية سحب تمت مشاركتها", "分享的提现截图"],
  ["Capture de retrait", "Withdrawal screenshot", "لقطة شاشة للسحب", "提现截图"],
  ["Agrandir", "Enlarge", "تكبير", "放大"],
  ["Appuyez sur Échap ou sur le fond sombre pour fermer.", "Press Escape or click the dark backdrop to close.", "اضغط على مفتاح Escape أو انقر على الخلفية الداكنة للإغلاق.", "按 Esc 键或点击深色背景关闭。"],
  ["Prime de partage créditée", "Sharing bonus credited", "تمت إضافة مكافأة المشاركة", "分享奖励已入账"],
  ["Retour à l’accueil", "Back to home", "العودة إلى الرئيسية", "返回首页"],
  ["Preuve envoyée", "Proof submitted", "تم إرسال الإثبات", "凭证已提交"],
  ["Elle sera visible par les autres membres après validation par l’administration.", "Other members will see it after the administration approves it.", "سيتمكن الأعضاء الآخرون من رؤيتها بعد موافقة الإدارة.", "管理员批准后，其他成员即可查看。"],
  ["Envoi impossible", "Could not submit", "تعذر الإرسال", "提交失败"],
  ["L’envoi a échoué. Vérifiez votre connexion puis réessayez.", "Submission failed. Check your connection and try again.", "فشل الإرسال. تحقق من اتصالك ثم أعد المحاولة.", "提交失败。请检查网络连接后重试。"],
  ["Informations manquantes", "Missing information", "معلومات ناقصة", "信息不完整"],
  ["Ajoutez un message et une capture de votre retrait.", "Add a message and a screenshot of your withdrawal.", "أضف رسالة ولقطة شاشة لعملية السحب.", "请添加留言和提现截图。"],
  ["Format non pris en charge", "Unsupported format", "تنسيق غير مدعوم", "不支持的格式"],
  ["Choisissez une image PNG, JPEG ou WebP.", "Choose a PNG, JPEG, or WebP image.", "اختر صورة بصيغة PNG أو JPEG أو WebP.", "请选择 PNG、JPEG 或 WebP 图片。"],
  ["Image trop volumineuse", "Image is too large", "الصورة كبيرة جدًا", "图片过大"],
  ["La preuve doit faire 5 Mo ou moins.", "The proof must be 5 MB or smaller.", "يجب ألا يتجاوز حجم الإثبات 5 ميغابايت.", "凭证大小不得超过 5 MB。"],
  ["Image illisible", "Image could not be read", "تعذرت قراءة الصورة", "无法读取图片"],
  ["Impossible de lire cette image. Réessayez avec un autre fichier.", "This image could not be read. Try another file.", "تعذرت قراءة الصورة. جرّب ملفًا آخر.", "无法读取此图片。请换一个文件重试。"],
  ["Filtrer les preuves", "Filter proofs", "تصفية الإثباتات", "筛选凭证"],
  ["Actualiser la liste", "Refresh the list", "تحديث القائمة", "刷新列表"],
  ["En attente", "Pending", "قيد الانتظار", "待审核"],
  ["Approuvées", "Approved", "تمت الموافقة", "已批准"],
  ["Rejetées", "Rejected", "مرفوضة", "已拒绝"],
  ["Toutes", "All", "الكل", "全部"],
  ["Vérifiez chaque capture avant publication dans le fil des membres.", "Review each screenshot before publishing it to the member feed.", "راجع كل لقطة شاشة قبل نشرها في موجز الأعضاء.", "发布到成员动态前，请先审核每张截图。"],
  ["Note sur la prime de partage", "About the sharing bonus", "حول مكافأة المشاركة", "关于分享奖励"],
  ["La prime est créditée au solde des gains du membre lors de l’approbation, puis affichée avec la preuve. Un montant de 0 XOF ne crée aucun crédit.", "The bonus is credited to the member’s earnings balance when approved, then shown with the proof. An amount of 0 XOF creates no credit.", "تُضاف المكافأة إلى رصيد أرباح العضو عند الموافقة، ثم تُعرض مع الإثبات. لا يُضاف أي رصيد إذا كان المبلغ 0 XOF.", "批准后，奖励会记入成员的收益余额并显示在凭证旁。金额为 0 XOF 时不会入账。"],
  ["Aucune preuve dans cette sélection", "No proofs in this selection", "لا توجد إثباتات في هذا الاختيار", "此筛选条件下没有凭证"],
  ["Les nouvelles soumissions apparaîtront ici pour examen.", "New submissions will appear here for review.", "ستظهر الطلبات الجديدة هنا للمراجعة.", "新的提交会显示在这里供审核。"],
  ["Impossible de charger les preuves.", "Could not load the proofs.", "تعذر تحميل الإثباتات.", "无法加载凭证。"],
  ["Envoyée le", "Submitted on", "أُرسلت في", "提交于"],
  ["Capture de preuve de retrait", "Withdrawal proof screenshot", "لقطة شاشة لإثبات السحب", "提现凭证截图"],
  ["Agrandir la capture", "Enlarge screenshot", "تكبير لقطة الشاشة", "放大截图"],
  ["Prime à créditer (XOF)", "Bonus to credit (XOF)", "المكافأة المراد إضافتها (XOF)", "待入账奖励 (XOF)"],
  ["Saisissez un montant entier compris entre 0 et 2 147 483 647 XOF.", "Enter a whole amount from 0 to 2,147,483,647 XOF.", "أدخل مبلغًا صحيحًا من 0 إلى 2,147,483,647 XOF.", "请输入 0 至 2,147,483,647 XOF 之间的整数金额。"],
  ["Montant invalide", "Invalid amount", "مبلغ غير صالح", "金额无效"],
  ["Approuver", "Approve", "موافقة", "批准"],
  ["Rejeter", "Reject", "رفض", "拒绝"],
  ["Décision enregistrée", "Decision saved", "تم حفظ القرار", "决定已保存"],
  ["La liste des preuves a été actualisée.", "The proof list has been updated.", "تم تحديث قائمة الإثباتات.", "凭证列表已更新。"],
  ["Action impossible", "Action failed", "تعذر تنفيذ الإجراء", "操作失败"],
  ["La décision n’a pas été enregistrée. Actualisez la liste et réessayez.", "The decision was not saved. Refresh the list and try again.", "لم يتم حفظ القرار. حدّث القائمة ثم أعد المحاولة.", "未能保存决定。请刷新列表后重试。"],
  ["Prime affichée", "Bonus displayed", "المكافأة المعروضة", "已显示奖励"],
  ["Approuvée sans prime affichée", "Approved without a displayed bonus", "تمت الموافقة دون عرض مكافأة", "已批准，未显示奖励"],
  ["Preuve rejetée", "Proof rejected", "تم رفض الإثبات", "凭证已拒绝"],
  ["Traitée le", "Reviewed on", "تمت المراجعة في", "审核于"],
  ["Capture de preuve", "Proof screenshot", "لقطة شاشة للإثبات", "凭证截图"],
  ["Fermer la capture", "Close screenshot", "إغلاق لقطة الشاشة", "关闭截图"],
  ["Fermer le formulaire", "Close the form", "إغلاق النموذج", "关闭表单"],
  ["Approuvée", "Approved", "تمت الموافقة", "已批准"],
  ["Rejetée", "Rejected", "مرفوضة", "已拒绝"],
];
WITHDRAWAL_PROOF_STATIC_TRANSLATIONS.forEach((row) => row.forEach((value) => STATIC_UI_LOOKUP.set(value, row)));

// Catalog-backed labels can also be rendered directly by older JSX screens.
// Register every catalog value so changing language translates those labels
// in both directions instead of only translating the original French source.
Object.keys(fr).forEach((key) => {
  const translationKey = key as keyof Translations;
  const row: StaticTranslationRow = [
    fr[translationKey],
    en[translationKey],
    I18N_CATALOG.ar[translationKey],
    I18N_CATALOG.zh[translationKey],
  ];
  row.forEach((value) => STATIC_UI_LOOKUP.set(value, row));
});

function getStaticTranslation(source: string, lang: Lang) {
  const row = STATIC_UI_LOOKUP.get(source);
  if (!row) return lang === "en" ? translateLegacyFrenchToEnglish(source) : source;
  return row[lang === "fr" ? 0 : lang === "en" ? 1 : lang === "ar" ? 2 : 3];
}

type RenderedValue = { source: string; rendered: string };
const translatedTextNodes = new WeakMap<Text, RenderedValue>();
const translatedAttributes = new WeakMap<Element, Map<string, RenderedValue>>();
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "placeholder", "title", "alt"];

function translateStaticTextNode(node: Text, lang: Lang) {
  const current = node.nodeValue || "";
  const prior = translatedTextNodes.get(node);
  const source = prior && current === prior.rendered ? prior.source : current;
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const translated = `${leading}${getStaticTranslation(source.trim(), lang)}${trailing}`;
  translatedTextNodes.set(node, { source, rendered: translated });
  if (current !== translated) node.nodeValue = translated;
}

function translateStaticAttributes(element: Element, lang: Lang) {
  if (element.closest("[data-no-static-translation]")) return;
  const records = translatedAttributes.get(element) || new Map<string, RenderedValue>();
  TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
    const current = element.getAttribute(attribute);
    if (!current) return;
    const prior = records.get(attribute);
    const source = prior && current === prior.rendered ? prior.source : current;
    const translated = getStaticTranslation(source, lang);
    records.set(attribute, { source, rendered: translated });
    if (current !== translated) element.setAttribute(attribute, translated);
  });
  translatedAttributes.set(element, records);
}

function shouldSkipStaticTranslation(node: Node) {
  const parent = node.parentElement;
  return !parent ||
    ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "OPTION", "CODE", "PRE"].includes(parent.tagName) ||
    Boolean(parent.closest("[data-no-static-translation]"));
}

function StaticTranslationLayer({ lang }: { lang: Lang }) {
  useEffect(() => {
    const root = document.body;
    if (!root) return;

    const translateSubtree = (start: Node) => {
      if (start.nodeType === Node.TEXT_NODE) {
        if (!shouldSkipStaticTranslation(start)) translateStaticTextNode(start as Text, lang);
        return;
      }
      if (start.nodeType !== Node.ELEMENT_NODE) return;
      const element = start as Element;
      if (element.closest("[data-no-static-translation]")) return;
      translateStaticAttributes(element, lang);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        if (!shouldSkipStaticTranslation(textNode)) translateStaticTextNode(textNode as Text, lang);
      }
      element.querySelectorAll("*").forEach((child) => translateStaticAttributes(child, lang));
    };

    translateSubtree(root);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") translateSubtree(mutation.target);
        if (mutation.type === "attributes") translateSubtree(mutation.target);
        mutation.addedNodes.forEach((node) => translateSubtree(node));
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TRANSLATABLE_ATTRIBUTES });
    return () => observer.disconnect();
  }, [lang]);

  return null;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: I18N_CATALOG.en,
});

// Start every existing browser session in English after the interface cleanup.
// Users can still choose another language from the picker and that choice is
// persisted under the new key.
// Keep the stored preference key so existing users retain their language setting.
const STORAGE_KEY = "tgood_lang_v2";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      return saved && LANGUAGES.some((language) => language.code === saved) ? saved : "en";
    } catch {
      return "en";
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: I18N_CATALOG[lang] }}>
      <StaticTranslationLayer lang={lang} />
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
