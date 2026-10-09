import {
    fetchNamecheapDomainList,
    readNamecheapConfig,
    toDomainMap,
    type NamecheapDomainInfo,
} from "./namecheapDomains";

type WorkerEnv = {
    NAMECHEAP_PROXY_URL?: string;
    NAMECHEAP_PROXY_TOKEN?: string;
};

let cache: { at: number; domains: NamecheapDomainInfo[] } | null = null;
const CACHE_MS = 60 * 60 * 1000;

const fetchViaProxy = async (env: WorkerEnv): Promise<NamecheapDomainInfo[]> => {
    const base = String(env.NAMECHEAP_PROXY_URL ?? "").replace(/\/$/, "");
    const token = String(env.NAMECHEAP_PROXY_TOKEN ?? "").trim();
    if (!base || !token) return [];
    const res = await fetch(`${base}/domains`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const text = await res.text();
    let json: { domains?: NamecheapDomainInfo[]; error?: string } = {};
    try {
        json = JSON.parse(text) as { domains?: NamecheapDomainInfo[]; error?: string };
    } catch {
        throw new Error(`Proxy ${res.status}: ${text.slice(0, 180)}`);
    }
    if (!res.ok) throw new Error(json.error || `Proxy HTTP ${res.status}`);
    return json.domains ?? [];
};

export async function handleNamecheapApi(request: Request, env: unknown): Promise<Response> {
    if (request.method !== "GET") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const wenv = env as WorkerEnv;
    const proxyUrl = String(wenv.NAMECHEAP_PROXY_URL ?? "").trim();
    const cfg = readNamecheapConfig(env);

    if (!proxyUrl && !cfg) {
        return Response.json(
            {
                error:
                    "Missing Namecheap config. Set NAMECHEAP_PROXY_URL or NAMECHEAP_API_USER / API_KEY / CLIENT_IP.",
            },
            { status: 500 },
        );
    }

    try {
        const now = Date.now();
        if (cache && now - cache.at < CACHE_MS) {
            return Response.json({ domains: cache.domains, map: toDomainMap(cache.domains), cached: true });
        }
        const domains = proxyUrl
            ? await fetchViaProxy(wenv)
            : await fetchNamecheapDomainList(cfg!);
        cache = { at: now, domains };
        return Response.json({ domains, map: toDomainMap(domains), cached: false });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load Namecheap domains";
        return Response.json({ error: message }, { status: 502 });
    }
}
