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

// rows with july date
const july = rows.filter((r) => parse(r["Ngày hoàn thành"])?.startsWith("2026-07"));
console.log("any july date rows:", july.length);
july.slice(0, 5).forEach((r) => console.log(r["Tên Domain"], r["Đã hoàn thành"], r["Ngày hoàn thành"]));

// dedupe effect: domains whose LAST row is not july but had july kpi row earlier
const byDomain = new Map();
for (const r of rows) {
  const d = String(r["Tên Domain"] || "").trim().toLowerCase();
  if (d) byDomain.set(d, r);
}
let lost = 0;
for (const r of rows) {
  const d = String(r["Tên Domain"] || "").trim().toLowerCase();
  const dt = parse(r["Ngày hoàn thành"]);
  if (!dt?.startsWith("2026-07") || !isKpiStatus(r["Đã hoàn thành"])) continue;
  const last = byDomain.get(d);
  const lastDt = parse(last?.["Ngày hoàn thành"]);
  if (!lastDt?.startsWith("2026-07")) {
    lost++;
    if (lost <= 5) console.log("LOST july kpi:", d, "last month", lastDt, last?.["Đã hoàn thành"]);
  }
}
console.log("july kpi rows lost by dedupe:", lost);

// duplicate same domain same month
const june = rows.filter((r) => {
  const dt = parse(r["Ngày hoàn thành"]);
  return dt?.startsWith("2026-06") && isKpiStatus(r["Đã hoàn thành"]) && r["Tên Domain"];
});
const counts = {};
june.forEach((r) => {
  const d = r["Tên Domain"].toLowerCase();
  counts[d] = (counts[d] || 0) + 1;
});
const dupes = Object.entries(counts).filter(([, c]) => c > 1);
console.log("june duplicate domains:", dupes.length, dupes.slice(0, 5));
