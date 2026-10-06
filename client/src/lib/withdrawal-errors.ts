export type WithdrawalErrorContext = "request" | "pin-reset";

const safeServerMessages: Record<string, string> = {
  "Solde insuffisant": "Solde de gains insuffisant.",
  "Retraits bloqués sur ce compte": "Les retraits sont bloqués sur ce compte.",
  "Montant de retrait invalide": "Saisissez un montant entier valide.",
  "Non authentifié": "Votre session a expiré. Reconnectez-vous.",
  "Saisissez votre code PIN de sécurité": "Saisissez votre code PIN de retrait.",
  "Vous devez posséder un produit actif pour effectuer un retrait.": "Un produit actif est requis pour effectuer un retrait.",
  "Les retraits sont temporairement désactivés par l'administration": "Les retraits sont désactivés pour le moment.",
  "Invitez quelqu'un qui investit": "La condition d’invitation n’est pas encore remplie.",
  "Les limites de retrait sont mal configurées. Contactez l'administration.": "Les paramètres de retrait sont temporairement indisponibles.",
  "Les frais de retrait sont mal configurés.": "Les paramètres de retrait sont temporairement indisponibles.",
  "La limite quotidienne de retrait est mal configurée. Contactez l'administration.": "Les paramètres de retrait sont temporairement indisponibles.",
  "Impossible de calculer les frais de retrait.": "Les paramètres de retrait sont temporairement indisponibles.",
  "Le moyen de retrait sélectionné est invalide.": "Sélectionnez un moyen de retrait valide.",
  "Ce moyen de retrait n'est plus disponible. Sélectionnez un compte à jour.": "Le moyen de retrait sélectionné n’est plus disponible. Choisissez-en un autre.",
  "Veuillez ajouter un moyen de retrait avant de retirer": "Ajoutez un moyen de retrait avant de continuer.",
  "Sélectionnez un moyen de retrait Mobile Money ou USDT BEP20 valide.": "Sélectionnez un moyen de retrait Mobile Money ou USDT valide.",
  "Cet opérateur Mobile Money n'est pas actif pour votre pays.": "L’opérateur Mobile Money sélectionné n’est pas disponible dans votre pays.",
  "Impossible de créer le retrait pour le moment. Réessayez plus tard.": "Le retrait n’a pas pu être confirmé. Consultez l’historique avant de réessayer.",
  "Veuillez remplir tous les champs": "Saisissez le mot de passe du compte et le nouveau code PIN.",
  "Le code PIN ne peut pas dépasser 72 octets": "Le code PIN est trop long. Choisissez un code plus court.",
  "Une réinitialisation du PIN n'a pas été demandée": "La réinitialisation du code PIN n’est pas disponible pour ce compte.",
  "Mot de passe du compte incorrect": "Le mot de passe du compte est incorrect.",
  "Impossible de réinitialiser le PIN de retrait": "La réinitialisation du code PIN n’a pas abouti. Réessayez plus tard.",
};

export function getSafeWithdrawalErrorMessage(
  error: unknown,
  context: WithdrawalErrorContext,
  pinIncorrectMessage: string,
): string {
  const candidate = error instanceof Error ? error : new Error("");
  const metadata = candidate as Error & { code?: string };
  const message = candidate.message.trim();

  if (metadata.code === "INVALID_TRANSACTION_PIN") return pinIncorrectMessage;
  if (metadata.code === "TRANSACTION_PIN_RESET_REQUIRED") {
    return "Réinitialisez votre code PIN de retrait pour continuer.";
  }
  if (
    error instanceof TypeError
    || /^(failed to fetch|network error|network request failed|load failed)$/i.test(message)
  ) {
    return context === "request"
      ? "Connexion interrompue. Consultez l’historique avant de réessayer."
      : "Connexion interrompue. Vérifiez si le code PIN a été modifié avant de recommencer.";
  }

  const safeMessage = safeServerMessages[message];
  if (safeMessage) return safeMessage;

  const attemptLimit = message.match(/^Trop de tentatives(?: de PIN)?\. Réessayez dans (\d+) minute\(s\)\.$/);
  if (attemptLimit) return `Trop de tentatives. Réessayez dans ${attemptLimit[1]} min.`;

  const amountLimit = message.match(/^Montant (minimum|maximum)\s*:?\s*([\d\s\u00a0\u202f,.']+)\s*XOF$/);
  if (amountLimit) {
    const amount = Number(amountLimit[2].replace(/[^\d]/g, ""));
    if (Number.isSafeInteger(amount)) {
      return amountLimit[1] === "minimum"
        ? `Le montant minimum de retrait est ${amount.toLocaleString("fr-FR")} XOF.`
        : `Le montant dépasse le maximum autorisé de ${amount.toLocaleString("fr-FR")} XOF.`;
    }
  }

  const dailyLimit = message.match(/^Maximum (\d+) retraits? par jour$/);
  if (dailyLimit) return `Limite quotidienne atteinte : ${dailyLimit[1]} retrait(s) maximum.`;

  const allowedDays = message.match(/^Les retraits sont disponibles uniquement : ([A-Za-zÀ-ÿ\s,]+)$/);
  if (allowedDays) return `Les retraits ne sont pas disponibles aujourd’hui. Jours autorisés : ${allowedDays[1].trim()}.`;

  const allowedHours = message.match(/^Les retraits sont disponibles de (\d{1,2})h à (\d{1,2})h$/);
  if (allowedHours) return `Effectuez le retrait entre ${allowedHours[1]} h et ${allowedHours[2]} h.`;

  return context === "request"
    ? "Le retrait n’a pas pu être confirmé. Consultez l’historique avant de réessayer."
    : "Le code PIN n’a pas pu être réinitialisé. Vérifiez les informations puis réessayez.";
}
