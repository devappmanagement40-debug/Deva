import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getContent, rebrandText } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { ProductOrderCard } from "@/components/product-order-card";
import { formatProductCardAmount } from "@/components/product-card-frame";

function isProductActive(product: any): boolean {
  return product.status === "active" && Number(product.daysRemaining) > 0;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const { data: userProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
    refetchInterval: 60_000,
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const headerTitle = getContent(settings, "content_orders_headerTitle", t.myProductsTitle);

  const filteredProducts = userProducts?.filter((up: any) =>
    activeTab === "active" ? isProductActive(up) : !isProductActive(up)
  ) || [];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0d0d" }}>
      <div className="sticky top-0 z-[80] shrink-0 bg-[#0d0d0d]">
        <header className="px-4 py-3 border-b border-white/20">
          <h1 className="text-lg font-semibold text-white text-center">{headerTitle}</h1>
        </header>

        <div className="flex border-b border-white/20">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "text-white border-b-2 border-white"
                : "text-white/50"
            }`}
            data-testid="orders-tab-active"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            {t.ordersOngoing}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "completed"
                ? "text-white border-b-2 border-white"
                : "text-white/50"
            }`}
            data-testid="orders-tab-completed"
          >
            <span className={activeTab === "completed" ? "text-white" : "text-white/50"}>&#10003;</span>
            {t.ordersCompleted}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((up: any) => {
              const productIsActive = isProductActive(up);
              const daysCompleted = (up.product?.cycleDays || 0) - (up.daysRemaining || 0);
              const totalEarned = Number(up.totalEarned ?? daysCompleted * Number(up.product?.dailyEarnings || 0));
              const purchaseDateTime = up.purchasedAt ? new Date(up.purchasedAt) : null;
              const purchaseDate = purchaseDateTime ? purchaseDateTime.toLocaleDateString() : '-';
              const purchaseTime = purchaseDateTime ? purchaseDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-';
              const cycleDays = Number(up.product?.cycleDays);
              const expirationDateTime = purchaseDateTime
                && Number.isFinite(purchaseDateTime.getTime())
                && Number.isSafeInteger(cycleDays)
                && cycleDays > 0
                ? new Date(purchaseDateTime.getTime() + cycleDays * 24 * 60 * 60 * 1000)
                : null;
              const expirationDate = expirationDateTime?.toLocaleDateString() ?? "-";
              const expirationTime = expirationDateTime
                ? expirationDateTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                : "";
              const product = up.product ?? {
                price: "0",
                imageUrl: null,
                cardColor: null,
              };
              const details = [
                {
                  label: t.ordersDailyLbl,
                  value: <>{formatProductCardAmount(Number(product.dailyEarnings || 0))} <small>XOF</small></>,
                },
                {
                  label: t.ordersCycleLbl,
                  value: `${product.cycleDays || 0} ${t.ordersDaysLbl}`,
                },
                {
                  label: t.totalRevenue,
                  value: <>{formatProductCardAmount(Number(product.totalReturn || 0))} <small>XOF</small></>,
                },
                ...(productIsActive ? [{
                  label: t.ordersRemainingLbl,
                  value: `${up.daysRemaining || 0} ${t.ordersDaysLbl}`,
                }] : []),
                {
                  label: t.ordersTotalEarnedLbl,
                  value: <>{formatProductCardAmount(totalEarned)} <small>XOF</small></>,
                },
                {
                  label: t.ordersDateLbl,
                  value: purchaseDateTime ? `${purchaseDate} · ${purchaseTime}` : "-",
                  className: "diamant-order-date-row",
                },
                {
                  label: t.ordersExpirationLbl,
                  value: expirationDateTime ? `${expirationDate} · ${expirationTime}` : "-",
                  className: "diamant-order-date-row",
                },
              ];

              return (
                <ProductOrderCard
                  key={up.id}
                  product={product}
                  displayName={rebrandText(product.name || t.noProducts)}
                  details={details}
                  active={productIsActive}
                  statusLabel={productIsActive ? t.ordersOngoing : t.ordersStatusDone}
                  rootTestId={`order-card-${up.id}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-4 opacity-50">
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                <ellipse cx="50" cy="85" rx="35" ry="8" fill="currentColor" opacity="0.3"/>
                <circle cx="50" cy="45" r="25" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M50 25 L50 20 M50 65 L50 70" stroke="currentColor" strokeWidth="3"/>
                <circle cx="50" cy="45" r="8" fill="currentColor"/>
                <path d="M30 75 L70 75 L75 85 L25 85 Z" fill="currentColor" opacity="0.5"/>
                <path d="M45 30 Q50 15 55 30" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <p className="text-gray-500 font-medium">{t.ordersNone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
