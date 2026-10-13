import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONFIG_FIELDS, EDITABLE_FIELDS, FIELD_GROUPS, type FieldKind } from "./fields";
import { ENTRY_ID, PACKAGE_NAME } from "./namespace";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Upstream's env naming rule, which its own docs test enforces: HINDSIGHT_ + SCREAMING_SNAKE(key). */
function expectedEnv(key: string): string {
  return `HINDSIGHT_${key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}`;
}

describe("field table", () => {
  it("declares every key once", () => {
    const keys = CONFIG_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("places every field in a declared group, and leaves no group empty", () => {
    const declared = new Set(FIELD_GROUPS.map((group) => group.id));
    for (const field of CONFIG_FIELDS) expect(declared.has(field.group)).toBe(true);
    for (const group of declared) {
      expect(CONFIG_FIELDS.some((field) => field.group === group)).toBe(true);
    }
  });

  it("keeps a nested value out of the form", () => {
    for (const field of CONFIG_FIELDS) {
      if (field.kind === "json") expect(field.editable).toBe(false);
      if (!field.editable)
        expect(
          field.kind === "json" || field.key === "autoReflect" || field.key === "harness"
        ).toBe(true);
    }
  });

  it("spells an env variable the way upstream does", () => {
    for (const field of CONFIG_FIELDS) {
      if (field.env === undefined) continue;
      expect(field.env).toBe(expectedEnv(field.key));
    }
  });

  it("gives every enum its allowed values", () => {
    for (const field of CONFIG_FIELDS) {
      if (field.kind !== "enum") continue;
      expect(field.values?.length).toBeGreaterThan(0);
    }
  });

  it("defaults to the type the kind promises", () => {
    const expected: Record<FieldKind, string> = {
      boolean: "boolean",
      number: "number",
      string: "string",
      secret: "string",
      enum: "string",
      stringList: "object",
      json: "object",
    };
    for (const field of CONFIG_FIELDS) {
      if (field.default === null) continue;
      expect(typeof field.default).toBe(expected[field.kind]);
    }
  });

  it("covers the env-backed surface upstream actually reads", () => {
    // Upstream's ENV_KEYS holds 42 entries and its docs test asserts the HINDSIGHT_<CAPS> rule for
    // all of them; a table that describes fewer fields than that has lost settings.
    expect(CONFIG_FIELDS.filter((field) => field.env !== undefined).length).toBeGreaterThanOrEqual(
      42
    );
    expect(EDITABLE_FIELDS.length).toBeGreaterThan(30);
  });
});

describe("package wiring", () => {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
    name: string;
    exports: Record<string, string>;
    dsh: { bundle?: { patch?: string }; client?: { platform?: string; inject?: string[] } };
  };

  it("keeps the name the loader and the module table both key on", () => {
    expect(manifest.name).toBe(PACKAGE_NAME);
  });

  it("ships the browser half where the client module system looks for it", () => {
    expect(manifest.exports["./client"]).toBe("./lib/client.js");
    expect(manifest.dsh.client?.platform).toBe("web");
  });

  it("mounts the row under the id the form namespace must equal", () => {
    const patchPath = manifest.dsh.bundle?.patch;
    expect(patchPath).toBe("./cordis.patch.yml");
    const patch = readFileSync(join(packageRoot, patchPath ?? ""), "utf8");
    // The settings form namespace IS the Loader entry id, so a rename in one place and not the
    // other detaches the page from its own form.
    expect(patch).toContain(`id: ${ENTRY_ID}`);
    expect(patch).toContain(`name: '${PACKAGE_NAME}'`);
  });
});

describe("the routing fields explain the documented resolution order", () => {
  const summaryOf = (key: string): string =>
    CONFIG_FIELDS.find((field) => field.key === key)?.summary ?? "";

  it("says what sets a bank, in the order the plugin resolves it", () => {
    expect(summaryOf("bankId")).toContain("mapPathToBank");
    expect(summaryOf("mapPathToBank")).toContain("盖过 bankId");
    expect(summaryOf("bankIdTemplate")).toContain("{gitProject}");
    expect(summaryOf("bankIdTemplate")).toContain("{harness}-{gitProject}");
  });

  it("explains dynamicBankId in both directions, because the default is conditional", () => {
    const text = summaryOf("dynamicBankId");
    expect(text).toContain("true");
    expect(text).toContain("false");
    expect(text).toContain("动态");
  });

  it("separates the credential from the isolation boundary, because a shared key has neither", () => {
    const text = summaryOf("apiToken");
    expect(text).toContain("服务器/账号级");
    expect(text).toContain("不携带用户身份");
    // The two documented ways to isolate users, so the row does not imply a token carries identity.
    expect(text).toContain("tenant 扩展");
    expect(text).toContain("不是安全边界");
  });

  it("no longer claims banks and paths are file-only now that the page edits banks", () => {
    expect(summaryOf("banks")).toContain("按项目");
    expect(summaryOf("banks")).not.toContain("只能在配置文件里编辑");
    expect(summaryOf("paths")).toContain("仅文件可编辑");
  });
});
