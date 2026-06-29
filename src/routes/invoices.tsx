import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getChiPhiExpenses, ExpenseRecord } from "@/lib/dataService";
import { Pagination } from "@/components/pagination";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

const ITEMS = 12;

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  "Mua domain": { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd", bar: "#3b82f6" },
  "Chi phí ADS": { bg: "#fdf4ff", text: "#6b21a8", border: "#d8b4fe", bar: "#a855f7" },
  "Đăng kí GMC": { bg: "#f0fdf4", text: "#166534", border: "#86efac", bar: "#22c55e" },
  "Đăng ký GMC": { bg: "#f0fdf4", text: "#166534", border: "#86efac", bar: "#22c55e" },
  "Mua mail": { bg: "#fff7ed", text: "#9a3412", border: "#fdba74", bar: "#f97316" },
  "Mua Proxy": { bg: "#f5f3ff", text: "#5b21b6", border: "#c4b5fd", bar: "#8b5cf6" },
  "Chi phí khác": { bg: "#f8fafc", text: "#334155", border: "#cbd5e1", bar: "#64748b" },
  Trendsi: { bg: "#ecfeff", text: "#0e7490", border: "#67e8f9", bar: "#06b6d4" },
};

const defaultColor = { bg: "#f8fafc", text: "#334155", border: "#cbd5e1", bar: "#64748b" };
const getTypeColor = (loai: string) => TYPE_COLORS[loai] ?? defaultColor;

const fmtUSD = (n: number) =>
  n % 1 === 0
    ? `$${n.toLocaleString()}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${parseInt(m)}/${y}`;
};

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const fmtVND = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

interface ExpenseTotals {
  usd: number;
  vnd: number;
}

const expenseAmountUSD = (e: ExpenseRecord) =>
  (e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0);

const expenseAmountVND = (e: ExpenseRecord) => e.chiPhiVND || 0;

const sumExpenseTotals = (list: ExpenseRecord[]): ExpenseTotals => ({
  usd: list.reduce((s, e) => s + expenseAmountUSD(e), 0),
  vnd: list.reduce((s, e) => s + expenseAmountVND(e), 0),
});

const statsForExpenses = (list: ExpenseRecord[]) => {
  const map: Record<string, { count: number; usd: number; vnd: number }> = {};
  for (const e of list) {
    if (!map[e.loaiChiPhi]) map[e.loaiChiPhi] = { count: 0, usd: 0, vnd: 0 };
    map[e.loaiChiPhi].count += 1;
    map[e.loaiChiPhi].usd += expenseAmountUSD(e);
    map[e.loaiChiPhi].vnd += expenseAmountVND(e);
  }
  return map;
};

function MoneyTotals({
  totals,
  usdClass = "text-2xl font-black",
  vndClass = "text-sm font-black text-amber-600 mt-1",
  light = false,
}: {
  totals: ExpenseTotals;
  usdClass?: string;
  vndClass?: string;
  light?: boolean;
}) {
  const usdColor = light ? "text-white" : "text-slate-900";
  const vndColor = light ? "text-amber-200" : "text-amber-600";
  return (
    <div>
      {totals.usd > 0 && <p className={`${usdClass} ${usdColor}`}>{fmtUSD(totals.usd)}</p>}
      {totals.vnd > 0 && <p className={`${vndClass} ${vndColor}`}>{fmtVND(totals.vnd)}</p>}
      {totals.usd === 0 && totals.vnd === 0 && <p className={`${usdClass} text-slate-400`}>—</p>}
    </div>
  );
}

function AmountCell({ e }: { e: ExpenseRecord }) {
  if (e.chiPhiUSDT > 0) {
    return (
      <span className="text-[11px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
        {e.chiPhiUSDT} USDT
      </span>
    );
  }
  if (e.chiPhiVND > 0) {
    return (
      <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
        {e.chiPhiVND.toLocaleString("vi-VN")} VND
      </span>
    );
  }
  if (e.chiPhiRaw && /vnd|₫|đ/i.test(e.chiPhiRaw) && !e.chiPhiUSD) {
    return <span className="text-[11px] font-black text-amber-600">{e.chiPhiRaw}</span>;
  }
  return <span className="text-sm font-black text-slate-900">{fmtUSD(e.chiPhiUSD || 0)}</span>;
}

