import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRegKpiData, RegKpiRecord } from "@/lib/dataService";
import { REG_KPI_SHEETS } from "@/lib/sheetConfig";
import { Pagination } from "@/components/pagination";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

const ITEMS = 12;

const OWNER_COLORS: Record<string, string> = {
  long: "#3b82f6",
  thinh: "#f59e0b",
  "quoc-an": "#8b5cf6",
  chuong: "#ef4444",
  "bao-han": "#22c55e",
};

const isLive = (status: string) => {
  const s = status.toLowerCase().trim();
  if (!s || s === "—") return true;
  if (s === "xanh" || s.includes("chưa sus")) return true;
  return !(s.includes("đã sus") || s.includes("sus") || s === "die" || s.includes("sus lại"));
};

const isFail = (val: string) => val.toLowerCase().includes("fail");
const isPass = (val: string) => val.toLowerCase().includes("pass");

const parseRegMonth = (dateStr: string): string | null => {
  if (!dateStr || dateStr === "—") return null;
  const dmy = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!dmy) return null;
  return `${dmy[3]}-${dmy[2].padStart(2, "0")}`;
};

const fmtMonthKey = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${m}/${y}`;
};

function RegKpiPage() {
  const { t } = useTranslation();
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["regKpiData"],
    queryFn: () => getRegKpiData(true),
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchOwner = ownerFilter === "all" || r.ownerId === ownerFilter;
      const live = isLive(r.susStatus);
      const matchStatus = statusFilter === "all"
        ? true
        : statusFilter === "live" ? live : !live;
      const matchMonth = monthFilter === "all" || parseRegMonth(r.dateRegGmc) === monthFilter;
      const matchSearch = !q || r.domain.includes(q) || r.note.toLowerCase().includes(q);
      return matchOwner && matchStatus && matchMonth && matchSearch;
    });
  }, [records, ownerFilter, statusFilter, monthFilter, search]);

  const ownerPool = useMemo(
    () => (ownerFilter === "all" ? records : records.filter((r) => r.ownerId === ownerFilter)),
    [records, ownerFilter],
  );

  const monthOptions = useMemo(
    () => [...new Set(records.map((r) => parseRegMonth(r.dateRegGmc)).filter(Boolean) as string[])].sort((a, b) => b.localeCompare(a)),
    [records],
  );

  const monthlyReg = useMemo(() => {
    const map: Record<string, number> = {};
    ownerPool.forEach((r) => {
      const month = parseRegMonth(r.dateRegGmc);
      if (!month) return;
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, label: fmtMonthKey(month), count }));
  }, [ownerPool]);

  const monthlyByOwner = useMemo(() => {
    const months = [...new Set(records.map((r) => parseRegMonth(r.dateRegGmc)).filter(Boolean) as string[])].sort();
    return months.map((month) => {
      const row: Record<string, string | number> = { label: fmtMonthKey(month) };
      REG_KPI_SHEETS.forEach((s) => {
        row[s.name] = records.filter(
          (r) => r.ownerId === s.id && parseRegMonth(r.dateRegGmc) === month,
        ).length;
      });
      row.total = REG_KPI_SHEETS.reduce((sum, s) => sum + (Number(row[s.name]) || 0), 0);
      return row;
    });
  }, [records]);

  const stats = useMemo(() => {
    const pool = ownerPool;
    const total = pool.length;
    const live = pool.filter((r) => isLive(r.susStatus)).length;
    const sus = total - live;
    const khangFail = pool.filter((r) =>
      isFail(r.ketQua1) || isFail(r.ketQua2) || isFail(r.ketQua3)).length;
    const khangPass = pool.filter((r) =>
      isPass(r.ketQua1) || isPass(r.ketQua2) || isPass(r.ketQua3)).length;
    return { total, live, sus, khangFail, khangPass };
  }, [ownerPool]);

  const currentMonthCount = useMemo(() => {
    if (monthFilter !== "all") {
      return monthlyReg.find((m) => m.month === monthFilter)?.count ?? 0;
    }
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return monthlyReg.find((m) => m.month === key)?.count ?? 0;
  }, [monthFilter, monthlyReg]);

  const byOwnerBar = useMemo(() => {
    return REG_KPI_SHEETS.map((s) => ({
      name: s.name,
      total: records.filter((r) => r.ownerId === s.id).length,
      live: records.filter((r) => r.ownerId === s.id && isLive(r.susStatus)).length,
      color: OWNER_COLORS[s.id] ?? "#64748b",
    }));
  }, [records]);

  const pieData = useMemo(() => [
    { name: t("active"), value: stats.live, color: "#10b981" },
    { name: t("suspended"), value: stats.sus, color: "#ef4444" },
  ].filter((d) => d.value > 0), [stats, t]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filtered.slice(start, start + ITEMS);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [ownerFilter, statusFilter, monthFilter, search]);

  if (isLoading) {
    return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">{t("loadingSystemData")}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{t("regKpiTitle")}</h1>
          <p className="text-slate-500 font-medium text-sm">{t("regKpiDesc")}</p>
        </div>

        {/* Tabs theo người */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOwnerFilter("all")}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${ownerFilter === "all"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-500 border border-slate-200"
              }`}
          >
            {t("allOwners")} ({records.length})
          </button>
          {REG_KPI_SHEETS.map((s) => {
            const count = records.filter((r) => r.ownerId === s.id).length;
            const active = ownerFilter === s.id;
            const color = OWNER_COLORS[s.id];
            return (
              <button
                key={s.id}
                onClick={() => setOwnerFilter(s.id)}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "text-white shadow-md" : "bg-white"}`}
                style={active
                  ? { background: color, borderColor: color }
                  : { color, borderColor: color, background: `${color}15` }}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-slate-800 border-t-2">
            <p className="text-[9px] font-black uppercase text-slate-400">{t("totalRegGmc")}</p>
            <h2 className="text-2xl font-black mt-1">{stats.total}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-emerald-500">{t("active")}</p>
            <h2 className="text-2xl font-black text-emerald-600 mt-1">{stats.live}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-red-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-red-500">{t("suspended")}</p>
            <h2 className="text-2xl font-black text-red-600 mt-1">{stats.sus}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-amber-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-amber-500">{t("khangFail")}</p>
            <h2 className="text-2xl font-black text-amber-600 mt-1">{stats.khangFail}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-blue-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-blue-500">{t("khangPass")}</p>
            <h2 className="text-2xl font-black text-blue-600 mt-1">{stats.khangPass}</h2>
          </div>
        </div>

        {/* REG theo tháng */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{t("monthlyRegTitle")}</h3>
              <p className="text-sm text-slate-500 mt-1">{t("monthlyRegDesc")}</p>
            </div>
            {monthFilter !== "all" ? (
              <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                <p className="text-[9px] font-black uppercase text-indigo-400">{fmtMonthKey(monthFilter)}</p>
                <p className="text-2xl font-black text-indigo-600">{currentMonthCount} <span className="text-sm font-bold">{t("webs")}</span></p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                <p className="text-[9px] font-black uppercase text-slate-400">{t("thisMonth")}</p>
                <p className="text-2xl font-black text-slate-800">{currentMonthCount} <span className="text-sm font-bold">{t("webs")}</span></p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {monthlyReg.map((m) => (
              <button
                key={m.month}
                type="button"
                onClick={() => setMonthFilter(monthFilter === m.month ? "all" : m.month)}
                className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${monthFilter === m.month
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-slate-50 border-slate-100 hover:border-indigo-200"
                  }`}
              >
                <p className={`text-[9px] font-black uppercase ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`}>
                  {m.label}
                </p>
                <p className={`text-xl font-black mt-1 ${monthFilter === m.month ? "text-white" : "text-slate-800"}`}>
                  {m.count}
                </p>
                <p className={`text-[9px] font-bold uppercase mt-0.5 ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`}>
                  {t("webs")}
                </p>
              </button>
            ))}
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReg}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip formatter={(v: number) => [v, t("websRegged")]} />
                <Bar dataKey="count" name={t("websRegged")} fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {ownerFilter === "all" && monthlyByOwner.length > 0 && (
            <div className="h-56 pt-2 border-t border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">{t("monthlyRegByOwner")}</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyByOwner}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} hide />
                  <Tooltip />
                  {REG_KPI_SHEETS.map((s) => (
                    <Bar key={s.id} dataKey={s.name} stackId="a" fill={OWNER_COLORS[s.id]} barSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6">{t("systemRatioOverview")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6">{t("regByOwner")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byOwnerBar}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="total" name={t("totalRegGmc")} radius={[4, 4, 0, 0]} barSize={22}>
                    {byOwnerBar.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                  <Bar dataKey="live" name={t("active")} fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
          <input
            type="text"
            placeholder={t("searchDomainPlaceholder")}
            className="flex-1 min-w-[200px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">📅 {t("allMonths")}</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{t("monthLabel")} {fmtMonthKey(m)}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("status")}</option>
            <option value="live">🟢 {t("active")}</option>
            <option value="sus">🔴 {t("suspended")}</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 w-[8%]">{t("owner")}</th>
                  <th className="p-4 w-[14%]">{t("webAndPlatform")}</th>
                  <th className="p-4 w-[8%]">{t("gmcReturnDate")}</th>
                  <th className="p-4 w-[8%]">{t("status")}</th>
                  <th className="p-4 w-[8%]">{t("khangRound", { n: 1 })}</th>
                  <th className="p-4 w-[7%]">{t("result")}</th>
                  <th className="p-4 w-[8%]">{t("khangRound", { n: 2 })}</th>
                  <th className="p-4 w-[7%]">{t("result")}</th>
                  <th className="p-4 w-[8%]">{t("khangRound", { n: 3 })}</th>
                  <th className="p-4 w-[7%]">{t("result")}</th>
                  <th className="p-4 w-[11%]">{t("note")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((r: RegKpiRecord, i) => {
                  const live = isLive(r.susStatus);
                  const color = OWNER_COLORS[r.ownerId] ?? "#64748b";
                  return (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="p-4">
                        <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase text-white" style={{ background: color }}>
                          {r.ownerName}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm lowercase truncate">{r.domain}</div>
                        {r.webType && <div className="text-[10px] text-slate-400 uppercase font-bold">{r.webType}</div>}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-600">{r.dateRegGmc || "—"}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${live ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                          {r.susStatus}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">{r.khang1Date || "—"}</td>
                      <td className="p-4 text-xs font-bold">{r.ketQua1 || "—"}</td>
                      <td className="p-4 text-xs text-slate-500">{r.khang2Date || "—"}</td>
                      <td className="p-4 text-xs font-bold">{r.ketQua2 || "—"}</td>
                      <td className="p-4 text-xs text-slate-500">{r.khang3Date || "—"}</td>
                      <td className="p-4 text-xs font-bold">{r.ketQua3 || "—"}</td>
                      <td className="p-4 text-[10px] text-slate-500 truncate" title={r.note}>{r.note || "—"}</td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center p-14 text-slate-400">{t("noAccountData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} itemsPerPage={ITEMS} onPageChange={setPage} />
        </div>

      </div>
    </div>
  );
}

export const Route = createFileRoute("/reg-kpi")({
  component: RegKpiPage,
});
