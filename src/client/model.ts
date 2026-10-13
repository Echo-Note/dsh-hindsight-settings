/**
 * Pure page model for the Hindsight settings page.
 *
 * Everything here is a plain function, plain type, or frozen data: no React, no cordis, no DOM, no
 * `node:*`. That is what makes the write contract — the part of this page that can damage a user's
 * config — testable in Node, and it is why the browser half inlines this module rather than
 * re-deriving any of it.
 *
 * ## Two sources of truth, and which one wins
 *
 *  - `../fields` owns **presentation metadata** the page must not invent: group order, group titles,
 *    group summaries, and field order within a group.
 *  - The host's `describe()` owns **every live value and every fact about the file**: the path, each
 *    field's value, `inFile`, `shadowedByHarness`, and the field-level `summary`/`kind`/`default`/…
 *    It is the only thing that knows where the config file actually is.
 *
 * The path is the important one. The config file does NOT live at a fixed location: it is
 * `~/.hindsight/coding-agent.json` on macOS and Linux but something else entirely on Windows. This
 * module therefore never spells a config path; it renders `view.path`, which the host resolves.
 *
 * ## The write contract
 *
 * `describe()` and `apply()` are reached through the API Gateway and every unary call resolves to a
 * `RemoteResult` — `{ ok: true, value }` or `{ ok: false, error }`. A call does not reject because the
 * carrier dropped; it can still reject on an assembly fault (wrong arity, method unmounted, the
 * contribution withdrawn), so callers guard both.
 *
 * `apply(patch)` takes `Record<string, unknown>`: a key set to a value writes it, and a key set to
 * `null` REMOVES it, so the setting falls back to the environment variable and then to the plugin
 * default. `null` is therefore a real instruction, not "no value" — {@link parseDraft} returns it for
 * a cleared cell and {@link diffDraft} only emits it when the file actually held something.
 */

import { CONFIG_FIELDS, FIELD_GROUPS, type FieldKind } from "../fields";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The host contract (mirrors the host's `service.ts`; do not invent fields)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A JSON-shaped value, which is all the gateway carries. */
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/** One field as `describe()` reports it. */
export interface SettingsFieldView {
  readonly key: string;
  readonly group: string;
  readonly kind: FieldKind;
  readonly values?: readonly string[];
  readonly default: string | number | boolean | null;
  readonly env?: string;
  readonly editable: boolean;
  readonly scope: string;
  readonly summary: string;
  /** The value the FILE sets, or `null` when the file does not set it. */
  readonly value: unknown;
  /** Distinguishes "the file does not set this" from "the file sets it to the default". */
  readonly inFile: boolean;
  /** True when `harnesses.dsh` also sets it, which wins over the top level this page writes. */
  readonly shadowedByHarness: boolean;
}

/**
 * The layer a read or write addresses.
 *
 * `top` is the shared file level; `bank` is one `banks.<id>` section; `path` is one `paths.<dir>`
 * section. `describe()` accepts the scope as an OPTIONAL argument (the host defaults it to `top`), so
 * `describe()` and `describe({ kind: "top" })` mean the same thing.
 */
export type ConfigScope =
  | { readonly kind: "top" }
  | { readonly kind: "bank"; readonly id: string }
  | { readonly kind: "path"; readonly dir: string };

/** One `banks.<id>` / `paths.<dir>` section the file already carries, with the keys it sets. */
export interface ScopeMember {
  readonly id: string;
  readonly keys: readonly string[];
}

/** What `describe()` answers. */
export interface SettingsView {
  /** The config file's real path, resolved by the host — never assume a platform layout. */
  readonly path: string;
  /** Which layer these values came from; absent means the top level. */
  readonly scope?: ConfigScope;
  /** Set when the file exists but cannot be parsed; the page must not offer to save then. */
  readonly error?: string;
  readonly fields: readonly SettingsFieldView[];
  /** Present on a top-level read: the bank sections the file already holds. */
  readonly banks?: readonly ScopeMember[];
  /** Present on a top-level read: the path sections the file already holds. */
  readonly paths?: readonly ScopeMember[];
}

/** What `apply()` / `applyScoped()` answer. */
export interface ApplyResult {
  readonly path: string;
  readonly scope?: ConfigScope;
  readonly changed: boolean;
  readonly removed: readonly string[];
}

/**
 * Every gateway unary call resolves to this and never rejects for a carrier failure.
 *
 * `error` is an opaque `RemoteError` (an object carrying `code` and `message`); it is deliberately
 * typed `unknown` so nothing downstream can pretend to know its shape.
 */
export type RemoteResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: unknown };

