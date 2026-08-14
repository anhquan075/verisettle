import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf-8");
}

describe("Vercel serverless packaging", () => {
  it("bundles the shared Express app into the deployed API artifact instead of relying on a runtime source import", () => {
    const packageJson = source("../package.json");
    const entry = source("../api/vercel.cts");
    const config = source("../vercel.json");

    expect(packageJson).toContain("esbuild api/vercel.cts --platform=node --bundle --format=cjs --outfile=api/index.cjs");
    expect(entry).toContain('import { createApp } from "../server/_core/app"');
    expect(entry).toContain("module.exports = createApp()");
    expect(config).toContain('"destination": "/api/index"');
  });
});
