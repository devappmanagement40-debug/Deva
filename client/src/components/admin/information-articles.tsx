import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/admin/image-uploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lang } from "@/lib/i18n";
import {
  ARTICLE_LANGUAGES,
  ARTICLE_SETTING_KEY,
  NEWS_ARTICLES,
  resolveInfoArticles,
  type NewsArticle,
} from "@/data/diamant-info-articles";

const LANGUAGE_LABELS: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  zh: "中文",
};

function countArticleLength(text: string, lang: Lang): number {
  if (lang === "zh") {
    return Array.from(text.replace(/\s/g, "").replace(/[，。！？；：、‘’“”《》〈〉「」『』（）()…—-]/g, "")).length;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface InformationArticlesAdminProps {
  settings: Record<string, string> | undefined;
}

export default function InformationArticlesAdmin({ settings }: InformationArticlesAdminProps) {
  const { toast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>(NEWS_ARTICLES);
  const [activeLanguages, setActiveLanguages] = useState<Record<string, Lang>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings && !dirty) setArticles(resolveInfoArticles(settings));
  }, [settings, dirty]);

  const saveMutation = useMutation({
    mutationFn: async (nextArticles: NewsArticle[]) => {
      const response = await apiRequest("POST", "/api/admin/settings", {
        key: ARTICLE_SETTING_KEY,
        value: JSON.stringify(nextArticles),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Impossible d’enregistrer les informations.");
      }
      return nextArticles;
    },
    onSuccess: async () => {
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Informations DIAMANT enregistrées" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  function updateImage(articleId: string, image: string) {
    setArticles((current) => current.map((article) =>
      article.id === articleId ? { ...article, image } : article,
    ));
    setDirty(true);
  }

  function updateCopy(
    articleId: string,
    lang: Lang,
    field: "title" | "summary" | "body" | "date" | "imageNotice",
    value: string,
  ) {
    setArticles((current) => current.map((article) =>
      article.id === articleId
        ? {
            ...article,
            copy: {
              ...article.copy,
              [lang]: { ...article.copy[lang], [field]: value },
            },
          }
        : article,
    ));
    setDirty(true);
  }

  return (
    <Card className="mb-5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-primary" />
          Informations de l’accueil — DIAMANT
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Les trois cartes sont visibles sur l’accueil. Choisissez une image et modifiez le titre, le résumé ou l’article dans chaque langue.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          Les photos illustrent les secteurs miniers; elles ne prouvent pas que DIAMANT possède ou exploite les sites représentés.
        </p>

        {articles.map((article, index) => {
          const selectedLanguage = activeLanguages[article.id] || "fr";
          return (
            <section key={article.id} className="space-y-4 rounded-xl border p-4">
              <h3 className="font-semibold">
                Carte {index + 1}: {article.copy.fr.title}
              </h3>
              <ImageUploader
                value={article.image}
                onChange={(url) => updateImage(article.id, url)}
                label="Image de la carte — aperçu"
                maxSizeMb={10}
                previewHeight={180}
              />

              <Tabs
                value={selectedLanguage}
                onValueChange={(value) =>
                  setActiveLanguages((current) => ({ ...current, [article.id]: value as Lang }))
                }
              >
                <TabsList className="grid h-auto w-full grid-cols-4">
                  {ARTICLE_LANGUAGES.map((lang) => (
                    <TabsTrigger key={lang} value={lang} className="px-2 py-2 text-xs sm:text-sm">
                      {LANGUAGE_LABELS[lang]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {ARTICLE_LANGUAGES.map((lang) => {
                  const copy = article.copy[lang];
                  const length = countArticleLength(copy.body, lang);
                  return (
                    <TabsContent key={lang} value={lang} className="space-y-4 pt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`info-${article.id}-${lang}-date`}>Étiquette de l’article</Label>
                        <Input
                          id={`info-${article.id}-${lang}-date`}
                          value={copy.date}
                          disabled={saveMutation.isPending}
                          onChange={(event) => updateCopy(article.id, lang, "date", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`info-${article.id}-${lang}-title`}>Titre</Label>
                        <Input
                          id={`info-${article.id}-${lang}-title`}
                          value={copy.title}
                          disabled={saveMutation.isPending}
                          onChange={(event) => updateCopy(article.id, lang, "title", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`info-${article.id}-${lang}-summary`}>Résumé de la carte</Label>
                        <Textarea
                          id={`info-${article.id}-${lang}-summary`}
                          value={copy.summary}
                          rows={2}
                          disabled={saveMutation.isPending}
                          onChange={(event) => updateCopy(article.id, lang, "summary", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`info-${article.id}-${lang}-image-notice`}>Texte d’avertissement de l’image</Label>
                        <Textarea
                          id={`info-${article.id}-${lang}-image-notice`}
                          value={copy.imageNotice}
                          rows={2}
                          disabled={saveMutation.isPending}
                          onChange={(event) => updateCopy(article.id, lang, "imageNotice", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Label htmlFor={`info-${article.id}-${lang}-body`}>Article complet</Label>
                          <span className="text-xs text-muted-foreground">
                            {length.toLocaleString(lang)} {lang === "zh" ? "caractères chinois" : "mots"}
                            {lang === "zh"
                              ? length < 2_000 ? " — objectif : environ 2 000 caractères chinois" : ""
                              : length < 1_100 ? " — objectif : environ 1 200 mots" : ""}
                          </span>
                        </div>
                        <Textarea
                          id={`info-${article.id}-${lang}-body`}
                          value={copy.body}
                          rows={22}
                          className="min-h-[420px] font-normal leading-relaxed"
                          disabled={saveMutation.isPending}
                          onChange={(event) => updateCopy(article.id, lang, "body", event.target.value)}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </section>
          );
        })}

        <Button
          type="button"
          className="w-full"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate(articles)}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer les trois informations
        </Button>
      </CardContent>
    </Card>
  );
}