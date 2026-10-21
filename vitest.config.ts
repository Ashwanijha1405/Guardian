import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Tests run against workspace sources, so `npm test` works on a fresh clone without building first.
    alias: { "@guardian/risk-engine": fileURLToPath(new URL("./packages/risk-engine/src/index.ts", import.meta.url)) },
  },
  test: {
    include: ["packages/*/test/**/*.test.ts"],
    passWithNoTests: true,
  },
});
