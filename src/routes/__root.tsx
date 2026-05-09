import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

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
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
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

  const navItems = [
    { to: "/", label: "Tổng quan", icon: "📊", exact: true },
    { to: "/domains", label: "Domain", icon: "🌐" },
    { to: "/customers", label: "Khách hàng", icon: "👥" },
    { to: "/devs", label: "Dev / Nhân sự", icon: "🧑‍💻" },
    { to: "/shopify", label: "Shopify", icon: "🛒" },
    { to: "/wordpress", label: "WordPress", icon: "📝" },
    { to: "/invoices", label: "Hóa đơn", icon: "🧾" },
    { to: "/reports", label: "Báo cáo", icon: "📈" },
    { to: "/settings", label: "Cài đặt", icon: "⚙️" },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      {/* Container chính khống chế chiều cao tối đa là 100vh */}
      <div className="flex h-screen w-full bg-background overflow-hidden">

        {/* SIDEBAR: Cố định chiều cao và có thể tự cuộn nếu menu quá dài */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-white h-full">
          <div className="px-5 py-5 border-b">
            <div className="text-lg font-black text-slate-900 tracking-tight">WebManager</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Quản lý hệ thống</div>
          </div>

          {/* Menu cuộn độc lập nếu danh sách quá dài */}
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

          {/* User profile luôn dính ở dưới đáy sidebar */}
          <div className="p-4 border-t bg-slate-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm">
              HN
            </div>
            <div className="text-sm">
              <div className="font-bold text-slate-800">Huy Ngấy</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Administrator</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT: Phần này sẽ cuộn nếu nội dung bên trong dài */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto scroll-smooth bg-[#FDFCFB]">
          <Outlet />
        </main>

      </div>
    </QueryClientProvider>
  );
}