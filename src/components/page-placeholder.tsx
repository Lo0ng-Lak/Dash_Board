import { Link } from "@tanstack/react-router";

export function PagePlaceholder({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <span>{icon}</span> {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-[0_10px_30px_oklch(0.55_0.08_355_/_0.06)]">
        <div className="text-5xl mb-3">{icon}</div>
        <div className="text-lg font-semibold text-foreground">Under Development</div>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Page <strong>{title}</strong> will soon have detailed data. Go back to{" "}
          <Link to="/" className="text-primary hover:underline">Dashboard</Link> to view the dashboard.
        </p>
      </div>
    </div>
  );
}