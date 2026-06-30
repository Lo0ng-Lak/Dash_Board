/** Tuần trong tháng (4 tuần): T1 1-7, T2 8-14, T3 15-21, T4 22-hết tháng */

export interface WeekGroupRow {
    month: string;
    week: number;
    weekLabel: string;
    group: string;
    count: number;
    items: string[];
}

export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/** 4 tuần: tuần 4 gộp từ ngày 22 đến hết tháng */
export function getWeekOfMonth(day: number): number {
    if (day >= 22) return 4;
    return Math.min(3, Math.max(1, Math.ceil(day / 7)));
}

export function getWeekRangeLabel(week: number, year: number, month: number): string {
    const lastDay = getDaysInMonth(year, month);
    const ranges: Record<number, string> = {
        1: "1-7",
        2: "8-14",
        3: "15-21",
        4: `22-${lastDay}`,
    };
    return ranges[week] ?? "";
}

export function formatWeekLabel(week: number, year: number, month: number): string {
    return `T${week} (${getWeekRangeLabel(week, year, month)})`;
}

export function fmtMonthKey(ym: string): string {
    const [y, m] = ym.split("-");
    return `${m}/${y}`;
}

/** Nhãn ngắn: T2/26 = tháng 2 năm 2026 */
export function fmtMonthShort(ym: string): string {
    const [y, m] = ym.split("-");
    return `T${parseInt(m, 10)}/${String(y).slice(-2)}`;
}

export function parseMonthKey(ym: string): { year: number; month: number } {
    const [y, m] = ym.split("-").map(Number);
    return { year: y, month: m };
}

export function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseIsoDate(s: string | null | undefined): Date | null {
    if (!s?.trim()) return null;
    const d = new Date(s.trim());
    return Number.isNaN(d.getTime()) ? null : d;
}

export function parseDmyDate(s: string): Date | null {
    const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
}

export function getMonthWeekFromDate(d: Date): { month: string; week: number; weekLabel: string } {
    const year = d.getFullYear();
    const monthNum = d.getMonth() + 1;
    const month = `${year}-${String(monthNum).padStart(2, "0")}`;
    const week = getWeekOfMonth(d.getDate());
    const weekLabel = formatWeekLabel(week, year, monthNum);
    return { month, week, weekLabel };
}

export function aggregateWeekRows(
    entries: { date: Date | null; group: string; item: string }[],
): WeekGroupRow[] {
    const map = new Map<string, WeekGroupRow>();

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
                items: [],
            });
        }
        const row = map.get(key)!;
        row.count++;
        row.items.push(item);
    }

    return Array.from(map.values()).sort(
        (a, b) => b.month.localeCompare(a.month) || a.week - b.week || a.group.localeCompare(b.group),
    );
}

export function sumByWeek(
    rows: WeekGroupRow[],
    month: string,
): { week: number; weekLabel: string; count: number }[] {
    const { year, month: monthNum } = parseMonthKey(month);
    const map = new Map<number, number>();
    for (const r of rows) {
        if (r.month !== month) continue;
        const w = r.week >= 4 ? 4 : r.week;
        map.set(w, (map.get(w) ?? 0) + r.count);
    }
    return [1, 2, 3, 4].map((week) => ({
        week,
        weekLabel: formatWeekLabel(week, year, monthNum),
        count: map.get(week) ?? 0,
    }));
}
