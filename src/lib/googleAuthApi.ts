type KvStore = {
    get(key: string, type: "json"): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
};

type AuthEnv = {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_ALLOWED_EMAILS?: string;
    GOOGLE_ADMIN_EMAILS?: string;
    AUTH_SECRET?: string;
    DOMAIN_SALE_MARKS?: KvStore;
};

export type AuthUser = {
    email: string;
    name: string;
    picture: string;
};

const SESSION_COOKIE = "egead_session";
const LOCAL_ADMIN_USER = "admin";
const LOCAL_ADMIN_EMAIL = "admin@egead.local";
const LOCAL_ADMIN_PASS_SHA256 = "4c05d2ec76a943f30fc9f464a570d785e87cb3dba17207d6c978f57cfd1a3058";
const STATE_COOKIE = "egead_oauth_state";
const KV_ALLOW_KEY = "auth_allowed_emails";
const SESSION_DAYS = 14;

const json = (data: unknown, status = 200, extra?: HeadersInit) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", ...extra },
    });

const parseEmails = (raw: string | undefined): string[] =>
    String(raw ?? "")
        .split(/[,;\n]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes("@"));

const unique = (list: string[]) => Array.from(new Set(list));

const b64urlFromBytes = (bytes: Uint8Array) => {
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const bytesFromB64url = (s: string) => {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
};

const utf8ToB64url = (s: string) => b64urlFromBytes(new TextEncoder().encode(s));
const b64urlToUtf8 = (s: string) => new TextDecoder().decode(bytesFromB64url(s));

const timingSafeEqual = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
};

const hmacSign = async (secret: string, data: string) => {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    return b64urlFromBytes(new Uint8Array(sig));
};

const getCookie = (request: Request, name: string) => {
    const raw = request.headers.get("cookie") ?? "";
    for (const part of raw.split(";")) {
        const [k, ...rest] = part.trim().split("=");
        if (k === name) return decodeURIComponent(rest.join("="));
    }
    return "";
};

const cookieAttrs = (request: Request, maxAge: number) => {
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
};

const authSecret = (env: AuthEnv) =>
    String(env.AUTH_SECRET || env.GOOGLE_CLIENT_SECRET || "").trim();

const readKvEmails = async (env: AuthEnv): Promise<string[]> => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) return [];
    const raw = await kv.get(KV_ALLOW_KEY, "json");
    if (!Array.isArray(raw)) return [];
    return unique(raw.map((x) => String(x).trim().toLowerCase()).filter((s) => s.includes("@")));
};

const writeKvEmails = async (env: AuthEnv, emails: string[]) => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) throw new Error("KV is not bound.");
    await kv.put(KV_ALLOW_KEY, JSON.stringify(unique(emails)));
};

const pinnedEmails = (env: AuthEnv) => unique(parseEmails(env.GOOGLE_ALLOWED_EMAILS));

const allowedEmails = async (env: AuthEnv) => unique([...pinnedEmails(env), ...(await readKvEmails(env))]);

const adminEmails = (env: AuthEnv) => {
    const admins = parseEmails(env.GOOGLE_ADMIN_EMAILS);
    if (admins.length) return unique(admins);
    const pinned = pinnedEmails(env);
    return pinned.slice(0, 1);
};

const isAllowed = async (env: AuthEnv, email: string) =>
    (await allowedEmails(env)).includes(email.toLowerCase());

const isLocalAdmin = (email: string) => email.toLowerCase() === LOCAL_ADMIN_EMAIL;

const isAdmin = (env: AuthEnv, email: string) =>
    isLocalAdmin(email) || adminEmails(env).includes(email.toLowerCase());

type SessionPayload = AuthUser & { exp: number };

const signSession = async (env: AuthEnv, user: AuthUser) => {
    const secret = authSecret(env);
    if (!secret) throw new Error("Missing AUTH_SECRET");
    const payload: SessionPayload = {
        ...user,
        exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    };
    const body = utf8ToB64url(JSON.stringify(payload));
    const sig = await hmacSign(secret, body);
    return `${body}.${sig}`;
};

