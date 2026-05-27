import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {

            const ADMIN_EMAIL = "admin";
            const ADMIN_PASS = "Congphu21@";

            await new Promise(resolve => setTimeout(resolve, 800));

            if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
                localStorage.setItem("authToken", JSON.stringify({
                    user: "Admin",
                    timestamp: new Date().toISOString(),
                }));
                navigate({ to: "/" });
            } else {
                setError("Invalid username or password.");
            }
        } catch (err) {
            setError("An error occurred, please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDFCFB] px-4">

            <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-slate-100 blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-slate-50 blur-[120px]" />

            <Card className="relative w-full max-w-md border-none bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
                <CardHeader className="space-y-4 pt-10 text-center">

                    <div className="mx-auto flex h-22 w-22 items-center justify-center rounded-2xl shadow-xl shadow-slate-200">
                        <img src="/logo.png" alt="Logo" className="h-16 w-16 " />
                    </div>

                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
                            Admin System
                        </CardTitle>
                        <CardDescription className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                            Egead Company Dashboard
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="pb-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="border-red-100 bg-red-50/50 text-red-600 animate-in fade-in zoom-in duration-300">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    Username
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="Email"
                                        className="h-12 border-slate-100 bg-white/50 pl-10 focus-visible:ring-slate-900 transition-all rounded-xl"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-12 border-slate-100 bg-white/50 pl-10 focus-visible:ring-slate-900 transition-all rounded-xl"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                "Login to System"
                            )}
                        </Button>

                        <p className="text-center text-[10px] font-medium text-slate-300 uppercase tracking-widest">
                            © 2026 Egead Company. All rights reserved.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}