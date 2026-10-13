/**
 * Unit tests for the pure page model.
 *
 * The write contract is the part of this page that can damage a user's config, and it is entirely
 * pure — so it is tested here, in Node, with no browser and no React. What the page *renders* is not
 * tested here and cannot be: that needs a real browser, and `scripts/dsh-client-smoke.mjs` only
 * proves bundle shape and the slot registration.
 *
 * The copy is tested as data. Every user-visible sentence ships in `DICTIONARIES`, so the last block
 * below scans BOTH client sources and fails on a stray CJK literal outside the dictionary block —
 * that is the cheap half of what `verify-client-ui-i18n` enforces, kept here so the build cannot
 * regress into hardcoded Chinese.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONFIG_FIELDS, FIELD_GROUPS, type FieldKind } from "../fields";
import {
  BANKS_HELP,
  BANKS_TAB_ID,
  CONTRIBUTION,
  DICTIONARIES,
  LOCALE_NS,
  SETTINGS_SLOT,
  SERVICE_KEY,
  activeLanguage,
  banksScopeText,
  buildSections,
  buildTabs,
  describeAvailability,
  diffDraft,
  draftFromFields,
  draftValueFor,
  effectiveText,
  fallbackText,
  fallbackTranslate,
  fieldMetadata,
  fieldSummary,
  formatDefault,
  formatFieldValue,
  groupDescriptor,
  isLocalizedText,
  jsonEquals,
  localizedText,
  makeTranslate,
  pageLabel,
  parseDraft,
  pathsReadOnlyText,
  prefillValueFor,
  readOnlyText,
  remoteErrorText,
  scopeLabel,
  scopedEditorTitle,
  splitForScope,
  shadowText,
  summarizeApply,
  unsetText,
  valueSourceNote,
  type ActiveLanguage,
  type CopyContext,
  type CopyKey,
  type SettingsFieldView,
  type Translate,
} from "./model";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Copy fixtures
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A translate function over the shipped dictionaries (never the live service) in one language. */
function translateFor(lang: ActiveLanguage): Translate {
  return (key, params) => {
    const template = DICTIONARIES[lang][key as CopyKey];
    if (template === undefined) throw new Error(`no dictionary entry for ${key}`);
    return params === undefined
      ? template
      : template.replace(/\{(\w+)\}/g, (match, name: string) =>
          name in params ? String(params[name]) : match
        );
  };
}

/** The whole copy context a helper needs: one language, the dictionaries bound to it. */
function copyIn(lang: ActiveLanguage): CopyContext {
  return { lang, t: translateFor(lang) };
}

const ZH = copyIn("zh");
const EN = copyIn("en");

interface FieldSpec {
  readonly key: string;
  readonly kind?: FieldKind;
  readonly group?: string;
  readonly values?: readonly string[];
  readonly defaultValue?: string | number | boolean | null;
  readonly env?: string;
  readonly editable?: boolean;
  readonly scope?: string;
  readonly summary?: string;
  readonly value?: unknown;
  readonly inFile?: boolean;
  readonly shadowed?: boolean;
}

