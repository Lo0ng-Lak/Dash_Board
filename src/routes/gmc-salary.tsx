import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GmcSalarySummary } from "@/components/gmc-salary-summary";
import { getAllDataWeb, getGMCRegData, isValidGmcWebDomain } from "@/lib/dataService";
import { parseDmyDate } from "@/lib/kpiWeek";

const parseGmcMonth = (dateGMC: string): string | null => {
  const d = parseDmyDate(dateGMC);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const Route = createFileRoute("/gmc-salary")({
  component: GmcSalaryPage,
});

function GmcSalaryPage() {
  const { t } = useTranslation();
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 30000,
  });
  const { data: webRaw = [], isLoading: webLoading } = useQuery({
    queryKey: ["allDataWeb"],
    queryFn: () => getAllDataWeb(true),
    refetchInterval: 30000,
  });

  const rows = useMemo(
    () =>
      raw
        .filter((item) => isValidGmcWebDomain(item.domain))
        .map((item) => ({
          domain: item.domain,
          dev: item.dev?.trim() || "",
          dateGMC: item.dateGMC,
          status: item.status,
          linkAdsEgead: item.linkAdsEgead,
          daysGreen: item.daysGreen,
        })),
    [raw],
  );

  const webRows = useMemo(
    () =>
      webRaw.map((item) => ({
        domain: item.domain,
        dev: item.dev?.trim() || "",
        status: item.status,
        webType: item.webType,
        completedDate: item.completedDate,
        rawCompletedDate: item.rawCompletedDate,
        month: item.month,
      })),
    [webRaw],
  );

  if (isLoading || webLoading) {
    return (
      <div className="p-10 text-center font-medium text-slate-400 animate-pulse">
        {t("loadingSystemData")}
      </div>
    );
  }

  return (
    <div className="min-h-full p-8 text-foreground">
      <div className="max-w-7xl mx-auto">
        <GmcSalarySummary rows={rows} webRows={webRows} parseMonth={parseGmcMonth} />
      </div>
    </div>
  );
}
