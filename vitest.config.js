import { defineConfig } from 'vitest/config';

// Phase 1 test tooling: ES-module-capable runner with a DOM (jsdom).
// Tests live in tests/ and are added in later tasks.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,mjs}'],
  },
});
