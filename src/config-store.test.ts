import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  configPath,
  describeSources,
  readConfigFile,
  reconcileConfigValues,
  validatePatch,
  writeConfigValues,
} from "./config-store";

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hindsight-settings-"));
  file = join(dir, "coding-agent.json");
});

const written = (): Record<string, unknown> => JSON.parse(readFileSync(file, "utf8"));

describe("configPath", () => {
  it("honours HINDSIGHT_CONFIG, the same override upstream uses", () => {
    expect(configPath({ HINDSIGHT_CONFIG: "/tmp/x.json" } as NodeJS.ProcessEnv)).toBe(
      "/tmp/x.json"
    );
  });

  it("falls back to ~/.hindsight/coding-agent.json", () => {
    expect(configPath({} as NodeJS.ProcessEnv).endsWith("/.hindsight/coding-agent.json")).toBe(
      true
    );
  });
});

describe("readConfigFile", () => {
  it("treats an absent file as an empty snapshot, not an error", () => {
    const snapshot = readConfigFile(file);
    expect(snapshot.values).toEqual({});
    expect(snapshot.error).toBeUndefined();
  });

  it("reports unparsable JSON instead of throwing", () => {
    writeFileSync(file, "{ not json");
    const snapshot = readConfigFile(file);
    expect(snapshot.error).toContain("not valid JSON");
    expect(snapshot.values).toEqual({});
  });

  it("surfaces the harness section that wins over the top level", () => {
    writeFileSync(
      file,
      JSON.stringify({ bankId: "top", harnesses: { dsh: { bankId: "harness" } } })
    );
    const snapshot = readConfigFile(file);
    expect(snapshot.values.bankId).toBe("top");
    expect(snapshot.harness.bankId).toBe("harness");
  });
});

describe("validatePatch", () => {
  it("refuses unknown keys", () => {
    expect(validatePatch({ nope: 1 })).toEqual([{ key: "nope", message: "unknown setting" }]);
  });

  it("refuses file-only keys", () => {
    const [error] = validatePatch({ banks: {} });
    expect(error?.message).toContain("file-only");
  });

  it("checks the declared kind", () => {
    expect(validatePatch({ retainSessions: "maybe" })[0]?.message).toContain("true or false");
    expect(validatePatch({ pageSearchLimit: "ten" })[0]?.message).toContain("must be a number");
    expect(validatePatch({ autoInject: "sometimes" })[0]?.message).toContain("must be one of");
    expect(validatePatch({ retainTags: [1] })[0]?.message).toContain("list of strings");
  });

  it("accepts null, which means remove", () => {
    expect(validatePatch({ bankId: null })).toEqual([]);
  });
});

describe("writeConfigValues", () => {
  it("merges managed keys and preserves everything else verbatim", () => {
    writeFileSync(
      file,
      JSON.stringify({ bankId: "old", banks: { "a::b": { disabled: true } }, myOwnKey: [1, 2] })
    );
    const result = writeConfigValues({ bankId: "new", logLevel: "debug" }, file);
    expect(result.changed).toBe(true);
    expect(written()).toEqual({
      bankId: "new",
      logLevel: "debug",
      banks: { "a::b": { disabled: true } },
      myOwnKey: [1, 2],
    });
  });

  it("does not touch the file when nothing changed", () => {
    writeFileSync(file, JSON.stringify({ bankId: "same" }));
    const before = statSync(file).mtimeMs;
    const result = writeConfigValues({ bankId: "same" }, file);
    expect(result.changed).toBe(false);
    expect(statSync(file).mtimeMs).toBe(before);
  });

  it("removes a key when the patch says null", () => {
    writeFileSync(file, JSON.stringify({ bankId: "x", logLevel: "debug" }));
    const result = writeConfigValues({ bankId: null }, file);
    expect(result.removed).toEqual(["bankId"]);
    expect(written()).toEqual({ logLevel: "debug" });
  });

  it("refuses to overwrite a file it cannot parse", () => {
    writeFileSync(file, "{ broken");
    expect(() => writeConfigValues({ bankId: "x" }, file)).toThrow(/not valid JSON/);
    expect(readFileSync(file, "utf8")).toBe("{ broken");
  });

  it("writes the file owner-only, because it can hold an api token", () => {
    writeConfigValues({ apiToken: "secret" }, file);
    expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it("rejects an invalid patch before it reaches the disk", () => {
    expect(() => writeConfigValues({ retainSessions: "maybe" }, file)).toThrow(/true or false/);
    expect(() => readFileSync(file, "utf8")).toThrow();
  });
});

describe("reconcileConfigValues", () => {
  it("clears a managed key the row no longer has", () => {
    writeFileSync(file, JSON.stringify({ bankId: "x", logLevel: "debug" }));
    reconcileConfigValues({}, file);
    expect(written()).toEqual({});
  });

  it("never deletes a secret just because the row does not carry it", () => {
    writeFileSync(file, JSON.stringify({ apiToken: "token", bankId: "x" }));
    const result = reconcileConfigValues({ bankId: "x" }, file);
    expect(result.changed).toBe(false);
    expect(written()).toEqual({ apiToken: "token", bankId: "x" });
  });

  it("still writes a secret the page explicitly set", () => {
    writeFileSync(file, JSON.stringify({ apiToken: "old" }));
    reconcileConfigValues({ apiToken: "" }, file);
    expect(written()).toEqual({ apiToken: "" });
  });

  it("leaves file-only keys alone", () => {
    writeFileSync(
      file,
      JSON.stringify({ banks: { "a::b": {} }, pages: { "Component map": false } })
    );
    reconcileConfigValues({}, file);
    expect(written()).toEqual({ banks: { "a::b": {} }, pages: { "Component map": false } });
  });
});

describe("describeSources", () => {
  it("reports each layer separately instead of inventing a resolved value", () => {
    writeFileSync(
      file,
      JSON.stringify({ bankId: "top", harnesses: { dsh: { bankId: "harness" } } })
    );
    const sources = describeSources(readConfigFile(file), {
      HINDSIGHT_BANK_ID: "from-env",
    } as NodeJS.ProcessEnv);
    const bankId = sources.find((source) => source.key === "bankId");
    expect(bankId).toEqual({ key: "bankId", harness: "harness", file: "top", env: "from-env" });
  });
});
