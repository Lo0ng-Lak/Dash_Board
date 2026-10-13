import { r as reactExports, X as jsxRuntimeExports } from "./server-CHteKQQO.js";
import { u as useQuery } from "./useQuery-CLF9K1s_.js";
import { u as utils, w as writeFileSync } from "./xlsx-D7D1xvpX.js";
import { u as useTranslation } from "./router-BxCuPKFv.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const isCustomDomain = (d) => d.type !== "DEFAULT" && !d.domain.endsWith(".ondigitalocean.app");
const customCount = (app) => app.domains.filter(isCustomDomain).length;
async function loadApps() {
  const res = await fetch("/api/app-platform");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.apps ?? [];
}
function downloadAppSheet(app) {
  const rows = app.domains.map((d, i) => ({
    STT: i + 1,
    App: app.name,
    "Web Service": app.webService,
    Domain: d.domain,
    Loai: d.primary ? "PRIMARY" : d.type,
    "Live URL": app.liveUrl,
    Region: app.region,
    Size: app.instanceSize,
    Instances: app.instanceCount ?? "",
    GitHub: app.github,
    "App ID": app.id,
    "Tong domain": app.domains.length,
    "Domain custom": customCount(app)
  }));
  const ws = utils.json_to_sheet(rows.length ? rows : [{
    STT: 1,
    App: app.name,
    "Web Service": app.webService,
    Domain: "",
    Loai: "",
    "Live URL": app.liveUrl,
    Region: app.region,
    Size: app.instanceSize,
    Instances: app.instanceCount ?? "",
    GitHub: app.github,
    "App ID": app.id,
    "Tong domain": 0,
    "Domain custom": 0
  }]);
  ws["!cols"] = [{
    wch: 6
  }, {
    wch: 24
  }, {
    wch: 28
  }, {
    wch: 36
  }, {
    wch: 12
  }, {
    wch: 42
  }, {
    wch: 8
  }, {
    wch: 22
  }, {
    wch: 10
  }, {
    wch: 40
  }, {
    wch: 38
  }];
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Domains");
  writeFileSync(wb, `${app.name}-domains.xlsx`);
}
function AppPlatformPage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [openId, setOpenId] = reactExports.useState(null);
  const {
    data: apps = [],
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ["do-app-platform"],
    queryFn: loadApps,
    staleTime: 6e4
  });
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((app) => {
      if (app.name.toLowerCase().includes(q)) return true;
      if (app.webService.toLowerCase().includes(q)) return true;
      if (app.liveUrl.toLowerCase().includes(q)) return true;
      if (app.region.toLowerCase().includes(q)) return true;
      return app.domains.some((d) => d.domain.includes(q));
    });
  }, [apps, search]);
  const totalDomains = apps.reduce((n, a) => n + a.domains.length, 0);
  const totalCustom = apps.reduce((n, a) => n + customCount(a), 0);
  const filteredTotal = filtered.reduce((n, a) => n + a.domains.length, 0);
  const filteredCustom = filtered.reduce((n, a) => n + customCount(a), 0);
  const sorted = reactExports.useMemo(() => [...filtered].sort((a, b) => customCount(b) - customCount(a) || b.domains.length - a.domains.length), [filtered]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-6 md:p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-sky-600", children: "DigitalOcean" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("appPlatform") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("appPlatformDesc") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => refetch(), className: "h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50", children: isFetching ? t("appPlatformRefreshing") : t("appPlatformRefresh") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white border border-slate-100 p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: t("appPlatformApps") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-black", children: apps.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white border border-slate-100 p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: t("appPlatformColTotal") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-black", children: totalDomains })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white border border-sky-100 p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-sky-500", children: t("appPlatformColCustom") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-black text-sky-700", children: totalCustom }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 font-medium mt-0.5", children: t("appPlatformCustomHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white border border-slate-100 p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400", children: t("appPlatformShowing") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-black", children: filtered.length })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: t("appPlatformSearch"), className: "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-sky-200" }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("appPlatformLoading") }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700", children: error.message }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-medium", children: t("appPlatformEmpty") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-4 py-3", children: t("appPlatformColApp") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-3 py-3 hidden lg:table-cell", children: t("appPlatformColService") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-3 py-3", children: t("appPlatformColRegion") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-3 whitespace-nowrap", children: t("appPlatformColTotal") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-3 whitespace-nowrap", children: t("appPlatformColCustom") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: sorted.map((app) => {
        const open = openId === app.id;
        const nCustom = customCount(app);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-slate-100 hover:bg-slate-50/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "text-left", onClick: () => setOpenId(open ? null : app.id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black text-slate-900", children: app.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 truncate max-w-[240px]", children: app.liveUrl || "—" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 hidden lg:table-cell text-xs text-slate-500", children: app.webService || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-[11px] font-bold uppercase text-slate-500", children: app.region || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right font-black tabular-nums", children: app.domains.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right font-black tabular-nums text-sky-700", children: nCustom }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => downloadAppSheet(app), className: "h-9 px-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wide hover:bg-slate-800", children: t("appPlatformDownload") }) })
          ] }),
          open && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-slate-50 bg-slate-50/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { colSpan: 6, className: "px-4 py-3", children: [
            app.github && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mb-2 font-medium", children: app.github }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: app.domains.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold ${d.primary ? "border-sky-200 bg-sky-50 text-sky-800" : d.type === "DEFAULT" ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-100 bg-white text-slate-700"}`, children: [
              d.domain,
              d.primary && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase text-sky-600", children: "primary" })
            ] }, d.domain)) })
          ] }) })
        ] }, app.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t-2 border-slate-200 bg-slate-50 font-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", colSpan: 3, children: t("appPlatformFooterTotal") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right tabular-nums", children: filteredTotal }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right tabular-nums text-sky-700", children: filteredCustom }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", {})
      ] }) })
    ] }) }) })
  ] }) });
}
export {
  AppPlatformPage as component
};
