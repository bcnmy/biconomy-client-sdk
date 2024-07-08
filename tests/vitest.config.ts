import { join } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      all: false,
      provider: "v8",
      reporter: process.env.CI
        ? ["json-summary", "json"]
        : ["text", "json", "html"],
      exclude: [
        "**/errors/utils.ts",
        "**/_cjs/**",
        "**/_esm/**",
        "**/_types/**",
        "**/*.test.ts",
        "**/test/**"
      ],
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 50,
        branches: 60,
        statements: 80
      }
    },
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: [join(__dirname, "./setupFiles.ts")],
    globalSetup: [join(__dirname, "./globalSetup.ts")],
    // hookTimeout: 20_000,
    testTimeout: 20_000
  }
})
