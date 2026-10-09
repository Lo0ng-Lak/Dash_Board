import { r as reactExports, X as jsxRuntimeExports } from "./server-Cwx-SqE5.js";
import { u as useQuery } from "./useQuery-Dp7ElvcN.js";
import { w as getLatestWebData } from "./dataService-DOjie6uP.js";
import { u as useTranslation } from "./router-CBS5TEKh.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
const ITEMS_PER_PAGE = 10;
const RenderRebuildDots = ({
  countString
}) => {
  const count = parseInt(countString.replace(/[^0-9]/g, "")) || 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-0.5", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-2 h-2 rounded-full ${i < count ? "bg-blue-500" : "bg-slate-200"}` }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400 font-medium", children: [
      count,
      "x"
    ] })
  ] });
};
const calculateDaysLeft = (dateStr) => {
  if (!dateStr || dateStr === "—") return null;
  const parts = dateStr.split("/");
  let targetDate;
  if (parts.length === 3) {
    targetDate = /* @__PURE__ */ new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  } else {
    targetDate = new Date(dateStr);
  }
  if (isNaN(targetDate.getTime())) return null;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
};
function Dashboard() {
  const {
    t
  } = useTranslation();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [currentPage, setCurrentPage] = reactExports.useState(1);
  const [filterStatus, setFilterStatus] = reactExports.useState("all");
  const [sortOrder, setSortOrder] = reactExports.useState("desc");
  const {
    data: rawData = [],
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["domainsList"],
    queryFn: () => getLatestWebData(true),
    refetchInterval: 3e4
  });
  const filteredData = reactExports.useMemo(() => {
    let result = rawData.filter((item) => {
      const matchesSearch = item.domain.toLowerCase().includes(searchTerm.toLowerCase()) || item.dev.toLowerCase().includes(searchTerm.toLowerCase()) || item.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" ? true : filterStatus === "active" ? !item.isCanceled : filterStatus === "canceled" ? item.isCanceled : true;
      return matchesSearch && matchesStatus;
    });
    return sortOrder === "desc" ? [...result].reverse() : result;
  }, [rawData, searchTerm, filterStatus, sortOrder]);
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentItems = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  reactExports.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortOrder]);
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 3;
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > maxVisible) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - (maxVisible - 1)) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: p === "...", onClick: () => typeof p === "number" && setCurrentPage(p), className: `px-3 py-1 border rounded text-xs transition-all ${currentPage === p ? "bg-blue-600 text-white border-blue-600 font-bold" : p === "..." ? "border-transparent text-slate-400 cursor-default" : "bg-white hover:bg-slate-50 text-slate-600"}`, children: p }, i));
  };
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-center font-medium text-slate-400 animate-pulse", children: t("loadingDomainData") });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-6 text-foreground font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row justify-between items-end gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight text-slate-900", children: t("domainManagement") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("domainSystemDesc") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-4 w-full md:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full md:w-96", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-2.5 text-slate-400 text-xs", children: "🔍" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: t("searchPlaceholder"), className: "w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSortOrder(sortOrder === "asc" ? "desc" : "asc"), className: "px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition-all", children: sortOrder === "asc" ? `⬇️ ${t("newestFirst")}` : `⬆️ ${t("oldestFirst")}` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 w-full md:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "border border-slate-200 rounded-lg px-4 py-2 text-sm bg-white outline-none cursor-pointer font-medium text-slate-600", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("allStatus") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "active", children: [
            "🟢 ",
            t("active")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: "canceled", children: [
            "🔴 ",
            t("canceled")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `transition-opacity duration-500 ${isFetching ? "opacity-100" : "opacity-0"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded-full bg-blue-500 animate-pulse" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm text-left border-collapse min-w-[1050px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-[#F9FAF9] text-slate-400 font-bold uppercase text-[9px] tracking-[0.15em] border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5 text-center w-12", children: t("no") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5", children: t("domain") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5", children: t("staff") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5", children: t("operations") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5", children: t("shopifyExpiry") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5", children: t("domainExpiry") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-5", children: t("platform") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: currentItems.map((item, idx) => {
          const displayIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5 text-center text-slate-400 text-[10px]", children: displayIndex }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-slate-800 lowercase text-[15px] mb-1", children: item.domain }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-slate-700 font-semibold text-xs", children: [
                "Dev: ",
                item.dev
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-slate-400 mt-0.5 italic", children: [
                t("registeredBy"),
                ": ",
                item.regBy
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RenderRebuildDots, { countString: item.rebuildCount }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: item.webhookStatus === "Đã thay" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-black", children: t("webhookDone") }) : item.webhookStatus === "Chưa thay webhook" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-black", children: t("notWebhookChanged") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded font-black", children: t("notDetermined") }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-slate-700 text-xs tabular-nums", children: item.expiryDateShopify || "—" }),
              !item.isCanceled && item.expiryDateShopify !== "—" && (() => {
                const days = calculateDaysLeft(item.expiryDateShopify);
                return days !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-[10px] font-bold uppercase tracking-tight ${days <= 7 ? "text-red-500" : "text-blue-500"}`, children: [
                  days,
                  " ",
                  t("daysLeft")
                ] }) : null;
              })(),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[9px] text-slate-400 italic font-medium", children: [
                t("registeredDate"),
                ": ",
                item.startDate || "—"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `font-bold text-xs tabular-nums ${item.daysLeft <= 7 ? "text-red-500" : "text-slate-700"}`, children: item.expiryDateSheet || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-[10px] font-bold mt-1 px-2 py-0.5 rounded-md w-fit ${item.daysLeft <= 7 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`, children: [
                item.daysLeft,
                " ",
                t("daysLeft")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-5", children: item.isCanceled && item.isHuyRegMoi ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 line-through decoration-red-400", children: [
              "× ",
              t("shopifyCanceled")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.type?.toLowerCase() === "shopify" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"}`, children: item.type }) })
          ] }, item.domain + idx);
        }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t flex items-center justify-between bg-[#F9FAF9]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-slate-400 font-medium", children: [
          t("showing"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-bold", children: currentItems.length }),
          " ",
          t("of"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-bold", children: filteredData.length }),
          " ",
          t("domains")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)), disabled: currentPage === 1, className: "p-1.5 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 disabled:opacity-30", children: "◀" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 mx-2", children: renderPagination() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages, className: "p-1.5 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 disabled:opacity-30", children: "▶" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  Dashboard as component
};
