import { r as reactExports, X as jsxRuntimeExports } from "./server-D1kiBNQ3.js";
import { g as getCurrentMonthKey, f as fmtMonthShort, s as sumByWeek, c as fmtMonthKey } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-48ILCIjq.js";
import { R as ResponsiveContainer, B as BarChart, a as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, b as Bar, L as LabelList, C as Cell } from "./BarChart-DS-nHvlf.js";
const MONTH_PALETTE = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#f43f5e",
  "#14b8a6",
  "#f97316",
  "#6366f1"
];
const WEEK_STYLES = [
  { bg: "bg-blue-50", border: "border-blue-200", label: "text-blue-500", count: "text-blue-600", bar: "#3b82f6" },
  { bg: "bg-emerald-50", border: "border-emerald-200", label: "text-emerald-500", count: "text-emerald-600", bar: "#22c55e" },
  { bg: "bg-amber-50", border: "border-amber-200", label: "text-amber-500", count: "text-amber-600", bar: "#f59e0b" },
  { bg: "bg-violet-50", border: "border-violet-200", label: "text-violet-500", count: "text-violet-600", bar: "#8b5cf6" }
];
function groupColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return MONTH_PALETTE[Math.abs(hash) % MONTH_PALETTE.length];
}
function monthBarFill(color, entry) {
  if (entry.isActive) return color;
  if (entry.isCurrent) return `${color}cc`;
  return `${color}66`;
}
function MonthWeeklyKpiBlock({
  monthlyData,
  weeklyRows,
  activeMonth,
  onMonthChange,
  groupColumnLabel,
  title,
  subtitle,
  emptyHint,
  ownerStack,
  ownerBars
}) {
  const { t } = useTranslation();
  const currentMonth = getCurrentMonthKey();
  const chartData = reactExports.useMemo(
    () => monthlyData.map((m, i) => ({
      ...m,
      shortLabel: fmtMonthShort(m.month),
      color: MONTH_PALETTE[i % MONTH_PALETTE.length],
      isCurrent: m.month === currentMonth,
      isActive: m.month === activeMonth
    })),
    [monthlyData, currentMonth, activeMonth]
  );
  const activeMonthRows = reactExports.useMemo(
    () => weeklyRows.filter((r) => r.month === activeMonth),
    [weeklyRows, activeMonth]
  );
  const weekTotals = reactExports.useMemo(
    () => sumByWeek(activeMonthRows, activeMonth).filter((w) => w.count > 0),
    [activeMonthRows, activeMonth]
  );
  const weekChartData = reactExports.useMemo(
    () => weekTotals.map((w) => ({
      ...w,
      color: WEEK_STYLES[(w.week - 1) % WEEK_STYLES.length].bar
    })),
    [weekTotals]
  );
  const monthTotal = activeMonthRows.reduce((s, r) => s + r.count, 0);
  const activeLabel = fmtMonthShort(activeMonth);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase text-indigo-400 tracking-widest", children: title ?? t("monthlyKpiTitle", "KPI theo tháng") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 rounded-xl shrink-0 shadow-md shadow-indigo-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-100", children: activeMonth === currentMonth ? t("thisMonth", "Tháng này") : activeLabel }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black text-white", children: [
          monthTotal,
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-indigo-100", children: t("webs", "web") })
        ] })
      ] })
    ] }),
    chartData.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        BarChart,
        {
          data: chartData,
          margin: { top: 14, right: 4, left: 4, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: "shortLabel",
                tick: { fontSize: 9, fontWeight: 600, fill: "#64748b" },
                axisLine: false,
                tickLine: false,
                interval: 0
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { hide: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                formatter: (v) => [v, t("webs", "web")],
                labelFormatter: (_, payload) => {
                  const row = payload?.[0]?.payload;
                  return row?.month ? fmtMonthKey(row.month) : "";
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Bar,
              {
                dataKey: "count",
                radius: [2, 2, 0, 0],
                barSize: 16,
                name: t("webs", "web"),
                cursor: "pointer",
                onClick: (data) => {
                  const month = data?.payload?.month;
                  if (month) onMonthChange(month);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LabelList, { dataKey: "count", position: "top", style: { fontSize: 9, fontWeight: 800, fill: "#475569" } }),
                  chartData.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Cell,
                    {
                      fill: monthBarFill(entry.color, entry),
                      stroke: entry.isActive ? entry.color : "none",
                      strokeWidth: entry.isActive ? 2 : 0
                    },
                    entry.month
                  ))
                ]
              }
            )
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-indigo-400/80 mt-2 text-center", children: subtitle ?? t("monthlyKpiNote", "Bấm cột tháng để xem KPI tuần · mặc định tháng hiện tại") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: emptyHint ?? t("weeklyKpiNoData") }),
    ownerStack && ownerStack.length > 0 && ownerBars && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-24 border-t border-slate-100 pt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest", children: t("monthlyRegByOwner", "REG theo người") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: ownerStack, margin: { top: 4, right: 4, left: 4, bottom: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", tick: { fontSize: 8 }, axisLine: false, tickLine: false, interval: 0, angle: -45, textAnchor: "end", height: 36 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { hide: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
        ownerBars.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: s.name, stackId: "a", fill: s.color, barSize: 10 }, s.id))
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-indigo-100 rounded-2xl overflow-hidden shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black uppercase text-indigo-600", children: [
          t("weeklyKpiTitle", "KPI tuần"),
          " · ",
          activeLabel
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-violet-400 bg-white/70 px-2 py-0.5 rounded-full", children: t("weeklyKpi4Weeks", "4 tuần / tháng") })
      ] }),
      weekTotals.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-indigo-50", children: weekTotals.map((w) => {
          const style = WEEK_STYLES[(w.week - 1) % WEEK_STYLES.length];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-2.5 rounded-xl border ${style.bg} ${style.border} text-center`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-[9px] font-black uppercase ${style.label}`, children: w.weekLabel }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xl font-black ${style.count} mt-0.5`, children: w.count })
          ] }, w.week);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-36 px-3 pb-3 pt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: weekChartData, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "weekLabel", tick: { fontSize: 8, fontWeight: 700 }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { allowDecimals: false, tick: { fontSize: 9 }, width: 24, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Bar, { dataKey: "count", radius: [4, 4, 0, 0], barSize: 32, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LabelList, { dataKey: "count", position: "top", style: { fontSize: 10, fontWeight: 800, fill: "#475569" } }),
            weekChartData.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: w.color }, w.week))
          ] })
        ] }) }) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 py-5 text-center text-xs text-slate-400", children: t("weeklyKpiNoDataMonth", "Không có dữ liệu trong tháng này.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto border-t border-indigo-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[400px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-[9px] font-black uppercase border-b border-indigo-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left text-indigo-400", children: groupColumnLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-left text-violet-400", children: t("week", "Tuần") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-center text-fuchsia-400", children: t("count", "SL") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-indigo-50/60", children: activeMonthRows.map((r, i) => {
          const color = groupColor(r.group);
          const weekStyle = WEEK_STYLES[(r.week - 1) % WEEK_STYLES.length];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-indigo-50/30 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 font-semibold text-slate-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full shrink-0", style: { background: color } }),
              r.group
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${weekStyle.bg} ${weekStyle.label}`, children: r.weekLabel }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "inline-block min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-black text-white",
                style: { background: color },
                children: r.count
              }
            ) })
          ] }, `${r.group}-${r.week}-${i}`);
        }) })
      ] }) })
    ] })
  ] });
}
export {
  MonthWeeklyKpiBlock as M
};
