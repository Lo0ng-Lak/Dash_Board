import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CardTxnRecord,
  ExpenseRecord,
  getChiPhiExpenses,
  isCardTxnCsv,
  isCardTxnHeaders,
  parseCardTxnCsvText,
  parseCardTxnRows,
  parseExcelRows,
  parseExpenseRows,
  parseExpensesFromCsvText,
  reconcileCardTxnsAgainstGmc,
  reconcileExpensesAgainstGmc,
} from "@/lib/dataService";
import { Pagination } from "@/components/pagination";

const ITEMS = 12;

const fmtUSD = (n: number) =>
  n % 1 === 0
    ? `$${n.toLocaleString()}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

const parseSearchAmount = (q: string): number | null => {
  const cleaned = q.trim().replace(/^\$/, "").replace(/\s+/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : round2(n);
};

/** Tên nhóm merchant: phần trước dấu * — "SHOPIFY* 549..." → "SHOPIFY" */
const merchantGroupName = (merchant: string): string => {
  const raw = (merchant || "").trim();
  if (!raw) return "UNKNOWN";
  const star = raw.indexOf("*");
  if (star >= 0) {
    const before = raw.slice(0, star).trim();
    return before || "UNKNOWN";
  }
  // Không có *: lấy token đầu (TXVRFY SHERIDAN USA → TXVRFY)
  return raw.split(/\s+/)[0] || "UNKNOWN";
};

const matchCardTxn = (e: CardTxnRecord, q: string) => {
  const nq = q.trim().toLowerCase();
  if (!nq) return true;
  // Số tiền → khớp cột số tiền
  const amt = parseSearchAmount(nq);
  if (amt != null && round2(e.netAmount) === amt) return true;
  // Tên → chỉ lọc cột Merchant (không lọc nickname thẻ / card no)
  return (e.merchantName || "").toLowerCase().includes(nq);
};

interface MerchantGroupStat {
  name: string;
  notedUsd: number;
  unnotedUsd: number;
  totalUsd: number;
  notedCount: number;
  unnotedCount: number;
  count: number;
}

const matchExpense = (e: ExpenseRecord, q: string) => {
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
    String(usd),
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(nq);
};

type Mode = "card" | "expense";
type ListTab = "missing" | "matched";

export function ShopifyCostReconcile() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<Mode | null>(null);
  const [cardTxns, setCardTxns] = useState<CardTxnRecord[] | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [page, setPage] = useState(1);
  const [listTab, setListTab] = useState<ListTab>("missing");
  const [search, setSearch] = useState("");

  const { data: gmc = [], isLoading: gmcLoading, refetch } = useQuery({
    queryKey: ["chiPhiExpenses"],
    queryFn: () => getChiPhiExpenses(true),
    staleTime: 30_000,
  });

  const cardResult = useMemo(() => {
    if (mode !== "card" || !cardTxns) return null;
    return reconcileCardTxnsAgainstGmc(cardTxns, gmc);
  }, [mode, cardTxns, gmc]);

  const expenseResult = useMemo(() => {
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

  const filteredCards = useMemo(() => {
    if (!cardResult) return [];
    const src = listTab === "missing" ? cardResult.missing : cardResult.matched;
    return src.filter((e) => matchCardTxn(e, search));
  }, [cardResult, listTab, search]);

  const filteredExpenses = useMemo(() => {
    if (!expenseResult) return [];
    const src = listTab === "missing" ? expenseResult.missing : expenseResult.matched;
    return src.filter((e) => matchExpense(e, search));
  }, [expenseResult, listTab, search]);

  const filteredCount = cardResult ? filteredCards.length : filteredExpenses.length;
  const filteredSum = useMemo(() => {
    if (cardResult) {
      return round2(filteredCards.reduce((s, e) => s + e.netAmount, 0));
    }
    return round2(
      filteredExpenses.reduce((s, e) => s + (e.chiPhiUSD || 0) + (e.chiPhiUSDT || 0), 0),
    );
  }, [cardResult, filteredCards, filteredExpenses]);

  const pageCards = useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filteredCards.slice(start, start + ITEMS);
  }, [filteredCards, page]);

  const pageExpenses = useMemo(() => {
    const start = (page - 1) * ITEMS;
    return filteredExpenses.slice(start, start + ITEMS);
  }, [filteredExpenses, page]);

  const merchantGroups = useMemo((): MerchantGroupStat[] => {
    if (!cardResult) return [];
    const map = new Map<string, MerchantGroupStat>();

    const bump = (t: CardTxnRecord, noted: boolean) => {
      const name = merchantGroupName(t.merchantName);
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
          count: 0,
        };
        map.set(key, row);
      }
      const amt = t.netAmount || 0;
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

    for (const t of cardResult.matched) bump(t, true);
    for (const t of cardResult.missing) bump(t, false);

    return [...map.values()].sort((a, b) => b.totalUsd - a.totalUsd || a.name.localeCompare(b.name));
  }, [cardResult]);

  const clear = () => {
    setMode(null);
    setCardTxns(null);
    setExpenses(null);
    setFileName("");
    setParseError("");
    setPage(1);
    setListTab("missing");
    setSearch("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = async (file: File | null) => {
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
        const rows = await parseExcelRows(file);
        if (rows.length === 0) {
          setParseError(t("shopifyCostUploadEmpty"));
          return;
        }
        const headers = Object.keys(rows[0] || {});
        if (isCardTxnHeaders(headers)) {
          const parsed = parseCardTxnRows(rows);
          if (parsed.length === 0) {
            setParseError(t("shopifyCostUploadEmpty"));
            return;
          }
          setMode("card");
          setCardTxns(parsed);
        } else {
          const parsed = parseExpenseRows(rows);
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
        const rows = parseCardTxnCsvText(text);
        if (rows.length === 0) {
          setParseError(t("shopifyCostUploadEmpty"));
          return;
        }
        setMode("card");
        setCardTxns(rows);
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wide hover:bg-indigo-700 transition-colors"
          >
            {t("shopifyCostUploadBtn")}
          </button>
          {fileName && (
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
              {fileName}
              {mode === "card" ? ` · ${t("shopifyCostFormatCard")}` : null}
            </span>
          )}
          {(cardTxns || expenses) && (
            <button
              type="button"
              onClick={clear}
              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 border border-slate-200 hover:bg-slate-50"
            >
              {t("shopifyCostClear")}
            </button>
          )}
          {gmcLoading && (
            <span className="text-[11px] font-bold text-slate-400 animate-pulse">
              {t("shopifyCostLoadingGmc")}
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
          {t("shopifyCostUploadHint")}
        </p>

        {parseError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm font-bold text-red-600">
            {parseError}
          </div>
        )}

        {hasResult && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                <p className="text-[9px] font-black uppercase text-slate-400">{t("shopifyCostUploaded")}</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{uploadedCount}</p>
                {cardResult && cardResult.skippedCount > 0 && (
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    {t("shopifyCostSkipped")}: {cardResult.skippedCount}
                  </p>
                )}
                <p className="text-[10px] font-bold text-slate-500 mt-2">
                  {t("shopifyCostTotalMoney")}: {fmtUSD(totalUsd)}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                <p className="text-[9px] font-black uppercase text-emerald-600">{t("shopifyCostNotedMoney")}</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{fmtUSD(matchedUsd)}</p>
                <p className="text-[10px] font-bold text-emerald-600/80 mt-2">
                  {matchedCount} {t("records")} · {t("shopifyCostMatched")}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50">
                <p className="text-[9px] font-black uppercase text-rose-600">{t("shopifyCostUnnotedMoney")}</p>
                <p className="text-2xl font-black text-rose-700 mt-1">{fmtUSD(missingUsd)}</p>
                {missingUsdt > 0 && (
                  <p className="text-sm font-black text-rose-600 mt-0.5">{missingUsdt} USDT</p>
                )}
                {missingVnd > 0 && (
                  <p className="text-sm font-black text-rose-600 mt-0.5">
                    {missingVnd.toLocaleString("vi-VN")} VND
                  </p>
                )}
                <p className="text-[10px] font-bold text-rose-500 mt-2">
                  {missingCount} {t("records")} · {t("shopifyCostMissing")}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                <p className="text-[9px] font-black uppercase text-slate-400">{t("shopifyCostGmcRows")}</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{gmcCount}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">{t("shopifyCostMatchHint")}</p>
              </div>
            </div>

            {cardResult && merchantGroups.length > 0 && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {t("shopifyCostMerchantGroups")}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {t("shopifyCostMerchantGroupsHint")}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-3">{t("shopifyCostMerchantGroup")}</th>
                        <th className="p-3 text-right">{t("shopifyCostNotedMoney")}</th>
                        <th className="p-3 text-right">{t("shopifyCostUnnotedMoney")}</th>
                        <th className="p-3 text-right">{t("shopifyCostTotalMoney")}</th>
                        <th className="p-3 text-right">{t("records")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {merchantGroups.map((g) => (
                        <tr
                          key={g.name}
                          className="hover:bg-indigo-50/40 cursor-pointer"
                          onClick={() => {
                            setSearch(g.name);
                            setListTab(g.unnotedCount > 0 ? "missing" : "matched");
                            setPage(1);
                          }}
                        >
                          <td className="p-3">
                            <span className="text-sm font-black text-indigo-700 uppercase">{g.name}</span>
                          </td>
                          <td className="p-3 text-right">
                            <p className="text-sm font-black text-emerald-600">{fmtUSD(g.notedUsd)}</p>
                            <p className="text-[10px] font-bold text-emerald-500/80">{g.notedCount} {t("records")}</p>
                          </td>
                          <td className="p-3 text-right">
                            <p className="text-sm font-black text-rose-600">{fmtUSD(g.unnotedUsd)}</p>
                            <p className="text-[10px] font-bold text-rose-500/80">{g.unnotedCount} {t("records")}</p>
                          </td>
                          <td className="p-3 text-right text-sm font-black text-slate-800">
                            {fmtUSD(g.totalUsd)}
                          </td>
                          <td className="p-3 text-right text-[11px] font-bold text-slate-500">
                            {g.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {missingCount === 0 && listTab === "missing" && matchedCount > 0 ? (
              <div className="px-4 py-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-sm font-bold text-emerald-700">
                {t("shopifyCostAllMatched")}
              </div>
            ) : null}

            {(missingCount > 0 || matchedCount > 0) && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setListTab("missing"); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${listTab === "missing"
                      ? "bg-rose-600 text-white"
                      : "bg-white text-rose-600 border border-rose-200"
                      }`}
                  >
                    {t("shopifyCostUnnotedMoney")} · {fmtUSD(missingUsd)} ({missingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setListTab("matched"); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${listTab === "matched"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-emerald-600 border border-emerald-200"
                      }`}
                  >
                    {t("shopifyCostNotedMoney")} · {fmtUSD(matchedUsd)} ({matchedCount})
                  </button>
                </div>

                <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder={t("shopifyCostSearchPlaceholder")}
                    className="flex-1 min-w-[220px] px-4 py-2.5 text-sm outline-none bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-300"
                  />
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setPage(1); }}
                      className="px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 border border-slate-200 hover:bg-slate-50"
                    >
                      {t("shopifyCostClear")}
                    </button>
                  )}
                  <div className={`px-4 py-2 rounded-xl border min-w-[160px] ${search.trim()
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-slate-50 border-slate-200"
                    }`}>
                    <p className="text-[9px] font-black uppercase text-slate-400">
                      {search.trim() ? t("shopifyCostSearchTotal") : t("shopifyCostListTotal")}
                    </p>
                    <p className="text-lg font-black text-indigo-700">
                      {fmtUSD(filteredSum)}
                      <span className="text-[11px] font-bold text-slate-400 ml-2">
                        ({filteredCount} {t("records")})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {cardResult ? (
                    <table className="w-full text-left min-w-[1100px]">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <th className="p-3">{t("thPaymentDate")}</th>
                          <th className="p-3">{t("shopifyCostTxnId")}</th>
                          <th className="p-3">{t("shopifyCostCard")}</th>
                          <th className="p-3">{t("shopifyCostMerchant")}</th>
                          <th className="p-3">{t("status")}</th>
                          <th className="p-3 text-right">{t("thAmount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pageCards.map((e) => (
                          <tr key={`${listTab}-${e.transactionId}`} className={rowTone}>
                            <td className="p-3 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                              {e.transactionDate || "-"}
                            </td>
                            <td className="p-3 text-[10px] font-mono text-slate-600 max-w-[180px] truncate">
                              {e.transactionId}
                            </td>
                            <td className="p-3">
                              <p className="text-[11px] font-black text-indigo-600 uppercase">
                                {e.cardNickname || "-"}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">{e.cardNo || "-"}</p>
                            </td>
                            <td className="p-3 text-[11px] font-bold text-slate-700 max-w-[260px] truncate">
                              {e.merchantName || "-"}
                            </td>
                            <td className="p-3 text-[10px] font-bold text-slate-500">{e.status || "-"}</td>
                            <td className={`p-3 text-sm font-black text-right whitespace-nowrap ${amountTone}`}>
                              {fmtUSD(e.netAmount)}
                              {e.currency && e.currency !== "USD" ? ` ${e.currency}` : ""}
                            </td>
                          </tr>
                        ))}
                        {pageCards.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center p-10 text-sm text-slate-400">
                              {t("noMatchingRecords")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <th className="p-3">{t("thPaymentDate")}</th>
                          <th className="p-3">{t("thRegistrant")}</th>
                          <th className="p-3">{t("thExpenseType")}</th>
                          <th className="p-3">{t("thWebsite")}</th>
                          <th className="p-3 text-right">{t("thAmount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pageExpenses.map((e, i) => (
                          <tr key={`${listTab}-${e.tenReg}-${e.ngayThanhToan}-${i}`} className={rowTone}>
                            <td className="p-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">{e.ngayThanhToan || "-"}</td>
                            <td className="p-3 text-[11px] font-black text-indigo-600 uppercase">{e.tenReg || "-"}</td>
                            <td className="p-3 text-sm font-bold text-slate-700">{e.loaiChiPhi || "-"}</td>
                            <td className="p-3 text-[11px] font-bold text-slate-600 lowercase truncate max-w-[160px]">{e.tenWeb || "-"}</td>
                            <td className={`p-3 text-sm font-black text-right whitespace-nowrap ${amountTone}`}>
                              {e.chiPhiUSD > 0 ? fmtUSD(e.chiPhiUSD) : e.chiPhiRaw || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <Pagination
                  currentPage={page}
                  totalItems={filteredCount}
                  itemsPerPage={ITEMS}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
