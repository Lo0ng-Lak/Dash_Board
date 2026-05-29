import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {


  return (
    <div>
      <PagePlaceholder title="Settings" icon="⚙️" desc="System and account configuration." />
    </div>
  );
}