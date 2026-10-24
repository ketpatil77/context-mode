import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

describe("OpenClaw legacy path cleanup", () => {
  const directories: string[] = [];
  afterEach(() => {
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it.each([false, true])("removes every duplicate legacy entry (other plugin: %s)", async (other) => {
    const { registerContextModeInOpenclawConfig } = await import(
      "../../scripts/lib/register-openclaw-config.mjs"
    );
    const directory = mkdtempSync(join(tmpdir(), "ctx-legacy-paths-"));
    directories.push(directory);
    const runtimePath = join(directory, "openclaw.json");
    const root = "/context-mode";
    const paths = other ? [root, "/other-plugin", root] : [root, root];
    writeFileSync(runtimePath, JSON.stringify({ plugins: { load: { paths } } }));

    registerContextModeInOpenclawConfig(runtimePath, root);
    const first = readFileSync(runtimePath, "utf8");
    const config = JSON.parse(first);
    expect(config.plugins.load).toEqual(other ? { paths: ["/other-plugin"] } : undefined);
    expect(config.plugins.allow).toEqual(["context-mode"]);
    registerContextModeInOpenclawConfig(runtimePath, root);
    expect(readFileSync(runtimePath, "utf8")).toBe(first);
  });
});
