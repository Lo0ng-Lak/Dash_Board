import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { fmtMonthKey, getCurrentMonthKey, sumByWeek, WeekGroupRow } from "@/lib/kpiWeek";

interface WeeklyKpiSectionProps {
    rows: WeekGroupRow[];
    /** Khi parent lọc 1 tháng cụ thể thì đồng bộ theo */
    selectedMonth?: string;
    groupColumnLabel: string;
    emptyHint?: string;
}

export function WeeklyKpiSection({
    rows,
    selectedMonth = "all",
    groupColumnLabel,
    emptyHint,
}: WeeklyKpiSectionProps) {
    const { t } = useTranslation();
    const [activeMonth, setActiveMonth] = useState(getCurrentMonthKey);

    const months = useMemo(
        () => [...new Set(rows.map((r) => r.month))].sort((a, b) => b.localeCompare(a)),
        [rows],
    );

    const monthCounts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const r of rows) map[r.month] = (map[r.month] ?? 0) + r.count;
        return map;
    }, [rows]);

    useEffect(() => {
        if (selectedMonth !== "all") setActiveMonth(selectedMonth);
    }, [selectedMonth]);

    const activeMonthRows = useMemo(
        () => rows.filter((r) => r.month === activeMonth),
        [rows, activeMonth],
    );

    const weekTotals = useMemo(
        () => sumByWeek(activeMonthRows, activeMonth).filter((w) => w.count > 0),
        [activeMonthRows, activeMonth],
    );

    const monthTotal = activeMonthRows.reduce((s, r) => s + r.count, 0);

    if (!rows.length) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                    {t("weeklyKpiTitle", "KPI theo tuần")}
                </h3>
                <p className="text-sm text-slate-400 mt-4">{emptyHint ?? t("weeklyKpiNoData", "Chưa có dữ liệu theo tuần.")}</p>
            </div>
        );
    }

    const allMonthButtons = months.length > 0 ? months : [getCurrentMonthKey()];

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                    {t("weeklyKpiTitle", "KPI theo tuần")}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    {t("weeklyKpiPickMonth", "Bấm tháng khác để xem KPI tuần (T1: 1-7, T2: 8-14, ...)")}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {allMonthButtons.map((month) => {
                    const isActive = month === activeMonth;
                    const isCurrent = month === getCurrentMonthKey();
                    return (
                        <button
                            key={month}
                            type="button"
                            onClick={() => setActiveMonth(month)}
                            className={`px-3 py-2 rounded-xl border text-left transition-all min-w-[88px] ${
                                isActive
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                    : "bg-slate-50 border-slate-100 hover:border-indigo-200 text-slate-700"
                            }`}
                        >
                            <p className={`text-[9px] font-black uppercase ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                                {fmtMonthKey(month)}{isCurrent ? ` · ${t("thisMonth", "tháng này")}` : ""}
                            </p>
                            <p className={`text-lg font-black ${isActive ? "text-white" : "text-slate-800"}`}>
                                {monthCounts[month] ?? 0}
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-600">
                        {t("monthLabel", "Tháng")} {fmtMonthKey(activeMonth)}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{monthTotal} {t("webs", "web")}</span>
                </div>

                {weekTotals.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-slate-50">
                            {weekTotals.map((w) => (
                                <div key={w.week} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center">
                                    <p className="text-[9px] font-black uppercase text-slate-400">{w.weekLabel}</p>
                                    <p className="text-2xl font-black text-indigo-600 mt-1">{w.count}</p>
                                </div>
                            ))}
                        </div>
                        <div className="h-44 px-4 pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekTotals}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="weekLabel" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32}>
                                        <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 800, fill: "#475569" }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <p className="px-4 py-6 text-center text-xs text-slate-400">
                        {t("weeklyKpiNoDataMonth", "Không có dữ liệu trong tháng này.")}
                    </p>
                )}

                <div className="overflow-x-auto border-t border-slate-50">
                    <table className="w-full text-sm min-w-[480px]">
                        <thead className="text-[9px] font-black uppercase text-slate-400 border-b">
                            <tr>
                                <th className="px-4 py-2.5 text-left">{groupColumnLabel}</th>
                                <th className="px-4 py-2.5 text-left">{t("week", "Tuần")}</th>
                                <th className="px-4 py-2.5 text-center">{t("count", "Số lượng")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {activeMonthRows.map((r, i) => (
                                <tr key={`${r.group}-${r.week}-${i}`} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-2.5 font-semibold text-slate-800 text-xs">{r.group}</td>
                                    <td className="px-4 py-2.5 text-xs text-slate-500">{r.weekLabel}</td>
                                    <td className="px-4 py-2.5 text-center font-black text-indigo-600">{r.count}</td>
                                </tr>
                            ))}
                            {activeMonthRows.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400">
                                        {t("noData", "Không có dữ liệu")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
