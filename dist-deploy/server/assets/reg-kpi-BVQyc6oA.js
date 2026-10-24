import { r as reactExports, X as jsxRuntimeExports } from "./server-D1kiBNQ3.js";
import { u as useQuery } from "./useQuery-ClPJIjB8.js";
import { R as REG_KPI_SHEETS, w as getRegKpiData } from "./dataService-NS9qAXcf.js";
import { P as Pagination } from "./pagination-CE6NAvSw.js";
import { M as MonthWeeklyKpiBlock } from "./month-weekly-kpi-block-tbx5ho8c.js";
import { M as MonthFilterTabs } from "./month-filter-tabs-D7_uYnKA.js";
import { g as getCurrentMonthKey, a as aggregateWeekRows, b as parseDmyDate } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-48ILCIjq.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
import "./BarChart-DS-nHvlf.js";
import "./clsx-DgYk2OaC.js";
const ITEMS = 12;
const OWNER_COLORS = {
  long: "#3b82f6",
  thinh: "#f59e0b",
  "quoc-an": "#8b5cf6",
  chuong: "#ef4444",
  "bao-han": "#22c55e"
};
const isLive = (status) => {
  const s = status.toLowerCase().trim();
  if (!s || s === "—") return true;
  if (s === "xanh" || s.includes("chưa sus")) return true;
  return !(s.includes("đã sus") || s.includes("sus") || s === "die" || s.includes("sus lại"));
};
const isFail = (val) => val.toLowerCase().includes("fail");
const isPass = (val) => val.toLowerCase().includes("pass");
const parseRegMonth = (dateStr) => {
  if (!dateStr || dateStr === "—") return null;
  const dmy = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!dmy) return null;
  const month = Number(dmy[2]);
  if (month < 1 || month > 12) return null;
  return `${dmy[3]}-${dmy[2].padStart(2, "0")}`;
};
const fmtMonthKey = (ym) => {
  const [y, m] = ym.split("-");
  return `${m}/${y}`;
};
const hasRegGmcDate = (dateStr) => Boolean(parseRegMonth(dateStr));
function RegKpiPage() {
  const {
    t
  } = useTranslation();
  const [ownerFilter, setOwnerFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [monthFilter, setMonthFilter] = reactExports.useState("");
  const [activeKpiMonth, setActiveKpiMonth] = reactExports.useState(getCurrentMonthKey);
  const [search, setSearch] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const {
    data: records = [],
    isLoading
  } = useQuery({
    queryKey: ["regKpiData"],
    queryFn: () => getRegKpiData(true),
    refetchInterval: 3e4
  });
  const ownerPool = reactExports.useMemo(() => ownerFilter === "all" ? records : records.filter((r) => r.ownerId === ownerFilter), [records, ownerFilter]);
  const latestMonth = reactExports.useMemo(() => {
    const months = ownerPool.map((r) => parseRegMonth(r.dateRegGmc)).filter(Boolean);
    if (!months.length) return getCurrentMonthKey();
    return months.sort((a, b) => b.localeCompare(a))[0];
  }, [ownerPool]);
  reactExports.useEffect(() => {
    setMonthFilter(latestMonth);
    setPage(1);
  }, [ownerFilter, latestMonth]);
  const activeMonth = monthFilter === "all" ? "all" : monthFilter || latestMonth;
  const monthTabItems = reactExports.useMemo(() => {
    const map = {};
    ownerPool.forEach((r) => {
      const m = parseRegMonth(r.dateRegGmc);
      if (!m) return;
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([month, count]) => ({
      month,
      count
    }));
  }, [ownerPool]);
  const monthPool = reactExports.useMemo(() => {
    if (activeMonth === "all") return ownerPool;
    return ownerPool.filter((r) => parseRegMonth(r.dateRegGmc) === activeMonth);
  }, [ownerPool, activeMonth]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchOwner = ownerFilter === "all" || r.ownerId === ownerFilter;
      const live = isLive(r.susStatus);
      const matchStatus = statusFilter === "all" ? true : statusFilter === "live" ? live : !live;
      const matchMonth = activeMonth === "all" || parseRegMonth(r.dateRegGmc) === activeMonth;
      const matchSearch = !q || r.domain.includes(q) || r.note.toLowerCase().includes(q);
      return matchOwner && matchStatus && matchMonth && matchSearch;
    });
  }, [records, ownerFilter, statusFilter, activeMonth, search]);
  const monthlyReg = reactExports.useMemo(() => {
    const map = {};
    ownerPool.forEach((r) => {
      const month = parseRegMonth(r.dateRegGmc);
      if (!month) return;
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({
      month,
      label: fmtMonthKey(month),
      count
    }));
  }, [ownerPool]);
  const weeklyRows = reactExports.useMemo(() => aggregateWeekRows(ownerPool.filter((r) => hasRegGmcDate(r.dateRegGmc)).map((r) => ({
    date: parseDmyDate(r.dateRegGmc),
    group: r.ownerName,
    item: r.domain
  }))), [ownerPool]);
  const stats = reactExports.useMemo(() => {
    const pool = monthPool;
    const total = pool.length;
    const live = pool.filter((r) => isLive(r.susStatus)).length;
    const sus = total - live;
    const khangFail = pool.filter((r) => isFail(r.ketQua1) || isFail(r.ketQua2) || isFail(r.ketQua3)).length;
    const khangPass = pool.filter((r) => isPass(r.ketQua1) || isPass(r.ketQua2) || isPass(r.ketQua3)).length;
    return {
      total,
      live,
      sus,
      khangFail,
      khangPass
    };
  }, [monthPool]);
  const paginated = reactExports.useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filtered.slice(start, start + ITEMS);
  }, [filtered, page]);
  reactExports.useEffect(() => {
    setPage(1);
  }, [ownerFilter, statusFilter, activeMonth, search]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingSystemData") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("regKpiTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("regKpiDesc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-widest", children: t("kpiMonthFilterReg") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MonthFilterTabs, { items: monthTabItems, totalWithDate: ownerPool.filter((r) => parseRegMonth(r.dateRegGmc)).length, selected: activeMonth, onSelect: (m) => {
        setMonthFilter(m);
        if (m !== "all") setActiveKpiMonth(m);
        setPage(1);
      }, allLabel: t("allMonths") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOwnerFilter("all"), className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${ownerFilter === "all" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"}`, children: [
        t("allOwners"),
        " (",
        records.length,
        ")"
      ] }),
      REG_KPI_SHEETS.map((s) => {
        const count = records.filter((r) => r.ownerId === s.id).length;
        const active = ownerFilter === s.id;
        const color = OWNER_COLORS[s.id];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOwnerFilter(s.id), className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "text-white shadow-md" : "bg-white"}`, style: active ? {
          background: color,
          borderColor: color
        } : {
          color,
          borderColor: color,
          background: `${color}15`
        }, children: [
          s.name,
          " (",
          count,
          ")"
        ] }, s.id);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-slate-800 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: t("totalRegGmc") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black mt-1", children: stats.total })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-500", children: t("active") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-emerald-600 mt-1", children: stats.live })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-red-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-red-500", children: t("suspended") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-red-600 mt-1", children: stats.sus })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-amber-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-amber-500", children: t("khangFail") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-amber-600 mt-1", children: stats.khangFail })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-blue-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-blue-500", children: t("khangPass") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-blue-600 mt-1", children: stats.khangPass })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MonthWeeklyKpiBlock, { monthlyData: monthlyReg, weeklyRows, activeMonth: activeMonth !== "all" ? activeMonth : activeKpiMonth, onMonthChange: (m) => {
      setActiveKpiMonth(m);
      setMonthFilter(m);
    }, groupColumnLabel: t("owner", "Người"), title: t("monthlyRegTitle"), subtitle: t("monthlyKpiNote"), emptyHint: t("weeklyKpiRegHint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: t("searchDomainPlaceholder"), className: "flex-1 min-w-[200px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl", value: search, onChange: (e) => setSearch(e.target.value) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("status") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "live", children: [
          "🟢 ",
          t("active")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "sus", children: [
          "🔴 ",
          t("suspended")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left table-fixed min-w-[1200px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("owner") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[14%]", children: t("webAndPlatform") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("gmcReturnDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("khangRound", {
            n: 1
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[7%]", children: t("result") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("khangRound", {
            n: 2
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[7%]", children: t("result") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[8%]", children: t("khangRound", {
            n: 3
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[7%]", children: t("result") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[11%]", children: t("note") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          paginated.map((r, i) => {
            const live = isLive(r.susStatus);
            const color = OWNER_COLORS[r.ownerId] ?? "#64748b";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black px-2 py-1 rounded-lg uppercase text-white", style: {
                background: color
              }, children: r.ownerName }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm lowercase truncate", children: r.domain }),
                r.webType && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 uppercase font-bold", children: r.webType })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold text-slate-600", children: r.dateRegGmc || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-black px-2 py-1 rounded-full uppercase ${live ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`, children: r.susStatus }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs text-slate-500", children: r.khang1Date || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold", children: r.ketQua1 || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs text-slate-500", children: r.khang2Date || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold", children: r.ketQua2 || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs text-slate-500", children: r.khang3Date || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold", children: r.ketQua3 || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] text-slate-500 truncate", title: r.note, children: r.note || "—" })
            ] }, i);
          }),
          paginated.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 11, className: "text-center p-14 text-slate-400", children: t("noAccountData") }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage: page, totalItems: filtered.length, itemsPerPage: ITEMS, onPageChange: setPage })
    ] })
  ] }) });
}
export {
  RegKpiPage as component
};
