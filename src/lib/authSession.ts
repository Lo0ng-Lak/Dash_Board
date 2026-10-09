export type ClientAuthUser = {
    email: string;
    name: string;
    picture: string;
};

export type ClientAuthToken = {
    user: string;
    email: string;
    name: string;
    picture: string;
    timestamp: string;
};

const STORAGE_KEY = "authToken";

export const readAuthToken = (): ClientAuthToken | null => {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ClientAuthToken;
        if (!parsed?.email && !parsed?.user) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const writeAuthToken = (user: ClientAuthUser) => {
    const token: ClientAuthToken = {
        user: user.name || user.email,
        email: user.email,
        name: user.name || user.email,
        picture: user.picture || "",
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
    return token;
};

export const clearAuthToken = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
};

export const fetchAuthMe = async (): Promise<ClientAuthUser | null> => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const json = (await res.json()) as { user?: ClientAuthUser | null };
    if (!json.user?.email) return null;
    writeAuthToken(json.user);
    return json.user;
};

export const logoutAuth = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
        /* ignore */
    }
    clearAuthToken();
};

export const initialsFromName = (name: string, email = "") => {
    const src = (name || email.split("@")[0] || "?").trim();
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return src.slice(0, 2).toUpperCase();
};
