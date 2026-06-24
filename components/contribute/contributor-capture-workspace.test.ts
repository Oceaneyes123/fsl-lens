import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ContributorCaptureWorkspace", () => {
  it("keeps the high-frequency camera snapshot callback stable", () => {
    const source = readFileSync(new URL("./contributor-capture-workspace.tsx", import.meta.url), "utf8");
    expect(source).toContain("const handleSnapshot = useCallback");
  });

  it("limits contributor state updates to the dataset frame rate", () => {
    const source = readFileSync(new URL("./contributor-capture-workspace.tsx", import.meta.url), "utf8");
    expect(source).toContain("const snapshotIntervalMs = 1000 / 15");
    expect(source).toContain("now - lastSnapshotAt.current < snapshotIntervalMs");
  });
});
