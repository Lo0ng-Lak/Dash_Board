import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/devs")({
  component: () => (
    <PagePlaceholder title="Dev / Nhân sự" icon="🧑‍💻" desc="Đội ngũ phát triển và phân công." />
  ),
});
