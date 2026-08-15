import { fetchDigitalOceanApps, type DoAppInfo } from "./digitaloceanApps";

type WorkerEnv = { DIGITALOCEAN_TOKEN?: string };

let cache: { at: number; apps: DoAppInfo[] } | null = null;
const CACHE_MS = 60_000;

export async function handleAppPlatformApi(request: Request, env: unknown): Promise<Response> {
    if (request.method !== "GET") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const token = String((env as WorkerEnv)?.DIGITALOCEAN_TOKEN ?? "").trim();
    if (!token) {
        return Response.json(
            { error: "Missing DIGITALOCEAN_TOKEN. Set wrangler secret DIGITALOCEAN_TOKEN." },
            { status: 500 },
        );
    }

    try {
        const now = Date.now();
        if (cache && now - cache.at < CACHE_MS) {
            return Response.json({ apps: cache.apps, cached: true });
        }
        const apps = await fetchDigitalOceanApps(token);
        cache = { at: now, apps };
        return Response.json({ apps, cached: false });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load App Platform";
        return Response.json({ error: message }, { status: 502 });
    }
}
