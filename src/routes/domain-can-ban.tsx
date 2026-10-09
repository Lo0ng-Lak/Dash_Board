import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { getLatestWebData, isValidGmcWebDomain } from "@/lib/dataService";
import {
  formatNamecheapExpires,
  namecheapDaysLeft,
  normalizeDomainKey,
  resolveNamecheapDomain,
  type NamecheapDomainInfo,
} from "@/lib/namecheapDomains";
import type { DoAppInfo } from "@/lib/digitaloceanApps";
import type { DomainSaleMark } from "@/lib/domainSaleApi";
import { DevKpiTabs } from "@/components/dev-kpi-tabs";
import { Pagination } from "@/components/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NcStatus = "active" | "expired";
type ViewStatus = NcStatus | "listing" | "sold";
type StatusFilter = ViewStatus | "all" | "in_use";

type SellRow = {
  domain: string;
  tenReg: string;
  webType: string;
  nc?: NamecheapDomainInfo;
  daysLeft: number | null;
  ncStatus: NcStatus;
  appName: string;
};

const isCustomDomain = (domain: string, type: string) =>
  type !== "DEFAULT" && !domain.endsWith(".ondigitalocean.app");

const findAppName = (domain: string, appByDomain: Record<string, string>): string => {
  const key = normalizeDomainKey(domain);
  if (appByDomain[key]) return appByDomain[key];
  const parts = key.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (appByDomain[parent]) return appByDomain[parent];
  }
  return "";
};

const classifyNc = (nc: NamecheapDomainInfo | undefined): NcStatus => {
  if (!nc) return "active";
  if (nc.isExpired) return "expired";
  const left = namecheapDaysLeft(nc.expires);
  if (left !== null && left <= 0) return "expired";
  return "active";
};

const viewStatus = (row: SellRow, marks: Record<string, DomainSaleMark>): ViewStatus => {
  const mark = marks[normalizeDomainKey(row.domain)];
  if (mark === "sold" || mark === "listing") return mark;
  return row.ncStatus;
};

const STATUS_STYLE: Record<ViewStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  expired: "bg-red-50 text-red-600 border-red-100",
  listing: "bg-amber-50 text-amber-700 border-amber-100",
  sold: "bg-slate-100 text-slate-600 border-slate-200",
};

export const Route = createFileRoute("/domain-can-ban")({
  component: DomainCanBanPage,
});

async function loadNamecheapMap(): Promise<Record<string, NamecheapDomainInfo>> {
  const res = await fetch("/api/namecheap/domains");
  const json = (await res.json()) as {
    map?: Record<string, NamecheapDomainInfo>;
    error?: string;
  };
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.map ?? {};
}

async function loadApps(): Promise<DoAppInfo[]> {
  const res = await fetch("/api/app-platform");
  const json = (await res.json()) as { apps?: DoAppInfo[]; error?: string };
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.apps ?? [];
}

async function loadMarks(): Promise<Record<string, DomainSaleMark>> {
  const res = await fetch("/api/domain-sale");
  const json = (await res.json()) as {
    marks?: Record<string, DomainSaleMark>;
    error?: string;
  };
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.marks ?? {};
}

function DomainCanBanPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [regFilter, setRegFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const webQuery = useQuery({
    queryKey: ["regSellWeb"],
    queryFn: () => getLatestWebData(true),
    staleTime: 60_000,
  });
  const ncQuery = useQuery({
    queryKey: ["namecheapDomains"],
    queryFn: loadNamecheapMap,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const appsQuery = useQuery({
    queryKey: ["do-app-platform"],
    queryFn: loadApps,
    staleTime: 60_000,
  });
  const marksQuery = useQuery({
    queryKey: ["domainSaleMarks"],
    queryFn: loadMarks,
    staleTime: 10_000,
  });

  const marks = marksQuery.data ?? {};

  const rows = useMemo<SellRow[]>(() => {
    const web = webQuery.data ?? [];
    const ncMap = ncQuery.data ?? {};
    const apps = appsQuery.data ?? [];
    const appByDomain: Record<string, string> = {};
    for (const app of apps) {
      for (const d of app.domains) {
        if (!isCustomDomain(d.domain, d.type)) continue;
        appByDomain[normalizeDomainKey(d.domain)] = app.name;
      }
    }

    const unique = new Map<string, SellRow>();
    for (const item of web) {
      const domain = String(item.domain ?? "").trim();
      if (!isValidGmcWebDomain(domain)) continue;
      const key = normalizeDomainKey(domain);
      const nc = resolveNamecheapDomain(key, ncMap);
      unique.set(key, {
        domain,
        tenReg: String(item.regBy ?? "").trim() || "—",
        webType: String(item.type ?? "").trim() || "—",
        nc,
        daysLeft: nc ? namecheapDaysLeft(nc.expires) : null,
        ncStatus: classifyNc(nc),
        appName: findAppName(domain, appByDomain),
      });
    }
    return [...unique.values()];
  }, [webQuery.data, ncQuery.data, appsQuery.data]);

  const statusLabel = (s: ViewStatus) => {
    if (s === "listing") return t("domainCanBanListing");
    if (s === "sold") return t("domainCanBanSold");
    if (s === "active") return t("domainCanBanActive");
    return t("domainCanBanExpired");
  };

  const regTabs = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) {
      const name = r.tenReg;
      if (!name || name === "—") continue;
      map[name] = (map[name] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const regPool = useMemo(
    () =>
      regFilter === "all"
        ? rows
        : rows.filter((r) => r.tenReg.toLowerCase() === regFilter.toLowerCase()),
    [rows, regFilter],
  );

  const statusCounts = useMemo(() => {
    const c = { active: 0, expired: 0, listing: 0, sold: 0, in_use: 0 };
    for (const r of regPool) {
      c[viewStatus(r, marks)] += 1;
      if (r.appName) c.in_use += 1;
    }
    return c;
  }, [regPool, marks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = regPool.filter((r) => {
      const vs = viewStatus(r, marks);
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "in_use"
            ? Boolean(r.appName)
            : vs === statusFilter;
      const matchSearch =
        !q ||
        r.domain.toLowerCase().includes(q) ||
        r.tenReg.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
    list = [...list].sort((a, b) => {
      const rank: Record<ViewStatus, number> = { listing: 0, sold: 1, expired: 2, active: 3 };
      const sa = viewStatus(a, marks);
      const sb = viewStatus(b, marks);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      return (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999);
    });
    return list;
  }, [regPool, statusFilter, search, marks]);

  const pageRows = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const markMutation = useMutation({
    mutationFn: async ({ domain, status }: { domain: string; status: DomainSaleMark | null }) => {
      const res = await fetch("/api/domain-sale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, status }),
      });
      const json = (await res.json()) as {
        marks?: Record<string, DomainSaleMark>;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json.marks ?? {};
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["domainSaleMarks"], next);
    },
  });

  const downloadExcel = () => {
    const sheet = filtered.map((r, i) => ({
      STT: i + 1,
      Domain: r.domain,
      "Tên Reg": r.tenReg,
      "Loại web": r.webType,
      "Hạn Namecheap": r.nc ? formatNamecheapExpires(r.nc.expires) : "",
      "Ngày còn lại": r.daysLeft ?? "",
      "Trạng thái": statusLabel(viewStatus(r, marks)),
      "App Platform": r.appName,
    }));
    const ws = XLSX.utils.json_to_sheet(sheet);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Domain can ban");
    XLSX.writeFile(wb, "domain-can-ban.xlsx");
  };

  if (webQuery.isLoading || ncQuery.isLoading || appsQuery.isLoading) {
    return (
      <div className="p-10 text-center font-medium text-slate-400 animate-pulse">
        {t("domainCanBanLoading")}
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              REG
            </p>
            <h1 className="text-3xl font-black tracking-tight">{t("domainCanBanTitle")}</h1>
            <p className="text-slate-500 font-medium text-sm">{t("domainCanBanDesc")}</p>
          </div>
          <button
            type="button"
            onClick={downloadExcel}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t("domainCanBanDownload")}
          </button>
        </div>

        {ncQuery.error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Namecheap: {(ncQuery.error as Error).message}
          </div>
        )}
        {marksQuery.error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {t("domainCanBanSellBtn")}: {(marksQuery.error as Error).message}
          </div>
        )}
        {markMutation.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {(markMutation.error as Error).message}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("domainCanBanUnique")}
            </p>
            <p className="mt-1 text-2xl font-black">{regPool.length}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t("domainCanBanDeduped")}</p>
          </div>
          <div className="rounded-2xl bg-white border border-amber-100 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
              {t("domainCanBanListing")}
            </p>
            <p className="mt-1 text-2xl font-black text-amber-700">{statusCounts.listing}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {t("domainCanBanSold")}
            </p>
            <p className="mt-1 text-2xl font-black">{statusCounts.sold}</p>
          </div>
          <div className="rounded-2xl bg-white border border-emerald-100 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
              {t("domainCanBanActive")}
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-600">{statusCounts.active}</p>
          </div>
          <div className="rounded-2xl bg-white border border-red-100 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
              {t("domainCanBanExpired")}
            </p>
            <p className="mt-1 text-2xl font-black text-red-600">{statusCounts.expired}</p>
          </div>
          <div className="rounded-2xl bg-white border border-sky-100 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">
              {t("domainCanBanInUse")}
            </p>
            <p className="mt-1 text-2xl font-black text-sky-700">{statusCounts.in_use}</p>
          </div>
        </div>

        <DevKpiTabs
          items={regTabs}
          totalCount={rows.length}
          selected={regFilter}
          onSelect={(name) => {
            setRegFilter(name);
            setCurrentPage(1);
          }}
          allLabel={t("domainCanBanAll")}
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", t("domainCanBanAllStatus"), regPool.length],
              ["listing", t("domainCanBanListing"), statusCounts.listing],
              ["sold", t("domainCanBanSold"), statusCounts.sold],
              ["active", t("domainCanBanActive"), statusCounts.active],
              ["expired", t("domainCanBanExpired"), statusCounts.expired],
              ["in_use", t("domainCanBanInUse"), statusCounts.in_use],
            ] as const
          ).map(([id, label, count]) => {
            const active = statusFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setStatusFilter(id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder={t("domainCanBanSearch")}
          className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-amber-200"
        />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[980px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4">{t("domainCanBanColDomain")}</th>
                  <th className="p-4">{t("domainCanBanColReg")}</th>
                  <th className="p-4">{t("domainCanBanColExpiry")}</th>
                  <th className="p-4">{t("domainCanBanColStatus")}</th>
                  <th className="p-4">{t("domainCanBanColApp")}</th>
                  <th className="p-4">{t("domainCanBanColAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageRows.map((r) => {
                  const vs = viewStatus(r, marks);
                  const busy =
                    markMutation.isPending &&
                    markMutation.variables?.domain === normalizeDomainKey(r.domain);
                  return (
                    <tr key={r.domain.toLowerCase()} className="hover:bg-slate-50/60">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-sm lowercase">{r.domain}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                          {r.webType}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-wider inline-block">
                          {r.tenReg}
                        </span>
                      </td>
                      <td className="p-4">
                        {r.nc ? (
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-black ${
                                r.ncStatus === "expired" ? "text-red-600" : "text-slate-700"
                              }`}
                            >
                              {formatNamecheapExpires(r.nc.expires)}
                            </span>
                            {r.daysLeft !== null && (
                              <span
                                className={`text-[9px] font-bold ${
                                  r.daysLeft <= 30 ? "text-red-500" : "text-slate-400"
                                }`}
                              >
                                {r.daysLeft} {t("domainCanBanDays")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300">
                            {t("domainCanBanNotOnNc")}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-wide ${STATUS_STYLE[vs]}`}
                        >
                          {statusLabel(vs)}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-500">{r.appName || "—"}</td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              disabled={busy}
                              className="h-9 px-3 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                            >
                              {busy ? "..." : t("domainCanBanSellBtn")}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={() =>
                                markMutation.mutate({
                                  domain: r.domain,
                                  status: "listing",
                                })
                              }
                            >
                              {t("domainCanBanListing")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                markMutation.mutate({
                                  domain: r.domain,
                                  status: "sold",
                                })
                              }
                            >
                              {t("domainCanBanSold")}
                            </DropdownMenuItem>
                            {vs === "listing" || vs === "sold" ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() =>
                                    markMutation.mutate({
                                      domain: r.domain,
                                      status: null,
                                    })
                                  }
                                >
                                  {t("domainCanBanClearMark")}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-10 text-sm font-medium text-slate-400">
                      {t("domainCanBanEmpty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
