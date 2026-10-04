import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useI18n } from "@/lib/i18n";
import { resolveInfoArticles } from "@/data/diamant-info-articles";

function ArticleBody({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const heading = block.match(/^##\s+(.+)$/);
        if (heading) {
          return (
            <h3 key={`${index}-${heading[1]}`} className="pt-2 text-base font-bold leading-snug text-white">
              {heading[1]}
            </h3>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line text-sm leading-relaxed text-white/80">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default function NewsArticlePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const article = resolveInfoArticles(settings).find((item) => item.id === params.id);
  const articleCopy = article?.copy[lang];

  if (!article || !articleCopy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
        <p className="text-white/60">{t.articleNotFound}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-10 flex items-center bg-[#1e2e0a] px-4 py-3">
        <button
          onClick={() => navigate("/")}
          className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          data-testid="button-back"
          aria-label={t.back}
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <h1 className="flex-1 line-clamp-2 pr-8 text-center text-base font-bold text-white">
          {articleCopy.title}
        </h1>
      </header>

      <main className="flex-1 pb-20">
        <img
          src={article.image}
          alt={articleCopy.title}
          className="max-h-[320px] w-full object-cover"
        />
        <p className="mx-auto max-w-3xl px-5 pt-3 text-xs leading-relaxed text-white/45">
          {articleCopy.imageNotice}
        </p>
        <article className="mx-auto max-w-3xl space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{articleCopy.date}</p>
          <h2 className="text-xl font-bold leading-snug text-white">{articleCopy.title}</h2>
          <p className="text-sm leading-relaxed text-white/65">{articleCopy.summary}</p>
          <ArticleBody body={articleCopy.body} />
        </article>
      </main>
    </div>
  );
}