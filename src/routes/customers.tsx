import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next"; // 🌐 Import hook dịch thuật
import { getGMCRegData } from "../lib/dataService";
import { Pagination } from "../components/pagination";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";

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
  const [monthFilter, setMonthFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load GMC REG data from API
  const { data: rawRegData = [], isLoading } = useQuery<GMCRegItem[]>({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(),
    refetchInterval: 30000,
  });

  // Reverse array of original data (new records first)
  const orderedFullData = useMemo(() => {
    return [...rawRegData].reverse();
  }, [rawRegData]);

  // Helper function để check trạng thái thiết bị linh hoạt
  const isSuspended = (status: string) => {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    if (s === "xanh" || s.includes("chưa sus")) return false;
    return s.includes("đã sus") || s === "suspended" || s === "sus";
  };

  // Chuẩn hóa chuỗi tiền tệ từ "10,5" thành số thực 10.5
  const parseCost = (costStr: string | undefined): number => {
    if (!costStr) return 0;
    const normalized = costStr.replace(",", ".").trim();
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseDmyDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === "—") return null;
    const parts = dateStr.trim().split("/").map(Number);
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null;
    const [day, month, year] = parts;
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  };

  const daysBetween = (start: Date, end: Date): number =>
    Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  /** Số ngày xanh: có Ngày Sus → từ Ngày về GMC đến Ngày Sus; không thì đến hôm nay */
  const calculateGreenDays = (item: GMCRegItem): number | null => {
    const gmcDate = parseDmyDate(item.dateGMC);
    if (!gmcDate) return null;

    const susDate = parseDmyDate(item.dateSus);
    if (susDate) {
      return daysBetween(gmcDate, susDate);
    }

    const fromSheet = item.daysGreen && item.daysGreen !== "—" ? Number(item.daysGreen) : NaN;
    if (!isNaN(fromSheet) && fromSheet >= 0) return fromSheet;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return daysBetween(gmcDate, today);
  };

  // ==========================================
  // ZONE 0: GLOBAL STATS (toàn bộ dữ liệu REG GMC)
  // ==========================================
  const globalStats = useMemo(() => {
    const totalAcc = rawRegData.length;
    const totalDomains = new Set(rawRegData.map((item) => item.domain.toLowerCase().trim())).size;
    const totalLive = rawRegData.filter((item) => !isSuspended(item.status)).length;
    const totalSus = rawRegData.filter((item) => isSuspended(item.status)).length;
    const totalCost = rawRegData.reduce((sum, item) => sum + parseCost(item.cost), 0);

    return { totalAcc, totalDomains, totalLive, totalSus, totalCost };
  }, [rawRegData]);

  // ==========================================
  // ZONE 1: FILTER BY DROPDOWN CATEGORY (Stats + Charts)
  // ==========================================
  const dropdownFilteredData = useMemo(() => {
    return orderedFullData.filter((item: GMCRegItem) => {
      const matchesDev = devFilter === "all" ? true : item.dev === devFilter;

      const matchesStatus = statusFilter === "all"
        ? true
        : (statusFilter === "sus" ? isSuspended(item.status) : !isSuspended(item.status));

      const matchesWebType = webTypeFilter === "all" ? true : item.webType === webTypeFilter;

      const itemMonthYear = item.dateGMC && item.dateGMC !== "—"
        ? `${item.dateGMC.split("/")[1]}/${item.dateGMC.split("/")[2]}`
        : null;
      const matchesMonth = monthFilter === "all" ? true : itemMonthYear === monthFilter;

      return matchesDev && matchesStatus && matchesWebType && matchesMonth;
    });
  }, [orderedFullData, devFilter, statusFilter, webTypeFilter, monthFilter]);

  // ==========================================
  // ZONE 2: DYNAMIC STATISTICS & CHARTS CALCULATION
  // ==========================================
  const dynamicStats = useMemo(() => {
    const total = dropdownFilteredData.length;
    const live = dropdownFilteredData.filter((item: GMCRegItem) => !isSuspended(item.status)).length;
    const sus = dropdownFilteredData.filter((item: GMCRegItem) => isSuspended(item.status)).length;
    const totalCost = dropdownFilteredData.reduce((sum: number, item: GMCRegItem) => sum + parseCost(item.cost), 0);
    const totalUniqueDomains = new Set(dropdownFilteredData.map((item) => item.domain.toLowerCase().trim())).size;

    return { total, live, sus, totalCost, totalUniqueDomains };
  }, [dropdownFilteredData]);

  // Structure data for pie chart
  const pieChartStats = useMemo(() => [
    { name: t("active"), value: dynamicStats.live, color: "#10b981" },
    { name: t("suspended"), value: dynamicStats.sus, color: "#ef4444" }
  ], [dynamicStats, t]);

  // Structure data for bar chart productivity by Dev
  const devProductivityStats = useMemo(() => {
    const statsMap: Record<string, { name: string; total: number; live: number; sus: number; totalCost: number }> = {};

    dropdownFilteredData.forEach((item: GMCRegItem) => {
      const devName = item.dev || "Unknown";
      if (!statsMap[devName]) {
        statsMap[devName] = { name: devName, total: 0, live: 0, sus: 0, totalCost: 0 };
      }
      statsMap[devName].total += 1;

      if (isSuspended(item.status)) {
        statsMap[devName].sus += 1;
      } else {
        statsMap[devName].live += 1;
      }
      statsMap[devName].totalCost += parseCost(item.cost);
    });
    return Object.values(statsMap).sort((a, b) => b.total - a.total);
  }, [dropdownFilteredData]);

  // ==========================================
  // ZONE 3: SEARCH INPUT FILTER & SEARCH STATS
  // ==========================================
  const finalFilteredTableData = useMemo(() => {
    return dropdownFilteredData.filter((item: GMCRegItem) => {
      return item.domain.toLowerCase().includes(searchDomain.toLowerCase());
    });
  }, [dropdownFilteredData, searchDomain]);

  const searchStats = useMemo(() => {
    const totalCost = finalFilteredTableData.reduce((sum: number, item: GMCRegItem) => sum + parseCost(item.cost), 0);
    const totalRows = finalFilteredTableData.length;
    return { totalCost, totalRows };
  }, [finalFilteredTableData]);

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
  const uniqueMonthsOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    rawRegData.forEach((item: GMCRegItem) => {
      if (item.dateGMC && item.dateGMC !== "—") {
        const [_, month, year] = item.dateGMC.split("/");
        monthsSet.add(`${month}/${year}`);
      }
    });
    return Array.from(monthsSet).sort((a, b) => {
      const [m1, y1] = a.split("/").map(Number);
      const [m2, y2] = b.split("/").map(Number);
      return y2 - y1 || m2 - m1;
    });
  }, [rawRegData]);

  const uniqueWebTypesOptions = useMemo(() => {
    const typesSet = new Set<string>();
    rawRegData.forEach((item: GMCRegItem) => item.webType && item.webType !== "—" && typesSet.add(item.webType));
    return Array.from(typesSet);
  }, [rawRegData]);

  const uniqueDevsOptions = useMemo(() => {
    const devsSet = new Set<string>();
    rawRegData.forEach((item: GMCRegItem) => item.dev && devsSet.add(item.dev));
    return Array.from(devsSet);
  }, [rawRegData]);

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

        {/* DASHBOARD TITLE */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("gmcRegManagement")}</h1>
            <p className="text-slate-500 font-medium text-sm">{t("gmcSystemDesc")}</p>
          </div>
        </div>

        {/* TỔNG REG GMC — toàn hệ thống */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-5 rounded-2xl text-white shadow-lg flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">{t("totalRegGmc")}</p>
            <h2 className="text-4xl font-black mt-1">{globalStats.totalAcc}</h2>
            <p className="text-[10px] font-medium text-slate-400 mt-1">{t("totalRegGmcDesc")}</p>
          </div>
          <div className="h-10 w-px bg-white/20 hidden sm:block" />
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[9px] font-bold uppercase text-emerald-400">{t("active")}</p>
              <p className="text-xl font-black text-emerald-300">{globalStats.totalLive}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-red-400">{t("suspended")}</p>
              <p className="text-xl font-black text-red-300">{globalStats.totalSus}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-indigo-300">{t("actualFilteredDomains")}</p>
              <p className="text-xl font-black">{globalStats.totalDomains}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-blue-300">{t("totalAdsCost")}</p>
              <p className="text-xl font-black text-blue-200">
                ${globalStats.totalCost.toLocaleString("en-US", formatOptions)}
              </p>
            </div>
          </div>
        </div>

        {/* DYNAMIC STATS CARDS BLOCK — theo bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">{t("totalFilteredRows")}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {searchDomain ? `${searchStats.totalRows} / ` : ""}{dynamicStats.total}
              </h2>
            </div>
            <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">
              {searchDomain ? t("matchingSearchResult") : `${t("allFilteredRecords")}: ${globalStats.totalAcc}`}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-indigo-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.15em]">{t("actualFilteredDomains")}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <h2 className="text-2xl font-black text-indigo-600">{dynamicStats.totalUniqueDomains}</h2>
              </div>
            </div>
            <p className="text-[9px] font-bold text-indigo-400 uppercase mt-3">{t("cleanedDomains")}: {globalStats.totalDomains}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-emerald-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">{t("totalLiveDomains")}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-black text-emerald-600">{dynamicStats.live}</h2>
                <span className="text-[10px] font-bold text-emerald-500/70">
                  ({dynamicStats.total > 0 ? ((dynamicStats.live / dynamicStats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                {t("searchTotal")}: {globalStats.totalLive}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-red-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">{t("totalSuspendedDomains")}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-black text-red-600">{dynamicStats.sus}</h2>
                <span className="text-[10px] font-bold text-red-500/70">
                  ({dynamicStats.total > 0 ? ((dynamicStats.sus / dynamicStats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-red-400 uppercase mt-3">{t("searchTotal")}: {globalStats.totalSus}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-blue-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">
                {searchDomain ? t("searchAdsCost") : t("totalAdsCost")}
              </p>
              <h2 className="text-2xl font-black text-blue-600 mt-1">
                ${(searchDomain ? searchStats.totalCost : dynamicStats.totalCost).toLocaleString('en-US', formatOptions)}
              </h2>
            </div>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-3 bg-blue-50 w-max px-2 py-0.5 rounded-md">
              {t("usdTotal")}: ${globalStats.totalCost.toLocaleString('en-US', formatOptions)}
            </p>
          </div>
        </div>

        {/* PIE CHART & BAR CHART BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("systemRatioOverview")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieChartStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-2 text-emerald-600">● {t("active")}: {dynamicStats.live}</div>
              <div className="flex items-center gap-2 text-red-500">● {t("suspended")}: {dynamicStats.sus}</div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("accountProductivityByDev")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devProductivityStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="live" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} name={t("active")} />
                  <Bar dataKey="sus" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} name={t("suspended")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100 transition-colors"
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">{t("allMonths")}</option>
            {uniqueMonthsOptions.map(monthStr => (
              <option key={monthStr} value={monthStr}>{t("monthLabel")} {monthStr}</option>
            ))}
          </select>

          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={devFilter}
            onChange={(e) => { setDevFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">{t("filterByDevAll")}</option>
            {uniqueDevsOptions.map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
          </select>

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
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${itemIsSus ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                          }`}>
                          <span className={`w-1 h-1 rounded-full ${itemIsSus ? "bg-red-500" : "bg-emerald-500"}`} />
                          {itemIsSus ? t("suspended") : t("active")}
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