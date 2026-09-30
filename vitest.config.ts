import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Test files build the site with Astro, which shares a cache in node_modules;
    // running them in parallel makes builds race.
    fileParallelism: false,
  },
});
