/**
 * Unit tests for the pure page model.
 *
 * The write contract is the part of this page that can damage a user's config, and it is entirely
 * pure — so it is tested here, in Node, with no browser and no React. What the page *renders* is not
 * tested here and cannot be: that needs a real browser, and `scripts/dsh-client-smoke.mjs` only
 * proves bundle shape and the slot registration.
 */

import { describe, expect, it } from "vitest";
import { CONFIG_FIELDS, FIELD_GROUPS, type FieldKind } from "../fields";
import {
  BANKS_TAB_ID,
  CONTRIBUTION,
  LOADING_TEXT,
  SERVICE_KEY,
  SETTINGS_SLOT,
  UNSET_TEXT,
  buildSections,
  buildTabs,
  describeAvailability,
  diffDraft,
  draftFromFields,
  draftValueFor,
  effectiveText,
  fallbackText,
  formatDefault,
  formatFieldValue,
  groupDescriptor,
  jsonEquals,
  parseDraft,
  prefillValueFor,
  readOnlyText,
  remoteErrorText,
  scopeLabel,
  shadowText,
  summarizeApply,
  valueSourceNote,
  type SettingsFieldView,
} from "./model";

interface FieldSpec {
  readonly key: string;
  readonly kind?: FieldKind;
  readonly group?: string;
  readonly values?: readonly string[];
  readonly defaultValue?: string | number | boolean | null;
  readonly env?: string;
  readonly editable?: boolean;
  readonly scope?: string;
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
    summary: `${spec.key} 的说明`,
    value,
    inFile: spec.inFile ?? value !== null,
    shadowedByHarness: spec.shadowed ?? false,
    ...(spec.values === undefined ? {} : { values: spec.values }),
    ...(spec.env === undefined ? {} : { env: spec.env }),
  };
}

describe("sections", () => {
  it("emits every declared group in FIELD_GROUPS order, empty ones included", () => {
    const sections = buildSections([]);
    expect(sections.map((section) => section.group.id)).toEqual(FIELD_GROUPS.map((g) => g.id));
    expect(sections.every((section) => section.fields.length === 0)).toBe(true);
  });

  it("carries the declared group summary and title", () => {
    const sections = buildSections([]);
    const connection = sections[0];
    expect(connection?.group.title).toBe("连接");
    expect(connection?.group.summary).toBe(FIELD_GROUPS[0]?.summary);
  });

  it("places each field in its own group and orders it by the shared table", () => {
    // Deliberately reversed: the page must re-sort by CONFIG_FIELDS, not trust host order.
    const fields = [
      makeField({ key: "apiToken", group: "connection", kind: "secret" }),
      makeField({ key: "serverMode", group: "connection", kind: "enum", values: ["cloud"] }),
    ];
    const sections = buildSections(fields);
    const connection = sections.find((section) => section.group.id === "connection");
    expect(connection?.fields.map((field) => field.key)).toEqual(["serverMode", "apiToken"]);
  });

  it("appends a group this build has no heading for instead of dropping its fields", () => {
    const sections = buildSections([makeField({ key: "mystery", group: "brand-new" })]);
    const appended = sections.at(-1);
    expect(appended?.group.id).toBe("brand-new");
    expect(appended?.fields.map((field) => field.key)).toEqual(["mystery"]);
  });

  it("falls back to the raw id for an unknown group", () => {
    expect(groupDescriptor("nope")).toEqual({ id: "nope", title: "nope", summary: "" });
    expect(groupDescriptor("connection").title).toBe("连接");
  });
});