/** The `remote.<namespace>` service the client half mounts and then addresses. */
export interface RemoteNamespace {
  /** The top level when no scope is given (the host's own default). */
  describe(scope?: ConfigScope): Promise<RemoteResult<SettingsView>>;
  /** A top-level write. */
  apply(patch: Record<string, JsonValue>): Promise<RemoteResult<ApplyResult>>;
  /** The same write, addressed at one `banks.<id>` / `paths.<dir>` section. */
  applyScoped(
    scope: ConfigScope,
    patch: Record<string, JsonValue>
  ): Promise<RemoteResult<ApplyResult>>;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The seat
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The Settings-list seat.
 *
 * `settings.section` is a `list` / `root` slot declared by the settings shell; this page is its own
 * entry in the Settings navigation rather than a section inside another plugin's detail page.
 */
export const SETTINGS_SLOT = "settings.section";
/** The contribution id — also the navigation key the shell matches. */
export const PAGE_ID = "hindsight-settings";
/** Navigation order; the shell sorts its sections by this. */
export const PAGE_ORDER = 35;
/** Chinese label shown in the Settings navigation. */
export const PAGE_LABEL = "Hindsight 记忆设置";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The Remote mount
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The host namespace this page calls. */
const SERVICE_NAMESPACE = "hindsightSettings";

/**
 * The service key the gateway installs the namespace under.
 *
 * `ClientRemote.$mount()` creates each namespace as a child Cordis service named `remote.<ns>`, which
 * is why the page reads `ctx.get('remote.hindsightSettings')` rather than the bare namespace.
 */
export const SERVICE_KEY = `remote.${SERVICE_NAMESPACE}`;

/** The contribution package name; it must be unique per registration. */
const CONTRIBUTION_PACKAGE = "@local/dsh-hindsight-settings";

/**
 * A pass-through STRICT codec for a plain-JSON payload.
 *
 * `$mount` refuses a Client parameter whose `codec.mode` is not `'strict'`; the `create()` factory
 * only has to validate, and every payload here is plain JSON by construction (see the host's
 * `service.ts`), so there is no second schema to drift out of sync.
 */
function jsonCodec(typeSymbol: string): {
  readonly mode: "strict";
  readonly typeSymbol: string;
  readonly create: () => { parse(value: unknown): unknown };
} {
  return { mode: "strict", typeSymbol, create: () => ({ parse: (value: unknown) => value }) };
}

/**
 * The Client-for-Host contribution handed to `ctx.remote.$mount()`.
 *
 * Two rules from the gateway are load-bearing and are asserted by the unit tests:
 *
 *  1. every parameter of a Client contribution needs a STRICT codec — `$mount` rejects a parameter
 *     whose `codec.mode` is not `'strict'` before any method becomes callable;
 *  2. a RESULT may be `src-json`, which is what every method uses because they return plain JSON the
 *     client needs no schema for.
 *
 * `describe` declares its optional `scope` argument (with `acceptsUndefined`) exactly as the host
 * manifest does, so both `describe()` and `describe({ kind: "bank", id })` dispatch; `applyScoped`
 * takes the scope and the patch in that order.
 */
export const CONTRIBUTION = deepFreeze({
  package: CONTRIBUTION_PACKAGE,
  descriptors: [
    {
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/describe`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "describe",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "scope",
          wire: "scope",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ConfigScope`),
          // Optional: a call with no argument means the file's top level, so the page's default
          // top-scope read stays a zero-argument call.
          acceptsUndefined: true,
        },
      ],
      result: { mode: "src-json" },
    },
    {
      // Diagnostics from the page itself. Without it a client-side failure is invisible: the live
      // slot ledger shows only what SUCCEEDED, and console.error inside a packaged desktop app is
      // unreachable to everyone but the user.
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/note`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "note",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "message",
          wire: "message",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ClientNote`),
        },
      ],
      result: { mode: "src-json" },
    },
    {
      // One `banks.<id>` (or `paths.<dir>`) section: how a single bank differs from the shared top
      // level the other two methods address.
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/applyScoped`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "applyScoped",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "scope",
          wire: "scope",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ConfigScope`),
        },
        {
          name: "patch",
          wire: "patch",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#SettingsPatch`),
        },
      ],
      result: { mode: "src-json" },
    },
    {
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/apply`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "apply",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "patch",
          wire: "patch",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#SettingsPatch`),
        },
      ],
      result: { mode: "src-json" },
    },
  ],
});

