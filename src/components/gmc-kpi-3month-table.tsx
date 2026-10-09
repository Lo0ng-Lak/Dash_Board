import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseGmcSusKind } from "@/lib/dataService";
import {
  fmtMonthShort,
  getCurrentMonthKey,
  getRecentMonthKeys,
  shiftMonthKey,
} from "@/lib/kpiWeek";
import type { GmcKpiRow } from "@/components/gmc-kpi-summary-table";

interface GmcKpi3MonthTableProps {
  rows: GmcKpiRow[];
  parseMonth: (dateGmc: string) => string | null;
}

type ThreeMonthCounts = {
  gmcNew: number;
  gmc20Plus: number;
  gmcSus: number;
  susMail: number;
  appealingMail: number;
  appealedMail: number;
};

const emptyCounts = (): ThreeMonthCounts => ({
  gmcNew: 0,
  gmc20Plus: 0,
  gmcSus: 0,
  susMail: 0,
  appealingMail: 0,
  appealedMail: 0,
});

const liveTotal = (c: ThreeMonthCounts) => c.gmcNew + c.gmc20Plus;
const anyCount = (c: ThreeMonthCounts) =>
  c.gmcNew + c.gmc20Plus + c.gmcSus + c.susMail + c.appealingMail;

const formatSelectedRange = (keys: string[]): string => {
  const sorted = [...keys].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) return "—";
  if (sorted.length === 1) return fmtMonthShort(sorted[0]);
  const consecutive = sorted.every((m, i) => i === 0 || shiftMonthKey(sorted[i - 1], 1) === m);
  if (consecutive) return `${fmtMonthShort(sorted[0])} – ${fmtMonthShort(sorted[sorted.length - 1])}`;
  return sorted.map(fmtMonthShort).join(", ");
};

const sameMonthSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((m) => sb.has(m));
};

