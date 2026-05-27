import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/reports")({
  component: () => (
    <PagePlaceholder title="Reports" icon="📈" desc="Revenue and operational reports." />
  ),
});
