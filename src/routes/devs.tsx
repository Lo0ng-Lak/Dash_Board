import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getGMCVeData } from "../lib/dataService";
import { Pagination } from "../components/pagination";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";

interface GMCAccountItem {
  domain: string;
  status: string;
  dateGMC: string;
  proxyExpiry: string;
  cost: string;
  dev: string;
}

export const Route = createFileRoute("/devs")({
  component: DevDashboard,
});

function DevDashboard() {
  // ==========================================
  // FILTERS & PAGINATION STATE MANAGEMENT
  // ==========================================
  const [searchDomain, setSearchDomain] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [devFilter, setDevFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Load GMC data of Dev room from API
  const { data: rawGmcData = [], isLoading } = useQuery<GMCAccountItem[]>({
    queryKey: ["gmcDevData"],
    queryFn: () => getGMCVeData(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Reverse array so newest records are always at top of table
  const orderedFullData = useMemo(() => {
    return [...rawGmcData].reverse();
  }, [rawGmcData]);

  // Helper function kiểm tra trạng thái linh hoạt (Chấp nhận mọi biến thể từ API)
  const isSuspended = (status: string) => {
    if (!status) return false;
    const s = status.toLowerCase().trim();
    return s === "đã sus" || s === "suspended" || s === "sus";
  };

  // Helper function to calculate days difference (for calculating lifespan of account)
  const calculateDaysElapsed = (targetDateStr: string) => {
    if (!targetDateStr || targetDateStr === "—") return null;
    const [day, month, year] = targetDateStr.split("/").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ==========================================
  // ZONE 1: GLOBAL STATS (GLOBAL STATS - SOURCE DATABASE UNFILTERED)
  // ==========================================
  const globalStats = useMemo(() => {
    const totalAcc = rawGmcData.length;
    const totalDomains = new Set(rawGmcData.map(item => item.domain.trim().toLowerCase())).size;
    const totalLive = rawGmcData.filter(item => !isSuspended(item.status)).length;
    const totalSus = rawGmcData.filter(item => isSuspended(item.status)).length;
    const totalCost = rawGmcData.reduce((sum, item) => sum + parseFloat(item.cost || "0"), 0);

    return { totalDomains, totalAcc, totalLive, totalSus, totalCost };
  }, [rawGmcData]);

  // ==========================================
  // ZONE 2: FILTER BY DROPDOWN (For dynamic stats cards & charts)
  // Text search will NOT affect this zone
  // ==========================================
  const dropdownFilteredData = useMemo(() => {
    return orderedFullData.filter((item: GMCAccountItem) => {
      const matchesStatus = statusFilter === "all"
        ? true
        : (statusFilter === "sus" ? isSuspended(item.status) : !isSuspended(item.status));

      const matchesDev = devFilter === "all" ? true : item.dev === devFilter;

      const itemMonthYear = item.dateGMC && item.dateGMC !== "—"
        ? `${item.dateGMC.split("/")[1]}/${item.dateGMC.split("/")[2]}`
        : null;
      const matchesMonth = monthFilter === "all" ? true : itemMonthYear === monthFilter;

      return matchesStatus && matchesDev && matchesMonth;
    });
  }, [orderedFullData, statusFilter, devFilter, monthFilter]);

  // Calculate dynamic stats based on filter dropdown results
  const dynamicStats = useMemo(() => {
    const total = dropdownFilteredData.length;
    const live = dropdownFilteredData.filter((item: GMCAccountItem) => !isSuspended(item.status)).length;
    const sus = dropdownFilteredData.filter((item: GMCAccountItem) => isSuspended(item.status)).length;
    const totalCost = dropdownFilteredData.reduce((sum, item) => sum + parseFloat(item.cost || "0"), 0);
    const totalUniqueDomains = new Set(dropdownFilteredData.map(item => item.domain.trim().toLowerCase())).size;

    return { total, live, sus, totalCost, totalUniqueDomains };
  }, [dropdownFilteredData]);

  // Prepare data for pie chart (Pie Chart)
  const pieChartStats = useMemo(() => [
    { name: "Active", value: dynamicStats.live, color: "#10b981" },
    { name: "Suspended", value: dynamicStats.sus, color: "#ef4444" }
  ], [dynamicStats]);

  // Prepare productivity data by each staff member (Bar Chart)
  const devProductivityStats = useMemo(() => {
    const statsMap: Record<string, { name: string; live: number; sus: number; total: number }> = {};

    dropdownFilteredData.forEach((item: GMCAccountItem) => {
      const devName = item.dev || "Unknown";
      if (!statsMap[devName]) {
        statsMap[devName] = { name: devName, live: 0, sus: 0, total: 0 };
      }
      statsMap[devName].total += 1;
      if (isSuspended(item.status)) {
        statsMap[devName].sus += 1;
      } else {
        statsMap[devName].live += 1;
      }
    });
    return Object.values(statsMap).sort((a, b) => b.total - a.total);
  }, [dropdownFilteredData]);


  // ==========================================
  // ZONE 3: SEARCH INPUT FILTER (Only applied to table data)
  // ==========================================
  const finalFilteredTableData = useMemo(() => {
    return dropdownFilteredData.filter((item: GMCAccountItem) => {
      return item.domain.toLowerCase().includes(searchDomain.toLowerCase());
    });
  }, [dropdownFilteredData, searchDomain]);

  // Map domain frequency across entire system to detect RE-REG / conflict duplicates
  const globalDomainFrequencyMap = useMemo(() => {
    const frequency: Record<string, number> = {};
    orderedFullData.forEach((item) => {
      const formattedDomain = item.domain.toLowerCase().trim();
      frequency[formattedDomain] = (frequency[formattedDomain] || 0) + 1;
    });
    return frequency;
  }, [orderedFullData]);

  // Extract month list from source data block for dropdown filter
  const uniqueMonthsOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    rawGmcData.forEach(item => {
      if (item.dateGMC && item.dateGMC !== "—") {
        const [_, month, year] = item.dateGMC.split("/");
        monthsSet.add(`${month}/${year}`);
      }
    });
    return Array.from(monthsSet).sort((a, b) => {
      const [m1, y1] = a.split("/").map(Number);
      const [m2, y2] = b.split("/").map(Number);
      return y2 - y1 || m2 - m1;
    });
  }, [rawGmcData]);

  // Extract Dev list from source data
  const uniqueDevsOptions = useMemo(() => {
    const devsSet = new Set<string>();
    rawGmcData.forEach(item => item.dev && devsSet.add(item.dev));
    return Array.from(devsSet);
  }, [rawGmcData]);

  // Pagination for table data after all filtering layers
  const paginatedTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return finalFilteredTableData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [finalFilteredTableData, currentPage]);

  if (isLoading) {
    return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">Loading system data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* DASHBOARD TITLE */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">GMC Resistance Dashboard</h1>
            <p className="text-slate-500 font-medium text-sm">Track and manage GMC status.</p>
          </div>
        </div>

        {/* STATS CARDS BLOCK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">

          {/* Card 1: Current total rows */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Total Domains</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{dynamicStats.total}</h2>
            </div>
            <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">All domains: {globalStats.totalAcc}</p>
          </div>

          {/* Card 2: Actual Domain */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-indigo-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.15em]">Filtered Domains</p>
              <div className="flex items-baseline gap-1 mt-1">
                <h2 className="text-2xl font-black text-indigo-600">{dynamicStats.totalUniqueDomains}</h2>
              </div>
            </div>
            <p className="text-[9px] font-bold text-indigo-400 uppercase mt-3">Cleaned data: {globalStats.totalDomains}</p>
          </div>

          {/* Card 3: Active accounts */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-emerald-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Live Domains</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-black text-emerald-600">{dynamicStats.live}</h2>
                <span className="text-[10px] font-bold text-emerald-500/70">
                  ({dynamicStats.total > 0 ? ((dynamicStats.live / dynamicStats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Total: {globalStats.totalLive}
              </span>
            </div>
          </div>

          {/* Card 4: Suspended accounts */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-red-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Suspended Domains</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-black text-red-600">{dynamicStats.sus}</h2>
                <span className="text-[10px] font-bold text-red-500/70">
                  ({dynamicStats.total > 0 ? ((dynamicStats.sus / dynamicStats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-red-400 uppercase mt-3">Suspended Total: {globalStats.totalSus}</p>
          </div>

          {/* Card 5: Total Ads cost */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-blue-500 border-t-2">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Ads Cost</p>
              <h2 className="text-2xl font-black text-blue-600 mt-1">
                ${dynamicStats.totalCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </h2>
            </div>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-3 bg-blue-50 w-max px-2 py-0.5 rounded-md">
              Base: ${globalStats.totalCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* CHARTS BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie chart - Live/Sus ratio */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">System Ratio Overview</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieChartStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-2 text-emerald-600">● Active: {dynamicStats.live}</div>
              <div className="flex items-center gap-2 text-red-500">● Suspended: {dynamicStats.sus}</div>
            </div>
          </div>

          {/* Bar chart - Productivity by Dev */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Account Productivity by Dev</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devProductivityStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="live" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} name="Active" />
                  <Bar dataKey="sus" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} name="Suspended" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm">
          <input
            type="text"
            placeholder="Search for domain..."
            className="flex-1 px-4 py-2 text-sm outline-none bg-slate-50 rounded-xl border border-transparent focus:border-blue-100 transition-all"
            value={searchDomain}
            onChange={(e) => { setSearchDomain(e.target.value); setCurrentPage(1); }}
          />
          <select
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600 hover:bg-slate-100 transition-colors"
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">📅 ALL MONTHS</option>
            {uniqueMonthsOptions.map(monthStr => (
              <option key={monthStr} value={monthStr}>MONTH {monthStr}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={devFilter}
            onChange={(e) => { setDevFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">👤 FILTER BY DEV (ALL)</option>
            {uniqueDevsOptions.map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
          </select>
          <select
            className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-slate-50 outline-none border-none cursor-pointer text-slate-600"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">STATUS</option>
            <option value="live">🟢 ACTIVE</option>
            <option value="sus">🔴 SUSPENDED</option>
          </select>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-5 w-[35%]">Website / Domain</th>
                <th className="p-5 w-[15%]">Assigned Staff</th>
                <th className="p-5 w-[15%]">Status</th>
                <th className="p-5 w-[12%]">Days Alive</th>
                <th className="p-5 w-[13%]">Proxy Expiry Left</th>
                <th className="p-5 w-[10%]">Ads Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTableData.map((item: GMCAccountItem, idx: number) => {
                const daysElapsed = calculateDaysElapsed(item.dateGMC);
                const liveDaysCount = daysElapsed !== null ? Math.abs(daysElapsed) : 0;
                const proxyDaysLeft = item.proxyExpiry !== "—" ? Number(item.proxyExpiry) : null;
                const isDuplicateDomain = globalDomainFrequencyMap[item.domain.toLowerCase().trim()] > 1;
                const itemIsSus = isSuspended(item.status);

                return (
                  <tr
                    key={idx}
                    className={`transition-all group ${isDuplicateDomain
                      ? "bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500"
                      : "hover:bg-slate-50/50"
                      }`}
                  >
                    <td className="p-5 overflow-hidden text-ellipsis whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800 text-[14px] lowercase truncate">{item.domain}</div>
                        {isDuplicateDomain && (
                          <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 animate-pulse">
                            RE-REG / CONFLICT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">Created: {item.dateGMC}</div>
                    </td>

                    <td className="p-5">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-wider truncate inline-block">
                        {item.dev}
                      </span>
                    </td>

                    {/* Fix hiển thị Text và màu sắc theo chuẩn tiếng Anh */}
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${itemIsSus ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${itemIsSus ? "bg-red-500" : "bg-emerald-500"} `} />
                        {itemIsSus ? "Suspended" : "Active"}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="text-sm font-black text-slate-700">
                        {liveDaysCount} <span className="text-[9px] text-slate-400">DAYS</span>
                      </div>
                    </td>

                    <td className="p-5">
                      {proxyDaysLeft !== null && !isNaN(proxyDaysLeft) ? (
                        <div className="flex flex-col gap-1">
                          <div className={`text-[11px] font-black ${proxyDaysLeft < 3 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                            {proxyDaysLeft > 0 ? `${proxyDaysLeft} days left` : 'Expired'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="text-[15px] font-black text-slate-900">${item.cost || "0"}</div>
                    </td>
                  </tr>
                );
              })}
              {paginatedTableData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-14 text-sm font-medium text-slate-400">
                    No account data found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION BAR */}
          <Pagination
            currentPage={currentPage}
            totalItems={finalFilteredTableData.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

      </div>
    </div>
  );
}