export function GmcKpi3MonthTable({ rows, parseMonth }: GmcKpi3MonthTableProps) {
  const { t } = useTranslation();
  const current = getCurrentMonthKey();
  const recent3 = useMemo(() => getRecentMonthKeys(3, current), [current]);
  const prev3 = useMemo(() => getRecentMonthKeys(3, shiftMonthKey(current, -1)), [current]);
  const [monthKeys, setMonthKeys] = useState<string[]>(() => getRecentMonthKeys(3, getCurrentMonthKey()));
  const monthSet = useMemo(() => new Set(monthKeys), [monthKeys]);
  const rangeLabel = formatSelectedRange(monthKeys);

  const pickerMonths = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const m = parseMonth(r.dateGMC);
      if (m) set.add(m);
    });
    for (let i = 0; i < 12; i++) set.add(shiftMonthKey(current, -i));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [rows, parseMonth, current]);

  const tableData = useMemo(() => {
    const pool = rows.filter((r) => {
      const m = parseMonth(r.dateGMC);
      return m != null && monthSet.has(m);
    });

    const devMap: Record<string, ThreeMonthCounts> = {};

    pool.forEach((r) => {
      const dev = r.dev?.trim() || t("gmcKpiUnassigned");
      if (!devMap[dev]) devMap[dev] = emptyCounts();
      const c = devMap[dev];
      const kind = parseGmcSusKind(r.status ?? "");

      if (kind === "sus") {
        c.gmcSus += 1;
        return;
      }
      if (kind === "sus_mail") {
        c.susMail += 1;
        return;
      }
      if (kind === "appealing_mail") {
        c.appealingMail += 1;
        return;
      }
      if (kind === "appealed_mail") {
        c.appealedMail += 1;
        // còn sống: xếp GMC mới / ≥20 ngày theo số ngày xanh
      } else if (kind !== "live") {
        return;
      }

      const days = r.greenDays;
      if (days !== null && days >= 20) c.gmc20Plus += 1;
      else c.gmcNew += 1;
    });

    const employeeRows = Object.entries(devMap)
      .map(([dev, counts]) => ({
        dev,
        ...counts,
        total: liveTotal(counts),
      }))
      .filter((row) => anyCount(row) > 0)
      .sort((a, b) => (b.total + b.gmcSus + b.susMail + b.appealingMail) - (a.total + a.gmcSus + a.susMail + a.appealingMail) || a.dev.localeCompare(b.dev, "vi"));

    const totals = employeeRows.reduce(
      (acc, row) => ({
        gmcNew: acc.gmcNew + row.gmcNew,
        gmc20Plus: acc.gmc20Plus + row.gmc20Plus,
        gmcSus: acc.gmcSus + row.gmcSus,
        susMail: acc.susMail + row.susMail,
        appealingMail: acc.appealingMail + row.appealingMail,
        appealedMail: acc.appealedMail + row.appealedMail,
        total: acc.total + row.total,
      }),
      { ...emptyCounts(), total: 0 },
    );

    return { employeeRows, totals, poolSize: pool.length };
  }, [rows, parseMonth, monthSet, t]);

  const cell = (n: number) => (n > 0 ? n : "");

  return (
    <section className="rounded-2xl border-2 border-amber-500 shadow-lg overflow-hidden bg-white">
      <div className="px-5 py-4 bg-amber-50 border-b border-amber-200">
        <h2 className="text-base font-black uppercase tracking-widest text-slate-800">
          {t("gmcKpi3MonthTitle")}
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {t("gmcKpi3MonthDesc", { range: rangeLabel })}
        </p>
        <p className="text-[11px] font-medium text-slate-400 mt-2">
          {t("gmcKpi3MonthPickHint")}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => setMonthKeys(recent3)}
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${
              sameMonthSet(monthKeys, recent3)
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-amber-800 border-amber-200 hover:border-amber-400"
            }`}
          >
            {t("gmcKpi3MonthPresetRecent")}
          </button>
          <button
            type="button"
            onClick={() => setMonthKeys(prev3)}
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${
              sameMonthSet(monthKeys, prev3)
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-amber-800 border-amber-200 hover:border-amber-400"
            }`}
          >
            {t("gmcKpi3MonthPresetPrev")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {pickerMonths.map((m) => {
            const active = monthSet.has(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMonthKeys((prev) =>
                    prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a.localeCompare(b)),
                  );
                }}
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${
                  active
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-700"
                }`}
              >
                {fmtMonthShort(m)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto p-1">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-amber-500 text-black">
              <th className="border border-black/30 px-4 py-3 text-left font-black w-[18%]">
                {t("gmcKpiColEmployee")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black">
                {t("gmcKpiColNew")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black">
                {t("gmcKpiCol20Days")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black text-red-900">
                {t("gmcKpiColSus")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black text-orange-950">
                {t("gmcKpiColSusMail")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black text-orange-950">
                {t("gmcKpiColAppealingMail")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black text-emerald-950">
                {t("gmcKpiColAppealedMail")}
              </th>
              <th className="border border-black/30 px-3 py-3 text-center font-black">
                {t("gmcKpiColTotal")}
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.employeeRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-black/30 px-4 py-8 text-center text-slate-500 font-semibold">
                  {t("gmcKpi3MonthEmpty")}
                </td>
              </tr>
            ) : (
              tableData.employeeRows.map((row) => (
                <tr key={row.dev}>
                  <td className="border border-black/30 px-4 py-2.5 font-black uppercase bg-[#E2EFDA] text-slate-800">
                    {row.dev}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]">
                    {cell(row.gmcNew)}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]">
                    {cell(row.gmc20Plus)}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FCE4D6] text-red-700">
                    {cell(row.gmcSus)}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-orange-100 text-orange-800">
                    {cell(row.susMail)}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-orange-100 text-orange-800">
                    {cell(row.appealingMail)}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-emerald-100 text-emerald-800">
                    {cell(row.appealedMail)}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg bg-[#E2EFDA]">
                    {cell(row.total)}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-[#C6EFCE]">
              <td className="border border-black/30 px-4 py-2.5 font-black uppercase text-base">
                {t("gmcKpiRowTotal")}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg">
                {cell(tableData.totals.gmcNew)}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg">
                {cell(tableData.totals.gmc20Plus)}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg text-red-800">
                {cell(tableData.totals.gmcSus)}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg text-orange-800">
                {cell(tableData.totals.susMail)}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg text-orange-800">
                {cell(tableData.totals.appealingMail)}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg text-emerald-800">
                {cell(tableData.totals.appealedMail)}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg">
                {cell(tableData.totals.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
