import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/customers")({
  component: () => (
    <PagePlaceholder title="Khách hàng" icon="👥" desc="Danh sách khách hàng và liên hệ." />
  ),
});
