import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { getAllDataWeb, WebRecord } from "@/lib/dataService";
import { Pagination } from "@/components/pagination";
import { MonthWeeklyKpiBlock } from "@/components/month-weekly-kpi-block";
import { aggregateWeekRows, getCurrentMonthKey, parseIsoDate } from "@/lib/kpiWeek";
import { useTranslation } from "react-i18next";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, LabelList
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevMonthStat {
    dev: string;
    month: string;
    monthLabel: string;
    websites: string[];
    count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getDevColor(devName: string, allDevs: string[]) {
    const idx = allDevs.indexOf(devName);
    return DEV_COLORS[idx % DEV_COLORS.length];
}

function getStatusBucket(status: string): "done" | "pending" | "check" | "unknown" {
    const s = (status ?? "").toLowerCase().trim();
    if (s.includes("đã hoàn thành") || s.includes("completed") || s.includes("done")) return "done";
    if (s.includes("chưa") || s.includes("pending") || s.includes("in progress")) return "pending";
    if (s.includes("check")) return "check";
    return "unknown";
}

function buildStats(records: WebRecord[]): DevMonthStat[] {
    const map = new Map<string, DevMonthStat>();
    for (const r of records) {
        if (!r.month || !r.dev) continue;
        if (getStatusBucket(r.status) !== "done") continue;
        const key = `${r.dev}|${r.month}`;
        if (!map.has(key)) {
            map.set(key, { dev: r.dev, month: r.month, monthLabel: "", websites: [], count: 0 });
        }
        const s = map.get(key)!;
        s.websites.push(r.domain);
        s.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month) || a.dev.localeCompare(b.dev));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
                <button onClick={() => setExpanded(true)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    +{more} {t("more", "more")}
                </button>
            )}
            {expanded && (
                <button onClick={() => setExpanded(false)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    {t("collapse", "Collapse")}
                </button>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

function WebKPIPage() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<WebRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [activeKpiMonth, setActiveKpiMonth] = useState(getCurrentMonthKey);
    const [selectedDev, setSelectedDev] = useState("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const load = async (force = false) => {
        try {
            force && setRefreshing(true);
            const data = await getAllDataWeb(force);
            setRecords(data);
            setError(null);
        } catch {
            setError(t("failedToLoadData", "Failed to load data."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ── Tự động cập nhật dữ liệu (Polling) ─────────────────────────────────────
    useEffect(() => {
        load();
        const intervalId = setInterval(() => {
            load(true);
        }, 30000);
        return () => clearInterval(intervalId);
    }, []);

    // ── 1. Static dropdown options ───────────────────────────────────────────
    const baseStats = useMemo(() => buildStats(records), [records]);
    const allDevs = useMemo(() => [...new Set(baseStats.map(s => s.dev))].sort(), [baseStats]);

    const allMonths = useMemo(() =>
        [...new Set(baseStats.map(s => s.month))].sort((a, b) => b.localeCompare(a)),
        [baseStats]);

    // ── 2. ZONE A: Dropdown-only filter ──────────────────────────────────────
    const zoneARecords = useMemo(() => {
        return records.filter(r => {
            const matchMonth = selectedMonth === "all" || r.month === selectedMonth;
            const matchDev = selectedDev === "all" || r.dev === selectedDev;
            return matchMonth && matchDev;
        });
    }, [records, selectedMonth, selectedDev]);

    const currentStats = useMemo(() => {
        let done = 0, pending = 0, check = 0, unknown = 0;
        const devs = new Set<string>();
        zoneARecords.forEach(r => {
            const b = getStatusBucket(r.status);
            if (b === "done") done++;
            if (b === "pending") pending++;
            if (b === "check") check++;
            if (b === "unknown") unknown++;
            if (r.dev) devs.add(r.dev);
        });
        return { total: zoneARecords.length, done, pending, check, unknown, devCount: devs.size };
    }, [zoneARecords]);

    const topDevInfo = useMemo(() => {
        const pool = records.filter(r => {
            const isDone = getStatusBucket(r.status) === "done";
            if (!isDone) return false;
            return selectedMonth === "all" || r.month === selectedMonth;
        });

        if (!pool.length) return null;

        const counts: Record<string, number> = {};
        pool.forEach(r => {
            if (r.dev) counts[r.dev] = (counts[r.dev] || 0) + 1;
        });

        let top = { dev: "", count: 0 };
        Object.entries(counts).forEach(([dev, count]) => {
            if (count > top.count) top = { dev, count };
        });

        if (top.count === 0) return null;

        // Chuẩn hóa dữ liệu trả về để object luôn luôn có cấu trúc giống nhau
        if (selectedMonth === "all") {
            return {
                dev: top.dev,
                count: top.count,
                isAllTime: true,
                year: "",
                month: 0
            };
        } else {
            const [y, m] = selectedMonth.split("-");
            return {
                dev: top.dev,
                count: top.count,
                isAllTime: false,
                year: y,
                month: parseInt(m)
            };
        }
    }, [records, selectedMonth]);

    const pieData = useMemo(() => [
        { name: t("statusCompleted", "Completed"), value: currentStats.done, color: "#10b981" },
        { name: t("statusInProgress", "In Progress"), value: currentStats.pending, color: "#f59e0b" },
        { name: t("statusNeedCheck", "Need Check"), value: currentStats.check, color: "#3b82f6" },
        { name: t("statusUnclassified", "Unclassified"), value: currentStats.unknown, color: "#94a3b8" },
    ].filter(d => d.value > 0), [currentStats, t]);

    const devBarData = useMemo(() => {
        const map: Record<string, { name: string; done: number }> = {};
        zoneARecords.forEach(r => {
            if (getStatusBucket(r.status) === "done" && r.dev) {
                if (!map[r.dev]) map[r.dev] = { name: r.dev, done: 0 };
                map[r.dev].done++;
            }
        });
        return Object.values(map).sort((a, b) => b.done - a.done);
    }, [zoneARecords]);

    // ── 3. ZONE B: Dropdown + search ─────────────────────────────────────────
    const zoneBRecords = useMemo(() => {
        if (!search.trim()) return zoneARecords;
        const q = search.toLowerCase();
        return zoneARecords.filter(r =>
            (r.dev?.toLowerCase().includes(q)) ||
            (r.domain?.toLowerCase().includes(q))
        );
    }, [zoneARecords, search]);

    const tableData = useMemo(() => buildStats(zoneBRecords), [zoneBRecords]);

    const monthlyDone = useMemo(() => {
        const map: Record<string, number> = {};
        records.forEach((r) => {
            if (!r.month || getStatusBucket(r.status) !== "done") return;
            const matchDev = selectedDev === "all" || r.dev === selectedDev;
            if (!matchDev) return;
            map[r.month] = (map[r.month] || 0) + 1;
        });
        return Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => {
                const [y, m] = month.split("-");
                return { month, label: `M${parseInt(m)}/${y}`, count };
            });
    }, [records, selectedDev]);

    const weeklyRows = useMemo(() => {
        const pool = records.filter((r) => {
            const matchDev = selectedDev === "all" || r.dev === selectedDev;
            return matchDev && getStatusBucket(r.status) === "done";
        });
        return aggregateWeekRows(
            pool.map((r) => ({
                date: parseIsoDate(r.completedDate),
                group: r.dev || "—",
                item: r.domain,
            })),
        );
    }, [records, selectedDev]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return tableData.slice(start, start + ITEMS_PER_PAGE);
    }, [tableData, currentPage]);

    const maxCount = useMemo(() =>
        Math.max(...tableData.map(s => s.count), 1),
        [tableData]);

    if (loading) {
        return (
            <div className="p-10 text-center font-medium text-slate-400 animate-pulse">
                {t("loadingData", "Loading data...")}
            </div>
        );
    }

    if (error) {
        return <div className="m-8 p-4 rounded-2xl bg-red-50 text-red-500 font-medium text-sm">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">
                                {t("webKpiDashboard", "Web KPI Dashboard")}
                            </h1>
                            {refreshing && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block mt-2"
                                    title={t("autoSyncing", "Auto syncing...")} />
                            )}
                        </div>
                        <p className="text-slate-500 font-medium text-sm">
                            {t("dashboardSubTitle", "Track website completion status by dev & month.")}
                        </p>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                    {/* Total */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">
                                {t("totalWebsites", "Total Websites")}
                            </p>
                            <h2 className="text-2xl font-black text-slate-900 mt-1">{currentStats.total}</h2>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">
                            {t("currentFilter", "Current filter")}
                        </p>
                    </div>

                    {/* Unclassified */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-slate-400 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">
                                {t("statusUnclassified", "Unclassified")}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-slate-600">{currentStats.unknown}</h2>
                                <span className="text-[10px] font-bold text-slate-400">
                                    ({currentStats.total > 0 ? ((currentStats.unknown / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-3">
                            {t("statusUnclassified", "Unclassified")}
                        </p>
                    </div>

                    {/* Completed */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-emerald-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.15em]">
                                {t("statusCompleted", "Completed")}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-emerald-600">{currentStats.done}</h2>
                                <span className="text-[10px] font-bold text-emerald-400">
                                    ({currentStats.total > 0 ? ((currentStats.done / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("doneUpper", "DONE")}
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-amber-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.15em]">
                                {t("statusInProgress", "In Progress")}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-amber-600">{currentStats.pending}</h2>
                                <span className="text-[10px] font-bold text-amber-400">
                                    ({currentStats.total > 0 ? ((currentStats.pending / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-amber-400 uppercase mt-3">
                            {t("pendingUpper", "Pending")}
                        </p>
                    </div>

                    {/* Need Check */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-blue-500 border-t-2">
                        <div>
                            <p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.15em]">
                                {t("statusNeedCheck", "Need Check")}
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h2 className="text-2xl font-black text-blue-600">{currentStats.check}</h2>
                                <span className="text-[10px] font-bold text-blue-400">
                                    ({currentStats.total > 0 ? ((currentStats.check / currentStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-blue-400 uppercase mt-3">
                            {t("awaitingQA", "Awaiting QA")}
                        </p>
                    </div>

                    {/* Top Dev Card */}
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
                                ? t("sitesCompletedCount", { count: topDevInfo.count, defaultValue: `${topDevInfo.count} sites completed` })
                                : t("devsInFilterCount", { count: currentStats.devCount, defaultValue: `${currentStats.devCount} devs in filter` })}
                        </p>
                    </div>

                </div>

                {/* ── Charts ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">
                            {t("statusBreakdown", "Status Breakdown")}
                        </h3>
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
                        <div className="flex flex-col gap-1.5 mt-4">
                            {pieData.map(d => (
                                <div key={d.name} className="flex items-center gap-2 text-[10px] font-bold" style={{ color: d.color }}>
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                    {d.name}: {d.value}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bar */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">
                            {t("sitesCompletedByDev", "Sites Completed by Dev")}
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={devBarData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                        formatter={(v: number) => [v, t("sitesCompletedTooltip", "Sites completed")]}
                                    />
                                    <Bar dataKey="done" radius={[4, 4, 0, 0]} barSize={28} name="done">
                                        <LabelList dataKey="done" position="top" offset={8} style={{ fontSize: 11, fontWeight: 800, fill: '#475569' }} />
                                        {devBarData.map((_, i) => (
                                            <Cell key={i} fill={DEV_COLORS[i % DEV_COLORS.length].bar} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
                    <input
                        type="text"
                        placeholder={t("searchPlaceholderTableOnly", "Search dev or domain... (table only)")}
                        className="flex-1 min-w-[220px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                    <select
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100 transition-colors"
                        value={selectedMonth}
                        onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">📅 {t("allMonths", "ALL MONTHS")}</option>
                        {allMonths.map((ym: string) => {
                            const [y, m] = ym.split("-");
                            return (
                                <option key={ym} value={ym}>
                                    {t("monthLabelFormat", { month: parseInt(m), year: y }).toUpperCase()}
                                </option>
                            );
                        })}
                    </select>
                    <select
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100 transition-colors"
                        value={selectedDev}
                        onChange={e => { setSelectedDev(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">👤 {t("allDevsFilter", "ALL DEVS")}</option>
                        {allDevs.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                    {(selectedMonth !== "all" || selectedDev !== "all" || search) && (
                        <button
                            onClick={() => { setSelectedMonth("all"); setSelectedDev("all"); setSearch(""); setCurrentPage(1); }}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            ✕ {t("clearFilters", "Clear filters")}
                        </button>
                    )}
                </div>

                <MonthWeeklyKpiBlock
                    monthlyData={monthlyDone}
                    weeklyRows={weeklyRows}
                    activeMonth={activeKpiMonth}
                    onMonthChange={(m) => { setActiveKpiMonth(m); setSelectedMonth(m); }}
                    groupColumnLabel={t("tableHeaderDev", "Dev")}
                    title={t("monthlyKpiTitle", "KPI theo tháng")}
                    subtitle={t("monthlyKpiNote")}
                    emptyHint={t("weeklyKpiWebHint")}
                />

                {/* ── Table ── */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
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
                                    const [y, m] = row.month.split("-");
                                    return (
                                        <tr key={idx} className="transition-all hover:bg-slate-50/60">
                                            <td className="p-5">
                                                <span
                                                    className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider inline-block"
                                                    style={{ background: devColor.bg, color: devColor.text, border: `1px solid ${devColor.border}` }}
                                                >
                                                    {row.dev}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap">
                                                    {t("monthShortFormat", { month: parseInt(m), year: y, defaultValue: `M${parseInt(m)}/${y}` })}
                                                </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className="text-xl font-black" style={{ color: devColor.bar }}>
                                                    {row.count}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${barPct}%`, background: devColor.bar }}
                                                    />
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
                        onPageChange={page => setCurrentPage(page)}
                    />
                </div>

            </div>
        </div>
    );
}

export const Route = createFileRoute("/web-kpi")({
    component: WebKPIPage,
});