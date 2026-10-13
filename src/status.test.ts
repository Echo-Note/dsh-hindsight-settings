import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { readStatusFile, recordStatus, statusPath } from "./status";

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hindsight-settings-status-"));
  file = join(dir, "coding-agent.json");
});

describe("status trail", () => {
  it("sits beside the config file it mirrors", () => {
    expect(statusPath(file)).toBe(join(dir, "dsh-settings-status.json"));
  });

  it("appends events and reads them back", () => {
    recordStatus("apply", { entryId: "hindsight-settings" }, file);
    recordStatus("seed", { mode: "replace", keys: 6 }, file);
    const status = readStatusFile(file);
    expect(status.events.map((event) => event.step)).toEqual(["apply", "seed"]);
    expect(status.events[1]).toMatchObject({ mode: "replace", keys: 6 });
    expect(status.configPath).toBe(file);
    expect(status.updatedAt).toBe(status.events[1]?.at);
  });

  it("caps the trail so a long-lived install cannot grow it without bound", () => {
    for (let index = 0; index < 40; index += 1) recordStatus("wrote", { index }, file);
    const status = readStatusFile(file);
    expect(status.events).toHaveLength(30);
    // The NEWEST survive: a trail that dropped the recent events would be useless for diagnosis.
    expect(status.events.at(-1)).toMatchObject({ index: 39 });
  });

  it("starts a fresh trail rather than throwing on a corrupt file", () => {
    writeFileSync(statusPath(file), "{ not json");
    expect(() => recordStatus("apply", {}, file)).not.toThrow();
    expect(readStatusFile(file).events.map((event) => event.step)).toEqual(["apply"]);
  });

  it("never throws when the trail cannot be written at all", () => {
    // A path whose parent is a FILE: mkdir/ write both fail, and the plugin must not care.
    const blocked = join(file, "nested", "coding-agent.json");
    expect(() => recordStatus("apply", {}, blocked)).not.toThrow();
  });

  it("keeps the trail readable by the owner only", () => {
    recordStatus("apply", {}, file);
    expect(statSync(statusPath(file)).mode & 0o777).toBe(0o600);
  });
});
