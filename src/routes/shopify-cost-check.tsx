import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ShopifyCostReconcile } from "@/components/shopify-cost-reconcile";

function ShopifyCostCheckPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
            {t("shopifyMgmt")}
          </p>
          <h1 className="text-3xl font-black tracking-tight">{t("shopifyCostNav")}</h1>
          <p className="text-slate-500 font-medium text-sm">{t("shopifyCostCheckDesc")}</p>
        </div>
        <ShopifyCostReconcile />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/shopify-cost-check")({
  component: ShopifyCostCheckPage,
});
