import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const NEWS_ARTICLES = [
  {
    id: "1",
    title: "DIAMANT: innovative technology expertise",
    summary: "DIAMANT develops innovative technology solutions recognized for their design, performance, and quality.",
    body: `DIAMANT develops technology solutions designed for modern lifestyles.

The brand relies on innovation, design, and reliability to deliver a simple, high-performance experience.

Our platform builds on DIAMANT's identity to offer a clear and accessible investment experience.`,
    image: "",
    date: "Official source",
  },
  {
    id: "2",
    title: "DIAMANT investment products",
    summary: "The platform offers a complete range of investment products with attractive daily returns.",
    body: `The DIAMANT platform offers several product levels suited to every investor:

- VIP 1 to VIP 3: entry-level products available from 600 XOF
- VIP 4 to VIP 6: intermediate products with high returns
- VIP 7 to VIP 9: premium products for experienced investors

Each product generates daily earnings credited directly to your balance.

Earnings can be withdrawn through Mobile Money after approval by our team.`,
    image: "",
    date: "Official products",
  },
  {
    id: "3",
    title: "Quality, transparency, and service",
    summary: "DIAMANT is committed to transparency, security, and the satisfaction of every platform member.",
    body: `The DIAMANT platform is built on three fundamental pillars:

1. **Transparency** — All amounts, fees, and terms are clearly shown before every transaction.

2. **Security** — Your personal and financial data is protected by advanced security systems.

3. **Support** — Our team is available 7 days a week to answer your questions and support you.

Join the members who trust DIAMANT to grow their capital.`,
    image: "",
    date: "Quality & service",
  },
];

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const article = NEWS_ARTICLES.find((a) => a.id === params.id);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000000" }}>
        <p className="text-white/60">Article not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>
      <header className="flex items-center px-4 py-3" style={{ background: "#1e2e0a" }}>
        <button onClick={() => navigate("/service")} className="p-1" data-testid="button-back">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-white pr-8 line-clamp-1">
          {article.title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {article.image && (
          <img src={article.image} alt={article.title} className="w-full object-cover" style={{ maxHeight: 220 }} />
        )}
        <div className="p-5 space-y-4">
          <p className="text-white/50 text-xs">{article.date}</p>
          <h2 className="text-white font-bold text-lg leading-snug">{article.title}</h2>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{article.body}</p>
        </div>
      </div>
    </div>
  );
}
