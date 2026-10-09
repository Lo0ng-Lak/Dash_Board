import {
    listGmailMailboxes,
    readSession,
    refreshGmailAccess,
    saveGmailToken,
    type AuthUser,
} from "./googleAuthApi";

type KvStore = {
    get(key: string, type: "json"): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
};

type GmailEnv = {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    AUTH_SECRET?: string;
    DOMAIN_SALE_MARKS?: KvStore;
};

export type BillKind = "invoice" | "receipt" | "failed" | "subscription" | "order" | "other" | "credit";
export type BillMark = "noted" | "ignored";

export type ShopifyEmailOrder = {
    id: string;
    threadId: string;
    date: string;
    month: string;
    from: string;
    mailbox: string;
    subject: string;
    snippet: string;
    shop: string;
    orderNo: string;
    customer: string;
    amount: number | null;
    gmailUrl: string;
};

export type ShopifyEmailBill = {
    id: string;
    threadId: string;
    date: string;
    month: string;
    from: string;
    to: string;
    mailbox: string;
    subject: string;
    snippet: string;
    shop: string;
    domain: string;
    amount: number | null;
    planAmount: number;
    refundAmount: number;
    currency: string;
    kind: BillKind;
    mark: BillMark | null;
    gmailUrl: string;
};

const KV_MARKS = "shopify_email_bill_marks";
const GMAIL_Q =
    'from:billing@shopify.com (subject:"bill for" OR subject:"Your bill was credited")';

const isCreditSubject = (subject: string) => /your bill was credited/i.test(subject);
const planShopFromSubject = (subject: string) => {
    if (isCreditSubject(subject)) return "";
    const m = subject.match(/\bbill for\s+(.+?)\s*$/i);
    return m?.[1]?.trim() || "";
};
const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });

const headerOf = (headers: { name?: string; value?: string }[] | undefined, name: string) => {
    const n = name.toLowerCase();
    return String(headers?.find((h) => String(h.name || "").toLowerCase() === n)?.value ?? "").trim();
};

const b64urlToUtf8 = (raw: string) => {
    const pad = "=".repeat((4 - (raw.length % 4)) % 4);
    const bin = atob(raw.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
};

type GmailPart = {
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailPart[];
};

const collectText = (part: GmailPart | undefined, out: string[]) => {
    if (!part) return;
    const mime = String(part.mimeType || "").toLowerCase();
    if (part.body?.data && (mime.startsWith("text/plain") || mime.startsWith("text/html") || mime === "")) {
        let text = b64urlToUtf8(part.body.data);
        if (mime.includes("html")) {
            text = text
                .replace(/<style[\s\S]*?<\/style>/gi, " ")
                .replace(/<script[\s\S]*?<\/script>/gi, " ")
                .replace(/<[^>]+>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&#36;/g, "$");
        }
        out.push(text);
    }
    for (const child of part.parts || []) collectText(child, out);
};

const parseAmount = (text: string): { amount: number; currency: string } | null => {
    const labeled = text.match(
        /(?:total|amount|charged|invoice total|payment of|you've been charged|grand total)\s*:?\s*(?:usd|us\$)?\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i,
    );
    const plain = text.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/);
    const usd = text.match(/(?:usd|us\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i);
    const raw = labeled?.[1] || usd?.[1] || plain?.[1];
    if (!raw) return null;
    const amount = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return { amount, currency: "USD" };
};

const hostLabel = (host: string) =>
    host.toLowerCase().replace(/^www\./, "").split(".")[0] || "";

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

/** To: support@psipistar.com / contact@zealits.com → psipistar.com / zealits.com */
const domainFromSupportTo = (toHeader: string) => {
    const emails = [...String(toHeader).matchAll(/([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/gi)];
    for (const m of emails) {
        const local = m[1].toLowerCase();
        if (local === "support" || local === "contact") return m[2].toLowerCase();
    }
    return "";
};

const parsePlanRefund = (credit: boolean, fallback: number | null) => {
    const amt = fallback || 0;
    if (credit) return { planAmount: 0, refundAmount: amt };
    return { planAmount: amt, refundAmount: 0 };
};

const ymFromMs = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const isoFromMs = (ms: number) => new Date(ms).toISOString();

const readMarks = async (env: GmailEnv): Promise<Record<string, BillMark>> => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) return {};
    const raw = await kv.get(KV_MARKS, "json");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, BillMark> = {};
    for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
        if (val === "noted" || val === "ignored") out[id] = val;
    }
    return out;
};

const writeMarks = async (env: GmailEnv, marks: Record<string, BillMark>) => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) throw new Error("KV is not bound.");
    await kv.put(KV_MARKS, JSON.stringify(marks));
};

