const isCI = process.env.CI === "true";
const baseURL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3100";

const playwrightConfig = {
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: "test-results/playwright",
  reporter: isCI
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ]
    : [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run start:e2e",
    url: baseURL,
    // Deterministic E2E: always boot dedicated server with E2E env.
    reuseExistingServer: false,
    timeout: 180_000,
  },
};

export default playwrightConfig;
