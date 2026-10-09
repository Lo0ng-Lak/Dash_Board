import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { fetchAuthMe, writeAuthToken } from "@/lib/authSession";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

const ERROR_TEXT: Record<string, string> = {
    not_configured: "Google login chưa cấu hình. Cần GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.",
    not_allowed: "Gmail này chưa được cấp quyền. Liên hệ admin để thêm vào danh sách.",
    oauth_failed: "Đăng nhập Google thất bại. Thử lại.",
    denied: "Bạn đã hủy đăng nhập Google.",
};

function LoginPage() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [googleReady, setGoogleReady] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const err = params.get("error");
        const email = params.get("email");
        if (err) {
            const base = ERROR_TEXT[err] || "Không đăng nhập được.";
            setError(email ? `${base} (${email})` : base);
        }

        const goIn = async () => {
            const user = await fetchAuthMe();
            if (user) {
                navigate({ to: "/customers" });
                return;
            }
            try {
                const st = await fetch("/api/auth/status");
                const json = (await st.json()) as { google?: boolean };
                setGoogleReady(!!json.google);
            } catch {
                setGoogleReady(false);
            }
            setChecking(false);
        };
        void goIn();
    }, [navigate]);

    const handleGoogle = () => {
        setIsLoading(true);
        window.location.href = "/api/auth/google";
    };

    const handleFallbackLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const ADMIN_EMAIL = "admin";
            const ADMIN_PASS = "reg@egeadcompany";
            await new Promise((resolve) => setTimeout(resolve, 400));
            if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
                writeAuthToken({ email: "admin@local", name: "Admin", picture: "" });
                navigate({ to: "/customers" });
            } else {
                setError("Sai tài khoản dự phòng.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="app-shell flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4">
            <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-rose-200/50 blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-pink-100/70 blur-[120px]" />

            <Card className="relative w-full max-w-md border border-border/70 bg-card/80 shadow-[0_16px_40px_oklch(0.55_0.08_355_/_0.08)] backdrop-blur-xl">
                <CardHeader className="space-y-4 pt-10 text-center">
                    <div className="mx-auto flex h-22 w-22 items-center justify-center rounded-2xl shadow-xl shadow-rose-200/70">
                        <img src="/logo.png" alt="Logo" className="h-16 w-16" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                            Admin System
                        </CardTitle>
                        <CardDescription className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            Egead Company Dashboard
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="pb-10 space-y-6">
                    {error && (
                        <Alert variant="destructive" className="border-red-100 bg-red-50/50 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                        </Alert>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={isLoading || !googleReady}
                        className="h-12 w-full rounded-xl bg-card border border-border font-semibold text-foreground shadow-sm hover:bg-accent hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-primary" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l6.3 5.3C38.2 37.3 44 32 44 24c0-1.3-.1-2.3-.4-3.5z" />
                            </svg>
                        )}
                        {isLoading ? "Đang chuyển tới Google..." : "Đăng nhập bằng Gmail"}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                        Chỉ Gmail đã được cấp quyền mới vào được hệ thống.
                    </p>

                    {!googleReady && (
                        <form onSubmit={handleFallbackLogin} className="space-y-4 pt-2 border-t border-border">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 text-center">
                                Google chưa cấu hình — đăng nhập dự phòng
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Username
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="text"
                                        className="h-12 border-border bg-card/70 pl-10 rounded-xl"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="h-12 border-border bg-card/70 pl-10 rounded-xl"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="h-12 w-full rounded-xl bg-primary font-semibold" disabled={isLoading}>
                                Login to System
                            </Button>
                        </form>
                    )}
                    <p className="text-center text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                        © 2026 Egead Company. All rights reserved.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
