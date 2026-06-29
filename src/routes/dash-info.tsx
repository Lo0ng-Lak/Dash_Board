import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { clearInfoBoCache, getInfoBoData, InfoBoBatch, InfoBoOwnerStats, InfoBoRecord, InfoBoStats } from "@/lib/dataService";
import { Pagination } from "@/components/pagination";

export const Route = createFileRoute("/dash-info")({
  component: DashInfoPage,
});

const ITEMS_PER_PAGE = 12;

const OWNER_COLORS: Record<string, string> = {
  "Long BMT": "bg-purple-100 text-purple-800 border-purple-200",
  "Chương": "bg-amber-100 text-amber-800 border-amber-200",
  "An Dev": "bg-teal-100 text-teal-800 border-teal-200",
  "Bảo Hân": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function DashInfoPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [loaiFilter, setLoaiFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [batchInitialized, setBatchInitialized] = useState(false);

  useEffect(() => {
    i18n.changeLanguage("vi");
  }, []);

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["infoBoData"],
    queryFn: () => getInfoBoData(true),
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const handleRefresh = async () => {
    clearInfoBoCache();
    await queryClient.invalidateQueries({ queryKey: ["infoBoData"] });
    await refetch();
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const batches = data?.batches ?? [];
  const allRecords = data?.records ?? [];
  const allStats = data?.stats;

  useEffect(() => {
    if (batchInitialized || !batches.length) return;
    const primary = batches.find((b) => b.stats.totalInSheet > 0) ?? batches[0];
    if (primary) setBatchFilter(primary.id);
    setBatchInitialized(true);
  }, [batches, batchInitialized]);

  const activeBatch = batchFilter === "all"
    ? null
    : batches.find((b) => b.id === batchFilter);

  const records = useMemo(() => {
    if (batchFilter === "all") return allRecords;
    return allRecords.filter((r) => r.batchId === batchFilter);
  }, [allRecords, batchFilter]);

  const stats = activeBatch?.stats ?? allStats;

  const ownerStats = useMemo(() => {
    if (batchFilter === "all") return data?.byOwner ?? [];
    return activeBatch?.byOwner ?? [];
  }, [data?.byOwner, activeBatch, batchFilter]);

  const loaiOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.loaiDoc || t("infoUnclassified")));
    return Array.from(set).sort();
  }, [records, t]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || [
        r.web, r.infoCaNhan, r.tenReg, r.dev, r.loaiDoc, r.trangThai,
      ].some((v) => v.toLowerCase().includes(q));

      const matchesLoai = loaiFilter === "all"
        || (r.loaiDoc || t("infoUnclassified")) === loaiFilter;

      return matchesSearch && matchesLoai;
    });
  }, [records, search, loaiFilter, t]);

  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          <p className="text-slate-500 text-sm">{t("loadingData")}</p>
        </div>
      </div>
    );
  }

  const khangResolved = stats.khangVe + stats.khangFail;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Báo cáo <span className="text-indigo-600">Info Về Bờ</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeBatch
                ? `Đợt ${activeBatch.label} · Tổng lô ${activeBatch.totalDeclared} info · ${activeBatch.stats.totalInSheet} dòng trong sheet`
                : `Tổng hợp ${batches.filter((b) => b.stats.totalInSheet > 0).length} đợt có dữ liệu · ${allRecords.length} dòng`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {isFetching ? "Đang tải..." : "Làm mới"}
            </button>
            {lastUpdated && (
              <p className="text-xs text-slate-400">
                Cập nhật lúc {lastUpdated} · tự động mỗi 30s
              </p>
            )}
            {isFetching && (
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Đang lấy dữ liệu từ sheet...
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 -mt-4">
          Google Sheet publish có độ trễ 1–5 phút sau khi bạn sửa. Nhớ <strong>Ctrl+S</strong> lưu sheet,
          đợi vài phút rồi bấm <strong>Làm mới</strong>. Dash đọc tab đã publish (gid 145659602), không phải file gốc realtime.
        </p>

        {batches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <BatchPill
              active={batchFilter === "all"}
              onClick={() => { setBatchFilter("all"); setPage(1); }}
              label="Tất cả đợt"
              sub={`${allRecords.length} dòng`}
            />
            {batches.map((b) => (
              <BatchPill
                key={b.id}
                active={batchFilter === b.id}
                onClick={() => { setBatchFilter(b.id); setPage(1); }}
                label={`Đợt ${b.label}`}
                sub={b.stats.totalInSheet > 0
                  ? `${b.stats.totalInSheet} dòng · EIN ${b.stats.einEligible}/${b.stats.einInfoTotal} (${b.stats.einRate}%)`
                  : `${b.totalDeclared} info khai báo · chưa có dòng`}
              />
            ))}
          </div>
        )}

        {batches.length > 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700">So sánh tỉ lệ theo đợt</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead className="text-xs font-semibold text-slate-500 border-b bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-left">Đợt</th>
                    <th className="px-5 py-3 text-center">Xin EIN</th>
                    <th className="px-5 py-3 text-center">Kháng về</th>
                    <th className="px-5 py-3 text-center">Fail</th>
                    <th className="px-5 py-3 text-center">Chưa kháng</th>
                    <th className="px-5 py-3 text-center">Đang dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <BatchCompareRow key={b.id} batch={b} onSelect={() => { setBatchFilter(b.id); setPage(1); }} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <RateCard
            icon="📋"
            label="Tỉ lệ xin EIN thành công"
            rate={stats.einRate}
            detail={`${stats.einEligible} / ${stats.einInfoTotal} info đã có`}
            sub={`${stats.einEligible} doanh nghiệp xin EIN · ${stats.caNhan} cá nhân · ${stats.einSubmitted} đã in doc · ${stats.chuaXinInfo} chưa xin info không tính`}
            color="text-blue-600"
            barColor="bg-blue-500"
          />
          <KhangRateCard stats={stats} />
          <RateCard
            icon="✅"
            label="Info đang dùng"
            rate={stats.infoUsableRate}
            detail={`${stats.infoInUse} / ${stats.totalDeclared} info đã gán web`}
            sub="DN + CN được tính · chia tổng lô đợt"
            color="text-emerald-600"
            barColor="bg-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <MiniStat label="Tổng lô" value={stats.totalDeclared} hint="Toàn bộ đợt" />
          <MiniStat label="Info đã có" value={stats.einInfoTotal} color="text-indigo-600" hint="Mẫu số EIN" />
          <MiniStat label="Doanh nghiệp" value={stats.einEligible} color="text-blue-600" hint="Xin được EIN" />
          <MiniStat label="Đã in doc DN" value={stats.einSubmitted} color="text-blue-500" hint="Có file doc" />
          <MiniStat label="Chưa xin info" value={stats.chuaXinInfo} color="text-slate-400" hint="Không tính EIN" />
          <MiniStat label="Cá nhân" value={stats.caNhan} color="text-purple-600" hint="Không tính EIN" />
          <MiniStat label="Kháng về" value={stats.khangVe} color="text-emerald-600" />
          <MiniStat label="Chưa kháng" value={stats.chuaKhang} color="text-amber-600" />
        </div>

        {khangResolved > 0 && (
          <p className="text-xs text-slate-500 -mt-4">
            Tỉ lệ kháng: {stats.khangVe} kháng về + {stats.khangFail} fail = {khangResolved} đã xử lý
            {stats.chuaKhang > 0 && ` · ${stats.chuaKhang} chưa kháng không tính`}
          </p>
        )}

        {ownerStats.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700">
                Phân loại theo người cầm info
                {activeBatch ? ` · Đợt ${activeBatch.label}` : ""}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cột Tên trên sheet — số info và kháng về mỗi người</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-xs font-semibold text-slate-500 border-b bg-slate-50/50">
                  <tr>
                    {batchFilter === "all" && <th className="px-5 py-3 text-left">Đợt</th>}
                    <th className="px-5 py-3 text-left">Tên</th>
                    <th className="px-5 py-3 text-center">Số info</th>
                    <th className="px-5 py-3 text-center">Kháng về</th>
                    <th className="px-5 py-3 text-center">Fail</th>
                    <th className="px-5 py-3 text-center">Chưa kháng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ownerStats.map((o) => (
                    <OwnerStatsRow key={`${o.batchId}-${o.name}`} owner={o} showBatch={batchFilter === "all"} />
                  ))}
                </tbody>
                <tfoot className="border-t bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    {batchFilter === "all" && <td className="px-5 py-3" />}
                    <td className="px-5 py-3">Tổng</td>
                    <td className="px-5 py-3 text-center">{ownerStats.reduce((s, o) => s + o.totalInfo, 0)}</td>
                    <td className="px-5 py-3 text-center text-emerald-600">{ownerStats.reduce((s, o) => s + o.khangVe, 0)}</td>
                    <td className="px-5 py-3 text-center text-red-500">{ownerStats.reduce((s, o) => s + o.khangFail, 0)}</td>
                    <td className="px-5 py-3 text-center text-amber-600">{ownerStats.reduce((s, o) => s + o.chuaKhang, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50">
            <h3 className="text-sm font-bold text-slate-700">Chi tiết từng info</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tên, web, dev, trạng thái..."
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select
                value={loaiFilter}
                onChange={(e) => { setLoaiFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
              >
                <option value="all">Tất cả loại Doc</option>
                {loaiOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Info cá nhân</th>
                  <th className="px-4 py-3">Web</th>
                  <th className="px-4 py-3">Dev</th>
                  <th className="px-4 py-3">Loại Doc</th>
                  <th className="px-4 py-3">Doc DN</th>
                  <th className="px-4 py-3">Trạng thái kháng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.map((item) => (
                  <InfoRow key={`${item.batchId}-${item.stt}-${item.infoCaNhan}`} item={item} />
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                      Không tìm thấy dòng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-500">
              Hiển thị {pageItems.length} / {filtered.length} dòng
            </span>
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchPill({
  active, onClick, label, sub,
}: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border text-left transition-all ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200"
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className={`text-xs mt-0.5 ${active ? "text-indigo-100" : "text-slate-400"}`}>{sub}</div>
    </button>
  );
}

function BatchCompareRow({ batch, onSelect }: { batch: InfoBoBatch; onSelect: () => void }) {
  const s = batch.stats;
  const noData = s.totalInSheet === 0;
  return (
    <tr className="hover:bg-slate-50 cursor-pointer" onClick={onSelect}>
      <td className="px-5 py-3 font-semibold text-slate-800">{batch.label}</td>
      <td className="px-5 py-3 text-center text-blue-600 font-bold">
        {noData ? "—" : (
          <>
            {s.einRate}%
            <div className="text-[11px] text-slate-400 font-normal">{s.einEligible}/{s.einInfoTotal}</div>
          </>
        )}
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-emerald-600 font-bold">{s.khangVeRate}%</span>
        <div className="text-[11px] text-slate-400">{s.khangVe} case</div>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-red-500 font-bold">{s.khangFailRate}%</span>
        <div className="text-[11px] text-slate-400">{s.khangFail} case</div>
      </td>
      <td className="px-5 py-3 text-center text-amber-600 font-medium">{s.chuaKhang}</td>
      <td className="px-5 py-3 text-center text-emerald-600 font-bold">{s.infoUsableRate}%</td>
    </tr>
  );
}

function KhangRateCard({ stats }: { stats: InfoBoStats }) {
  const resolved = stats.khangVe + stats.khangFail;
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-sm font-medium">Tỉ lệ kháng</span>
        <span className="text-2xl opacity-60">⚖️</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-4xl font-black text-emerald-600">{stats.khangVeRate}%</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Kháng về</div>
          <div className="text-xs text-slate-400">{stats.khangVe} case</div>
        </div>
        <div>
          <div className="text-4xl font-black text-red-500">{stats.khangFailRate}%</div>
          <div className="text-sm font-semibold text-slate-700 mt-1">Fail</div>
          <div className="text-xs text-slate-400">{stats.khangFail} case</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
        <p>Chỉ tính <strong>kháng về + fail</strong> ({resolved} case đã xử lý)</p>
        {stats.chuaKhang > 0 && (
          <p className="text-amber-600">{stats.chuaKhang} chưa kháng — không tính vào tỉ lệ</p>
        )}
      </div>
    </div>
  );
}

function RateCard({
  icon, label, rate, detail, sub, color, barColor,
}: {
  icon: string; label: string; rate: number; detail: string; sub: string;
  color: string; barColor: string;
}) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
      <div className={`text-4xl font-black tracking-tight ${color}`}>{rate}%</div>
      <div className="text-sm text-slate-700 mt-2">{detail}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
    </div>
  );
}

function MiniStat({
  label, value, color = "text-slate-900", hint,
}: { label: string; value: number; color?: string; hint?: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function OwnerBadge({ name }: { name: string }) {
  const cls = OWNER_COLORS[name] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {name}
    </span>
  );
}

function OwnerStatsRow({ owner, showBatch }: { owner: InfoBoOwnerStats; showBatch: boolean }) {
  return (
    <tr className="hover:bg-slate-50">
      {showBatch && <td className="px-5 py-3 text-slate-500 text-xs">{owner.batchLabel}</td>}
      <td className="px-5 py-3"><OwnerBadge name={owner.name} /></td>
      <td className="px-5 py-3 text-center font-bold text-slate-800">{owner.totalInfo}</td>
      <td className="px-5 py-3 text-center font-bold text-emerald-600">{owner.khangVe}</td>
      <td className="px-5 py-3 text-center font-bold text-red-500">{owner.khangFail}</td>
      <td className="px-5 py-3 text-center font-medium text-amber-600">{owner.chuaKhang}</td>
    </tr>
  );
}

function StatusBadge({ item }: { item: InfoBoRecord }) {
  if (item.isKhangVe) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        Kháng về
      </span>
    );
  }
  if (item.isKhangFail) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
        Fail
      </span>
    );
  }
  if (item.isChuaKhang) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        Chưa kháng
      </span>
    );
  }
  return <span className="text-xs text-slate-400">—</span>;
}

function InfoRow({ item }: { item: InfoBoRecord }) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3 text-xs text-slate-400">{item.stt}</td>
      <td className="px-4 py-3">
        {item.tenReg ? <OwnerBadge name={item.tenReg} /> : <span className="text-xs text-slate-400">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800 text-sm">{item.infoCaNhan || "—"}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 lowercase">{item.web || "—"}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{item.dev || "—"}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
          item.isChuaXinInfo
            ? "bg-slate-50 text-slate-400 border-slate-200"
            : item.isEinEligible
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : item.isCaNhan
                ? "bg-purple-50 text-purple-700 border-purple-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
        }`}>
          {item.loaiDoc || "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">
        {item.isEinEligible
          ? (item.hasEin ? item.docDoanhNghiep : "Chưa in EIN")
          : item.isCaNhan
            ? "Cá nhân — không xin EIN"
            : item.isChuaXinInfo
              ? "Chưa xin info"
              : "—"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge item={item} />
      </td>
    </tr>
  );
}
