import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/wordpress")({
  component: () => (
    <PagePlaceholder title="WordPress" icon="📝" desc="Các site WordPress đang vận hành." />
  ),
});
