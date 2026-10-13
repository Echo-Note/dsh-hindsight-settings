import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONFIG_FIELDS,
  EDITABLE_FIELDS,
  FIELD_GROUPS,
  type FieldKind,
  type LocalizedText,
} from "./fields";
import { ENTRY_ID, PACKAGE_NAME } from "./namespace";

/** The two languages the page renders; a third would fail these guards, which is the point. */
const LANGUAGES = ["en", "zh"] as const;

/** The localized parts of one field or group, paired with a name for the failure message. */
function localizedTexts(): Array<{ subject: string; text: LocalizedText }> {
  return [
    ...FIELD_GROUPS.map((group) => ({
      subject: `group ${group.id} title`,
      text: group.title,
    })),
    ...FIELD_GROUPS.map((group) => ({
      subject: `group ${group.id} summary`,
      text: group.summary,
    })),
    ...CONFIG_FIELDS.map((field) => ({ subject: `${field.key} summary`, text: field.summary })),
  ];
}

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

  it("gives every field and group BOTH languages, non-empty", () => {
    // A missing translation must fail here, in Node, rather than render as an empty row in the page.
    const texts = localizedTexts();
    // 7 group titles + 7 group summaries + one summary per field.
    expect(texts).toHaveLength(FIELD_GROUPS.length * 2 + CONFIG_FIELDS.length);
    for (const { subject, text } of texts) {
      for (const language of LANGUAGES) {
        expect(typeof text[language], `${subject} [${language}] type`).toBe("string");
        expect(text[language].trim(), `${subject} [${language}] empty`).not.toBe("");
      }
    }
  });

  it("keeps the two languages genuinely different, so no copy-paste left English equal to Chinese", () => {
    for (const { subject, text } of localizedTexts()) {
      expect(text.en, subject).not.toBe(text.zh);
    }
    // And no two entries share a translation, which a duplicated object literal would cause.
    for (const language of LANGUAGES) {
      const values = localizedTexts().map(({ text }) => text[language]);
      expect(new Set(values).size, `${language} duplicates`).toBe(values.length);
    }
  });

  it("keeps the Chinese authoritative: it is byte-identical to the committed table", () => {
    // The Chinese was written from upstream's README, and both languages now live in one table, so
    // adding English could silently reword it. Compare every `zh` literal with the value the
    // table carried before this change (git HEAD): rewording one byte fails here. Skipped when the
    // checkout is not a git repository, so a tarball install still runs the rest of the suite.
    let committed: string;
    try {
      committed = execFileSync("git", ["show", "HEAD:src/fields.ts"], {
        cwd: packageRoot,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch {
      return;
    }

    /** Every quoted string a `summary:` / `title:` line holds, in the JSON form the table stores. */
    const quotedLiterals = (text: string): string[] =>
      [...text.matchAll(/\b(?:summary|title):\s*("(?:[^"\\]|\\.)*")/g)].flatMap((match) =>
        match[1] === undefined ? [] : [match[1]]
      );

    const committedLiterals = quotedLiterals(committed);
    // 7 groups × (title + summary) + one summary per field.
    expect(committedLiterals).toHaveLength(FIELD_GROUPS.length * 2 + CONFIG_FIELDS.length);

    const shipped = readFileSync(join(packageRoot, "src", "fields.ts"), "utf8");
    for (const literal of committedLiterals) {
      // The literal is the JSON-encoded form the table now must still carry verbatim.
      expect(shipped.includes(literal), `${literal.slice(0, 24)} reworded`).toBe(true);
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

describe("the routing fields explain the documented resolution order in BOTH languages", () => {
  /** The summary of one field, in one language. */
  const textOf = (key: string, language: (typeof LANGUAGES)[number]): string => {
    const field = CONFIG_FIELDS.find((candidate) => candidate.key === key);
    if (!field) throw new Error(`no field ${key}`);
    return field.summary[language];
  };

  it("says what sets a bank, in the order the plugin resolves it", () => {
    for (const language of LANGUAGES) {
      // The resolution order names the same three settings in both languages.
      expect(textOf("bankId", language), language).toContain("mapPathToBank");
      expect(textOf("bankId", language), language).toContain("bankIdTemplate");
      // mapPathToBank outranks an explicit bankId.
      expect(textOf("mapPathToBank", language), language).toContain("bankId");
      // {gitProject} and {harness}-{gitProject} must survive translation verbatim.
      expect(textOf("bankIdTemplate", language), language).toContain("{gitProject}");
      expect(textOf("bankIdTemplate", language), language).toContain("{harness}-{gitProject}");
    }
    // The Chinese keeps its own wording for "overrides bankId"; English says it in English.
    expect(textOf("mapPathToBank", "zh")).toContain("盖过 bankId");
    expect(textOf("mapPathToBank", "en")).toContain("override bankId");
  });

  it("explains dynamicBankId in both directions, because the default is conditional", () => {
    for (const language of LANGUAGES) {
      const text = textOf("dynamicBankId", language);
      expect(text, language).toContain("true");
      expect(text, language).toContain("false");
      // Both halves must explain the static-force branch, not just the dynamic one.
      expect(text, language).toContain("bankId");
    }
    expect(textOf("dynamicBankId", "zh")).toContain("动态");
    expect(textOf("dynamicBankId", "zh")).toContain("强制静态");
    expect(textOf("dynamicBankId", "en")).toContain("dynamically");
    expect(textOf("dynamicBankId", "en")).toContain("force static");
  });

  it("separates the credential from the isolation boundary, because a shared key has neither", () => {
    for (const language of LANGUAGES) {
      const text = textOf("apiToken", language);
      // The credential is server/account level and does not carry user identity.
      expect(text, language).toContain("tenant");
      // The bank name is not a security boundary — the claim must survive in both languages.
      expect(text, language).toContain("bank");
    }
    expect(textOf("apiToken", "zh")).toContain("服务器/账号级");
    expect(textOf("apiToken", "zh")).toContain("不携带用户身份");
    expect(textOf("apiToken", "zh")).toContain("不是安全边界");
    // The two documented ways to isolate users, so the row does not imply a token carries identity.
    expect(textOf("apiToken", "en")).toContain("server/account-level");
    expect(textOf("apiToken", "en")).toContain("no user identity");
    expect(textOf("apiToken", "en")).toContain("not a security boundary");
  });

  it("no longer claims banks and paths are file-only now that the page edits banks", () => {
    for (const language of LANGUAGES) {
      expect(textOf("paths", language), language).toContain("banks.<id>");
    }
    expect(textOf("banks", "zh")).toContain("按项目");
    expect(textOf("banks", "zh")).not.toContain("只能在配置文件里编辑");
    expect(textOf("paths", "zh")).toContain("仅文件可编辑");
    expect(textOf("banks", "en")).toContain("By project (banks)");
    expect(textOf("banks", "en")).not.toContain("only in the config file");
    expect(textOf("paths", "en")).toContain("Editable only in the file");
  });
});
