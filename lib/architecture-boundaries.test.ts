import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("architecture boundaries", () => {
  it("prevents lib modules from importing components", () => {
    const invalidImports = sourceFiles(fileURLToPath(new URL(".", import.meta.url)))
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const imports = source.matchAll(/\b(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g);
        return [...imports]
          .map((match) => match[1])
          .filter((path) => path.includes("components"))
          .map((path) => `${file}: ${path}`);
      });

    expect(invalidImports).toEqual([]);
  });

  it("keeps workspace workflows behind hooks and dataset helpers", () => {
    const core = readFileSync(new URL("../components/camera/camera-workspace-core.tsx", import.meta.url), "utf8");

    expect(core).not.toContain("function getOrCreateSessionId");
    expect(core).not.toContain("createWordSign");
    expect(core).toContain("useSessionId");
    expect(core).toContain("useSignSelection");
    expect(core).toContain("useWordSignForm");
    expect(core).toContain("buildFeedbackPayload");
  });

  it("keeps recognition confirmation transitions outside the hook", () => {
    const hook = readFileSync(new URL("../hooks/use-selected-sign-recognition.ts", import.meta.url), "utf8");

    expect(hook).toContain("recognition-transitions");
  });
});
