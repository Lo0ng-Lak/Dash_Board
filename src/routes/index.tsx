import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend
} from "recharts";
import { getLatestWebData, getAllDataWeb } from "../lib/dataService";

export const Route = createFileRoute("/")({
  component: Main,
});

const calculateDaysLeft = (dateStr: string) => {
  if (!dateStr || dateStr === "—" || dateStr === "") return null;
  let targetDate: Date;
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/").map(Number);
    targetDate = new Date(year, month - 1, day);
  } else {
    targetDate = new Date(dateStr);
  }
  if (isNaN(targetDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

function Main() {
  // 1. TỰ ĐỘNG ĐỒNG BỘ: Thay thế hoàn toàn useState và useEffect cũ
  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ["domainsData"],
    queryFn: () => getLatestWebData(true),
    refetchInterval: 30000, // 30 giây tự cập nhật một lần
    refetchOnWindowFocus: true,
  });


  const { data: allData = [] } = useQuery({
    queryKey: ["domainsAll"],
    queryFn: () => getAllDataWeb(false),
    // Raw domains rarely change; avoid aggressive polling to keep counts stable
    refetchOnWindowFocus: false,
  });

  // 2. LOGIC TÍNH TOÁN: Tự động chạy lại mỗi khi data từ useQuery thay đổi
  const stats = useMemo(() => {
    const total = data.length;
    const rawTotal = allData.length;
    const active = data.filter(d => !d.isCanceled).length;
    const canceled = data.filter(d => d.isCanceled).length;

    const shopifyCount = data.filter(d => d.type?.toLowerCase().includes('shopify')).length;
    const wordPressCount = data.filter(d => d.type?.toLowerCase().includes('wordpress')).length;
    const otherPlatform = total - shopifyCount - wordPressCount;




    const shopifyExp = data.reduce((acc: any[], d) => {
      // 1. Phải là Shopify và CHƯA hủy plan
      const isShopify = d.type?.toLowerCase().includes('shopify');
      if (!isShopify || d.isCanceled) return acc;

      // 2. Tính số ngày một lần duy nhất
      const days = calculateDaysLeft(d.expiryDateShopify);

      // 3. Nếu thỏa mãn điều kiện thời gian thì push vào mảng kết quả
      if (days !== null && days <= 15) {
        acc.push({ ...d, days });
      }

      return acc;
    }, []);

    const domainExp = data.filter(d => {
      if (d.isCanceled) return false;
      const days = (d.daysLeft !== undefined && d.daysLeft !== null)
        ? d.daysLeft
        : calculateDaysLeft(d.expiryDateDomain);
      return days !== null && days <= 15;
    }).map(d => {
      const finalDays = (d.daysLeft !== undefined && d.daysLeft !== null)
        ? d.daysLeft
        : calculateDaysLeft(d.expiryDateDomain);
      return { ...d, days: finalDays };
    });

    return {
      total, active, canceled,
      shopifyCount, wordPressCount, otherPlatform,
      shopifyExp, domainExp,
      rawTotal
    };
  }, [data, allData]);




  const platformData = [
    { name: "Shopify", value: stats.shopifyCount, color: "#10b981" },
    { name: "WordPress", value: stats.wordPressCount, color: "#3b82f6" },
    { name: "Other Platforms", value: stats.otherPlatform, color: "#94a3b8" },
  ];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans text-slate-900 leading-relaxed">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* TIÊU ĐỀ & TRẠNG THÁI ĐỒNG BỘ */}
        <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
              Website Management <span className="text-indigo-600">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">
              Website operational status
            </p>
          </div>

          {/* Báo hiệu đang làm mới dữ liệu ngầm */}
          <div className={`flex items-center gap-2 transition-opacity duration-500 ${isFetching ? 'opacity-100' : 'opacity-0'}`}>
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">Live Syncing</span>
          </div>
        </div>

        {/* 1. CÁC CHỈ SỐ TỔNG QUAN */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
          <StatCard label="Total Raw Websites" val={stats.rawTotal} sub="All domains" color="text-slate-700" icon="🌐" />
          <StatCard label="Total Filtered Websites" val={stats.total} sub="Cleaned data" color="text-slate-900" icon="📊" />
          <StatCard label="Shopify" val={stats.shopifyCount} sub="E-commerce" color="text-emerald-600" icon="🛍️" />
          <StatCard label="WordPress" val={stats.wordPressCount} sub="E-commerce" color="text-blue-600" icon="📝" />
          <StatCard label="Other" val={stats.otherPlatform} sub="Uncategorized" color="text-slate-500" icon="📁" />
          <StatCard label="Inactive" val={stats.canceled} sub="Not active" color="text-rose-500" icon="🛑" />
        </div>

        {/* 2. BIỂU ĐỒ & CẢNH BÁO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center">
            <h3 className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest self-start">Platform Distribution</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    cornerRadius={6}
                  >
                    {platformData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-emerald-600 mb-5 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2">🛒 Shopify Expiring Soon</span>
                {/* Badge showing item count */}
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[11px]">
                  {stats.shopifyExp.length}
                </span>
              </h3>
              <AlertList list={stats.shopifyExp} label="Shopify" />
            </div>

            <div className="bg-indigo-950 p-8 rounded-[32px] shadow-xl border border-indigo-900">
              <h3 className="text-[10px] font-bold text-indigo-300 mb-5 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2">🌐 Domain Expiring Soon</span>
                {/* Badge showing item count */}
                <span className="bg-indigo-500/30 text-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
                  {stats.domainExp.length}
                </span>
              </h3>
              <AlertList list={stats.domainExp} label="Domain" isDark />
            </div>
          </div>
        </div>

        {/* 3. FOOTER TRẠNG THÁI */}
        <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-[40px] shadow-2xl relative overflow-hidden border border-indigo-900">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[120px] pointer-events-none" />
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-6">
              <div className="h-14 w-1 rounded-full bg-indigo-500 hidden md:block" />
              <div>
                <p className="text-indigo-300/60 text-[10px] uppercase font-bold tracking-widest mb-1">Operational Status</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tighter">{stats.active}</span>
                  <span className="text-indigo-200/70 text-sm font-medium">Active</span>
                  <span className="text-indigo-800 mx-2 text-xl">/</span>
                  <span className="text-2xl font-bold text-rose-400">{stats.canceled}</span>
                  <span className="text-indigo-400 text-sm italic font-medium ml-1">Archived</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 w-full lg:w-auto">
              <FooterBadge label="Shopify Renewals" count={stats.shopifyExp.length} color="text-emerald-400" />
              <FooterBadge label="Domain Renewals" count={stats.domainExp.length} color="text-indigo-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTS CON (Giữ nguyên hoặc chỉnh nhẹ style) ---

function StatCard({ label, val, sub, color, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[150px] hover:border-indigo-200 transition-all group">
      <div className="flex justify-between items-start">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <div>
        <div className={`text-3xl font-bold tracking-tight ${color}`}>{val}</div>
        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{sub}</div>
      </div>
    </div>
  );
}

function FooterBadge({ label, count, color }: any) {
  return (
    <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[150px]">
      <div className="text-[9px] text-indigo-300/50 font-bold uppercase mb-1 tracking-tighter">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{count}</div>
    </div>
  );
}

function AlertList({ list, label, isDark = false }: any) {
  if (list.length === 0) return (
    <div className="py-12 text-center opacity-30">
      <div className="text-xl mb-2">✨</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">All good</div>
    </div>
  );
  return (
    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
      {list.sort((a: any, b: any) => a.days - b.days).map((item: any, i: number) => (
        <div key={i} className={`p-4 rounded-xl border transition-all ${isDark ? 'bg-indigo-900/40 border-indigo-800 hover:bg-indigo-900/60' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}>
          <div className={`text-[13px] font-bold truncate ${isDark ? 'text-indigo-100' : 'text-slate-800'}`}>{item.domain}</div>
          <div className="flex justify-between items-center mt-3">
            <span className={`text-[10px] font-bold ${item.days <= 3 ? 'text-rose-400' : isDark ? 'text-indigo-300' : 'text-slate-500'}`}>{item.days} days left</span>
            <span className={`text-[9px] font-bold uppercase px-3 py-1 rounded-lg ${item.days <= 3 ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>Renew</span>
          </div>
        </div>
      ))}
    </div>
  );
}