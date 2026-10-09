function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
function getWeekOfMonth(day) {
  if (day >= 22) return 4;
  return Math.min(3, Math.max(1, Math.ceil(day / 7)));
}
function getWeekRangeLabel(week, year, month) {
  const lastDay = getDaysInMonth(year, month);
  const ranges = {
    1: "1-7",
    2: "8-14",
    3: "15-21",
    4: `22-${lastDay}`
  };
  return ranges[week] ?? "";
}
function formatWeekLabel(week, year, month) {
  return `T${week} (${getWeekRangeLabel(week, year, month)})`;
}
function fmtMonthKey(ym) {
  const [y, m] = ym.split("-");
  return `${m}/${y}`;
}
function fmtMonthShort(ym) {
  const [y, m] = ym.split("-");
  return `T${parseInt(m, 10)}/${String(y).slice(-2)}`;
}
function parseMonthKey(ym) {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}
function getCurrentMonthKey() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonthKey(ym, delta) {
  const { year, month } = parseMonthKey(ym);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function getRecentMonthKeys(count = 3, from = getCurrentMonthKey()) {
  return Array.from({ length: count }, (_, i) => shiftMonthKey(from, i - (count - 1)));
}
function parseIsoDate(s) {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseDmyDate(s) {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function getMonthWeekFromDate(d) {
  const year = d.getFullYear();
  const monthNum = d.getMonth() + 1;
  const month = `${year}-${String(monthNum).padStart(2, "0")}`;
  const week = getWeekOfMonth(d.getDate());
  const weekLabel = formatWeekLabel(week, year, monthNum);
  return { month, week, weekLabel };
}
function aggregateWeekRows(entries) {
  const map = /* @__PURE__ */ new Map();
  for (const { date, group, item } of entries) {
    if (!date || !group) continue;
    const { month, week, weekLabel } = getMonthWeekFromDate(date);
    const key = `${month}|${week}|${group}`;
    if (!map.has(key)) {
      map.set(key, {
        month,
        week,
        weekLabel,
        group,
        count: 0,
        items: []
      });
    }
    const row = map.get(key);
    row.count++;
    row.items.push(item);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.month.localeCompare(a.month) || a.week - b.week || a.group.localeCompare(b.group)
  );
}
function sumByWeek(rows, month) {
  const { year, month: monthNum } = parseMonthKey(month);
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    if (r.month !== month) continue;
    const w = r.week >= 4 ? 4 : r.week;
    map.set(w, (map.get(w) ?? 0) + r.count);
  }
  return [1, 2, 3, 4].map((week) => ({
    week,
    weekLabel: formatWeekLabel(week, year, monthNum),
    count: map.get(week) ?? 0
  }));
}
export {
  aggregateWeekRows as a,
  parseDmyDate as b,
  fmtMonthKey as c,
  shiftMonthKey as d,
  getRecentMonthKeys as e,
  fmtMonthShort as f,
  getCurrentMonthKey as g,
  parseIsoDate as p,
  sumByWeek as s
};
