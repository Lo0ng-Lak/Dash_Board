import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pagination } from "@/components/pagination";
import { MonthFilterTabs } from "@/components/month-filter-tabs";
import { DevKpiTabs } from "@/components/dev-kpi-tabs";
import { getGMCRegData, getTongHopWebRegs, parseGmcSusKind } from "@/lib/dataService";
import type { BillKind, BillMark, ShopifyEmailBill } from "@/lib/gmailShopifyApi";
import { GmailMailboxPicker } from "@/components/gmail-mailbox-picker";
import { ExportExcelButton } from "@/components/export-excel-button";
import { downloadExcel } from "@/lib/downloadExcel";

type GmcNote = "xanh" | "sus";

const ITEMS = 12;
const YEAR = 2026;

type BillsResponse = {
    connected?: boolean;
    mailbox?: string;
    mailboxes?: string[];
    warnings?: { mailbox: string; error: string }[];
    bills?: ShopifyEmailBill[];
    totals?: { count: number; totalUsd: number; planUsd: number; refundUsd: number; failedUsd: number; notedUsd: number; openUsd: number };
    fetchedAt?: number;
    cached?: boolean;
    error?: string;
    code?: string;
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

const fmtMonthLabel = (ym: string) => {
    const [, m] = ym.split("-");
    return `Tháng ${Number(m)}`;
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

const buildGmcNotes = (rows: { domain: string; status: string }[]) => {
    const map = new Map<string, GmcNote>();
    for (const r of rows) {
        const key = slugKey(r.domain);
        if (key.length < 3) continue;
        map.set(key, parseGmcSusKind(r.status) === "live" ? "xanh" : "sus");
    }
    return map;
};

const lookupBySlug = <T,>(bill: ShopifyEmailBill, map: Map<string, T>): T | null => {
    for (const hint of [bill.domain, bill.shop]) {
        const key = slugKey(hint || "");
        if (key.length >= 3 && map.has(key)) return map.get(key) ?? null;
    }
    return null;
};

const gmcNoteOf = (bill: ShopifyEmailBill, notes: Map<string, GmcNote>): GmcNote | null =>
    lookupBySlug(bill, notes);

const KIND_STYLE: Record<BillKind, string> = {
    invoice: "bg-rose-50 text-rose-700 border-rose-200",
    receipt: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    subscription: "bg-violet-50 text-violet-700 border-violet-200",
    order: "bg-sky-50 text-sky-700 border-sky-200",
    other: "bg-muted text-muted-foreground border-border",
    credit: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function ShopifyBillsPage() {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [month, setMonth] = useState("all");
    const [kind, setKind] = useState<"all" | BillKind | "open">("all");
    const [gmc, setGmc] = useState<"all" | "xanh" | "sus" | "none">("all");
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

    const billsQ = useQuery({
        queryKey: ["shopifyEmailBills", YEAR, "plan-credit", box, mailboxKey],
        enabled: !!statusQ.data?.connected,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const res = await fetch(`/api/gmail/shopify-bills?year=${YEAR}&limit=200&mailbox=${encodeURIComponent(box)}`, { credentials: "include" });
            const json = (await res.json()) as BillsResponse;
            if (!res.ok) throw new Error(json.error || "Gmail error");
            return json;
        },
    });

    const gmcQ = useQuery({
        queryKey: ["gmcRegKpiTong"],
        queryFn: () => getGMCRegData(true),
        staleTime: 60_000,
    });

    const gmcNotes = useMemo(() => buildGmcNotes(gmcQ.data ?? []), [gmcQ.data]);

    const tongHopQ = useQuery({
        queryKey: ["tongHopWebRegs"],
        queryFn: () => getTongHopWebRegs(true),
        staleTime: 60_000,
    });

    const regByDomain = useMemo(() => {
        const map = new Map<string, string>();
        for (const r of tongHopQ.data ?? []) {
            const key = slugKey(r.domain);
            if (key.length >= 3) map.set(key, r.tenReg);
        }
        return map;
    }, [tongHopQ.data]);

    const refreshMut = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/gmail/shopify-bills?year=${YEAR}&limit=200&mailbox=${encodeURIComponent(box)}&refresh=1`, { credentials: "include" });
            const json = (await res.json()) as BillsResponse;
            if (!res.ok) throw new Error(json.error || "Gmail error");
            return json;
        },
        onSuccess: (data) => qc.setQueryData(["shopifyEmailBills", YEAR, "plan-credit", box, mailboxKey], data),
    });

    const markMut = useMutation({
        mutationFn: async (payload: { id: string; status: BillMark | null }) => {
            const res = await fetch("/api/gmail/shopify-bills", {
                method: "PUT",
                credentials: "include",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Không lưu được trạng thái.");
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["shopifyEmailBills"] }),
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

    const bills = billsQ.data?.bills ?? [];

    const tenRegOf = (b: ShopifyEmailBill) => (lookupBySlug(b, regByDomain) || "").trim();
    const matchReg = (b: ShopifyEmailBill) => {
        if (reg === "all") return true;
        const name = tenRegOf(b);
        if (reg === "__none__") return !name || name === "—";
        return name === reg;
    };

    const yearBills = useMemo(
        () => bills.filter((b) => b.month.startsWith(`${YEAR}-`) && (b.kind === "invoice" || b.kind === "credit")),
        [bills],
    );

    const regTabs = useMemo(() => {
        const map = new Map<string, number>();
        let none = 0;
        for (const b of yearBills) {
            const name = tenRegOf(b);
            if (name && name !== "—") map.set(name, (map.get(name) || 0) + 1);
            else none += 1;
        }
        const items = [...map.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "vi"))
            .map(([name, count]) => ({ name, count }));
        if (none) items.push({ name: "__none__", count: none, label: t("shopifyBillsNoReg") });
        return items;
    }, [yearBills, regByDomain, t]);

    const scopedYearBills = useMemo(() => yearBills.filter(matchReg), [yearBills, reg, regByDomain]);

    const months = useMemo(() => {
        const map: Record<string, number> = {};
        for (const b of scopedYearBills) map[b.month] = (map[b.month] || 0) + 1;
        return Object.entries(map)
            .sort((a, c) => c[0].localeCompare(a[0]))
            .map(([m, count]) => ({ month: m, count }));
    }, [scopedYearBills]);

    const monthMoney = useMemo(() => {
        const map: Record<string, { month: string; planUsd: number; refundUsd: number; planCount: number; refundCount: number }> = {};
        for (const b of scopedYearBills) {
            const row = map[b.month] || { month: b.month, planUsd: 0, refundUsd: 0, planCount: 0, refundCount: 0 };
            if (b.kind === "credit") {
                row.refundUsd += b.refundAmount || 0;
                row.refundCount += 1;
            } else {
                row.planUsd += b.planAmount || 0;
                row.planCount += 1;
            }
            map[b.month] = row;
        }
        return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
    }, [scopedYearBills]);

    const kindTabs = useMemo(() => {
        let invoice = 0;
        let credit = 0;
        for (const b of scopedYearBills) {
            if (b.kind === "credit") credit += 1;
            else invoice += 1;
        }
        return [
            { name: "invoice", count: invoice, label: t("shopifyBillsKindInvoice") },
            { name: "credit", count: credit, label: t("shopifyBillsKind_credit") },
        ];
    }, [scopedYearBills, t]);

    const matchKind = (b: ShopifyEmailBill) => {
        if (kind === "open") return !b.mark && b.kind !== "failed";
        if (kind !== "all") return b.kind === kind;
        return true;
    };

    const matchGmc = (b: ShopifyEmailBill) => {
        if (gmc === "all") return true;
        const note = gmcNoteOf(b, gmcNotes);
        if (gmc === "none") return !note;
        return note === gmc;
    };

    const gmcTabs = useMemo(() => {
        let xanh = 0;
        let sus = 0;
        let none = 0;
        for (const b of bills) {
            if (!matchReg(b)) continue;
            if (month !== "all" && b.month !== month) continue;
            if (kind === "open" && (b.mark || b.kind === "failed")) continue;
            if (kind !== "all" && kind !== "open" && b.kind !== kind) continue;
            const note = gmcNoteOf(b, gmcNotes);
            if (note === "xanh") xanh += 1;
            else if (note === "sus") sus += 1;
            else none += 1;
        }
        return [
            { name: "xanh", count: xanh, label: t("shopifyBillsGmcXanh") },
            { name: "sus", count: sus, label: t("shopifyBillsGmcSus") },
            { name: "none", count: none, label: t("shopifyBillsGmcNone") },
        ];
    }, [bills, month, kind, reg, regByDomain, gmcNotes, t]);

    const mailboxMoney = useMemo(() => {
        return mailboxes.map((mail) => {
            const rows = scopedYearBills.filter((b) => (b.mailbox || "").toLowerCase() === mail.toLowerCase());
            let planUsd = 0;
            let refundUsd = 0;
            let planCount = 0;
            let refundCount = 0;
            for (const b of rows) {
                if (b.kind === "credit") {
                    refundUsd += b.refundAmount || 0;
                    refundCount += 1;
                } else {
                    planUsd += b.planAmount || 0;
                    planCount += 1;
                }
            }
            return { mail, planUsd, refundUsd, planCount, refundCount };
        });
    }, [scopedYearBills, mailboxes]);

    const selectedMoney = useMemo(() => {
        if (month === "all") {
            return monthMoney.reduce(
                (s, r) => ({
                    planUsd: s.planUsd + r.planUsd,
                    refundUsd: s.refundUsd + r.refundUsd,
                    planCount: s.planCount + r.planCount,
                    refundCount: s.refundCount + r.refundCount,
                }),
                { planUsd: 0, refundUsd: 0, planCount: 0, refundCount: 0 },
            );
        }
        return monthMoney.find((r) => r.month === month) || { planUsd: 0, refundUsd: 0, planCount: 0, refundCount: 0 };
    }, [monthMoney, month]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return bills.filter((b) => {
            if (!matchReg(b)) return false;
            if (month !== "all" && b.month !== month) return false;
            if (!matchKind(b)) return false;
            if (!matchGmc(b)) return false;
            if (!q) return true;
            const amt = q.replace(/^\$/, "");
            if (b.amount != null && String(b.amount) === amt) return true;
            const note = gmcNoteOf(b, gmcNotes);
            const noteText = note === "xanh" ? "gmc xanh" : note === "sus" ? "gmc sus" : "";
            const tenReg = lookupBySlug(b, regByDomain) || "";
            return [b.subject, b.from, b.shop, b.snippet, noteText, tenReg, b.mailbox].join(" ").toLowerCase().includes(q);
        });
    }, [bills, search, month, kind, gmc, reg, gmcNotes, regByDomain]);

    const pageRows = filtered.slice((page - 1) * ITEMS, page * ITEMS);

    const connected = !!statusQ.data?.connected;
    const showMailbox = box === "all" && mailboxes.length > 1;

    return (
        <div className="min-h-full p-8 text-foreground">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{t("shopifyMgmt")}</p>
                        <h1 className="text-3xl font-semibold tracking-tight">{t("shopifyBillsNav")}</h1>
                        <p className="text-muted-foreground font-medium text-sm">{t("shopifyBillsDesc")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {connected ? (
                            <>
                                {billsQ.data?.fetchedAt ? (
                                    <span className="text-xs text-muted-foreground px-3 py-2">
                                        {t("shopifyBillsCachedAt")} {new Date(billsQ.data.fetchedAt).toLocaleString("vi-VN")}
                                    </span>
                                ) : null}
                                <ExportExcelButton
                                    disabled={filtered.length === 0}
                                    onClick={() => downloadExcel(`shopify-bills-${month === "all" ? YEAR : month}.xlsx`, [{
                                        name: "Bills",
                                        rows: filtered.map((b) => ({
                                            [t("shopifyBillsDate")]: fmtDate(b.date),
                                            [t("shopifyGmailCol")]: b.mailbox,
                                            [t("shopifyBillsShop")]: b.shop,
                                            [t("shopifyBillsReg")]: lookupBySlug(b, regByDomain) || "",
                                            [t("shopifyBillsGmcNote")]: gmcNoteOf(b, gmcNotes) || "",
                                            [t("shopifyBillsSubject")]: b.subject,
                                            [t("shopifyBillsKind")]: t(`shopifyBillsKind_${b.kind}`),
                                            [t("shopifyBillsAmount")]: b.amount ?? "",
                                            "Link Gmail": b.gmailUrl,
                                        })),
                                    }])}
                                />
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
                                href="/api/auth/gmail?next=/shopify-bills"
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
                        addHref="/api/auth/gmail?next=/shopify-bills"
                        addLabel={t("shopifyGmailAdd")}
                        allLabel={t("shopifyGmailAll")}
                    />
                )}

                {!connected && !statusQ.isLoading && (
                    <div className="rounded-2xl border border-border bg-card p-8 space-y-3">
                        <p className="font-semibold">{t("shopifyBillsNeedGmail")}</p>
                        <p className="text-sm text-muted-foreground max-w-2xl">{t("shopifyBillsNeedGmailHint")}</p>
                    </div>
                )}

                {(billsQ.isError || refreshMut.isError) && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-medium">
                        {((billsQ.error || refreshMut.error) as Error).message}
                    </div>
                )}

                {!!billsQ.data?.warnings?.length && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 p-4 text-sm space-y-1">
                        {billsQ.data.warnings.map((w) => (
                            <p key={w.mailbox}>{w.mailbox}: {w.error}</p>
                        ))}
                    </div>
                )}

                {connected && yearBills.length > 0 && (
                    <>
                        <DevKpiTabs
                            items={regTabs}
                            totalCount={yearBills.length}
                            selected={reg}
                            onSelect={(name) => {
                                setReg(name);
                                setPage(1);
                            }}
                            allLabel={t("allOwners")}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {t("shopifyBillsPlan")} · {month === "all" ? YEAR : fmtMonthLabel(month)}
                                </p>
                                <p className="mt-2 text-3xl font-semibold">{fmtUSD(selectedMoney.planUsd)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{selectedMoney.planCount} {t("shopifyBillsPlanMails")}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                                    {t("shopifyBillsRefund")} · {month === "all" ? YEAR : fmtMonthLabel(month)}
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-emerald-700">{fmtUSD(selectedMoney.refundUsd)}</p>
                                <p className="mt-1 text-xs text-emerald-700/80">{selectedMoney.refundCount} {t("shopifyBillsRefundMails")}</p>
                            </div>
                        </div>

                        {showMailbox && (
                            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                                <div className="px-4 py-3 border-b border-border">
                                    <h2 className="text-base font-semibold">{t("shopifyGmailSplit")} {YEAR}</h2>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                                        <tr>
                                            <th className="text-left p-3">{t("shopifyGmailCol")}</th>
                                            <th className="text-right p-3">{t("shopifyBillsPlan")}</th>
                                            <th className="text-right p-3">{t("shopifyBillsRefund")}</th>
                                            <th className="text-right p-3">{t("shopifyBillsNet")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mailboxMoney.map((row) => (
                                            <tr key={row.mail} className="border-t border-border/70">
                                                <td className="p-3 font-medium break-all">{row.mail}</td>
                                                <td className="p-3 text-right">
                                                    {fmtUSD(row.planUsd)}
                                                    <span className="block text-[11px] text-muted-foreground">{row.planCount} {t("shopifyBillsPlanMails")}</span>
                                                </td>
                                                <td className="p-3 text-right text-emerald-700">
                                                    {fmtUSD(row.refundUsd)}
                                                    <span className="block text-[11px]">{row.refundCount} {t("shopifyBillsRefundMails")}</span>
                                                </td>
                                                <td className="p-3 text-right font-semibold">{fmtUSD(row.planUsd - row.refundUsd)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-border bg-muted/40 font-semibold">
                                            <td className="p-3">{t("shopifyGmailSum")}</td>
                                            <td className="p-3 text-right">{fmtUSD(mailboxMoney.reduce((s, r) => s + r.planUsd, 0))}</td>
                                            <td className="p-3 text-right text-emerald-700">{fmtUSD(mailboxMoney.reduce((s, r) => s + r.refundUsd, 0))}</td>
                                            <td className="p-3 text-right">{fmtUSD(mailboxMoney.reduce((s, r) => s + r.planUsd - r.refundUsd, 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="px-4 py-3 border-b border-border">
                                <h2 className="text-base font-semibold">{t("shopifyBillsMonthSplit")} {YEAR}</h2>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="text-left p-3">{t("shopifyBillsMonth")}</th>
                                        <th className="text-right p-3">{t("shopifyBillsPlan")}</th>
                                        <th className="text-right p-3">{t("shopifyBillsRefund")}</th>
                                        <th className="text-right p-3">{t("shopifyBillsNet")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthMoney.map((r) => (
                                        <tr
                                            key={r.month}
                                            className={`border-t border-border/70 cursor-pointer hover:bg-accent/50 ${month === r.month ? "bg-rose-50/80" : ""}`}
                                            onClick={() => {
                                                setMonth(r.month);
                                                setPage(1);
                                            }}
                                        >
                                            <td className="p-3 font-medium">{fmtMonthLabel(r.month)}</td>
                                            <td className="p-3 text-right">{fmtUSD(r.planUsd)}</td>
                                            <td className="p-3 text-right text-emerald-700">{fmtUSD(r.refundUsd)}</td>
                                            <td className="p-3 text-right">{fmtUSD(r.planUsd - r.refundUsd)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border bg-muted/40 font-semibold">
                                        <td className="p-3">{t("shopifyBillsYearTotal")} {YEAR}</td>
                                        <td className="p-3 text-right">{fmtUSD(monthMoney.reduce((s, r) => s + r.planUsd, 0))}</td>
                                        <td className="p-3 text-right text-emerald-700">{fmtUSD(monthMoney.reduce((s, r) => s + r.refundUsd, 0))}</td>
                                        <td className="p-3 text-right">{fmtUSD(monthMoney.reduce((s, r) => s + r.planUsd - r.refundUsd, 0))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}

                {connected && bills.length > 0 && (
                    <>
                        <MonthFilterTabs
                            items={months}
                            totalWithDate={scopedYearBills.length}
                            selected={month}
                            onSelect={(m) => {
                                setMonth(m);
                                setPage(1);
                            }}
                            allLabel={t("allMonths")}
                        />

                        <DevKpiTabs
                            items={kindTabs}
                            totalCount={scopedYearBills.length}
                            selected={kind}
                            onSelect={(name) => {
                                setKind(name as typeof kind);
                                setPage(1);
                            }}
                            allLabel={t("shopifyBillsKindAll")}
                        />

                        <DevKpiTabs
                            items={gmcTabs}
                            totalCount={gmcTabs.reduce((s, item) => s + item.count, 0)}
                            selected={gmc}
                            onSelect={(name) => {
                                setGmc(name as typeof gmc);
                                setPage(1);
                            }}
                            allLabel={t("shopifyBillsGmcAll")}
                        />

                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder={t("shopifyBillsSearch")}
                                className="flex-1 h-11 rounded-xl border border-border bg-card px-3 text-sm"
                            />
                        </div>

                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="text-left p-3">{t("shopifyBillsDate")}</th>
                                        {showMailbox && <th className="text-left p-3">{t("shopifyGmailCol")}</th>}
                                        <th className="text-left p-3">{t("shopifyBillsShop")}</th>
                                        <th className="text-left p-3 whitespace-nowrap">{t("shopifyBillsReg")}</th>
                                        <th className="text-left p-3 whitespace-nowrap">{t("shopifyBillsGmcNote")}</th>
                                        <th className="text-left p-3">{t("shopifyBillsSubject")}</th>
                                        <th className="text-left p-3 whitespace-nowrap">{t("shopifyBillsKind")}</th>
                                        <th className="text-right p-3">{t("shopifyBillsAmount")}</th>
                                        <th className="text-right p-3">{t("shopifyBillsAction")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((b) => (
                                        <tr key={`${b.mailbox}-${b.id}`} className="border-t border-border/70">
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(b.date)}</td>
                                            {showMailbox && <td className="p-3 text-xs text-muted-foreground break-all">{b.mailbox || "—"}</td>}
                                            <td className="p-3 font-medium">{b.shop}</td>
                                            <td className="p-3 whitespace-nowrap">{lookupBySlug(b, regByDomain) || "—"}</td>
                                            <td className="p-3">
                                                <GmcNoteBadge note={gmcNoteOf(b, gmcNotes)} />
                                            </td>
                                            <td className="p-3">
                                                <a href={b.gmailUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                                                    {b.subject}
                                                </a>
                                                {b.snippet && (
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.snippet}</div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${KIND_STYLE[b.kind]}`}>
                                                    {t(`shopifyBillsKind_${b.kind}`)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-semibold">
                                                {b.amount != null ? fmtUSD(b.amount) : "—"}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    className={`mr-1 px-2 py-1 text-[11px] rounded-lg border ${b.mark === "noted" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                                                    onClick={() => markMut.mutate({ id: b.id, status: b.mark === "noted" ? null : "noted" })}
                                                >
                                                    {t("shopifyBillsNoted")}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`px-2 py-1 text-[11px] rounded-lg border ${b.mark === "ignored" ? "bg-muted text-foreground border-border" : "border-border hover:bg-accent"}`}
                                                    onClick={() => markMut.mutate({ id: b.id, status: b.mark === "ignored" ? null : "ignored" })}
                                                >
                                                    {t("shopifyBillsIgnored")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pageRows.length === 0 && (
                                        <tr>
                                            <td colSpan={showMailbox ? 9 : 8} className="p-8 text-center text-muted-foreground">
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

                {connected && billsQ.isLoading && (
                    <p className="text-sm text-muted-foreground animate-pulse">{t("shopifyBillsLoading")}</p>
                )}
            </div>
        </div>
    );
}

function GmcNoteBadge({ note }: { note: GmcNote | null }) {
    const { t } = useTranslation();
    if (!note) return <span className="text-muted-foreground">—</span>;
    if (note === "xanh") {
        return (
            <span className="inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                {t("shopifyBillsGmcXanh")}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
            {t("shopifyBillsGmcSus")}
        </span>
    );
}

function SummaryCard({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${danger ? "text-red-600" : "text-foreground"}`}>{value}</p>
        </div>
    );
}

export const Route = createFileRoute("/shopify-bills")({
    component: ShopifyBillsPage,
});