const gmailGet = async (token: string, path: string) => {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
};

const mapMessage = (
    msg: {
        id?: string;
        threadId?: string;
        snippet?: string;
        internalDate?: string;
        payload?: GmailPart & { headers?: { name?: string; value?: string }[] };
    },
    mailbox: string,
    marks: Record<string, BillMark>,
): ShopifyEmailBill | null => {
    const id = String(msg.id || "");
    if (!id) return null;
    const headers = msg.payload?.headers;
    const subject = headerOf(headers, "Subject") || "(no subject)";
    const credit = isCreditSubject(subject);
    const planShop = planShopFromSubject(subject);
    if (!credit && !planShop) return null;

    const from = headerOf(headers, "From");
    const to = headerOf(headers, "To") || headerOf(headers, "Delivered-To") || headerOf(headers, "X-Original-To");
    const ms = Number(msg.internalDate || 0) || Date.now();
    const texts: string[] = [];
    collectText(msg.payload, texts);
    const body = texts.join("\n");
    const parsed = parseAmount(`${subject}\n${msg.snippet || ""}\n${body}`);
    const money = parsePlanRefund(credit, parsed?.amount ?? null);

    let shop = planShop;
    let domain = "";
    if (credit) {
        domain = domainFromSupportTo(to);
        shop = titleCase(hostLabel(domain)) || "—";
    }

    return {
        id,
        threadId: String(msg.threadId || id),
        date: isoFromMs(ms),
        month: ymFromMs(ms),
        from,
        to,
        mailbox,
        subject,
        snippet: String(msg.snippet || "").replace(/\s+/g, " ").trim(),
        shop,
        domain,
        amount: parsed?.amount ?? null,
        planAmount: money.planAmount,
        refundAmount: money.refundAmount,
        currency: parsed?.currency || "USD",
        kind: credit ? "credit" : "invoice",
        mark: marks[id] ?? null,
        gmailUrl: gmailLink(mailbox, String(msg.threadId || id)),
    };
};

const requireUser = async (request: Request, env: GmailEnv): Promise<AuthUser | Response> => {
    const user = await readSession(env as never, request);
    if (!user) return json({ error: "Unauthorized" }, 401);
    return user;
};

type BillsCache = {
    fetchedAt: number;
    mailbox: string;
    query: string;
    days: number;
    year: number | null;
    bills: ShopifyEmailBill[];
};

const gmailLink = (mailbox: string, threadId: string) =>
    `https://mail.google.com/mail/?authuser=${encodeURIComponent(mailbox)}#all/${threadId}`;

const cacheKeyOf = (owner: string, mailbox: string, year: number, days: number) =>
    `gmail_shopify_bills:${owner.toLowerCase()}:${mailbox.toLowerCase()}:${year || `d${days}`}`;
const legacyBillsKey = (owner: string, year: number, days: number) =>
    `gmail_shopify_bills:${owner.toLowerCase()}:${year || `d${days}`}`;
const orderCacheKeyOf = (owner: string, mailbox: string, year: number) =>
    `gmail_shopify_orders:${owner.toLowerCase()}:${mailbox.toLowerCase()}:${year || "all"}`;
const legacyOrdersKey = (owner: string, year: number) =>
    `gmail_shopify_orders:${owner.toLowerCase()}:${year || "all"}`;

const ORDER_GMAIL_Q = 'subject:"Order #" subject:"placed by"';

