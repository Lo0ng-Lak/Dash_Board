import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
    fmtMonthKey, fmtMonthShort, getCurrentMonthKey, sumByWeek, WeekGroupRow,
} from "@/lib/kpiWeek";

export interface MonthlyCount {
    month: string;
    label: string;
    count: number;
}

export interface OwnerStackBar {
    label: string;
    month: string;
    [key: string]: string | number;
}

interface OwnerBarConfig {
    id: string;
    name: string;
    color: string;
}

interface MonthWeeklyKpiBlockProps {
    monthlyData: MonthlyCount[];
    weeklyRows: WeekGroupRow[];
    activeMonth: string;
    onMonthChange: (month: string) => void;
    groupColumnLabel: string;
    title?: string;
    subtitle?: string;
    emptyHint?: string;
    ownerStack?: OwnerStackBar[];
    ownerBars?: OwnerBarConfig[];
}

const MONTH_PALETTE = [
    "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#f43f5e", "#14b8a6", "#f97316", "#6366f1",
];

const WEEK_STYLES = [
    { bg: "bg-blue-50", border: "border-blue-200", label: "text-blue-500", count: "text-blue-600", bar: "#3b82f6" },
    { bg: "bg-emerald-50", border: "border-emerald-200", label: "text-emerald-500", count: "text-emerald-600", bar: "#22c55e" },
    { bg: "bg-amber-50", border: "border-amber-200", label: "text-amber-500", count: "text-amber-600", bar: "#f59e0b" },
    { bg: "bg-violet-50", border: "border-violet-200", label: "text-violet-500", count: "text-violet-600", bar: "#8b5cf6" },
];

function groupColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return MONTH_PALETTE[Math.abs(hash) % MONTH_PALETTE.length];
}

function monthBarFill(color: string, entry: { isActive: boolean; isCurrent: boolean }): string {
    if (entry.isActive) return color;
    if (entry.isCurrent) return `${color}cc`;
    return `${color}66`;
}

