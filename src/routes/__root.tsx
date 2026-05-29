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
            to="/"
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

  // 📱 State điều khiển đóng/mở menu trên Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tự động đóng menu mobile mỗi khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Check authentication khi component mounts hoặc pathname thay đổi
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("authToken");
      const isLoggedIn = !!authToken;
      const isLoginPage = location.pathname === "/login";

      setIsAuthenticated(isLoggedIn);

      if (!isLoggedIn && !isLoginPage) {
        router.navigate({ to: "/login" });
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname, router]);

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

  const navItems = [
    { to: "/", label: "Dashboard", icon: "📊", exact: true },
    { to: "/domains", label: "Domains", icon: "🌐" },
    { to: "/customers", label: "REG GMC", icon: "👥" },
    { to: "/devs", label: "Dev GMC", icon: "🧑‍💻" },
    { to: "/web-kpi", label: "Web KPI", icon: "📊" },
    { to: "/invoices", label: "Invoices", icon: "🧾" },
    { to: "/profile", label: "Profile", icon: "👤" },
    { to: "/reports", label: "Reports", icon: "📈" },
    { to: "/shopify", label: "Shopify", icon: "🛒" },
    { to: "/wordpress", label: "WordPress", icon: "📝" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    router.navigate({ to: "/login" });
  };

  // Render các liên kết menu (dùng chung cho cả Desktop và Mobile để tránh lặp code)
  const renderNavLinks = () =>
    navItems.map((item) => (
      <Link
        key={item.to}
        to={item.to as any}
        activeOptions={{ exact: item.exact ?? false }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-slate-600 hover:bg-slate-50 data-[status=active]:bg-slate-900 data-[status=active]:text-white data-[status=active]:shadow-lg data-[status=active]:shadow-slate-200"
      >
        <span className="text-lg">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    ));

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-full bg-background overflow-hidden flex-col md:flex-row">

        {/* ── 📱 MOBILE HEADER BAR ── */}
        <header className="flex md:hidden items-center justify-between px-5 py-4 bg-white border-b shrink-0 z-40">
          <div className="flex flex-col">
            <span className="text-base font-black text-slate-900 tracking-tight">WebManager</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Management</span>
          </div>
          {/* Nút Hamburger bật menu */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Open menu"
          >
            <span className="text-xl block font-bold">☰</span>
          </button>
        </header>

        {/* ── 📱 MOBILE SIDEBAR DRAWER (Hiệu ứng trượt lướt) ── */}
        <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileMenuOpen ? "visible" : "invisible"}`}>
          {/* Lớp nền mờ (Backdrop) - Bấm vào đây để đóng menu */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          />

          {/* Khung chứa Menu di động */}
          <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="px-5 py-5 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-900 tracking-tight">WebManager</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Management</div>
              </div>
              {/* Nút đóng nút X */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto custom-scrollbar">
              {renderNavLinks()}
            </nav>

            <div className="p-4 border-t space-y-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm">
                  HN
                </div>
                <div className="text-sm">
                  <div className="font-bold text-slate-800">Huy Ngấy</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-all font-medium border border-slate-200"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>

        {/* ── 🖥️ DESKTOP SIDEBAR (Giữ nguyên giao diện máy tính của bạn) ── */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-white h-full">
          <div className="px-5 py-5 border-b">
            <div className="text-lg font-black text-slate-900 tracking-tight">WebManager</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Management</div>
          </div>

          <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto custom-scrollbar">
            {renderNavLinks()}
          </nav>

          <div className="p-4 border-t space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm">
                HN
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-800">Huy Ngấy</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Administrator</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-all font-medium border border-slate-200 hover:border-slate-300"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* ── 🌍 MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto scroll-smooth bg-[#FDFCFB]">
          <Outlet />
        </main>

      </div>
    </QueryClientProvider>
  );
}