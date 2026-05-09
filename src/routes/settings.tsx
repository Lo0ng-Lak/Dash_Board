import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/settings")({
  component: () => (
    <PagePlaceholder title="Cài đặt" icon="⚙️" desc="Cấu hình hệ thống & tài khoản." />
  ),
});
