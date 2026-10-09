import { normalizeDomainKey } from "./namecheapDomains";

export type DomainSaleMark = "listing" | "sold";

type KvStore = {
    get(key: string, type: "json"): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
};

type SaleEnv = {
    DOMAIN_SALE_MARKS?: KvStore;
};

const KV_KEY = "marks";

const isMark = (v: unknown): v is DomainSaleMark => v === "listing" || v === "sold";

const readMarks = async (kv: KvStore): Promise<Record<string, DomainSaleMark>> => {
    const raw = await kv.get(KV_KEY, "json");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, DomainSaleMark> = {};
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
        if (isMark(val)) out[normalizeDomainKey(key)] = val;
    }
    return out;
};

export async function handleDomainSaleApi(request: Request, env: unknown): Promise<Response> {
    const kv = (env as SaleEnv).DOMAIN_SALE_MARKS;
    if (!kv) {
        return Response.json({ error: "DOMAIN_SALE_MARKS KV is not bound." }, { status: 500 });
    }

    if (request.method === "GET") {
        return Response.json({ marks: await readMarks(kv) });
    }

    if (request.method !== "PUT") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let body: { domain?: string; status?: DomainSaleMark | null } = {};
    try {
        body = (await request.json()) as { domain?: string; status?: DomainSaleMark | null };
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const domain = normalizeDomainKey(String(body.domain ?? ""));
    if (!domain) return Response.json({ error: "Missing domain" }, { status: 400 });

    const marks = await readMarks(kv);
    if (body.status == null || body.status === ("" as never)) {
        delete marks[domain];
    } else if (isMark(body.status)) {
        marks[domain] = body.status;
    } else {
        return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    await kv.put(KV_KEY, JSON.stringify(marks));
    return Response.json({ marks, domain, status: marks[domain] ?? null });
}
