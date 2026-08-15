import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getGMCRegData, isValidGmcWebDomain } from "../lib/dataService";
import { DevKpiTabs } from "@/components/dev-kpi-tabs";
import { GmcKpiSummaryTable } from "@/components/gmc-kpi-summary-table";
import { MonthFilterTabs } from "@/components/month-filter-tabs";
import { Pagination } from "../components/pagination";
import { fmtMonthShort, getCurrentMonthKey, parseDmyDate } from "@/lib/kpiWeek";

const parseGmcMonth = (dateGMC: string): string | null => {
  const d = parseDmyDate(dateGMC);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

interface GMCRegItem {
  proxy: string;
  proxyExpiry: string;
  twoFA: string;
  domain: string;
  dateGMC: string;
  reportDateGMC: string;
  webType: string;
  status: string;
  dev: string;
  adsDate: string;
  linkAdsEgead: string;
  dateSus: string;
  reportDateSus: string;
  cost: string;
  daysGreen?: string;
  note: string;
}

function ReportCell({ value, linkLabel }: { value: string; linkLabel: string }) {
  if (!value || value === "—") {
    return <span className="text-slate-300">—</span>;
  }
  if (/^https?:\/\//i.test(value.trim())) {
    return (
      <a
        href={value.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
      >
        {linkLabel}
      </a>
    );
  }
  return <div className="text-xs font-bold text-slate-600 break-words">{value}</div>;
}

function LinkAdsEgeadCell({ value }: { value: string }) {
  if (!value || value === "—") {
    return <span className="text-slate-300">—</span>;
  }
  const s = value.toLowerCase();
  let cls = "bg-slate-50 text-slate-600 border border-slate-100";
  if (s.includes("đã link") || s.includes("da link")) {
    cls = "bg-emerald-50 text-emerald-700 border border-emerald-100";
  } else if (s.includes("chưa link") || s.includes("chua link")) {
    cls = "bg-orange-50 text-orange-700 border border-orange-100";
  } else if (s.includes("gỡ ads") || s.includes("go ads")) {
    cls = "bg-blue-50 text-blue-700 border border-blue-100";
  }
  return (
    <span className={`inline-block text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-wide leading-tight ${cls}`}>
      {value}
    </span>
  );
}

export const Route = createFileRoute("/customers")({
  component: GMCPremiumDashboard,
});

function GMCPremiumDashboard() {
  const { t } = useTranslation(); // 🌐 Gọi hook sử dụng đa ngôn ngữ

  // ==========================================
  // FILTERS & PAGINATION STATE MANAGEMENT
  // ==========================================
  const [searchDomain, setSearchDomain] = useState("");
  const [devFilter, setDevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [webTypeFilter, setWebTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load GMC REG data from API
  const { data: rawRegData = [], isLoading } = useQuery<GMCRegItem[]>({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 30000,
  });

  const regData = useMemo(
    () => rawRegData.filter((item) => isValidGmcWebDomain(item.domain)),
    [rawRegData],
  );

  // Reverse array of original data (new records first)
  const orderedFullData = useMemo(() => {
    return [...regData].reverse();
  }, [regData]);

  // Helper function để check trạng thái thiết bị linh hoạt
  const isSuspended = (status: string) => {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    if (!s || s === "—") return false;
    if (s === "xanh" || s.includes("chưa sus")) return false;
    return s.includes("sus") || s === "die" || s.includes("đã sus") || s.includes("về sus");
  };

  /** Chi phí Ads: "25 $", "20k", "20 k", "10,5" → USD ("k" = ×1000) */
  const parseCost = (costStr: string | undefined): number => {
    if (!costStr) return 0;
    let s = costStr.trim().toLowerCase().replace(/\s+/g, " ");
    if (s.includes("vnd") || s.includes("₫") || s.includes("usdt")) return 0;
    s = s.replace(/\$/g, "").replace(/\busd\b/g, "").trim();
    let multiply = 1;
    const kMatch = s.match(/^([\d.,]+)\s*k$/);
    if (kMatch) {
      s = kMatch[1];
      multiply = 1000;
    }
    if (s.includes(",") && !s.includes(".")) s = s.replace(/,/g, ".");
    else s = s.replace(/,/g, "");
    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed * multiply;
  };

  const parseDmyDateLocal = (dateStr: string): Date | null => parseDmyDate(dateStr);

  const daysBetween = (start: Date, end: Date): number =>
    Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  /** Số ngày xanh: có Ngày Sus → từ Ngày về GMC đến Ngày Sus; không thì đến hôm nay */
  const calculateGreenDays = (item: GMCRegItem): number | null => {
    const gmcDate = parseDmyDateLocal(item.dateGMC);
    if (!gmcDate) return null;

    const susDate = parseDmyDateLocal(item.dateSus);
    if (susDate) {
      return daysBetween(gmcDate, susDate);
    }

    const fromSheet = item.daysGreen && item.daysGreen !== "—" ? Number(item.daysGreen) : NaN;
    if (!isNaN(fromSheet) && fromSheet >= 0) return fromSheet;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return daysBetween(gmcDate, today);
  };

  const devTabItems = useMemo(() => {
    const map: Record<string, number> = {};
    regData.forEach((item) => {
      const dev = item.dev?.trim();
      if (!dev) return;
      map[dev] = (map[dev] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [regData]);

  const devPool = useMemo(
    () => (devFilter === "all"
      ? regData
      : regData.filter((item) => item.dev?.toLowerCase() === devFilter.toLowerCase())),
    [regData, devFilter],
  );

  const latestMonth = useMemo(() => {
    const months = devPool
      .map((item) => parseGmcMonth(item.dateGMC))
      .filter(Boolean) as string[];
    if (!months.length) return getCurrentMonthKey();
    return months.sort((a, b) => b.localeCompare(a))[0];
  }, [devPool]);

  useEffect(() => {
    setMonthFilter(latestMonth);
    setCurrentPage(1);
  }, [devFilter, latestMonth]);

  const activeMonth = monthFilter === "all" ? "all" : (monthFilter || latestMonth);

  const monthTabItems = useMemo(() => {
    const map: Record<string, number> = {};
    devPool.forEach((item) => {
      const m = parseGmcMonth(item.dateGMC);
      if (!m) return;
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, count]) => ({ month, count }));
  }, [devPool]);

  const monthPool = useMemo(() => {
    if (activeMonth === "all") return devPool;
    return devPool.filter((item) => parseGmcMonth(item.dateGMC) === activeMonth);
  }, [devPool, activeMonth]);

  const stats = useMemo(() => {
    const total = monthPool.length;
    const live = monthPool.filter((item) => !isSuspended(item.status)).length;
    const sus = total - live;
    const domains = new Set(monthPool.map((item) => item.domain.toLowerCase().trim())).size;
    const totalCost = monthPool.reduce((sum, item) => sum + parseCost(item.cost), 0);
    return { total, live, sus, domains, totalCost };
  }, [monthPool]);

  const kpiEmployees = useMemo(() => {
    const set = new Set<string>();
    regData.forEach((item) => {
      const dev = item.dev?.trim();
      if (dev) set.add(dev);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [regData]);

  const kpiTableRows = useMemo(
    () => regData.map((item) => ({
      dev: item.dev?.trim() || "",
      dateGMC: item.dateGMC,
      greenDays: calculateGreenDays(item),
      suspended: isSuspended(item.status),
    })),
    [regData],
  );

  // ==========================================
  // ZONE 1: FILTER BY DROPDOWN CATEGORY
  // ==========================================
  const dropdownFilteredData = useMemo(() => {
    return orderedFullData.filter((item: GMCRegItem) => {
      const matchesDev = devFilter === "all"
        ? true
        : item.dev?.toLowerCase() === devFilter.toLowerCase();

      const matchesStatus = statusFilter === "all"
        ? true
        : (statusFilter === "sus" ? isSuspended(item.status) : !isSuspended(item.status));

      const matchesWebType = webTypeFilter === "all" ? true : item.webType === webTypeFilter;

      const itemMonth = parseGmcMonth(item.dateGMC);
      const matchesMonth = activeMonth === "all" ? true : itemMonth === activeMonth;

      return matchesDev && matchesStatus && matchesWebType && matchesMonth;
    });
  }, [orderedFullData, devFilter, statusFilter, webTypeFilter, activeMonth]);

  // ==========================================
  // ZONE 2: SEARCH INPUT FILTER
  // ==========================================
  const finalFilteredTableData = useMemo(() => {
    return dropdownFilteredData.filter((item: GMCRegItem) => {
      return item.domain.toLowerCase().includes(searchDomain.toLowerCase());
    });
  }, [dropdownFilteredData, searchDomain]);

  // Map domain frequency across entire system to label RE-REG
  const globalDomainFrequencyMap = useMemo(() => {
    const frequency: Record<string, number> = {};
    orderedFullData.forEach((item) => {
      const formattedDomain = item.domain.toLowerCase().trim();
      frequency[formattedDomain] = (frequency[formattedDomain] || 0) + 1;
    });
    return frequency;
  }, [orderedFullData]);

  // Extract lists for dropdown filters
  const uniqueWebTypesOptions = useMemo(() => {
    const typesSet = new Set<string>();
    regData.forEach((item: GMCRegItem) => item.webType && item.webType !== "—" && typesSet.add(item.webType));
    return Array.from(typesSet);
  }, [regData]);

  // Paginated data to render on table
  const paginatedTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return finalFilteredTableData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [finalFilteredTableData, currentPage]);

  if (isLoading) {
    return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">{t("loadingSystemData")}</div>;
  }

  const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("gmcRegManagement")}</h1>
          <p className="text-slate-500 font-medium text-sm">{t("gmcSystemDesc")}</p>
        </div>

        <DevKpiTabs
          items={devTabItems}
          totalCount={regData.length}
          selected={devFilter}
          onSelect={(dev) => { setDevFilter(dev); setCurrentPage(1); }}
          allLabel={t("allOwners")}
        />

        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
            {t("gmcMonthFilterTitle")}
          </p>
          <MonthFilterTabs
            items={monthTabItems}
            totalWithDate={devPool.filter((item) => parseGmcMonth(item.dateGMC)).length}
            selected={activeMonth}
            onSelect={(m) => { setMonthFilter(m); setCurrentPage(1); }}
            allLabel={t("allMonths")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-600">
            {activeMonth === "all"
              ? t("gmcMonthStatsAll")
              : t("gmcMonthStatsLabel", { month: fmtMonthShort(activeMonth) })}
          </p>
        </div>

        <GmcKpiSummaryTable
          rows={kpiTableRows}
          employees={kpiEmployees}
          monthKey={activeMonth}
          parseMonth={parseGmcMonth}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-slate-800 border-t-2">
            <p className="text-[9px] font-black uppercase text-slate-400">{t("gmcReturned")}</p>
            <h2 className="text-2xl font-black mt-1">{stats.total}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-emerald-500">{t("gmcStillLive")}</p>
            <h2 className="text-2xl font-black text-emerald-600 mt-1">{stats.live}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-red-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-red-500">{t("gmcSuspended")}</p>
            <h2 className="text-2xl font-black text-red-600 mt-1">{stats.sus}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-indigo-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-indigo-500">{t("actualFilteredDomains")}</p>
            <h2 className="text-2xl font-black text-indigo-600 mt-1">{stats.domains}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-blue-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-blue-500">{t("totalAdsCost")}</p>
            <h2 className="text-2xl font-black text-blue-600 mt-1">
              ${stats.totalCost.toLocaleString("en-US", formatOptions)}
            </h2>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
          <input
            type="text"
            placeholder={t("searchDomainPlaceholder")}
            className="flex-1 px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
            value={searchDomain}
            onChange={(e) => { setSearchDomain(e.target.value); setCurrentPage(1); }}
          />

          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={webTypeFilter}
            onChange={(e) => { setWebTypeFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">{t("webTypeAll")}</option>
            {uniqueWebTypesOptions.map(type => <option key={type} value={type}>{type.toUpperCase()}</option>)}
          </select>

          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">{t("status")}</option>
            <option value="live">🟢 {t("active")}</option>
            <option value="sus">🔴 {t("suspended")}</option>
          </select>
        </div>


        {/* GMC Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left table-fixed min-w-[1680px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 w-[16%]">{t("webAndPlatform")}</th>
                  <th className="p-4 w-[7%]">{t("assignedStaff")}</th>
                  <th className="p-4 w-[6%]">{t("status")}</th>
                  <th className="p-4 w-[7%]">{t("gmcReturnDate")}</th>
                  <th className="p-4 w-[9%]">{t("gmcReturnReport")}</th>
                  <th className="p-4 w-[6%]">{t("ageDays")}</th>
                  <th className="p-4 w-[7%]">{t("susDate")}</th>
                  <th className="p-4 w-[9%]">{t("susReport")}</th>
                  <th className="p-4 w-[10%]">{t("linkAdsEgead")}</th>
                  <th className="p-4 w-[6%]">{t("adsCost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedTableData.map((item: GMCRegItem, idx: number) => {
                  const isDuplicateDomain = globalDomainFrequencyMap[item.domain.toLowerCase().trim()] > 1;
                  const itemIsSus = isSuspended(item.status);
                  const daysAlive = calculateGreenDays(item);
                  const hasSusDate = item.dateSus && item.dateSus !== "—";

                  return (
                    <tr
                      key={idx}
                      className={`transition-all group ${isDuplicateDomain
                        ? "bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500"
                        : "hover:bg-slate-50/50"
                        }`}
                    >
                      <td className="p-4 overflow-hidden text-ellipsis whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-800 text-[14px] lowercase truncate">{item.domain || "N/A"}</div>
                          {isDuplicateDomain && (
                            <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 animate-pulse">
                              RE-REG / CONFLICT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{item.webType || "Unknown"}</div>
                      </td>

                      <td className="p-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-wider truncate inline-block">
                          {item.dev || "—"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase max-w-full ${itemIsSus ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${itemIsSus ? "bg-red-500" : "bg-emerald-500"}`} />
                          <span className="truncate">{item.status || (itemIsSus ? t("suspended") : t("active"))}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-bold text-slate-600">{item.dateGMC}</div>
                      </td>

                      <td className="p-4">
                        <ReportCell value={item.reportDateGMC} linkLabel={t("viewReport")} />
                      </td>

                      <td className="p-4">
                        {daysAlive !== null ? (
                          <div className="flex flex-col">
                            <span className={`text-xs font-black ${itemIsSus ? "text-slate-400" : "text-emerald-600"}`}>
                              {daysAlive} {daysAlive === 1 ? t("day") : t("days")}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {hasSusDate ? t("untilSusDate") : itemIsSus ? t("beforeSuspended") : t("running")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-bold text-slate-600">
                          {item.dateSus && item.dateSus !== "—" ? item.dateSus : "—"}
                        </div>
                      </td>

                      <td className="p-4">
                        <ReportCell value={item.reportDateSus} linkLabel={t("viewReport")} />
                      </td>

                      <td className="p-4">
                        <LinkAdsEgeadCell value={item.linkAdsEgead} />
                      </td>

                      <td className="p-4">
                        <div className="text-[15px] font-black text-slate-900">
                          ${parseCost(item.cost).toLocaleString('en-US', formatOptions)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedTableData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center p-10 text-sm font-medium text-slate-400">
                      {t("noAccountData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR */}
          <Pagination
            currentPage={currentPage}
            totalItems={finalFilteredTableData.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

      </div>
    </div>
  );
}