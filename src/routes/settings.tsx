import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";
import { getAllDataWeb } from "@/lib/dataService"; // Path to file containing your function

export const Route = createFileRoute("/settings")({
  // 1. Declare loader to fetch data before entering the page
  loader: async () => {
    const domains = await getAllDataWeb();
    return { domains };
  },
  // 2. Component receives data and displays it
  component: SettingsComponent,
});

function SettingsComponent() {
  // 3. Use this TanStack Router hook to get data from loader
  const { domains } = Route.useLoaderData();

  return (
    <div>
      <PagePlaceholder title="Settings" icon="⚙️" desc="System and account configuration." />

      {/* 4. This section displays data on the test interface */}
      <div style={{ padding: "20px", maxWidth: "600px" }}>
        <h3>Domain Configuration List ({domains.length})</h3>

        {domains.length === 0 ? (
          <p>No domains found or connection error.</p>
        ) : (
          <ul style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", listStyle: "none" }}>
            {domains.map((domain, index) => (
              <li key={index} style={{ padding: "5px 0", borderBottom: "1px solid #ddd" }}>
                🌐 {domain}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}