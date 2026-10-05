const MAX_PAYMENT_QR_DATA_URL_LENGTH = 1_400_000;
const MAX_PAYMENT_QR_FILE_SIZE = 1024 * 1024;
const PAYMENT_QR_DATA_URL_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isPaymentQrDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_PAYMENT_QR_DATA_URL_LENGTH &&
    PAYMENT_QR_DATA_URL_PATTERN.test(value)
  );
}

export function readPaymentQrImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choisissez une image PNG, JPG ou WebP."));
  }
  if (file.size > MAX_PAYMENT_QR_FILE_SIZE) {
    return Promise.reject(new Error("L’image du QR doit faire 1 Mo maximum."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (isPaymentQrDataUrl(reader.result)) {
        resolve(reader.result);
      } else {
        reject(new Error("Le fichier ne contient pas une image QR valide."));
      }
    };
    reader.onerror = () => reject(new Error("Impossible de lire l’image QR."));
    reader.readAsDataURL(file);
  });
}
