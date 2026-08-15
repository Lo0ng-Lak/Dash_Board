export type DoAppDomain = {
    domain: string;
    type: string;
    primary: boolean;
};

export type DoAppInfo = {
    id: string;
    name: string;
    region: string;
    liveUrl: string;
    defaultIngress: string;
    phase: string;
    webService: string;
    instanceSize: string;
    instanceCount: number | null;
    github: string;
    domains: DoAppDomain[];
};

type DoService = {
    name?: string;
    http_port?: number;
    instance_size_slug?: string;
    instance_count?: number;
    github?: { repo?: string; branch?: string };
};

type DoSpecDomain = {
    domain?: string;
    type?: string;
    primary?: boolean;
    wildcard?: boolean;
};

type DoAppRaw = {
    id?: string;
    live_url?: string;
    default_ingress?: string;
    updated_at?: string;
    region?: { slug?: string };
    active_deployment?: { phase?: string };
    spec?: {
        name?: string;
        services?: DoService[];
        domains?: DoSpecDomain[];
    };
};

const hostFromUrl = (url: string) => {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
};

export const normalizeDoApp = (app: DoAppRaw): DoAppInfo => {
    const services = Array.isArray(app.spec?.services) ? app.spec.services : [];
    const svc = services[0] ?? {};
    const specDomains = Array.isArray(app.spec?.domains) ? app.spec.domains : [];

    const domains: DoAppDomain[] = specDomains
        .map((d) => {
            const type = String(d.type ?? "").toUpperCase();
            const isPrimary = Boolean(d.primary) || type === "PRIMARY";
            return {
                domain: String(d.domain ?? "").trim().toLowerCase(),
                type: isPrimary ? "PRIMARY" : type || "ALIAS",
                primary: isPrimary,
            };
        })
        .filter((d) => d.domain);

    const defaultHost = hostFromUrl(String(app.default_ingress ?? ""));
    if (defaultHost && !domains.some((d) => d.domain === defaultHost.toLowerCase())) {
        domains.unshift({
            domain: defaultHost.toLowerCase(),
            type: "DEFAULT",
            primary: false,
        });
    }

    const github = svc.github?.repo
        ? `${svc.github.repo}${svc.github.branch ? `/${svc.github.branch}` : ""}`
        : "";

    return {
        id: String(app.id ?? ""),
        name: String(app.spec?.name ?? ""),
        region: String(app.region?.slug ?? "").toUpperCase(),
        liveUrl: String(app.live_url ?? app.default_ingress ?? ""),
        defaultIngress: String(app.default_ingress ?? ""),
        phase: String(app.active_deployment?.phase ?? ""),
        webService: String(svc.name ?? ""),
        instanceSize: String(svc.instance_size_slug ?? ""),
        instanceCount: typeof svc.instance_count === "number" ? svc.instance_count : null,
        github,
        domains,
    };
};

export async function fetchDigitalOceanApps(token: string): Promise<DoAppInfo[]> {
    const collected: DoAppRaw[] = [];
    let page = 1;

    for (;;) {
        const res = await fetch(`https://api.digitalocean.com/v2/apps?per_page=100&page=${page}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`DigitalOcean API ${res.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
        }
        const json = (await res.json()) as {
            apps?: DoAppRaw[];
            links?: { pages?: { next?: string } };
        };
        collected.push(...(json.apps ?? []));
        if (!json.links?.pages?.next) break;
        page += 1;
        if (page > 20) break;
    }

    return collected.map(normalizeDoApp).sort((a, b) => a.name.localeCompare(b.name));
}
