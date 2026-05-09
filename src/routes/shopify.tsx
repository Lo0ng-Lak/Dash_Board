import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/shopify")({
  component: () => (
    <PagePlaceholder title="Shopify" icon="🛒" desc="Các site Shopify đang vận hành." />
  ),
});
