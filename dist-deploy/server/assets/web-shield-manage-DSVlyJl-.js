import { r as reactExports, X as jsxRuntimeExports } from "./server-D1kiBNQ3.js";
import { u as useQuery } from "./useQuery-ClPJIjB8.js";
import { W as WEB_SHIELD_MANAGE_SHEETS, g as getWebShieldManageData } from "./dataService-NS9qAXcf.js";
import { u as useTranslation } from "./router-48ILCIjq.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
const fold = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
const needsSetup = (status) => fold(status).includes("chua set");
function WebShieldManagePage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [sheetId, setSheetId] = reactExports.useState(WEB_SHIELD_MANAGE_SHEETS[0].id);
  const [pending, setPending] = reactExports.useState(null);
  const [note, setNote] = reactExports.useState({});
  const {
    data: rows = [],
    isLoading
  } = useQuery({
    queryKey: ["webShieldManage"],
    queryFn: () => getWebShieldManageData(true),
    refetchInterval: 3e4
  });
  const q = search.trim().toLowerCase();
  const boards = reactExports.useMemo(() => WEB_SHIELD_MANAGE_SHEETS.map((sheet) => {
    const list = rows.filter((row) => {
      if (row.sheetId !== sheet.id) return false;
      if (!q) return true;
      return [row.web, row.dev, row.cong, row.webStatus, row.tinhTrang].join(" ").toLowerCase().includes(q);
    });
    return {
      ...sheet,
      rows: list,
      setup: list.filter((row) => needsSetup(row.tinhTrang)).length
    };
  }), [rows, q]);
  const activeId = boards.some((item) => item.id === sheetId) ? sheetId : boards[0]?.id;
  const activeBoard = boards.find((board) => board.id === activeId);
  const setup = async (row) => {
    const key = `${row.sheetId}:${row.web}`;
    setPending(key);
    setNote((prev) => ({
      ...prev,
      [key]: ""
    }));
    try {
      const res = await fetch("/api/web-shield/setup", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          domain: row.web,
          sheetId: row.sheetId
        })
      });
      const json = await res.json();
      setNote((prev) => ({
        ...prev,
        [key]: json.message || json.error || t("webShieldManageSetupPending")
      }));
    } catch {
      setNote((prev) => ({
        ...prev,
        [key]: t("webShieldManageSetupFail")
      }));
    } finally {
      setPending(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("webShieldManageTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-500", children: t("webShieldManageDesc") })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 animate-pulse", children: t("loadingSystemData") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: t("webShieldManageSearch"), className: "w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: boards.map((board, index) => {
        const active = board.id === activeId;
        const color = index === 0 ? "#3b82f6" : "#8b5cf6";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setSheetId(board.id), className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all border ${active ? "text-white shadow-md" : "bg-white"}`, style: active ? {
          background: color,
          borderColor: color
        } : {
          color,
          borderColor: color,
          background: `${color}15`
        }, children: [
          board.name,
          " (",
          board.rows.length,
          ")"
        ] }, board.id);
      }) }),
      activeBoard && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-black", children: activeBoard.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 text-[10px] font-black uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600", children: activeBoard.rows.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100", children: [
              t("webShieldManageNeedSetup"),
              " ",
              activeBoard.setup
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[860px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "#" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("webShieldManageColWeb") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "DEV" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("webShieldManageColPort") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("webShieldManageColWebStatus") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("webShieldManageColStatus") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-100", children: [
            activeBoard.rows.map((row, index) => {
              const key = `${row.sheetId}:${row.web}`;
              const open = needsSetup(row.tinhTrang);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/70", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-400", children: index + 1 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-bold text-slate-800 lowercase", children: row.web }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: row.dev || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: row.cong || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: row.webStatus || "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: open ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setup(row), disabled: pending === key, className: "px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wide disabled:opacity-60", children: pending === key ? "…" : t("webShieldManageSetup") }),
                  note[key] && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-amber-700", children: note[key] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200", children: row.tinhTrang || "—" }) })
              ] }, `${key}-${index}`);
            }),
            activeBoard.rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "p-8 text-center text-slate-400", children: t("webShieldManageEmpty") }) })
          ] })
        ] }) })
      ] })
    ] })
  ] }) });
}
export {
  WebShieldManagePage as component
};
