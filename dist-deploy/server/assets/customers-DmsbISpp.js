import { r as reactExports, X as jsxRuntimeExports } from "./server-D1kiBNQ3.js";
import { u as useQuery } from "./useQuery-ClPJIjB8.js";
import { t as parseGmcSusKind, x as isValidGmcWebDomain, u as getGMCRegData } from "./dataService-NS9qAXcf.js";
import { a as resolveNamecheapDomain, n as normalizeDomainKey, f as formatNamecheapExpires, p as parseNamecheapExpires } from "./worker-entry-2B4kelQr.js";
import { D as DevKpiTabs } from "./dev-kpi-tabs-BjAdkEmN.js";
import { g as getCurrentMonthKey, e as getRecentMonthKeys, d as shiftMonthKey, f as fmtMonthShort, b as parseDmyDate } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-48ILCIjq.js";
import { M as MonthFilterTabs } from "./month-filter-tabs-D7_uYnKA.js";
import { P as Pagination } from "./pagination-CE6NAvSw.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
import "node:events";
const emptyCounts$1 = () => ({
  gmcNew: 0,
  gmc20Plus: 0,
  gmcSus: 0,
  susMail: 0,
  appealingMail: 0,
  appealedMail: 0
});
const liveTotal = (c) => c.gmcNew + c.gmc20Plus;
const anyCount = (c) => c.gmcNew + c.gmc20Plus + c.gmcSus + c.susMail + c.appealingMail;
const formatSelectedRange = (keys) => {
  const sorted = [...keys].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) return "—";
  if (sorted.length === 1) return fmtMonthShort(sorted[0]);
  const consecutive = sorted.every((m, i) => i === 0 || shiftMonthKey(sorted[i - 1], 1) === m);
  if (consecutive) return `${fmtMonthShort(sorted[0])} – ${fmtMonthShort(sorted[sorted.length - 1])}`;
  return sorted.map(fmtMonthShort).join(", ");
};
const sameMonthSet = (a, b) => {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((m) => sb.has(m));
};
function GmcKpi3MonthTable({ rows, parseMonth }) {
  const { t } = useTranslation();
  const current = getCurrentMonthKey();
  const recent3 = reactExports.useMemo(() => getRecentMonthKeys(3, current), [current]);
  const prev3 = reactExports.useMemo(() => getRecentMonthKeys(3, shiftMonthKey(current, -1)), [current]);
  const [monthKeys, setMonthKeys] = reactExports.useState(() => getRecentMonthKeys(3, getCurrentMonthKey()));
  const monthSet = reactExports.useMemo(() => new Set(monthKeys), [monthKeys]);
  const rangeLabel = formatSelectedRange(monthKeys);
  const pickerMonths = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    rows.forEach((r) => {
      const m = parseMonth(r.dateGMC);
      if (m) set.add(m);
    });
    for (let i = 0; i < 12; i++) set.add(shiftMonthKey(current, -i));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [rows, parseMonth, current]);
  const tableData = reactExports.useMemo(() => {
    const pool = rows.filter((r) => {
      const m = parseMonth(r.dateGMC);
      return m != null && monthSet.has(m);
    });
    const devMap = {};
    pool.forEach((r) => {
      const dev = r.dev?.trim() || t("gmcKpiUnassigned");
      if (!devMap[dev]) devMap[dev] = emptyCounts$1();
      const c = devMap[dev];
      const kind = parseGmcSusKind(r.status ?? "");
      if (kind === "sus") {
        c.gmcSus += 1;
        return;
      }
      if (kind === "sus_mail") {
        c.susMail += 1;
        return;
      }
      if (kind === "appealing_mail") {
        c.appealingMail += 1;
        return;
      }
      if (kind === "appealed_mail") {
        c.appealedMail += 1;
      } else if (kind !== "live") {
        return;
      }
      const days = r.greenDays;
      if (days !== null && days >= 20) c.gmc20Plus += 1;
      else c.gmcNew += 1;
    });
    const employeeRows = Object.entries(devMap).map(([dev, counts]) => ({
      dev,
      ...counts,
      total: liveTotal(counts)
    })).filter((row) => anyCount(row) > 0).sort((a, b) => b.total + b.gmcSus + b.susMail + b.appealingMail - (a.total + a.gmcSus + a.susMail + a.appealingMail) || a.dev.localeCompare(b.dev, "vi"));
    const totals = employeeRows.reduce(
      (acc, row) => ({
        gmcNew: acc.gmcNew + row.gmcNew,
        gmc20Plus: acc.gmc20Plus + row.gmc20Plus,
        gmcSus: acc.gmcSus + row.gmcSus,
        susMail: acc.susMail + row.susMail,
        appealingMail: acc.appealingMail + row.appealingMail,
        appealedMail: acc.appealedMail + row.appealedMail,
        total: acc.total + row.total
      }),
      { ...emptyCounts$1(), total: 0 }
    );
    return { employeeRows, totals, poolSize: pool.length };
  }, [rows, parseMonth, monthSet, t]);
  const cell = (n) => n > 0 ? n : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border-2 border-amber-500 shadow-lg overflow-hidden bg-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 bg-amber-50 border-b border-amber-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-black uppercase tracking-widest text-slate-800", children: t("gmcKpi3MonthTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-slate-500 mt-1", children: t("gmcKpi3MonthDesc", { range: rangeLabel }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium text-slate-400 mt-2", children: t("gmcKpi3MonthPickHint") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setMonthKeys(recent3),
            className: `text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${sameMonthSet(monthKeys, recent3) ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-800 border-amber-200 hover:border-amber-400"}`,
            children: t("gmcKpi3MonthPresetRecent")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setMonthKeys(prev3),
            className: `text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${sameMonthSet(monthKeys, prev3) ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-800 border-amber-200 hover:border-amber-400"}`,
            children: t("gmcKpi3MonthPresetPrev")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: pickerMonths.map((m) => {
        const active = monthSet.has(m);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setMonthKeys(
                (prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a.localeCompare(b))
              );
            },
            className: `text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${active ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-700"}`,
            children: fmtMonthShort(m)
          },
          m
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[860px] border-collapse text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-amber-500 text-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-4 py-3 text-left font-black w-[18%]", children: t("gmcKpiColEmployee") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black", children: t("gmcKpiColNew") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black", children: t("gmcKpiCol20Days") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black text-red-900", children: t("gmcKpiColSus") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black text-orange-950", children: t("gmcKpiColSusMail") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black text-orange-950", children: t("gmcKpiColAppealingMail") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black text-emerald-950", children: t("gmcKpiColAppealedMail") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black", children: t("gmcKpiColTotal") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        tableData.employeeRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "border border-black/30 px-4 py-8 text-center text-slate-500 font-semibold", children: t("gmcKpi3MonthEmpty") }) }) : tableData.employeeRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-4 py-2.5 font-black uppercase bg-[#E2EFDA] text-slate-800", children: row.dev }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]", children: cell(row.gmcNew) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]", children: cell(row.gmc20Plus) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FCE4D6] text-red-700", children: cell(row.gmcSus) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-orange-100 text-orange-800", children: cell(row.susMail) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-orange-100 text-orange-800", children: cell(row.appealingMail) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-emerald-100 text-emerald-800", children: cell(row.appealedMail) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg bg-[#E2EFDA]", children: cell(row.total) })
        ] }, row.dev)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-[#C6EFCE]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-4 py-2.5 font-black uppercase text-base", children: t("gmcKpiRowTotal") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg", children: cell(tableData.totals.gmcNew) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg", children: cell(tableData.totals.gmc20Plus) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg text-red-800", children: cell(tableData.totals.gmcSus) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg text-orange-800", children: cell(tableData.totals.susMail) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg text-orange-800", children: cell(tableData.totals.appealingMail) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg text-emerald-800", children: cell(tableData.totals.appealedMail) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg", children: cell(tableData.totals.total) })
        ] })
      ] })
    ] }) })
  ] });
}
const emptyCounts = () => ({ gmcNew: 0, gmc20Plus: 0, gmcSus: 0 });
function GmcKpiSummaryTable({ rows, employees, monthKey, parseMonth }) {
  const { t } = useTranslation();
  const tableData = reactExports.useMemo(() => {
    const pool = monthKey === "all" ? rows : rows.filter((r) => parseMonth(r.dateGMC) === monthKey);
    const devMap = {};
    employees.forEach((dev) => {
      devMap[dev] = emptyCounts();
    });
    pool.forEach((r) => {
      const dev = r.dev?.trim();
      if (!dev) return;
      if (!devMap[dev]) devMap[dev] = emptyCounts();
      if (r.suspended) {
        devMap[dev].gmcSus += 1;
        return;
      }
      const days = r.greenDays;
      if (days !== null && days >= 20) {
        devMap[dev].gmc20Plus += 1;
      } else {
        devMap[dev].gmcNew += 1;
      }
    });
    const employeeRows = employees.map((dev) => {
      const { gmcNew, gmc20Plus, gmcSus } = devMap[dev] ?? emptyCounts();
      return { dev, gmcNew, gmc20Plus, gmcSus, total: gmcNew + gmc20Plus };
    });
    const extraDevs = Object.keys(devMap).filter((d) => !employees.includes(d));
    extraDevs.forEach((dev) => {
      const { gmcNew, gmc20Plus, gmcSus } = devMap[dev];
      employeeRows.push({ dev, gmcNew, gmc20Plus, gmcSus, total: gmcNew + gmc20Plus });
    });
    employeeRows.sort(
      (a, b) => b.total + b.gmcSus - (a.total + a.gmcSus) || a.dev.localeCompare(b.dev, "vi")
    );
    const totals = employeeRows.reduce(
      (acc, row) => ({
        gmcNew: acc.gmcNew + row.gmcNew,
        gmc20Plus: acc.gmc20Plus + row.gmc20Plus,
        gmcSus: acc.gmcSus + row.gmcSus,
        total: acc.total + row.total
      }),
      { gmcNew: 0, gmc20Plus: 0, gmcSus: 0, total: 0 }
    );
    return { employeeRows, totals };
  }, [rows, employees, monthKey, parseMonth]);
  const monthLabel = monthKey === "all" ? t("allMonths") : fmtMonthShort(monthKey);
  const hasRows = tableData.employeeRows.some(
    (row) => row.gmcNew > 0 || row.gmc20Plus > 0 || row.gmcSus > 0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border-2 border-[#5B9BD5] shadow-lg overflow-hidden bg-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 bg-[#5B9BD5]/10 border-b border-[#5B9BD5]/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-black uppercase tracking-widest text-slate-800", children: t("gmcKpiTableTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-slate-500 mt-1", children: t("gmcKpiTableDesc", { month: monthLabel }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[640px] border-collapse text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-[#5B9BD5] text-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-4 py-3 text-left font-black w-[28%]", children: t("gmcKpiColEmployee") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black", children: t("gmcKpiColNew") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black", children: t("gmcKpiCol20Days") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black text-red-900", children: t("gmcKpiColSus") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-black/30 px-3 py-3 text-center font-black", children: t("gmcKpiColTotal") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        !hasRows ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "border border-black/30 px-4 py-8 text-center text-slate-500 font-semibold", children: t("gmcKpiTableEmpty") }) }) : tableData.employeeRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-4 py-2.5 font-black uppercase bg-[#E2EFDA] text-slate-800", children: row.dev }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]", children: row.gmcNew > 0 ? row.gmcNew : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]", children: row.gmc20Plus > 0 ? row.gmc20Plus : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FCE4D6] text-red-700", children: row.gmcSus > 0 ? row.gmcSus : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg bg-[#E2EFDA]", children: row.total > 0 ? row.total : "" })
        ] }, row.dev)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-[#C6EFCE]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-4 py-2.5 font-black uppercase text-base", children: t("gmcKpiRowTotal") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg", children: tableData.totals.gmcNew > 0 ? tableData.totals.gmcNew : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg", children: tableData.totals.gmc20Plus > 0 ? tableData.totals.gmc20Plus : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg text-red-800", children: tableData.totals.gmcSus > 0 ? tableData.totals.gmcSus : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-black/30 px-3 py-2.5 text-center font-black text-lg", children: tableData.totals.total > 0 ? tableData.totals.total : "" })
        ] })
      ] })
    ] }) })
  ] });
}
const parseGmcMonth = (dateGMC) => {
  const d = parseDmyDate(dateGMC);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
function ReportCell({
  value,
  linkLabel
}) {
  if (!value || value === "—") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "—" });
  }
  if (/^https?:\/\//i.test(value.trim())) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: value.trim(), target: "_blank", rel: "noopener noreferrer", className: "text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline", children: linkLabel });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-slate-600 break-words", children: value });
}
function LinkAdsEgeadCell({
  value
}) {
  if (!value || value === "—") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "—" });
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-wide leading-tight ${cls}`, children: value });
}
const ncDaysLeft = (expires) => {
  const target = parseNamecheapExpires(expires);
  if (!target) return null;
  target.setHours(0, 0, 0, 0);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
};
const domainNeedsRenewal = (info) => {
  if (!info) return false;
  if (info.isExpired) return true;
  const left = ncDaysLeft(info.expires);
  return left !== null && left <= 30;
};
const domainRenewalDays = (info) => {
  if (!info) return Number.POSITIVE_INFINITY;
  if (info.isExpired) return -1;
  const left = ncDaysLeft(info.expires);
  return left === null ? Number.POSITIVE_INFINITY : left;
};
function DomainExpiryCell({
  info,
  t
}) {
  if (!info) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-slate-300", children: t("gmcDomainNotInNc") });
  }
  if (info.isExpired) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase text-red-600", children: t("gmcDomainExpired") });
  }
  const left = ncDaysLeft(info.expires);
  const urgent = left !== null && left <= 30;
  const warn = left !== null && left <= 60;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-black ${urgent ? "text-red-600" : warn ? "text-amber-600" : "text-slate-700"}`, children: formatNamecheapExpires(info.expires) }),
    left !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-[9px] font-bold ${urgent ? "text-red-500" : warn ? "text-amber-500" : "text-slate-400"}`, children: [
      left,
      " ",
      t("daysLeft")
    ] }),
    info.autoRenew && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black uppercase text-emerald-600 mt-0.5", children: "Auto" })
  ] });
}
function GMCPremiumDashboard() {
  const {
    t
  } = useTranslation();
  const [searchDomain, setSearchDomain] = reactExports.useState("");
  const [devFilter, setDevFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [webTypeFilter, setWebTypeFilter] = reactExports.useState("all");
  const [monthFilter, setMonthFilter] = reactExports.useState("");
  const [expiryFilter, setExpiryFilter] = reactExports.useState("all");
  const [currentPage, setCurrentPage] = reactExports.useState(1);
  const ITEMS_PER_PAGE = 10;
  const {
    data: rawRegData = [],
    isLoading
  } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 3e4
  });
  const {
    data: namecheapMap = {},
    error: namecheapError
  } = useQuery({
    queryKey: ["namecheapDomains"],
    queryFn: async () => {
      const res = await fetch("/api/namecheap/domains");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json.map ?? {};
    },
    staleTime: 60 * 60 * 1e3,
    retry: 1
  });
  const lookupNc = (domain) => resolveNamecheapDomain(normalizeDomainKey(domain), namecheapMap);
  const regData = reactExports.useMemo(() => rawRegData.filter((item) => isValidGmcWebDomain(item.domain)), [rawRegData]);
  const orderedFullData = reactExports.useMemo(() => {
    return [...regData].reverse();
  }, [regData]);
  const isSuspended = (status) => {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    if (!s || s === "—") return false;
    if (s === "xanh" || s.includes("chưa sus")) return false;
    return s.includes("sus") || s === "die" || s.includes("đã sus") || s.includes("về sus");
  };
  const parseCost = (costStr) => {
    if (!costStr) return 0;
    let s = costStr.trim().toLowerCase().replace(/\s+/g, " ");
    if (s.includes("vnd") || s.includes("₫") || s.includes("usdt")) return 0;
    s = s.replace(/\$/g, "").replace(/\busd\b/g, "").trim();
    let multiply = 1;
    const kMatch = s.match(/^([\d.,]+)\s*k$/);
    if (kMatch) {
      s = kMatch[1];
      multiply = 1e3;
    }
    if (s.includes(",") && !s.includes(".")) s = s.replace(/,/g, ".");
    else s = s.replace(/,/g, "");
    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed * multiply;
  };
  const parseDmyDateLocal = (dateStr) => parseDmyDate(dateStr);
  const daysBetween = (start, end) => Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)));
  const calculateGreenDays = (item) => {
    const gmcDate = parseDmyDateLocal(item.dateGMC);
    if (!gmcDate) return null;
    const kind = parseGmcSusKind(item.status);
    const susDate = parseDmyDateLocal(item.dateSus);
    if (susDate && kind !== "appealed_mail" && kind !== "live") {
      return daysBetween(gmcDate, susDate);
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const daysToToday = daysBetween(gmcDate, today);
    if (kind === "appealed_mail" || kind === "live") return daysToToday;
    const fromSheet = item.daysGreen && item.daysGreen !== "—" ? Number(item.daysGreen) : NaN;
    if (!isNaN(fromSheet) && fromSheet >= 0) return fromSheet;
    return daysToToday;
  };
  const devTabItems = reactExports.useMemo(() => {
    const map = {};
    regData.forEach((item) => {
      const dev = item.dev?.trim();
      if (!dev) return;
      map[dev] = (map[dev] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [regData]);
  const devPool = reactExports.useMemo(() => devFilter === "all" ? regData : regData.filter((item) => item.dev?.toLowerCase() === devFilter.toLowerCase()), [regData, devFilter]);
  const latestMonth = reactExports.useMemo(() => {
    const months = devPool.map((item) => parseGmcMonth(item.dateGMC)).filter(Boolean);
    if (!months.length) return getCurrentMonthKey();
    return months.sort((a, b) => b.localeCompare(a))[0];
  }, [devPool]);
  reactExports.useEffect(() => {
    setMonthFilter(expiryFilter === "lte30" ? "all" : latestMonth);
    setCurrentPage(1);
  }, [devFilter, latestMonth, expiryFilter]);
  const dueSoonCount = reactExports.useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    devPool.forEach((item) => {
      if (!domainNeedsRenewal(lookupNc(item.domain))) return;
      seen.add(item.domain.toLowerCase().trim());
    });
    return seen.size;
  }, [devPool, namecheapMap]);
  const activeMonth = monthFilter === "all" ? "all" : monthFilter || latestMonth;
  const monthTabItems = reactExports.useMemo(() => {
    const map = {};
    devPool.forEach((item) => {
      const m = parseGmcMonth(item.dateGMC);
      if (!m) return;
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([month, count]) => ({
      month,
      count
    }));
  }, [devPool]);
  const monthPool = reactExports.useMemo(() => {
    if (activeMonth === "all") return devPool;
    return devPool.filter((item) => parseGmcMonth(item.dateGMC) === activeMonth);
  }, [devPool, activeMonth]);
  const stats = reactExports.useMemo(() => {
    const total = monthPool.length;
    const live = monthPool.filter((item) => !isSuspended(item.status)).length;
    const sus = total - live;
    const domains = new Set(monthPool.map((item) => item.domain.toLowerCase().trim())).size;
    const totalCost = monthPool.reduce((sum, item) => sum + parseCost(item.cost), 0);
    return {
      total,
      live,
      sus,
      domains,
      totalCost
    };
  }, [monthPool]);
  const kpiEmployees = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    regData.forEach((item) => {
      const dev = item.dev?.trim();
      if (dev) set.add(dev);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [regData]);
  const kpiTableRows = reactExports.useMemo(() => regData.map((item) => ({
    dev: item.dev?.trim() || "",
    dateGMC: item.dateGMC,
    greenDays: calculateGreenDays(item),
    suspended: isSuspended(item.status),
    status: item.status
  })), [regData]);
  const dropdownFilteredData = reactExports.useMemo(() => {
    return orderedFullData.filter((item) => {
      const matchesDev = devFilter === "all" ? true : item.dev?.toLowerCase() === devFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "sus" ? isSuspended(item.status) : !isSuspended(item.status);
      const matchesWebType = webTypeFilter === "all" ? true : item.webType === webTypeFilter;
      const itemMonth = parseGmcMonth(item.dateGMC);
      const matchesMonth = activeMonth === "all" ? true : itemMonth === activeMonth;
      const matchesExpiry = expiryFilter === "all" ? true : domainNeedsRenewal(lookupNc(item.domain));
      return matchesDev && matchesStatus && matchesWebType && matchesMonth && matchesExpiry;
    });
  }, [orderedFullData, devFilter, statusFilter, webTypeFilter, activeMonth, expiryFilter, namecheapMap]);
  const finalFilteredTableData = reactExports.useMemo(() => {
    const searched = dropdownFilteredData.filter((item) => {
      return item.domain.toLowerCase().includes(searchDomain.toLowerCase());
    });
    if (expiryFilter !== "lte30") return searched;
    return [...searched].sort((a, b) => domainRenewalDays(lookupNc(a.domain)) - domainRenewalDays(lookupNc(b.domain)));
  }, [dropdownFilteredData, searchDomain, expiryFilter, namecheapMap]);
  const globalDomainFrequencyMap = reactExports.useMemo(() => {
    const frequency = {};
    orderedFullData.forEach((item) => {
      const formattedDomain = item.domain.toLowerCase().trim();
      frequency[formattedDomain] = (frequency[formattedDomain] || 0) + 1;
    });
    return frequency;
  }, [orderedFullData]);
  const uniqueWebTypesOptions = reactExports.useMemo(() => {
    const typesSet = /* @__PURE__ */ new Set();
    regData.forEach((item) => item.webType && item.webType !== "—" && typesSet.add(item.webType));
    return Array.from(typesSet);
  }, [regData]);
  const paginatedTableData = reactExports.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return finalFilteredTableData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [finalFilteredTableData, currentPage]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingSystemData") });
  }
  const formatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight text-slate-900", children: t("gmcRegManagement") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("gmcSystemDesc") })
    ] }),
    namecheapError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800", children: [
      "Namecheap: ",
      namecheapError.message
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: devTabItems, totalCount: regData.length, selected: devFilter, onSelect: (dev) => {
      setDevFilter(dev);
      setCurrentPage(1);
    }, allLabel: t("allOwners") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GmcKpi3MonthTable, { rows: kpiTableRows, parseMonth: parseGmcMonth }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-widest", children: t("gmcMonthFilterTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MonthFilterTabs, { items: monthTabItems, totalWithDate: devPool.filter((item) => parseGmcMonth(item.dateGMC)).length, selected: activeMonth, onSelect: (m) => {
        setMonthFilter(m);
        setCurrentPage(1);
      }, allLabel: t("allMonths") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400 tracking-widest", children: t("gmcExpiryFilterTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          setExpiryFilter("all");
          setCurrentPage(1);
        }, className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${expiryFilter === "all" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"}`, children: t("gmcExpiryAll") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
          setExpiryFilter("lte30");
          setCurrentPage(1);
        }, className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${expiryFilter === "lte30" ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-white text-red-600 border-red-200 hover:border-red-300"}`, children: [
          t("gmcExpiryDueSoon"),
          " (",
          dueSoonCount,
          ")"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-slate-600", children: activeMonth === "all" ? t("gmcMonthStatsAll") : t("gmcMonthStatsLabel", {
      month: fmtMonthShort(activeMonth)
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GmcKpiSummaryTable, { rows: kpiTableRows, employees: kpiEmployees, monthKey: activeMonth, parseMonth: parseGmcMonth }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-slate-800 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: t("gmcReturned") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black mt-1", children: stats.total })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-500", children: t("gmcStillLive") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-emerald-600 mt-1", children: stats.live })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-red-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-red-500", children: t("gmcSuspended") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-red-600 mt-1", children: stats.sus })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-indigo-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-indigo-500", children: t("actualFilteredDomains") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black text-indigo-600 mt-1", children: stats.domains })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-blue-500 border-t-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-blue-500", children: t("totalAdsCost") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-black text-blue-600 mt-1", children: [
          "$",
          stats.totalCost.toLocaleString("en-US", formatOptions)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: t("searchDomainPlaceholder"), className: "flex-1 px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all", value: searchDomain, onChange: (e) => {
        setSearchDomain(e.target.value);
        setCurrentPage(1);
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600", value: webTypeFilter, onChange: (e) => {
        setWebTypeFilter(e.target.value);
        setCurrentPage(1);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("webTypeAll") }),
        uniqueWebTypesOptions.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: type, children: type.toUpperCase() }, type))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600", value: statusFilter, onChange: (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
      }, children: [
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left table-fixed min-w-[1780px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[15%]", children: t("webAndPlatform") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[7%]", children: t("gmcDomainExpiry") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[6%]", children: t("assignedStaff") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[6%]", children: t("status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[7%]", children: t("gmcReturnDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[9%]", children: t("gmcReturnReport") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[6%]", children: t("ageDays") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[7%]", children: t("susDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[9%]", children: t("susReport") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[10%]", children: t("linkAdsEgead") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[6%]", children: t("adsCost") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          paginatedTableData.map((item, idx) => {
            const isDuplicateDomain = globalDomainFrequencyMap[item.domain.toLowerCase().trim()] > 1;
            const itemIsSus = isSuspended(item.status);
            const daysAlive = calculateGreenDays(item);
            const hasSusDate = item.dateSus && item.dateSus !== "—";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `transition-all group ${isDuplicateDomain ? "bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500" : "hover:bg-slate-50/50"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4 overflow-hidden text-ellipsis whitespace-nowrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-slate-800 text-[14px] lowercase truncate", children: item.domain || "N/A" }),
                  isDuplicateDomain && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 animate-pulse", children: "RE-REG / CONFLICT" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-slate-400 uppercase font-bold mt-0.5", children: item.webType || "Unknown" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DomainExpiryCell, { info: lookupNc(item.domain), t }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-wider truncate inline-block", children: item.dev || "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase max-w-full ${itemIsSus ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-1.5 h-1.5 rounded-full shrink-0 ${itemIsSus ? "bg-red-500" : "bg-emerald-500"}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: item.status || (itemIsSus ? t("suspended") : t("active")) })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-slate-600", children: item.dateGMC }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReportCell, { value: item.reportDateGMC, linkLabel: t("viewReport") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: daysAlive !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-black ${itemIsSus ? "text-slate-400" : "text-emerald-600"}`, children: [
                  daysAlive,
                  " ",
                  daysAlive === 1 ? t("day") : t("days")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-slate-400 font-medium", children: hasSusDate ? t("untilSusDate") : itemIsSus ? t("beforeSuspended") : t("running") })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-slate-600", children: item.dateSus && item.dateSus !== "—" ? item.dateSus : "—" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReportCell, { value: item.reportDateSus, linkLabel: t("viewReport") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LinkAdsEgeadCell, { value: item.linkAdsEgead }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[15px] font-black text-slate-900", children: [
                "$",
                parseCost(item.cost).toLocaleString("en-US", formatOptions)
              ] }) })
            ] }, idx);
          }),
          paginatedTableData.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 11, className: "text-center p-10 text-sm font-medium text-slate-400", children: t("noAccountData") }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage, totalItems: finalFilteredTableData.length, itemsPerPage: ITEMS_PER_PAGE, onPageChange: (page) => setCurrentPage(page) })
    ] })
  ] }) });
}
export {
  GMCPremiumDashboard as component
};
