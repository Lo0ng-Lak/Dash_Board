import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fmtMonthShort } from "@/lib/kpiWeek";

export interface GmcKpiRow {
  dev: string;
  dateGMC: string;
  greenDays: number | null;
  suspended: boolean;
}

interface GmcKpiSummaryTableProps {
  rows: GmcKpiRow[];
  employees: string[];
  monthKey: string;
  parseMonth: (dateGmc: string) => string | null;
}

type DevKpiCounts = { gmcNew: number; gmc20Plus: number; gmcSus: number };

const emptyCounts = (): DevKpiCounts => ({ gmcNew: 0, gmc20Plus: 0, gmcSus: 0 });

export function GmcKpiSummaryTable({ rows, employees, monthKey, parseMonth }: GmcKpiSummaryTableProps) {
  const { t } = useTranslation();

  const tableData = useMemo(() => {
    const pool = monthKey === "all"
      ? rows
      : rows.filter((r) => parseMonth(r.dateGMC) === monthKey);

    const devMap: Record<string, DevKpiCounts> = {};
    employees.forEach((dev) => {
      devMap[dev] = emptyCounts();
    });

    pool.forEach((r) => {
      const dev = r.dev?.trim();
      if (!dev) return;
      if (!devMap[dev]) devMap[dev] = emptyCounts();

      if (r.suspended) {
        devMap[dev].gmcSus += 1;
        return;
      }

      const days = r.greenDays;
      if (days !== null && days >= 20) {
        devMap[dev].gmc20Plus += 1;
      } else {
        devMap[dev].gmcNew += 1;
      }
    });

    const employeeRows = employees.map((dev) => {
      const { gmcNew, gmc20Plus, gmcSus } = devMap[dev] ?? emptyCounts();
      return { dev, gmcNew, gmc20Plus, gmcSus, total: gmcNew + gmc20Plus };
    });

    const extraDevs = Object.keys(devMap).filter((d) => !employees.includes(d));
    extraDevs.forEach((dev) => {
      const { gmcNew, gmc20Plus, gmcSus } = devMap[dev];
      employeeRows.push({ dev, gmcNew, gmc20Plus, gmcSus, total: gmcNew + gmc20Plus });
    });

    employeeRows.sort(
      (a, b) => (b.total + b.gmcSus) - (a.total + a.gmcSus) || a.dev.localeCompare(b.dev, "vi"),
    );

    const totals = employeeRows.reduce(
      (acc, row) => ({
        gmcNew: acc.gmcNew + row.gmcNew,
        gmc20Plus: acc.gmc20Plus + row.gmc20Plus,
        gmcSus: acc.gmcSus + row.gmcSus,
        total: acc.total + row.total,
      }),
      { gmcNew: 0, gmc20Plus: 0, gmcSus: 0, total: 0 },
    );

    return { employeeRows, totals };
  }, [rows, employees, monthKey, parseMonth]);

  const monthLabel = monthKey === "all" ? t("allMonths") : fmtMonthShort(monthKey);
  const hasRows = tableData.employeeRows.some(
    (row) => row.gmcNew > 0 || row.gmc20Plus > 0 || row.gmcSus > 0,
  );

  return (
    <section className="rounded-2xl border-2 border-[#5B9BD5] shadow-lg overflow-hidden bg-white">
      <div className="px-5 py-4 bg-[#5B9BD5]/10 border-b border-[#5B9BD5]/30">
        <h2 className="text-base font-black uppercase tracking-widest text-slate-800">
          {t("gmcKpiTableTitle")}
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {t("gmcKpiTableDesc", { month: monthLabel })}
        </p>
      </div>

      <div className="overflow-x-auto p-1">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#5B9BD5] text-black">
              <th className="border border-black/30 px-4 py-3 text-left font-black w-[28%]">
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
              <th className="border border-black/30 px-3 py-3 text-center font-black">
                {t("gmcKpiColTotal")}
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasRows ? (
              <tr>
                <td colSpan={5} className="border border-black/30 px-4 py-8 text-center text-slate-500 font-semibold">
                  {t("gmcKpiTableEmpty")}
                </td>
              </tr>
            ) : (
              tableData.employeeRows.map((row) => (
                <tr key={row.dev}>
                  <td className="border border-black/30 px-4 py-2.5 font-black uppercase bg-[#E2EFDA] text-slate-800">
                    {row.dev}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]">
                    {row.gmcNew > 0 ? row.gmcNew : ""}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FFF2CC]">
                    {row.gmc20Plus > 0 ? row.gmc20Plus : ""}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-bold text-lg bg-[#FCE4D6] text-red-700">
                    {row.gmcSus > 0 ? row.gmcSus : ""}
                  </td>
                  <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg bg-[#E2EFDA]">
                    {row.total > 0 ? row.total : ""}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-[#C6EFCE]">
              <td className="border border-black/30 px-4 py-2.5 font-black uppercase text-base">
                {t("gmcKpiRowTotal")}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg">
                {tableData.totals.gmcNew > 0 ? tableData.totals.gmcNew : ""}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg">
                {tableData.totals.gmc20Plus > 0 ? tableData.totals.gmc20Plus : ""}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg text-red-800">
                {tableData.totals.gmcSus > 0 ? tableData.totals.gmcSus : ""}
              </td>
              <td className="border border-black/30 px-3 py-2.5 text-center font-black text-lg">
                {tableData.totals.total > 0 ? tableData.totals.total : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