describe("tabs", () => {
  it("emits one tab per declared group in FIELD_GROUPS order, with banks last", () => {
    const tabs = buildTabs([]);
    expect(tabs.map((tab) => tab.id)).toEqual([
      ...FIELD_GROUPS.map((group) => group.id),
      BANKS_TAB_ID,
    ]);
    expect(tabs.filter((tab) => tab.kind === "group")).toHaveLength(FIELD_GROUPS.length);
    expect(tabs.at(-1)?.kind).toBe("banks");
    expect(tabs.at(-1)?.title).toContain("banks");
    expect(tabs.at(-1)?.fields).toEqual([]);
  });

  it("puts a field only on its own group's tab", () => {
    const fields = [
      makeField({ key: "apiUrl", group: "connection", value: "http://x", inFile: true }),
      makeField({ key: "logLevel", group: "scope", value: "info", inFile: true }),
    ];
    const tabs = buildTabs(fields);
    const fieldsOf = (id: string): readonly string[] =>
      tabs.find((tab) => tab.id === id)?.fields.map((field) => field.key) ?? [];
    expect(fieldsOf("connection")).toEqual(["apiUrl"]);
    expect(fieldsOf("scope")).toEqual(["logLevel"]);
    expect(fieldsOf("recall")).toEqual([]);
    expect(fieldsOf(BANKS_TAB_ID)).toEqual([]);
  });

  it("gives a host-reported unknown group its own tab instead of dropping its fields", () => {
    const tabs = buildTabs([makeField({ key: "mystery", group: "brand-new" })]);
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
    expect(parseDraft(field, draftValueFor(field, value))).toEqual({ ok: true, value });
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
    // placeholder is what says "已设置").
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
      expect(parseDraft(field, "")).toEqual({ ok: true, value: null });
    }
  });

  it("keeps strings and secrets verbatim, whitespace included", () => {
    const raw = "  保留 前后 空格  ";
    expect(parseDraft(makeField({ key: "apiUrl" }), raw)).toEqual({ ok: true, value: raw });
    expect(parseDraft(makeField({ key: "apiToken", kind: "secret" }), raw)).toEqual({
      ok: true,
      value: raw,
    });
  });

  it("parses numbers and rejects non-numbers", () => {
    const field = makeField({ key: "reflectTimeoutMs", kind: "number" });
    expect(parseDraft(field, "20000")).toEqual({ ok: true, value: 20000 });
    expect(parseDraft(field, " 20000 ")).toEqual({ ok: true, value: 20000 });
    expect(parseDraft(field, "20s").ok).toBe(false);
  });

  it("parses booleans and rejects anything else", () => {
    const field = makeField({ key: "retainSessions", kind: "boolean" });
    expect(parseDraft(field, "true")).toEqual({ ok: true, value: true });
    expect(parseDraft(field, "false")).toEqual({ ok: true, value: false });
    expect(parseDraft(field, "yes").ok).toBe(false);
  });

  it("enforces an enum's declared values", () => {
    const field = makeField({ key: "serverMode", kind: "enum", values: ["cloud", "daemon"] });
    expect(parseDraft(field, "daemon")).toEqual({ ok: true, value: "daemon" });
    expect(parseDraft(field, "local").ok).toBe(false);
  });

  it("splits a string list on newlines and commas and drops blanks", () => {
    const field = makeField({ key: "retainTags", kind: "stringList" });
    expect(parseDraft(field, "project:{gitProject}\nenv:work, ,\n  env:ci ")).toEqual({
      ok: true,
      value: ["project:{gitProject}", "env:work", "env:ci"],
    });
  });

  it("parses json and rejects malformed json", () => {
    const field = makeField({ key: "mapPathToBank", kind: "json" });
    expect(parseDraft(field, '{"a":"b"}')).toEqual({ ok: true, value: { a: "b" } });
    expect(parseDraft(field, "{oops").ok).toBe(false);
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
    const diff = diffDraft(fields, draftFromFields(fields));
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
    const diff = diffDraft(fields, draftFromFields(fields));
    expect(diff.patch).toEqual({});
    expect(diff.changed).toEqual([]);
    expect(diff.errors).toEqual([]);
  });

  it("produces nothing for a field the file stores as an empty string", () => {
    // "empty in the file" and "cleared by the user" must not be confused: saving an untouched
    // empty value would otherwise delete a key the user never looked at.
    const fields = [makeField({ key: "toolGuideExtra", value: "", inFile: true })];
    expect(diffDraft(fields, draftFromFields(fields)).patch).toEqual({});
  });

  it("emits one write per changed field", () => {
    const fields = [
      apiUrl,
      makeField({ key: "retainSessions", kind: "boolean", value: true, inFile: true }),
    ];
    const draft = draftFromFields(fields);
    draft.apiUrl = "http://localhost:8888";
    draft.retainSessions = "false";
    const diff = diffDraft(fields, draft);
    expect(diff.patch).toEqual({
      apiUrl: "http://localhost:8888",
      retainSessions: false,
    });
    expect(diff.changed).toEqual(["apiUrl", "retainSessions"]);
  });

  it("emits null when a field the file set is cleared", () => {
    const fields = [apiUrl];
    const diff = diffDraft(fields, { apiUrl: "" });
    expect(diff.patch).toEqual({ apiUrl: null });
    expect(diff.changed).toEqual(["apiUrl"]);
  });

  it("never removes a field the file does not set", () => {
    const fields = [makeField({ key: "embedVersion" })];
    expect(diffDraft(fields, { embedVersion: "" }).patch).toEqual({});
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
    expect(diffDraft(fields, { serverMode: "self-hosted" }).patch).toEqual({
      serverMode: "self-hosted",
    });
  });

  it("treats leaving the prefilled default alone as no change", () => {
    // With prefill, the default is already in the box, so re-typing it is not a distinct act: the
    // effective value is identical whether or not the file says it.
    const fields = [
      makeField({ key: "serverMode", kind: "enum", values: ["cloud"], defaultValue: "cloud" }),
    ];
    expect(diffDraft(fields, { serverMode: "cloud" }).patch).toEqual({});
  });

  it("still treats clearing a prefilled field the file does not set as a no-op", () => {
    const fields = [
      makeField({ key: "apiPort", kind: "number", defaultValue: 9077, inFile: false }),
    ];
    expect(diffDraft(fields, { apiPort: "" }).patch).toEqual({});
  });

  it("treats a re-typed value as no change", () => {
    const fields = [apiUrl];
    expect(diffDraft(fields, { apiUrl: "https://api.hindsight.vectorize.io" }).patch).toEqual({});
  });

  it("collects a parse failure and still submits the valid fields", () => {
    const fields = [
      apiUrl,
      makeField({ key: "apiPort", kind: "number", value: 9077, inFile: true }),
    ];
    const draft = draftFromFields(fields);
    draft.apiPort = "not-a-port";
    draft.apiUrl = "http://localhost:8888";
    const diff = diffDraft(fields, draft);
    expect(diff.errors.map((entry) => entry.key)).toEqual(["apiPort"]);
    expect(diff.patch).toEqual({ apiUrl: "http://localhost:8888" });
  });

  it("never touches a field the host marks read-only", () => {
    const fields = [makeField({ key: "banks", kind: "json", editable: false })];
    expect(diffDraft(fields, { banks: '{"sneaky":true}' }).patch).toEqual({});
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
    expect(formatFieldValue(field, { "/a": "bank-a" })).toBe(
      JSON.stringify({ "/a": "bank-a" }, null, 2)
    );
    expect(formatFieldValue(field, null)).toBe(UNSET_TEXT);
    expect(formatFieldValue(makeField({ key: "retainTags", kind: "stringList" }), ["a", "b"])).toBe(
      "a\nb"
    );
  });

  it("formats defaults, including the unset ones", () => {
    expect(formatDefault(makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }))).toBe(
      "9077"
    );
    expect(formatDefault(makeField({ key: "apiToken", kind: "secret" }))).toBe(UNSET_TEXT);
  });

  it("labels every declared scope in Chinese", () => {
    for (const scope of ["global", "harness", "bank", "path"]) {
      expect(scopeLabel(scope)).not.toBe(scope);
    }
  });

  it("names the default, the environment variable and the harness shadow", () => {
    const field = makeField({
      key: "serverMode",
      kind: "enum",
      values: ["cloud"],
      defaultValue: "cloud",
      env: "HINDSIGHT_SERVER_MODE",
    });
    expect(fallbackText(field)).toContain("cloud");
    expect(fallbackText(field)).toContain("HINDSIGHT_SERVER_MODE");
    expect(fallbackText(makeField({ key: "x" }))).toContain("上游默认未设值");
    expect(shadowText()).toContain("harnesses.dsh");
    expect(readOnlyText()).toContain("只能在配置文件里编辑");
  });

  it("says where the value in the box came from", () => {
    expect(valueSourceNote(makeField({ key: "apiUrl", value: "http://x", inFile: true }))).toBe(
      "来自配置文件"
    );
    expect(valueSourceNote(makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }))).toBe(
      "未写入文件；显示的是默认值 9077"
    );
    expect(valueSourceNote(makeField({ key: "embedVersion" }))).toBeUndefined();
    // A bank scope must not claim the default IS the effective value: the top level wins there.
    const bankNote = valueSourceNote(
      makeField({ key: "apiPort", kind: "number", defaultValue: 9077 }),
      "bank"
    );
    expect(bankNote).toContain("本 bank");
    expect(bankNote).toContain("顶层");
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
      })
    ).toBeUndefined();
  });

  it("explains a missing Remote service instead of throwing", () => {
    expect(
      describeAvailability({
        state: { kind: "unavailable", reason: "没有 Remote" },
        view: undefined,
        loadError: undefined,
      })
    ).toBe("没有 Remote");
  });

  it("says it is loading before the first describe arrives", () => {
    expect(
      describeAvailability({ state: { kind: "loading" }, view: undefined, loadError: undefined })
    ).toBe(LOADING_TEXT);
  });

  it("surfaces a failed describe call", () => {
    expect(
      describeAvailability({
        state: { kind: "ready", service: {} as never },
        view: undefined,
        loadError: "读取配置失败：boom",
      })
    ).toContain("boom");
  });

  it("refuses to offer a save over an unparsable file", () => {
    const text = describeAvailability({
      state: { kind: "ready", service: {} as never },
      view: { path: "/tmp/x.json", error: "Unexpected token", fields: [] },
      loadError: undefined,
    });
    expect(text).toContain("无法解析");
  });
});

