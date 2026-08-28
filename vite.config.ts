
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Fixes Vercel 404/deployment routing safely without breaking Lovable's preview
  nitro: process.env['VERCEL'] ? true : false,

  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  // Fixes the "__dirname is not defined in ES Modules" crash from your external packages
  vite: {
    define: {
      '__dirname': '""',
      '__filename': '""',
    }
  }
});

