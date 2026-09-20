import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      hyperbits: path.resolve(__dirname, "src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
