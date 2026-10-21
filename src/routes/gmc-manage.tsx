import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getGMCRegData, isValidGmcWebDomain, parseGmcSusKind } from "@/lib/dataService";
import { parseDmyDate } from "@/lib/kpiWeek";

const domainKey = (domain: string) => domain.toLowerCase().trim();

const daysValue = (value: string) => {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : -1;
};

export const Route = createFileRoute("/gmc-manage")({
  component: GmcManagePage,
});

function GmcManagePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [person, setPerson] = useState("all");

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 30000,
  });

  const uniqueGreen = useMemo(() => {
    const byDomain = new Map<string, { item: (typeof raw)[number]; index: number }>();
    raw.forEach((item, index) => {
      if (!isValidGmcWebDomain(item.domain)) return;
      const key = domainKey(item.domain);
      const prev = byDomain.get(key);
      if (!prev) {
        byDomain.set(key, { item, index });
        return;
      }
      const prevTime = parseDmyDate(prev.item.dateGMC)?.getTime() ?? 0;
      const nextTime = parseDmyDate(item.dateGMC)?.getTime() ?? 0;
      if (nextTime > prevTime || (nextTime === prevTime && index >= prev.index)) {
        byDomain.set(key, { item, index });
      }
    });
    const latest = [...byDomain.values()].map((entry) => entry.item);
    const rows = latest
      .filter((item) => parseGmcSusKind(item.status) === "live")
      .sort((a, b) => daysValue(b.daysGreen) - daysValue(a.daysGreen) || a.domain.localeCompare(b.domain));
    return { rows, seen: latest.length };
  }, [raw]);

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const item of uniqueGreen.rows) {
      const name = item.dev?.trim() || "";
      const key = name.toLowerCase() || "__none__";
      const row = map.get(key) || { name: name || "—", count: 0 };
      row.count += 1;
      map.set(key, row);
    }
    return [...map.entries()]
      .map(([key, row]) => ({ key, ...row }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
  }, [uniqueGreen.rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return uniqueGreen.rows.filter((item) => {
      const key = item.dev?.trim().toLowerCase() || "__none__";
      if (person !== "all" && key !== person) return false;
      if (!q) return true;
      return [item.domain, item.dev, item.status].join(" ").toLowerCase().includes(q);
    });
  }, [uniqueGreen.rows, search, person]);

  return (
    <div className="min-h-full p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">{t("gmcManageTitle")}</h1>
          <p className="text-sm font-medium text-slate-500">{t("gmcManageDesc")}</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400 animate-pulse">{t("loadingSystemData")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl border-t-emerald-500 border-t-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{t("gmcManageUnique")}</p>
                <p className="mt-2 text-4xl font-black text-emerald-600">{uniqueGreen.rows.length}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("gmcManageRows")}</p>
                <p className="mt-2 text-4xl font-black text-slate-800">{uniqueGreen.seen}</p>
                <p className="mt-1 text-xs text-slate-400">{t("gmcManageRowsHint")}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-base font-black">{t("gmcManageByPerson")}</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="text-left p-3">{t("gmcManageColReg")}</th>
                    <th className="text-right p-3">{t("gmcManageUnique")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr
                    className={`cursor-pointer hover:bg-slate-50/70 ${person === "all" ? "bg-slate-50" : ""}`}
                    onClick={() => setPerson("all")}
                  >
                    <td className="p-3 font-bold">{t("gmcManageAllPeople")}</td>
                    <td className="p-3 text-right font-black text-emerald-600">{uniqueGreen.rows.length}</td>
                  </tr>
                  {byPerson.map((row) => (
                    <tr
                      key={row.key}
                      className={`cursor-pointer hover:bg-slate-50/70 ${person === row.key ? "bg-emerald-50/70" : ""}`}
                      onClick={() => setPerson(row.key)}
                    >
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3 text-right font-black">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("gmcManageSearch")}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            />

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Domain</th>
                    <th className="text-left p-3">{t("gmcManageColReg")}</th>
                    <th className="text-left p-3">{t("gmcManageColDate")}</th>
                    <th className="text-left p-3">{t("gmcManageColDays")}</th>
                    <th className="text-left p-3">{t("gmcManageColStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item, i) => (
                    <tr key={domainKey(item.domain)} className="hover:bg-slate-50/70">
                      <td className="p-3 text-slate-400">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-800 lowercase">{item.domain}</td>
                      <td className="p-3 whitespace-nowrap">{item.dev || "—"}</td>
                      <td className="p-3 whitespace-nowrap">{item.dateGMC || "—"}</td>
                      <td className="p-3 whitespace-nowrap">{item.daysGreen || "—"}</td>
                      <td className="p-3">
                        <span className="inline-flex text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {item.status || "Xanh"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">{t("gmcManageEmpty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
