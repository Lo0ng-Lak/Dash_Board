import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/reports")({
  component: () => (
    <PagePlaceholder title="Báo cáo" icon="📈" desc="Báo cáo doanh thu & vận hành." />
  ),
});
