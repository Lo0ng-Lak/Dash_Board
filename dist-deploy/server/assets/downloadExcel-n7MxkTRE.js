import { X as jsxRuntimeExports } from "./server-BY3o_Qlj.js";
import { u as useTranslation } from "./router-D47zfhuR.js";
import { u as utils, w as writeFileSync } from "./xlsx-D7D1xvpX.js";
function ExportExcelButton({
  onClick,
  disabled
}) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      disabled,
      onClick,
      className: "h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50",
      children: t("exportExcel")
    }
  );
}
const sheetName = (raw, used) => {
  const clean = (raw || "Sheet").replace(/[\\/?*[\]:]/g, " ").trim() || "Sheet";
  let name = clean.slice(0, 31);
  let n = 2;
  while (used.has(name)) {
    const suffix = ` ${n++}`;
    name = `${clean.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(name);
  return name;
};
function downloadExcel(filename, sheets) {
  const wb = utils.book_new();
  const used = /* @__PURE__ */ new Set();
  const list = sheets.length ? sheets : [{ name: "Sheet", rows: [] }];
  for (const sheet of list) {
    const rows = sheet.rows.length ? sheet.rows : [{ "": "" }];
    const ws = utils.json_to_sheet(rows);
    const keys = Object.keys(rows[0] || {});
    ws["!cols"] = keys.map((key) => ({ wch: Math.min(48, Math.max(12, key.length + 4)) }));
    utils.book_append_sheet(wb, ws, sheetName(sheet.name, used));
  }
  writeFileSync(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
export {
  ExportExcelButton as E,
  downloadExcel as d
};
