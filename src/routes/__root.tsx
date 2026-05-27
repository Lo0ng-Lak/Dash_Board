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

  // Check authentication when component mounts or pathname changes
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("authToken");
      const isLoggedIn = !!authToken;
      const isLoginPage = location.pathname === "/login";

      setIsAuthenticated(isLoggedIn);

      // If not logged in and not on login page, redirect to login
      if (!isLoggedIn && !isLoginPage) {
        router.navigate({ to: "/login" });
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [location.pathname, router]);

  // Show loading while checking auth
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

  // If on login page, do not show sidebar
  if (location.pathname === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  // Normal layout with sidebar (only when authenticated)
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
    { to: "/devs", label: "Dev GMC", icon: "🧑\u200d💻" },
    { to: "/profile", label: "Profile", icon: "👤" },
    { to: "/shopify", label: "Shopify", icon: "🛒" },
    { to: "/wordpress", label: "WordPress", icon: "📝" },
    { to: "/invoices", label: "Invoices", icon: "🧾" },
    { to: "/reports", label: "Reports", icon: "📈" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    router.navigate({ to: "/login" });
  };

  return (
    <QueryClientProvider client={queryClient}>
      {/* Container chính khống chế chiều cao tối đa là 100vh */}
      <div className="flex h-screen w-full bg-background overflow-hidden">

        {/* SIDEBAR: Fixed height and can scroll if menu is too long */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-white h-full">
          <div className="px-5 py-5 border-b">
            <div className="text-lg font-black text-slate-900 tracking-tight">WebManager</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Management</div>
          </div>

          {/* Menu scrolls independently if list is too long */}
          <nav className="flex-1 p-4 space-y-1 text-sm overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to as any}
                activeOptions={{ exact: item.exact ?? false }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-slate-600 hover:bg-slate-50 data-[status=active]:bg-slate-900 data-[status=active]:text-white data-[status=active]:shadow-lg data-[status=active]:shadow-slate-200"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User profile always sticks to bottom of sidebar */}
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

        {/* MAIN CONTENT: This section will scroll if content inside is long */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto scroll-smooth bg-[#FDFCFB]">
          <Outlet />
        </main>

      </div>
    </QueryClientProvider>
  );
}