function ChiPhiPage() {
  const { t } = useTranslation();
  const [loaiFilter, setLoaiFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [regFilter, setRegFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["chiPhiExpenses"],
    queryFn: () => getChiPhiExpenses(true),
    refetchInterval: 30000,
  });

  const loaiOptions = useMemo(
    () => [...new Set(expenses.map((e) => e.loaiChiPhi).filter(Boolean))].sort(),
    [expenses],
  );

  const monthOptions = useMemo(
    () => [...new Set(expenses.map((e) => e.month).filter(Boolean) as string[])].sort((a, b) => b.localeCompare(a)),
    [expenses],
  );

  const regOptions = useMemo(
    () => [...new Set(expenses.map((e) => e.tenReg).filter(Boolean))].sort(),
    [expenses],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchLoai = loaiFilter === "all" || e.loaiChiPhi === loaiFilter;
      const matchMonth = monthFilter === "all" || e.month === monthFilter;
      const matchReg = regFilter === "all" || e.tenReg === regFilter;
      const matchSearch = !q
        || e.tenWeb.toLowerCase().includes(q)
        || e.tenReg.toLowerCase().includes(q)
        || e.tenTheAds.toLowerCase().includes(q)
        || e.loaiChiPhi.toLowerCase().includes(q);
      return matchLoai && matchMonth && matchReg && matchSearch;
    });
  }, [expenses, loaiFilter, monthFilter, regFilter, search]);

  const statsByType = useMemo(() => statsForExpenses(expenses), [expenses]);

  const monthlyStats = useMemo(() => {
    const map: Record<string, { totalUsd: number; totalVnd: number; count: number }> = {};
    expenses.forEach((e) => {
      if (!e.month) return;
      if (!map[e.month]) map[e.month] = { totalUsd: 0, totalVnd: 0, count: 0 };
      map[e.month].totalUsd += expenseAmountUSD(e);
      map[e.month].totalVnd += expenseAmountVND(e);
      map[e.month].count += 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({ month, label: fmtMonth(month), ...data }));
  }, [expenses]);

  const thisMonthKey = useMemo(() => currentMonthKey(), []);

  const currentMonthExpenses = useMemo(
    () => expenses.filter((e) => e.month === thisMonthKey),
    [expenses, thisMonthKey],
  );

  const currentMonthStats = useMemo(() => statsForExpenses(currentMonthExpenses), [currentMonthExpenses]);

  const prevMonthKey = useMemo(() => {
    const [y, m] = thisMonthKey.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [thisMonthKey]);

  const currentMonthTotals = useMemo(
    () => sumExpenseTotals(currentMonthExpenses),
    [currentMonthExpenses],
  );

  const prevMonthTotals = useMemo(
    () => sumExpenseTotals(expenses.filter((e) => e.month === prevMonthKey)),
    [expenses, prevMonthKey],
  );

  const filteredStatsByType = useMemo(() => statsForExpenses(filtered), [filtered]);

  const pieData = useMemo(() => {
    const source = monthFilter === "all" ? statsByType : filteredStatsByType;
    return Object.entries(source)
      .map(([name, { usd }]) => ({ name, value: usd, color: getTypeColor(name).bar }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [statsByType, filteredStatsByType, monthFilter]);

  const pieDataVnd = useMemo(() => {
    const source = monthFilter === "all" ? statsByType : filteredStatsByType;
    return Object.entries(source)
      .map(([name, { vnd }]) => ({ name, value: vnd, color: getTypeColor(name).bar }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [statsByType, filteredStatsByType, monthFilter]);

  const monthlyBar = useMemo(
    () => monthlyStats
      .slice()
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(({ label, totalUsd, totalVnd }) => ({ month: label, totalUsd, totalVnd })),
    [monthlyStats],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filtered.slice(start, start + ITEMS);
  }, [filtered, page]);

  const grandTotals = useMemo(() => sumExpenseTotals(expenses), [expenses]);

  const filteredTotals = useMemo(() => sumExpenseTotals(filtered), [filtered]);

  const displayTotals = monthFilter === "all" ? grandTotals : filteredTotals;

  useEffect(() => { setPage(1); }, [loaiFilter, search, monthFilter, regFilter]);

  if (isLoading) {
    return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">{t("loadingSystemData")}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("chiPhiTitle")}</h1>
          <p className="text-slate-500 font-medium text-sm">{t("chiPhiDesc")}</p>
        </div>

        {/* Tabs theo Tên chi phí trên sheet */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLoaiFilter("all")}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${loaiFilter === "all"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
          >
            {t("allExpenseTypes")} ({expenses.length})
          </button>
          {loaiOptions.map((loai) => {
            const c = getTypeColor(loai);
            const active = loaiFilter === loai;
            return (
              <button
                key={loai}
                onClick={() => setLoaiFilter(loai)}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${active ? "shadow-md text-white" : "bg-white"}`}
                style={active
                  ? { background: c.bar, borderColor: c.bar }
                  : { color: c.text, borderColor: c.border, background: c.bg }}
              >
                {loai} ({statsByType[loai]?.count ?? 0})
              </button>
            );
          })}
        </div>

        {/* Dash tháng hiện tại */}
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase text-indigo-200 tracking-widest">{t("currentMonthDash")}</p>
              <h2 className="text-xl font-black text-white mt-1">
                {t("monthLabel")} {fmtMonth(thisMonthKey)}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setMonthFilter(monthFilter === thisMonthKey ? "all" : thisMonthKey)}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-white/15 text-white hover:bg-white/25 transition-all"
            >
              {monthFilter === thisMonthKey ? t("clearMonthFilter") : t("filterThisMonth")}
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <p className="text-[9px] font-black uppercase text-indigo-400">{t("thisMonthSpend")}</p>
              <MoneyTotals totals={currentMonthTotals} usdClass="text-2xl font-black text-indigo-700" vndClass="text-sm font-black mt-1" />
              <p className="text-[9px] font-bold text-indigo-300 mt-2">{currentMonthExpenses.length} {t("records")}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400">{t("prevMonthSpend")}</p>
              <MoneyTotals totals={prevMonthTotals} usdClass="text-2xl font-black text-slate-700" vndClass="text-sm font-black mt-1" />
              <p className="text-[9px] font-bold text-slate-300 mt-2">{fmtMonth(prevMonthKey)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[9px] font-black uppercase text-emerald-500">{t("allTimeTotal")}</p>
              <MoneyTotals totals={grandTotals} usdClass="text-2xl font-black text-emerald-700" vndClass="text-sm font-black mt-1" />
              <p className="text-[9px] font-bold text-emerald-300 mt-2">{expenses.length} {t("records")}</p>
            </div>
            {Object.entries(currentMonthStats)
              .sort((a, b) => (b[1].usd + b[1].vnd) - (a[1].usd + a[1].vnd))
              .slice(0, 3)
              .map(([name, { usd, vnd, count }]) => {
                const c = getTypeColor(name);
                return (
                  <div key={name} className="bg-white p-4 rounded-2xl border border-slate-100 border-t-2" style={{ borderTopColor: c.bar }}>
                    <p className="text-[9px] font-black uppercase text-slate-400 truncate">{name}</p>
                    <MoneyTotals totals={{ usd, vnd }} usdClass="text-xl font-black" vndClass="text-xs font-black mt-1" />
                    <p className="text-[9px] font-bold text-slate-300 mt-2">{count} {t("records")}</p>
                  </div>
                );
              })}
            {currentMonthExpenses.length === 0 && (
              <div className="col-span-full text-center py-4 text-sm font-medium text-slate-400">
                {t("noSpendThisMonth")}
              </div>
            )}
          </div>
        </div>

        {/* Thẻ theo tháng */}
        {monthlyStats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {monthlyStats.map((m) => (
              <button
                key={m.month}
                type="button"
                onClick={() => setMonthFilter(monthFilter === m.month ? "all" : m.month)}
                className={`px-4 py-3 rounded-xl border text-left transition-all hover:shadow-md min-w-[100px] ${monthFilter === m.month
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-white border-slate-200 hover:border-indigo-200"
                  }`}
              >
                <p className={`text-[9px] font-black uppercase ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`}>
                  {m.label}
                </p>
                <p className={`text-lg font-black mt-0.5 ${monthFilter === m.month ? "text-white" : "text-slate-800"}`}>
                  {m.totalUsd > 0 ? fmtUSD(m.totalUsd) : null}
                </p>
                {m.totalVnd > 0 && (
                  <p className={`text-xs font-black ${monthFilter === m.month ? "text-amber-200" : "text-amber-600"}`}>
                    {fmtVND(m.totalVnd)}
                  </p>
                )}
                <p className={`text-[9px] font-bold ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`}>
                  {m.count} {t("records")}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Tổng quan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">
              {monthFilter === "all" ? t("totalSpendUsd") : `${t("totalSpendUsd")} — ${fmtMonth(monthFilter)}`}
            </p>
            <h2 className="text-2xl font-black text-emerald-600 mt-1">{fmtUSD(displayTotals.usd)}</h2>
            <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">
              {monthFilter === "all" ? expenses.length : filtered.length} {t("records")}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-amber-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.15em]">
              {monthFilter === "all" ? t("totalSpendVnd") : `${t("totalSpendVnd")} — ${fmtMonth(monthFilter)}`}
            </p>
            <h2 className="text-2xl font-black text-amber-600 mt-1">{fmtVND(displayTotals.vnd)}</h2>
            <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">{t("vndOnlyNote")}</p>
          </div>
          {pieData.slice(0, 3).map((d) => {
            const st = monthFilter === "all" ? statsByType[d.name] : filteredStatsByType[d.name];
            return (
            <div key={d.name} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-2" style={{ borderTopColor: d.color }}>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em] truncate">{d.name}</p>
              <MoneyTotals
                totals={{ usd: st?.usd ?? 0, vnd: st?.vnd ?? 0 }}
                usdClass="text-xl font-black"
                vndClass="text-xs font-black mt-1"
              />
              <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">
                {st?.count ?? 0} {t("records")}
              </p>
            </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("spendByCategory")} (USD)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmtUSD(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {pieDataVnd.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black uppercase text-amber-500 mb-6 tracking-widest">{t("spendByCategoryVnd")}</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataVnd} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieDataVnd.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [fmtVND(v), ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm ${pieDataVnd.length > 0 ? "" : "lg:col-span-2"}`}>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("monthlySpendUsd")}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBar}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [fmtUSD(v), t("totalSpendUsd")]} />
                  <Bar dataKey="totalUsd" radius={[4, 4, 0, 0]} barSize={28} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {monthlyBar.some((m) => m.totalVnd > 0) && (
            <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-amber-200 shadow-sm">
              <h3 className="text-xs font-black uppercase text-amber-500 mb-6 tracking-widest">{t("monthlySpendVnd")}</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBar.filter((m) => m.totalVnd > 0)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => [fmtVND(v), t("totalSpendVnd")]} />
                    <Bar dataKey="totalVnd" radius={[4, 4, 0, 0]} barSize={28} fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm items-center">
          <input
            type="text"
            placeholder={t("searchExpensePlaceholder")}
            className="flex-1 min-w-[200px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">📅 {t("allMonths")}</option>
            {monthOptions.map((m) => <option key={m} value={m}>{fmtMonth(m)}</option>)}
          </select>
          <select
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={regFilter}
            onChange={(e) => setRegFilter(e.target.value)}
          >
            <option value="all">👤 {t("allRegistrants")}</option>
            {regOptions.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
          <div className="text-[10px] font-bold text-slate-400 uppercase px-2 flex flex-col items-end">
            <span>{filtered.length} {t("records")}</span>
            <span className="text-emerald-600">{fmtUSD(filteredTotals.usd)}</span>
            {filteredTotals.vnd > 0 && <span className="text-amber-600">{fmtVND(filteredTotals.vnd)}</span>}
          </div>
        </div>

        {/* Bảng — đúng cột sheet I→O */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 w-[11%]">{t("thRegistrant")}</th>
                  <th className="p-4 w-[12%]">{t("thType")}</th>
                  <th className="p-4 w-[10%]">{t("thDate")}</th>
                  <th className="p-4 w-[22%]">{t("thWebsite")}</th>
                  <th className="p-4 w-[17%]">{t("thAdsCard")}</th>
                  <th className="p-4 w-[10%] text-right">{t("thAmount")}</th>
                  <th className="p-4 w-[14%]">{t("thBill")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((e, i) => {
                  const c = getTypeColor(e.loaiChiPhi);
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-all">
                      <td className="p-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg uppercase">
                          {e.tenReg}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
                          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                        >
                          {e.loaiChiPhi}
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-slate-500 font-bold whitespace-nowrap">
                        {e.ngayThanhToan || "—"}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700 lowercase truncate">{e.tenWeb || "—"}</td>
                      <td className="p-4 text-[11px] font-bold text-slate-600 truncate">{e.tenTheAds || "—"}</td>
                      <td className="p-4 text-right"><AmountCell e={e} /></td>
                      <td className="p-4">
                        {e.billChiPhi ? (
                          <div className="flex flex-col gap-1">
                            {e.billChiPhi.split(/[,|]/).map((link) => link.trim()).filter(Boolean).map((cleanLink, idx, arr) => (
                              <a
                                key={idx}
                                href={cleanLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-black text-blue-500 hover:text-blue-700 underline truncate"
                              >
                                {arr.length > 1 ? `${t("viewBill")} #${idx + 1}` : t("viewBill")}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-14 text-sm font-medium text-slate-400">
                      {t("noExpenseRecordsFound")}
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white">
                    <td colSpan={5} className="p-4 text-[10px] font-black uppercase tracking-widest">
                      {t("tableTotal")} ({filtered.length})
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {filteredTotals.usd > 0 && (
                          <span className="text-sm font-black text-emerald-300">{fmtUSD(filteredTotals.usd)}</span>
                        )}
                        {filteredTotals.vnd > 0 && (
                          <span className="text-xs font-black text-amber-300">{fmtVND(filteredTotals.vnd)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} itemsPerPage={ITEMS} onPageChange={setPage} />
        </div>

      </div>
    </div>
  );
}

export const Route = createFileRoute("/invoices")({
  component: ChiPhiPage,
});
