import { r as reactExports, X as jsxRuntimeExports } from "./server-BY3o_Qlj.js";
import { u as useQuery } from "./useQuery-ll0l4zOH.js";
import { u as useTranslation, a as useQueryClient } from "./router-D47zfhuR.js";
import { u as useMutation } from "./useMutation-PETQepX9.js";
import { P as Pagination } from "./pagination-BjfZY2NH.js";
import { M as MonthFilterTabs } from "./month-filter-tabs-BoPZ1fVV.js";
import { D as DevKpiTabs } from "./dev-kpi-tabs-CEEmtp94.js";
import { t as parseGmcSusKind, u as getGMCRegData, e as getTongHopWebRegs } from "./dataService-DdUk0NVH.js";
import { G as GmailMailboxPicker } from "./gmail-mailbox-picker-Bnz8HpCl.js";
import { E as ExportExcelButton, d as downloadExcel } from "./downloadExcel-n7MxkTRE.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./kpiWeek-uKv2Fy6X.js";
import "stream";
import "./xlsx-D7D1xvpX.js";
const ITEMS = 12;
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
const fmtMonthLabel = (ym) => {
  const [, m] = ym.split("-");
  return `Tháng ${Number(m)}`;
};
const slugKey = (raw) => raw.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.myshopify\.com$/, "").split(".")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const buildGmcNotes = (rows) => {
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const key = slugKey(r.domain);
    if (key.length < 3) continue;
    map.set(key, parseGmcSusKind(r.status) === "live" ? "xanh" : "sus");
  }
  return map;
};
const lookupBySlug = (bill, map) => {
  for (const hint of [bill.domain, bill.shop]) {
    const key = slugKey(hint || "");
    if (key.length >= 3 && map.has(key)) return map.get(key) ?? null;
  }
  return null;
};
const gmcNoteOf = (bill, notes) => lookupBySlug(bill, notes);
const KIND_STYLE = {
  invoice: "bg-rose-50 text-rose-700 border-rose-200",
  receipt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  subscription: "bg-violet-50 text-violet-700 border-violet-200",
  order: "bg-sky-50 text-sky-700 border-sky-200",
  other: "bg-muted text-muted-foreground border-border",
  credit: "bg-emerald-50 text-emerald-700 border-emerald-200"
};
function ShopifyBillsPage() {
  const {
    t
  } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = reactExports.useState("");
  const [month, setMonth] = reactExports.useState("all");
  const [kind, setKind] = reactExports.useState("all");
  const [gmc, setGmc] = reactExports.useState("all");
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
  const billsQ = useQuery({
    queryKey: ["shopifyEmailBills", YEAR, "plan-credit", box, mailboxKey],
    enabled: !!statusQ.data?.connected,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch(`/api/gmail/shopify-bills?year=${YEAR}&limit=200&mailbox=${encodeURIComponent(box)}`, {
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gmail error");
      return json;
    }
  });
  const gmcQ = useQuery({
    queryKey: ["gmcRegKpiTong"],
    queryFn: () => getGMCRegData(true),
    staleTime: 6e4
  });
  const gmcNotes = reactExports.useMemo(() => buildGmcNotes(gmcQ.data ?? []), [gmcQ.data]);
  const tongHopQ = useQuery({
    queryKey: ["tongHopWebRegs"],
    queryFn: () => getTongHopWebRegs(true),
    staleTime: 6e4
  });
  const regByDomain = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const r of tongHopQ.data ?? []) {
      const key = slugKey(r.domain);
      if (key.length >= 3) map.set(key, r.tenReg);
    }
    return map;
  }, [tongHopQ.data]);
  const refreshMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/gmail/shopify-bills?year=${YEAR}&limit=200&mailbox=${encodeURIComponent(box)}&refresh=1`, {
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gmail error");
      return json;
    },
    onSuccess: (data) => qc.setQueryData(["shopifyEmailBills", YEAR, "plan-credit", box, mailboxKey], data)
  });
  const markMut = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/gmail/shopify-bills", {
        method: "PUT",
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Không lưu được trạng thái.");
    },
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["shopifyEmailBills"]
    })
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
  const bills = billsQ.data?.bills ?? [];
  const tenRegOf = (b) => (lookupBySlug(b, regByDomain) || "").trim();
  const matchReg = (b) => {
    if (reg === "all") return true;
    const name = tenRegOf(b);
    if (reg === "__none__") return !name || name === "—";
    return name === reg;
  };
  const yearBills = reactExports.useMemo(() => bills.filter((b) => b.month.startsWith(`${YEAR}-`) && (b.kind === "invoice" || b.kind === "credit")), [bills]);
  const regTabs = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    let none = 0;
    for (const b of yearBills) {
      const name = tenRegOf(b);
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
  }, [yearBills, regByDomain, t]);
  const scopedYearBills = reactExports.useMemo(() => yearBills.filter(matchReg), [yearBills, reg, regByDomain]);
  const months = reactExports.useMemo(() => {
    const map = {};
    for (const b of scopedYearBills) map[b.month] = (map[b.month] || 0) + 1;
    return Object.entries(map).sort((a, c) => c[0].localeCompare(a[0])).map(([m, count]) => ({
      month: m,
      count
    }));
  }, [scopedYearBills]);
  const monthMoney = reactExports.useMemo(() => {
    const map = {};
    for (const b of scopedYearBills) {
      const row = map[b.month] || {
        month: b.month,
        planUsd: 0,
        refundUsd: 0,
        planCount: 0,
        refundCount: 0
      };
      if (b.kind === "credit") {
        row.refundUsd += b.refundAmount || 0;
        row.refundCount += 1;
      } else {
        row.planUsd += b.planAmount || 0;
        row.planCount += 1;
      }
      map[b.month] = row;
    }
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [scopedYearBills]);
  const kindTabs = reactExports.useMemo(() => {
    let invoice = 0;
    let credit = 0;
    for (const b of scopedYearBills) {
      if (b.kind === "credit") credit += 1;
      else invoice += 1;
    }
    return [{
      name: "invoice",
      count: invoice,
      label: t("shopifyBillsKindInvoice")
    }, {
      name: "credit",
      count: credit,
      label: t("shopifyBillsKind_credit")
    }];
  }, [scopedYearBills, t]);
  const matchKind = (b) => {
    if (kind === "open") return !b.mark && b.kind !== "failed";
    if (kind !== "all") return b.kind === kind;
    return true;
  };
  const matchGmc = (b) => {
    if (gmc === "all") return true;
    const note = gmcNoteOf(b, gmcNotes);
    if (gmc === "none") return !note;
    return note === gmc;
  };
  const gmcTabs = reactExports.useMemo(() => {
    let xanh = 0;
    let sus = 0;
    let none = 0;
    for (const b of bills) {
      if (!matchReg(b)) continue;
      if (month !== "all" && b.month !== month) continue;
      if (kind === "open" && (b.mark || b.kind === "failed")) continue;
      if (kind !== "all" && kind !== "open" && b.kind !== kind) continue;
      const note = gmcNoteOf(b, gmcNotes);
      if (note === "xanh") xanh += 1;
      else if (note === "sus") sus += 1;
      else none += 1;
    }
    return [{
      name: "xanh",
      count: xanh,
      label: t("shopifyBillsGmcXanh")
    }, {
      name: "sus",
      count: sus,
      label: t("shopifyBillsGmcSus")
    }, {
      name: "none",
      count: none,
      label: t("shopifyBillsGmcNone")
    }];
  }, [bills, month, kind, reg, regByDomain, gmcNotes, t]);
  const mailboxMoney = reactExports.useMemo(() => {
    return mailboxes.map((mail) => {
      const rows = scopedYearBills.filter((b) => (b.mailbox || "").toLowerCase() === mail.toLowerCase());
      let planUsd = 0;
      let refundUsd = 0;
      let planCount = 0;
      let refundCount = 0;
      for (const b of rows) {
        if (b.kind === "credit") {
          refundUsd += b.refundAmount || 0;
          refundCount += 1;
        } else {
          planUsd += b.planAmount || 0;
          planCount += 1;
        }
      }
      return {
        mail,
        planUsd,
        refundUsd,
        planCount,
        refundCount
      };
    });
  }, [scopedYearBills, mailboxes]);
  const selectedMoney = reactExports.useMemo(() => {
    if (month === "all") {
      return monthMoney.reduce((s, r) => ({
        planUsd: s.planUsd + r.planUsd,
        refundUsd: s.refundUsd + r.refundUsd,
        planCount: s.planCount + r.planCount,
        refundCount: s.refundCount + r.refundCount
      }), {
        planUsd: 0,
        refundUsd: 0,
        planCount: 0,
        refundCount: 0
      });
    }
    return monthMoney.find((r) => r.month === month) || {
      planUsd: 0,
      refundUsd: 0,
      planCount: 0,
      refundCount: 0
    };
  }, [monthMoney, month]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (!matchReg(b)) return false;
      if (month !== "all" && b.month !== month) return false;
      if (!matchKind(b)) return false;
      if (!matchGmc(b)) return false;
      if (!q) return true;
      const amt = q.replace(/^\$/, "");
      if (b.amount != null && String(b.amount) === amt) return true;
      const note = gmcNoteOf(b, gmcNotes);
      const noteText = note === "xanh" ? "gmc xanh" : note === "sus" ? "gmc sus" : "";
      const tenReg = lookupBySlug(b, regByDomain) || "";
      return [b.subject, b.from, b.shop, b.snippet, noteText, tenReg, b.mailbox].join(" ").toLowerCase().includes(q);
    });
  }, [bills, search, month, kind, gmc, reg, gmcNotes, regByDomain]);
  const pageRows = filtered.slice((page - 1) * ITEMS, page * ITEMS);
  const connected = !!statusQ.data?.connected;
  const showMailbox = box === "all" && mailboxes.length > 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-primary", children: t("shopifyMgmt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: t("shopifyBillsNav") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-medium text-sm", children: t("shopifyBillsDesc") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        billsQ.data?.fetchedAt ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground px-3 py-2", children: [
          t("shopifyBillsCachedAt"),
          " ",
          new Date(billsQ.data.fetchedAt).toLocaleString("vi-VN")
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExportExcelButton, { disabled: filtered.length === 0, onClick: () => downloadExcel(`shopify-bills-${month === "all" ? YEAR : month}.xlsx`, [{
          name: "Bills",
          rows: filtered.map((b) => ({
            [t("shopifyBillsDate")]: fmtDate(b.date),
            [t("shopifyGmailCol")]: b.mailbox,
            [t("shopifyBillsShop")]: b.shop,
            [t("shopifyBillsReg")]: lookupBySlug(b, regByDomain) || "",
            [t("shopifyBillsGmcNote")]: gmcNoteOf(b, gmcNotes) || "",
            [t("shopifyBillsSubject")]: b.subject,
            [t("shopifyBillsKind")]: t(`shopifyBillsKind_${b.kind}`),
            [t("shopifyBillsAmount")]: b.amount ?? "",
            "Link Gmail": b.gmailUrl
          }))
        }]) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: refreshMut.isPending, onClick: () => refreshMut.mutate(), className: "px-3 py-2 text-sm rounded-xl border border-border bg-card hover:bg-accent disabled:opacity-60", children: refreshMut.isPending ? t("shopifyBillsScanning") : t("shopifyBillsRefresh") }),
        disconnectTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: disconnectMut.isPending, onClick: () => disconnectMut.mutate(disconnectTarget), className: "px-3 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-accent disabled:opacity-60", children: t("shopifyGmailDisconnectOne") }) : null
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/api/auth/gmail?next=/shopify-bills", className: "px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm", children: t("shopifyBillsConnect") }) })
    ] }),
    connected && /* @__PURE__ */ jsxRuntimeExports.jsx(GmailMailboxPicker, { mailboxes, selected: box, onSelect: (next) => {
      setBox(next);
      setPage(1);
    }, addHref: "/api/auth/gmail?next=/shopify-bills", addLabel: t("shopifyGmailAdd"), allLabel: t("shopifyGmailAll") }),
    !connected && !statusQ.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: t("shopifyBillsNeedGmail") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-2xl", children: t("shopifyBillsNeedGmailHint") })
    ] }),
    (billsQ.isError || refreshMut.isError) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-medium", children: (billsQ.error || refreshMut.error).message }),
    !!billsQ.data?.warnings?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 p-4 text-sm space-y-1", children: billsQ.data.warnings.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      w.mailbox,
      ": ",
      w.error
    ] }, w.mailbox)) }),
    connected && yearBills.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: regTabs, totalCount: yearBills.length, selected: reg, onSelect: (name) => {
        setReg(name);
        setPage(1);
      }, allLabel: t("allOwners") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", children: [
            t("shopifyBillsPlan"),
            " · ",
            month === "all" ? YEAR : fmtMonthLabel(month)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-3xl font-semibold", children: fmtUSD(selectedMoney.planUsd) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            selectedMoney.planCount,
            " ",
            t("shopifyBillsPlanMails")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-emerald-700", children: [
            t("shopifyBillsRefund"),
            " · ",
            month === "all" ? YEAR : fmtMonthLabel(month)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-3xl font-semibold text-emerald-700", children: fmtUSD(selectedMoney.refundUsd) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-emerald-700/80", children: [
            selectedMoney.refundCount,
            " ",
            t("shopifyBillsRefundMails")
          ] })
        ] })
      ] }),
      showMailbox && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-base font-semibold", children: [
          t("shopifyGmailSplit"),
          " ",
          YEAR
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyGmailCol") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsPlan") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsRefund") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsNet") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: mailboxMoney.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium break-all", children: row.mail }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-right", children: [
              fmtUSD(row.planUsd),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block text-[11px] text-muted-foreground", children: [
                row.planCount,
                " ",
                t("shopifyBillsPlanMails")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-right text-emerald-700", children: [
              fmtUSD(row.refundUsd),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block text-[11px]", children: [
                row.refundCount,
                " ",
                t("shopifyBillsRefundMails")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-semibold", children: fmtUSD(row.planUsd - row.refundUsd) })
          ] }, row.mail)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border bg-muted/40 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: t("shopifyGmailSum") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: fmtUSD(mailboxMoney.reduce((s, r) => s + r.planUsd, 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right text-emerald-700", children: fmtUSD(mailboxMoney.reduce((s, r) => s + r.refundUsd, 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: fmtUSD(mailboxMoney.reduce((s, r) => s + r.planUsd - r.refundUsd, 0)) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-base font-semibold", children: [
          t("shopifyBillsMonthSplit"),
          " ",
          YEAR
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsMonth") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsPlan") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsRefund") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsNet") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: monthMoney.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `border-t border-border/70 cursor-pointer hover:bg-accent/50 ${month === r.month ? "bg-rose-50/80" : ""}`, onClick: () => {
            setMonth(r.month);
            setPage(1);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: fmtMonthLabel(r.month) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: fmtUSD(r.planUsd) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right text-emerald-700", children: fmtUSD(r.refundUsd) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: fmtUSD(r.planUsd - r.refundUsd) })
          ] }, r.month)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tfoot", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border bg-muted/40 font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3", children: [
              t("shopifyBillsYearTotal"),
              " ",
              YEAR
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: fmtUSD(monthMoney.reduce((s, r) => s + r.planUsd, 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right text-emerald-700", children: fmtUSD(monthMoney.reduce((s, r) => s + r.refundUsd, 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: fmtUSD(monthMoney.reduce((s, r) => s + r.planUsd - r.refundUsd, 0)) })
          ] }) })
        ] })
      ] })
    ] }),
    connected && bills.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MonthFilterTabs, { items: months, totalWithDate: scopedYearBills.length, selected: month, onSelect: (m) => {
        setMonth(m);
        setPage(1);
      }, allLabel: t("allMonths") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: kindTabs, totalCount: scopedYearBills.length, selected: kind, onSelect: (name) => {
        setKind(name);
        setPage(1);
      }, allLabel: t("shopifyBillsKindAll") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DevKpiTabs, { items: gmcTabs, totalCount: gmcTabs.reduce((s, item) => s + item.count, 0), selected: gmc, onSelect: (name) => {
        setGmc(name);
        setPage(1);
      }, allLabel: t("shopifyBillsGmcAll") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => {
        setSearch(e.target.value);
        setPage(1);
      }, placeholder: t("shopifyBillsSearch"), className: "flex-1 h-11 rounded-xl border border-border bg-card px-3 text-sm" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsDate") }),
          showMailbox && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyGmailCol") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsShop") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 whitespace-nowrap", children: t("shopifyBillsReg") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 whitespace-nowrap", children: t("shopifyBillsGmcNote") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: t("shopifyBillsSubject") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3 whitespace-nowrap", children: t("shopifyBillsKind") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsAmount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: t("shopifyBillsAction") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          pageRows.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap text-muted-foreground", children: fmtDate(b.date) }),
            showMailbox && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-xs text-muted-foreground break-all", children: b.mailbox || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: b.shop }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 whitespace-nowrap", children: lookupBySlug(b, regByDomain) || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GmcNoteBadge, { note: gmcNoteOf(b, gmcNotes) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: b.gmailUrl, target: "_blank", rel: "noreferrer", className: "hover:text-primary", children: b.subject }),
              b.snippet && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: b.snippet })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${KIND_STYLE[b.kind]}`, children: t(`shopifyBillsKind_${b.kind}`) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-semibold", children: b.amount != null ? fmtUSD(b.amount) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-right whitespace-nowrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `mr-1 px-2 py-1 text-[11px] rounded-lg border ${b.mark === "noted" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`, onClick: () => markMut.mutate({
                id: b.id,
                status: b.mark === "noted" ? null : "noted"
              }), children: t("shopifyBillsNoted") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `px-2 py-1 text-[11px] rounded-lg border ${b.mark === "ignored" ? "bg-muted text-foreground border-border" : "border-border hover:bg-accent"}`, onClick: () => markMut.mutate({
                id: b.id,
                status: b.mark === "ignored" ? null : "ignored"
              }), children: t("shopifyBillsIgnored") })
            ] })
          ] }, `${b.mailbox}-${b.id}`)),
          pageRows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: showMailbox ? 9 : 8, className: "p-8 text-center text-muted-foreground", children: t("shopifyBillsEmpty") }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pagination, { currentPage: page, totalItems: filtered.length, itemsPerPage: ITEMS, onPageChange: setPage })
    ] }),
    connected && billsQ.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground animate-pulse", children: t("shopifyBillsLoading") })
  ] }) });
}
function GmcNoteBadge({
  note
}) {
  const {
    t
  } = useTranslation();
  if (!note) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "—" });
  if (note === "xanh") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200", children: t("shopifyBillsGmcXanh") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200", children: t("shopifyBillsGmcSus") });
}
export {
  ShopifyBillsPage as component
};
