import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/invoices")({
  component: () => (
    <PagePlaceholder title="Invoices" icon="🧾" desc="Service invoices and payments." />
  ),
});
