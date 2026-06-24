import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CameraTracker", () => {
  it("does not enqueue unchanged status updates from the animation loop", () => {
    const source = readFileSync(new URL("./camera-tracker.tsx", import.meta.url), "utf8");
    expect(source).toContain("if (statusRef.current === nextStatus) return");
  });
});
