import * as XLSX from "xlsx";

export type ExcelValue = string | number | boolean | null | undefined;

const sheetName = (raw: string, used: Set<string>) => {
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

export function downloadExcel(filename: string, sheets: { name: string; rows: Record<string, ExcelValue>[] }[]) {
    const wb = XLSX.utils.book_new();
    const used = new Set<string>();
    const list = sheets.length ? sheets : [{ name: "Sheet", rows: [] }];
    for (const sheet of list) {
        const rows = sheet.rows.length ? sheet.rows : [{ "": "" }];
        const ws = XLSX.utils.json_to_sheet(rows);
        const keys = Object.keys(rows[0] || {});
        ws["!cols"] = keys.map((key) => ({ wch: Math.min(48, Math.max(12, key.length + 4)) }));
        XLSX.utils.book_append_sheet(wb, ws, sheetName(sheet.name, used));
    }
    XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
