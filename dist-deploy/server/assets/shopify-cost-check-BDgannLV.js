import { r as reactExports, X as jsxRuntimeExports } from "./server-D1kiBNQ3.js";
import { u as useQuery } from "./useQuery-ClPJIjB8.js";
import { r as reconcileCardTxnsAgainstGmc, f as reconcileExpensesAgainstGmc, p as parseExcelRows, h as isCardTxnHeaders, j as parseCardTxnRows, k as isAirwallexHeaders, l as parseExpenseRows, m as isCardTxnCsv, n as parseCardTxnCsvText, o as parseExpensesFromCsvText, q as isGoogleAdsMerchant, s as getChiPhiExpenses } from "./dataService-NS9qAXcf.js";
import { P as Pagination } from "./pagination-CE6NAvSw.js";
import { u as useTranslation } from "./router-48ILCIjq.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
import "./xlsx-D7D1xvpX.js";
const ITEMS = 12;
const fmtUSD = (n) => n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n) => Math.round(n * 100) / 100;
const parseSearchAmount = (q) => {
  const cleaned = q.trim().replace(/^\$/, "").replace(/\s+/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : round2(n);
};
const merchantGroupName = (merchant) => {
  const raw = (merchant || "").trim();
  if (!raw) return "UNKNOWN";
  if (isGoogleAdsMerchant(raw)) return "GOOGLE ADS";
  const star = raw.indexOf("*");
  if (star >= 0) {
    const before = raw.slice(0, star).trim();
    return before || "UNKNOWN";
  }
  return raw.split(/\s+/)[0] || "UNKNOWN";
};
const matchCardTxn = (e, q) => {
  const nq = q.trim().toLowerCase();
  if (!nq) return true;
  const amt = parseSearchAmount(nq);
  if (amt != null && round2(e.netAmount) === amt) return true;
  if (merchantGroupName(e.merchantName).toLowerCase() === nq) return true;
  return [e.merchantName, e.cardName, e.cardNickname, e.cardNo].join(" ").toLowerCase().includes(nq);
};
const matchExpense = (e, q) => {
  const nq = q.trim().toLowerCase();
  if (!nq) return true;
  const usd = round2((e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0));
  const amt = parseSearchAmount(nq);
  if (amt != null && usd === amt) return true;
  const blob = [
    e.tenReg,
    e.loaiChiPhi,
    e.tenWeb,
    e.tenTheAds,
    e.ngayThanhToan,
    e.chiPhiRaw,
    String(usd)
  ].join(" ").toLowerCase();
  return blob.includes(nq);
};
function ShopifyCostReconcile() {
  const { t } = useTranslation();
  const inputRef = reactExports.useRef(null);
  const [fileName, setFileName] = reactExports.useState("");
  const [mode, setMode] = reactExports.useState(null);
  const [cardFormat, setCardFormat] = reactExports.useState(null);
  const [cardTxns, setCardTxns] = reactExports.useState(null);
  const [expenses, setExpenses] = reactExports.useState(null);
  const [parseError, setParseError] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const [listTab, setListTab] = reactExports.useState("missing");
  const [search, setSearch] = reactExports.useState("");
  const { data: gmc = [], isLoading: gmcLoading, refetch } = useQuery({
    queryKey: ["chiPhiExpenses"],
    queryFn: () => getChiPhiExpenses(true),
    staleTime: 3e4
  });
  const cardResult = reactExports.useMemo(() => {
    if (mode !== "card" || !cardTxns) return null;
    return reconcileCardTxnsAgainstGmc(cardTxns, gmc);
  }, [mode, cardTxns, gmc]);
  const expenseResult = reactExports.useMemo(() => {
    if (mode !== "expense" || !expenses) return null;
    return reconcileExpensesAgainstGmc(expenses, gmc);
  }, [mode, expenses, gmc]);
  const matchedCount = cardResult?.matchedCount ?? expenseResult?.matchedCount ?? 0;
  const missingCount = cardResult?.missing.length ?? expenseResult?.missing.length ?? 0;
  const matchedUsd = cardResult?.matchedUsd ?? expenseResult?.matchedUsd ?? 0;
  const missingUsd = cardResult?.missingUsd ?? expenseResult?.missingUsd ?? 0;
  const totalUsd = cardResult?.totalUsd ?? expenseResult?.totalUsd ?? matchedUsd + missingUsd;
  const missingUsdt = expenseResult?.missingUsdt ?? 0;
  const missingVnd = expenseResult?.missingVnd ?? 0;
  const gmcCount = cardResult?.gmcCount ?? expenseResult?.gmcCount ?? gmc.length;
  const uploadedCount = cardResult?.uploadedCount ?? expenseResult?.uploadedCount ?? 0;
  const filteredCards = reactExports.useMemo(() => {
    if (!cardResult) return [];
    const src = listTab === "missing" ? cardResult.missing : cardResult.matched;
    return src.filter((e) => matchCardTxn(e, search));
  }, [cardResult, listTab, search]);
  const filteredExpenses = reactExports.useMemo(() => {
    if (!expenseResult) return [];
    const src = listTab === "missing" ? expenseResult.missing : expenseResult.matched;
    return src.filter((e) => matchExpense(e, search));
  }, [expenseResult, listTab, search]);
  const filteredCount = cardResult ? filteredCards.length : filteredExpenses.length;
  const filteredSum = reactExports.useMemo(() => {
    if (cardResult) {
      return round2(filteredCards.reduce((s, e) => s + e.netAmount, 0));
    }
    return round2(
      filteredExpenses.reduce((s, e) => s + (e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0), 0)
    );
  }, [cardResult, filteredCards, filteredExpenses]);
  const pageCards = reactExports.useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filteredCards.slice(start, start + ITEMS);
  }, [filteredCards, page]);
  const pageExpenses = reactExports.useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filteredExpenses.slice(start, start + ITEMS);
  }, [filteredExpenses, page]);
  const merchantGroups = reactExports.useMemo(() => {
    if (!cardResult) return [];
    const map = /* @__PURE__ */ new Map();
    const bump = (t2, noted) => {
      const name = merchantGroupName(t2.merchantName);
      const key = name.toUpperCase();
      let row = map.get(key);
      if (!row) {
        row = {
          name: key,
          notedUsd: 0,
          unnotedUsd: 0,
          totalUsd: 0,
          notedCount: 0,
          unnotedCount: 0,
          count: 0
        };
        map.set(key, row);
      }
      const amt = t2.netAmount || 0;
      row.count += 1;
      row.totalUsd = round2(row.totalUsd + amt);
      if (noted) {
        row.notedCount += 1;
        row.notedUsd = round2(row.notedUsd + amt);
      } else {
        row.unnotedCount += 1;
        row.unnotedUsd = round2(row.unnotedUsd + amt);
      }
    };
    for (const t2 of cardResult.matched) bump(t2, true);
    for (const t2 of cardResult.missing) bump(t2, false);
    return [...map.values()].sort((a, b) => b.totalUsd - a.totalUsd || a.name.localeCompare(b.name));
  }, [cardResult]);
  const clear = () => {
    setMode(null);
    setCardFormat(null);
    setCardTxns(null);
    setExpenses(null);
    setFileName("");
    setParseError("");
    setPage(1);
    setListTab("missing");
    setSearch("");
    if (inputRef.current) inputRef.current.value = "";
  };
  const onFile = async (file) => {
    clear();
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");
    const isCsv = lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt");
    if (!isExcel && !isCsv) {
      setParseError(t("shopifyCostUploadFormat"));
      return;
    }
    try {
      if (isExcel) {
        const rows2 = await parseExcelRows(file);
        if (rows2.length === 0) {
          setParseError(t("shopifyCostUploadEmpty"));
          return;
        }
        const headers = Object.keys(rows2[0] || {});
        if (isCardTxnHeaders(headers)) {
          const parsed = parseCardTxnRows(rows2);
          if (parsed.length === 0) {
            setParseError(t("shopifyCostUploadEmpty"));
            return;
          }
          setMode("card");
          setCardFormat(isAirwallexHeaders(headers) ? "airwallex" : "photon");
          setCardTxns(parsed);
        } else {
          const parsed = parseExpenseRows(rows2);
          if (parsed.length === 0) {
            setParseError(t("shopifyCostUploadEmpty"));
            return;
          }
          setMode("expense");
          setExpenses(parsed);
        }
        setFileName(file.name);
        await refetch();
        return;
      }
      const text = await file.text();
      if (isCardTxnCsv(text)) {
        const rows2 = parseCardTxnCsvText(text);
        if (rows2.length === 0) {
          setParseError(t("shopifyCostUploadEmpty"));
          return;
        }
        setMode("card");
        setCardFormat(isCardTxnCsv(text) && /airwallex|financial account id|beneficiary name/i.test(text) ? "airwallex" : "photon");
        setCardTxns(rows2);
        setFileName(file.name);
        await refetch();
        return;
      }
      const rows = parseExpensesFromCsvText(text);
      if (rows.length === 0) {
        setParseError(t("shopifyCostUploadEmpty"));
        return;
      }
      setMode("expense");
      setExpenses(rows);
      setFileName(file.name);
      await refetch();
    } catch {
      setParseError(t("shopifyCostUploadFail"));
    }
  };
  const hasResult = Boolean(cardResult || expenseResult);
  const rowTone = listTab === "missing" ? "hover:bg-amber-50/40" : "hover:bg-emerald-50/40";
  const amountTone = listTab === "missing" ? "text-rose-600" : "text-emerald-600";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: inputRef,
          type: "file",
          accept: ".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv",
          className: "hidden",
          onChange: (e) => onFile(e.target.files?.[0] ?? null)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => inputRef.current?.click(),
          className: "px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wide hover:bg-indigo-700 transition-colors",
          children: t("shopifyCostUploadBtn")
        }
      ),
      fileName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl", children: [
        fileName,
        mode === "card" ? ` · ${cardFormat === "airwallex" ? t("shopifyCostFormatAirwallex") : t("shopifyCostFormatCard")}` : null
      ] }),
      (cardTxns || expenses) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: clear,
          className: "px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 border border-slate-200 hover:bg-slate-50",
          children: t("shopifyCostClear")
        }
      ),
      gmcLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-slate-400 animate-pulse", children: t("shopifyCostLoadingGmc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 font-medium leading-relaxed", children: t("shopifyCostUploadHint") }),
    parseError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm font-bold text-red-600", children: parseError }),
    hasResult && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl border border-slate-200 bg-slate-50/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: t("shopifyCostUploaded") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-slate-800 mt-1", children: uploadedCount }),
          cardResult && cardResult.skippedCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-bold text-slate-400 mt-1", children: [
            t("shopifyCostSkipped"),
            ": ",
            cardResult.skippedCount
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-slate-500 mt-2", children: [
            t("shopifyCostTotalMoney"),
            ": ",
            fmtUSD(totalUsd)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-emerald-600", children: t("shopifyCostNotedMoney") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-emerald-700 mt-1", children: fmtUSD(matchedUsd) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-emerald-600/80 mt-2", children: [
            matchedCount,
            " ",
            t("records"),
            " · ",
            t("shopifyCostMatched")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl border border-rose-200 bg-rose-50/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-rose-600", children: t("shopifyCostUnnotedMoney") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-rose-700 mt-1", children: fmtUSD(missingUsd) }),
          missingUsdt > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black text-rose-600 mt-0.5", children: [
            missingUsdt,
            " USDT"
          ] }),
          missingVnd > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black text-rose-600 mt-0.5", children: [
            missingVnd.toLocaleString("vi-VN"),
            " VND"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-rose-500 mt-2", children: [
            missingCount,
            " ",
            t("records"),
            " · ",
            t("shopifyCostMissing")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl border border-slate-200 bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: t("shopifyCostGmcRows") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-slate-800 mt-1", children: gmcCount }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-slate-400 mt-2", children: t("shopifyCostMatchHint") })
        ] })
      ] }),
      cardResult && merchantGroups.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-slate-100 bg-slate-50/70", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-slate-500", children: t("shopifyCostMerchantGroups") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 font-medium mt-1", children: t("shopifyCostMerchantGroupsHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[720px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("shopifyCostMerchantGroup") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: t("shopifyCostNotedMoney") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: t("shopifyCostUnnotedMoney") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: t("shopifyCostTotalMoney") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: t("records") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: merchantGroups.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "tr",
            {
              className: "hover:bg-indigo-50/40 cursor-pointer",
              onClick: () => {
                setSearch(g.name);
                setListTab(g.unnotedCount > 0 ? "missing" : "matched");
                setPage(1);
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-black text-indigo-700 uppercase", children: g.name }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-right", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black text-emerald-600", children: fmtUSD(g.notedUsd) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-emerald-500/80", children: [
                    g.notedCount,
                    " ",
                    t("records")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-right", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black text-rose-600", children: fmtUSD(g.unnotedUsd) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-rose-500/80", children: [
                    g.unnotedCount,
                    " ",
                    t("records")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right text-sm font-black text-slate-800", children: fmtUSD(g.totalUsd) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right text-[11px] font-bold text-slate-500", children: g.count })
              ]
            },
            g.name
          )) })
        ] }) })
      ] }),
      missingCount === 0 && listTab === "missing" && matchedCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-sm font-bold text-emerald-700", children: t("shopifyCostAllMatched") }) : null,
      (missingCount > 0 || matchedCount > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                setListTab("missing");
                setPage(1);
              },
              className: `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${listTab === "missing" ? "bg-rose-600 text-white" : "bg-white text-rose-600 border border-rose-200"}`,
              children: [
                t("shopifyCostUnnotedMoney"),
                " · ",
                fmtUSD(missingUsd),
                " (",
                missingCount,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                setListTab("matched");
                setPage(1);
              },
              className: `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${listTab === "matched" ? "bg-emerald-600 text-white" : "bg-white text-emerald-600 border border-emerald-200"}`,
              children: [
                t("shopifyCostNotedMoney"),
                " · ",
                fmtUSD(matchedUsd),
                " (",
                matchedCount,
                ")"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => {
                setSearch(e.target.value);
                setPage(1);
              },
              placeholder: t("shopifyCostSearchPlaceholder"),
              className: "flex-1 min-w-[220px] px-4 py-2.5 text-sm outline-none bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-300"
            }
          ),
          search.trim() && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setSearch("");
                setPage(1);
              },
              className: "px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 border border-slate-200 hover:bg-slate-50",
              children: t("shopifyCostClear")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `px-4 py-2 rounded-xl border min-w-[160px] ${search.trim() ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase text-slate-400", children: search.trim() ? t("shopifyCostSearchTotal") : t("shopifyCostListTotal") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black text-indigo-700", children: [
              fmtUSD(filteredSum),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-bold text-slate-400 ml-2", children: [
                "(",
                filteredCount,
                " ",
                t("records"),
                ")"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: cardResult ? /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[1100px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("thPaymentDate") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("shopifyCostTxnId") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("shopifyCostCardName") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("shopifyCostCardNo") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("shopifyCostMerchant") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: t("thAmount") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
            pageCards.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: rowTone, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[11px] font-bold text-slate-600 whitespace-nowrap", children: e.transactionDate || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[10px] font-mono text-slate-600 max-w-[180px] truncate", children: e.transactionId }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[11px] font-black text-indigo-600 uppercase max-w-[180px] truncate", children: e.cardName || e.cardNickname || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[10px] font-mono text-slate-500 whitespace-nowrap", children: e.cardLast4 ? `****${e.cardLast4}` : e.cardNo || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[11px] font-bold text-slate-700 max-w-[260px] truncate", children: e.merchantName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[10px] font-bold text-slate-500", children: e.status || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-3 text-sm font-black text-right whitespace-nowrap ${amountTone}`, children: [
                fmtUSD(e.netAmount),
                e.currency && e.currency !== "USD" ? ` ${e.currency}` : ""
              ] })
            ] }, `${listTab}-${e.transactionId}`)),
            pageCards.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "text-center p-10 text-sm text-slate-400", children: t("noMatchingRecords") }) })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left min-w-[900px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("thPaymentDate") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("thRegistrant") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("thExpenseType") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: t("thWebsite") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right", children: t("thAmount") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: pageExpenses.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: rowTone, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[11px] font-bold text-slate-500 whitespace-nowrap", children: e.ngayThanhToan || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[11px] font-black text-indigo-600 uppercase", children: e.tenReg || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-sm font-bold text-slate-700", children: e.loaiChiPhi || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-[11px] font-bold text-slate-600 lowercase truncate max-w-[160px]", children: e.tenWeb || "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-3 text-sm font-black text-right whitespace-nowrap ${amountTone}`, children: e.chiPhiUSD > 0 ? fmtUSD(e.chiPhiUSD) : e.chiPhiRaw || "-" })
          ] }, `${listTab}-${e.tenReg}-${e.ngayThanhToan}-${i}`)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Pagination,
          {
            currentPage: page,
            totalItems: filteredCount,
            itemsPerPage: ITEMS,
            onPageChange: setPage
          }
        )
      ] })
    ] })
  ] }) });
}
function ShopifyCostCheckPage() {
  const {
    t
  } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-full p-8 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-indigo-500", children: t("shopifyMgmt") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight", children: t("shopifyCostNav") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 font-medium text-sm", children: t("shopifyCostCheckDesc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ShopifyCostReconcile, {})
  ] }) });
}
export {
  ShopifyCostCheckPage as component
};
