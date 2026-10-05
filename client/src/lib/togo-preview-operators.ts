import type { PaymentNumber } from "@shared/schema";

function getConfiguredTemplate(
  operators: PaymentNumber[],
  namePattern: RegExp,
): string | null {
  return operators.find((operator) => {
    const normalizedName = operator.operatorName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return namePattern.test(normalizedName);
  })?.ussdTemplate ?? null;
}

export function getTogoDevelopmentPreviewOperators(
  configuredOperators: PaymentNumber[],
): PaymentNumber[] {
  return [
    {
      id: -228001,
      ownerName: "DIAMANT",
      phone: "+228 00 00 00 00",
      operatorName: "TMoney",
      country: "TG",
      channelId: null,
      logoUrl: "/images/operators/tmoney.svg",
      paymentRecipientLabel: "TMoney",
      paymentBadgeLabel: "CARTE MARCHAND",
      ussdTemplate: getConfiguredTemplate(
        configuredOperators,
        /(tmoney|togocom|togocel|yas)/,
      ),
      paymentUrl: null,
      paymentQrDataUrl: null,
      isActive: true,
      createdAt: new Date(0),
      createdBy: null,
    },
    {
      id: -228002,
      ownerName: "DIAMANT",
      phone: "+228 11 11 11 11",
      operatorName: "Moov Money",
      country: "TG",
      channelId: null,
      logoUrl: "/images/operators/moov.webp",
      paymentRecipientLabel: "Moov Money",
      paymentBadgeLabel: "CARTE MARCHAND",
      ussdTemplate: getConfiguredTemplate(configuredOperators, /moov/),
      paymentUrl: null,
      paymentQrDataUrl: null,
      isActive: true,
      createdAt: new Date(0),
      createdBy: null,
    },
  ];
}