const parseOrderSubject = (subject: string) => {
    const clean = subject.replace(/\s+/g, " ").trim();
    const m = clean.match(/\[([^\]]+)\]\s*Order\s+(#?[A-Za-z0-9_-]+)\s+placed by\s+(.+)$/i);
    if (!m) return null;
    const rawNo = m[2].trim();
    const customer = m[3].replace(/\s*(?:->|–|—)\s*.+$/, "").trim();
    if (!customer) return null;
    return {
        shop: m[1].trim(),
        orderNo: rawNo.startsWith("#") ? rawNo : `#${rawNo}`,
        customer,
    };
};

const parseOrderTotal = (text: string) => {
    const labeled = text.match(
        /(?:grand\s+)?total(?:\s+price)?\s*:?\s*(?:usd|us\$)?\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i,
    );
    if (!labeled?.[1] || /subtotal/i.test(labeled[0])) {
        const all = [...text.matchAll(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/g)];
        const last = all[all.length - 1]?.[1];
        const n = last ? Number(last.replace(/,/g, "")) : 0;
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    const n = Number(labeled[1].replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
};

const readBillsCache = async (env: GmailEnv, key: string): Promise<BillsCache | null> => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) return null;
    const raw = await kv.get(key, "json");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const rec = raw as BillsCache;
    if (!Array.isArray(rec.bills) || !rec.fetchedAt) return null;
    return rec;
};

const writeBillsCache = async (env: GmailEnv, key: string, rec: BillsCache) => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) return;
    await kv.put(key, JSON.stringify(rec));
};

const readScopedCache = async (env: GmailEnv, key: string, legacyKey: string, mailbox: string): Promise<BillsCache | null> => {
    const hit = await readBillsCache(env, key);
    if (hit) return hit;
    const legacy = await readBillsCache(env, legacyKey);
    if (!legacy) return null;
    const box = String(legacy.mailbox || "").toLowerCase();
    if (!box || box !== mailbox.toLowerCase()) return null;
    const migrated = { ...legacy, mailbox: mailbox.toLowerCase() };
    await writeBillsCache(env, key, migrated);
    return migrated;
};

const deleteBillsCache = async (env: GmailEnv, owner: string, mailbox?: string) => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) return;
    const boxes = mailbox
        ? [mailbox.toLowerCase()]
        : (await listGmailMailboxes(env as never, owner)).map((rec) => rec.mailbox.toLowerCase());
    for (const box of boxes) {
        await kv.put(cacheKeyOf(owner, box, 2026, 400), JSON.stringify(null));
        await kv.put(orderCacheKeyOf(owner, box, 2026), JSON.stringify(null));
    }
    const legacyBills = await readBillsCache(env, legacyBillsKey(owner, 2026, 400));
    if (!mailbox || !legacyBills?.mailbox || legacyBills.mailbox.toLowerCase() === mailbox.toLowerCase()) {
        await kv.put(legacyBillsKey(owner, 2026, 400), JSON.stringify(null));
    }
    const legacyOrders = await readBillsCache(env, legacyOrdersKey(owner, 2026));
    if (!mailbox || !legacyOrders?.mailbox || legacyOrders.mailbox.toLowerCase() === mailbox.toLowerCase()) {
        await kv.put(legacyOrdersKey(owner, 2026), JSON.stringify(null));
    }
};

const applyMarks = (bills: ShopifyEmailBill[], marks: Record<string, BillMark>) =>
    bills.map((b) => ({ ...b, mark: marks[b.id] ?? null }));

type MailWarning = { mailbox: string; error: string };

const gmailErrorText = (data: unknown) => {
    const err = String((data as { error?: { message?: string } })?.error?.message || "Gmail API lỗi");
    return /has not been used|disabled|access not configured/i.test(err)
        ? "Bật Gmail API trong Google Cloud Console cho OAuth client này."
        : err;
};

const withGmailLink = <T extends { mailbox: string; threadId: string; id: string; gmailUrl: string }>(row: T): T => ({
    ...row,
    gmailUrl: row.mailbox ? gmailLink(row.mailbox, row.threadId || row.id) : row.gmailUrl,
});

const pickMailboxes = async (env: GmailEnv, owner: string, raw: string) => {
    const all = await listGmailMailboxes(env as never, owner);
    const want = raw.trim().toLowerCase();
    const selected = !want || want === "all" ? all : all.filter((rec) => rec.mailbox.toLowerCase() === want);
    return { all, selected, filter: !want || want === "all" ? "all" : want };
};

