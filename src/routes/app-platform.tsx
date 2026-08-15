import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import type { DoAppDomain, DoAppInfo } from "@/lib/digitaloceanApps";

const isCustomDomain = (d: DoAppDomain) =>
    d.type !== "DEFAULT" && !d.domain.endsWith(".ondigitalocean.app");

const customCount = (app: DoAppInfo) => app.domains.filter(isCustomDomain).length;

export const Route = createFileRoute("/app-platform")({
    component: AppPlatformPage,
});

async function loadApps(): Promise<DoAppInfo[]> {
    const res = await fetch("/api/app-platform");
    const json = (await res.json()) as { apps?: DoAppInfo[]; error?: string };
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json.apps ?? [];
}

function downloadAppSheet(app: DoAppInfo) {
    const rows = app.domains.map((d, i) => ({
        STT: i + 1,
        App: app.name,
        "Web Service": app.webService,
        Domain: d.domain,
        Loai: d.primary ? "PRIMARY" : d.type,
        "Live URL": app.liveUrl,
        Region: app.region,
        Size: app.instanceSize,
        Instances: app.instanceCount ?? "",
        GitHub: app.github,
        "App ID": app.id,
        "Tong domain": app.domains.length,
        "Domain custom": customCount(app),
    }));
    const ws = XLSX.utils.json_to_sheet(
        rows.length
            ? rows
            : [
                  {
                      STT: 1,
                      App: app.name,
                      "Web Service": app.webService,
                      Domain: "",
                      Loai: "",
                      "Live URL": app.liveUrl,
                      Region: app.region,
                      Size: app.instanceSize,
                      Instances: app.instanceCount ?? "",
                      GitHub: app.github,
                      "App ID": app.id,
                      "Tong domain": 0,
                      "Domain custom": 0,
                  },
              ],
    );
    ws["!cols"] = [
        { wch: 6 },
        { wch: 24 },
        { wch: 28 },
        { wch: 36 },
        { wch: 12 },
        { wch: 42 },
        { wch: 8 },
        { wch: 22 },
        { wch: 10 },
        { wch: 40 },
        { wch: 38 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Domains");
    XLSX.writeFile(wb, `${app.name}-domains.xlsx`);
}

function AppPlatformPage() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);

    const { data: apps = [], isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ["do-app-platform"],
        queryFn: loadApps,
        staleTime: 60_000,
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return apps;
        return apps.filter((app) => {
            if (app.name.toLowerCase().includes(q)) return true;
            if (app.webService.toLowerCase().includes(q)) return true;
            if (app.liveUrl.toLowerCase().includes(q)) return true;
            if (app.region.toLowerCase().includes(q)) return true;
            return app.domains.some((d) => d.domain.includes(q));
        });
    }, [apps, search]);

    const totalDomains = apps.reduce((n, a) => n + a.domains.length, 0);
    const totalCustom = apps.reduce((n, a) => n + customCount(a), 0);
    const filteredTotal = filtered.reduce((n, a) => n + a.domains.length, 0);
    const filteredCustom = filtered.reduce((n, a) => n + customCount(a), 0);

    const sorted = useMemo(
        () => [...filtered].sort((a, b) => customCount(b) - customCount(a) || b.domains.length - a.domains.length),
        [filtered],
    );

    return (
        <div className="min-h-screen bg-[#F4F7F9] p-6 md:p-8 text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">
                            DigitalOcean
                        </p>
                        <h1 className="text-3xl font-black tracking-tight">{t("appPlatform")}</h1>
                        <p className="text-slate-500 font-medium text-sm">{t("appPlatformDesc")}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        {isFetching ? t("appPlatformRefreshing") : t("appPlatformRefresh")}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("appPlatformApps")}</p>
                        <p className="mt-1 text-2xl font-black">{apps.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("appPlatformColTotal")}</p>
                        <p className="mt-1 text-2xl font-black">{totalDomains}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-sky-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">{t("appPlatformColCustom")}</p>
                        <p className="mt-1 text-2xl font-black text-sky-700">{totalCustom}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t("appPlatformCustomHint")}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("appPlatformShowing")}</p>
                        <p className="mt-1 text-2xl font-black">{filtered.length}</p>
                    </div>
                </div>

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("appPlatformSearch")}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-sky-200"
                />

                {isLoading ? (
                    <div className="p-10 text-center font-medium text-slate-400 animate-pulse">{t("appPlatformLoading")}</div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {(error as Error).message}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 font-medium">
                        {t("appPlatformEmpty")}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <th className="text-left px-4 py-3">{t("appPlatformColApp")}</th>
                                        <th className="text-left px-3 py-3 hidden lg:table-cell">{t("appPlatformColService")}</th>
                                        <th className="text-left px-3 py-3">{t("appPlatformColRegion")}</th>
                                        <th className="text-right px-3 py-3 whitespace-nowrap">{t("appPlatformColTotal")}</th>
                                        <th className="text-right px-3 py-3 whitespace-nowrap">{t("appPlatformColCustom")}</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((app) => {
                                        const open = openId === app.id;
                                        const nCustom = customCount(app);
                                        return (
                                            <Fragment key={app.id}>
                                                <tr className="border-t border-slate-100 hover:bg-slate-50/70">
                                                    <td className="px-4 py-3">
                                                        <button type="button" className="text-left" onClick={() => setOpenId(open ? null : app.id)}>
                                                            <span className="font-black text-slate-900">{app.name}</span>
                                                            <p className="text-xs text-slate-500 truncate max-w-[240px]">{app.liveUrl || "—"}</p>
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-slate-500">{app.webService || "—"}</td>
                                                    <td className="px-3 py-3 text-[11px] font-bold uppercase text-slate-500">{app.region || "—"}</td>
                                                    <td className="px-3 py-3 text-right font-black tabular-nums">{app.domains.length}</td>
                                                    <td className="px-3 py-3 text-right font-black tabular-nums text-sky-700">{nCustom}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadAppSheet(app)}
                                                            className="h-9 px-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wide hover:bg-slate-800"
                                                        >
                                                            {t("appPlatformDownload")}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {open && (
                                                    <tr className="border-t border-slate-50 bg-slate-50/40">
                                                        <td colSpan={6} className="px-4 py-3">
                                                            {app.github && (
                                                                <p className="text-[11px] text-slate-400 mb-2 font-medium">{app.github}</p>
                                                            )}
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {app.domains.map((d) => (
                                                                    <span
                                                                        key={d.domain}
                                                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                                                                            d.primary
                                                                                ? "border-sky-200 bg-sky-50 text-sky-800"
                                                                                : d.type === "DEFAULT"
                                                                                  ? "border-slate-200 bg-slate-50 text-slate-500"
                                                                                  : "border-slate-100 bg-white text-slate-700"
                                                                        }`}
                                                                    >
                                                                        {d.domain}
                                                                        {d.primary && (
                                                                            <span className="text-[9px] font-black uppercase text-sky-600">primary</span>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-black">
                                        <td className="px-4 py-3" colSpan={3}>{t("appPlatformFooterTotal")}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{filteredTotal}</td>
                                        <td className="px-3 py-3 text-right tabular-nums text-sky-700">{filteredCustom}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