/** `Object.freeze` deep enough that a stray mutation cannot corrupt a live mount. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Structural helpers
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A plain data object; arrays and `null` are not records. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a `describe()` payload is usable. */
export function isSettingsView(value: unknown): value is SettingsView {
  return isRecord(value) && typeof value.path === "string" && Array.isArray(value.fields);
}

/** Structural equality for JSON values; keeps a re-typed value out of the write queue. */
export function jsonEquals(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((entry, index) => jsonEquals(entry, right[index]))
    );
  }
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) return false;
    return keys.every((key) => key in right && jsonEquals(left[key], right[key]));
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A rendered group: heading metadata plus the fields the host reported for it. */
export interface GroupDescriptor {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

export interface FieldSection {
  readonly group: GroupDescriptor;
  readonly fields: readonly SettingsFieldView[];
}

/** The declared heading for a group id, or a pass-through for a group this build does not know. */
export function groupDescriptor(group: string): GroupDescriptor {
  const declared = FIELD_GROUPS.find((candidate) => candidate.id === group);
  return declared ?? { id: group, title: group, summary: "" };
}

/** Declaration order of every known field key, used to order a group's rows. */
const FIELD_ORDER: ReadonlyMap<string, number> = new Map(
  CONFIG_FIELDS.map((field, index) => [field.key, index] as const)
);

function byDeclarationOrder(left: SettingsFieldView, right: SettingsFieldView): number {
  const a = FIELD_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER;
  const b = FIELD_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER;
  return a - b;
}

/**
 * The page's sections, in `FIELD_GROUPS` order.
 *
 * A declared group with no fields is kept rather than dropped: the table is the contract, and a group
 * that silently vanishes because the host stopped reporting a field is harder to notice than an empty
 * heading. A group the host reports but this build has no heading for is appended, so an upstream
 * rename shows up as a visibly untitled section instead of losing its fields.
 */
export function buildSections(fields: readonly SettingsFieldView[]): readonly FieldSection[] {
  const buckets = new Map<string, SettingsFieldView[]>();
  for (const field of fields) {
    const bucket = buckets.get(field.group);
    if (bucket === undefined) buckets.set(field.group, [field]);
    else bucket.push(field);
  }

  const sections: FieldSection[] = [];
  const emitted = new Set<string>();
  const emit = (group: string): void => {
    if (emitted.has(group)) return;
    emitted.add(group);
    const bucket = buckets.get(group) ?? [];
    sections.push({ group: groupDescriptor(group), fields: [...bucket].sort(byDeclarationOrder) });
  };

  for (const group of FIELD_GROUPS) emit(group.id);
  for (const group of buckets.keys()) emit(group);
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Tabs
//
// The page shows ONE group at a time: seven groups of settings in a single column was the "really
// ugly" surface this upgrade removes. The tab list is derived from the same sections, so a group the
// host reports but this build has no heading for still gets a tab (and does not vanish), and the
// banks table is always the last tab.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The id of the final, non-group tab (“按项目”). */
export const BANKS_TAB_ID = "__banks__";

/** The banks tab's heading and one-line description. */
export const BANKS_TAB_TITLE = "按项目（banks）";
export const BANKS_TAB_SUMMARY = "为单个 bank / 仓库覆盖设置，其余 bank 仍用顶层值。";

/** One entry in the page's tab bar. */
export interface PageTab {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  /** `group` renders field rows; `banks` renders the scope browser. */
  readonly kind: "group" | "banks";
  /** The fields this tab renders; always empty for the banks tab. */
  readonly fields: readonly SettingsFieldView[];
}

/** The tab bar: one tab per section, then the banks tab. */
export function buildTabs(fields: readonly SettingsFieldView[]): readonly PageTab[] {
  const tabs: PageTab[] = buildSections(fields).map((section) => ({
    id: section.group.id,
    title: section.group.title,
    summary: section.group.summary,
    kind: "group",
    fields: section.fields,
  }));
  tabs.push({
    id: BANKS_TAB_ID,
    title: BANKS_TAB_TITLE,
    summary: BANKS_TAB_SUMMARY,
    kind: "banks",
    fields: [],
  });
  return tabs;
}

/** What `banks.<id>` means, in the user's words, shown above the bank list. */
export function banksScopeText(): string {
  return "banks.<id> 覆盖该 bank 的设置（顶层仍对其余 bank 生效）；一个 bank 里的键删除后会回退到顶层。";
}

/** Why `paths` is listed but not edited. */
export function pathsReadOnlyText(): string {
  return "paths 按绝对目录前缀覆盖（paths.<目录>），通常不手写，因此本页只列出文件里已有的段落，请在配置文件中编辑。";
}

/** The heading for one bank section while it is open for editing. */
export function scopedEditorTitle(scope: ConfigScope): string {
  return scope.kind === "bank"
    ? `banks.${scope.id}`
    : scope.kind === "path"
      ? `paths.${scope.dir}`
      : "顶层";
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Display
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Shown wherever a value is genuinely absent from the file. */
export const UNSET_TEXT = "未设置";

/** Render any value as one line of text. Internal: every public formatter goes through it. */
function formatScalar(value: unknown): string {
  if (value === undefined || value === null) return UNSET_TEXT;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? UNSET_TEXT : value.map((entry) => formatScalar(entry)).join(", ");
  }
  return JSON.stringify(value) ?? UNSET_TEXT;
}

/** Render a value for its field's kind — pretty JSON for `json`, one item per line for lists. */
export function formatFieldValue(field: SettingsFieldView, value: unknown): string {
  if (value === undefined || value === null) return UNSET_TEXT;
  if (field.kind === "json") return JSON.stringify(value, null, 2) ?? UNSET_TEXT;
  if (field.kind === "stringList") {
    return Array.isArray(value) && value.length > 0
      ? value.map((entry) => String(entry)).join("\n")
      : UNSET_TEXT;
  }
  return formatScalar(value);
}

/** The field's documented default. `null` in the contract means upstream leaves it unset. */
export function formatDefault(field: SettingsFieldView): string {
  return field.default === null ? UNSET_TEXT : formatScalar(field.default);
}

/** A short Chinese label for a field's override scope. */
export function scopeLabel(scope: string): string {
  switch (scope) {
    case "global":
      return "全局";
    case "harness":
      return "按 harness";
    case "bank":
      return "按 bank";
    case "path":
      return "按路径";
    default:
      return scope;
  }
}

/**
 * The fallback chain to show while the file does not set a field: default, then environment variable.
 *
 * This is the line that makes `inFile: false` honest. The page shows an empty control for such a
 * field, and "empty" must not read as "the value is empty" when the plugin will actually use the
 * default or an exported variable.
 */
export function fallbackText(field: SettingsFieldView): string {
  const parts: string[] = [];
  parts.push(field.default === null ? "上游默认未设值" : `默认 ${formatScalar(field.default)}`);
  if (field.env !== undefined) parts.push(`环境变量 ${field.env}`);
  return `文件未设置该项，实际生效：${parts.join(" → ")}。`;
}

/** The warning for a field the harness block overrides. */
export function shadowText(): string {
  return "harnesses.dsh 也设置了这一项，它优先于本页写入的顶层值——在这里保存不会改变实际生效的值。";
}

/** Why a read-only field cannot be edited, and where it can be. */
export function readOnlyText(): string {
  return "该项是文件专属的嵌套结构或宿主盖章字段，表单无法安全表达，只能在配置文件里编辑。";
}

/**
 * The value shown for a field the file does not set: the plugin default, or nothing.
 *
 * The host does NOT send the environment variable's value — only its NAME — so the default is the
 * closest honest thing the page can put in the box. For `apiPort` (unset in the file, default 9077)
 * that is `9077` instead of an empty box that reads as "no value".
 */
export function effectiveText(field: SettingsFieldView): string {
  return field.default === null || field.default === undefined
    ? ""
    : draftValueFor(field, field.default);
}

/**
 * The text a freshly loaded form shows for one field.
 *
 * `inFile` wins: the file's value is the truth. Otherwise the effective default is prefilled so the
 * user sees what the plugin will actually use. Prefilling is display-only — {@link diffDraft} uses
 * this same text as the baseline, so an untouched form still produces an empty patch.
 */
export function prefillValueFor(field: SettingsFieldView): string {
  return field.inFile ? draftValueFor(field, field.value) : effectiveText(field);
}

/** Where the text currently in a field's box came from, or `undefined` when there is nothing to say. */
export function valueSourceNote(
  field: SettingsFieldView,
  scope: "top" | "bank" = "top"
): string | undefined {
  if (field.inFile) return "来自配置文件";
  if (field.default === null || field.default === undefined) return undefined;
  const shown = formatScalar(field.default);
  return scope === "bank"
    ? `本 bank 未覆盖该项；显示的是默认值 ${shown}（删除后回退到顶层）。`
    : `未写入文件；显示的是默认值 ${shown}`;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Drafts
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Turn a stored value into the text an input starts with.
 *
 * The inverse of {@link parseDraft} for every editable kind — that round trip is what lets an
 * untouched field produce no write at all.
 */
export function draftValueFor(field: SettingsFieldView, value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return field.kind === "stringList"
      ? value.map((entry) => String(entry)).join("\n")
      : (JSON.stringify(value) ?? "");
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (isRecord(value)) return JSON.stringify(value) ?? "";
  return String(value);
}

/**
 * A fresh draft: the file's value where it has one, and the effective default where it does not.
 *
 * The prefilled default is a BASELINE, not a pending write: {@link diffDraft} compares against the
 * same text, so opening the page and pressing Save sends nothing.
 */
export function draftFromFields(fields: readonly SettingsFieldView[]): Record<string, string> {
  const draft: Record<string, string> = {};
  for (const field of fields) draft[field.key] = prefillValueFor(field);
  return draft;
}

/** A parsed draft cell, or the reason the text is not acceptable. */
export type ParseResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly message: string };

/**
 * Parse one draft cell into the value the host should store; `null` means "remove the key".
 *
 * The empty cell means **remove** for every kind, which is how a field returns to the environment
 * variable and then the plugin default. `string` and `secret` keep their text verbatim — a token or a
 * custom instruction must not be silently trimmed — so only an exactly-empty cell clears them.
 */
export function parseDraft(field: SettingsFieldView, raw: string): ParseResult {
  const text = raw.trim();
  switch (field.kind) {
    case "string":
    case "secret":
      return { ok: true, value: raw === "" ? null : raw };
    case "number": {
      if (text === "") return { ok: true, value: null };
      const parsed = Number(text);
      if (!Number.isFinite(parsed)) {
        return { ok: false, message: `${field.key} 需要一个数字，收到「${text}」。` };
      }
      return { ok: true, value: parsed };
    }
    case "boolean": {
      if (text === "") return { ok: true, value: null };
      if (text === "true") return { ok: true, value: true };
      if (text === "false") return { ok: true, value: false };
      return { ok: false, message: `${field.key} 只接受 true 或 false。` };
    }
    case "enum": {
      if (text === "") return { ok: true, value: null };
      const values = field.values ?? [];
      if (!values.includes(text)) {
        return { ok: false, message: `${field.key} 只接受 ${values.join(" / ")}。` };
      }
      return { ok: true, value: text };
    }
    case "stringList": {
      if (text === "") return { ok: true, value: null };
      const items = text
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter((item) => item !== "");
      return { ok: true, value: items.length === 0 ? null : items };
    }
    case "json": {
      if (text === "") return { ok: true, value: null };
      try {
        return { ok: true, value: JSON.parse(text) as JsonValue };
      } catch {
        return { ok: false, message: `${field.key} 不是合法的 JSON。` };
      }
    }
    default:
      return { ok: true, value: raw === "" ? null : raw };
  }
}

/** One field whose draft text cannot be turned into a value. */
export interface DraftError {
  readonly key: string;
  readonly message: string;
}

/** What a save would send, and what it refuses to send. */
export interface DraftDiff {
  /** Key → value to write; a key mapped to `null` removes it from the file. */
  readonly patch: Record<string, JsonValue>;
  readonly errors: readonly DraftError[];
  /** Keys that would actually change something, in field order. */
  readonly changed: readonly string[];
}

/**
 * Turn a draft into the patch `apply()` takes.
 *
 * Two gates keep this from rewriting a config the user never touched:
 *
 *  1. a cell whose text equals the text a fresh form shows is skipped outright — the baseline is
 *     {@link prefillValueFor}, so this covers both "the file stores this exact text" (including an
 *     empty string stored in the file) and "the file stores nothing and the box shows the default";
 *  2. a parsed value equal to the file's value is skipped, so reformatting a list does not write.
 *
 * The prefilled default is therefore never written by itself: only a cell the user actually changed
 * (or explicitly cleared) produces an entry. A field the file does not set produces a write only when
 * the user typed something DIFFERENT from the displayed default; clearing it stays a no-op. Fields
 * the host marks `editable: false` are never touched.
 */
export function diffDraft(
  fields: readonly SettingsFieldView[],
  draft: Readonly<Record<string, string>>,
  /**
   * Fields the user explicitly asked to clear. Needed because a REDACTED secret has no loaded value
   * to differ from: its empty cell means "unchanged", so without this set the page could show a
   * secret as set and never be able to remove it.
   */
  cleared: ReadonlySet<string> = new Set()
): DraftDiff {
  const patch: Record<string, JsonValue> = {};
  const errors: DraftError[] = [];
  const changed: string[] = [];

  for (const field of fields) {
    if (!field.editable) continue;
    const raw = draft[field.key] ?? "";
    // The baseline is what the box was prefilled with, NOT the empty string: a default shown in an
    // unset field must not become a write just because the user opened the page.
    const baselineText = prefillValueFor(field);
    if (raw === baselineText && !cleared.has(field.key)) continue;
    if (cleared.has(field.key)) {
      // Removing a key the file does not set changes nothing.
      if (!field.inFile) continue;
      patch[field.key] = null;
      changed.push(field.key);
      continue;
    }

    const parsed = parseDraft(field, raw);
    if (!parsed.ok) {
      errors.push({ key: field.key, message: parsed.message });
      continue;
    }
    if (parsed.value === null) {
      // Clearing a field the file does not set changes nothing.
      if (!field.inFile) continue;
      patch[field.key] = null;
      changed.push(field.key);
      continue;
    }
    if (field.inFile && jsonEquals(parsed.value, field.value)) continue;
    patch[field.key] = parsed.value;
    changed.push(field.key);
  }

  return { patch, errors, changed };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Availability, status copy and errors
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** What the page knows about the Remote side. */
export type ServiceState =
  | { readonly kind: "loading" }
  | { readonly kind: "unavailable"; readonly reason: string }
  | { readonly kind: "ready"; readonly service: RemoteNamespace };

/** Shown while `describe()` is in flight. */
export const LOADING_TEXT = "正在读取宿主配置…";

/** Everything that can block editing, flattened for one decision. */
export interface AvailabilityInput {
  readonly state: ServiceState;
  /** The last `describe()` payload, or `undefined` while none has arrived. */
  readonly view: SettingsView | undefined;
  /** Set when the `describe()` call itself failed or the service could not be resolved. */
  readonly loadError: string | undefined;
}

/**
 * The line explaining why the page cannot be edited, or `undefined` when it can.
 *
 * The order matters. A missing service is reported before anything else because no later branch can
 * be trusted without it; the file's own parse error is reported last because it is the only one the
 * user can fix by editing the file. Save is disabled exactly when this returns a string.
 */
export function describeAvailability(input: AvailabilityInput): string | undefined {
  if (input.state.kind === "unavailable") return input.state.reason;
  if (input.state.kind === "loading") return LOADING_TEXT;
  if (input.loadError !== undefined) return input.loadError;
  if (input.view === undefined) return LOADING_TEXT;
  if (input.view.error !== undefined) {
    return `配置文件存在但无法解析，本页不会写入以免覆盖它：${input.view.error}`;
  }
  return undefined;
}

/** Render whatever the gateway put in the failure branch. `RemoteError` carries `code` + `message`. */
export function remoteErrorText(error: unknown): string {
  let message: string | undefined;
  let code: string | undefined;

  if (error instanceof Error) message = error.message;
  if (isRecord(error)) {
    if (message === undefined && typeof error.message === "string") message = error.message;
    if (typeof error.code === "string") code = error.code;
  }
  if (message === undefined) message = typeof error === "string" ? error : String(error);
  return code === undefined ? message : `${message}（${code}）`;
}

/**
 * The line reporting what a successful save actually did.
 *
 * The counts come from the host's own answer and from the patch that was sent — never from an
 * assumption about what "should" have happened. A host that reports `changed: false` is believed:
 * saying "saved 3 fields" when the file did not move is exactly the lie this page exists to avoid.
 */
export function summarizeApply(
  patch: Readonly<Record<string, JsonValue>>,
  result: ApplyResult
): string {
  if (!result.changed) return "文件没有变化，未写入任何改动。";

  const writes = Object.values(patch).filter((value) => value !== null).length;
  const removals = result.removed.length;
  const parts: string[] = [];
  if (writes > 0) parts.push(`写入或更新 ${writes} 项`);
  if (removals > 0) parts.push(`删除 ${removals} 项（回退到环境变量，然后回退到插件默认值）`);
  if (parts.length === 0) parts.push(`已更新 ${result.path}`);
  return `已保存到 ${result.path}：${parts.join("，")}。`;
}

/** One block of the bank-resolution help shown on the 按项目（banks） tab. */
export interface HelpSection {
  readonly title: string;
  readonly lines: readonly string[];
}

/**
 * How banking actually works, taken from the upstream README's *Bank resolution*,
 * *Per-repo opt-in/out* and *Per-directory overrides* sections.
 *
 * This lives here, as data, so a test can hold it to the documented placeholders and resolution
 * order: a help text that drifts from the plugin's real behaviour is worse than none, and nobody
 * reads a paragraph twice to check it.
 */
export const BANKS_HELP: readonly HelpSection[] = Object.freeze([
  {
    title: "一个仓库一个 bank",
    lines: [
      "记忆按仓库隔离。插件按【当前工作目录】解析 bank，顺序如下（先命中者胜）：",
      "① mapPathToBank —— 绝对路径的最长前缀；优先级最高，能盖过 bankId；linked worktree 继承主检出的映射。",
      "② 静态 —— 设了 bankId（或把 dynamicBankId 设为 false）。",
      "③ 动态 —— 用 bankIdTemplate 生成，默认 coding-agent::{gitProject}。",
    ],
  },
  {
    title: "bankIdTemplate 的占位符",
    lines: [
      "{gitProject} —— worktree 感知的仓库名：同一仓库的所有 worktree 共用一个 bank；不在仓库里时，取会话启动目录的名字。",
      "{project} —— 当前目录名；{harness} —— 发起调用的入口（dsh / claude-code / codex …）。",
      "{channel} / {user} —— 来自 $HINDSIGHT_CHANNEL_ID / $HINDSIGHT_USER_ID。",
      "默认模板对 harness 中立，所以各 agent 共享同一个仓库 bank；想按 agent 分开就写 {harness}-{gitProject}。",
    ],
  },
  {
    title: "谁盖过谁（后者胜）",
    lines: [
      "内置默认值 → 环境变量 → 文件顶层 → harnesses.<name> → paths.<前缀> → banks.<已解析 id>。",
      "mapPathToBank、harnesses、paths、banks、retainMetadata 是键值映射，只能写在文件里。",
    ],
  },
  {
    title: "本标签页改的是 banks.<id>",
    lines: [
      "它按【已解析的 bank id】选中，并在解析之后生效 —— 所以仓库搬到别处也依然命中。",
      "任何行为字段都能在此覆盖；bank 字段可以把多个 id 合并到一个 bank（单跳、字面量，目标自身的段不再参与）。",
      "bank 解析类字段（bankId / mapPathToBank / bank / optInOnly / optInPaths）写在 bank 段里会被忽略。",
      '示例：{"banks": {"coding-agent::backend": {"bank": "team::product"}, "coding-agent::frontend": {"bank": "team::product"}}}',
    ],
  },
  {
    title: "paths.<前缀> 与常见配方",
    lines: [
      "paths 按目录前缀覆盖连接类设置（serverMode / apiUrl / apiPort / apiToken）；在解析之后、banks.<id> 之前生效，所以 bank 段仍能盖过它。本页只列出，请在文件里编辑。",
      '按【目录】把一片仓库归到一个 bank：{"mapPathToBank": {"/Users/me/work/client-x": "client-x-memory"}}',
      "按【id】把手工挑的几个仓库归到一个 bank：用上面的 banks 示例。",
    ],
  },
  {
    title: "怎么看我的 bank id 到底是哪个",
    lines: [
      "上游 v2 插件把 seed / 会话横幅写进插件日志：~/.hindsight/coding-agents-logs/plugin.log（日志里出现 bank=<id>）。",
      "把 logLevel 设为 debug 会记下更详细的过程；结构化事件在同目录的 diag.jsonl。",
      "权威说明见 hindsight-integrations/coding-agents/README.md 的 Bank resolution 一节。",
    ],
  },
]);