/** Build a `describe()` field row. Optional keys are omitted, never set to `undefined`. */
function makeField(spec: FieldSpec): SettingsFieldView {
  const value = spec.value === undefined ? null : spec.value;
  return {
    key: spec.key,
    group: spec.group ?? "connection",
    kind: spec.kind ?? "string",
    default: spec.defaultValue === undefined ? null : spec.defaultValue,
    editable: spec.editable ?? true,
    scope: spec.scope ?? "global",
    // The host still sends its own one-line description as a plain string; the page only falls back
    // to it for a key the bundled bilingual table does not declare.
    summary: spec.summary ?? `${spec.key} summary`,
    value,
    inFile: spec.inFile ?? value !== null,
    shadowedByHarness: spec.shadowed ?? false,
    ...(spec.values === undefined ? {} : { values: spec.values }),
    ...(spec.env === undefined ? {} : { env: spec.env }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The dictionaries
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("the locale dictionaries", () => {
  const en = DICTIONARIES.en;
  const zh = DICTIONARIES.zh;
  const enKeys = Object.keys(en).sort();
  const zhKeys = Object.keys(zh).sort();

  it("ships both locales with exactly the same key set", () => {
    expect(zhKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(100);
  });

  it("gives every key a non-empty string in both locales", () => {
    for (const [locale, dict] of [
      ["en", en],
      ["zh", zh],
    ] as const) {
      for (const [key, value] of Object.entries(dict)) {
        expect(typeof value, `${locale}.${key}`).toBe("string");
        expect(value.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  it("composes copy through {name} placeholders, never through concatenation", () => {
    // The interpolated keys are the ones the page must not build by string addition: an English and
    // a Chinese sentence put the value in different places.
    const interpolated: readonly CopyKey[] = [
      "unset.optionPrefix",
      "errors.readFailed",
      "errors.saveFailed",
      "errors.invalidFields",
      "errors.invalidFieldsShort",
      "errors.parseNumber",
      "errors.parseBoolean",
      "errors.parseEnum",
      "errors.parseJson",
      "errors.unparsableFile",
      "notice.saved",
      "notice.writes",
      "notice.removals",
      "notice.touched",
      "source.defaultTop",
      "source.defaultBank",
      "fallback.line",
      "fallback.default",
      "fallback.env",
      "banks.count",
      "banks.keysCount",
      "banks.keysSet",
      "banks.addExists",
      "banks.editTitle",
      "banks.pathKeysSuffix",
      "banks.pathKeysList",
      "editor.countAndPath",
      "actions.saveTo",
      "actions.saveCount",
      "counts.fieldsAndGroups",
      "unavailable.noNamespace",
      "unavailable.mountFailed",
      "unavailable.initFailed",
      "field.clearUnsetStored",
    ];
    for (const key of interpolated) {
      expect(en[key], `en.${key}`).toMatch(/\{\w+\}/);
      expect(zh[key], `zh.${key}`).toMatch(/\{\w+\}/);
    }
  });

  it("uses the same placeholder names in both locales", () => {
    const names = (template: string): readonly string[] =>
      [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string).sort();
    for (const key of Object.keys(en) as CopyKey[]) {
      expect(names(zh[key]), `placeholders of ${key}`).toEqual(names(en[key]));
    }
  });

  it("treats anything that is not zh as English, the only two shipped locales", () => {
    expect(activeLanguage("zh")).toBe("zh");
    expect(activeLanguage("en")).toBe("en");
    expect(activeLanguage(undefined)).toBe("en");
    expect(activeLanguage("ja")).toBe("en");
  });

  it("falls back to English for a composition with no locale service", () => {
    expect(fallbackTranslate("title")).toBe(en.title);
    expect(fallbackTranslate("banks.keysCount", { count: 2 })).toBe("2 key(s)");
    // A guard, not a live path: an unknown key must not come out `undefined`.
    expect(fallbackTranslate("no.such.key")).toBe("no.such.key");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// No user-visible literal outside the dictionaries
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** CJK Unified Ideographs plus the compatibility and extension-A planes. */
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;

const CLIENT_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Everything in a client source EXCEPT the dictionary block, with all comments removed.
 *
 * The dictionary block is the one place Chinese is allowed to be a literal, so it is masked out by
 * its markers first; comments go next, because prose about the feature is written in Chinese and is
 * not user-visible copy.
 */
function outsideDictionaries(source: string): string {
  const masked = source
    .replace(/\/\/ >>> dictionaries[\s\S]*?\/\/ <<< dictionaries/, "// (dictionaries)")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
  return masked;
}

describe("no user-visible literal lives outside the dictionaries", () => {
  for (const file of ["model.ts", "index.tsx"]) {
    it(`${file} has no CJK outside its dictionary block`, () => {
      const source = readFileSync(join(CLIENT_DIR, file), "utf8");
      const stripped = outsideDictionaries(source);
      expect(stripped.match(CJK) ?? [], `CJK literal in ${file}`).toEqual([]);
    });
  }

  it("keeps model.ts's dictionary block as the model's only Chinese text", () => {
    const source = readFileSync(join(CLIENT_DIR, "model.ts"), "utf8");
    const block = source.match(/\/\/ >>> dictionaries[\s\S]*?\/\/ <<< dictionaries/)?.[0] ?? "";
    // The block itself must actually carry the Chinese dictionary, or the scan above would pass for
    // the wrong reason (a deleted dictionary, not a translated page).
    expect(block).toContain("记忆");
    expect(block.match(CJK)?.length ?? 0).toBeGreaterThan(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Sections, tabs and the metadata that comes from the shared table
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("sections", () => {
  it("emits every declared group in FIELD_GROUPS order, empty ones included", () => {
    const sections = buildSections([], "zh");
    expect(sections.map((section) => section.group.id)).toEqual(FIELD_GROUPS.map((g) => g.id));
    expect(sections.every((section) => section.fields.length === 0)).toBe(true);
  });

  it("takes the group heading from the bundled table, in the active language", () => {
    const zh = buildSections([], "zh")[0];
    const en = buildSections([], "en")[0];
    expect(zh?.group.title).toBe("连接");
    expect(en?.group.title).toBe("Connection");
    expect(zh?.group.summary).toBe(localizedText(FIELD_GROUPS[0]!.summary, "zh"));
    expect(en?.group.summary).toBe(localizedText(FIELD_GROUPS[0]!.summary, "en"));
    // Every declared group has a real heading in both languages, and the two differ.
    for (const entry of FIELD_GROUPS) {
      expect(localizedText(entry.title, "en"), entry.id).not.toBe(localizedText(entry.title, "zh"));
      expect(localizedText(entry.summary, "en"), entry.id).not.toBe(
        localizedText(entry.summary, "zh")
      );
    }
    // Same entry, two languages: the shape itself resolves per language.
    expect(localizedText({ en: "Connection", zh: "连接" }, "en")).toBe("Connection");
    expect(localizedText({ en: "Connection", zh: "连接" }, "zh")).toBe("连接");
  });

  it("places each field in its own group and orders it by the shared table", () => {
    // Deliberately reversed: the page must re-sort by CONFIG_FIELDS, not trust host order.
    const fields = [
      makeField({ key: "apiToken", group: "connection", kind: "secret" }),
      makeField({ key: "serverMode", group: "connection", kind: "enum", values: ["cloud"] }),
    ];
    const sections = buildSections(fields, "zh");
    const connection = sections.find((section) => section.group.id === "connection");
    expect(connection?.fields.map((field) => field.key)).toEqual(["serverMode", "apiToken"]);
  });

  it("appends a group this build has no heading for instead of dropping its fields", () => {
    const sections = buildSections([makeField({ key: "mystery", group: "brand-new" })], "zh");
    const appended = sections.at(-1);
    expect(appended?.group.id).toBe("brand-new");
    expect(appended?.fields.map((field) => field.key)).toEqual(["mystery"]);
  });

  it("falls back to the raw id for an unknown group", () => {
    expect(groupDescriptor("nope", "zh")).toEqual({ id: "nope", title: "nope", summary: "" });
    expect(groupDescriptor("connection", "zh").title).toBe(
      localizedText(FIELD_GROUPS[0]!.title, "zh")
    );
  });
});

describe("field metadata", () => {
  it("prefers the bundled, localized table and never invents a summary", () => {
    const declared = fieldMetadata("serverMode");
    expect(declared).toBeDefined();
    const field = makeField({ key: "serverMode", summary: "host copy" });
    expect(fieldSummary(field, "zh")).toBe(localizedText(declared!.summary, "zh"));
    expect(fieldSummary(field, "en")).toBe(localizedText(declared!.summary, "en"));
    // Every declared field resolves; nothing is missing from the table.
    for (const entry of CONFIG_FIELDS) {
      const text = fieldSummary(makeField({ key: entry.key }), "en");
      expect(text.length, entry.key).toBeGreaterThan(0);
      expect(text, entry.key).not.toBe(`${entry.key} summary`);
    }
  });

  it("renders the REAL bilingual table in whichever language is active", () => {
    // The shared table now ships both halves, so this is the page's actual path: the bundled entry
    // is picked by language, NOT the host's plain string (which is always the Chinese half).
    const field = makeField({ key: "serverMode", summary: "host copy" });
    expect(fieldSummary(field, "en")).toBe(
      "cloud = the official hosted service; self-hosted = your own server (used with apiUrl); daemon = the local hindsight-embed daemon (apiUrl is ignored)."
    );
    expect(fieldSummary(field, "zh")).toBe(
      "cloud = 官方托管；self-hosted = 你自己的服务器（配合 apiUrl）；daemon = 本机 hindsight-embed 守护进程（apiUrl 被忽略）。"
    );
    expect(fieldSummary(field, "en")).not.toBe(fieldSummary(field, "zh"));
    // Every declared key resolves to a real translation in BOTH languages.
    for (const entry of CONFIG_FIELDS) {
      const row = makeField({ key: entry.key, summary: "host copy" });
      const en = fieldSummary(row, "en");
      const zh = fieldSummary(row, "zh");
      expect(en, entry.key).not.toBe("host copy");
      expect(zh, entry.key).not.toBe("host copy");
      expect(en.length, entry.key).toBeGreaterThan(0);
      expect(zh.length, entry.key).toBeGreaterThan(0);
    }
  });

  it("falls back to the host's own string for a key this build does not know", () => {
    const field = makeField({ key: "upstream-added-this", summary: "宿主自带的说明" });
    expect(fieldMetadata("upstream-added-this")).toBeUndefined();
    expect(fieldSummary(field, "zh")).toBe("宿主自带的说明");
    expect(fieldSummary(field, "en")).toBe("宿主自带的说明");
  });

  it("recognises the bilingual shape and passes a plain string through", () => {
    expect(isLocalizedText({ en: "a", zh: "甲" })).toBe(true);
    expect(isLocalizedText("plain")).toBe(false);
    expect(isLocalizedText({ en: "", zh: "甲" })).toBe(false);
    expect(localizedText("plain", "zh")).toBe("plain");
  });
});

describe("tabs", () => {
  it("emits one tab per declared group in FIELD_GROUPS order, with banks last", () => {
    const tabs = buildTabs([], ZH);
    expect(tabs.map((tab) => tab.id)).toEqual([
      ...FIELD_GROUPS.map((group) => group.id),
      BANKS_TAB_ID,
    ]);
    expect(tabs.filter((tab) => tab.kind === "group")).toHaveLength(FIELD_GROUPS.length);
    expect(tabs.at(-1)?.kind).toBe("banks");
    expect(tabs.at(-1)?.title).toContain("banks");
    expect(tabs.at(-1)?.fields).toEqual([]);
  });

  it("heads every group tab in the active language", () => {
    expect(buildTabs([], EN).find((tab) => tab.id === "connection")?.title).toBe("Connection");
    expect(buildTabs([], ZH).find((tab) => tab.id === "connection")?.title).toBe("连接");
  });

  it("words the banks tab in the active language", () => {
    expect(buildTabs([], ZH).at(-1)?.title).toBe(DICTIONARIES.zh["tabs.banks.title"]);
    expect(buildTabs([], EN).at(-1)?.title).toBe(DICTIONARIES.en["tabs.banks.title"]);
    expect(buildTabs([], ZH).at(-1)?.summary).toBe(DICTIONARIES.zh["tabs.banks.summary"]);
  });

  it("puts a field only on its own group's tab", () => {
    const fields = [
      makeField({ key: "apiUrl", group: "connection", value: "http://x", inFile: true }),
      makeField({ key: "logLevel", group: "scope", value: "info", inFile: true }),
    ];
    const tabs = buildTabs(fields, ZH);
    const fieldsOf = (id: string): readonly string[] =>
      tabs.find((tab) => tab.id === id)?.fields.map((field) => field.key) ?? [];
    expect(fieldsOf("connection")).toEqual(["apiUrl"]);
    expect(fieldsOf("scope")).toEqual(["logLevel"]);
    expect(fieldsOf("recall")).toEqual([]);
    expect(fieldsOf(BANKS_TAB_ID)).toEqual([]);
  });

  it("gives a host-reported unknown group its own tab instead of dropping its fields", () => {
    const tabs = buildTabs([makeField({ key: "mystery", group: "brand-new" })], ZH);
    expect(tabs.map((tab) => tab.id)).toEqual([
      ...FIELD_GROUPS.map((group) => group.id),
      "brand-new",
      BANKS_TAB_ID,
    ]);
    expect(tabs.find((tab) => tab.id === "brand-new")?.fields.map((f) => f.key)).toEqual([
      "mystery",
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Drafts
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("draft value round trip", () => {
  it("turns a scalar back into the text it came from", () => {
    expect(draftValueFor(makeField({ key: "apiUrl" }), "http://localhost:8888")).toBe(
      "http://localhost:8888"
    );
    expect(draftValueFor(makeField({ key: "apiPort", kind: "number" }), 9077)).toBe("9077");
    expect(draftValueFor(makeField({ key: "on", kind: "boolean" }), false)).toBe("false");
    expect(draftValueFor(makeField({ key: "apiToken", kind: "secret" }), null)).toBe("");
  });

  it("renders a list one item per line so parseDraft reads it back identically", () => {
    const field = makeField({ key: "retainTags", kind: "stringList" });
    const value = ["project:{gitProject}", "env:work"];
    expect(draftValueFor(field, value)).toBe("project:{gitProject}\nenv:work");
    expect(parseDraft(field, draftValueFor(field, value), ZH.t)).toEqual({ ok: true, value });
  });

  it("seeds one cell per field, empty for the ones the file does not set", () => {
    const draft = draftFromFields([
      makeField({ key: "apiUrl", value: "http://x", inFile: true }),
      makeField({ key: "apiToken", kind: "secret", inFile: false }),
    ]);
    expect(draft).toEqual({ apiUrl: "http://x", apiToken: "" });
  });

  it("prefills the EFFECTIVE default when the file does not set a field", () => {
    // apiPort is the reported case: unset in the file, default 9077, and previously an empty box.
    const field = makeField({ key: "apiPort", kind: "number", defaultValue: 9077, inFile: false });
    expect(effectiveText(field)).toBe("9077");
    expect(prefillValueFor(field)).toBe("9077");
    const draft = draftFromFields([
      field,
      makeField({ key: "apiUrl", value: "http://x", inFile: true, defaultValue: "http://d" }),
      makeField({ key: "embedVersion", inFile: false }),
    ]);
    expect(draft).toEqual({ apiPort: "9077", apiUrl: "http://x", embedVersion: "" });
  });

  it("keeps the file's value ahead of the default, even when the two differ", () => {
    const field = makeField({
      key: "serverMode",
      kind: "enum",
      values: ["cloud", "self-hosted"],
      defaultValue: "cloud",
      value: "self-hosted",
      inFile: true,
    });
    expect(prefillValueFor(field)).toBe("self-hosted");
  });

  it("does not prefill a secret's absent value", () => {
    // A secret is redacted from every response: an in-file secret must stay an empty box (the row's
    // placeholder is what says it is set).
    const field = makeField({ key: "apiToken", kind: "secret", value: null, inFile: true });
    expect(prefillValueFor(field)).toBe("");
  });
});

describe("parseDraft", () => {
  it("reads an exactly-empty cell as the removal instruction", () => {
    const kinds: readonly FieldKind[] = [
      "string",
      "secret",
      "number",
      "boolean",
      "enum",
      "stringList",
      "json",
    ];
    for (const kind of kinds) {
      const field = makeField(
        kind === "enum" ? { key: "k", kind, values: ["a"] } : { key: "k", kind }
      );
      expect(parseDraft(field, "", ZH.t)).toEqual({ ok: true, value: null });
    }
  });

  it("keeps strings and secrets verbatim, whitespace included", () => {
    const raw = "  保留 前后 空格  ";
    expect(parseDraft(makeField({ key: "apiUrl" }), raw, ZH.t)).toEqual({ ok: true, value: raw });
    expect(parseDraft(makeField({ key: "apiToken", kind: "secret" }), raw, ZH.t)).toEqual({
      ok: true,
      value: raw,
    });
  });

  it("parses numbers and rejects non-numbers", () => {
    const field = makeField({ key: "reflectTimeoutMs", kind: "number" });
    expect(parseDraft(field, "20000", ZH.t)).toEqual({ ok: true, value: 20000 });
    expect(parseDraft(field, " 20000 ", ZH.t)).toEqual({ ok: true, value: 20000 });
    expect(parseDraft(field, "20s", ZH.t).ok).toBe(false);
  });

  it("parses booleans and rejects anything else", () => {
    const field = makeField({ key: "retainSessions", kind: "boolean" });
    expect(parseDraft(field, "true", ZH.t)).toEqual({ ok: true, value: true });
    expect(parseDraft(field, "false", ZH.t)).toEqual({ ok: true, value: false });
    expect(parseDraft(field, "yes", ZH.t).ok).toBe(false);
  });

  it("enforces an enum's declared values", () => {
    const field = makeField({ key: "serverMode", kind: "enum", values: ["cloud", "daemon"] });
    expect(parseDraft(field, "daemon", ZH.t)).toEqual({ ok: true, value: "daemon" });
    expect(parseDraft(field, "local", ZH.t).ok).toBe(false);
  });

  it("splits a string list on newlines and commas and drops blanks", () => {
    const field = makeField({ key: "retainTags", kind: "stringList" });
    expect(parseDraft(field, "project:{gitProject}\nenv:work, ,\n  env:ci ", ZH.t)).toEqual({
      ok: true,
      value: ["project:{gitProject}", "env:work", "env:ci"],
    });
  });

  it("parses json and rejects malformed json", () => {
    const field = makeField({ key: "mapPathToBank", kind: "json" });
    expect(parseDraft(field, '{"a":"b"}', ZH.t)).toEqual({ ok: true, value: { a: "b" } });
    expect(parseDraft(field, "{oops", ZH.t).ok).toBe(false);
  });

  it("words a parse failure in the language it is handed", () => {
    const field = makeField({ key: "reflectTimeoutMs", kind: "number" });
    const zh = parseDraft(field, "20s", ZH.t);
    const en = parseDraft(field, "20s", EN.t);
    expect(zh.ok).toBe(false);
    expect(en.ok).toBe(false);
    if (!zh.ok && !en.ok) {
      expect(zh.message).toContain("reflectTimeoutMs");
      expect(zh.message).toBe(
        DICTIONARIES.zh["errors.parseNumber"]
          .replace("{key}", "reflectTimeoutMs")
          .replace("{value}", "20s")
      );
      expect(en.message).toBe(
        DICTIONARIES.en["errors.parseNumber"]
          .replace("{key}", "reflectTimeoutMs")
          .replace("{value}", "20s")
      );
      expect(zh.message).not.toBe(en.message);
    }
  });
});

describe("diffDraft", () => {
  const apiUrl = makeField({
    key: "apiUrl",
    value: "https://api.hindsight.vectorize.io",
    inFile: true,
    defaultValue: "https://api.hindsight.vectorize.io",
  });

  it("produces nothing for an untouched form", () => {
    const fields = [apiUrl];
    const diff = diffDraft(fields, draftFromFields(fields), ZH.t);
    expect(diff.patch).toEqual({});
    expect(diff.errors).toEqual([]);
    expect(diff.changed).toEqual([]);
  });

  it("produces nothing for a freshly loaded form, prefilled defaults included", () => {
    // The prefill is a baseline, not a pending write: opening the page (which now shows 9077 in
    // apiPort) and pressing Save must still send an empty patch.
    const fields = [
      apiUrl,
      makeField({ key: "apiPort", kind: "number", defaultValue: 9077, inFile: false }),
      makeField({
        key: "serverMode",
        kind: "enum",
        values: ["cloud"],
        defaultValue: "cloud",
        inFile: false,
      }),
      makeField({ key: "retainSessions", kind: "boolean", defaultValue: true, inFile: false }),
      makeField({ key: "apiToken", kind: "secret", value: null, inFile: true }),
      makeField({ key: "embedVersion", inFile: false }),
    ];
    const diff = diffDraft(fields, draftFromFields(fields), ZH.t);
    expect(diff.patch).toEqual({});
    expect(diff.changed).toEqual([]);
    expect(diff.errors).toEqual([]);
  });

  it("produces nothing for a field the file stores as an empty string", () => {
    // "empty in the file" and "cleared by the user" must not be confused: saving an untouched
    // empty value would otherwise delete a key the user never looked at.
    const fields = [makeField({ key: "toolGuideExtra", value: "", inFile: true })];
    expect(diffDraft(fields, draftFromFields(fields), ZH.t).patch).toEqual({});
  });

  it("emits one write per changed field", () => {
    const fields = [
      apiUrl,
      makeField({ key: "retainSessions", kind: "boolean", value: true, inFile: true }),
    ];
    const draft = draftFromFields(fields);
    draft.apiUrl = "http://localhost:8888";
    draft.retainSessions = "false";
    const diff = diffDraft(fields, draft, ZH.t);
    expect(diff.patch).toEqual({
      apiUrl: "http://localhost:8888",
      retainSessions: false,
    });
    expect(diff.changed).toEqual(["apiUrl", "retainSessions"]);
  });

  it("emits null when a field the file set is cleared", () => {
    const fields = [apiUrl];
    const diff = diffDraft(fields, { apiUrl: "" }, ZH.t);
    expect(diff.patch).toEqual({ apiUrl: null });
    expect(diff.changed).toEqual(["apiUrl"]);
  });

  it("never removes a field the file does not set", () => {
    const fields = [makeField({ key: "embedVersion" })];
    expect(diffDraft(fields, { embedVersion: "" }, ZH.t).patch).toEqual({});
  });

  it("writes a value the user typed that DIFFERS from the displayed default", () => {
    const fields = [
      makeField({
        key: "serverMode",
        kind: "enum",
        values: ["cloud", "self-hosted"],
        defaultValue: "cloud",
      }),
    ];
    expect(diffDraft(fields, { serverMode: "self-hosted" }, ZH.t).patch).toEqual({
      serverMode: "self-hosted",
    });
  });

  it("treats leaving the prefilled default alone as no change", () => {
    // With prefill, the default is already in the box, so re-typing it is not a distinct act: the
    // effective value is identical whether or not the file says it.
    const fields = [
      makeField({ key: "serverMode", kind: "enum", values: ["cloud"], defaultValue: "cloud" }),
    ];
    expect(diffDraft(fields, { serverMode: "cloud" }, ZH.t).patch).toEqual({});
  });

  it("still treats clearing a prefilled field the file does not set as a no-op", () => {
    const fields = [
      makeField({ key: "apiPort", kind: "number", defaultValue: 9077, inFile: false }),
    ];
    expect(diffDraft(fields, { apiPort: "" }, ZH.t).patch).toEqual({});
  });

  it("treats a re-typed value as no change", () => {
    const fields = [apiUrl];
    expect(diffDraft(fields, { apiUrl: "https://api.hindsight.vectorize.io" }, ZH.t).patch).toEqual(
      {}
    );
  });

  it("collects a parse failure and still submits the valid fields", () => {
    const fields = [
      apiUrl,
      makeField({ key: "apiPort", kind: "number", value: 9077, inFile: true }),
    ];
    const draft = draftFromFields(fields);
    draft.apiPort = "not-a-port";
    draft.apiUrl = "http://localhost:8888";
    const diff = diffDraft(fields, draft, ZH.t);
    expect(diff.errors.map((entry) => entry.key)).toEqual(["apiPort"]);
    expect(diff.patch).toEqual({ apiUrl: "http://localhost:8888" });
  });

  it("never touches a field the host marks read-only", () => {
    const fields = [makeField({ key: "banks", kind: "json", editable: false })];
    expect(diffDraft(fields, { banks: '{"sneaky":true}' }, ZH.t).patch).toEqual({});
  });
});

describe("jsonEquals", () => {
  it("compares lists and records structurally", () => {
    expect(jsonEquals(["a", "b"], ["a", "b"])).toBe(true);
    expect(jsonEquals(["a"], ["a", "b"])).toBe(false);
    expect(jsonEquals({ a: 1, b: [2] }, { b: [2], a: 1 })).toBe(true);
    expect(jsonEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(jsonEquals(1, "1")).toBe(false);
    expect(jsonEquals(null, undefined)).toBe(false);
  });
});

describe("display", () => {
  it("pretty-prints a nested map and names an absent value", () => {
    const field = makeField({ key: "mapPathToBank", kind: "json" });
    expect(formatFieldValue(field, { "/a": "bank-a" }, ZH.t)).toBe(
      JSON.stringify({ "/a": "bank-a" }, null, 2)
    );
    expect(formatFieldValue(field, null, ZH.t)).toBe(unsetText(ZH.t));
    expect(formatFieldValue(field, null, EN.t)).toBe(unsetText(EN.t));
    expect(
      formatFieldValue(makeField({ key: "retainTags", kind: "stringList" }), ["a", "b"], ZH.t)
    ).toBe("a\nb");
  });

  it("formats defaults, including the unset ones", () => {
    expect(
      formatDefault(makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }), ZH.t)
    ).toBe("9077");
    expect(formatDefault(makeField({ key: "apiToken", kind: "secret" }), ZH.t)).toBe(
      unsetText(ZH.t)
    );
  });

  it("labels every declared scope in the active language", () => {
    for (const scope of ["global", "harness", "bank", "path"]) {
      expect(scopeLabel(scope, ZH.t)).not.toBe(scope);
      expect(scopeLabel(scope, EN.t)).not.toBe(scope);
      expect(scopeLabel(scope, ZH.t)).not.toBe(scopeLabel(scope, EN.t));
    }
    // A scope this build does not declare is host vocabulary and passes through verbatim.
    expect(scopeLabel("tenant", ZH.t)).toBe("tenant");
  });

  it("names the default, the environment variable and the harness shadow", () => {
    const field = makeField({
      key: "serverMode",
      kind: "enum",
      values: ["cloud"],
      defaultValue: "cloud",
      env: "HINDSIGHT_SERVER_MODE",
    });
    expect(fallbackText(field, ZH)).toContain("cloud");
    expect(fallbackText(field, ZH)).toContain("HINDSIGHT_SERVER_MODE");
    expect(fallbackText(makeField({ key: "x" }), ZH)).toContain(DICTIONARIES.zh["fallback.none"]);
    expect(fallbackText(makeField({ key: "x" }), EN)).toContain(DICTIONARIES.en["fallback.none"]);
    expect(shadowText(ZH.t)).toContain("harnesses.dsh");
    expect(readOnlyText(ZH.t)).toBe(DICTIONARIES.zh["readonly.text"]);
    expect(readOnlyText(EN.t)).toBe(DICTIONARIES.en["readonly.text"]);
  });

  it("says where the value in the box came from", () => {
    expect(valueSourceNote(makeField({ key: "apiUrl", value: "http://x", inFile: true }), ZH)).toBe(
      DICTIONARIES.zh["source.inFile"]
    );
    expect(
      valueSourceNote(makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }), ZH)
    ).toBe(DICTIONARIES.zh["source.defaultTop"].replace("{value}", "9077"));
    expect(
      valueSourceNote(makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }), EN)
    ).toBe(DICTIONARIES.en["source.defaultTop"].replace("{value}", "9077"));
    expect(valueSourceNote(makeField({ key: "embedVersion" }), ZH)).toBeUndefined();
    // A bank scope must not claim the default IS the effective value: the top level wins there.
    const bankNote = valueSourceNote(
      makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }),
      ZH,
      "bank"
    );
    expect(bankNote).toContain("本 bank");
    expect(bankNote).toContain("顶层");
  });

  it("words the scope copy through the dictionaries", () => {
    expect(banksScopeText(ZH.t)).toBe(DICTIONARIES.zh["banks.scopeText"]);
    expect(pathsReadOnlyText(EN.t)).toBe(DICTIONARIES.en["banks.pathsReadOnly"]);
    expect(scopedEditorTitle({ kind: "bank", id: "b1" }, ZH.t)).toBe(
      DICTIONARIES.zh["banks.editTitle"].replace("{id}", "b1")
    );
    expect(scopedEditorTitle({ kind: "top" }, EN.t)).toBe(DICTIONARIES.en["scope.top"]);
    expect(pageLabel(ZH.t)).toBe(DICTIONARIES.zh.title);
    expect(pageLabel(EN.t)).toBe(DICTIONARIES.en.title);
    expect(LOCALE_NS).toBe("dsh-hindsight-settings");
  });
});

describe("availability", () => {
  const view = { path: "/tmp/x.json", fields: [] };

  it("stays silent only when the view is present and the file parsed", () => {
    expect(
      describeAvailability({
        state: { kind: "ready", service: {} as never },
        view,
        loadError: undefined,
        copy: ZH,
      })
    ).toBeUndefined();
  });

  it("renders a missing Remote service through the dictionary, not the stored key", () => {
    expect(
      describeAvailability({
        state: { kind: "unavailable", reasonKey: "unavailable.noRemote" },
        view: undefined,
        loadError: undefined,
        copy: ZH,
      })
    ).toBe(DICTIONARIES.zh["unavailable.noRemote"]);
    expect(
      describeAvailability({
        state: { kind: "unavailable", reasonKey: "unavailable.noRemote" },
        view: undefined,
        loadError: undefined,
        copy: EN,
      })
    ).toBe(DICTIONARIES.en["unavailable.noRemote"]);
  });

  it("interpolates the namespace into the not-mounted line", () => {
    const text = describeAvailability({
      state: {
        kind: "unavailable",
        reasonKey: "unavailable.noNamespace",
        reasonParams: { service: "remote.hindsightSettings" },
      },
      view: undefined,
      loadError: undefined,
      copy: EN,
    });
    expect(text).toContain("remote.hindsightSettings");
    expect(text).toBe(
      DICTIONARIES.en["unavailable.noNamespace"].replace("{service}", "remote.hindsightSettings")
    );
  });

  it("says it is loading before the first describe arrives", () => {
    expect(
      describeAvailability({
        state: { kind: "loading" },
        view: undefined,
        loadError: undefined,
        copy: ZH,
      })
    ).toBe(DICTIONARIES.zh["loading.text"]);
  });

  it("surfaces a failed describe call", () => {
    expect(
      describeAvailability({
        state: { kind: "ready", service: {} as never },
        view: undefined,
        loadError: DICTIONARIES.zh["errors.readFailed"].replace("{message}", "boom"),
        copy: ZH,
      })
    ).toContain("boom");
  });

  it("refuses to offer a save over an unparsable file, in the active language", () => {
    const input = {
      state: { kind: "ready", service: {} as never } as const,
      view: { path: "/tmp/x.json", error: "Unexpected token", fields: [] },
      loadError: undefined,
    };
    const zh = describeAvailability({ ...input, copy: ZH });
    const en = describeAvailability({ ...input, copy: EN });
    expect(zh).toContain("Unexpected token");
    expect(zh).toBe(
      DICTIONARIES.zh["errors.unparsableFile"].replace("{message}", "Unexpected token")
    );
    expect(en).toBe(
      DICTIONARIES.en["errors.unparsableFile"].replace("{message}", "Unexpected token")
    );
    expect(zh).not.toBe(en);
  });
});

describe("status and error copy", () => {
  it("prefers the host's own answer over the patch when reporting what changed", () => {
    expect(summarizeApply({ a: 1 }, { path: "p", changed: false, removed: [] }, ZH.t)).toBe(
      DICTIONARIES.zh["notice.unchanged"]
    );
    expect(summarizeApply({ a: 1 }, { path: "p", changed: false, removed: [] }, EN.t)).toBe(
      DICTIONARIES.en["notice.unchanged"]
    );
    const text = summarizeApply(
      { a: 1, b: null },
      { path: "p", changed: true, removed: ["b"] },
      ZH.t
    );
    expect(text).toContain("p");
    expect(text).toContain(DICTIONARIES.zh["notice.writes"].replace("{count}", "1"));
    expect(text).toContain(DICTIONARIES.zh["notice.removals"].replace("{count}", "1"));
  });

  it("still reports the path when the host says something changed but nothing is countable", () => {
    const text = summarizeApply({}, { path: "/tmp/x.json", changed: true, removed: [] }, EN.t);
    expect(text).toContain("/tmp/x.json");
    expect(text).toBe(
      DICTIONARIES.en["notice.saved"]
        .replace("{path}", "/tmp/x.json")
        .replace("{parts}", DICTIONARIES.en["notice.touched"].replace("{path}", "/tmp/x.json"))
    );
  });

  it("renders a RemoteError-shaped failure with its code", () => {
    expect(remoteErrorText({ code: "gateway/internal", message: "boom" })).toBe(
      "boom（gateway/internal）"
    );
    expect(remoteErrorText(new Error("plain"))).toBe("plain");
    expect(remoteErrorText("text")).toBe("text");
  });
});

/** The descriptor for one method, so a new invocation cannot break an index-based assertion. */
function descriptorOf(
  contribution: { readonly descriptors: readonly { readonly method: string }[] },
  method: string
): {
  readonly parameters?: readonly {
    readonly name: string;
    readonly source?: string;
    readonly codec?: { readonly mode?: string };
  }[];
} {
  const found = contribution.descriptors.find((descriptor) => descriptor.method === method);
  if (found === undefined) throw new Error(`no descriptor for ${method}`);
  return found as never;
}

describe("contribution contract", () => {
  it("targets the settings.section seat and the remote.<namespace> service key", () => {
    expect(SETTINGS_SLOT).toBe("settings.section");
    expect(SERVICE_KEY).toBe("remote.hindsightSettings");
  });

  it("declares every method with a unique id and a direct invocation", () => {
    const descriptors = CONTRIBUTION.descriptors as readonly Record<string, unknown>[];
    expect(CONTRIBUTION.package).toBe("@Echo-Note/dsh-hindsight-settings");
    // `note` carries the browser half's diagnostics; `applyScoped` is the banks.<id> write, and both
    // data methods sit next to it.
    expect(descriptors.map((d) => d.method)).toEqual(["describe", "note", "applyScoped", "apply"]);
    expect(new Set(descriptors.map((d) => d.id)).size).toBe(descriptors.length);
    for (const descriptor of descriptors) {
      expect(descriptor.service).toBe("hindsightSettings");
      expect(descriptor.namespace).toBe("hindsightSettings");
      expect(descriptor.invocation).toEqual({ kind: "direct" });
    }
  });

  it("declares describe's optional scope and applyScoped's scope+patch", () => {
    // Found by method, never by index: the top-scope read is a zero-argument call and the scoped one
    // passes a scope, so the optional parameter has to be declared exactly like the host manifest's.
    const describeDescriptor = descriptorOf(CONTRIBUTION, "describe");
    expect(describeDescriptor.parameters?.map((parameter) => parameter.name)).toEqual(["scope"]);
    expect(describeDescriptor.parameters?.[0]?.codec?.mode).toBe("strict");

    const scoped = descriptorOf(CONTRIBUTION, "applyScoped");
    expect(scoped.parameters?.map((parameter) => parameter.name)).toEqual(["scope", "patch"]);
    for (const parameter of scoped.parameters ?? []) {
      expect(parameter.source).toBe("json");
      expect(parameter.codec?.mode).toBe("strict");
    }
  });

  it("gives every input a STRICT codec, because $mount refuses anything else", () => {
    // Found by method, never by index: a new invocation must not silently retarget this assertion.
    const apply = CONTRIBUTION.descriptors.find((d) => d.method === "apply") as unknown as {
      parameters: readonly {
        name: string;
        wire: string;
        source: string;
        codec: { mode: string; typeSymbol?: string; create?: unknown };
      }[];
    };
    expect(apply.parameters).toHaveLength(1);
    const parameter = apply.parameters[0];
    expect(parameter?.name).toBe("patch");
    expect(parameter?.wire).toBe("patch");
    expect(parameter?.source).toBe("json");
    expect(parameter?.codec.mode).toBe("strict");
    expect(typeof parameter?.codec.create).toBe("function");
    expect(parameter?.codec.typeSymbol).toBeTruthy();
    // The pass-through parser must not reject or transform a plain JSON patch.
    const schema = (parameter?.codec.create as () => { parse(v: unknown): unknown })();
    expect(schema.parse({ a: 1, b: null })).toEqual({ a: 1, b: null });
  });

  it("keeps every result as plain JSON and is frozen against mutation", () => {
    for (const descriptor of CONTRIBUTION.descriptors) {
      expect(descriptor.result).toEqual({ mode: "src-json" });
    }
    expect(Object.isFrozen(CONTRIBUTION)).toBe(true);
    expect(Object.isFrozen(CONTRIBUTION.descriptors[1])).toBe(true);
  });
});

describe("the shared field table is still the page's only field metadata source", () => {
  it("declares a group for every field", () => {
    const declared = new Set(FIELD_GROUPS.map((group) => group.id));
    for (const field of CONFIG_FIELDS) expect(declared.has(field.group)).toBe(true);
  });

  it("makes the bundled table the page's metadata source for every declared key", () => {
    // The host sends a plain-string summary in its own language; the page renders the bundled
    // (bilingual) summary whenever the key is declared here, and the host's string only otherwise.
    for (const entry of CONFIG_FIELDS) {
      expect(fieldMetadata(entry.key), entry.key).toBeDefined();
    }
  });
});

describe("diffDraft with an explicit clear", () => {
  // A secret is redacted from the host response, so its cell holds no loaded value to differ from:
  // without the explicit set, the page could show a placeholder and never be able to remove the token.
  const token = makeField({
    key: "apiToken",
    group: "connection",
    kind: "secret",
    value: null,
    inFile: true,
  });

  it("never sends an untouched secret", () => {
    const fields = [token];
    expect(diffDraft(fields, draftFromFields(fields), ZH.t).patch).toEqual({});
  });

  it("sends null for a secret the user cleared", () => {
    const fields = [token];
    expect(diffDraft(fields, draftFromFields(fields), ZH.t, new Set(["apiToken"])).patch).toEqual({
      apiToken: null,
    });
  });

  it("sends a replacement the user typed", () => {
    const fields = [token];
    expect(diffDraft(fields, { apiToken: "new-token" }, ZH.t).patch).toEqual({
      apiToken: "new-token",
    });
  });

  it("treats clearing a key the file does not set as no change", () => {
    const fields = [makeField({ key: "ghost", kind: "secret", value: null, inFile: false })];
    expect(diffDraft(fields, draftFromFields(fields), ZH.t, new Set(["ghost"])).patch).toEqual({});
  });
});

describe("BANKS_HELP (the in-page explanation of bank resolution)", () => {
  /** The rendered help for one language, which is the text a user actually reads. */
  function helpText(t: Translate): string {
    return BANKS_HELP.flatMap((section) => [
      t(section.titleKey),
      ...section.lineKeys.map((key) => t(key)),
    ]).join("\n");
  }

  const zh = helpText(ZH.t);
  const en = helpText(EN.t);

  it("keeps every key inside the dictionaries", () => {
    const known = new Set(Object.keys(DICTIONARIES.en));
    for (const section of BANKS_HELP) {
      expect(known.has(section.titleKey)).toBe(true);
      for (const key of section.lineKeys) expect(known.has(key)).toBe(true);
    }
  });

  it("states the resolution order the upstream README defines", () => {
    for (const text of [zh, en]) {
      const mapPath = text.indexOf("mapPathToBank");
      expect(mapPath).toBeGreaterThan(-1);
      // The three steps must appear in order, and the dynamic one after the path map.
      const staticStep = text.indexOf("bankId");
      const dynamic = text.indexOf("coding-agent::{gitProject}");
      expect(staticStep).toBeGreaterThan(-1);
      expect(dynamic).toBeGreaterThan(staticStep);
    }
    expect(zh).toContain("② 静态");
    expect(en).toContain("② Static");
  });

  it("documents every placeholder, because a wrong template silently makes a second bank", () => {
    for (const text of [zh, en]) {
      for (const placeholder of ["{gitProject}", "{project}", "{harness}", "{channel}", "{user}"]) {
        expect(text, placeholder).toContain(placeholder);
      }
      // The worktree subtlety is the one users get wrong: all worktrees of a repo share one bank.
      expect(text).toContain("worktree");
      expect(text).toContain("{harness}-{gitProject}");
    }
  });

  it("names the full layering chain, in order", () => {
    const zhChain = [
      "内置默认值",
      "环境变量",
      "文件顶层",
      "harnesses.<name>",
      "paths.<前缀>",
      "banks.<已解析 id>",
    ];
    const enChain = [
      "built-in defaults",
      "environment variables",
      "file top level",
      "harnesses.<name>",
      "paths.<prefix>",
      "banks.<resolved id>",
    ];
    for (const [text, chain] of [
      [zh, zhChain],
      [en, enChain],
    ] as const) {
      let cursor = -1;
      for (const layer of chain) {
        const at = text.indexOf(layer);
        expect(at, `${layer} missing`).toBeGreaterThan(-1);
        expect(at, `${layer} out of order`).toBeGreaterThan(cursor);
        cursor = at;
      }
    }
  });

  it("says which fields a bank section ignores, and how to converge two ids", () => {
    for (const text of [zh, en]) {
      for (const ignored of ["bankId", "mapPathToBank", "bank", "optInOnly", "optInPaths"]) {
        expect(text).toContain(ignored);
      }
      expect(text).toContain('"team::product"');
    }
  });

  it("answers whether the bank is created for you, because that decides if setup is needed", () => {
    for (const text of [zh, en]) {
      expect(text).toContain("spawns a new bank");
      expect(text).toContain("creates the bank");
      expect(text).toContain("no bank is created");
      expect(text).toContain("defaultBankConfig");
      expect(text).toContain("manageBankConfig: false");
      expect(text).toContain("synced: true");
      expect(text).toContain("seed_started");
    }
  });

  it("tells the user where the resolved bank id can be read", () => {
    // Upstream writes the v2 seed/session banner to the plugin log rather than a TUI toast.
    for (const text of [zh, en]) {
      expect(text).toContain("coding-agents-logs/plugin.log");
      expect(text).toContain("bank=<id>");
      expect(text).toContain("diag.jsonl");
    }
  });

  it("translates the help rather than duplicating it", () => {
    expect(zh).not.toBe(en);
    expect(ZH.t("help.b.title")).toBe("bank 需要我手工建吗？不需要");
    expect(EN.t("help.b.title")).toBe("Is a bank something I create by hand? No");
  });
});

describe("the two dictionaries stay usable as one table", () => {
  it("keeps the local-dictionary translator working for both locales", () => {
    const en = makeTranslate(DICTIONARIES);
    const zh = makeTranslate({ en: DICTIONARIES.zh, zh: DICTIONARIES.zh });
    expect(en("title")).toBe(DICTIONARIES.en.title);
    expect(zh("title")).toBe(DICTIONARIES.zh.title);
    // A key present in only the table it was handed falls back rather than rendering `undefined`.
    expect(makeTranslate({ en: {}, zh: {} })("missing.key")).toBe("missing.key");
  });
});

describe("splitForScope", () => {
  const view = (key: string): SettingsFieldView =>
    ({ ...makeField({ key }), value: null, inFile: false, shadowedByHarness: false }) as never;
  const keys = [
    "bankId",
    "apiUrl",
    "bankIdTemplate",
    "optInOnly",
    "logLevel",
    "mapPathToBank",
    "harness",
  ];
  const fields = keys.map(view);

  it("offers every field at the top level", () => {
    const { offered, ignored } = splitForScope(fields, { kind: "top" });
    expect(offered.map((field) => field.key)).toEqual(keys);
    expect(ignored).toEqual([]);
  });

  it("omits the keys upstream discards inside a bank section, and names them", () => {
    const { offered, ignored } = splitForScope(fields, { kind: "bank", id: "coding-agent::x" });
    expect(offered.map((field) => field.key)).toEqual(["apiUrl", "logLevel"]);
    // Named, not silently dropped: the editor shows why they are missing.
    expect([...ignored].sort()).toEqual(
      ["bankId", "bankIdTemplate", "harness", "mapPathToBank", "optInOnly"].sort()
    );
  });

  it("treats a path section the same way", () => {
    const { offered, ignored } = splitForScope(fields, { kind: "path", dir: "/tmp/x" });
    expect(offered.map((field) => field.key)).toEqual(["apiUrl", "logLevel"]);
    expect(ignored).toContain("bankId");
  });
});
