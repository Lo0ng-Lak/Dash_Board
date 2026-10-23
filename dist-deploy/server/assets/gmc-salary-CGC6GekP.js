import { r as reactExports, X as jsxRuntimeExports } from "./server-C34JbuOG.js";
import { u as useQuery } from "./useQuery-Ca5y3yOL.js";
import { g as getCurrentMonthKey, d as shiftMonthKey, f as fmtMonthShort, b as parseDmyDate } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-NoOd4vuR.js";
import { v as isValidGmcWebDomain, s as getGMCRegData } from "./dataService-Roh-zkhu.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
const SALARY_GROUPS = [
  [
    { label: "Bảo Hân", keys: ["bao han"] },
    { label: "Quốc An", keys: ["quoc an", "an"] },
    { label: "Đình Thịnh", keys: ["dinh thinh", "thinh"] },
    { label: "Vĩnh Long", keys: ["vinh long", "long", "long bmt"] }
  ]
];
const SKIP_NAMES = /* @__PURE__ */ new Set(["tai", "chuong", "duy", "nv 3", "nv3", "nv 4", "nv4", "nv 5", "nv5", "nv 6", "nv6"]);
const WEB_STAFF = [
  { label: "Tài", keys: ["tai"] },
  { label: "Chương", keys: ["chuong"] },
  { label: "Duy", keys: ["duy"] }
];
const foldName = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
const WEB_SLOT = /* @__PURE__ */ new Map();
WEB_STAFF.forEach((member, index) => {
  WEB_SLOT.set(foldName(member.label), index);
  member.keys.forEach((key) => WEB_SLOT.set(key, index));
});
const SLOT_BY_KEY = /* @__PURE__ */ new Map();
SALARY_GROUPS.forEach((group, groupIndex) => {
  group.forEach((member, memberIndex) => {
    const slot = { group: groupIndex, index: memberIndex };
    SLOT_BY_KEY.set(foldName(member.label), slot);
    member.keys.forEach((key) => SLOT_BY_KEY.set(key, slot));
  });
});
const isPayableLink = (linkAds) => {
  const link = foldName(linkAds ?? "");
  if (!link || link === "-") return false;
  if (link.includes("khong xac minh") || link.includes("chua link") || link.includes("go ads")) return false;
  if (link.includes("da link") && link.includes("egead")) return true;
  return link.includes("link ads ta");
};
const isPayableGmc = (row) => foldName(row.status ?? "") === "xanh" && isPayableLink(row.linkAdsEgead);
const NEW_DAY_LIMIT = 20;
const OVER3_DAY_LIMIT = 90;
const parseDayCount = (value) => {
  const match = String(value ?? "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const days = Number(match[0]);
  return Number.isFinite(days) ? days : null;
};
function GmcSalarySummary({ rows, parseMonth }) {
  const { t } = useTranslation();
  const current = getCurrentMonthKey();
  const [monthKey, setMonthKey] = reactExports.useState(current);
  const [payMode, setPayMode] = reactExports.useState("reg");
  const windowKeys = reactExports.useMemo(
    () => [2, 1, 0].map((delta) => shiftMonthKey(monthKey, -delta)),
    [monthKey]
  );
  const windowSet = reactExports.useMemo(() => new Set(windowKeys), [windowKeys]);
  const rangeLabel = `${fmtMonthShort(windowKeys[0])} – ${fmtMonthShort(windowKeys[2])}`;
  const pickerMonths = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set([current]);
    rows.forEach((row) => {
      const month = parseMonth(row.dateGMC);
      if (month && month <= current) set.add(month);
    });
    return [...set].sort((a, b) => b.localeCompare(a)).slice(0, 12);
  }, [rows, parseMonth, current]);
  const tableData = reactExports.useMemo(() => {
    const empty = () => ({ thisMonth: 0, aged: 0, over3: 0 });
    const counts = SALARY_GROUPS.map((group) => group.map(empty));
    const unmatched = /* @__PURE__ */ new Map();
    const webCounts = WEB_STAFF.map(empty);
    const webUnmatched = /* @__PURE__ */ new Map();
    const domains = [];
    const webDomains = [];
    rows.forEach((row) => {
      if (!isPayableGmc(row)) return;
      const month = parseMonth(row.dateGMC);
      if (!month || !windowSet.has(month)) return;
      const days = parseDayCount(row.daysGreen);
      if (days == null) return;
      const bucket = days < NEW_DAY_LIMIT ? "thisMonth" : days <= OVER3_DAY_LIMIT ? "aged" : "over3";
      const dev = row.dev?.trim();
      if (!dev) return;
      const folded = foldName(dev);
      if (SKIP_NAMES.has(folded)) return;
      const slot = SLOT_BY_KEY.get(folded);
      const domain = row.domain?.trim();
      if (domain) {
        domains.push({
          domain,
          employee: slot ? SALARY_GROUPS[slot.group][slot.index].label : dev,
          dateGMC: row.dateGMC,
          days,
          bucket,
          order: slot ? slot.index : 1e3
        });
      }
      if (slot) {
        counts[slot.group][slot.index][bucket] += 1;
        const regLabel = SALARY_GROUPS[slot.group][slot.index].label;
        const rawWeb = row.webDev?.trim() || "";
        const webSlot = rawWeb ? WEB_SLOT.get(foldName(rawWeb)) : void 0;
        const webLabel = webSlot != null ? WEB_STAFF[webSlot].label : rawWeb || "—";
        if (webSlot != null) webCounts[webSlot][bucket] += 1;
        else {
          const extraWeb = webUnmatched.get(webLabel) ?? empty();
          extraWeb[bucket] += 1;
          webUnmatched.set(webLabel, extraWeb);
        }
        if (domain) {
          webDomains.push({
            domain,
            dev: webLabel,
            reg: regLabel,
            dateGMC: row.dateGMC,
            days,
            bucket,
            order: webSlot ?? 1e3
          });
        }
        return;
      }
      const extra = unmatched.get(dev) ?? empty();
      extra[bucket] += 1;
      unmatched.set(dev, extra);
    });
    const groups = SALARY_GROUPS.map((group, groupIndex) => {
      const employeeRows = group.map((member, memberIndex) => {
        const count = counts[groupIndex][memberIndex];
        return {
          label: member.label,
          thisMonth: count.thisMonth,
          aged: count.aged,
          over3: count.over3,
          total: count.thisMonth + count.aged + count.over3
        };
      });
      const totals = employeeRows.reduce(
        (acc, row) => ({
          thisMonth: acc.thisMonth + row.thisMonth,
          aged: acc.aged + row.aged,
          over3: acc.over3 + row.over3,
          total: acc.total + row.total
        }),
        { thisMonth: 0, aged: 0, over3: 0, total: 0 }
      );
      return { employeeRows, totals };
    });
    const extraRows = [...unmatched.entries()].map(([dev, count]) => ({ dev, ...count, total: count.thisMonth + count.aged + count.over3 })).sort((a, b) => b.total - a.total || a.dev.localeCompare(b.dev, "vi"));
    domains.sort(
      (a, b) => a.order - b.order || a.days - b.days || a.domain.localeCompare(b.domain)
    );
    const webEmployeeRows = WEB_STAFF.map((member, index) => {
      const count = webCounts[index];
      return {
        label: member.label,
        thisMonth: count.thisMonth,
        aged: count.aged,
        over3: count.over3,
        total: count.thisMonth + count.aged + count.over3
      };
    });
    const webTotals = webEmployeeRows.reduce(
      (acc, row) => ({
        thisMonth: acc.thisMonth + row.thisMonth,
        aged: acc.aged + row.aged,
        over3: acc.over3 + row.over3,
        total: acc.total + row.total
      }),
      { thisMonth: 0, aged: 0, over3: 0, total: 0 }
    );
    const webExtraRows = [...webUnmatched.entries()].map(([dev, count]) => ({ dev, ...count, total: count.thisMonth + count.aged + count.over3 })).sort((a, b) => b.total - a.total || a.dev.localeCompare(b.dev, "vi"));
    webDomains.sort(
      (a, b) => a.order - b.order || a.days - b.days || a.domain.localeCompare(b.domain)
    );
    return { groups, extraRows, domains, webEmployeeRows, webTotals, webExtraRows, webDomains };
  }, [rows, parseMonth, windowSet]);
  const bucketLabel = (bucket) => bucket === "thisMonth" ? t("gmcSalaryColThisMonth") : bucket === "aged" ? t("gmcSalaryCol1to3") : t("gmcSalaryColOver3");
  const bucketClass = (bucket) => bucket === "thisMonth" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : bucket === "aged" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-slate-100 text-slate-600 border-slate-200";
  const countClass = (n) => n > 0 ? "text-slate-900" : "text-slate-300";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: ["reg", "web"].map((mode) => {
      const active = payMode === mode;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setPayMode(mode),
          className: `px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all border ${active ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`,
          children: mode === "reg" ? t("salaryModeReg") : t("salaryModeWeb")
        },
        mode
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight text-slate-900", children: payMode === "reg" ? t("gmcSalaryTitle") : t("webSalaryTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: payMode === "reg" ? t("gmcSalaryDesc", { month: fmtMonthShort(monthKey), range: rangeLabel }) : t("webSalaryDesc", { month: fmtMonthShort(monthKey), range: rangeLabel }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: pickerMonths.map((month) => {
      const active = month === monthKey;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setMonthKey(month),
          className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-300"}`,
          children: fmtMonthShort(month)
        },
        month
      );
    }) }),
    payMode === "reg" && tableData.groups.map((group, groupIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[720px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[22%]", children: t("gmcKpiColEmployee") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryColThisMonth") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryCol1to3") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryColOver3") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center w-[14%]", children: t("gmcSalaryColTotal") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
        group.employeeRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-black text-slate-800", children: row.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.thisMonth)}`, children: row.thisMonth }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.aged)}`, children: row.aged }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.over3)}`, children: row.over3 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.total)}`, children: row.total })
        ] }, row.label)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-black uppercase tracking-widest text-slate-500", children: t("gmcKpiRowTotal") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-indigo-600", children: group.totals.thisMonth }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-indigo-600", children: group.totals.aged }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-indigo-600", children: group.totals.over3 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-slate-900", children: group.totals.total })
        ] })
      ] })
    ] }) }) }, groupIndex)),
    payMode === "reg" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black uppercase tracking-widest text-slate-800", children: t("gmcSalaryDomainsTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100", children: tableData.domains.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[760px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-14", children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcSalaryColDomain") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcKpiColEmployee") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcSalaryColDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryColDays") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcSalaryColGroup") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: tableData.domains.map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold text-slate-400", children: index + 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-black text-slate-800", children: row.domain }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-bold text-slate-600", children: row.employee }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold text-slate-600", children: row.dateGMC }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-sm font-black text-slate-800", children: row.days }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-wide border ${bucketClass(row.bucket)}`, children: bucketLabel(row.bucket) }) })
        ] }, `${row.domain}-${row.dateGMC}-${index}`)) })
      ] }) })
    ] }),
    payMode === "web" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[720px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-[22%]", children: t("gmcKpiColEmployee") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryColThisMonth") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryCol1to3") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryColOver3") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center w-[14%]", children: t("gmcSalaryColTotal") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          tableData.webEmployeeRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-black text-slate-800", children: row.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.thisMonth)}`, children: row.thisMonth }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.aged)}`, children: row.aged }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.over3)}`, children: row.over3 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-4 text-center text-lg font-black ${countClass(row.total)}`, children: row.total })
          ] }, row.label)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-black uppercase tracking-widest text-slate-500", children: t("gmcKpiRowTotal") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-indigo-600", children: tableData.webTotals.thisMonth }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-indigo-600", children: tableData.webTotals.aged }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-indigo-600", children: tableData.webTotals.over3 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-lg font-black text-slate-900", children: tableData.webTotals.total })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-black uppercase tracking-widest text-slate-800", children: t("webSalaryDomainsTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100", children: tableData.webDomains.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[860px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 w-14", children: "#" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcSalaryColDomain") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: "DEV" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: "REG" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcSalaryColDate") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-center", children: t("gmcSalaryColDays") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("gmcSalaryColGroup") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: tableData.webDomains.map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold text-slate-400", children: index + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-black text-slate-800", children: row.domain }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-bold text-slate-600", children: row.dev }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-sm font-bold text-slate-600", children: row.reg }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-bold text-slate-600", children: row.dateGMC }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center text-sm font-black text-slate-800", children: row.days }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-wide border ${bucketClass(row.bucket)}`, children: bucketLabel(row.bucket) }) })
          ] }, `${row.domain}-${row.dateGMC}-${index}`)) })
        ] }) })
      ] })
    ] }),
    payMode === "reg" && tableData.extraRows.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-slate-500", children: [
      t("gmcSalaryUnmatched"),
      ":",
      " ",
      tableData.extraRows.map((row) => `${row.dev} (${row.total})`).join(", ")
    ] }),
    payMode === "web" && tableData.webExtraRows.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-slate-500", children: [
      t("gmcSalaryUnmatched"),
      ":",
      " ",
      tableData.webExtraRows.map((row) => `${row.dev} (${row.total})`).join(", ")
    ] })
  ] });
}
const parseGmcMonth = (dateGMC) => {
  const d = parseDmyDate(dateGMC);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
function GmcSalaryPage() {
  const {
    t
  } = useTranslation();
  const {
    data: raw = [],
    isLoading
  } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 3e4
  });
  const rows = reactExports.useMemo(() => raw.filter((item) => isValidGmcWebDomain(item.domain)).map((item) => ({
    domain: item.domain,
    dev: item.dev?.trim() || "",
    webDev: item.webDev?.trim() || "",
    dateGMC: item.dateGMC,
    status: item.status,
    linkAdsEgead: item.linkAdsEgead,
    daysGreen: item.daysGreen
  })), [raw]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingSystemData") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-7xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GmcSalarySummary, { rows, parseMonth: parseGmcMonth }) }) });
}
export {
  GmcSalaryPage as component
};
