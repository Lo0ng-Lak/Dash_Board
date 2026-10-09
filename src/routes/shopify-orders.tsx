import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pagination } from "@/components/pagination";
import { MonthFilterTabs } from "@/components/month-filter-tabs";
import { DevKpiTabs } from "@/components/dev-kpi-tabs";
import { getTongHopWebRegs } from "@/lib/dataService";
import type { ShopifyEmailOrder } from "@/lib/gmailShopifyApi";
import { GmailMailboxPicker } from "@/components/gmail-mailbox-picker";

const ITEMS = 15;
const YEAR = 2026;

type OrdersResponse = {
    connected?: boolean;
    mailbox?: string;
    mailboxes?: string[];
    warnings?: { mailbox: string; error: string }[];
    orders?: ShopifyEmailOrder[];
    totals?: { count: number; totalUsd: number };
    fetchedAt?: number;
    error?: string;
};

const fmtUSD = (n: number) =>
    n % 1 === 0
        ? `$${n.toLocaleString()}`
        : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

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

function ShopifyOrdersPage() {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [month, setMonth] = useState("all");
    const [shop, setShop] = useState("all");
    const [reg, setReg] = useState("all");
    const [page, setPage] = useState(1);
    const [box, setBox] = useState("all");

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

    useEffect(() => {
        if (box !== "all" && mailboxes.length > 0 && !mailboxes.includes(box)) setBox("all");
    }, [box, mailboxes]);

    const mailboxKey = mailboxes.join("|");

    const ordersQ = useQuery({
        queryKey: ["shopifyEmailOrders", YEAR, box, mailboxKey],
        enabled: !!statusQ.data?.connected,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const res = await fetch(`/api/gmail/shopify-orders?year=${YEAR}&limit=250&mailbox=${encodeURIComponent(box)}`, { credentials: "include" });
            const json = (await res.json()) as OrdersResponse;
            if (!res.ok) throw new Error(json.error || "Gmail error");
            return json;
        },
    });

    const tongHopQ = useQuery({
        queryKey: ["tongHopWebRegs"],
        queryFn: () => getTongHopWebRegs(true),
        staleTime: 60_000,
    });

    const refreshMut = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/gmail/shopify-orders?year=${YEAR}&limit=250&mailbox=${encodeURIComponent(box)}&refresh=1`, { credentials: "include" });
            const json = (await res.json()) as OrdersResponse;
            if (!res.ok) throw new Error(json.error || "Gmail error");
            return json;
        },
        onSuccess: (data) => qc.setQueryData(["shopifyEmailOrders", YEAR, box, mailboxKey], data),
    });

    const disconnectTarget = box !== "all" ? box : mailboxes.length === 1 ? mailboxes[0] : "";

    const disconnectMut = useMutation({
        mutationFn: async (mailbox: string) => {
            await fetch("/api/gmail/disconnect", {
                method: "POST",
                credentials: "include",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ mailbox }),
            });
        },
        onSuccess: () => {
            setBox("all");
            qc.invalidateQueries({ queryKey: ["gmailStatus"] });
            qc.invalidateQueries({ queryKey: ["shopifyEmailBills"] });
            qc.invalidateQueries({ queryKey: ["shopifyEmailOrders"] });
        },
    });

    const orders = ordersQ.data?.orders ?? [];
    const connected = !!statusQ.data?.connected;
    const showMailbox = box === "all" && mailboxes.length > 1;

    const regByDomain = useMemo(() => {
        const map = new Map<string, string>();
        for (const r of tongHopQ.data ?? []) {
            const key = slugKey(r.domain);
            if (key.length >= 3) map.set(key, r.tenReg);
        }
        return map;
    }, [tongHopQ.data]);

    const yearOrders = useMemo(
        () => orders.filter((o) => o.month.startsWith(`${YEAR}-`)),
        [orders],
    );

    const tenRegOf = (o: ShopifyEmailOrder) => (regByDomain.get(slugKey(o.shop)) || "").trim();
    const matchReg = (o: ShopifyEmailOrder) => {
        if (reg === "all") return true;
        const name = tenRegOf(o);
        if (reg === "__none__") return !name || name === "—";
        return name === reg;
    };

    const regTabs = useMemo(() => {
        const map = new Map<string, number>();
        let none = 0;
        for (const o of yearOrders) {
            const name = tenRegOf(o);
            if (name && name !== "—") map.set(name, (map.get(name) || 0) + 1);
            else none += 1;
        }
        const items = [...map.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "vi"))
            .map(([name, count]) => ({ name, count }));
        if (none) items.push({ name: "__none__", count: none, label: t("shopifyBillsNoReg") });
        return items;
    }, [yearOrders, regByDomain, t]);

    const scopedYearOrders = useMemo(() => yearOrders.filter(matchReg), [yearOrders, reg, regByDomain]);

    const months = useMemo(() => {
        const map: Record<string, number> = {};
        for (const o of scopedYearOrders) map[o.month] = (map[o.month] || 0) + 1;
        return Object.entries(map)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([m, count]) => ({ month: m, count }));
    }, [scopedYearOrders]);

    const shops = useMemo(
        () => [...new Set(scopedYearOrders.map((o) => o.shop).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [scopedYearOrders],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return scopedYearOrders.filter((o) => {
            if (month !== "all" && o.month !== month) return false;
            if (shop !== "all" && o.shop !== shop) return false;
            if (!q) return true;
            const tenReg = tenRegOf(o);
            return [o.shop, o.orderNo, o.customer, o.subject, tenReg, o.mailbox].join(" ").toLowerCase().includes(q);
        });
    }, [scopedYearOrders, month, shop, search, regByDomain]);

    const pageRows = filtered.slice((page - 1) * ITEMS, page * ITEMS);
    const totalUsd = filtered.reduce((s, o) => s + (o.amount || 0), 0);

    return (
        <div className="min-h-full p-8 text-foreground">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{t("shopifyMgmt")}</p>
                        <h1 className="text-3xl font-semibold tracking-tight">{t("shopifyOrdersNav")}</h1>
                        <p className="text-muted-foreground font-medium text-sm">{t("shopifyOrdersDesc")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {connected ? (
                            <>
                                {ordersQ.data?.fetchedAt ? (
                                    <span className="text-xs text-muted-foreground px-3 py-2">
                                        {t("shopifyBillsCachedAt")} {new Date(ordersQ.data.fetchedAt).toLocaleString("vi-VN")}
                                    </span>
                                ) : null}
                                <button
                                    type="button"
                                    disabled={refreshMut.isPending}
                                    onClick={() => refreshMut.mutate()}
                                    className="px-3 py-2 text-sm rounded-xl border border-border bg-card hover:bg-accent disabled:opacity-60"
                                >
                                    {refreshMut.isPending ? t("shopifyBillsScanning") : t("shopifyBillsRefresh")}
                                </button>
                                {disconnectTarget ? (
                                    <button
                                        type="button"
                                        disabled={disconnectMut.isPending}
                                        onClick={() => disconnectMut.mutate(disconnectTarget)}
                                        className="px-3 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-accent disabled:opacity-60"
                                    >
                                        {t("shopifyGmailDisconnectOne")}
                                    </button>
                                ) : null}
                            </>
                        ) : (
                            <a
                                href="/api/auth/gmail?next=/shopify-orders"
                                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm"
                            >
                                {t("shopifyBillsConnect")}
                            </a>
                        )}
                    </div>
                </div>

                {connected && (
                    <GmailMailboxPicker
                        mailboxes={mailboxes}
                        selected={box}
                        onSelect={(next) => {
                            setBox(next);
                            setPage(1);
                        }}
                        addHref="/api/auth/gmail?next=/shopify-orders"
                        addLabel={t("shopifyGmailAdd")}
                        allLabel={t("shopifyGmailAll")}
                    />
                )}

                {!connected && !statusQ.isLoading && (
                    <div className="rounded-2xl border border-border bg-card p-8 space-y-3">
                        <p className="font-semibold">{t("shopifyBillsNeedGmail")}</p>
                        <p className="text-sm text-muted-foreground max-w-2xl">{t("shopifyOrdersNeedHint")}</p>
                    </div>
                )}

                {ordersQ.isError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-medium">
                        {(ordersQ.error as Error).message}
                    </div>
                )}

                {!!ordersQ.data?.warnings?.length && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 p-4 text-sm space-y-1">
                        {ordersQ.data.warnings.map((w) => (
                            <p key={w.mailbox}>{w.mailbox}: {w.error}</p>
                        ))}
                    </div>
                )}

                {connected && yearOrders.length > 0 && (
                    <>
                        <DevKpiTabs
                            items={regTabs}
                            totalCount={yearOrders.length}
                            selected={reg}
                            onSelect={(name) => {
                                setReg(name);
                                setShop("all");
                                setPage(1);
                            }}
                            allLabel={t("allOwners")}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("shopifyOrdersCount")}</p>
                                <p className="mt-2 text-3xl font-semibold">{filtered.length}</p>
                            </div>
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("shopifyOrdersTotal")}</p>
                                <p className="mt-2 text-3xl font-semibold">{fmtUSD(totalUsd)}</p>
                            </div>
                        </div>

                        <MonthFilterTabs
                            items={months}
                            totalWithDate={scopedYearOrders.length}
                            selected={month}
                            onSelect={(m) => {
                                setMonth(m);
                                setPage(1);
                            }}
                            allLabel={t("allMonths")}
                        />

                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder={t("shopifyOrdersSearch")}
                                className="flex-1 h-11 rounded-xl border border-border bg-card px-3 text-sm"
                            />
                            <select
                                value={shop}
                                onChange={(e) => {
                                    setShop(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 rounded-xl border border-border bg-card px-3 text-sm min-w-[180px]"
                            >
                                <option value="all">{t("shopifyOrdersAllShops")}</option>
                                {shops.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="text-left p-3">{t("shopifyBillsDate")}</th>
                                        {showMailbox && <th className="text-left p-3">{t("shopifyGmailCol")}</th>}
                                        <th className="text-left p-3">{t("shopifyBillsDomain")}</th>
                                        <th className="text-left p-3">{t("shopifyBillsReg")}</th>
                                        <th className="text-left p-3">{t("shopifyOrdersNo")}</th>
                                        <th className="text-left p-3">{t("shopifyOrdersCustomer")}</th>
                                        <th className="text-right p-3">{t("shopifyBillsAmount")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((o) => (
                                        <tr key={`${o.mailbox}-${o.id}`} className="border-t border-border/70">
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(o.date)}</td>
                                            {showMailbox && <td className="p-3 text-xs text-muted-foreground break-all">{o.mailbox || "—"}</td>}
                                            <td className="p-3 font-medium">{o.shop}</td>
                                            <td className="p-3 whitespace-nowrap">{regByDomain.get(slugKey(o.shop)) || "—"}</td>
                                            <td className="p-3">
                                                <a href={o.gmailUrl} target="_blank" rel="noreferrer" className="hover:text-primary font-medium">
                                                    {o.orderNo}
                                                </a>
                                            </td>
                                            <td className="p-3">{o.customer}</td>
                                            <td className="p-3 text-right font-semibold">{o.amount != null ? fmtUSD(o.amount) : "—"}</td>
                                        </tr>
                                    ))}
                                    {pageRows.length === 0 && (
                                        <tr>
                                            <td colSpan={showMailbox ? 7 : 6} className="p-8 text-center text-muted-foreground">
                                                {t("shopifyBillsEmpty")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={page}
                            totalItems={filtered.length}
                            itemsPerPage={ITEMS}
                            onPageChange={setPage}
                        />
                    </>
                )}

                {connected && ordersQ.isLoading && (
                    <p className="text-sm text-muted-foreground animate-pulse">{t("shopifyBillsLoading")}</p>
                )}

                {connected && !ordersQ.isLoading && !ordersQ.isError && yearOrders.length === 0 && (
                    <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
                        {t("shopifyBillsEmpty")}
                    </div>
                )}
            </div>
        </div>
    );
}

export const Route = createFileRoute("/shopify-orders")({
    component: ShopifyOrdersPage,
});
