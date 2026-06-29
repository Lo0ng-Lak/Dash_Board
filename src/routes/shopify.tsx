import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getShopifyData, ShopifyRecord } from "@/lib/dataService";
import { Pagination } from "@/components/pagination";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const ITEMS = 12;
const EXPIRING_DAYS = 15;

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${parseInt(m)}/${y}`;
};

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const isExpiringSoon = (r: ShopifyRecord) =>
  !r.isCanceled
  && r.daysLeft != null
  && r.daysLeft >= 0
  && r.daysLeft <= EXPIRING_DAYS;

function DaysLeftBadge({ days }: { days: number | null }) {
  if (days == null) return <span className="text-slate-300">—</span>;
  if (days < 0) {
    return (
      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-100 text-red-600 border border-red-200">
        {Math.abs(days)}d overdue
      </span>
    );
  }
  const urgent = days <= EXPIRING_DAYS;
  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${urgent
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : "bg-emerald-50 text-emerald-600 border-emerald-200"
      }`}>
      {days}d
    </span>
  );
}

function ShopifyPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [regFilter, setRegFilter] = useState("all");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["shopifyData"],
    queryFn: () => getShopifyData(true),
    refetchInterval: 30000,
  });

  const thisMonthKey = useMemo(() => currentMonthKey(), []);

  const activeRecords = useMemo(
    () => records.filter((r) => !r.isCanceled),
    [records],
  );

  const monthlyReg = useMemo(() => {
    const map: Record<string, number> = {};
    activeRecords.forEach((r) => {
      if (!r.regMonth) return;
      map[r.regMonth] = (map[r.regMonth] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, count]) => ({ month, label: fmtMonth(month), count }));
  }, [activeRecords]);

  const expiringSoon = useMemo(
    () => activeRecords.filter(isExpiringSoon).sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99)),
    [activeRecords],
  );

  const thisMonthReg = useMemo(
    () => activeRecords.filter((r) => r.regMonth === thisMonthKey).length,
    [activeRecords, thisMonthKey],
  );

  const regOptions = useMemo(
    () => [...new Set(records.map((r) => r.nguoiReg).filter(Boolean))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (expiringOnly && !isExpiringSoon(r)) return false;
      const matchMonth = monthFilter === "all" || r.regMonth === monthFilter;
      const matchReg = regFilter === "all" || r.nguoiReg === regFilter;
      const matchSearch = !q
        || r.web.toLowerCase().includes(q)
        || r.nguoiReg.toLowerCase().includes(q)
        || r.the.toLowerCase().includes(q);
      return matchMonth && matchReg && matchSearch;
    });
  }, [records, monthFilter, regFilter, search, expiringOnly]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filtered.slice(start, start + ITEMS);
  }, [filtered, page]);

  const monthlyBar = useMemo(
    () => [...monthlyReg].reverse().map((m) => ({ month: m.label, count: m.count })),
    [monthlyReg],
  );

  useEffect(() => { setPage(1); }, [search, monthFilter, regFilter, expiringOnly]);

  if (isLoading) {
    return <div className="p-10 text-center font-medium text-slate-400 animate-pulse">{t("loadingSystemData")}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F9] p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{t("shopifyMgmtTitle")}</h1>
          <p className="text-slate-500 font-medium text-sm">{t("shopifyMgmtDesc")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-indigo-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-slate-400">{t("shopifyTotalWeb")}</p>
            <h2 className="text-3xl font-black text-indigo-600 mt-1">{activeRecords.length}</h2>
            <p className="text-[9px] font-bold text-slate-300 mt-2">{records.length} {t("shopifyInSheet")}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-emerald-500 border-t-2">
            <p className="text-[9px] font-black uppercase text-emerald-500">{t("shopifyRegThisMonth")}</p>
            <h2 className="text-3xl font-black text-emerald-600 mt-1">{thisMonthReg}</h2>
            <p className="text-[9px] font-bold text-slate-300 mt-2">{fmtMonth(thisMonthKey)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm border-t-amber-500 border-t-2 bg-amber-50/40">
            <p className="text-[9px] font-black uppercase text-amber-600">{t("shopifyExpiring15")}</p>
            <h2 className="text-3xl font-black text-amber-600 mt-1">{expiringSoon.length}</h2>
            <p className="text-[9px] font-bold text-amber-500 mt-2">≤ {EXPIRING_DAYS} {t("days")}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-t-red-400 border-t-2">
            <p className="text-[9px] font-black uppercase text-red-400">{t("shopifyCanceledCount")}</p>
            <h2 className="text-3xl font-black text-red-500 mt-1">{records.filter((r) => r.isCanceled).length}</h2>
          </div>
        </div>

        {/* Dash tháng hiện tại */}
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <p className="text-[9px] font-black uppercase text-indigo-200 tracking-widest">{t("currentMonthDash")}</p>
            <h2 className="text-xl font-black text-white mt-1">{t("shopifyRegMonth")} {fmtMonth(thisMonthKey)}</h2>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <div className="bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-xl">
              <p className="text-[9px] font-black uppercase text-indigo-400">{t("shopifyNewReg")}</p>
              <p className="text-2xl font-black text-indigo-700">{thisMonthReg}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-5 py-3 rounded-xl">
              <p className="text-[9px] font-black uppercase text-amber-600">{t("shopifyExpiring15")}</p>
              <p className="text-2xl font-black text-amber-700">{expiringSoon.length}</p>
            </div>
          </div>
        </div>

        {/* Sắp hết hạn */}
        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase text-amber-700 tracking-widest mb-4">
              ⚠️ {t("shopifyExpiringSoonList")} ({expiringSoon.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {expiringSoon.slice(0, 20).map((r) => (
                <button
                  key={r.web}
                  type="button"
                  onClick={() => { setSearch(r.web); setExpiringOnly(true); }}
                  className="px-3 py-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left transition-all"
                >
                  <p className="text-xs font-black text-slate-800 lowercase">{r.web}</p>
                  <p className="text-[9px] font-bold text-amber-600 mt-0.5">
                    {r.ngayHetHan} · {r.daysLeft} {t("days")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thẻ theo tháng */}
        {monthlyReg.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {monthlyReg.map((m) => (
              <button
                key={m.month}
                type="button"
                onClick={() => setMonthFilter(monthFilter === m.month ? "all" : m.month)}
                className={`px-4 py-3 rounded-xl border text-left min-w-[90px] transition-all ${monthFilter === m.month
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-white border-slate-200 hover:border-indigo-200"
                  }`}
              >
                <p className={`text-[9px] font-black uppercase ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`}>
                  {m.label}
                </p>
                <p className={`text-xl font-black ${monthFilter === m.month ? "text-white" : "text-slate-800"}`}>
                  {m.count}
                </p>
                <p className={`text-[9px] font-bold ${monthFilter === m.month ? "text-indigo-200" : "text-slate-400"}`}>
                  {t("webs")}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Biểu đồ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{t("shopifyMonthlyRegChart")}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis allowDecimals={false} hide />
                <Tooltip formatter={(v: number) => [v, t("webs")]} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-3 shadow-sm items-center">
          <input
            type="text"
            placeholder={t("shopifySearchPlaceholder")}
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
            {monthlyReg.map((m) => <option key={m.month} value={m.month}>{m.label}</option>)}
          </select>
          <select
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-50 outline-none border-none cursor-pointer"
            value={regFilter}
            onChange={(e) => setRegFilter(e.target.value)}
          >
            <option value="all">👤 {t("allRegistrants")}</option>
            {regOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setExpiringOnly(!expiringOnly)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${expiringOnly
              ? "bg-amber-500 text-white"
              : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
          >
            ⚠️ ≤{EXPIRING_DAYS} {t("days")}
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{filtered.length} {t("records")}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 w-[12%]">{t("thRegistrant")}</th>
                  <th className="p-4 w-[20%]">{t("thWebsite")}</th>
                  <th className="p-4 w-[10%]">{t("shopifyRegDate")}</th>
                  <th className="p-4 w-[10%]">{t("shopifyExpiryDate")}</th>
                  <th className="p-4 w-[8%] text-center">{t("shopifyDaysLeft")}</th>
                  <th className="p-4 w-[14%]">{t("thAdsCard")}</th>
                  <th className="p-4 w-[12%]">{t("shopifyWebhooks")}</th>
                  <th className="p-4 w-[8%]">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((r, i) => (
                  <tr
                    key={`${r.web}-${i}`}
                    className={`hover:bg-slate-50/60 ${isExpiringSoon(r) ? "bg-amber-50/50" : ""}`}
                  >
                    <td className="p-4">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                        {r.nguoiReg || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700 lowercase truncate">{r.web}</td>
                    <td className="p-4 text-[11px] font-bold text-slate-500 whitespace-nowrap">{r.ngayDangKy || "—"}</td>
                    <td className="p-4 text-[11px] font-bold text-slate-500 whitespace-nowrap">{r.ngayHetHan || "—"}</td>
                    <td className="p-4 text-center"><DaysLeftBadge days={r.isCanceled ? null : r.daysLeft} /></td>
                    <td className="p-4 text-[10px] font-mono text-slate-600 truncate">{r.the || "—"}</td>
                    <td className="p-4 text-[10px] font-bold text-slate-500 truncate">{r.thayWebhooks || "—"}</td>
                    <td className="p-4">
                      {r.isCanceled ? (
                        <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded-lg">{t("canceled")}</span>
                      ) : isExpiringSoon(r) ? (
                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">{t("expiringSoon")}</span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{t("active")}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-14 text-sm text-slate-400">{t("noMatchingRecords")}</td>
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

export const Route = createFileRoute("/shopify")({
  component: ShopifyPage,
});
