import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fmtMonthShort, getCurrentMonthKey, shiftMonthKey } from "@/lib/kpiWeek";

export interface GmcSalaryRow {
  domain?: string;
  dev: string;
  /** Cột DEV trên KPI TỔNG REG — người làm web của domain này. */
  webDev?: string;
  dateGMC: string;
  status?: string;
  linkAdsEgead?: string;
  /** Cột Số ngày GMC trên KPI TỔNG REG. */
  daysGreen?: string;
}

interface GmcSalarySummaryProps {
  rows: GmcSalaryRow[];
  parseMonth: (dateGmc: string) => string | null;
}

type Member = { label: string; keys: string[] };

/** Nhân viên GMC (cột REG). Nhân viên web (Tài, Chương, Duy) tính sau. */
const SALARY_GROUPS: Member[][] = [
  [
    { label: "Bảo Hân", keys: ["bao han"] },
    { label: "Quốc An", keys: ["quoc an", "an"] },
    { label: "Đình Thịnh", keys: ["dinh thinh", "thinh"] },
    { label: "Vĩnh Long", keys: ["vinh long", "long", "long bmt"] },
  ],
];

const SKIP_NAMES = new Set(["tai", "chuong", "duy", "nv 3", "nv3", "nv 4", "nv4", "nv 5", "nv5", "nv 6", "nv6"]);

/** Lương web: cột DEV trên web reg. */
const WEB_STAFF: Member[] = [
  { label: "Tài", keys: ["tai"] },
  { label: "Chương", keys: ["chuong"] },
  { label: "Duy", keys: ["duy"] },
];

const foldName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

const WEB_SLOT = new Map<string, number>();
WEB_STAFF.forEach((member, index) => {
  WEB_SLOT.set(foldName(member.label), index);
  member.keys.forEach((key) => WEB_SLOT.set(key, index));
});

const SLOT_BY_KEY = new Map<string, { group: number; index: number }>();
SALARY_GROUPS.forEach((group, groupIndex) => {
  group.forEach((member, memberIndex) => {
    const slot = { group: groupIndex, index: memberIndex };
    SLOT_BY_KEY.set(foldName(member.label), slot);
    member.keys.forEach((key) => SLOT_BY_KEY.set(key, slot));
  });
});

/** Xanh và đã link ads Egead hoặc Link ads TA. Không xác minh ads, Chưa link ads Egead, Đã gỡ ads không tính. */
const isPayableLink = (linkAds: string | undefined) => {
  const link = foldName(linkAds ?? "");
  if (!link || link === "-") return false;
  if (link.includes("khong xac minh") || link.includes("chua link") || link.includes("go ads")) return false;
  if (link.includes("da link") && link.includes("egead")) return true;
  return link.includes("link ads ta");
};

const isPayableGmc = (row: GmcSalaryRow) => foldName(row.status ?? "") === "xanh" && isPayableLink(row.linkAdsEgead);

/** Cùng cửa sổ 3 tháng. Dưới 20 ngày = New. 20–90 ngày = 1-3 tháng. Trên 90 ngày = chạy trên 3 tháng. */
const NEW_DAY_LIMIT = 20;
const OVER3_DAY_LIMIT = 90;

