import { r as reactExports, X as jsxRuntimeExports } from "./server-C34JbuOG.js";
import { u as useQuery } from "./useQuery-Ca5y3yOL.js";
import { u as useTranslation, a as useQueryClient, i as instance } from "./router-NoOd4vuR.js";
import { x as parseKhangStatus, y as getInfoBoData, z as clearInfoBoCache } from "./dataService-Roh-zkhu.js";
import { P as Pagination } from "./pagination-DdALhRiu.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
const ITEMS_PER_PAGE = 12;
const batchDisplayLabel = (batch) => {
  if (/llc/i.test(batch.name) || /chưa check/i.test(batch.name)) return batch.label;
  if (/đợt|dot/i.test(batch.name)) return `Đợt ${batch.label}`;
  return batch.label;
};
const OWNER_COLORS = {
  "Long BMT": "bg-purple-100 text-purple-800 border-purple-200",
  "Chương": "bg-amber-100 text-amber-800 border-amber-200",
  "An Dev": "bg-teal-100 text-teal-800 border-teal-200",
  "Bảo Hân": "bg-emerald-100 text-emerald-800 border-emerald-200"
};
function DashInfoPage() {
  const {
    t
  } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = reactExports.useState("");
  const [loaiFilter, setLoaiFilter] = reactExports.useState("all");
  const [batchFilter, setBatchFilter] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const [batchInitialized, setBatchInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    instance.changeLanguage("vi");
  }, []);
  const {
    data,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch
  } = useQuery({
    queryKey: ["infoBoData"],
    queryFn: () => getInfoBoData(true),
    staleTime: 0,
    refetchInterval: 3e4,
    refetchOnWindowFocus: true,
    refetchOnMount: "always"
  });
  const handleRefresh = async () => {
    clearInfoBoCache();
    await queryClient.invalidateQueries({
      queryKey: ["infoBoData"]
    });
    await refetch();
  };
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }) : null;
  const batches = data?.batches ?? [];
  const allRecords = data?.records ?? [];
  const allStats = data?.stats;
  reactExports.useEffect(() => {
    if (batchInitialized || !batches.length) return;
    const withRows = batches.filter((b) => b.stats.totalInSheet > 0);
    const newest = [...withRows].reverse().find((b) => /llc|chưa check/i.test(b.name) || /llc|chưa check/i.test(b.label)) ?? withRows[withRows.length - 1] ?? batches[0];
    if (newest) setBatchFilter(newest.id);
    setBatchInitialized(true);
  }, [batches, batchInitialized]);
  const activeBatch = batchFilter === "all" ? null : batches.find((b) => b.id === batchFilter);
  const records = reactExports.useMemo(() => {
    if (batchFilter === "all") return allRecords;
    return allRecords.filter((r) => r.batchId === batchFilter);
  }, [allRecords, batchFilter]);
  const stats = activeBatch?.stats ?? allStats;
  const ownerStats = reactExports.useMemo(() => {
    if (batchFilter === "all") return data?.byOwner ?? [];
    return activeBatch?.byOwner ?? [];
  }, [data?.byOwner, activeBatch, batchFilter]);
  const loaiOptions = reactExports.useMemo(() => {
    const set = new Set(records.map((r) => r.loaiDoc || t("infoUnclassified")));
    return Array.from(set).sort();
  }, [records, t]);
  const filtered = reactExports.useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || [r.web, r.infoCaNhan, r.tenReg, r.dev, r.loaiDoc, r.trangThai, r.khangDot2].some((v) => v.toLowerCase().includes(q));
      const matchesLoai = loaiFilter === "all" || (r.loaiDoc || t("infoUnclassified")) === loaiFilter;
      return matchesSearch && matchesLoai;
    });
  }, [records, search, loaiFilter, t]);
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  if (isLoading || !stats) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-sm", children: t("loadingData") })
    ] }) });
  }
  const khangResolved = stats.khangVe + stats.khangFail;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-6 md:p-10 font-sans text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl md:text-3xl font-bold text-slate-900", children: [
          "Báo cáo ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-indigo-600", children: "Info Về Bờ" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-sm mt-1", children: activeBatch ? `${batchDisplayLabel(activeBatch)} · Tổng lô ${activeBatch.totalDeclared} info · ${activeBatch.stats.totalInSheet} dòng trong sheet` : `Tổng hợp ${batches.filter((b) => b.stats.totalInSheet > 0).length} đợt có dữ liệu · ${allRecords.length} dòng` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleRefresh, disabled: isFetching, className: "px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors", children: isFetching ? "Đang tải..." : "Làm mới" }),
        lastUpdated && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400", children: [
          "Cập nhật lúc ",
          lastUpdated,
          " · tự động mỗi 30s"
        ] }),
        isFetching && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-indigo-600 text-xs font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full bg-indigo-500 animate-pulse" }),
          "Đang lấy dữ liệu từ sheet..."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 -mt-4", children: [
      "Google Sheet publish có độ trễ 1–5 phút sau khi bạn sửa. Nhớ ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Ctrl+S" }),
      " lưu sheet, đợi vài phút rồi bấm ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Làm mới" }),
      ". Dash đọc tab đã publish (gid 145659602), không phải file gốc realtime."
    ] }),
    batches.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BatchPill, { active: batchFilter === "all", onClick: () => {
        setBatchFilter("all");
        setPage(1);
      }, label: "Tất cả đợt", sub: `${allRecords.length} dòng` }),
      batches.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(BatchPill, { active: batchFilter === b.id, onClick: () => {
        setBatchFilter(b.id);
        setPage(1);
      }, label: batchDisplayLabel(b), sub: b.stats.totalInSheet > 0 ? `${b.stats.totalInSheet} dòng · EIN ${b.stats.einEligible}/${b.stats.einInfoTotal} (${b.stats.einRate}%)` : `${b.totalDeclared} info khai báo · chưa có dòng` }, b.id))
    ] }),
    batches.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 py-4 border-b bg-slate-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-slate-700", children: "So sánh tỉ lệ theo đợt" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[680px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-xs font-semibold text-slate-500 border-b bg-slate-50/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-left", children: "Đợt" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Xin EIN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Kháng về" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Fail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Chưa kháng" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Đang dùng" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: batches.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(BatchCompareRow, { batch: b, onSelect: () => {
          setBatchFilter(b.id);
          setPage(1);
        } }, b.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RateCard, { icon: "📋", label: "Tỉ lệ xin EIN thành công", rate: stats.einRate, detail: `${stats.einEligible} / ${stats.einInfoTotal} info đã có`, sub: `${stats.einEligible} doanh nghiệp xin EIN · ${stats.caNhan} cá nhân · ${stats.einSubmitted} đã in doc · ${stats.chuaXinInfo} chưa xin info không tính`, color: "text-blue-600", barColor: "bg-blue-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KhangRateCard, { stats }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RateCard, { icon: "✅", label: "Info đang dùng", rate: stats.infoUsableRate, detail: `${stats.infoInUse} / ${stats.totalDeclared} info đã gán web`, sub: "DN + CN được tính · chia tổng lô đợt", color: "text-emerald-600", barColor: "bg-emerald-500" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Tổng lô", value: stats.totalDeclared, hint: "Toàn bộ đợt" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Info đã có", value: stats.einInfoTotal, color: "text-indigo-600", hint: "Mẫu số EIN" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Doanh nghiệp", value: stats.einEligible, color: "text-blue-600", hint: "Xin được EIN" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Đã in doc DN", value: stats.einSubmitted, color: "text-blue-500", hint: "Có file doc" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Chưa xin info", value: stats.chuaXinInfo, color: "text-slate-400", hint: "Không tính EIN" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Cá nhân", value: stats.caNhan, color: "text-purple-600", hint: "Không tính EIN" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Kháng về", value: stats.khangVe, color: "text-emerald-600", hint: "Gồm đợt 2 về" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Chưa kháng", value: stats.chuaKhang, color: "text-amber-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: "Reg lại info", value: stats.regLaiInfo, color: "text-sky-600" })
    ] }),
    khangResolved > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 -mt-4", children: [
      "Tỉ lệ kháng: ",
      stats.khangVe,
      " kháng về + ",
      stats.khangFail,
      " fail = ",
      khangResolved,
      " đã xử lý",
      stats.chuaKhang > 0 && ` · ${stats.chuaKhang} chưa kháng không tính`,
      stats.regLaiInfo > 0 && ` · ${stats.regLaiInfo} reg lại info không tính`
    ] }),
    ownerStats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b bg-slate-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold text-slate-700", children: [
          "Phân loại theo người cầm info",
          activeBatch ? ` · Đợt ${activeBatch.label}` : ""
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Cột Tên trên sheet — số info và kháng về mỗi người. Kháng đợt 2 về vẫn tính thành công." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[640px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-xs font-semibold text-slate-500 border-b bg-slate-50/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          batchFilter === "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-left", children: "Đợt" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-left", children: "Tên" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Số info" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Kháng về" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Fail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Chưa kháng" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 text-center", children: "Reg lại" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: ownerStats.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(OwnerStatsRow, { owner: o, showBatch: batchFilter === "all" }, `${o.batchId}-${o.name}`)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { className: "border-t bg-slate-50 text-xs font-semibold text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          batchFilter === "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3", children: "Tổng" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center", children: ownerStats.reduce((s, o) => s + o.totalInfo, 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center text-emerald-600", children: ownerStats.reduce((s, o) => s + o.khangVe, 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center text-red-500", children: ownerStats.reduce((s, o) => s + o.khangFail, 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center text-amber-600", children: ownerStats.reduce((s, o) => s + o.chuaKhang, 0) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center text-sky-600", children: ownerStats.reduce((s, o) => s + o.regLaiInfo, 0) })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b flex flex-col md:flex-row gap-3 md:items-center justify-between bg-slate-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-slate-700", children: "Chi tiết từng info" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => {
            setSearch(e.target.value);
            setPage(1);
          }, placeholder: "Tìm tên, web, dev, trạng thái...", className: "px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: loaiFilter, onChange: (e) => {
            setLoaiFilter(e.target.value);
            setPage(1);
          }, className: "px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "Tất cả loại Doc" }),
            loaiOptions.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o, children: o }, o))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm text-left min-w-[900px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 text-slate-500 font-semibold text-xs border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "STT" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Tên" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Info cá nhân" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Web" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Dev" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Loại Doc" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Doc DN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Trạng thái" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Kháng đợt 2" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
          pageItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { item }, `${item.batchId}-${item.stt}-${item.infoCaNhan}`)),
          pageItems.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 9, className: "px-4 py-12 text-center text-slate-400 text-sm", children: "Không tìm thấy dòng nào" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t flex items-center justify-between bg-slate-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
          "Hiển thị ",
          pageItems.length,
          " / ",
          filtered.length,
          " dòng"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage: page, totalItems: filtered.length, itemsPerPage: ITEMS_PER_PAGE, onPageChange: setPage })
      ] })
    ] })
  ] }) });
}
function BatchPill({
  active,
  onClick,
  label,
  sub
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick, className: `px-4 py-2.5 rounded-xl border text-left transition-all ${active ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xs mt-0.5 ${active ? "text-indigo-100" : "text-slate-400"}`, children: sub })
  ] });
}
function BatchCompareRow({
  batch,
  onSelect
}) {
  const s = batch.stats;
  const noData = s.totalInSheet === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50 cursor-pointer", onClick: onSelect, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 font-semibold text-slate-800", children: batchDisplayLabel(batch) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center text-blue-600 font-bold", children: noData ? "—" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      s.einRate,
      "%",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-400 font-normal", children: [
        s.einEligible,
        "/",
        s.einInfoTotal
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-emerald-600 font-bold", children: [
        s.khangVeRate,
        "%"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-400", children: [
        s.khangVe,
        " case"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-red-500 font-bold", children: [
        s.khangFailRate,
        "%"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-400", children: [
        s.khangFail,
        " case"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center text-amber-600 font-medium", children: s.chuaKhang }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3 text-center text-emerald-600 font-bold", children: [
      s.infoUsableRate,
      "%"
    ] })
  ] });
}
function KhangRateCard({
  stats
}) {
  const resolved = stats.khangVe + stats.khangFail;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-sm font-medium", children: "Tỉ lệ kháng" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl opacity-60", children: "⚖️" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-4xl font-black text-emerald-600", children: [
          stats.khangVeRate,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-slate-700 mt-1", children: "Kháng về" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-400", children: [
          stats.khangVe,
          " case"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-4xl font-black text-red-500", children: [
          stats.khangFailRate,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-slate-700 mt-1", children: "Fail" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-400", children: [
          stats.khangFail,
          " case"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "Chỉ tính ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "kháng về + fail" }),
        " (",
        resolved,
        " case đã xử lý)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Kháng đợt 2 về vẫn tính kháng thành công" }),
      stats.chuaKhang > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-amber-600", children: [
        stats.chuaKhang,
        " chưa kháng — không tính vào tỉ lệ"
      ] }),
      stats.regLaiInfo > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sky-600", children: [
        stats.regLaiInfo,
        " reg lại info — không tính vào tỉ lệ"
      ] })
    ] })
  ] });
}
function RateCard({
  icon,
  label,
  rate,
  detail,
  sub,
  color,
  barColor
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-sm font-medium", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl opacity-60", children: icon })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-4xl font-black tracking-tight ${color}`, children: [
      rate,
      "%"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-slate-700 mt-2", children: detail }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-slate-400 mt-1", children: sub }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 h-2 bg-slate-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full transition-all ${barColor}`, style: {
      width: `${Math.min(rate, 100)}%`
    } }) })
  ] });
}
function MiniStat({
  label,
  value,
  color = "text-slate-900",
  hint
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white p-4 rounded-xl border border-slate-200 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-bold mt-1 ${color}`, children: value }),
    hint && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 mt-0.5", children: hint })
  ] });
}
function OwnerBadge({
  name
}) {
  const cls = OWNER_COLORS[name] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`, children: name });
}
function OwnerStatsRow({
  owner,
  showBatch
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50", children: [
    showBatch && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-slate-500 text-xs", children: owner.batchLabel }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(OwnerBadge, { name: owner.name }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center font-bold text-slate-800", children: owner.totalInfo }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center font-bold text-emerald-600", children: owner.khangVe }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center font-bold text-red-500", children: owner.khangFail }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center font-medium text-amber-600", children: owner.chuaKhang }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-center font-medium text-sky-600", children: owner.regLaiInfo })
  ] });
}
function StatusBadge({
  status,
  fromDot2 = false
}) {
  const suffix = fromDot2 ? " · đợt 2" : "";
  if (status === "khang_ve") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200", children: [
      "Kháng về",
      suffix
    ] });
  }
  if (status === "fail") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200", children: [
      "Fail",
      suffix
    ] });
  }
  if (status === "chua_khang") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200", children: [
      "Chưa kháng",
      suffix
    ] });
  }
  if (status === "reg_lai") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200", children: [
      "Reg lại info",
      suffix
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "—" });
}
function InfoRow({
  item
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/80", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-slate-400", children: item.stt }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: item.tenReg ? /* @__PURE__ */ jsxRuntimeExports.jsx(OwnerBadge, { name: item.tenReg }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-slate-800 text-sm", children: item.infoCaNhan || "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-slate-700 lowercase", children: item.web || "—" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-sm text-slate-600", children: item.dev || "—" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full border ${item.isChuaXinInfo ? "bg-slate-50 text-slate-400 border-slate-200" : item.isEinEligible ? "bg-blue-50 text-blue-700 border-blue-100" : item.isCaNhan ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-amber-50 text-amber-700 border-amber-100"}`, children: item.loaiDoc || "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate", children: item.isEinEligible ? item.hasEin ? item.docDoanhNghiep : "Chưa in EIN" : item.isCaNhan ? "Cá nhân — không xin EIN" : item.isChuaXinInfo ? "Chưa xin info" : "—" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: parseKhangStatus(item.trangThai) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: item.khangDot2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: parseKhangStatus(item.khangDot2), fromDot2: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "—" }) })
  ] });
}
export {
  DashInfoPage as component
};