const readSession = async (env: AuthEnv, request: Request): Promise<AuthUser | null> => {
    const secret = authSecret(env);
    const token = getCookie(request, SESSION_COOKIE);
    if (!secret || !token) return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = await hmacSign(secret, body);
    if (!timingSafeEqual(sig, expected)) return null;
    try {
        const payload = JSON.parse(b64urlToUtf8(body)) as SessionPayload;
        if (!payload?.email || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
        if (!(await isAllowed(env, payload.email)) && !isLocalAdmin(payload.email)) return null;
        return {
            email: String(payload.email).toLowerCase(),
            name: String(payload.name ?? payload.email),
            picture: String(payload.picture ?? ""),
        };
    } catch {
        return null;
    }
};

const redirectUri = (request: Request) => `${new URL(request.url).origin}/api/auth/google/callback`;

const loginRedirect = (request: Request, params: Record<string, string>) => {
    const url = new URL("/login", request.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return Response.redirect(url.toString(), 302);
};

const LOGIN_SCOPES = "openid email profile";
const GMAIL_SCOPES = "openid email profile https://www.googleapis.com/auth/gmail.readonly";
const KV_GMAIL_TOKENS = "gmail_oauth_tokens";

export type GmailTokenRecord = {
    refreshToken?: string;
    accessToken?: string;
    accessExp?: number;
    mailbox: string;
    updatedAt: number;
};

const readGmailTokens = async (env: AuthEnv): Promise<Record<string, unknown>> => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) return {};
    const raw = await kv.get(KV_GMAIL_TOKENS, "json");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, unknown>;
};

const isGmailToken = (value: unknown): value is GmailTokenRecord => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const rec = value as GmailTokenRecord;
    return typeof rec.mailbox === "string" && Boolean(rec.refreshToken || rec.accessToken);
};

const mailboxesFromSlot = (slot: unknown): GmailTokenRecord[] => {
    if (!slot || typeof slot !== "object" || Array.isArray(slot)) return [];
    const wrapped = slot as { mailboxes?: unknown };
    if (wrapped.mailboxes && typeof wrapped.mailboxes === "object" && !Array.isArray(wrapped.mailboxes)) {
        return Object.values(wrapped.mailboxes as Record<string, unknown>)
            .filter(isGmailToken)
            .sort((a, b) => a.mailbox.localeCompare(b.mailbox));
    }
    return isGmailToken(slot) ? [slot] : [];
};

const preferGmailToken = (prev: GmailTokenRecord, next: GmailTokenRecord): GmailTokenRecord => {
    const prevRefresh = Boolean(prev.refreshToken);
    const nextRefresh = Boolean(next.refreshToken);
    const newer = (next.updatedAt || 0) >= (prev.updatedAt || 0);
    const winner = nextRefresh && !prevRefresh ? next : !nextRefresh && prevRefresh ? prev : newer ? next : prev;
    const other = winner === next ? prev : next;
    return {
        ...winner,
        refreshToken: winner.refreshToken || other.refreshToken,
        accessToken: winner.accessToken || other.accessToken,
        accessExp: winner.accessExp ?? other.accessExp,
    };
};

const collectGmailMailboxes = (all: Record<string, unknown>): GmailTokenRecord[] => {
    const byMailbox = new Map<string, GmailTokenRecord>();
    for (const slot of Object.values(all)) {
        for (const rec of mailboxesFromSlot(slot)) {
            const key = rec.mailbox.toLowerCase();
            const next = { ...rec, mailbox: key };
            const prev = byMailbox.get(key);
            byMailbox.set(key, prev ? preferGmailToken(prev, next) : next);
        }
    }
    return [...byMailbox.values()].sort((a, b) => a.mailbox.localeCompare(b.mailbox));
};

const ownersFromTokens = (all: Record<string, unknown>): string[] => {
    const keys = Object.keys(all).map((key) => key.toLowerCase()).filter((key) => key.includes("@"));
    const shared = all.__shared__;
    const remembered = shared && typeof shared === "object" && !Array.isArray(shared)
        ? (shared as { owners?: unknown }).owners
        : [];
    const extra = Array.isArray(remembered)
        ? remembered.filter((value): value is string => typeof value === "string").map((value) => value.toLowerCase()).filter((value) => value.includes("@"))
        : [];
    return [...new Set([...keys, ...extra])];
};