const listMessageIds = async (token: string, q: string, maxResults: number) => {
    const ids: string[] = [];
    let pageToken = "";
    while (ids.length < maxResults) {
        const pageSize = Math.min(100, maxResults - ids.length);
        const path = `messages?q=${encodeURIComponent(q)}&maxResults=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ""}`;
        const listed = await gmailGet(token, path);
        if (!listed.ok) return { ids, error: gmailErrorText(listed.data) };
        const batch = ((listed.data as { messages?: { id: string }[]; nextPageToken?: string }).messages || [])
            .map((m) => m.id)
            .filter(Boolean);
        ids.push(...batch);
        pageToken = String((listed.data as { nextPageToken?: string }).nextPageToken || "");
        if (!pageToken || batch.length === 0) break;
    }
    return { ids, error: "" };
};

const billsPayload = (
    bills: ShopifyEmailBill[],
    extra: {
        mailbox: string;
        mailboxes: string[];
        warnings: MailWarning[];
        query: string;
        days: number;
        year: number | null;
        fetchedAt: number;
        cached: boolean;
    },
) => {
    const totalUsd = bills.reduce((s, b) => s + (b.kind === "failed" ? 0 : b.amount || 0), 0);
    const failedUsd = bills.reduce((s, b) => s + (b.kind === "failed" ? b.amount || 0 : 0), 0);
    const notedUsd = bills.reduce((s, b) => s + (b.mark === "noted" ? b.amount || 0 : 0), 0);
    const planUsd = bills.reduce((s, b) => s + (b.kind === "failed" ? 0 : b.planAmount || 0), 0);
    const refundUsd = bills.reduce((s, b) => s + (b.refundAmount || 0), 0);
    return json({
        connected: true,
        mailbox: extra.mailbox,
        mailboxes: extra.mailboxes,
        warnings: extra.warnings,
        query: extra.query,
        days: extra.days,
        year: extra.year,
        fetchedAt: extra.fetchedAt,
        cached: extra.cached,
        bills,
        totals: {
            count: bills.length,
            totalUsd,
            planUsd,
            refundUsd,
            failedUsd,
            notedUsd,
            openUsd: bills.reduce((s, b) => s + (!b.mark && b.kind !== "failed" ? b.amount || 0 : 0), 0),
        },
    });
};

const listBills = async (request: Request, env: GmailEnv, user: AuthUser) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") || 0);
    const days = Math.min(400, Math.max(30, Number(url.searchParams.get("days") || (year ? 400 : 180))));
    const refresh = url.searchParams.get("refresh") === "1";
    const maxResults = Math.min(250, Math.max(10, Number(url.searchParams.get("limit") || (year ? 200 : 60))));
    const q = year
        ? `${GMAIL_Q} after:${year}/01/01 before:${year + 1}/01/01`
        : `${GMAIL_Q} newer_than:${days}d`;
    const { all, selected, filter } = await pickMailboxes(env, user.email, url.searchParams.get("mailbox") || "all");
    if (!all.length) return json({ error: "Chưa kết nối Gmail.", code: "not_connected", connected: false }, 409);
    if (!selected.length) return json({ error: "Không thấy hộp thư này.", code: "unknown_mailbox", connected: true, mailboxes: all.map((r) => r.mailbox) }, 404);

    const marks = await readMarks(env);
    const parts = await Promise.all(selected.map(async (box) => {
        const cacheKey = cacheKeyOf(user.email, box.mailbox, year, days);
        if (!refresh) {
            const cached = await readScopedCache(env, cacheKey, legacyBillsKey(user.email, year, days), box.mailbox);
            if (cached) {
                return {
                    bills: applyMarks(cached.bills, marks).map(withGmailLink),
                    fetchedAt: cached.fetchedAt,
                    cached: true,
                    error: "",
                };
            }
        }
        const access = await refreshGmailAccess(env as never, user.email, box.mailbox);
        if ("error" in access) return { bills: [] as ShopifyEmailBill[], fetchedAt: 0, cached: false, error: access.error };
        const listed = await listMessageIds(access.token, q, maxResults);
        if (listed.error) return { bills: [] as ShopifyEmailBill[], fetchedAt: 0, cached: false, error: listed.error };
        const bills: ShopifyEmailBill[] = [];
        for (let i = 0; i < listed.ids.length; i += 8) {
            const chunk = listed.ids.slice(i, i + 8);
            const rows = await Promise.all(chunk.map(async (id) => {
                const got = await gmailGet(access.token, `messages/${id}?format=full`);
                if (!got.ok) return null;
                return mapMessage(got.data as never, access.mailbox, marks);
            }));
            for (const row of rows) if (row) bills.push(row);
        }
        const fetchedAt = Date.now();
        await writeBillsCache(env, cacheKey, {
            fetchedAt,
            mailbox: access.mailbox,
            query: q,
            days,
            year: year || null,
            bills,
        });
        return { bills, fetchedAt, cached: false, error: "" };
    }));

    const warnings = parts.flatMap((part, i) => (part.error ? [{ mailbox: selected[i].mailbox, error: part.error }] : []));
    const failed = parts.every((part) => part.error);
    if (failed) {
        return json({ error: warnings[0]?.error || "Gmail API lỗi", code: "gmail_api", connected: true, mailboxes: all.map((r) => r.mailbox), warnings }, 502);
    }
    const bills = parts.flatMap((part) => part.bills).sort((a, b) => b.date.localeCompare(a.date));
    const stamps = parts.map((part) => part.fetchedAt).filter((n) => n > 0);
    return billsPayload(bills, {
        mailbox: filter,
        mailboxes: all.map((r) => r.mailbox),
        warnings,
        query: q,
        days,
        year: year || null,
        fetchedAt: stamps.length ? Math.min(...stamps) : Date.now(),
        cached: parts.every((part) => part.cached || part.error),
    });
};