export function MonthWeeklyKpiBlock({
    monthlyData,
    weeklyRows,
    activeMonth,
    onMonthChange,
    groupColumnLabel,
    title,
    subtitle,
    emptyHint,
    ownerStack,
    ownerBars,
}: MonthWeeklyKpiBlockProps) {
    const { t } = useTranslation();
    const currentMonth = getCurrentMonthKey();

    const chartData = useMemo(
        () => monthlyData.map((m, i) => ({
            ...m,
            shortLabel: fmtMonthShort(m.month),
            color: MONTH_PALETTE[i % MONTH_PALETTE.length],
            isCurrent: m.month === currentMonth,
            isActive: m.month === activeMonth,
        })),
        [monthlyData, currentMonth, activeMonth],
    );

    const activeMonthRows = useMemo(
        () => weeklyRows.filter((r) => r.month === activeMonth),
        [weeklyRows, activeMonth],
    );

    const weekTotals = useMemo(
        () => sumByWeek(activeMonthRows, activeMonth).filter((w) => w.count > 0),
        [activeMonthRows, activeMonth],
    );

    const weekChartData = useMemo(
        () => weekTotals.map((w) => ({
            ...w,
            color: WEEK_STYLES[(w.week - 1) % WEEK_STYLES.length].bar,
        })),
        [weekTotals],
    );

    const monthTotal = activeMonthRows.reduce((s, r) => s + r.count, 0);
    const activeLabel = fmtMonthShort(activeMonth);

    return (
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest">
                        {title ?? t("monthlyKpiTitle", "KPI theo tháng")}
                    </h3>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 rounded-xl shrink-0 shadow-md shadow-indigo-200">
                    <p className="text-[9px] font-black uppercase text-indigo-100">
                        {activeMonth === currentMonth ? t("thisMonth", "Tháng này") : activeLabel}
                    </p>
                    <p className="text-2xl font-black text-white">
                        {monthTotal} <span className="text-sm font-bold text-indigo-100">{t("webs", "web")}</span>
                    </p>
                </div>
            </div>

            {chartData.length > 0 ? (
                <div>
                    <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 14, right: 4, left: 4, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="shortLabel"
                                    tick={{ fontSize: 9, fontWeight: 600, fill: "#64748b" }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <YAxis hide />
                                <Tooltip
                                    formatter={(v: number) => [v, t("webs", "web")]}
                                    labelFormatter={(_, payload) => {
                                        const row = payload?.[0]?.payload as { month?: string } | undefined;
                                        return row?.month ? fmtMonthKey(row.month) : "";
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[2, 2, 0, 0]}
                                    barSize={16}
                                    name={t("webs", "web")}
                                    cursor="pointer"
                                    onClick={(data) => {
                                        const month = (data as { payload?: MonthlyCount })?.payload?.month;
                                        if (month) onMonthChange(month);
                                    }}
                                >
                                    <LabelList dataKey="count" position="top" style={{ fontSize: 9, fontWeight: 800, fill: "#475569" }} />
                                    {chartData.map((entry) => (
                                        <Cell
                                            key={entry.month}
                                            fill={monthBarFill(entry.color, entry)}
                                            stroke={entry.isActive ? entry.color : "none"}
                                            strokeWidth={entry.isActive ? 2 : 0}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-indigo-400/80 mt-2 text-center">
                        {subtitle ?? t("monthlyKpiNote", "Bấm cột tháng để xem KPI tuần · mặc định tháng hiện tại")}
                    </p>
                </div>
            ) : (
                <p className="text-sm text-slate-400">{emptyHint ?? t("weeklyKpiNoData")}</p>
            )}

            {ownerStack && ownerStack.length > 0 && ownerBars && (
                <div className="h-24 border-t border-slate-100 pt-3">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">
                        {t("monthlyRegByOwner", "REG theo người")}
                    </p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ownerStack} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                            <XAxis dataKey="label" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={36} />
                            <YAxis hide />
                            <Tooltip />
                            {ownerBars.map((s) => (
                                <Bar key={s.id} dataKey={s.name} stackId="a" fill={s.color} barSize={10} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-600">
                        {t("weeklyKpiTitle", "KPI tuần")} · {activeLabel}
                    </span>
                    <span className="text-[10px] font-bold text-violet-400 bg-white/70 px-2 py-0.5 rounded-full">
                        {t("weeklyKpi4Weeks", "4 tuần / tháng")}
                    </span>
                </div>

                {weekTotals.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-indigo-50">
                            {weekTotals.map((w) => {
                                const style = WEEK_STYLES[(w.week - 1) % WEEK_STYLES.length];
                                return (
                                    <div key={w.week} className={`p-2.5 rounded-xl border ${style.bg} ${style.border} text-center`}>
                                        <p className={`text-[9px] font-black uppercase ${style.label}`}>{w.weekLabel}</p>
                                        <p className={`text-xl font-black ${style.count} mt-0.5`}>{w.count}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="h-36 px-3 pb-3 pt-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="weekLabel" tick={{ fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 9 }} width={24} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                                        <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 800, fill: "#475569" }} />
                                        {weekChartData.map((w) => (
                                            <Cell key={w.week} fill={w.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <p className="px-4 py-5 text-center text-xs text-slate-400">
                        {t("weeklyKpiNoDataMonth", "Không có dữ liệu trong tháng này.")}
                    </p>
                )}

                <div className="overflow-x-auto border-t border-indigo-50">
                    <table className="w-full text-sm min-w-[400px]">
                        <thead className="text-[9px] font-black uppercase border-b border-indigo-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-indigo-400">{groupColumnLabel}</th>
                                <th className="px-4 py-2 text-left text-violet-400">{t("week", "Tuần")}</th>
                                <th className="px-4 py-2 text-center text-fuchsia-400">{t("count", "SL")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50/60">
                            {activeMonthRows.map((r, i) => {
                                const color = groupColor(r.group);
                                const weekStyle = WEEK_STYLES[(r.week - 1) % WEEK_STYLES.length];
                                return (
                                    <tr key={`${r.group}-${r.week}-${i}`} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-4 py-2 text-xs">
                                            <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                                {r.group}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${weekStyle.bg} ${weekStyle.label}`}>
                                                {r.weekLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span
                                                className="inline-block min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-black text-white"
                                                style={{ background: color }}
                                            >
                                                {r.count}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