const parseDayCount = (value: string | undefined): number | null => {
  const match = String(value ?? "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const days = Number(match[0]);
  return Number.isFinite(days) ? days : null;
};

export function GmcSalarySummary({ rows, parseMonth }: GmcSalarySummaryProps) {
  const { t } = useTranslation();
  const current = getCurrentMonthKey();
  const [monthKey, setMonthKey] = useState(current);
  const [payMode, setPayMode] = useState<"reg" | "web">("reg");

  const windowKeys = useMemo(
    () => [2, 1, 0].map((delta) => shiftMonthKey(monthKey, -delta)),
    [monthKey],
  );
  const windowSet = useMemo(() => new Set(windowKeys), [windowKeys]);
  const rangeLabel = `${fmtMonthShort(windowKeys[0])} – ${fmtMonthShort(windowKeys[2])}`;

  const pickerMonths = useMemo(() => {
    const set = new Set<string>([current]);
    rows.forEach((row) => {
      const month = parseMonth(row.dateGMC);
      if (month && month <= current) set.add(month);
    });
    return [...set].sort((a, b) => b.localeCompare(a)).slice(0, 12);
  }, [rows, parseMonth, current]);

  const tableData = useMemo(() => {
    const empty = () => ({ thisMonth: 0, aged: 0, over3: 0 });
    const counts = SALARY_GROUPS.map((group) => group.map(empty));
    const unmatched = new Map<string, ReturnType<typeof empty>>();
    const webCounts = WEB_STAFF.map(empty);
    const webUnmatched = new Map<string, ReturnType<typeof empty>>();
    const domains: {
      domain: string;
      employee: string;
      dateGMC: string;
      days: number;
      bucket: "thisMonth" | "aged" | "over3";
      order: number;
    }[] = [];
    const webDomains: {
      domain: string;
      dev: string;
      reg: string;
      dateGMC: string;
      days: number;
      bucket: "thisMonth" | "aged" | "over3";
      order: number;
    }[] = [];

    rows.forEach((row) => {
      if (!isPayableGmc(row)) return;
      const month = parseMonth(row.dateGMC);
      if (!month || !windowSet.has(month)) return;
      const days = parseDayCount(row.daysGreen);
      if (days == null) return;
      const bucket = days < NEW_DAY_LIMIT ? "thisMonth" : days <= OVER3_DAY_LIMIT ? "aged" : "over3";

      const dev = row.dev?.trim();
      if (!dev) return;
      const folded = foldName(dev);
      if (SKIP_NAMES.has(folded)) return;
      const slot = SLOT_BY_KEY.get(folded);
      const domain = row.domain?.trim();
      if (domain) {
        domains.push({
          domain,
          employee: slot ? SALARY_GROUPS[slot.group][slot.index].label : dev,
          dateGMC: row.dateGMC,
          days,
          bucket,
          order: slot ? slot.index : 1000,
        });
      }
      if (slot) {
        counts[slot.group][slot.index][bucket] += 1;
        const regLabel = SALARY_GROUPS[slot.group][slot.index].label;
        const rawWeb = row.webDev?.trim() || "";
        const webSlot = rawWeb ? WEB_SLOT.get(foldName(rawWeb)) : undefined;
        const webLabel = webSlot != null ? WEB_STAFF[webSlot].label : rawWeb || "—";
        if (webSlot != null) webCounts[webSlot][bucket] += 1;
        else {
          const extraWeb = webUnmatched.get(webLabel) ?? empty();
          extraWeb[bucket] += 1;
          webUnmatched.set(webLabel, extraWeb);
        }
        if (domain) {
          webDomains.push({
            domain,
            dev: webLabel,
            reg: regLabel,
            dateGMC: row.dateGMC,
            days,
            bucket,
            order: webSlot ?? 1000,
          });
        }
        return;
      }
      const extra = unmatched.get(dev) ?? empty();
      extra[bucket] += 1;
      unmatched.set(dev, extra);
    });

    const groups = SALARY_GROUPS.map((group, groupIndex) => {
      const employeeRows = group.map((member, memberIndex) => {
        const count = counts[groupIndex][memberIndex];
        return {
          label: member.label,
          thisMonth: count.thisMonth,
          aged: count.aged,
          over3: count.over3,
          total: count.thisMonth + count.aged + count.over3,
        };
      });
      const totals = employeeRows.reduce(
        (acc, row) => ({
          thisMonth: acc.thisMonth + row.thisMonth,
          aged: acc.aged + row.aged,
          over3: acc.over3 + row.over3,
          total: acc.total + row.total,
        }),
        { thisMonth: 0, aged: 0, over3: 0, total: 0 },
      );
      return { employeeRows, totals };
    });

    const extraRows = [...unmatched.entries()]
      .map(([dev, count]) => ({ dev, ...count, total: count.thisMonth + count.aged + count.over3 }))
      .sort((a, b) => b.total - a.total || a.dev.localeCompare(b.dev, "vi"));

    domains.sort(
      (a, b) => a.order - b.order || a.days - b.days || a.domain.localeCompare(b.domain),
    );

    const webEmployeeRows = WEB_STAFF.map((member, index) => {
      const count = webCounts[index];
      return {
        label: member.label,
        thisMonth: count.thisMonth,
        aged: count.aged,
        over3: count.over3,
        total: count.thisMonth + count.aged + count.over3,
      };
    });
    const webTotals = webEmployeeRows.reduce(
      (acc, row) => ({
        thisMonth: acc.thisMonth + row.thisMonth,
        aged: acc.aged + row.aged,
        over3: acc.over3 + row.over3,
        total: acc.total + row.total,
      }),
      { thisMonth: 0, aged: 0, over3: 0, total: 0 },
    );
    const webExtraRows = [...webUnmatched.entries()]
      .map(([dev, count]) => ({ dev, ...count, total: count.thisMonth + count.aged + count.over3 }))
      .sort((a, b) => b.total - a.total || a.dev.localeCompare(b.dev, "vi"));
    webDomains.sort(
      (a, b) => a.order - b.order || a.days - b.days || a.domain.localeCompare(b.domain),
    );

    return { groups, extraRows, domains, webEmployeeRows, webTotals, webExtraRows, webDomains };
  }, [rows, parseMonth, windowSet]);

  const bucketLabel = (bucket: "thisMonth" | "aged" | "over3") =>
    bucket === "thisMonth"
      ? t("gmcSalaryColThisMonth")
      : bucket === "aged"
        ? t("gmcSalaryCol1to3")
        : t("gmcSalaryColOver3");

  const bucketClass = (bucket: "thisMonth" | "aged" | "over3") =>
    bucket === "thisMonth"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : bucket === "aged"
        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
        : "bg-slate-100 text-slate-600 border-slate-200";

  const countClass = (n: number) =>
    n > 0 ? "text-slate-900" : "text-slate-300";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {(["reg", "web"] as const).map((mode) => {
          const active = payMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setPayMode(mode)}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all border ${
                active
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {mode === "reg" ? t("salaryModeReg") : t("salaryModeWeb")}
            </button>
          );
        })}
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {payMode === "reg" ? t("gmcSalaryTitle") : t("webSalaryTitle")}
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          {payMode === "reg"
            ? t("gmcSalaryDesc", { month: fmtMonthShort(monthKey), range: rangeLabel })
            : t("webSalaryDesc", { month: fmtMonthShort(monthKey), range: rangeLabel })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {pickerMonths.map((month) => {
          const active = month === monthKey;
          return (
            <button
              key={month}
              type="button"
              onClick={() => setMonthKey(month)}
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-300"
              }`}
            >
              {fmtMonthShort(month)}
            </button>
          );
        })}
      </div>

      {payMode === "reg" && tableData.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 w-[22%]">{t("gmcKpiColEmployee")}</th>
                  <th className="p-4 text-center">{t("gmcSalaryColThisMonth")}</th>
                  <th className="p-4 text-center">{t("gmcSalaryCol1to3")}</th>
                  <th className="p-4 text-center">{t("gmcSalaryColOver3")}</th>
                  <th className="p-4 text-center w-[14%]">{t("gmcSalaryColTotal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {group.employeeRows.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 text-sm font-black text-slate-800">{row.label}</td>
                    <td className={`p-4 text-center text-lg font-black ${countClass(row.thisMonth)}`}>{row.thisMonth}</td>
                    <td className={`p-4 text-center text-lg font-black ${countClass(row.aged)}`}>{row.aged}</td>
                    <td className={`p-4 text-center text-lg font-black ${countClass(row.over3)}`}>{row.over3}</td>
                    <td className={`p-4 text-center text-lg font-black ${countClass(row.total)}`}>{row.total}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t("gmcKpiRowTotal")}
                  </td>
                  <td className="p-4 text-center text-lg font-black text-indigo-600">{group.totals.thisMonth}</td>
                  <td className="p-4 text-center text-lg font-black text-indigo-600">{group.totals.aged}</td>
                  <td className="p-4 text-center text-lg font-black text-indigo-600">{group.totals.over3}</td>
                  <td className="p-4 text-center text-lg font-black text-slate-900">{group.totals.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {payMode === "reg" && (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
            {t("gmcSalaryDomainsTitle")}
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {tableData.domains.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 w-14">#</th>
                <th className="p-4">{t("gmcSalaryColDomain")}</th>
                <th className="p-4">{t("gmcKpiColEmployee")}</th>
                <th className="p-4">{t("gmcSalaryColDate")}</th>
                <th className="p-4 text-center">{t("gmcSalaryColDays")}</th>
                <th className="p-4">{t("gmcSalaryColGroup")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.domains.map((row, index) => (
                <tr key={`${row.domain}-${row.dateGMC}-${index}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 text-xs font-bold text-slate-400">{index + 1}</td>
                  <td className="p-4 text-sm font-black text-slate-800">{row.domain}</td>
                  <td className="p-4 text-sm font-bold text-slate-600">{row.employee}</td>
                  <td className="p-4 text-xs font-bold text-slate-600">{row.dateGMC}</td>
                  <td className="p-4 text-center text-sm font-black text-slate-800">{row.days}</td>
                  <td className="p-4">
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-wide border ${bucketClass(row.bucket)}`}>
                      {bucketLabel(row.bucket)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {payMode === "web" && (
      <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 w-[22%]">{t("gmcKpiColEmployee")}</th>
                <th className="p-4 text-center">{t("gmcSalaryColThisMonth")}</th>
                <th className="p-4 text-center">{t("gmcSalaryCol1to3")}</th>
                <th className="p-4 text-center">{t("gmcSalaryColOver3")}</th>
                <th className="p-4 text-center w-[14%]">{t("gmcSalaryColTotal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.webEmployeeRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 text-sm font-black text-slate-800">{row.label}</td>
                  <td className={`p-4 text-center text-lg font-black ${countClass(row.thisMonth)}`}>{row.thisMonth}</td>
                  <td className={`p-4 text-center text-lg font-black ${countClass(row.aged)}`}>{row.aged}</td>
                  <td className={`p-4 text-center text-lg font-black ${countClass(row.over3)}`}>{row.over3}</td>
                  <td className={`p-4 text-center text-lg font-black ${countClass(row.total)}`}>{row.total}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t("gmcKpiRowTotal")}
                </td>
                <td className="p-4 text-center text-lg font-black text-indigo-600">{tableData.webTotals.thisMonth}</td>
                <td className="p-4 text-center text-lg font-black text-indigo-600">{tableData.webTotals.aged}</td>
                <td className="p-4 text-center text-lg font-black text-indigo-600">{tableData.webTotals.over3}</td>
                <td className="p-4 text-center text-lg font-black text-slate-900">{tableData.webTotals.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
            {t("webSalaryDomainsTitle")}
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {tableData.webDomains.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 w-14">#</th>
                <th className="p-4">{t("gmcSalaryColDomain")}</th>
                <th className="p-4">DEV</th>
                <th className="p-4">REG</th>
                <th className="p-4">{t("gmcSalaryColDate")}</th>
                <th className="p-4 text-center">{t("gmcSalaryColDays")}</th>
                <th className="p-4">{t("gmcSalaryColGroup")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.webDomains.map((row, index) => (
                <tr key={`${row.domain}-${row.dateGMC}-${index}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 text-xs font-bold text-slate-400">{index + 1}</td>
                  <td className="p-4 text-sm font-black text-slate-800">{row.domain}</td>
                  <td className="p-4 text-sm font-bold text-slate-600">{row.dev}</td>
                  <td className="p-4 text-sm font-bold text-slate-600">{row.reg}</td>
                  <td className="p-4 text-xs font-bold text-slate-600">{row.dateGMC}</td>
                  <td className="p-4 text-center text-sm font-black text-slate-800">{row.days}</td>
                  <td className="p-4">
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-1 rounded-lg tracking-wide border ${bucketClass(row.bucket)}`}>
                      {bucketLabel(row.bucket)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {payMode === "reg" && tableData.extraRows.length > 0 && (
        <p className="text-xs font-semibold text-slate-500">
          {t("gmcSalaryUnmatched")}:{" "}
          {tableData.extraRows.map((row) => `${row.dev} (${row.total})`).join(", ")}
        </p>
      )}
      {payMode === "web" && tableData.webExtraRows.length > 0 && (
        <p className="text-xs font-semibold text-slate-500">
          {t("gmcSalaryUnmatched")}:{" "}
          {tableData.webExtraRows.map((row) => `${row.dev} (${row.total})`).join(", ")}
        </p>
      )}
    </div>
  );
}