const updateMark = async (request: Request, env: GmailEnv) => {
    let body: { id?: string; status?: BillMark | null } = {};
    try {
        body = (await request.json()) as { id?: string; status?: BillMark | null };
    } catch {
        return json({ error: "Invalid JSON" }, 400);
    }
    const id = String(body.id || "").trim();
    if (!id) return json({ error: "Missing id" }, 400);
    const marks = await readMarks(env);
    if (body.status === "noted" || body.status === "ignored") marks[id] = body.status;
    else delete marks[id];
    await writeMarks(env, marks);
    return json({ id, status: marks[id] ?? null });
};

const mapOrder = (
    msg: {
        id?: string;
        threadId?: string;
        snippet?: string;
        internalDate?: string;
        payload?: GmailPart & { headers?: { name?: string; value?: string }[] };
    },
    mailbox: string,
): ShopifyEmailOrder | null => {
    const id = String(msg.id || "");
    if (!id) return null;
    const subject = headerOf(msg.payload?.headers, "Subject") || "";
    const parsed = parseOrderSubject(subject);
    if (!parsed) return null;
    const ms = Number(msg.internalDate || 0) || Date.now();
    const snippet = String(msg.snippet || "").replace(/\s+/g, " ").trim();
    return {
        id,
        threadId: String(msg.threadId || id),
        date: isoFromMs(ms),
        month: ymFromMs(ms),
        from: headerOf(msg.payload?.headers, "From"),
        mailbox,
        subject,
        snippet,
        shop: parsed.shop,
        orderNo: parsed.orderNo,
        customer: parsed.customer,
        amount: parseOrderTotal(`${subject}\n${snippet}`),
        gmailUrl: gmailLink(mailbox, String(msg.threadId || id)),
    };
};

const ordersOfCache = (cached: BillsCache) => {
    const extra = cached as BillsCache & { orders?: ShopifyEmailOrder[] };
    return (extra.orders || (cached.bills as unknown as ShopifyEmailOrder[])) as ShopifyEmailOrder[];
};

