import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("Vercel serverless packaging", () => {
  it("bundles the shared Express app into the deployed API artifact instead of relying on a runtime source import", () => {
    const packageJson = source("../package.json");
    const entry = source("../server/vercelFunction.cts");
    const apiEntry = source("../api/[...path].cts");
    const config = source("../vercel.json");

    expect(packageJson).toContain("esbuild server/vercelFunction.cts --platform=node --bundle --format=cjs --outfile=server/vercelFunction.cjs");
    expect(entry).toContain('import { createApp } from "./_core/app"');
    expect(entry).toContain("module.exports = createApp()");
    expect(apiEntry).toContain('require("../server/vercelFunction.cjs")');
    expect(config).toContain('"handle": "filesystem"');
  });
});
