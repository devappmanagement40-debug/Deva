const MAX_PAYMENT_QR_FILE_BYTES = 1_000_000;
const PAYMENT_QR_DATA_URL_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function readPaymentQrDataUrl(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choisissez un QR au format JPG, PNG ou WebP."));
  }
  if (file.size > MAX_PAYMENT_QR_FILE_BYTES) {
    return Promise.reject(new Error("Le QR doit faire au maximum 1 Mo."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.onload = () => {
      if (typeof reader.result !== "string" || !PAYMENT_QR_DATA_URL_PATTERN.test(reader.result)) {
        reject(new Error("Le fichier ne contient pas une image QR valide."));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
