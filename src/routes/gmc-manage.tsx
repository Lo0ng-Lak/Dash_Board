import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DevKpiTabs } from "@/components/dev-kpi-tabs";
import { getGMCRegData, isValidGmcWebDomain, parseGmcSusKind } from "@/lib/dataService";
import type { ShopifyEmailBill } from "@/lib/gmailShopifyApi";
import { parseDmyDate } from "@/lib/kpiWeek";

const BILL_YEAR = 2026;

const slugKey = (raw: string) =>
  raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/\.myshopify\.com$/, "")
    .split(".")[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const fmtUSD = (n: number) =>
  n % 1 === 0
    ? `$${n.toLocaleString()}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${parseInt(m, 10)}/${y}`;
};

type PlanStat = { latest: number; total: number; months: { month: string; amount: number }[] };

const domainKey = (domain: string) => domain.toLowerCase().trim();

const daysValue = (value: string) => {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : -1;
};

const typeKey = (value: string | undefined) => {
  const raw = (value ?? "").trim();
  if (!raw || raw === "—") return "__none__";
  return raw.toLowerCase();
};

export const Route = createFileRoute("/gmc-manage")({
  component: GmcManagePage,
});

function GmcManagePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [person, setPerson] = useState("all");
  const [webType, setWebType] = useState("all");
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["gmcRegData"],
    queryFn: () => getGMCRegData(true),
    refetchInterval: 30000,
  });

  const statusQ = useQuery({
    queryKey: ["gmailStatus"],
    queryFn: async () => {
      const res = await fetch("/api/gmail/status", { credentials: "include" });
      return (await res.json()) as { connected?: boolean; mailbox?: string; mailboxes?: string[] };
    },
  });

  const mailboxes = statusQ.data?.mailboxes?.length
    ? statusQ.data.mailboxes
    : statusQ.data?.mailbox
      ? [statusQ.data.mailbox]
      : [];
  const mailboxKey = mailboxes.join("|");

  const billsQ = useQuery({
    queryKey: ["shopifyEmailBills", BILL_YEAR, "plan-credit", "all", mailboxKey],
    enabled: !!statusQ.data?.connected,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch(`/api/gmail/shopify-bills?year=${BILL_YEAR}&limit=200&mailbox=all`, { credentials: "include" });
      const json = (await res.json()) as { bills?: ShopifyEmailBill[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Gmail error");
      return json;
    },
  });

  const planBySlug = useMemo(() => {
    const acc = new Map<string, Map<string, number>>();
    for (const bill of billsQ.data?.bills ?? []) {
      if (bill.kind !== "invoice" || !(bill.planAmount > 0)) continue;
      const keys = new Set<string>();
      for (const hint of [bill.domain, bill.shop]) {
        const key = slugKey(hint || "");
        if (key.length >= 3) keys.add(key);
      }
      for (const key of keys) {
        const months = acc.get(key) || new Map<string, number>();
        months.set(bill.month, (months.get(bill.month) || 0) + bill.planAmount);
        acc.set(key, months);
      }
    }
    const out = new Map<string, PlanStat>();
    for (const [key, months] of acc) {
      const list = [...months.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, amount]) => ({ month, amount }));
      out.set(key, {
        latest: list[0]?.amount ?? 0,
        total: list.reduce((sum, row) => sum + row.amount, 0),
        months: list,
      });
    }
    return out;
  }, [billsQ.data]);

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

  const typeLabel = (value: string | undefined) => {
    const raw = (value ?? "").trim();
    if (!raw || raw === "—") return t("gmcManageTypeNone");
    return raw;
  };

  const rowsForPerson = useMemo(
    () => uniqueGreen.rows.filter((item) => webType === "all" || typeKey(item.webType) === webType),
    [uniqueGreen.rows, webType],
  );

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const item of uniqueGreen.rows) {
      const name = item.dev?.trim() || "";
      const key = name.toLowerCase() || "__none__";
      if (!map.has(key)) map.set(key, { name: name || "—", count: 0 });
    }
    for (const item of rowsForPerson) {
      const name = item.dev?.trim() || "";
      const key = name.toLowerCase() || "__none__";
      const row = map.get(key);
      if (row) row.count += 1;
    }
    return [...map.entries()]
      .map(([key, row]) => ({ key, ...row }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
  }, [uniqueGreen.rows, rowsForPerson]);

  const typeTabs = useMemo(() => {
    const map = new Map<string, { name: string; label: string; count: number }>();
    for (const item of uniqueGreen.rows) {
      const key = typeKey(item.webType);
      if (!map.has(key)) map.set(key, { name: key, label: typeLabel(item.webType), count: 0 });
    }
    for (const item of uniqueGreen.rows) {
      const personKey = item.dev?.trim().toLowerCase() || "__none__";
      if (person !== "all" && personKey !== person) continue;
      const row = map.get(typeKey(item.webType));
      if (row) row.count += 1;
    }
    return [...map.values()]
      .filter((row) => row.count > 0 || row.name === webType)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
  }, [uniqueGreen.rows, person, webType, t]);

  const typeTotal = useMemo(
    () => uniqueGreen.rows.filter((item) => person === "all" || (item.dev?.trim().toLowerCase() || "__none__") === person).length,
    [uniqueGreen.rows, person],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsForPerson.filter((item) => {
      const key = item.dev?.trim().toLowerCase() || "__none__";
      if (person !== "all" && key !== person) return false;
      if (!q) return true;
      return [item.domain, item.dev, item.status, item.webType].join(" ").toLowerCase().includes(q);
    });
  }, [rowsForPerson, search, person]);

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
                    <td className="p-3 text-right font-black text-emerald-600">{rowsForPerson.length}</td>
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

            <DevKpiTabs
              items={typeTabs}
              totalCount={typeTotal}
              selected={webType}
              onSelect={setWebType}
              allLabel={t("gmcManageAllTypes")}
            />

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
                    <th className="text-left p-3">{t("gmcManageColType")}</th>
                    <th className="text-left p-3">{t("shopifyPlanFee")}</th>
                    <th className="text-left p-3">{t("gmcManageColReg")}</th>
                    <th className="text-left p-3">{t("gmcManageColDate")}</th>
                    <th className="text-left p-3">{t("gmcManageColDays")}</th>
                    <th className="text-left p-3">{t("gmcManageColStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item, i) => {
                    const planKey = domainKey(item.domain);
                    const plan = planBySlug.get(slugKey(item.domain)) ?? null;
                    const planOpen = openPlan === planKey;
                    return (
                    <Fragment key={planKey}>
                    <tr className="hover:bg-slate-50/70">
                      <td className="p-3 text-slate-400">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-800 lowercase">{item.domain}</td>
                      <td className="p-3 whitespace-nowrap">{typeLabel(item.webType)}</td>
                      <td className="p-3 whitespace-nowrap">
                        {plan ? (
                          <button
                            type="button"
                            onClick={() => setOpenPlan(planOpen ? null : planKey)}
                            className={`text-left rounded-xl px-2 py-1 ${planOpen ? "bg-indigo-50" : "hover:bg-indigo-50"}`}
                          >
                            <span className="block text-sm font-black text-slate-800">{fmtUSD(plan.latest)}</span>
                            <span className="block text-[10px] font-bold text-indigo-500">
                              {t("shopifyPlanMonthCount", { count: plan.months.length })}
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-300">{billsQ.isLoading ? "…" : "—"}</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{item.dev || "—"}</td>
                      <td className="p-3 whitespace-nowrap">{item.dateGMC || "—"}</td>
                      <td className="p-3 whitespace-nowrap">{item.daysGreen || "—"}</td>
                      <td className="p-3">
                        <span className="inline-flex text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {item.status || "Xanh"}
                        </span>
                      </td>
                    </tr>
                    {planOpen && plan && (
                      <tr className="bg-indigo-50/70">
                        <td colSpan={8} className="px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
                            {t("shopifyPlanMonths")} · {fmtUSD(plan.total)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {plan.months.map((row) => (
                              <span key={row.month} className="px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-xs font-bold text-slate-700">
                                {fmtMonth(row.month)} · {fmtUSD(row.amount)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">{t("gmcManageEmpty")}</td>
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
