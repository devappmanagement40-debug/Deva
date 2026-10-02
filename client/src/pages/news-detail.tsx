import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import cityGridImage from "@assets/generated_images/diamant-city-grid.jpg";
import productImage from "@assets/generated_images/diamant-product-bike-card.jpg";
import chargingImage from "@assets/generated_images/diamant-charging-station-hero.jpg";

type ArticleCopy = {
  title: string;
  summary: string;
  body: string;
  date: string;
};

export const NEWS_ARTICLES: {
  id: string;
  image: string;
  copy: Record<Lang, ArticleCopy>;
}[] = [
  {
    id: "1",
    image: cityGridImage,
    copy: {
      fr: {
        title: "Découvrir l’univers DIAMANT",
        summary: "Retrouvez les produits, les informations et les services réunis sur la plateforme.",
        body: `La page d’accueil rassemble les accès essentiels à votre espace DIAMANT.

Parcourez les produits, consultez les informations disponibles et utilisez les services de votre compte depuis une interface unique.

Les visuels illustrent les rubriques de la plateforme.`,
        date: "Plateforme DIAMANT",
      },
      en: {
        title: "Discover DIAMANT",
        summary: "Products, information and account services are brought together on the platform.",
        body: `The home page brings together the main areas of your DIAMANT account.

Browse products, read available information and access account services from one place.

Images are provided to illustrate platform sections.`,
        date: "DIAMANT platform",
      },
      ar: {
        title: "اكتشف DIAMANT",
        summary: "تجمع المنصة المنتجات والمعلومات وخدمات الحساب في مكان واحد.",
        body: `تجمع الصفحة الرئيسية الأقسام الأساسية في حساب DIAMANT.

تصفّح المنتجات واقرأ المعلومات المتاحة واستخدم خدمات الحساب من مكان واحد.

تُستخدم الصور لتوضيح أقسام المنصة.`,
        date: "منصة DIAMANT",
      },
      zh: {
        title: "了解 DIAMANT",
        summary: "平台汇集产品信息、资讯和账户服务。",
        body: `首页汇集了 DIAMANT 账户中的主要功能。

您可以浏览产品、查看现有资讯，并从一个页面进入账户服务。

图片用于展示平台的不同栏目。`,
        date: "DIAMANT 平台",
      },
    },
  },
  {
    id: "2",
    image: productImage,
    copy: {
      fr: {
        title: "Comprendre une fiche produit",
        summary: "Les fiches indiquent le prix, le revenu quotidien, la durée et le total affiché.",
        body: `Chaque fiche produit présente les informations associées à ce produit : prix, revenu quotidien, durée du cycle et revenu total affiché.

Consultez les montants et les conditions indiqués sur la fiche avant d’effectuer une action. Les valeurs affichées décrivent les paramètres du produit.`,
        date: "Guide des produits",
      },
      en: {
        title: "Understanding a product listing",
        summary: "Listings show the price, daily earnings, cycle length and displayed total.",
        body: `Each product listing shows its associated details: price, daily earnings, cycle length and displayed total return.

Review the amounts and terms shown on the listing before taking action. Displayed values describe the product settings.`,
        date: "Product guide",
      },
      ar: {
        title: "قراءة تفاصيل المنتج",
        summary: "تعرض التفاصيل السعر والدخل اليومي ومدة الدورة والإجمالي المعروض.",
        body: `تعرض كل بطاقة منتج تفاصيله: السعر والدخل اليومي ومدة الدورة والإجمالي المعروض.

راجع المبالغ والشروط الموضحة في البطاقة قبل اتخاذ أي إجراء. القيم المعروضة تصف إعدادات المنتج.`,
        date: "دليل المنتجات",
      },
      zh: {
        title: "了解产品详情",
        summary: "产品信息包含价格、每日收益、周期时长和显示的总额。",
        body: `每个产品详情页都会列出相关信息：价格、每日收益、周期时长以及显示的总回报。

操作前请查看页面上列出的金额和条件。显示的数值用于说明产品设置。`,
        date: "产品指南",
      },
    },
  },
  {
    id: "3",
    image: chargingImage,
    copy: {
      fr: {
        title: "Informations et services du compte",
        summary: "Retrouvez les informations et les accès aux services depuis votre espace membre.",
        body: `Votre espace membre donne accès aux informations de la plateforme et aux services liés au compte.

Pour une question sur votre compte, ouvrez la rubrique Service client. Les informations affichées dans l’application restent accessibles depuis les sections correspondantes.`,
        date: "Espace membre",
      },
      en: {
        title: "Account information and services",
        summary: "Find platform information and account service links in your member area.",
        body: `Your member area provides access to platform information and account-related services.

For an account question, open Customer service. Information shown in the app can also be found in its corresponding section.`,
        date: "Member area",
      },
      ar: {
        title: "معلومات الحساب وخدماته",
        summary: "اعثر على معلومات المنصة وروابط خدمات الحساب في مساحة العضوية.",
        body: `تتيح مساحة العضوية الوصول إلى معلومات المنصة والخدمات المرتبطة بالحساب.

للاستفسار عن الحساب، افتح قسم خدمة العملاء. ويمكنك أيضًا العثور على المعلومات المعروضة في التطبيق ضمن القسم المقابل.`,
        date: "مساحة العضوية",
      },
      zh: {
        title: "账户信息与服务",
        summary: "在会员空间中查看平台信息和账户服务入口。",
        body: `会员空间提供平台信息和账户相关服务入口。

如有账户问题，请打开客户服务栏目。应用中显示的信息也可在对应栏目中查看。`,
        date: "会员空间",
      },
    },
  },
];

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();

  const article = NEWS_ARTICLES.find((a) => a.id === params.id);
  const articleCopy = article?.copy[lang];

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000000" }} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
        <p className="text-white/60">{t.articleNotFound}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="flex items-center px-4 py-3" style={{ background: "#1e2e0a" }} lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
        <button onClick={() => navigate("/service")} className="p-1" data-testid="button-back" aria-label={t.back}>
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-white pr-8 line-clamp-1">
          {articleCopy?.title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        <img src={article.image} alt="" className="w-full object-cover" style={{ maxHeight: 220 }} />
        <div className="p-5 space-y-4">
          <p className="text-white/50 text-xs">{articleCopy?.date}</p>
          <h2 className="text-white font-bold text-lg leading-snug">{articleCopy?.title}</h2>
          <p className="text-white/65 text-sm leading-relaxed">{articleCopy?.summary}</p>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{articleCopy?.body}</p>
        </div>
      </div>
    </div>
  );
}