export const listGmailTokenOwners = async (env: AuthEnv): Promise<string[]> => ownersFromTokens(await readGmailTokens(env));

export const listGmailMailboxes = async (env: AuthEnv, _ownerEmail?: string): Promise<GmailTokenRecord[]> => {
    const all = await readGmailTokens(env);
    return collectGmailMailboxes(all);
};

export const getGmailToken = async (env: AuthEnv, ownerEmail?: string, mailbox?: string): Promise<GmailTokenRecord | null> => {
    const list = await listGmailMailboxes(env, ownerEmail);
    if (!mailbox) return list[0] ?? null;
    const key = mailbox.toLowerCase();
    return list.find((rec) => rec.mailbox.toLowerCase() === key) ?? null;
};

const writeGmailMailboxes = async (env: AuthEnv, list: GmailTokenRecord[]) => {
    const kv = env.DOMAIN_SALE_MARKS;
    if (!kv) throw new Error("KV is not bound.");
    if (!list.length) {
        await kv.put(KV_GMAIL_TOKENS, JSON.stringify({}));
        return;
    }
    const mailboxes: Record<string, GmailTokenRecord> = {};
    for (const rec of list) mailboxes[rec.mailbox.toLowerCase()] = { ...rec, mailbox: rec.mailbox.toLowerCase() };
    const owners = ownersFromTokens(await readGmailTokens(env));
    await kv.put(KV_GMAIL_TOKENS, JSON.stringify({ __shared__: { mailboxes, owners } }));
};

export const saveGmailToken = async (env: AuthEnv, ownerEmail: string, rec: GmailTokenRecord | null, mailbox?: string) => {
    const list = await listGmailMailboxes(env, ownerEmail);
    if (!rec) {
        const drop = (mailbox || "").trim().toLowerCase();
        await writeGmailMailboxes(env, drop ? list.filter((item) => item.mailbox.toLowerCase() !== drop) : []);
        return;
    }
    const key = rec.mailbox.toLowerCase();
    const prev = list.find((item) => item.mailbox.toLowerCase() === key);
    const next = list.filter((item) => item.mailbox.toLowerCase() !== key);
    next.push({ ...rec, mailbox: key, refreshToken: rec.refreshToken || prev?.refreshToken });
    await writeGmailMailboxes(env, next);
};

const startOAuth = async (request: Request, env: AuthEnv, intent: "login" | "gmail") => {
    const clientId = String(env.GOOGLE_CLIENT_ID ?? "").trim();
    const secret = authSecret(env);
    if (!clientId || !String(env.GOOGLE_CLIENT_SECRET ?? "").trim() || !secret) {
        return loginRedirect(request, { error: "not_configured" });
    }
    if (intent === "gmail") {
        const user = await readSession(env, request);
        if (!user) return Response.redirect(new URL("/login", request.url).toString(), 302);
    }
    const nonce = b64urlFromBytes(crypto.getRandomValues(new Uint8Array(24)));
    const gmailNext = new URL(request.url).searchParams.get("next") === "/shopify-orders" ? "orders" : "bills";
    const state = intent === "gmail" ? `gmail.${nonce}.${gmailNext}` : `${intent}.${nonce}`;
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri(request));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", intent === "gmail" ? GMAIL_SCOPES : LOGIN_SCOPES);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("include_granted_scopes", "true");
    if (intent === "gmail") {
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "select_account consent");
    } else {
        authUrl.searchParams.set("prompt", "select_account");
    }
    const res = new Response(null, { status: 302, headers: { Location: authUrl.toString() } });
    res.headers.append("Set-Cookie", `${STATE_COOKIE}=${state}; ${cookieAttrs(request, 600)}`);
    return res;
};

const startGoogle = (request: Request, env: AuthEnv) => startOAuth(request, env, "login");
const startGmail = (request: Request, env: AuthEnv) => startOAuth(request, env, "gmail");

