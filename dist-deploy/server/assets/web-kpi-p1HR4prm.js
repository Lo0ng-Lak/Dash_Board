import { r as reactExports, X as jsxRuntimeExports } from "./server-BY3o_Qlj.js";
import { i as isWebKpiRecord, c as getAllDataWeb, d as getWebStatusBucket } from "./dataService-DdUk0NVH.js";
import { P as Pagination } from "./pagination-BjfZY2NH.js";
import { E as ExportExcelButton, d as downloadExcel } from "./downloadExcel-n7MxkTRE.js";
import { D as DevKpiTabs } from "./dev-kpi-tabs-CEEmtp94.js";
import { M as MonthFilterTabs } from "./month-filter-tabs-BoPZ1fVV.js";
import { M as MonthWeeklyKpiBlock } from "./month-weekly-kpi-block-1m60weWS.js";
import { g as getCurrentMonthKey, a as aggregateWeekRows, p as parseIsoDate } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-D47zfhuR.js";
import { R as ResponsiveContainer, C as Cell, T as Tooltip, B as BarChart, a as CartesianGrid, X as XAxis, Y as YAxis, b as Bar, L as LabelList } from "./BarChart-CHG6PrEj.js";
import { P as PieChart, a as Pie } from "./PieChart-BrXoH8GD.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
import "./clsx-DgYk2OaC.js";
const DEV_COLORS = [{
  bg: "#EFF6FF",
  text: "#1e40af",
  border: "#93c5fd",
  bar: "#3b82f6"
}, {
  bg: "#f0fdf4",
  text: "#166534",
  border: "#86efac",
  bar: "#22c55e"
}, {
  bg: "#fffbeb",
  text: "#92400e",
  border: "#fcd34d",
  bar: "#f59e0b"
}, {
  bg: "#fdf4ff",
  text: "#6b21a8",
  border: "#d8b4fe",
  bar: "#a855f7"
}, {
  bg: "#fff1f2",
  text: "#9f1239",
  border: "#fda4af",
  bar: "#f43f5e"
}, {
  bg: "#f0fdfa",
  text: "#134e4a",
  border: "#5eead4",
  bar: "#14b8a6"
}, {
  bg: "#fff7ed",
  text: "#9a3412",
  border: "#fdba74",
  bar: "#f97316"
}, {
  bg: "#f8fafc",
  text: "#334155",
  border: "#cbd5e1",
  bar: "#64748b"
}];
function getDevColor(devName, allDevs) {
  const idx = allDevs.indexOf(devName);
  return DEV_COLORS[idx % DEV_COLORS.length];
}
function getStatusBucket(status) {
  return getWebStatusBucket(status);
}
function buildStats(records) {
  const map = /* @__PURE__ */ new Map();
  for (const r of records) {
    if (!r.month || !r.dev) continue;
    if (!isWebKpiRecord(r)) continue;
    const key = `${r.dev}|${r.month}`;
    if (!map.has(key)) {
      map.set(key, {
        dev: r.dev,
        month: r.month,
        monthLabel: "",
        websites: [],
        count: 0
      });
    }
    const s = map.get(key);
    s.websites.push(r.domain);
    s.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month) || a.dev.localeCompare(b.dev));
}
function WebsiteTagList({
  websites,
  color
}) {
  const {
    t
  } = useTranslation();
  const [expanded, setExpanded] = reactExports.useState(false);
  const shown = expanded ? websites : websites.slice(0, 3);
  const more = websites.length - 3;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1 mt-1", children: [
    shown.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded lowercase", style: {
      background: color.bg,
      color: color.text,
      border: `1px solid ${color.border}`
    }, children: w }, w)),
    !expanded && more > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setExpanded(true), className: "text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors", children: [
      "+",
      more,
      " ",
      t("more", "more")
    ] }),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setExpanded(false), className: "text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors", children: t("collapse", "Collapse") })
  ] });
}
function WebKPIPage() {
  const {
    t
  } = useTranslation();
  const [records, setRecords] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [selectedMonth, setSelectedMonth] = reactExports.useState("");
  const [activeKpiMonth, setActiveKpiMonth] = reactExports.useState(getCurrentMonthKey);
  const [selectedDev, setSelectedDev] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [currentPage, setCurrentPage] = reactExports.useState(1);
  const ITEMS_PER_PAGE = 10;
  const load = async (force = false) => {
    try {
      force && setRefreshing(true);
      const data = await getAllDataWeb(force);
      setRecords(data);
      setError(null);
    } catch {
      setError(t("failedToLoadData", "Failed to load data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  reactExports.useEffect(() => {
    load();
    const intervalId = setInterval(() => {
      load(true);
    }, 3e4);
    return () => clearInterval(intervalId);
  }, []);
  const baseStats = reactExports.useMemo(() => buildStats(records), [records]);
  const allDevs = reactExports.useMemo(() => [...new Set(baseStats.map((s) => s.dev))].sort(), [baseStats]);
  const kpiRecords = reactExports.useMemo(() => records.filter(isWebKpiRecord), [records]);
  const devPool = reactExports.useMemo(() => selectedDev === "all" ? records : records.filter((r) => r.dev === selectedDev), [records, selectedDev]);
  const kpiDevPool = reactExports.useMemo(() => devPool.filter(isWebKpiRecord), [devPool]);
  const latestMonth = reactExports.useMemo(() => {
    const months = kpiDevPool.map((r) => r.month).filter(Boolean);
    if (!months.length) return getCurrentMonthKey();
    return months.sort((a, b) => b.localeCompare(a))[0];
  }, [kpiDevPool]);
  reactExports.useEffect(() => {
    setSelectedMonth(latestMonth);
    setCurrentPage(1);
  }, [selectedDev, latestMonth]);
  const activeMonth = selectedMonth === "all" ? "all" : selectedMonth || latestMonth;
  const monthTabItems = reactExports.useMemo(() => {
    const map = {};
    kpiDevPool.forEach((r) => {
      if (!r.month) return;
      map[r.month] = (map[r.month] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([month, count]) => ({
      month,
      count
    }));
  }, [kpiDevPool]);
  const devTabItems = reactExports.useMemo(() => {
    const map = {};
    kpiRecords.forEach((r) => {
      if (!r.dev) return;
      map[r.dev] = (map[r.dev] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [kpiRecords]);
  const kpiMonth = activeMonth !== "all" ? activeMonth : activeKpiMonth;
  const zoneARecords = reactExports.useMemo(() => {
    return records.filter((r) => {
      const matchMonth = activeMonth === "all" || r.month === activeMonth;
      const matchDev = selectedDev === "all" || r.dev === selectedDev;
      return matchMonth && matchDev;
    });
  }, [records, activeMonth, selectedDev]);
  const currentStats = reactExports.useMemo(() => {
    let pending = 0, unknown = 0;
    const devs = /* @__PURE__ */ new Set();
    zoneARecords.forEach((r) => {
      const b = getStatusBucket(r.status);
      if (b === "pending") pending++;
      if (b === "unknown") unknown++;
      if (r.dev) devs.add(r.dev);
    });
    const kpiTotal = zoneARecords.filter((r) => isWebKpiRecord(r)).length;
    const checkCount = zoneARecords.filter((r) => getStatusBucket(r.status) === "check").length;
    return {
      total: zoneARecords.length,
      done: kpiTotal,
      pending,
      check: checkCount,
      unknown,
      kpiTotal,
      devCount: devs.size
    };
  }, [zoneARecords]);
  const topDevInfo = reactExports.useMemo(() => {
    const pool = kpiRecords.filter((r) => r.month === kpiMonth);
    if (!pool.length) return null;
    const counts = {};
    pool.forEach((r) => {
      if (r.dev) counts[r.dev] = (counts[r.dev] || 0) + 1;
    });
    let top = {
      dev: "",
      count: 0
    };
    Object.entries(counts).forEach(([dev, count]) => {
      if (count > top.count) top = {
        dev,
        count
      };
    });
    if (top.count === 0) return null;
    const [y, m] = kpiMonth.split("-");
    return {
      dev: top.dev,
      count: top.count,
      year: y,
      month: parseInt(m, 10)
    };
  }, [kpiRecords, kpiMonth]);
  const pieData = reactExports.useMemo(() => [{
    name: t("webKpiCompleted", "KPI Web"),
    value: currentStats.kpiTotal,
    color: "#10b981"
  }, {
    name: t("statusInProgress", "In Progress"),
    value: currentStats.pending,
    color: "#f59e0b"
  }, {
    name: t("statusUnclassified", "Unclassified"),
    value: currentStats.unknown,
    color: "#94a3b8"
  }].filter((d) => d.value > 0), [currentStats, t]);
  const devBarData = reactExports.useMemo(() => {
    const map = {};
    zoneARecords.forEach((r) => {
      if (isWebKpiRecord(r)) {
        if (!map[r.dev]) map[r.dev] = {
          name: r.dev,
          done: 0
        };
        map[r.dev].done++;
      }
    });
    return Object.values(map).sort((a, b) => b.done - a.done);
  }, [zoneARecords]);
  const zoneBRecords = reactExports.useMemo(() => {
    if (!search.trim()) return zoneARecords;
    const q = search.toLowerCase();
    return zoneARecords.filter((r) => r.dev?.toLowerCase().includes(q) || r.domain?.toLowerCase().includes(q));
  }, [zoneARecords, search]);
  const tableData = reactExports.useMemo(() => buildStats(zoneBRecords), [zoneBRecords]);
  const monthlyDone = reactExports.useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!isWebKpiRecord(r)) return;
      const matchDev = selectedDev === "all" || r.dev === selectedDev;
      if (!matchDev) return;
      map[r.month] = (map[r.month] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => {
      const [y, m] = month.split("-");
      return {
        month,
        label: `M${parseInt(m)}/${y}`,
        count
      };
    });
  }, [records, selectedDev]);
  const weeklyRows = reactExports.useMemo(() => {
    const pool = records.filter((r) => isWebKpiRecord(r) && (selectedDev === "all" || r.dev === selectedDev));
    return aggregateWeekRows(pool.map((r) => ({
      date: parseIsoDate(r.completedDate),
      group: r.dev || "—",
      item: r.domain
    })));
  }, [records, selectedDev]);
  const paginated = reactExports.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tableData.slice(start, start + ITEMS_PER_PAGE);
  }, [tableData, currentPage]);
  const maxCount = reactExports.useMemo(() => Math.max(...tableData.map((s) => s.count), 1), [tableData]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingData", "Loading data...") });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "m-8 p-4 rounded-2xl bg-red-50 text-red-500 font-medium text-sm", children: error });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row justify-between items-end gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight text-slate-900", children: t("webKpiDashboard", "Web KPI Dashboard") }),
          refreshing && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block mt-2", title: t("autoSyncing", "Auto syncing...") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("dashboardSubTitle", "Track website completion status by dev & month.") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ExportExcelButton, { disabled: tableData.length === 0, onClick: () => downloadExcel("kpi-web-gmc.xlsx", [{
        name: "Tong hop",
        rows: tableData.map((row) => ({
          [t("tableHeaderDev", "Dev")]: row.dev,
          [t("tableHeaderMonth", "Month")]: row.month,
          [t("tableHeaderSites", "Sites")]: row.count,
          [t("tableHeaderDomains", "Domains")]: row.websites.join(", ")
        }))
      }, {
        name: "Chi tiet",
        rows: zoneBRecords.map((r, i) => ({
          STT: i + 1,
          Domain: r.domain,
          Dev: r.dev,
          [t("tableHeaderMonth", "Month")]: r.month || "",
          [t("status")]: r.status,
          "Ngay hoan thanh": r.rawCompletedDate || ""
        }))
      }]) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-widest", children: t("kpiMonthFilterWeb") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MonthFilterTabs, { items: monthTabItems, totalWithDate: kpiDevPool.length, selected: activeMonth, onSelect: (m) => {
        setSelectedMonth(m);
        if (m !== "all") setActiveKpiMonth(m);
        setCurrentPage(1);
      }, allLabel: t("allMonths", "ALL MONTHS") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: devTabItems, totalCount: kpiRecords.length, selected: selectedDev, onSelect: (dev) => {
      setSelectedDev(dev);
      setCurrentPage(1);
    }, allLabel: t("allDevsFilter", "ALL DEVS") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]", children: t("totalWebsites", "Total Websites") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-slate-900 mt-1", children: currentStats.total })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-slate-300 uppercase mt-3", children: t("currentFilter", "Current filter") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-slate-400 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]", children: t("statusUnclassified", "Unclassified") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-slate-600", children: currentStats.unknown }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-slate-400", children: [
              "(",
              currentStats.total > 0 ? (currentStats.unknown / currentStats.total * 100).toFixed(1) : 0,
              "%)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-slate-400 uppercase mt-3", children: t("statusUnclassified", "Unclassified") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-emerald-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-500 tracking-[0.15em]", children: t("webKpiCompleted", "KPI Web") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-emerald-600", children: currentStats.kpiTotal }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-emerald-400", children: [
              "(",
              currentStats.total > 0 ? (currentStats.kpiTotal / currentStats.total * 100).toFixed(1) : 0,
              "%)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-1 text-[9px] font-bold text-emerald-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
          t("webKpiCompletedHint", "HT + cần check")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-amber-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-amber-500 tracking-[0.15em]", children: t("statusInProgress", "In Progress") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-amber-600", children: currentStats.pending }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-amber-400", children: [
              "(",
              currentStats.total > 0 ? (currentStats.pending / currentStats.total * 100).toFixed(1) : 0,
              "%)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-amber-400 uppercase mt-3", children: t("pendingUpper", "Pending") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-blue-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-blue-500 tracking-[0.15em]", children: t("statusNeedCheck", "Need Check") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-blue-600", children: currentStats.check }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-blue-400", children: [
              "(",
              currentStats.total > 0 ? (currentStats.check / currentStats.total * 100).toFixed(1) : 0,
              "%)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-blue-400 uppercase mt-3", children: t("webKpiCheckHint", "Có ngày HT → tính KPI") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-indigo-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-500 tracking-[0.15em]", children: topDevInfo ? `${t("topDev", "Top Dev")} — ${t("monthLabelFormat", {
            month: topDevInfo.month,
            year: topDevInfo.year
          })}` : t("topDev", "Top Dev") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-indigo-600 mt-1 truncate", children: topDevInfo ? topDevInfo.dev : "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-indigo-300 uppercase mt-3", children: topDevInfo ? t("sitesCompletedCount", {
          count: topDevInfo.count,
          defaultValue: `${topDevInfo.count} sites completed`
        }) : t("noKpiThisMonth", "Chưa có KPI tháng này") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase text-slate-400 mb-6 tracking-widest", children: t("statusBreakdown", "Status Breakdown") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data: pieData, innerRadius: 55, outerRadius: 80, paddingAngle: 4, dataKey: "value", children: pieData.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: e.color }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
          } })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1.5 mt-4", children: pieData.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold", style: {
          color: d.color
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full flex-shrink-0", style: {
            background: d.color
          } }),
          d.name,
          ": ",
          d.value
        ] }, d.name)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase text-slate-400 mb-6 tracking-widest", children: t("sitesCompletedByDev", "Sites Completed by Dev") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: devBarData, margin: {
          top: 20,
          right: 10,
          left: 10,
          bottom: 5
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", axisLine: false, tickLine: false, tick: {
            fontSize: 10,
            fontWeight: 700
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { hide: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
          }, formatter: (v) => [v, t("sitesCompletedTooltip", "Sites completed")] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Bar, { dataKey: "done", radius: [4, 4, 0, 0], barSize: 28, name: "done", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LabelList, { dataKey: "done", position: "top", offset: 8, style: {
              fontSize: 11,
              fontWeight: 800,
              fill: "#475569"
            } }),
            devBarData.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: DEV_COLORS[i % DEV_COLORS.length].bar }, i))
          ] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: t("searchPlaceholderTableOnly", "Search dev or domain... (table only)"), className: "flex-1 min-w-[220px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all", value: search, onChange: (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
      } }),
      (activeMonth !== "all" || selectedDev !== "all" || search) && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
        setSelectedMonth(latestMonth);
        setSelectedDev("all");
        setSearch("");
        setActiveKpiMonth(getCurrentMonthKey());
        setCurrentPage(1);
      }, className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors", children: [
        "✕ ",
        t("clearFilters", "Clear filters")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MonthWeeklyKpiBlock, { monthlyData: monthlyDone, weeklyRows, activeMonth: activeMonth !== "all" ? activeMonth : activeKpiMonth, onMonthChange: (m) => {
      setActiveKpiMonth(m);
      setSelectedMonth(m);
    }, groupColumnLabel: t("tableHeaderDev", "Dev"), title: t("monthlyKpiTitle", "KPI theo tháng"), subtitle: t("monthlyKpiNote"), emptyHint: t("weeklyKpiWebHint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left table-fixed min-w-[1000px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5 w-[18%]", children: t("tableHeaderDev", "Dev") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5 w-[10%]", children: t("tableHeaderMonth", "Month") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5 w-[8%] text-center", children: t("tableHeaderSites", "Sites") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5 w-[14%]", children: t("tableHeaderProgress", "Progress") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5 w-[50%]", children: t("tableHeaderDomains", "Domains") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          paginated.map((row, idx) => {
            const devColor = getDevColor(row.dev, allDevs);
            const barPct = Math.round(row.count / maxCount * 100);
            const [y, m] = row.month.split("-");
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition-all hover:bg-slate-50/60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider inline-block", style: {
                background: devColor.bg,
                color: devColor.text,
                border: `1px solid ${devColor.border}`
              }, children: row.dev }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap", children: t("monthShortFormat", {
                month: parseInt(m),
                year: y,
                defaultValue: `M${parseInt(m)}/${y}`
              }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-black", style: {
                color: devColor.bar
              }, children: row.count }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full transition-all duration-500", style: {
                width: `${barPct}%`,
                background: devColor.bar
              } }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WebsiteTagList, { websites: row.websites, color: devColor }) })
            ] }, idx);
          }),
          paginated.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "text-center p-14 text-sm font-medium text-slate-400", children: t("noMatchingRecords", "No matching records found.") }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage, totalItems: tableData.length, itemsPerPage: ITEMS_PER_PAGE, onPageChange: (page) => setCurrentPage(page) })
    ] })
  ] }) });
}
export {
  WebKPIPage as component
};
