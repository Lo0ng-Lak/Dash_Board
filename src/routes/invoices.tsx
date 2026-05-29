import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { getDomainSheetData, DomainRecord, ExpenseRecord } from "@/lib/dataService";
import { Pagination } from "@/components/pagination";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  "Mua domain": { bg: "#EFF6FF", text: "#1e40af", border: "#93c5fd", bar: "#3b82f6" },
  "Chi phí ADS": { bg: "#fdf4ff", text: "#6b21a8", border: "#d8b4fe", bar: "#a855f7" },
  "Đăng ký GMC": { bg: "#f0fdf4", text: "#166534", border: "#86efac", bar: "#22c55e" },
  "Mua mail": { bg: "#fff7ed", text: "#9a3412", border: "#fdba74", bar: "#f97316" },
  "default": { bg: "#f8fafc", text: "#334155", border: "#cbd5e1", bar: "#64748b" },
};

const getExpColor = (loai: string) => EXPENSE_COLORS[loai] ?? EXPENSE_COLORS["default"];

const ITEMS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDaysLeftColor = (d: number | null) => {
  if (d === null) return "text-slate-400";
  if (d <= 30) return "text-red-600";
  if (d <= 90) return "text-amber-600";
  return "text-emerald-600";
};

const getDaysLeftBg = (d: number | null) => {
  if (d === null) return "";
  if (d <= 30) return "bg-red-50 border-l-4 border-l-red-400";
  if (d <= 90) return "bg-amber-50/60 border-l-4 border-l-amber-400";
  return "";
};

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `Month ${parseInt(m)}/${y}`;
};

