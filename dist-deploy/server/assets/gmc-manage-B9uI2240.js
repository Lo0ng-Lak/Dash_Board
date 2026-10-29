import { r as reactExports, X as jsxRuntimeExports } from "./server-BY3o_Qlj.js";
import { u as useQuery } from "./useQuery-ll0l4zOH.js";
import { D as DevKpiTabs } from "./dev-kpi-tabs-CEEmtp94.js";
import { E as ExportExcelButton, d as downloadExcel } from "./downloadExcel-n7MxkTRE.js";
import { x as isValidGmcWebDomain, t as parseGmcSusKind, u as getGMCRegData } from "./dataService-DdUk0NVH.js";
import { b as parseDmyDate } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-D47zfhuR.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./xlsx-D7D1xvpX.js";
import "stream";
const BILL_YEAR = 2026;
const slugKey = (raw) => raw.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.myshopify\.com$/, "").split(".")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const fmtUSD = (n) => n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
const fmtMonth = (ym) => {
  const [y, m] = ym.split("-");
  return `${parseInt(m, 10)}/${y}`;
};
const domainKey = (domain) => domain.toLowerCase().trim();
const daysValue = (value) => {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : -1;
};
const typeKey = (value) => {
  const raw = (value ?? "").trim();
  if (!raw || raw === "—") return "__none__";
  return raw.toLowerCase();
};
function GmcManagePage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [person, setPerson] = reactExports.useState("all");
  const [webType, setWebType] = reactExports.useState("all");
  const [openPlan, setOpenPlan] = reactExports.useState(null);
  const {
    data: raw = [],
    isLoading
  } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 3e4
  });
  const statusQ = useQuery({
    queryKey: ["gmailStatus"],
    queryFn: async () => {
      const res = await fetch("/api/gmail/status", {
        credentials: "include"
      });
      return await res.json();
    }
  });
  const mailboxes = statusQ.data?.mailboxes?.length ? statusQ.data.mailboxes : statusQ.data?.mailbox ? [statusQ.data.mailbox] : [];
  const mailboxKey = mailboxes.join("|");
  const billsQ = useQuery({
    queryKey: ["shopifyEmailBills", BILL_YEAR, "plan-credit", "all", mailboxKey],
    enabled: !!statusQ.data?.connected,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch(`/api/gmail/shopify-bills?year=${BILL_YEAR}&limit=200&mailbox=all`, {
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gmail error");
      return json;
    }
  });
  const planBySlug = reactExports.useMemo(() => {
    const acc = /* @__PURE__ */ new Map();
    for (const bill of billsQ.data?.bills ?? []) {
      if (bill.kind !== "invoice" || !(bill.planAmount > 0)) continue;
      const keys = /* @__PURE__ */ new Set();
      for (const hint of [bill.domain, bill.shop]) {
        const key = slugKey(hint || "");
        if (key.length >= 3) keys.add(key);
      }
      for (const key of keys) {
        const months = acc.get(key) || /* @__PURE__ */ new Map();
        months.set(bill.month, (months.get(bill.month) || 0) + bill.planAmount);
        acc.set(key, months);
      }
    }
    const out = /* @__PURE__ */ new Map();
    for (const [key, months] of acc) {
      const list = [...months.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([month, amount]) => ({
        month,
        amount
      }));
      out.set(key, {
        latest: list[0]?.amount ?? 0,
        total: list.reduce((sum, row) => sum + row.amount, 0),
        months: list
      });
    }
    return out;
  }, [billsQ.data]);
  const uniqueGreen = reactExports.useMemo(() => {
    const byDomain = /* @__PURE__ */ new Map();
    raw.forEach((item, index) => {
      if (!isValidGmcWebDomain(item.domain)) return;
      const key = domainKey(item.domain);
      const prev = byDomain.get(key);
      if (!prev) {
        byDomain.set(key, {
          item,
          index
        });
        return;
      }
      const prevTime = parseDmyDate(prev.item.dateGMC)?.getTime() ?? 0;
      const nextTime = parseDmyDate(item.dateGMC)?.getTime() ?? 0;
      if (nextTime > prevTime || nextTime === prevTime && index >= prev.index) {
        byDomain.set(key, {
          item,
          index
        });
      }
    });
    const latest = [...byDomain.values()].map((entry) => entry.item);
    const rows = latest.filter((item) => parseGmcSusKind(item.status) === "live").sort((a, b) => daysValue(b.daysGreen) - daysValue(a.daysGreen) || a.domain.localeCompare(b.domain));
    return {
      rows,
      seen: latest.length
    };
  }, [raw]);
  const typeLabel = (value) => {
    const raw2 = (value ?? "").trim();
    if (!raw2 || raw2 === "—") return t("gmcManageTypeNone");
    return raw2;
  };
  const rowsForPerson = reactExports.useMemo(() => uniqueGreen.rows.filter((item) => webType === "all" || typeKey(item.webType) === webType), [uniqueGreen.rows, webType]);
  const byPerson = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const item of uniqueGreen.rows) {
      const name = item.dev?.trim() || "";
      const key = name.toLowerCase() || "__none__";
      if (!map.has(key)) map.set(key, {
        name: name || "—",
        count: 0
      });
    }
    for (const item of rowsForPerson) {
      const name = item.dev?.trim() || "";
      const key = name.toLowerCase() || "__none__";
      const row = map.get(key);
      if (row) row.count += 1;
    }
    return [...map.entries()].map(([key, row]) => ({
      key,
      ...row
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
  }, [uniqueGreen.rows, rowsForPerson]);
  const typeTabs = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const item of uniqueGreen.rows) {
      const key = typeKey(item.webType);
      if (!map.has(key)) map.set(key, {
        name: key,
        label: typeLabel(item.webType),
        count: 0
      });
    }
    for (const item of uniqueGreen.rows) {
      const personKey = item.dev?.trim().toLowerCase() || "__none__";
      if (person !== "all" && personKey !== person) continue;
      const row = map.get(typeKey(item.webType));
      if (row) row.count += 1;
    }
    return [...map.values()].filter((row) => row.count > 0 || row.name === webType).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
  }, [uniqueGreen.rows, person, webType, t]);
  const typeTotal = reactExports.useMemo(() => uniqueGreen.rows.filter((item) => person === "all" || (item.dev?.trim().toLowerCase() || "__none__") === person).length, [uniqueGreen.rows, person]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsForPerson.filter((item) => {
      const key = item.dev?.trim().toLowerCase() || "__none__";
      if (person !== "all" && key !== person) return false;
      if (!q) return true;
      return [item.domain, item.dev, item.status, item.webType].join(" ").toLowerCase().includes(q);
    });
  }, [rowsForPerson, search, person]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("gmcManageTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-500", children: t("gmcManageDesc") })
      ] }),
      !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(ExportExcelButton, { disabled: filtered.length === 0, onClick: () => downloadExcel("quan-ly-gmc.xlsx", [{
        name: "Theo nguoi",
        rows: byPerson.map((row) => ({
          [t("gmcManageColReg")]: row.name,
          [t("gmcManageUnique")]: row.count
        }))
      }, {
        name: "GMC xanh",
        rows: filtered.map((item, i) => {
          const plan = planBySlug.get(slugKey(item.domain));
          return {
            STT: i + 1,
            Domain: item.domain,
            [t("gmcManageColType")]: typeLabel(item.webType),
            [t("shopifyPlanFee")]: plan?.latest ?? "",
            [t("gmcManageColReg")]: item.dev || "",
            [t("gmcManageColDate")]: item.dateGMC || "",
            [t("gmcManageColDays")]: item.daysGreen || "",
            [t("gmcManageColStatus")]: item.status || "Xanh"
          };
        })
      }]) })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 animate-pulse", children: t("loadingSystemData") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 rounded-3xl border border-slate-200 shadow-xl border-t-emerald-500 border-t-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-600", children: t("gmcManageUnique") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-4xl font-black text-emerald-600", children: uniqueGreen.rows.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-5 rounded-3xl border border-slate-200 shadow-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: t("gmcManageRows") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-4xl font-black text-slate-800", children: uniqueGreen.seen }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: t("gmcManageRowsHint") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-black", children: t("gmcManageByPerson") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColReg") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("gmcManageUnique") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `cursor-pointer hover:bg-slate-50/70 ${person === "all" ? "bg-slate-50" : ""}`, onClick: () => setPerson("all"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-bold", children: t("gmcManageAllPeople") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-black text-emerald-600", children: rowsForPerson.length })
            ] }),
            byPerson.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `cursor-pointer hover:bg-slate-50/70 ${person === row.key ? "bg-emerald-50/70" : ""}`, onClick: () => setPerson(row.key), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: row.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-black", children: row.count })
            ] }, row.key))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: typeTabs, totalCount: typeTotal, selected: webType, onSelect: setWebType, allLabel: t("gmcManageAllTypes") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: t("gmcManageSearch"), className: "w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "Domain" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyPlanFee") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColReg") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColDays") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColStatus") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-100", children: [
          filtered.map((item, i) => {
            const planKey = domainKey(item.domain);
            const plan = planBySlug.get(slugKey(item.domain)) ?? null;
            const planOpen = openPlan === planKey;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-400", children: i + 1 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-bold text-slate-800 lowercase", children: item.domain }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: typeLabel(item.webType) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: plan ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setOpenPlan(planOpen ? null : planKey), className: `text-left rounded-xl px-2 py-1 ${planOpen ? "bg-indigo-50" : "hover:bg-indigo-50"}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-black text-slate-800", children: fmtUSD(plan.latest) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[10px] font-bold text-indigo-500", children: t("shopifyPlanMonthCount", {
                    count: plan.months.length
                  }) })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: billsQ.isLoading ? "…" : "—" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: item.dev || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: item.dateGMC || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: item.daysGreen || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200", children: item.status || "Xanh" }) })
              ] }),
              planOpen && plan && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-indigo-50/70", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { colSpan: 8, className: "px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2", children: [
                  t("shopifyPlanMonths"),
                  " · ",
                  fmtUSD(plan.total)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: plan.months.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-xs font-bold text-slate-700", children: [
                  fmtMonth(row.month),
                  " · ",
                  fmtUSD(row.amount)
                ] }, row.month)) })
              ] }) })
            ] }, planKey);
          }),
          filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "p-8 text-center text-slate-400", children: t("gmcManageEmpty") }) })
        ] })
      ] }) })
    ] })
  ] }) });
}
export {
  GmcManagePage as component
};
