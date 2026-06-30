import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { getWebShieldData, WebShieldRecord } from "@/lib/dataService";
import { WEB_SHIELD_SHEETS } from "@/lib/sheetConfig";
import { Pagination } from "@/components/pagination";
import { MonthWeeklyKpiBlock } from "@/components/month-weekly-kpi-block";
import { aggregateWeekRows, getCurrentMonthKey, parseIsoDate } from "@/lib/kpiWeek";
import { useTranslation } from "react-i18next";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, LabelList
} from "recharts";

interface DevMonthStat {
    dev: string;
    month: string;
    monthLabel: string;
    websites: string[];
    count: number;
}

const DEV_COLORS = [
    { bg: "#EFF6FF", text: "#1e40af", border: "#93c5fd", bar: "#3b82f6" },
    { bg: "#f0fdf4", text: "#166534", border: "#86efac", bar: "#22c55e" },
    { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", bar: "#f59e0b" },
    { bg: "#fdf4ff", text: "#6b21a8", border: "#d8b4fe", bar: "#a855f7" },
    { bg: "#fff1f2", text: "#9f1239", border: "#fda4af", bar: "#f43f5e" },
    { bg: "#f0fdfa", text: "#134e4a", border: "#5eead4", bar: "#14b8a6" },
    { bg: "#fff7ed", text: "#9a3412", border: "#fdba74", bar: "#f97316" },
    { bg: "#f8fafc", text: "#334155", border: "#cbd5e1", bar: "#64748b" },
];

const UNASSIGNED_DEV = "Chưa gán";

function getDevColor(devName: string, allDevs: string[]) {
    const idx = allDevs.indexOf(devName);
    return DEV_COLORS[idx % DEV_COLORS.length];
}

function getStatusBucket(status: string): "done" | "pending" | "check" | "unknown" {
    const s = (status ?? "").toLowerCase().trim();
    if (!s) return "unknown";
    if (s.includes("done") || s.includes("đã setup") || s.includes("hoàn thành")) return "done";
    if (s.includes("check") || s.includes("kiểm") || s.includes("sửa")) return "check";
    if (s.includes("lỗi") || s.includes("fail") || s.includes("chưa")) return "pending";
    if (/\d{1,2}\/\d{1,2}/.test(s)) return "check";
    return "pending";
}

function buildStats(records: WebShieldRecord[]): DevMonthStat[] {
    const map = new Map<string, DevMonthStat>();
    for (const r of records) {
        const dev = r.dev || UNASSIGNED_DEV;
        const month = r.month ?? "—";
        const key = `${dev}|${month}`;
        if (!map.has(key)) {
            map.set(key, { dev, month, monthLabel: "", websites: [], count: 0 });
        }
        const s = map.get(key)!;
        s.websites.push(r.web);
        s.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month) || a.dev.localeCompare(b.dev));
}

