import { r as reactExports, X as jsxRuntimeExports } from "./server-Cwx-SqE5.js";
import { u as useQuery } from "./useQuery-Dp7ElvcN.js";
import { o as getChiPhiExpenses } from "./dataService-DOjie6uP.js";
import { P as Pagination } from "./pagination-CrTh0bgO.js";
import { M as MonthFilterTabs } from "./month-filter-tabs-Ceg_Y-qc.js";
import { u as useTranslation } from "./router-CBS5TEKh.js";
import { R as ResponsiveContainer, C as Cell, T as Tooltip, B as BarChart, a as CartesianGrid, X as XAxis, Y as YAxis, b as Bar } from "./BarChart-B63QunF2.js";
import { P as PieChart, a as Pie } from "./PieChart-Cx8FIGSs.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
import "./kpiWeek-uKv2Fy6X.js";
import "./clsx-DgYk2OaC.js";
const ITEMS = 12;
const TYPE_COLORS = {
  "Mua domain": {
    bg: "#eff6ff",
    text: "#1e40af",
    border: "#93c5fd",
    bar: "#3b82f6"
  },
  "Chi phí ADS": {
    bg: "#fdf4ff",
    text: "#6b21a8",
    border: "#d8b4fe",
    bar: "#a855f7"
  },
  "Đăng kí GMC": {
    bg: "#f0fdf4",
    text: "#166534",
    border: "#86efac",
    bar: "#22c55e"
  },
  "Đăng ký GMC": {
    bg: "#f0fdf4",
    text: "#166534",
    border: "#86efac",
    bar: "#22c55e"
  },
  "Mua mail": {
    bg: "#fff7ed",
    text: "#9a3412",
    border: "#fdba74",
    bar: "#f97316"
  },
  "Mua Proxy": {
    bg: "#f5f3ff",
    text: "#5b21b6",
    border: "#c4b5fd",
    bar: "#8b5cf6"
  },
  "Chi phí khác": {
    bg: "#f8fafc",
    text: "#334155",
    border: "#cbd5e1",
    bar: "#64748b"
  },
  Trendsi: {
    bg: "#ecfeff",
    text: "#0e7490",
    border: "#67e8f9",
    bar: "#06b6d4"
  },
  "Nạp textverify": {
    bg: "#fef2f2",
    text: "#991b1b",
    border: "#fca5a5",
    bar: "#ef4444"
  }
};
const defaultColor = {
  bg: "#f8fafc",
  text: "#334155",
  border: "#cbd5e1",
  bar: "#64748b"
};
const getTypeColor = (loai) => TYPE_COLORS[loai] ?? defaultColor;
const fmtUSD = (n) => n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
const fmtMonth = (ym) => {
  const [y, m] = ym.split("-");
  return `${parseInt(m)}/${y}`;
};
const currentMonthKey = () => {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
const fmtVND = (n) => `${n.toLocaleString("vi-VN")} VND`;
const expenseAmountUSD = (e) => (e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0);
const expenseAmountVND = (e) => e.chiPhiVND || 0;
const expensePendingUSD = (e) => e.refundStatus === "pending" ? expenseAmountUSD(e) : 0;
const sumExpenseTotals = (list) => {
  const usd = list.reduce((s, e) => s + expenseAmountUSD(e), 0);
  const vnd = list.reduce((s, e) => s + expenseAmountVND(e), 0);
  const pendingUsd = list.reduce((s, e) => s + expensePendingUSD(e), 0);
  return {
    usd,
    vnd,
    pendingUsd,
    netUsd: usd - pendingUsd
  };
};
const statsForExpenses = (list) => {
  const map = {};
  for (const e of list) {
    if (!map[e.loaiChiPhi]) map[e.loaiChiPhi] = {
      count: 0,
      usd: 0,
      vnd: 0,
      pendingUsd: 0,
      netUsd: 0
    };
    const usd = expenseAmountUSD(e);
    const pending = expensePendingUSD(e);
    map[e.loaiChiPhi].count += 1;
    map[e.loaiChiPhi].usd += usd;
    map[e.loaiChiPhi].vnd += expenseAmountVND(e);
    map[e.loaiChiPhi].pendingUsd += pending;
    map[e.loaiChiPhi].netUsd += usd - pending;
  }
  return map;
};
function MoneyTotals({
  totals,
  usdClass = "text-2xl font-black",
  vndClass = "text-sm font-black text-amber-600 mt-1",
  light = false
}) {
  const usdColor = light ? "text-white" : "text-slate-900";
  const vndColor = light ? "text-amber-200" : "text-amber-600";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    totals.usd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `${usdClass} ${usdColor}`, children: fmtUSD(totals.usd) }),
    totals.vnd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `${vndClass} ${vndColor}`, children: fmtVND(totals.vnd) }),
    totals.usd === 0 && totals.vnd === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `${usdClass} text-slate-400`, children: "-" })
  ] });
}
function AmountCell({
  e
}) {
  if (e.chiPhiUSDT > 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200", children: [
      e.chiPhiUSDT,
      " USDT"
    ] });
  }
  if (e.chiPhiVND > 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded", children: [
      e.chiPhiVND.toLocaleString("vi-VN"),
      " VND"
    ] });
  }
  if (e.chiPhiRaw && /vnd|₫/i.test(e.chiPhiRaw) && !e.chiPhiUSD) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-black text-amber-600", children: e.chiPhiRaw });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-black text-slate-900", children: fmtUSD(e.chiPhiUSD || 0) });
}
function RefundBadge({
  e
}) {
  const {
    t
  } = useTranslation();
  if (e.refundStatus === "pending") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200", children: t("refundPending") });
  }
  if (e.refundStatus === "refunded") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200", children: t("refundDone") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "-" });
}
function ChiPhiPage() {
  const {
    t
  } = useTranslation();
  const [loaiFilter, setLoaiFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [monthFilter, setMonthFilter] = reactExports.useState("all");
  const [regFilter, setRegFilter] = reactExports.useState("all");
  const [refundFilter, setRefundFilter] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const {
    data: expenses = [],
    isLoading
  } = useQuery({
    queryKey: ["chiPhiExpenses"],
    queryFn: () => getChiPhiExpenses(true),
    refetchInterval: 3e4
  });
  const monthTabItems = reactExports.useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (!e.month) return;
      map[e.month] = (map[e.month] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([month, count]) => ({
      month,
      count
    }));
  }, [expenses]);
  const monthWithDateCount = reactExports.useMemo(() => expenses.filter((e) => e.month).length, [expenses]);
  const loaiOptions = reactExports.useMemo(() => [...new Set(expenses.map((e) => e.loaiChiPhi).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [expenses]);
  const monthOptions = reactExports.useMemo(() => [...new Set(expenses.map((e) => e.month).filter(Boolean))].sort((a, b) => b.localeCompare(a)), [expenses]);
  const regOptions = reactExports.useMemo(() => [...new Set(expenses.map((e) => e.tenReg).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")), [expenses]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchLoai = loaiFilter === "all" || e.loaiChiPhi === loaiFilter;
      const matchMonth = monthFilter === "all" || e.month === monthFilter;
      const matchReg = regFilter === "all" || e.tenReg === regFilter;
      const matchRefund = refundFilter === "all" || e.refundStatus === refundFilter;
      const matchSearch = !q || e.tenWeb.toLowerCase().includes(q) || e.tenReg.toLowerCase().includes(q) || e.tenTheAds.toLowerCase().includes(q) || e.loaiChiPhi.toLowerCase().includes(q) || e.dangThe.toLowerCase().includes(q) || e.choHoanTien.toLowerCase().includes(q);
      return matchLoai && matchMonth && matchReg && matchRefund && matchSearch;
    });
  }, [expenses, loaiFilter, monthFilter, regFilter, refundFilter, search]);
  const statsByType = reactExports.useMemo(() => statsForExpenses(expenses), [expenses]);
  const monthlyStats = reactExports.useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (!e.month) return;
      if (!map[e.month]) map[e.month] = {
        totalUsd: 0,
        totalVnd: 0,
        pendingUsd: 0,
        netUsd: 0,
        count: 0
      };
      const usd = expenseAmountUSD(e);
      const pending = expensePendingUSD(e);
      map[e.month].totalUsd += usd;
      map[e.month].totalVnd += expenseAmountVND(e);
      map[e.month].pendingUsd += pending;
      map[e.month].netUsd += usd - pending;
      map[e.month].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([month, data]) => ({
      month,
      label: fmtMonth(month),
      ...data
    }));
  }, [expenses]);
  const thisMonthKey = reactExports.useMemo(() => currentMonthKey(), []);
  const currentMonthExpenses = reactExports.useMemo(() => expenses.filter((e) => e.month === thisMonthKey), [expenses, thisMonthKey]);
  const currentMonthStats = reactExports.useMemo(() => statsForExpenses(currentMonthExpenses), [currentMonthExpenses]);
  const prevMonthKey = reactExports.useMemo(() => {
    const [y, m] = thisMonthKey.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [thisMonthKey]);
  const currentMonthTotals = reactExports.useMemo(() => sumExpenseTotals(currentMonthExpenses), [currentMonthExpenses]);
  const prevMonthTotals = reactExports.useMemo(() => sumExpenseTotals(expenses.filter((e) => e.month === prevMonthKey)), [expenses, prevMonthKey]);
  const filteredStatsByType = reactExports.useMemo(() => statsForExpenses(filtered), [filtered]);
  const pendingCount = reactExports.useMemo(() => filtered.filter((e) => e.refundStatus === "pending").length, [filtered]);
  const pieData = reactExports.useMemo(() => {
    const source = monthFilter === "all" && loaiFilter === "all" && regFilter === "all" && refundFilter === "all" ? statsByType : filteredStatsByType;
    return Object.entries(source).map(([name, {
      usd
    }]) => ({
      name,
      value: usd,
      color: getTypeColor(name).bar
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [statsByType, filteredStatsByType, monthFilter, loaiFilter, regFilter, refundFilter]);
  const pieDataVnd = reactExports.useMemo(() => {
    const source = monthFilter === "all" && loaiFilter === "all" && regFilter === "all" && refundFilter === "all" ? statsByType : filteredStatsByType;
    return Object.entries(source).map(([name, {
      vnd
    }]) => ({
      name,
      value: vnd,
      color: getTypeColor(name).bar
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [statsByType, filteredStatsByType, monthFilter, loaiFilter, regFilter, refundFilter]);
  const monthlyBar = reactExports.useMemo(() => monthlyStats.slice().sort((a, b) => a.month.localeCompare(b.month)).map(({
    label,
    totalUsd,
    totalVnd,
    pendingUsd,
    netUsd
  }) => ({
    month: label,
    totalUsd,
    totalVnd,
    pendingUsd,
    netUsd
  })), [monthlyStats]);
  const paginated = reactExports.useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filtered.slice(start, start + ITEMS);
  }, [filtered, page]);
  const grandTotals = reactExports.useMemo(() => sumExpenseTotals(expenses), [expenses]);
  const filteredTotals = reactExports.useMemo(() => sumExpenseTotals(filtered), [filtered]);
  const displayTotals = monthFilter === "all" && loaiFilter === "all" && regFilter === "all" && refundFilter === "all" ? grandTotals : filteredTotals;
  const typeCards = reactExports.useMemo(() => {
    const source = monthFilter === "all" && regFilter === "all" && refundFilter === "all" ? statsByType : filteredStatsByType;
    return Object.entries(source).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.usd - a.usd || b.count - a.count);
  }, [statsByType, filteredStatsByType, monthFilter, regFilter, refundFilter]);
  reactExports.useEffect(() => {
    setPage(1);
  }, [loaiFilter, search, monthFilter, regFilter, refundFilter]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingSystemData") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight text-slate-900", children: t("chiPhiTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("chiPhiDesc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-widest", children: t("chiPhiMonthFilterTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MonthFilterTabs, { items: monthTabItems, totalWithDate: monthWithDateCount, selected: monthFilter, onSelect: (m) => {
        setMonthFilter(m);
        setPage(1);
      }, allLabel: t("allMonths") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-widest", children: t("allExpenseTypes") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setLoaiFilter("all"), className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${loaiFilter === "all" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`, children: [
          t("allExpenseTypes"),
          " (",
          expenses.length,
          ")"
        ] }),
        loaiOptions.map((loai) => {
          const c = getTypeColor(loai);
          const active = loaiFilter === loai;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setLoaiFilter(loai), className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "shadow-md text-white" : "bg-white"}`, style: active ? {
            background: c.bar,
            borderColor: c.bar
          } : {
            color: c.text,
            borderColor: c.border,
            background: c.bg
          }, children: [
            loai,
            " (",
            statsByType[loai]?.count ?? 0,
            ")"
          ] }, loai);
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-500 tracking-widest", children: t("totalCostGross") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-emerald-600 mt-1", children: fmtUSD(displayTotals.usd) }),
        displayTotals.vnd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black text-amber-600 mt-1", children: fmtVND(displayTotals.vnd) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-slate-400 mt-2", children: [
          filtered.length,
          " ",
          t("records")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-amber-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-amber-500 tracking-widest", children: t("pendingRefundTotal") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-amber-600 mt-1", children: fmtUSD(displayTotals.pendingUsd) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-amber-400 mt-2", children: [
          pendingCount,
          " ",
          t("pendingRefundRows")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-indigo-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-500 tracking-widest", children: t("netCostAfterRefund") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-indigo-600 mt-1", children: fmtUSD(displayTotals.netUsd) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-indigo-300 mt-2", children: t("netCostHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-slate-700 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-500 tracking-widest", children: t("allTimeTotal") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-black text-slate-800 mt-1", children: fmtUSD(grandTotals.usd) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-slate-400 mt-2", children: [
          t("netCostAfterRefund"),
          ": ",
          fmtUSD(grandTotals.netUsd)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-slate-500", children: t("spendByCategory") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: typeCards.map((d) => {
        const c = getTypeColor(d.name);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setLoaiFilter(loaiFilter === d.name ? "all" : d.name), className: `text-left p-4 rounded-2xl border transition-all border-t-2 ${loaiFilter === d.name ? "shadow-md ring-2 ring-offset-1" : "bg-white hover:shadow-sm"}`, style: {
          borderTopColor: c.bar,
          ...loaiFilter === d.name ? {
            background: c.bg
          } : {}
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase truncate", style: {
            color: c.text
          }, children: d.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black text-slate-900 mt-1", children: d.usd > 0 ? fmtUSD(d.usd) : "-" }),
          d.pendingUsd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-amber-600 mt-0.5", children: [
            "-",
            fmtUSD(d.pendingUsd),
            " ",
            t("refundPending").toLowerCase()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black text-indigo-600 mt-1", children: [
            t("netShort"),
            ": ",
            fmtUSD(d.netUsd)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-slate-400 mt-2", children: [
            d.count,
            " ",
            t("records")
          ] })
        ] }, d.name);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-indigo-200 shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-indigo-600 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-200 tracking-widest", children: t("currentMonthDash") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-black text-white mt-1", children: [
            t("monthLabel"),
            " ",
            fmtMonth(thisMonthKey)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setMonthFilter(monthFilter === thisMonthKey ? "all" : thisMonthKey), className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-white/15 text-white hover:bg-white/25 transition-all", children: monthFilter === thisMonthKey ? t("clearMonthFilter") : t("filterThisMonth") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-indigo-50 p-4 rounded-2xl border border-indigo-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-400", children: t("thisMonthSpend") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MoneyTotals, { totals: currentMonthTotals, usdClass: "text-2xl font-black text-indigo-700", vndClass: "text-sm font-black mt-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-amber-600 mt-1", children: [
            t("pendingRefundTotal"),
            ": ",
            fmtUSD(currentMonthTotals.pendingUsd)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-indigo-500 mt-1", children: [
            t("netCostAfterRefund"),
            ": ",
            fmtUSD(currentMonthTotals.netUsd)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-indigo-300 mt-2", children: [
            currentMonthExpenses.length,
            " ",
            t("records")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 p-4 rounded-2xl border border-slate-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: t("prevMonthSpend") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MoneyTotals, { totals: prevMonthTotals, usdClass: "text-2xl font-black text-slate-700", vndClass: "text-sm font-black mt-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold text-slate-300 mt-2", children: fmtMonth(prevMonthKey) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-50 p-4 rounded-2xl border border-emerald-100", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-500", children: t("allTimeTotal") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MoneyTotals, { totals: grandTotals, usdClass: "text-2xl font-black text-emerald-700", vndClass: "text-sm font-black mt-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-emerald-300 mt-2", children: [
            expenses.length,
            " ",
            t("records")
          ] })
        ] }),
        Object.entries(currentMonthStats).sort((a, b) => b[1].usd + b[1].vnd - (a[1].usd + a[1].vnd)).slice(0, 3).map(([name, {
          usd,
          vnd,
          count,
          netUsd
        }]) => {
          const c = getTypeColor(name);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-100 border-t-2", style: {
            borderTopColor: c.bar
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 truncate", children: name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(MoneyTotals, { totals: {
              usd,
              vnd
            }, usdClass: "text-xl font-black", vndClass: "text-xs font-black mt-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-indigo-500 mt-1", children: [
              t("netShort"),
              ": ",
              fmtUSD(netUsd)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-slate-300 mt-2", children: [
              count,
              " ",
              t("records")
            ] })
          ] }, name);
        }),
        currentMonthExpenses.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-full text-center py-4 text-sm font-medium text-slate-400", children: t("noSpendThisMonth") })
      ] })
    ] }),
    monthlyStats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: monthlyStats.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setMonthFilter(monthFilter === m.month ? "all" : m.month), className: `px-4 py-3 rounded-xl border text-left transition-all hover:shadow-md min-w-[110px] ${monthFilter === m.month ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 hover:border-indigo-200"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-[9px] font-black uppercase ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`, children: m.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg font-black mt-0.5 ${monthFilter === m.month ? "text-white" : "text-slate-800"}`, children: m.totalUsd > 0 ? fmtUSD(m.totalUsd) : null }),
      m.pendingUsd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-[10px] font-bold ${monthFilter === m.month ? "text-amber-200" : "text-amber-600"}`, children: [
        "-",
        fmtUSD(m.pendingUsd)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-[10px] font-black ${monthFilter === m.month ? "text-indigo-100" : "text-indigo-600"}`, children: [
        t("netShort"),
        ": ",
        fmtUSD(m.netUsd)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-[9px] font-bold ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`, children: [
        m.count,
        " ",
        t("records")
      ] })
    ] }, m.month)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black uppercase text-slate-400 mb-6 tracking-widest", children: [
          t("spendByCategory"),
          " (USD)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data: pieData, innerRadius: 55, outerRadius: 80, paddingAngle: 4, dataKey: "value", children: pieData.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: e.color }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => [fmtUSD(v), ""] })
        ] }) }) })
      ] }),
      pieDataVnd.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase text-amber-500 mb-6 tracking-widest", children: t("spendByCategoryVnd") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data: pieDataVnd, innerRadius: 55, outerRadius: 80, paddingAngle: 4, dataKey: "value", children: pieDataVnd.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: e.color }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => [fmtVND(v), ""] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `bg-white p-6 rounded-3xl border border-slate-200 shadow-sm ${pieDataVnd.length > 0 ? "" : "lg:col-span-2"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase text-slate-400 mb-6 tracking-widest", children: t("monthlySpendUsd") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: monthlyBar, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "month", axisLine: false, tickLine: false, tick: {
            fontSize: 9,
            fontWeight: 700
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { hide: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v, name) => [fmtUSD(v), name === "netUsd" ? t("netCostAfterRefund") : t("totalSpendUsd")] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "totalUsd", radius: [4, 4, 0, 0], barSize: 16, fill: "#8b5cf6", name: "totalUsd" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "netUsd", radius: [4, 4, 0, 0], barSize: 16, fill: "#6366f1", name: "netUsd" })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: t("searchExpensePlaceholder"), className: "flex-1 min-w-[200px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl", value: search, onChange: (e) => setSearch(e.target.value) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600", value: monthFilter, onChange: (e) => setMonthFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("allMonths") }),
        monthOptions.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: m, children: fmtMonth(m) }, m))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600", value: regFilter, onChange: (e) => setRegFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("allRegistrants") }),
        regOptions.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r, children: r.toUpperCase() }, r))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600", value: refundFilter, onChange: (e) => setRefundFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("refundFilterAll") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: t("refundPending") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "refunded", children: t("refundDone") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "none", children: t("refundNone") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-bold text-slate-400 uppercase px-2 flex flex-col items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          filtered.length,
          " ",
          t("records")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-600", children: fmtUSD(filteredTotals.usd) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-indigo-600", children: [
          t("netShort"),
          ": ",
          fmtUSD(filteredTotals.netUsd)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left table-fixed min-w-[1280px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[10%]", children: t("thRegistrant") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[11%]", children: t("thType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[9%]", children: t("thDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[16%]", children: t("thWebsite") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[12%]", children: t("thAdsCard") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[12%]", children: t("thCardType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[9%] text-right", children: t("thAmount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[11%]", children: t("thRefundStatus") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[10%]", children: t("thBill") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          paginated.map((e, i) => {
            const c = getTypeColor(e.loaiChiPhi);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `hover:bg-slate-50/60 transition-all ${e.refundStatus === "pending" ? "bg-amber-50/40" : ""}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg uppercase", children: e.tenReg }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black px-2.5 py-1 rounded-full uppercase", style: {
                background: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`
              }, children: e.loaiChiPhi }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[11px] text-slate-500 font-bold whitespace-nowrap", children: e.ngayThanhToan || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-bold text-slate-700 lowercase truncate", children: e.tenWeb || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[11px] font-bold text-slate-600 truncate", children: e.tenTheAds || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-medium text-slate-500 truncate", title: e.dangThe, children: e.dangThe || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AmountCell, { e }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefundBadge, { e }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: e.billChiPhi ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1", children: e.billChiPhi.split(/[,|]/).map((link) => link.trim()).filter(Boolean).map((cleanLink, idx, arr) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: cleanLink, target: "_blank", rel: "noreferrer", className: "text-[10px] font-black text-blue-500 hover:text-blue-700 underline truncate", children: arr.length > 1 ? `${t("viewBill")} #${idx + 1}` : t("viewBill") }, idx)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "-" }) })
            ] }, i);
          }),
          paginated.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 9, className: "text-center p-14 text-sm font-medium text-slate-400", children: t("noExpenseRecordsFound") }) })
        ] }),
        filtered.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-900 text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { colSpan: 6, className: "p-4 text-[10px] font-black uppercase tracking-widest", children: [
            t("tableTotal"),
            " (",
            filtered.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1", children: [
            filteredTotals.usd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-black text-emerald-300", children: fmtUSD(filteredTotals.usd) }),
            filteredTotals.pendingUsd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black text-amber-300", children: [
              "-",
              fmtUSD(filteredTotals.pendingUsd)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black text-indigo-300", children: [
              t("netShort"),
              ": ",
              fmtUSD(filteredTotals.netUsd)
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4" })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage: page, totalItems: filtered.length, itemsPerPage: ITEMS, onPageChange: setPage })
    ] })
  ] }) });
}
export {
  ChiPhiPage as component
};
