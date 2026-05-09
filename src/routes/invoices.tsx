import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/invoices")({
  component: () => (
    <PagePlaceholder title="Hóa đơn" icon="🧾" desc="Hóa đơn dịch vụ và thanh toán." />
  ),
});
