import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['reflect-metadata'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://patients:patients@localhost:5432/patients_test?schema=public',
      JWT_SECRET: 'test-secret-at-least-32-characters-long',
      JWT_EXPIRES_IN: '1h',
      CHAOS_ENABLED: 'false',
      CORS_ORIGIN: 'http://localhost:3000',
    },
  },
});
