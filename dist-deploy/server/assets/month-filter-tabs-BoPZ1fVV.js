import { X as jsxRuntimeExports } from "./server-BY3o_Qlj.js";
import { f as fmtMonthShort } from "./kpiWeek-uKv2Fy6X.js";
function MonthFilterTabs({ items, totalWithDate, selected, onSelect, allLabel }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => onSelect("all"),
        className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${selected === "all" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"}`,
        children: [
          allLabel,
          " (",
          totalWithDate,
          ")"
        ]
      }
    ),
    items.map((item) => {
      const active = selected === item.month;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onSelect(item.month),
          className: `px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-300"}`,
          children: [
            fmtMonthShort(item.month),
            " (",
            item.count,
            ")"
          ]
        },
        item.month
      );
    })
  ] });
}
export {
  MonthFilterTabs as M
};
