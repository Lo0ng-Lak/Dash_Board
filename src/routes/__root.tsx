import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // 🌐 Import thư viện dịch thuật
import i18n from "../i18n";
import { fetchAuthMe, logoutAuth, readAuthToken, clearAuthToken, initialsFromName, type ClientAuthToken } from "@/lib/authSession";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/customers"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Egead Company" },
      { name: "description", content: "Egead Generated Project" },
      { name: "author", content: "Egead" },
      { property: "og:title", content: "Egead Company" },
      { property: "og:description", content: "Egead Generated Project" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "../public/logo.png" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Egead" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/logo.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<ClientAuthToken | null>(null);

  // 📱 State điều khiển đóng/mở menu trên Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🌐 Sử dụng hook dịch thuật và đồng bộ với instance i18n đã khởi tạo
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLang = localStorage.getItem("lang");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
    setCurrentLang(i18n.language || savedLang || "en");

    const onLanguageChanged = (lng: string) => setCurrentLang(lng as "vi" | "en");
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = currentLang;
    }
  }, [currentLang]);

  // Check authentication khi component mounts hoặc pathname thay đổi
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return;

      const isLoginPage = location.pathname === "/login";
      const cached = readAuthToken();
      if (cached?.email || cached?.user) {
        setSessionUser(cached);
        setIsAuthenticated(true);
      }

      const remote = await fetchAuthMe();
      if (remote) {
        setIsAuthenticated(true);
        setSessionUser(readAuthToken());
        setIsLoading(false);
        return;
      }

      let googleReady = false;
      try {
        const st = await fetch("/api/auth/status");
        googleReady = !!(await st.json() as { google?: boolean }).google;
      } catch {
        googleReady = false;
      }

      if (googleReady) {
        clearAuthToken();
        setSessionUser(null);
        setIsAuthenticated(false);
        if (!isLoginPage) router.navigate({ to: "/login" });
      } else if (cached) {
        setSessionUser(cached);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (!isLoginPage) router.navigate({ to: "/login" });
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, [location.pathname, router]);

  // Hàm chuyển đổi ngôn ngữ an toàn và lưu vào bộ nhớ trình duyệt
  const changeLanguage = (lng: "vi" | "en") => {
    i18n.changeLanguage(lng);

    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lng);
    }
  };

  // Show loading khi đang kiểm tra auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Nếu ở trang login, ẩn toàn bộ menu điều hướng
  if (location.pathname === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  // 📋 Chuyển đổi 'label' sang 'labelKey' khớp chính xác với file i18n.ts
  const navItems = [
    { to: "/gmc-manage", labelKey: "gmcManage" },
    { to: "/customers", labelKey: "regGmc" },
    { to: "/gmc-salary", labelKey: "gmcSalaryTitle" },
    { to: "/dash-info", labelKey: "dashInfo" },
    { to: "/reg-kpi", labelKey: "regKpi" },
    { to: "/web-kpi", labelKey: "webKpi" },
    { to: "/web-shield-kpi", labelKey: "webShieldKpi" },
    { to: "/invoices", labelKey: "chiPhi" },
    { to: "/shopify", labelKey: "shopifyMgmt" },
    { to: "/shopify-cost-check", labelKey: "shopifyCostNav", nested: true },
    { to: "/shopify-bills", labelKey: "shopifyBillsNav", nested: true },
    { to: "/shopify-orders", labelKey: "shopifyOrdersNav", nested: true },
    { to: "/app-platform", labelKey: "appPlatform" },
    { to: "/domain-can-ban", labelKey: "domainCanBan" },
  ];

  const handleLogout = async () => {
    await logoutAuth();
    setSessionUser(null);
    setIsAuthenticated(false);
    router.navigate({ to: "/login" });
  };

  const displayName = sessionUser?.name || sessionUser?.user || "Admin";
  const displayEmail = sessionUser?.email || "";
  const displayInitials = initialsFromName(displayName, displayEmail);

  // Render các liên kết menu (Sử dụng hàm t() để tự động dịch nhãn chữ)
  const renderNavLinks = () =>
    navItems.map((item) => (
      <Link
        key={item.to}
        to={item.to as any}
        activeOptions={{ exact: (item as { exact?: boolean }).exact ?? false }}
        className={`app-nav-link ${(item as { nested?: boolean }).nested ? "app-nav-link-nested" : ""}`}
      >
        <span>{t(item.labelKey)}</span>
      </Link>
    ));

  const renderLanguageToggle = () => (
    <div className="app-lang-toggle">
      <div
        className="app-lang-thumb"
        style={{ left: currentLang === "vi" ? "4px" : "50%" }}
      />
      <button
        type="button"
        className={`app-lang-btn ${currentLang === "vi" ? "is-active" : ""}`}
        onClick={() => changeLanguage("vi")}
      >
        VI
      </button>
      <button
        type="button"
        className={`app-lang-btn ${currentLang === "en" ? "is-active" : ""}`}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell flex h-screen w-full overflow-hidden flex-col md:flex-row">

        <header className="app-header flex md:hidden items-center justify-between px-5 py-4 border-b shrink-0 z-40">
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">WebManager</span>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.16em]">Management</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <span className="text-xl block font-semibold">☰</span>
          </button>
        </header>

        <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileMenuOpen ? "visible" : "invisible"}`}>
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className={`absolute inset-0 bg-rose-950/25 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          />

          <aside className={`app-sidebar absolute top-0 left-0 bottom-0 w-72 flex flex-col h-full transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold tracking-tight text-foreground">WebManager</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.16em]">System Management</div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto custom-scrollbar">
              {renderNavLinks()}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-4 bg-muted/40">
              {renderLanguageToggle()}

              <div className="flex items-center gap-3">
                {sessionUser?.picture ? (
                  <img src={sessionUser.picture} alt="" className="w-10 h-10 rounded-full object-cover shadow-[0_0_0_2px_oklch(0.995_0.004_350)]" />
                ) : (
                  <div className="app-avatar">{displayInitials}</div>
                )}
                <div className="text-sm min-w-0">
                  <div className="font-semibold text-foreground truncate">{displayName}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">{displayEmail || "Administrator"}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="app-logout">
                {t("logout")}
              </button>
            </div>
          </aside>
        </div>

        <aside className="app-sidebar hidden md:flex w-64 shrink-0 flex-col border-r h-full">
          <div className="px-5 py-5 border-b border-sidebar-border">
            <div className="text-lg font-semibold tracking-tight text-foreground">WebManager</div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.16em]">System Management</div>
          </div>

          <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto custom-scrollbar">
            {renderNavLinks()}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-4">
            {renderLanguageToggle()}

            <div className="flex items-center gap-3">
              {sessionUser?.picture ? (
                <img src={sessionUser.picture} alt="" className="w-10 h-10 rounded-full object-cover shadow-[0_0_0_2px_oklch(0.995_0.004_350)]" />
              ) : (
                <div className="app-avatar">{displayInitials}</div>
              )}
              <div className="text-sm min-w-0">
                <div className="font-semibold text-foreground truncate">{displayName}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">{displayEmail || "Administrator"}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="app-logout">
              {t("logout")}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 h-full overflow-y-auto scroll-smooth custom-scrollbar bg-transparent">
          <Outlet />
        </main>

      </div>
    </QueryClientProvider>
  );
}