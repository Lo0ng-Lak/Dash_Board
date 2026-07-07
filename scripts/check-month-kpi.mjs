import Papa from "papaparse";

const text = await fetch(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZX8sJDgllzfV8ZVHeQ8LV6AWmq_y97dy_nBmrlTcoNw2c87NZJM14_cvCXMoBGiuY4_fM8NB45CJ2/pub?output=csv&gid=724861620",
).then((r) => r.text());
const rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;

const parse = (d) => {
  const m = String(d || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};
const isKpiStatus = (s) => {
  const x = String(s || "").toLowerCase();
  return x.includes("hoàn thành") || x.includes("hoàn thanh") || x.includes("cần check");
};

for (const month of ["2026-06", "2026-07", "2025-06"]) {
  const all = rows.filter((r) => {
    const dt = parse(r["Ngày hoàn thành"]);
    return dt?.startsWith(month) && isKpiStatus(r["Đã hoàn thành"]) && r["Tên Dev"] && r["Tên Domain"];
  });
  const uniq = new Set(all.map((r) => r["Tên Domain"].toLowerCase()));
  console.log(month, "all rows:", all.length, "unique domains:", uniq.size);
}