const listOrders = async (request: Request, env: GmailEnv, user: AuthUser) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") || 2026);
    const refresh = url.searchParams.get("refresh") === "1";
    const maxResults = Math.min(300, Math.max(10, Number(url.searchParams.get("limit") || 250)));
    const q = `${ORDER_GMAIL_Q} after:${year}/01/01 before:${year + 1}/01/01`;
    const { all, selected, filter } = await pickMailboxes(env, user.email, url.searchParams.get("mailbox") || "all");
    if (!all.length) return json({ error: "Chưa kết nối Gmail.", code: "not_connected", connected: false }, 409);
    if (!selected.length) return json({ error: "Không thấy hộp thư này.", code: "unknown_mailbox", connected: true, mailboxes: all.map((r) => r.mailbox) }, 404);

    const parts = await Promise.all(selected.map(async (box) => {
        const cacheKey = orderCacheKeyOf(user.email, box.mailbox, year);
        if (!refresh) {
            const cached = await readScopedCache(env, cacheKey, legacyOrdersKey(user.email, year), box.mailbox);
            if (cached && Array.isArray(ordersOfCache(cached))) {
                return {
                    orders: ordersOfCache(cached).map(withGmailLink),
                    fetchedAt: cached.fetchedAt,
                    cached: true,
                    error: "",
                };
            }
        }
        const access = await refreshGmailAccess(env as never, user.email, box.mailbox);
        if ("error" in access) return { orders: [] as ShopifyEmailOrder[], fetchedAt: 0, cached: false, error: access.error };
        const listed = await listMessageIds(access.token, q, maxResults);
        if (listed.error) return { orders: [] as ShopifyEmailOrder[], fetchedAt: 0, cached: false, error: listed.error };
        const orders: ShopifyEmailOrder[] = [];
        for (let i = 0; i < listed.ids.length; i += 12) {
            const chunk = listed.ids.slice(i, i + 12);
            const rows = await Promise.all(chunk.map(async (id) => {
                const got = await gmailGet(access.token, `messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`);
                if (!got.ok) return null;
                return mapOrder(got.data as never, access.mailbox);
            }));
            for (const row of rows) if (row) orders.push(row);
        }
        const fetchedAt = Date.now();
        await writeBillsCache(env, cacheKey, {
            fetchedAt,
            mailbox: access.mailbox,
            query: q,
            days: 0,
            year,
            bills: orders as never,
            orders,
        } as never);
        return { orders, fetchedAt, cached: false, error: "" };
    }));

    const warnings = parts.flatMap((part, i) => (part.error ? [{ mailbox: selected[i].mailbox, error: part.error }] : []));
    if (parts.every((part) => part.error)) {
        return json({ error: warnings[0]?.error || "Gmail API lỗi", code: "gmail_api", connected: true, mailboxes: all.map((r) => r.mailbox), warnings }, 502);
    }
    const orders = parts.flatMap((part) => part.orders).sort((a, b) => b.date.localeCompare(a.date));
    const stamps = parts.map((part) => part.fetchedAt).filter((n) => n > 0);
    return json({
        connected: true,
        mailbox: filter,
        mailboxes: all.map((r) => r.mailbox),
        warnings,
        query: q,
        year,
        fetchedAt: stamps.length ? Math.min(...stamps) : Date.now(),
        cached: parts.every((part) => part.cached || part.error),
        orders,
        totals: {
            count: orders.length,
            totalUsd: orders.reduce((s, o) => s + (o.amount || 0), 0),
        },
    });
};

export async function handleGmailShopifyApi(request: Request, env: unknown): Promise<Response> {
    const wenv = env as GmailEnv;
    const path = new URL(request.url).pathname;
    const user = await requireUser(request, wenv);
    if (user instanceof Response) return user;

    if (path === "/api/gmail/status") {
        const boxes = await listGmailMailboxes(wenv as never, user.email);
        return json({
            connected: boxes.some((rec) => rec.refreshToken || rec.accessToken),
            mailbox: boxes[0]?.mailbox || "",
            mailboxes: boxes.map((rec) => rec.mailbox),
        });
    }

    if (path === "/api/gmail/disconnect" && request.method === "POST") {
        let mailbox = "";
        try {
            const body = (await request.json()) as { mailbox?: string };
            mailbox = String(body.mailbox || "").trim().toLowerCase();
        } catch {
            mailbox = "";
        }
        const boxes = await listGmailMailboxes(wenv as never, user.email);
        const targets = mailbox ? boxes.filter((rec) => rec.mailbox.toLowerCase() === mailbox) : boxes;
        for (const rec of targets) await deleteBillsCache(wenv, user.email, rec.mailbox);
        await saveGmailToken(wenv as never, user.email, null, mailbox || undefined);
        const left = await listGmailMailboxes(wenv as never, user.email);
        return json({ ok: true, connected: left.length > 0, mailboxes: left.map((rec) => rec.mailbox) });
    }

    if (path === "/api/gmail/shopify-bills") {
        if (request.method === "GET") return listBills(request, wenv, user);
        if (request.method === "PUT") return updateMark(request, wenv);
        return json({ error: "Method not allowed" }, 405);
    }
    if (path === "/api/gmail/shopify-orders") {
        if (request.method === "GET") return listOrders(request, wenv, user);
        return json({ error: "Method not allowed" }, 405);
    }

    return json({ error: "Not found" }, 404);
}
