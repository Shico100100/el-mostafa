import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../backend && node dist/main',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'npx next dev -H 0.0.0.0',
      port: 3000,
      reuseExistingServer: true,
    },
  ],
});
