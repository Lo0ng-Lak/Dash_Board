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
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="rounded-lg border bg-white p-12 text-center">
        <div className="text-5xl mb-3">{icon}</div>
        <div className="text-lg font-semibold text-slate-700">Đang phát triển</div>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Trang <strong>{title}</strong> sẽ sớm có dữ liệu chi tiết. Quay lại{" "}
          <Link to="/" className="text-blue-600 hover:underline">Tổng quan</Link> để xem dashboard.
        </p>
      </div>
    </div>
  );
}