export { readSession };

const googleCallback = async (request: Request, env: AuthEnv) => {
    const url = new URL(request.url);
    const err = url.searchParams.get("error");
    if (err) return loginRedirect(request, { error: "denied" });

    const code = url.searchParams.get("code") ?? "";
    const state = url.searchParams.get("state") ?? "";
    const saved = getCookie(request, STATE_COOKIE);
    if (!code || !state || !saved || !timingSafeEqual(state, saved)) {
        return loginRedirect(request, { error: "oauth_failed" });
    }

    const clientId = String(env.GOOGLE_CLIENT_ID ?? "").trim();
    const clientSecret = String(env.GOOGLE_CLIENT_SECRET ?? "").trim();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri(request),
            grant_type: "authorization_code",
        }),
    });
    const tokenJson = (await tokenRes.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        error?: string;
    };
    if (!tokenRes.ok || !tokenJson.access_token) {
        return loginRedirect(request, { error: "oauth_failed" });
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profile = (await userRes.json()) as {
        email?: string;
        email_verified?: boolean | string;
        name?: string;
        picture?: string;
    };
    const email = String(profile.email ?? "").trim().toLowerCase();
    const verified = profile.email_verified === true || profile.email_verified === "true";
    if (!email || !verified) return loginRedirect(request, { error: "oauth_failed" });

    const intent = (state.split(".")[0] || "login") as string;
    if (intent !== "gmail" && !(await isAllowed(env, email))) {
        return loginRedirect(request, { error: "not_allowed", email });
    }

    const user: AuthUser = {
        email,
        name: String(profile.name ?? email),
        picture: String(profile.picture ?? ""),
    };

    if (intent === "gmail") {
        const sessionUser = await readSession(env, request);
        if (!sessionUser) return loginRedirect(request, { error: "oauth_failed" });
        const existing = await getGmailToken(env, sessionUser.email, email);
        await saveGmailToken(env, sessionUser.email, {
            refreshToken: tokenJson.refresh_token || existing?.refreshToken,
            accessToken: tokenJson.access_token,
            accessExp: Date.now() + Math.max(60, Number(tokenJson.expires_in || 3600) - 60) * 1000,
            mailbox: email,
            updatedAt: Date.now(),
        });
        const nextPath = state.split(".")[2] === "orders" ? "/shopify-orders" : "/shopify-bills";
        const res = new Response(null, {
            status: 302,
            headers: { Location: new URL(`${nextPath}?gmail=1`, request.url).toString() },
        });
        res.headers.append("Set-Cookie", `${STATE_COOKIE}=; ${cookieAttrs(request, 0)}`);
        return res;
    }

    const session = await signSession(env, user);
    const res = new Response(null, {
        status: 302,
        headers: { Location: new URL("/login?ok=1", request.url).toString() },
    });
    res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${session}; ${cookieAttrs(request, SESSION_DAYS * 86400)}`);
    res.headers.append("Set-Cookie", `${STATE_COOKIE}=; ${cookieAttrs(request, 0)}`);
    return res;
};

const sha256Hex = async (value: string) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const handlePasswordLogin = async (request: Request, env: AuthEnv) => {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    let body: { user?: string; password?: string } = {};
    try {
        body = (await request.json()) as { user?: string; password?: string };
    } catch {
        return json({ error: "Invalid JSON" }, 400);
    }
    const userName = String(body.user ?? "").trim().toLowerCase();
    const passHash = await sha256Hex(String(body.password ?? ""));
    const userOk = timingSafeEqual(userName, LOCAL_ADMIN_USER);
    const passOk = timingSafeEqual(passHash, LOCAL_ADMIN_PASS_SHA256);
    if (!userOk || !passOk) return json({ error: "Sai tài khoản hoặc mật khẩu." }, 401);

    const user: AuthUser = { email: LOCAL_ADMIN_EMAIL, name: "Admin", picture: "" };
    const session = await signSession(env, user);
    const res = json({ ok: true, user });
    res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${session}; ${cookieAttrs(request, SESSION_DAYS * 86400)}`);
    return res;
};