function WebsiteTagList({ websites, color }: { websites: string[]; color: (typeof DEV_COLORS)[0] }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? websites : websites.slice(0, 3);
    const more = websites.length - 3;
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {shown.map(w => (
                <span key={w} className="text-[10px] font-bold px-2 py-0.5 rounded lowercase"
                    style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                    {w}
                </span>
            ))}
            {!expanded && more > 0 && (
                <button type="button" onClick={() => setExpanded(true)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    +{more} {t("more", "more")}
                </button>
            )}
            {expanded && (
                <button type="button" onClick={() => setExpanded(false)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    {t("collapse", "Collapse")}
                </button>
            )}
        </div>
    );
}

function WebShieldKpiPage() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<WebShieldRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [activeKpiMonth, setActiveKpiMonth] = useState(getCurrentMonthKey);
    const [selectedDev, setSelectedDev] = useState("all");
    const [selectedSheet, setSelectedSheet] = useState("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const load = async (force = false) => {
        try {
            force && setRefreshing(true);
            const data = await getWebShieldData(force);
            setRecords(data);
            setError(null);
        } catch {
            setError(t("failedToLoadData", "Failed to load data."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        load();
        const intervalId = setInterval(() => load(true), 30000);
        return () => clearInterval(intervalId);
    }, []);

    const allDevs = useMemo(
        () => [...new Set(records.map((r) => r.dev || UNASSIGNED_DEV))].sort(),
        [records],
    );

    const allMonths = useMemo(
        () => [...new Set(records.map((s) => s.month).filter(Boolean) as string[])].sort((a, b) => b.localeCompare(a)),
        [records],
    );

    const sheetCounts = useMemo(() => {
        const map: Record<string, number> = { all: records.length };
        WEB_SHIELD_SHEETS.forEach((s) => { map[s.id] = 0; });
        records.forEach((r) => { map[r.sheetId] = (map[r.sheetId] || 0) + 1; });
        return map;
    }, [records]);

    const recordsForKpi = useMemo(() => records.filter((r) => {
        const matchSheet = selectedSheet === "all" || r.sheetId === selectedSheet;
        const matchDev = selectedDev === "all"
            || (selectedDev === UNASSIGNED_DEV ? !r.dev : r.dev === selectedDev);
        return matchSheet && matchDev;
    }), [records, selectedSheet, selectedDev]);

    const zoneARecords = useMemo(() => recordsForKpi.filter((r) => {
        const matchMonth = selectedMonth === "all" || r.month === selectedMonth;
        return matchMonth;
    }), [recordsForKpi, selectedMonth]);

    const currentStats = useMemo(() => {
        let done = 0, pending = 0, check = 0, unknown = 0;
        const devs = new Set<string>();
        zoneARecords.forEach((r) => {
            const b = getStatusBucket(r.webStatus);
            if (b === "done") done++;
            if (b === "pending") pending++;
            if (b === "check") check++;
            if (b === "unknown") unknown++;
            if (r.dev) devs.add(r.dev);
        });
        return { total: zoneARecords.length, done, pending, check, unknown, devCount: devs.size };
    }, [zoneARecords]);

    const topDevInfo = useMemo(() => {
        const pool = records.filter((r) => {
            if (!r.dev) return false;
            if (selectedSheet !== "all" && r.sheetId !== selectedSheet) return false;
            return selectedMonth === "all" || r.month === selectedMonth;
        });
        if (!pool.length) return null;

        const counts: Record<string, number> = {};
        pool.forEach((r) => { if (r.dev) counts[r.dev] = (counts[r.dev] || 0) + 1; });

        let top = { dev: "", count: 0 };
        Object.entries(counts).forEach(([dev, count]) => {
            if (count > top.count) top = { dev, count };
        });
        if (top.count === 0) return null;

        if (selectedMonth === "all") {
            return { dev: top.dev, count: top.count, isAllTime: true, year: "", month: 0 };
        }
        const [y, m] = selectedMonth.split("-");
        return { dev: top.dev, count: top.count, isAllTime: false, year: y, month: parseInt(m) };
    }, [records, selectedMonth, selectedSheet]);

    const pieData = useMemo(() => [
        { name: t("statusCompleted", "Completed"), value: currentStats.done, color: "#10b981" },
        { name: t("statusInProgress", "In Progress"), value: currentStats.pending, color: "#f59e0b" },
        { name: t("statusNeedCheck", "Need Check"), value: currentStats.check, color: "#3b82f6" },
        { name: t("statusUnclassified", "Unclassified"), value: currentStats.unknown, color: "#94a3b8" },
    ].filter((d) => d.value > 0), [currentStats, t]);

    const devBarData = useMemo(() => {
        const map: Record<string, { name: string; total: number; done: number }> = {};
        zoneARecords.forEach((r) => {
            const dev = r.dev || UNASSIGNED_DEV;
            if (!map[dev]) map[dev] = { name: dev, total: 0, done: 0 };
            map[dev].total++;
            if (getStatusBucket(r.webStatus) === "done") map[dev].done++;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [zoneARecords]);

    const zoneBRecords = useMemo(() => {
        if (!search.trim()) return zoneARecords;
        const q = search.toLowerCase();
        return zoneARecords.filter((r) =>
            r.dev?.toLowerCase().includes(q)
            || r.web?.toLowerCase().includes(q)
            || r.owner?.toLowerCase().includes(q),
        );
    }, [zoneARecords, search]);

    const tableData = useMemo(() => buildStats(zoneBRecords), [zoneBRecords]);

    const monthlyWeb = useMemo(() => {
        const map: Record<string, number> = {};
        recordsForKpi.forEach((r) => {
            if (!r.month) return;
            map[r.month] = (map[r.month] || 0) + 1;
        });
        return Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => {
                const [y, m] = month.split("-");
                return { month, label: `M${parseInt(m)}/${y}`, count };
            });
    }, [recordsForKpi]);

    const weeklyRows = useMemo(() => aggregateWeekRows(
        recordsForKpi.map((r) => ({
            date: parseIsoDate(r.completedDate),
            group: r.dev || UNASSIGNED_DEV,
            item: r.web,
        })),
    ), [recordsForKpi]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return tableData.slice(start, start + ITEMS_PER_PAGE);
    }, [tableData, currentPage]);
    const maxCount = useMemo(() => Math.max(...tableData.map((s) => s.count), 1), [tableData]);

    if (loading) {
        return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">{t("loadingData", "Loading data...")}</div>;
    }
    if (error) {
        return <div className="m-8 p-4 rounded-2xl bg-red-50 text-red-500 font-medium text-sm">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">
                                {t("webShieldKpiDashboard", "KPI Web Shield")}
                            </h1>
                            {refreshing && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block mt-2"
                                    title={t("autoSyncing", "Auto syncing...")} />
                            )}
                        </div>
                        <p className="text-slate-500 font-medium text-sm">
                            {t("webShieldSubTitle", "Tổng 3 sheet: Shield + Webshield mới + Web Quốc Anh.")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => { setSelectedSheet("all"); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSheet === "all"
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-200"}`}
                    >
                        {t("allSheets", "All sheets")} ({sheetCounts.all})
                    </button>
                    {WEB_SHIELD_SHEETS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => { setSelectedSheet(s.id); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSheet === s.id
                                ? "bg-indigo-600 text-white shadow-md"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-200"}`}
                        >
                            {s.name} ({sheetCounts[s.id] ?? 0})
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">{t("totalWebsites", "Total Websites")}</p>
                            <h2 className="text-2xl font-black text-slate-900 mt-1">{currentStats.total}</h2>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">{t("currentFilter", "Current filter")}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-slate-400 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">{t("statusUnclassified", "Unclassified")}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-slate-600">{currentStats.unknown}</h2>
                                <span className="text-[10px] font-bold text-slate-400">
                                    ({currentStats.total > 0 ? ((currentStats.unknown / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-emerald-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.15em]">{t("statusCompleted", "Completed")}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-emerald-600">{currentStats.done}</h2>
                                <span className="text-[10px] font-bold text-emerald-400">
                                    ({currentStats.total > 0 ? ((currentStats.done / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-amber-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.15em]">{t("statusInProgress", "In Progress")}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-amber-600">{currentStats.pending}</h2>
                                <span className="text-[10px] font-bold text-amber-400">
                                    ({currentStats.total > 0 ? ((currentStats.pending / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-blue-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.15em]">{t("statusNeedCheck", "Need Check")}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-blue-600">{currentStats.check}</h2>
                                <span className="text-[10px] font-bold text-blue-400">
                                    ({currentStats.total > 0 ? ((currentStats.check / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-indigo-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.15em]">
                                {topDevInfo
                                    ? topDevInfo.isAllTime
                                        ? `${t("topDev", "Top Dev")} — ${t("allTime", "All Time")}`
                                        : `${t("topDev", "Top Dev")} — ${t("monthLabelFormat", { month: topDevInfo.month, year: topDevInfo.year })}`
                                    : t("activeDevs", "Active Devs")}
                            </p>
                            <h2 className="text-2xl font-black text-indigo-600 mt-1 truncate">
                                {topDevInfo ? topDevInfo.dev : currentStats.devCount}
                            </h2>
                        </div>
                        <p className="text-[9px] font-bold text-indigo-300 uppercase mt-3">
                            {topDevInfo
                                ? t("sitesCompletedCount", { count: topDevInfo.count, defaultValue: `${topDevInfo.count} sites` })
                                : t("devsInFilterCount", { count: currentStats.devCount, defaultValue: `${currentStats.devCount} devs` })}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("statusBreakdown", "Status Breakdown")}</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("webShieldByDev", "Web Shield by Dev")}</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={devBarData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                        formatter={(v: number) => [v, t("webShieldCount", "Webs")]}
                                    />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={28} name="total">
                                        <LabelList dataKey="total" position="top" offset={8} style={{ fontSize: 11, fontWeight: 800, fill: "#475569" }} />
                                        {devBarData.map((_, i) => (
                                            <Cell key={i} fill={DEV_COLORS[i % DEV_COLORS.length].bar} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
                    <input
                        type="text"
                        placeholder={t("searchPlaceholderTableOnly", "Search dev or domain...")}
                        className="flex-1 min-w-[220px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                    <select
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
                        value={selectedMonth}
                        onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">📅 {t("allMonths", "ALL MONTHS")}</option>
                        {allMonths.map((ym) => {
                            const [y, m] = ym.split("-");
                            return (
                                <option key={ym} value={ym}>
                                    {t("monthLabelFormat", { month: parseInt(m), year: y }).toUpperCase()}
                                </option>
                            );
                        })}
                    </select>
                    <select
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
                        value={selectedDev}
                        onChange={(e) => { setSelectedDev(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">👤 {t("allDevsFilter", "ALL DEVS")}</option>
                        {allDevs.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                </div>

                <MonthWeeklyKpiBlock
                    monthlyData={monthlyWeb}
                    weeklyRows={weeklyRows}
                    activeMonth={activeKpiMonth}
                    onMonthChange={(m) => { setActiveKpiMonth(m); setSelectedMonth(m); }}
                    groupColumnLabel={t("tableHeaderDev", "Dev")}
                    title={t("monthlyKpiTitle", "KPI theo tháng")}
                    subtitle={t("monthlyKpiNote")}
                    emptyHint={t("weeklyKpiShieldHint")}
                />

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left table-fixed min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="p-5 w-[18%]">{t("tableHeaderDev", "Dev")}</th>
                                    <th className="p-5 w-[10%]">{t("tableHeaderMonth", "Month")}</th>
                                    <th className="p-5 w-[8%] text-center">{t("tableHeaderSites", "Sites")}</th>
                                    <th className="p-5 w-[14%]">{t("tableHeaderProgress", "Progress")}</th>
                                    <th className="p-5 w-[50%]">{t("tableHeaderDomains", "Domains")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginated.map((row, idx) => {
                                    const devColor = getDevColor(row.dev, allDevs);
                                    const barPct = Math.round((row.count / maxCount) * 100);
                                    const [y, m] = row.month === "—" ? ["—", "—"] : row.month.split("-");
                                    return (
                                        <tr key={idx} className="transition-all hover:bg-slate-50/60">
                                            <td className="p-5">
                                                <span className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider inline-block"
                                                    style={{ background: devColor.bg, color: devColor.text, border: `1px solid ${devColor.border}` }}>
                                                    {row.dev}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase whitespace-nowrap">
                                                    {row.month === "—"
                                                        ? "—"
                                                        : t("monthShortFormat", { month: parseInt(m), year: y, defaultValue: `M${parseInt(m)}/${y}` })}
                                                </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className="text-xl font-black" style={{ color: devColor.bar }}>{row.count}</span>
                                            </td>
                                            <td className="p-5">
                                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${barPct}%`, background: devColor.bar }} />
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <WebsiteTagList websites={row.websites} color={devColor} />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center p-14 text-sm font-medium text-slate-400">
                                            {t("noMatchingRecords", "No matching records found.")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalItems={tableData.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute("/web-shield-kpi")({
    component: WebShieldKpiPage,
});
