import type { Lang } from "@/lib/i18n";

export type ProductCardCopy = {
  daily: string;
  term: string;
  days: string;
  total: string;
  priceLabel: string;
};

export const PRODUCT_CARD_COPY: Record<Lang, ProductCardCopy> = {
  fr: {
    daily: "Revenu quotidien",
    term: "Jours de revenu",
    days: "jours",
    total: "Revenu total",
    priceLabel: "Prix",
  },
  en: {
    daily: "Daily revenue",
    term: "Revenue days",
    days: "days",
    total: "Total revenue",
    priceLabel: "Price",
  },
  ar: {
    daily: "العائد اليومي",
    term: "أيام الربح",
    days: "أيام",
    total: "إجمالي العائد",
    priceLabel: "السعر",
  },
  zh: {
    daily: "每日收益",
    term: "收益天数",
    days: "天",
    total: "总收益",
    priceLabel: "价格",
  },
};
