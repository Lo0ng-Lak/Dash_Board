import { r as reactExports, X as jsxRuntimeExports } from "./server-CaXyqhng.js";
import { u as useQuery } from "./useQuery-ZQ3Xe1NO.js";
import { v as isValidGmcWebDomain, q as parseGmcSusKind, s as getGMCRegData } from "./dataService-B36o3CbS.js";
import { b as parseDmyDate } from "./kpiWeek-uKv2Fy6X.js";
import { u as useTranslation } from "./router-C3LyHIZn.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
const domainKey = (domain) => domain.toLowerCase().trim();
const daysValue = (value) => {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : -1;
};
function GmcManagePage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [person, setPerson] = reactExports.useState("all");
  const {
    data: raw = [],
    isLoading
  } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 3e4
  });
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
  const byPerson = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const item of uniqueGreen.rows) {
      const name = item.dev?.trim() || "";
      const key = name.toLowerCase() || "__none__";
      const row = map.get(key) || {
        name: name || "—",
        count: 0
      };
      row.count += 1;
      map.set(key, row);
    }
    return [...map.entries()].map(([key, row]) => ({
      key,
      ...row
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
  }, [uniqueGreen.rows]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return uniqueGreen.rows.filter((item) => {
      const key = item.dev?.trim().toLowerCase() || "__none__";
      if (person !== "all" && key !== person) return false;
      if (!q) return true;
      return [item.domain, item.dev, item.status].join(" ").toLowerCase().includes(q);
    });
  }, [uniqueGreen.rows, search, person]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("gmcManageTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-500", children: t("gmcManageDesc") })
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
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-black text-emerald-600", children: uniqueGreen.rows.length })
            ] }),
            byPerson.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `cursor-pointer hover:bg-slate-50/70 ${person === row.key ? "bg-emerald-50/70" : ""}`, onClick: () => setPerson(row.key), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: row.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-black", children: row.count })
            ] }, row.key))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: t("gmcManageSearch"), className: "w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "Domain" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColReg") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColDays") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("gmcManageColStatus") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-100", children: [
          filtered.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-400", children: i + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-bold text-slate-800 lowercase", children: item.domain }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: item.dev || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: item.dateGMC || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: item.daysGreen || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200", children: item.status || "Xanh" }) })
          ] }, domainKey(item.domain))),
          filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "p-8 text-center text-slate-400", children: t("gmcManageEmpty") }) })
        ] })
      ] }) })
    ] })
  ] }) });
}
export {
  GmcManagePage as component
};
