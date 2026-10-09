export type NamecheapDomainInfo = {
    name: string;
    expires: string;
    isExpired: boolean;
    autoRenew: boolean;
};

/** Namecheap `Expires` is US MM/DD/YYYY (e.g. 12/04/2026 = 4 Dec 2026). */
export const parseNamecheapExpires = (expires: string): Date | null => {
    const parts = expires.trim().split(/[/\-.]/);
    if (parts.length !== 3) return null;
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
    if (!month || !day || !year) return null;
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
};

/** Display as DD/MM/YYYY to match the rest of the dashboard. */
export const formatNamecheapExpires = (expires: string): string => {
    const d = parseNamecheapExpires(expires);
    if (!d) return expires;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
};

export const namecheapDaysLeft = (expires: string): number | null => {
    const target = parseNamecheapExpires(expires);
    if (!target) return null;
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

type NamecheapEnv = {
    apiUser: string;
    apiKey: string;
    userName: string;
    clientIp: string;
    sandbox?: boolean;
};

const NC_PROD = "https://api.namecheap.com/xml.response";
const NC_SANDBOX = "https://api.sandbox.namecheap.com/xml.response";

const attr = (chunk: string, key: string) => chunk.match(new RegExp(`${key}="([^"]*)"`))?.[1] ?? "";

const parseDomainTags = (xml: string): NamecheapDomainInfo[] => {
    const out: NamecheapDomainInfo[] = [];
    const re = /<Domain\b([^>]*)\/?>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
        const a = m[1];
        const name = attr(a, "Name").toLowerCase();
        if (!name) continue;
        out.push({
            name,
            expires: attr(a, "Expires"),
            isExpired: attr(a, "IsExpired").toLowerCase() === "true",
            autoRenew: attr(a, "AutoRenew").toLowerCase() === "true",
        });
    }
    return out;
};

const parseApiError = (xml: string): string | null => {
    const ipDenied = xml.match(/Invalid request IP:\s*([0-9.]+)/i);
    if (ipDenied) return `Invalid request IP: ${ipDenied[1]}`;
    if (/Status="OK"/i.test(xml)) return null;
    if (!/Status="ERROR"/i.test(xml) && !/<Errors/i.test(xml)) return null;
    const err = xml.match(/<Error[^>]*>([\s\S]*?)<\/Error>/i)?.[1]?.trim();
    return err?.replace(/<[^>]+>/g, "").trim() || null;
};

const parseTotalItems = (xml: string) => {
    const n = xml.match(/<TotalItems>(\d+)<\/TotalItems>/i)?.[1];
    return n ? parseInt(n, 10) : 0;
};

export const normalizeDomainKey = (raw: string) =>
    raw
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0];

export async function fetchNamecheapDomainList(cfg: NamecheapEnv): Promise<NamecheapDomainInfo[]> {
    const base = cfg.sandbox ? NC_SANDBOX : NC_PROD;
    const collected: NamecheapDomainInfo[] = [];
    let page = 1;
    let total = 0;

    do {
        const qs = new URLSearchParams({
            ApiUser: cfg.apiUser,
            ApiKey: cfg.apiKey,
            UserName: cfg.userName,
            ClientIp: cfg.clientIp,
            Command: "namecheap.domains.getList",
            Page: String(page),
            PageSize: "100",
            SortBy: "EXPIREDATE",
        });
        const res = await fetch(`${base}?${qs.toString()}`, { headers: { Accept: "application/xml" } });
        const xml = await res.text();
        const apiErr = parseApiError(xml);
        if (apiErr) throw new Error(apiErr);
        if (!res.ok) {
            throw new Error(`Namecheap HTTP ${res.status}: ${xml.replace(/\s+/g, " ").slice(0, 240)}`);
        }

        collected.push(...parseDomainTags(xml));
        total = parseTotalItems(xml) || collected.length;
        page += 1;
    } while (collected.length < total && page <= 50);

    return collected;
};

export const toDomainMap = (list: NamecheapDomainInfo[]) => {
    const map: Record<string, NamecheapDomainInfo> = {};
    for (const d of list) map[d.name] = d;
    return map;
};

export const resolveNamecheapDomain = (
    domain: string,
    map: Record<string, NamecheapDomainInfo>,
): NamecheapDomainInfo | undefined => {
    const key = normalizeDomainKey(domain);
    if (map[key]) return map[key];
    const parts = key.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
        const parent = parts.slice(i).join(".");
        if (map[parent]) return map[parent];
    }
    return undefined;
};

export type NamecheapConfig = NamecheapEnv;

export const readNamecheapConfig = (env: unknown): NamecheapConfig | null => {
    const e = env as Record<string, string | undefined>;
    const apiUser = String(e.NAMECHEAP_API_USER ?? "").trim();
    const apiKey = String(e.NAMECHEAP_API_KEY ?? "").trim();
    const clientIp = String(e.NAMECHEAP_CLIENT_IP ?? "").trim();
    if (!apiUser || !apiKey || !clientIp) return null;
    return {
        apiUser,
        apiKey,
        userName: String(e.NAMECHEAP_USERNAME ?? apiUser).trim(),
        clientIp,
        sandbox: String(e.NAMECHEAP_SANDBOX ?? "").toLowerCase() === "true",
    };
};