describe("status and error copy", () => {
  it("prefers the host's own answer over the patch when reporting what changed", () => {
    expect(summarizeApply({ a: 1 }, { path: "p", changed: false, removed: [] })).toContain(
      "没有变化"
    );
    const text = summarizeApply({ a: 1, b: null }, { path: "p", changed: true, removed: ["b"] });
    expect(text).toContain("p");
    expect(text).toContain("写入或更新 1 项");
    expect(text).toContain("删除 1 项");
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
    expect(CONTRIBUTION.package).toBe("@local/dsh-hindsight-settings");
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
});

describe("diffDraft with an explicit clear", () => {
  // A secret is redacted from the host response, so its cell holds no loaded value to differ from:
  // without the explicit set, the page could show "已设置" and never be able to remove the token.
  const token = makeField({
    key: "apiToken",
    group: "connection",
    kind: "secret",
    value: null,
    inFile: true,
  });

  it("never sends an untouched secret", () => {
    const fields = [token];
    expect(diffDraft(fields, draftFromFields(fields)).patch).toEqual({});
  });

  it("sends null for a secret the user cleared", () => {
    const fields = [token];
    expect(diffDraft(fields, draftFromFields(fields), new Set(["apiToken"])).patch).toEqual({
      apiToken: null,
    });
  });

  it("sends a replacement the user typed", () => {
    const fields = [token];
    expect(diffDraft(fields, { apiToken: "new-token" }).patch).toEqual({ apiToken: "new-token" });
  });

  it("treats clearing a key the file does not set as no change", () => {
    const fields = [makeField({ key: "ghost", kind: "secret", value: null, inFile: false })];
    expect(diffDraft(fields, draftFromFields(fields), new Set(["ghost"])).patch).toEqual({});
  });
});
