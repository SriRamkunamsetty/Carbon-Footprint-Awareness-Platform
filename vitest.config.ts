/**
 * @fileoverview Vitest configuration for CarbonMind AI.
 * Configures test environment, coverage thresholds, path aliases,
 * and setup files for comprehensive testing.
 */
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    /** Use jsdom for React component testing */
    environment: "jsdom",
    /** Enable global test utilities (describe, it, expect, vi) */
    globals: true,
    /** Path aliases matching tsconfig */
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    /** Global test setup file */
    setupFiles: ["./src/tests/setup.tsx"],
    /** Include patterns for test discovery */
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
    ],
    /** Exclude patterns */
    exclude: [
      "node_modules",
      ".next",
      "functions",
      "e2e",
    ],
    /** Coverage configuration */
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.ts",
        "src/components/**/*.tsx",
        "src/hooks/**/*.ts",
        "src/services/**/*.ts",
        "src/context/**/*.tsx",
        "src/app/api/**/*.ts",
      ],
      exclude: [
        "src/tests/**",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/types/**",
        "src/**/index.ts",
      ],
      /** Coverage thresholds */
      thresholds: {
        lines: 60,
        branches: 55,
        functions: 60,
        statements: 60,
      },
    },
    /** Test timeout */
    testTimeout: 10000,
  },
});
