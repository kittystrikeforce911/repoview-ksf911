import { defineConfig } from "@playwright/test";

// Boots the Go server for the suite. Requires `go` on PATH, no toolchain
// manager needed. When the command cannot boot (cold compile on a fresh
// machine), build and serve the binary yourself, e.g.
//   go build -o /tmp/repoview .. && /tmp/repoview -port 3123 -no-browser ../testdata
// and the suite reuses the already-running server.
const command = "go run .. -port 3123 -no-browser ../testdata";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3123",
    headless: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command,
    url: "http://localhost:3123",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
