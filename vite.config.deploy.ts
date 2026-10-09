import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const redirectLockedDist = {
  name: "redirect-locked-dist",
  enforce: "post" as const,
  configResolved(config: {
    build: { outDir: string; emptyOutDir?: boolean };
    environments?: Record<string, { build: { outDir: string; emptyOutDir?: boolean } }>;
  }) {
    const fix = (build: { outDir: string; emptyOutDir?: boolean } | undefined, label: string) => {
      if (!build?.outDir) return;
      const normalized = build.outDir.replace(/\\/g, "/");
      if (normalized === "dist" || normalized.startsWith("dist/")) {
        build.outDir = normalized.replace(/^dist/, "dist-deploy");
        build.emptyOutDir = true;
        console.log(`[deploy] ${label} -> ${build.outDir}`);
      }
    };
    fix(config.build, "root");
    for (const [name, env] of Object.entries(config.environments ?? {})) {
      fix(env.build, name);
    }
  },
};

export default defineConfig({
  tanstackStart: {
    router: {
      generatedRouteTree: "routeTree.live.ts",
    },
  },
  vite: {
    plugins: [redirectLockedDist],
    build: {
      commonjsOptions: {
        include: [/react-i18next/, /i18next/, /node_modules/],
      },
    },
  },
});