const handleMe = async (request: Request, env: AuthEnv) => {
    const user = await readSession(env, request);
    if (!user) return json({ user: null }, 401);
    return json({
        user,
        admin: isAdmin(env, user.email),
    });
};

const handleLogout = (request: Request) => {
    const res = json({ ok: true });
    res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; ${cookieAttrs(request, 0)}`);
    return res;
};

const handleUsers = async (request: Request, env: AuthEnv) => {
    const user = await readSession(env, request);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const pinned = pinnedEmails(env);
    const extra = await readKvEmails(env);
    const emails = unique([...pinned, ...extra]);

    if (request.method === "GET") {
        return json({ emails, pinned, admin: isAdmin(env, user.email) });
    }

    if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);

    if (!isAdmin(env, user.email)) return json({ error: "Forbidden" }, 403);

    let body: { email?: string; action?: string } = {};
    try {
        body = (await request.json()) as { email?: string; action?: string };
    } catch {
        return json({ error: "Invalid JSON" }, 400);
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email.includes("@")) return json({ error: "Invalid email" }, 400);

    if (body.action === "add") {
        await writeKvEmails(env, [...extra, email]);
    } else if (body.action === "remove") {
        if (pinned.includes(email)) {
            return json({ error: "Cannot remove a pinned admin email." }, 400);
        }
        await writeKvEmails(env, extra.filter((e) => e !== email));
    } else {
        return json({ error: "Invalid action" }, 400);
    }

    const nextExtra = await readKvEmails(env);
    return json({ emails: unique([...pinned, ...nextExtra]), pinned, admin: true });
};

export async function refreshGmailAccess(env: AuthEnv, ownerEmail: string, mailbox?: string): Promise<{ token: string; mailbox: string } | { error: string; code: string }> {
    const rec = await getGmailToken(env, ownerEmail, mailbox);
    if (!rec) return { error: "Chưa kết nối Gmail.", code: "not_connected" };

    if (rec.accessToken && rec.accessExp && rec.accessExp > Date.now() + 15_000) {
        return { token: rec.accessToken, mailbox: rec.mailbox };
    }
    if (!rec.refreshToken) return { error: "Gmail hết hạn. Kết nối lại.", code: "expired" };

    const clientId = String(env.GOOGLE_CLIENT_ID ?? "").trim();
    const clientSecret = String(env.GOOGLE_CLIENT_SECRET ?? "").trim();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: rec.refreshToken,
            grant_type: "refresh_token",
        }),
    });
    const tokenJson = (await tokenRes.json()) as { access_token?: string; expires_in?: number; error?: string };
    if (!tokenRes.ok || !tokenJson.access_token) {
        return { error: "Không làm mới được Gmail. Kết nối lại.", code: "refresh_failed" };
    }
    const next: GmailTokenRecord = {
        ...rec,
        accessToken: tokenJson.access_token,
        accessExp: Date.now() + Math.max(60, Number(tokenJson.expires_in || 3600) - 60) * 1000,
        updatedAt: Date.now(),
    };
    await saveGmailToken(env, ownerEmail, next);
    return { token: next.accessToken!, mailbox: next.mailbox };
}

export async function handleGoogleAuthApi(request: Request, env: unknown): Promise<Response> {
    const wenv = env as AuthEnv;
    const path = new URL(request.url).pathname;

    if (path === "/api/auth/password") return handlePasswordLogin(request, wenv);
    if (path === "/api/auth/google") return startGoogle(request, wenv);
    if (path === "/api/auth/gmail") return startGmail(request, wenv);
    if (path === "/api/auth/google/callback") return googleCallback(request, wenv);
    if (path === "/api/auth/me") return handleMe(request, wenv);
    if (path === "/api/auth/logout") return handleLogout(request);
    if (path === "/api/auth/users") return handleUsers(request, wenv);
    if (path === "/api/auth/status") {
        return json({
            google: Boolean(String(wenv.GOOGLE_CLIENT_ID ?? "").trim() && String(wenv.GOOGLE_CLIENT_SECRET ?? "").trim()),
        });
    }

    return json({ error: "Not found" }, 404);
}
