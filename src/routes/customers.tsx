import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getGMCVeData } from "../lib/dataService";
import { Pagination } from "../components/pagination";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";

export const Route = createFileRoute("/customers")({
  component: GMCPremiumDashboard,
});

function GMCPremiumDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [devFilter, setFilterDev] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: gmcData = [], isLoading } = useQuery({
    queryKey: ["gmcVeData"],
    queryFn: () => getGMCVeData(),
    refetchInterval: 30000,
  });

  // Tính ngày (Dùng chung cho cả Live Days và Proxy Days)
  const calculateDaysDiff = (targetDate: string) => {
    if (!targetDate || targetDate === "—") return null;
    const [day, month, year] = targetDate.split("/").map(Number);
    const target = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };


  // 1. TÍNH TOÁN NGÀY SỐNG
  const calculateLiveDays = (regDate: string) => {
    if (!regDate || regDate === "—") return 0;
    const [day, month, year] = regDate.split("/").map(Number);
    const start = new Date(year, month - 1, day);
    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // 2. THỐNG KÊ CHI TIẾT THEO DEV (LỌC)
  const devStats = useMemo(() => {
    const stats: Record<string, any> = {};
    gmcData.forEach(item => {
      const name = item.dev || "Unknown";
      if (!stats[name]) stats[name] = { name, live: 0, sus: 0, total: 0 };
      stats[name].total += 1;
      if (item.status === "Đã Sus") stats[name].sus += 1;
      else stats[name].live += 1;
    });
    return Object.values(stats);
  }, [gmcData]);

  // 3. DATA CHO BIỂU ĐỒ
  const chartData = useMemo(() => [
    { name: "Đang sống", value: gmcData.filter(i => i.status !== "Đã Sus").length, color: "#10b981" },
    { name: "Đã Sus", value: gmcData.filter(i => i.status === "Đã Sus").length, color: "#ef4444" }
  ], [gmcData]);

  const stats = useMemo(() => {
    const live = gmcData.filter(i => i.status !== "Đã Sus").length;
    const sus = gmcData.filter(i => i.status === "Đã Sus").length;
    const totalCostUSD = gmcData.reduce((acc, cur) => acc + parseFloat(cur.cost || "0"), 0);
    return { live, sus, totalCostUSD };
  }, [gmcData]);

  const filteredData = useMemo(() => {
    return gmcData.filter(item => {
      const matchesSearch = item.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : (statusFilter === "sus" ? item.status === "Đã Sus" : item.status !== "Đã Sus");
      const matchesDev = devFilter === "all" ? true : item.dev === devFilter;
      return matchesSearch && matchesStatus && matchesDev;
    }).reverse();
  }, [gmcData, searchTerm, statusFilter, devFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (isLoading) return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">Loading GMC Analytics...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard Kháng GMC</h1>
            <p className="text-slate-500 font-medium text-sm">Hệ thống quản lý tài khoản và chi phí vận hành.</p>
          </div>

        </div>

        {/* BIỂU ĐỒ TỔNG HỢP & HIỆU SUẤT DEV */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Tỉ lệ sống sót</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-2 text-emerald-600">● Live: {stats.live}</div>
              <div className="flex items-center gap-2 text-red-500">● Sus: {stats.sus}</div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Hiệu suất nhân sự (Dev)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="live" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} name="Đang sống" />
                  <Bar dataKey="sus" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} name="Đã Sus" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* LỌC NÂNG CAO */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
          <input
            type="text" placeholder="Tìm Domain nhanh..."
            className="flex-1 px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer"
            onChange={(e) => setFilterDev(e.target.value)}
          >
            <option value="all">TẤT CẢ DEV</option>
            {devStats.map(d => <option key={d.name} value={d.name}>{d.name.toUpperCase()}</option>)}
          </select>
          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">TRẠNG THÁI</option>
            <option value="live">🟢 LIVE</option>
            <option value="sus">🔴 SUS</option>
          </select>
        </div>

        {/* BẢNG DỮ LIỆU LUXURY */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-5">Hệ thống Website</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-center">Ngày sống</th>
                <th className="p-5">Hạn Proxy</th>
                <th className="p-5">Chi phí Ads</th>
                <th className="p-5">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((item, idx) => {
                const liveDays = Math.abs(calculateDaysDiff(item.dateGMC) || 0);
                const proxyDays = item.proxyExpiry !== "—" ? Number(item.proxyExpiry) : null;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-5">
                      <div className="font-bold text-slate-800 text-[14px] lowercase">{item.domain}</div>

                    </td>
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === "Đã Sus" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${item.status === "Đã Sus" ? "bg-red-500" : "bg-emerald-500"}`} />
                        {item.status}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="text-sm font-black text-slate-700">{liveDays} <span className="text-[9px] text-slate-400">DAYS</span></div>
                      <div className="w-16 mx-auto bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(liveDays, 100)}%` }} />
                      </div>
                    </td>
                    <td className="p-5">
                      {proxyDays !== null && !isNaN(proxyDays) ? (
                        <div className="flex flex-col gap-1">
                          <div className={`text-[11px] font-black ${proxyDays < 3 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                            {proxyDays > 0 ? `Còn ${proxyDays} ngày` : 'Đã hết hạn'}
                          </div>
                          {/* Thanh tiến trình nhỏ cho proxy nếu còn dưới 7 ngày */}
                          {proxyDays > 0 && proxyDays <= 7 && (
                            <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${proxyDays < 3 ? 'bg-red-500' : 'bg-orange-400'}`}
                                style={{ width: `${(proxyDays / 30) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="text-[15px] font-black text-slate-900">${item.cost || "0"}</div>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg uppercase">
                        {item.dev}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* SỬ DỤNG COMPONENT PHÂN TRANG */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
}