// const fmtUSD = (n: number) =>
//   n % 1 === 0
//     ? `$${n.toLocaleString()}`
//     : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtUSD = (n: number) =>
  n % 1 === 0
    ? `$${n.toLocaleString()}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


const isVNDString = (raw: string) => {
  const normalized = raw.trim().toLowerCase();
  return /k$/i.test(normalized) || /₫|vnd|đ/.test(normalized);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${active
        ? "bg-slate-900 text-white shadow-md"
        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
        }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label, value, sub, colorClass = "text-slate-900", accentClass = "",
}: {
  label: string; value: string | number; sub?: string;
  colorClass?: string; accentClass?: string;
}) {
  return (
    <div className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all ${accentClass}`}>
      <div>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">{label}</p>
        <h2 className={`text-2xl font-black mt-1 truncate ${colorClass}`}>{value}</h2>
      </div>
      {sub && <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function DomainManagerPage() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"domains" | "expenses">("domains");

  // Domain tab filters
  const [domSearch, setDomSearch] = useState("");
  const [domReg, setDomReg] = useState("all");
  const [domStatus, setDomStatus] = useState("all");
  const [domExpiry, setDomExpiry] = useState("all"); // all | critical | warning | ok
  const [domPage, setDomPage] = useState(1);

  // Expense tab filters
  const [expSearch, setExpSearch] = useState("");
  const [expMonth, setExpMonth] = useState("all");
  const [expLoai, setExpLoai] = useState("all");
  const [expReg, setExpReg] = useState("all");
  const [expPage, setExpPage] = useState(1);

  const load = async (force = false) => {
    try {
      force && setRefreshing(true);
      const data = await getDomainSheetData(force);
      setDomains(data.domains);
      setExpenses(data.expenses);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Chạy lần đầu tiên khi vào trang
    load();

    // Thiết lập vòng lặp tự động gọi sau mỗi 30 giây (30000 ms)
    const interval = setInterval(() => {
      load(true); // Truyền true để kích hoạt trạng thái refreshing ngầm
    }, 30000);

    // HỦY BỎ bộ đếm khi người dùng rời khỏi trang để tránh rò rỉ bộ nhớ (Memory Leak)
    return () => clearInterval(interval);
  }, []);

  // ── Domain: dropdown options ──────────────────────────────────────────────
  const domRegOptions = useMemo(() => [...new Set(domains.map(d => d.tenReg).filter(Boolean))].sort(), [domains]);
  const domStatusOptions = useMemo(() => [...new Set(domains.map(d => d.trangThai).filter(Boolean))].sort(), [domains]);

  // ── Domain: zone A (dropdowns only → stats + chart) ──────────────────────
  const domZoneA = useMemo(() => {
    return domains.filter(d => {
      const matchReg = domReg === "all" || d.tenReg === domReg;
      const matchStatus = domStatus === "all" || d.trangThai === domStatus;
      const matchExpiry = domExpiry === "all"
        ? true
        : domExpiry === "critical" ? (d.daysLeft !== null && d.daysLeft <= 30)
          : domExpiry === "warning" ? (d.daysLeft !== null && d.daysLeft > 30 && d.daysLeft <= 90)
            : (d.daysLeft === null || d.daysLeft > 90);
      return matchReg && matchStatus && matchExpiry;
    });
  }, [domains, domReg, domStatus, domExpiry]);

  const domStats = useMemo(() => ({
    total: domZoneA.length,
    active: domZoneA.filter(d => d.trangThai?.toLowerCase() === "active").length,
    critical: domZoneA.filter(d => d.daysLeft !== null && d.daysLeft <= 30).length,
    warning: domZoneA.filter(d => d.daysLeft !== null && d.daysLeft > 30 && d.daysLeft <= 90).length,
    totalCost: domZoneA.reduce((s, d) => s + d.gia, 0),
  }), [domZoneA]);

  const domExpiryChart = useMemo(() => [
    { name: "≤ 30 days", value: domStats.critical, color: "#ef4444" },
    { name: "31–90 days", value: domStats.warning, color: "#f59e0b" },
    { name: "> 90 days", value: domZoneA.filter(d => d.daysLeft !== null && d.daysLeft > 90).length, color: "#10b981" },
  ].filter(x => x.value > 0), [domStats, domZoneA]);

  const regBarData = useMemo(() => {
    const map: Record<string, number> = {};
    domZoneA.forEach(d => { if (d.tenReg) map[d.tenReg] = (map[d.tenReg] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [domZoneA]);

  // ── Domain: zone B (+ search → table) ────────────────────────────────────
  const domZoneB = useMemo(() => {
    if (!domSearch.trim()) return domZoneA;
    const q = domSearch.toLowerCase();
    return domZoneA.filter(d =>
      d.domain.toLowerCase().includes(q) || d.tenReg.toLowerCase().includes(q)
    );
  }, [domZoneA, domSearch]);

  const domSorted = useMemo(() =>
    [...domZoneB].sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)),
    [domZoneB]);

  const domPaginated = useMemo(() => {
    const s = (domPage - 1) * ITEMS;
    return domSorted.slice(s, s + ITEMS);
  }, [domSorted, domPage]);

  // ── Expense: dropdown options ─────────────────────────────────────────────
  const expMonthOptions = useMemo(() =>
    [...new Set(expenses.map(e => e.month).filter(Boolean) as string[])].sort((a, b) => b.localeCompare(a)),
    [expenses]);
  const expLoaiOptions = useMemo(() => [...new Set(expenses.map(e => e.loaiChiPhi).filter(Boolean))].sort(), [expenses]);
  const expRegOptions = useMemo(() => [...new Set(expenses.map(e => e.tenReg).filter(Boolean))].sort(), [expenses]);

  // ── Expense: zone A ───────────────────────────────────────────────────────
  const expZoneA = useMemo(() => {
    return expenses.filter(e => {
      const matchMonth = expMonth === "all" || e.month === expMonth;
      const matchLoai = expLoai === "all" || e.loaiChiPhi === expLoai;
      const matchReg = expReg === "all" || e.tenReg === expReg;
      return matchMonth && matchLoai && matchReg;
    });
  }, [expenses, expMonth, expLoai, expReg]);

  const expStats = useMemo(() => {
    const totalUSD = expZoneA.reduce((s, e) => s + e.chiPhiUSD, 0);
    const totalVND = expZoneA.reduce((s, e) => s + e.chiPhiVND, 0);
    const total = totalUSD; // keep for compat
    const byType: Record<string, number> = {};
    expZoneA.forEach(e => { byType[e.loaiChiPhi] = (byType[e.loaiChiPhi] || 0) + e.chiPhiUSD; });
    return { total, totalUSD, totalVND, byType, count: expZoneA.length };
  }, [expZoneA]);

  const expPieData = useMemo(() =>
    Object.entries(expStats.byType).map(([name, value]) => ({
      name, value, color: getExpColor(name).bar,
    })).sort((a, b) => b.value - a.value),
    [expStats]);

  const expMonthlyBar = useMemo(() => {
    const map: Record<string, number> = {};
    expZoneA.forEach(e => {
      if (e.month) map[e.month] = (map[e.month] || 0) + e.chiPhiUSD;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({ month: fmtMonth(month), total }));
  }, [expZoneA]);

  // Top spender card
  const topSpender = useMemo(() => {
    const map: Record<string, number> = {};
    expZoneA.forEach(e => { if (e.tenReg) map[e.tenReg] = (map[e.tenReg] || 0) + e.chiPhiUSD; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], total: sorted[0][1] } : null;
  }, [expZoneA]);

  // ── Expense: zone B (+ search → table) ───────────────────────────────────
  const expZoneB = useMemo(() => {
    if (!expSearch.trim()) return expZoneA;
    const q = expSearch.toLowerCase();
    return expZoneA.filter(e =>
      e.tenWeb.toLowerCase().includes(q) ||
      e.tenReg.toLowerCase().includes(q) ||
      e.tenTheAds.toLowerCase().includes(q)
    );
  }, [expZoneA, expSearch]);

  const expPaginated = useMemo(() => {
    const s = (expPage - 1) * ITEMS;
    return expZoneB.slice(s, s + ITEMS);
  }, [expZoneB, expPage]);

  if (loading) {
    return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">Loading data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Domain Manager</h1>
            <p className="text-slate-500 font-medium text-sm">Track domain expiry &amp; all expense records.</p>
          </div>
          <div className="flex items-center gap-3">
            <TabBtn active={activeTab === "domains"} onClick={() => setActiveTab("domains")}>🌐 Domains</TabBtn>
            <TabBtn active={activeTab === "expenses"} onClick={() => setActiveTab("expenses")}>💰 Expenses</TabBtn>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
                    TAB 1 — DOMAINS
                ════════════════════════════════════════════════════════════ */}
        {activeTab === "domains" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Domains" value={domStats.total} sub="In current filter" />
              <StatCard label="Active" value={domStats.active}
                colorClass="text-emerald-600" accentClass="border-t-emerald-500 border-t-2"
                sub={`${domStats.total > 0 ? ((domStats.active / domStats.total) * 100).toFixed(1) : 0}% of total`} />
              <StatCard label="⚠ Expiring ≤ 30d" value={domStats.critical}
                colorClass="text-red-600" accentClass="border-t-red-500 border-t-2"
                sub="Renew immediately" />
              <StatCard label="Expiring 31–90d" value={domStats.warning}
                colorClass="text-amber-600" accentClass="border-t-amber-500 border-t-2"
                sub="Plan renewal soon" />
              <StatCard label="Total Domain Cost" value={fmtUSD(domStats.totalCost)}
                colorClass="text-indigo-600" accentClass="border-t-indigo-500 border-t-2"
                sub="Filtered total" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Expiry Distribution</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={domExpiryChart} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {domExpiryChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  {domExpiryChart.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-[10px] font-bold" style={{ color: d.color }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Domains by Registrant</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                        formatter={(v: number) => [v, "Domains"]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
              <input type="text" placeholder="Search domain..."
                className="flex-1 min-w-[180px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
                value={domSearch} onChange={e => { setDomSearch(e.target.value); setDomPage(1); }} />
              <select className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100"
                value={domReg} onChange={e => { setDomReg(e.target.value); setDomPage(1); }}>
                <option value="all">👤 ALL REGISTRANTS</option>
                {domRegOptions.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </select>
              <select className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100"
                value={domStatus} onChange={e => { setDomStatus(e.target.value); setDomPage(1); }}>
                <option value="all">🔘 ALL STATUS</option>
                {domStatusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
              <select className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100"
                value={domExpiry} onChange={e => { setDomExpiry(e.target.value); setDomPage(1); }}>
                <option value="all">📅 ALL EXPIRY</option>
                <option value="critical">🔴 ≤ 30 DAYS</option>
                <option value="warning">🟡 31–90 DAYS</option>
                <option value="ok">🟢 &gt; 90 DAYS</option>
              </select>
              {(domSearch || domReg !== "all" || domStatus !== "all" || domExpiry !== "all") && (
                <button onClick={() => { setDomSearch(""); setDomReg("all"); setDomStatus("all"); setDomExpiry("all"); setDomPage(1); }}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Domain Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-4 w-[5%]">#</th>
                    <th className="p-4 w-[12%]">Registrant</th>
                    <th className="p-4 w-[25%]">Domain</th>
                    <th className="p-4 w-[12%]">Purchase Date</th>
                    <th className="p-4 w-[13%]">Expiry Date</th>
                    <th className="p-4 w-[9%] text-center">Days Left</th>
                    <th className="p-4 w-[9%] text-right">Price</th>
                    <th className="p-4 w-[10%]">Tool Status</th>
                    <th className="p-4 w-[5%] text-center">⚠</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {domPaginated.map((d, i) => {
                    const isExpiring = d.daysLeft !== null && d.daysLeft <= 30;
                    const isWarning = d.daysLeft !== null && d.daysLeft > 30 && d.daysLeft <= 90;
                    return (
                      <tr key={i} className={`transition-all hover:bg-slate-50/60 ${getDaysLeftBg(d.daysLeft)}`}>
                        <td className="p-4 text-[11px] text-slate-400 font-bold">{d.stt}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                            {d.tenReg || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <a href={`https://${d.domain}`} target="_blank" rel="noreferrer"
                            className="font-bold text-slate-800 text-sm lowercase hover:text-indigo-600 transition-colors truncate block">
                            {d.domain}
                          </a>
                        </td>
                        <td className="p-4 text-[11px] text-slate-500 font-bold">{d.ngayMua || "—"}</td>
                        <td className="p-4">
                          <span className={`text-[11px] font-bold ${getDaysLeftColor(d.daysLeft)}`}>
                            {d.expiryRaw || "—"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-sm font-black ${getDaysLeftColor(d.daysLeft)}`}>
                            {d.daysLeft !== null ? d.daysLeft : "—"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-black text-slate-700">
                            {d.gia > 0 ? fmtUSD(d.gia) : "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${d.trangThai?.toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                            }`}>
                            <span className={`w-1 h-1 rounded-full ${d.trangThai?.toLowerCase() === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                            {d.trangThai || "—"}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {isExpiring ? (
                            <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase animate-pulse">URGENT</span>
                          ) : isWarning ? (
                            <span className="text-[9px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full uppercase">SOON</span>
                          ) : (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {domPaginated.length === 0 && (
                    <tr><td colSpan={8} className="text-center p-14 text-sm font-medium text-slate-400">No domains found.</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination currentPage={domPage} totalItems={domSorted.length} itemsPerPage={ITEMS} onPageChange={setDomPage} />
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
                    TAB 2 — EXPENSES
                ════════════════════════════════════════════════════════════ */}
        {activeTab === "expenses" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">

              {/* Total records */}
              <StatCard label="Total Records" value={expStats.count} sub="In current filter" />

              {/* Combined spend card — USD + VND together */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-emerald-500 border-t-2 sm:col-span-2 md:col-span-1">
                <p className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.15em]">Total Spend</p>
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600">{fmtUSD(expStats.totalUSD)}</span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase">USD</span>
                  </div>
                  {expStats.totalVND > 0 && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-amber-500">
                        {expStats.totalVND.toLocaleString("vi-VN")}₫
                      </span>
                      <span className="text-[9px] font-black text-amber-400 uppercase">VND</span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">All expense types</p>
              </div>

              {/* ADS spend */}
              <StatCard label="ADS Spend"
                value={fmtUSD(expStats.byType["Chi phí ADS"] ?? 0)}
                colorClass="text-purple-600" accentClass="border-t-purple-500 border-t-2"
                sub="Advertising cost" />

              {/* Domain spend */}
              <StatCard label="Domain Spend"
                value={fmtUSD(expStats.byType["Mua domain"] ?? 0)}
                colorClass="text-blue-600" accentClass="border-t-blue-500 border-t-2"
                sub="Domain purchases" />

              {/* Top spender */}
              <StatCard
                label={topSpender ? "Top Spender" : "GMC + Mail"}
                value={topSpender ? topSpender.name : fmtUSD((expStats.byType["Đăng ký GMC"] ?? 0) + (expStats.byType["Mua mail"] ?? 0))}
                colorClass="text-indigo-600" accentClass="border-t-indigo-500 border-t-2"
                sub={topSpender ? fmtUSD(topSpender.total) : "Other costs"} />

            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Spend by Category</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expPieData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {expPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                        formatter={(v: number) => [fmtUSD(v), ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  {expPieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-[10px] font-bold" style={{ color: d.color }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {d.name}
                      </div>
                      <span>{fmtUSD(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Monthly Spend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expMonthlyBar}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                        formatter={(v: number) => [fmtUSD(v), "Total spend"]}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={28} fill="#a855f7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
              <input type="text" placeholder="Search web, registrant, card..."
                className="flex-1 min-w-[200px] px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
                value={expSearch} onChange={e => { setExpSearch(e.target.value); setExpPage(1); }} />
              <select className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100"
                value={expMonth} onChange={e => { setExpMonth(e.target.value); setExpPage(1); }}>
                <option value="all">📅 ALL MONTHS</option>
                {expMonthOptions.map(m => <option key={m} value={m}>{fmtMonth(m).toUpperCase()}</option>)}
              </select>
              <select className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100"
                value={expLoai} onChange={e => { setExpLoai(e.target.value); setExpPage(1); }}>
                <option value="all">💰 ALL TYPES</option>
                {expLoaiOptions.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
              <select className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100"
                value={expReg} onChange={e => { setExpReg(e.target.value); setExpPage(1); }}>
                <option value="all">👤 ALL REGISTRANTS</option>
                {expRegOptions.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </select>
              {(expSearch || expMonth !== "all" || expLoai !== "all" || expReg !== "all") && (
                <button onClick={() => { setExpSearch(""); setExpMonth("all"); setExpLoai("all"); setExpReg("all"); setExpPage(1); }}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Expense Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-4 w-[12%]">Registrant</th>
                    <th className="p-4 w-[14%]">Type</th>
                    <th className="p-4 w-[12%]">Date</th>
                    <th className="p-4 w-[20%]">Website</th>
                    <th className="p-4 w-[16%]">Ads Card</th>
                    <th className="p-4 w-[10%] text-right">Amount</th>
                    <th className="p-4 w-[16%]">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expPaginated.map((e, i) => {
                    const c = getExpColor(e.loaiChiPhi);
                    return (
                      <tr key={i} className="transition-all hover:bg-slate-50/60">
                        <td className="p-4">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                            {e.tenReg || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase"
                            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                            {e.loaiChiPhi}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-slate-500 font-bold whitespace-nowrap">
                          {e.ngayThanhToan || "—"}
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-slate-700 lowercase truncate block">
                            {e.tenWeb || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] font-bold text-slate-600 truncate block">
                            {e.tenTheAds || "—"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-black text-slate-900">
                            {/k$/i.test(e.chiPhiRaw) || e.chiPhiVND > 0 ? (
                              <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                {e.chiPhiVND > 0 ? `${e.chiPhiVND.toLocaleString("vi-VN")}₫` : e.chiPhiRaw}
                              </span>
                            ) : (
                              fmtUSD(e.chiPhiUSD || parseFloat(e.chiPhiRaw.replace(/[^0-9.-]/g, "")) || 0)
                            )}
                          </span>
                        </td>
                        <td className="p-4">
                          {e.billChiPhi ? (
                            <a href={e.billChiPhi} target="_blank" rel="noreferrer"
                              className="text-[10px] font-black text-blue-500 hover:text-blue-700 underline underline-offset-2 truncate block">
                              View bill ↗
                            </a>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {expPaginated.length === 0 && (
                    <tr><td colSpan={7} className="text-center p-14 text-sm font-medium text-slate-400">No expense records found.</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination currentPage={expPage} totalItems={expZoneB.length} itemsPerPage={ITEMS} onPageChange={setExpPage} />
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/invoices")({
  component: DomainManagerPage,
});