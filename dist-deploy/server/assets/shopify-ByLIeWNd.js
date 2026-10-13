import { r as reactExports, X as jsxRuntimeExports } from "./server-CHteKQQO.js";
import { u as useQuery } from "./useQuery-CLF9K1s_.js";
import { t as getShopifyData } from "./dataService-X5Ad-979.js";
import { P as Pagination } from "./pagination-Cl5u3Vn-.js";
import { u as useTranslation } from "./router-BxCuPKFv.js";
import { R as ResponsiveContainer, B as BarChart, a as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, b as Bar } from "./BarChart-CEAe-CMJ.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
import "./clsx-DgYk2OaC.js";
const ITEMS = 12;
const EXPIRING_DAYS = 15;
const fmtMonth = (ym) => {
  const [y, m] = ym.split("-");
  return `${parseInt(m)}/${y}`;
};
const currentMonthKey = () => {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
const isExpiringSoon = (r) => !r.isCanceled && r.daysLeft != null && r.daysLeft >= 0 && r.daysLeft <= EXPIRING_DAYS;
function DaysLeftBadge({
  days
}) {
  if (days == null) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "—" });
  if (days < 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-black px-2 py-1 rounded-lg bg-red-100 text-red-600 border border-red-200", children: [
      Math.abs(days),
      "d overdue"
    ] });
  }
  const urgent = days <= EXPIRING_DAYS;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-[10px] font-black px-2 py-1 rounded-lg border ${urgent ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`, children: [
    days,
    "d"
  ] });
}
function ShopifyPage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [monthFilter, setMonthFilter] = reactExports.useState("all");
  const [regFilter, setRegFilter] = reactExports.useState("all");
  const [expiringOnly, setExpiringOnly] = reactExports.useState(false);
  const [page, setPage] = reactExports.useState(1);
  const {
    data: records = [],
    isLoading
  } = useQuery({
    queryKey: ["shopifyData"],
    queryFn: () => getShopifyData(true),
    refetchInterval: 3e4
  });
  const thisMonthKey = reactExports.useMemo(() => currentMonthKey(), []);
  const activeRecords = reactExports.useMemo(() => records.filter((r) => !r.isCanceled), [records]);
  const monthlyReg = reactExports.useMemo(() => {
    const map = {};
    activeRecords.forEach((r) => {
      if (!r.regMonth) return;
      map[r.regMonth] = (map[r.regMonth] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([month, count]) => ({
      month,
      label: fmtMonth(month),
      count
    }));
  }, [activeRecords]);
  const expiringSoon = reactExports.useMemo(() => activeRecords.filter(isExpiringSoon).sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99)), [activeRecords]);
  const thisMonthReg = reactExports.useMemo(() => activeRecords.filter((r) => r.regMonth === thisMonthKey).length, [activeRecords, thisMonthKey]);
  const regOptions = reactExports.useMemo(() => [...new Set(records.map((r) => r.nguoiReg).filter(Boolean))].sort(), [records]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (expiringOnly && !isExpiringSoon(r)) return false;
      const matchMonth = monthFilter === "all" || r.regMonth === monthFilter;
      const matchReg = regFilter === "all" || r.nguoiReg === regFilter;
      const matchSearch = !q || r.web.toLowerCase().includes(q) || r.nguoiReg.toLowerCase().includes(q) || r.the.toLowerCase().includes(q);
      return matchMonth && matchReg && matchSearch;
    });
  }, [records, monthFilter, regFilter, search, expiringOnly]);
  const paginated = reactExports.useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filtered.slice(start, start + ITEMS);
  }, [filtered, page]);
  const monthlyBar = reactExports.useMemo(() => [...monthlyReg].reverse().map((m) => ({
    month: m.label,
    count: m.count
  })), [monthlyReg]);
  reactExports.useEffect(() => {
    setPage(1);
  }, [search, monthFilter, regFilter, expiringOnly]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingSystemData") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("shopifyMgmtTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("shopifyMgmtDesc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-indigo-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: t("shopifyTotalWeb") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-indigo-600 mt-1", children: activeRecords.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-slate-300 mt-2", children: [
          records.length,
          " ",
          t("shopifyInSheet")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-500", children: t("shopifyRegThisMonth") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-emerald-600 mt-1", children: thisMonthReg }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-slate-300 mt-2", children: fmtMonth(thisMonthKey) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-amber-300 shadow-sm border-t-amber-500 border-t-2 bg-amber-50/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-amber-600", children: t("shopifyExpiring15") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-amber-600 mt-1", children: expiringSoon.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-amber-500 mt-2", children: [
          "≤ ",
          EXPIRING_DAYS,
          " ",
          t("days")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-red-400 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-red-400", children: t("shopifyCanceledCount") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-red-500 mt-1", children: records.filter((r) => r.isCanceled).length })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-indigo-200 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-indigo-600 px-6 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-200 tracking-widest", children: t("currentMonthDash") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-black text-white mt-1", children: [
          t("shopifyRegMonth"),
          " ",
          fmtMonth(thisMonthKey)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-400", children: t("shopifyNewReg") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-indigo-700", children: thisMonthReg })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 px-5 py-3 rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-amber-600", children: t("shopifyExpiring15") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-amber-700", children: expiringSoon.length })
        ] })
      ] })
    ] }),
    expiringSoon.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black uppercase text-amber-700 tracking-widest mb-4", children: [
        "⚠️ ",
        t("shopifyExpiringSoonList"),
        " (",
        expiringSoon.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: expiringSoon.slice(0, 20).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
        setSearch(r.web);
        setExpiringOnly(true);
      }, className: "px-3 py-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black text-slate-800 lowercase", children: r.web }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-amber-600 mt-0.5", children: [
          r.ngayHetHan,
          " · ",
          r.daysLeft,
          " ",
          t("days")
        ] })
      ] }, r.web)) })
    ] }),
    monthlyReg.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: monthlyReg.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setMonthFilter(monthFilter === m.month ? "all" : m.month), className: `px-4 py-3 rounded-xl border text-left min-w-[90px] transition-all ${monthFilter === m.month ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 hover:border-indigo-200"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-[9px] font-black uppercase ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`, children: m.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xl font-black ${monthFilter === m.month ? "text-white" : "text-slate-800"}`, children: m.count }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-[9px] font-bold ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`, children: t("webs") })
    ] }, m.month)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase text-slate-400 mb-6 tracking-widest", children: t("shopifyMonthlyRegChart") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-52", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: monthlyBar, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "month", axisLine: false, tickLine: false, tick: {
          fontSize: 10,
          fontWeight: 700
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { allowDecimals: false, hide: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => [v, t("webs")] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "count", fill: "#6366f1", radius: [4, 4, 0, 0], barSize: 32 })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: t("shopifySearchPlaceholder"), className: "flex-1 min-w-[200px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl", value: search, onChange: (e) => setSearch(e.target.value) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer", value: monthFilter, onChange: (e) => setMonthFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "all", children: [
          "📅 ",
          t("allMonths")
        ] }),
        monthlyReg.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m.month, children: m.label }, m.month))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer", value: regFilter, onChange: (e) => setRegFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "all", children: [
          "👤 ",
          t("allRegistrants")
        ] }),
        regOptions.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r, children: r }, r))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setExpiringOnly(!expiringOnly), className: `px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${expiringOnly ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`, children: [
        "⚠️ ≤",
        EXPIRING_DAYS,
        " ",
        t("days")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-slate-400 uppercase", children: [
        filtered.length,
        " ",
        t("records")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left table-fixed min-w-[1100px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[12%]", children: t("thRegistrant") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[20%]", children: t("thWebsite") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[10%]", children: t("shopifyRegDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[10%]", children: t("shopifyExpiryDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%] text-center", children: t("shopifyDaysLeft") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[14%]", children: t("thAdsCard") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[12%]", children: t("shopifyWebhooks") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("status") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          paginated.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `hover:bg-slate-50/60 ${isExpiringSoon(r) ? "bg-amber-50/50" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase", children: r.nguoiReg || "—" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-bold text-slate-700 lowercase truncate", children: r.web }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[11px] font-bold text-slate-500 whitespace-nowrap", children: r.ngayDangKy || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[11px] font-bold text-slate-500 whitespace-nowrap", children: r.ngayHetHan || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DaysLeftBadge, { days: r.isCanceled ? null : r.daysLeft }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-mono text-slate-600 truncate", children: r.the || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-bold text-slate-500 truncate", children: r.thayWebhooks || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: r.isCanceled ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded-lg", children: t("canceled") }) : isExpiringSoon(r) ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded-lg", children: t("expiringSoon") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg", children: t("active") }) })
          ] }, `${r.web}-${i}`)),
          paginated.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "text-center p-14 text-sm text-slate-400", children: t("noMatchingRecords") }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage: page, totalItems: filtered.length, itemsPerPage: ITEMS, onPageChange: setPage })
    ] })
  ] }) });
}
export {
  ShopifyPage as component
};
