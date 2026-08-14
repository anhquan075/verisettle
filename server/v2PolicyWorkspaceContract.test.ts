import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const router = fs.readFileSync(path.join(root, "server/routers/deals.ts"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "client/src/pages/DealDashboard.tsx"), "utf8");
const detail = fs.readFileSync(path.join(root, "client/src/pages/DealDetail.tsx"), "utf8");

describe("V2 policy workspace contract", () => {
  it("keeps policy drafts distinct from the active V1 settlement flow", () => {
    expect(router).toContain('kind: z.literal("v2_draft")');
    expect(router).toContain("requireLiveV1Policy(deal)");
    expect(router).toContain("matching V2 source and ASC");
  });

  it("surfaces V2 policy creation and non-settleable evidence in the workspace", () => {
    expect(dashboard).toContain("V2 policy preview");
    expect(detail).toContain("Settlement policy commitment");
    expect(detail).toContain("V2 funding is intentionally unavailable");
    expect(detail).toContain("no on-chain actions enabled");
  });
});
