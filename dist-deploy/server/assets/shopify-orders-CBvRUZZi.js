import { r as reactExports, X as jsxRuntimeExports } from "./server-BY3o_Qlj.js";
import { u as useQuery } from "./useQuery-ll0l4zOH.js";
import { u as useTranslation, a as useQueryClient } from "./router-D47zfhuR.js";
import { u as useMutation } from "./useMutation-PETQepX9.js";
import { P as Pagination } from "./pagination-BjfZY2NH.js";
import { M as MonthFilterTabs } from "./month-filter-tabs-BoPZ1fVV.js";
import { D as DevKpiTabs } from "./dev-kpi-tabs-CEEmtp94.js";
import { e as getTongHopWebRegs } from "./dataService-DdUk0NVH.js";
import { G as GmailMailboxPicker } from "./gmail-mailbox-picker-Bnz8HpCl.js";
import { u as utils, w as writeFileSync } from "./xlsx-D7D1xvpX.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./kpiWeek-uKv2Fy6X.js";
import "stream";
const ITEMS = 15;
const YEAR = 2026;
const fmtUSD = (n) => n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};
const slugKey = (raw) => raw.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.myshopify\.com$/, "").split(".")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
function ShopifyOrdersPage() {
  const {
    t
  } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = reactExports.useState("");
  const [month, setMonth] = reactExports.useState("all");
  const [shop, setShop] = reactExports.useState("all");
  const [reg, setReg] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const [box, setBox] = reactExports.useState("all");
  const statusQ = useQuery({
    queryKey: ["gmailStatus"],
    queryFn: async () => {
      const res = await fetch("/api/gmail/status", {
        credentials: "include"
      });
      return await res.json();
    }
  });
  const mailboxes = statusQ.data?.mailboxes?.length ? statusQ.data.mailboxes : statusQ.data?.mailbox ? [statusQ.data.mailbox] : [];
  reactExports.useEffect(() => {
    if (box !== "all" && mailboxes.length > 0 && !mailboxes.includes(box)) setBox("all");
  }, [box, mailboxes]);
  const mailboxKey = mailboxes.join("|");
  const ordersQ = useQuery({
    queryKey: ["shopifyEmailOrders", YEAR, box, mailboxKey],
    enabled: !!statusQ.data?.connected,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch(`/api/gmail/shopify-orders?year=${YEAR}&limit=250&mailbox=${encodeURIComponent(box)}`, {
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gmail error");
      return json;
    }
  });
  const tongHopQ = useQuery({
    queryKey: ["tongHopWebRegs"],
    queryFn: () => getTongHopWebRegs(true),
    staleTime: 6e4
  });
  const refreshMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/gmail/shopify-orders?year=${YEAR}&limit=250&mailbox=${encodeURIComponent(box)}&refresh=1`, {
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gmail error");
      return json;
    },
    onSuccess: (data) => qc.setQueryData(["shopifyEmailOrders", YEAR, box, mailboxKey], data)
  });
  const disconnectTarget = box !== "all" ? box : mailboxes.length === 1 ? mailboxes[0] : "";
  const disconnectMut = useMutation({
    mutationFn: async (mailbox) => {
      await fetch("/api/gmail/disconnect", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          mailbox
        })
      });
    },
    onSuccess: () => {
      setBox("all");
      qc.invalidateQueries({
        queryKey: ["gmailStatus"]
      });
      qc.invalidateQueries({
        queryKey: ["shopifyEmailBills"]
      });
      qc.invalidateQueries({
        queryKey: ["shopifyEmailOrders"]
      });
    }
  });
  const orders = ordersQ.data?.orders ?? [];
  const connected = !!statusQ.data?.connected;
  const showMailbox = box === "all" && mailboxes.length > 1;
  const regByDomain = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const r of tongHopQ.data ?? []) {
      const key = slugKey(r.domain);
      if (key.length >= 3) map.set(key, r.tenReg);
    }
    return map;
  }, [tongHopQ.data]);
  const yearOrders = reactExports.useMemo(() => orders.filter((o) => o.month.startsWith(`${YEAR}-`)), [orders]);
  const tenRegOf = (o) => (regByDomain.get(slugKey(o.shop)) || "").trim();
  const matchReg = (o) => {
    if (reg === "all") return true;
    const name = tenRegOf(o);
    if (reg === "__none__") return !name || name === "—";
    return name === reg;
  };
  const regTabs = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    let none = 0;
    for (const o of yearOrders) {
      const name = tenRegOf(o);
      if (name && name !== "—") map.set(name, (map.get(name) || 0) + 1);
      else none += 1;
    }
    const items = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "vi")).map(([name, count]) => ({
      name,
      count
    }));
    if (none) items.push({
      name: "__none__",
      count: none,
      label: t("shopifyBillsNoReg")
    });
    return items;
  }, [yearOrders, regByDomain, t]);
  const scopedYearOrders = reactExports.useMemo(() => yearOrders.filter(matchReg), [yearOrders, reg, regByDomain]);
  const months = reactExports.useMemo(() => {
    const map = {};
    for (const o of scopedYearOrders) map[o.month] = (map[o.month] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([m, count]) => ({
      month: m,
      count
    }));
  }, [scopedYearOrders]);
  const shops = reactExports.useMemo(() => [...new Set(scopedYearOrders.map((o) => o.shop).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [scopedYearOrders]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedYearOrders.filter((o) => {
      if (month !== "all" && o.month !== month) return false;
      if (shop !== "all" && o.shop !== shop) return false;
      if (!q) return true;
      const tenReg = tenRegOf(o);
      return [o.shop, o.orderNo, o.customer, o.subject, tenReg, o.mailbox].join(" ").toLowerCase().includes(q);
    });
  }, [scopedYearOrders, month, shop, search, regByDomain]);
  const pageRows = filtered.slice((page - 1) * ITEMS, page * ITEMS);
  const totalUsd = filtered.reduce((s, o) => s + (o.amount || 0), 0);
  const downloadExcel = () => {
    const sheet = filtered.map((o, i) => ({
      STT: i + 1,
      [t("shopifyBillsDate")]: fmtDate(o.date),
      [t("shopifyGmailCol")]: o.mailbox || "",
      [t("shopifyBillsDomain")]: o.shop,
      [t("shopifyBillsReg")]: tenRegOf(o),
      [t("shopifyOrdersNo")]: o.orderNo,
      [t("shopifyOrdersCustomer")]: o.customer,
      [t("shopifyBillsAmount")]: o.amount ?? "",
      "Link Gmail": o.gmailUrl
    }));
    const ws = utils.json_to_sheet(sheet);
    ws["!cols"] = [{
      wch: 6
    }, {
      wch: 14
    }, {
      wch: 28
    }, {
      wch: 22
    }, {
      wch: 16
    }, {
      wch: 18
    }, {
      wch: 28
    }, {
      wch: 12
    }, {
      wch: 42
    }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Shopify Order");
    const stamp = month === "all" ? String(YEAR) : month;
    writeFileSync(wb, `shopify-orders-${stamp}.xlsx`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-primary", children: t("shopifyMgmt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: t("shopifyOrdersNav") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-medium text-sm", children: t("shopifyOrdersDesc") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        ordersQ.data?.fetchedAt ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground px-3 py-2", children: [
          t("shopifyBillsCachedAt"),
          " ",
          new Date(ordersQ.data.fetchedAt).toLocaleString("vi-VN")
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: filtered.length === 0, onClick: downloadExcel, className: "px-3 py-2 text-sm rounded-xl border border-border bg-card hover:bg-accent disabled:opacity-60", children: t("shopifyOrdersExport") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: refreshMut.isPending, onClick: () => refreshMut.mutate(), className: "px-3 py-2 text-sm rounded-xl border border-border bg-card hover:bg-accent disabled:opacity-60", children: refreshMut.isPending ? t("shopifyBillsScanning") : t("shopifyBillsRefresh") }),
        disconnectTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: disconnectMut.isPending, onClick: () => disconnectMut.mutate(disconnectTarget), className: "px-3 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-accent disabled:opacity-60", children: t("shopifyGmailDisconnectOne") }) : null
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/api/auth/gmail?next=/shopify-orders", className: "px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm", children: t("shopifyBillsConnect") }) })
    ] }),
    connected && /* @__PURE__ */ jsxRuntimeExports.jsx(GmailMailboxPicker, { mailboxes, selected: box, onSelect: (next) => {
      setBox(next);
      setPage(1);
    }, addHref: "/api/auth/gmail?next=/shopify-orders", addLabel: t("shopifyGmailAdd"), allLabel: t("shopifyGmailAll") }),
    !connected && !statusQ.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: t("shopifyBillsNeedGmail") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-2xl", children: t("shopifyOrdersNeedHint") })
    ] }),
    ordersQ.isError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-medium", children: ordersQ.error.message }),
    !!ordersQ.data?.warnings?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 p-4 text-sm space-y-1", children: ordersQ.data.warnings.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      w.mailbox,
      ": ",
      w.error
    ] }, w.mailbox)) }),
    connected && yearOrders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: regTabs, totalCount: yearOrders.length, selected: reg, onSelect: (name) => {
        setReg(name);
        setShop("all");
        setPage(1);
      }, allLabel: t("allOwners") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", children: t("shopifyOrdersCount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-3xl font-semibold", children: filtered.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", children: t("shopifyOrdersTotal") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-3xl font-semibold", children: fmtUSD(totalUsd) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MonthFilterTabs, { items: months, totalWithDate: scopedYearOrders.length, selected: month, onSelect: (m) => {
        setMonth(m);
        setPage(1);
      }, allLabel: t("allMonths") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => {
          setSearch(e.target.value);
          setPage(1);
        }, placeholder: t("shopifyOrdersSearch"), className: "flex-1 h-11 rounded-xl border border-border bg-card px-3 text-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: shop, onChange: (e) => {
          setShop(e.target.value);
          setPage(1);
        }, className: "h-11 rounded-xl border border-border bg-card px-3 text-sm min-w-[180px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: t("shopifyOrdersAllShops") }),
          shops.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s }, s))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsDate") }),
          showMailbox && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyGmailCol") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsDomain") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsReg") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyOrdersNo") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyOrdersCustomer") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsAmount") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          pageRows.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap text-muted-foreground", children: fmtDate(o.date) }),
            showMailbox && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-xs text-muted-foreground break-all", children: o.mailbox || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: o.shop }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: regByDomain.get(slugKey(o.shop)) || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: o.gmailUrl, target: "_blank", rel: "noreferrer", className: "hover:text-primary font-medium", children: o.orderNo }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: o.customer }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-semibold", children: o.amount != null ? fmtUSD(o.amount) : "—" })
          ] }, `${o.mailbox}-${o.id}`)),
          pageRows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: showMailbox ? 7 : 6, className: "p-8 text-center text-muted-foreground", children: t("shopifyBillsEmpty") }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage: page, totalItems: filtered.length, itemsPerPage: ITEMS, onPageChange: setPage })
    ] }),
    connected && ordersQ.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground animate-pulse", children: t("shopifyBillsLoading") }),
    connected && !ordersQ.isLoading && !ordersQ.isError && yearOrders.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground", children: t("shopifyBillsEmpty") })
  ] }) });
}
export {
  ShopifyOrdersPage as component
};
