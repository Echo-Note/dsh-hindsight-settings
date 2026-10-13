/**
 * The Hindsight coding-agent config surface, as data.
 *
 * This table is the ONE declaration of "what a user may configure" that both halves read: the host
 * builds its Cordis `Config` schema from it, and the browser half renders the page from it. It
 * therefore imports nothing at all — no `node:*`, no schemastery — because the browser bundle
 * inlines it while the host bundle must stay loadable in any profile.
 *
 * It describes the SAME settings `@vectorize-io/hindsight-coding-agents` resolves in its
 * `core/config.ts` (layering: defaults → env → the file's top level → `harnesses.<name>` →
 * `banks.<id>` / `paths.<dir>`). The plugin owns that resolution; this package owns only the page
 * and the file write-back, so every field here must match that table, and `upstream.test.ts`
 * checks this list against the INSTALLED plugin instead of trusting the copy.
 *
 * `editable: false` marks a field the page shows but must not write:
 *   - nested maps (`pages`, `banks`, `recallOptions`, …) — they are file-only by upstream design
 *     because a per-key branch cannot survive a form field, and a half-edited map is worse than
 *     none;
 *   - `harness`, which the host stamps for the adapter it is running as;
 *   - `autoReflect`, which upstream deprecated in favour of `autoInject`.
 */
/** The page's sections, in render order. */
type FieldGroup = "connection" | "routing" | "recall" | "pages" | "retention" | "ingest" | "scope";
/** How a field is rendered and validated. */
type FieldKind = "string" | "secret" | "number" | "boolean" | "enum" | "stringList" | "json";
/**
 * The languages the page can render. Both halves live in this table because the page bundles it and
 * picks one by `ctx.locale`; the Remote response carries a single string only as a fallback for a
 * field key the running page does not know.
 */
interface LocalizedText {
    readonly en: string;
    readonly zh: string;
}
/** Where a value may be overridden from. Mirrors upstream's layers. */
type FieldScope = "global" | "harness" | "bank" | "path";
interface ConfigField {
    /** The `RawConfig` key, spelled exactly as upstream spells it. */
    readonly key: string;
    readonly group: FieldGroup;
    readonly kind: FieldKind;
    /** Allowed values for `kind: "enum"`. */
    readonly values?: readonly string[];
    /**
     * The documented default, or `null` when the upstream default is "unset" (a value the plugin
     * leaves undefined and each call site interprets). Kept as DATA rather than read from upstream so
     * the browser half can render it; `upstream.test.ts` asserts the ones upstream resolves.
     */
    readonly default: string | number | boolean | null;
    /** The `HINDSIGHT_*` variable upstream's env layer reads for this key, when it has one. */
    readonly env?: string;
    /** False = the page renders it read-only (see the module doc for why). */
    readonly editable: boolean;
    readonly scope: FieldScope;
    /**
     * True when upstream DISCARDS this key inside a `banks.<id>` or `paths.<prefix>` section.
     *
     * Upstream ships the list as `BANK_OVERRIDE_EXCLUDED` (bankId, bankIdTemplate, mapPathToBank,
     * dynamicBankId, resolveWorktrees, optInOnly, optInPaths, harness) with the comment "strip them
     * rather than let them read as effective" — a section naming them would only ever arrive too late,
     * because bank resolution and the opt-in decision both happen BEFORE a section applies. A
     * `harnesses.<name>` section is a plain flat merge and DOES honor them.
     *
     * The page must not offer these for editing inside a bank section: the write would land in the
     * file and be ignored, which is worse than not offering it. `upstream.test.ts` compares this flag
     * against the installed bundle's own list.
     */
    readonly bankScopeIgnored?: boolean;
    /** One line for the page, in every language the page can render. */
    readonly summary: LocalizedText;
}
interface FieldGroupDescriptor {
    readonly id: FieldGroup;
    readonly title: LocalizedText;
    readonly summary: LocalizedText;
}
declare const FIELD_GROUPS: readonly FieldGroupDescriptor[];
declare const CONFIG_FIELDS: readonly ConfigField[];
/** The fields the page may write. Everything else is display-only. */
declare const EDITABLE_FIELDS: readonly ConfigField[];
/** One field by key, for lookups from the page or the host. */
declare function fieldByKey(key: string): ConfigField | undefined;
/** Fields of one group, in declaration order. */
declare function fieldsOfGroup(group: FieldGroup): readonly ConfigField[];

/** A parsed JSON object with unknown keys, as read from disk. */
type JsonObject = Record<string, unknown>;
/**
 * Mirrors upstream's `CONFIG_PATH` expression: `HINDSIGHT_CONFIG` first (containers, test
 * harnesses), then `~/.hindsight/coding-agent.json`. Duplicated rather than imported because that
 * constant is not part of the plugin's public surface, and this package must not depend on its
 * internals; `upstream.test.ts` is what catches a drift.
 */
declare function configPath(env?: NodeJS.ProcessEnv): string;
interface ConfigFileSnapshot {
    readonly path: string;
    /** The file's top level exactly as written (empty when the file is absent or unreadable). */
    readonly values: JsonObject;
    /** `values.harnesses.dsh` when it is an object — it wins over the top level in upstream's layering. */
    readonly harness: JsonObject;
    /** Set when the file exists but could not be read or parsed; callers must not write then. */
    readonly error?: string;
}
/** Read the config file, turning every failure into a reported snapshot rather than a throw. */
declare function readConfigFile(path?: string): ConfigFileSnapshot;
/** Where a field's current value comes from, layer by layer (highest upstream priority first). */
interface FieldSources {
    readonly key: string;
    /** `harnesses.dsh.<key>` — wins over the top level and over env. */
    readonly harness?: unknown;
    /** The file's top-level `<key>` — what the page edits. */
    readonly file?: unknown;
    /** The raw `HINDSIGHT_*` string, when the field has an env variable and it is set. */
    readonly env?: string;
}
/**
 * The readable layers for every field, for the page's "where does this value come from" column.
 *
 * Deliberately NOT a single resolved value: resolving `banks.<id>` / `paths.<dir>` is upstream's
 * job and depends on the workspace, so reproducing it here would be a second implementation that
 * could disagree with the plugin at runtime. The page shows the layers and says which one wins.
 */
declare function describeSources(snapshot: ConfigFileSnapshot, env?: NodeJS.ProcessEnv): readonly FieldSources[];
interface WriteResult {
    readonly path: string;
    /** False when the file already said exactly this — the caller should report "no change". */
    readonly changed: boolean;
    /** Keys this call removed, for the page's feedback line. */
    readonly removed: readonly string[];
}
/**
 * Write managed fields into the file, leaving every other key alone.
 *
 * A `null` value removes the key (the file falls back to env/default), and values that already
 * match are not rewritten at all.
 * @throws when the file exists but cannot be parsed — see rule 3 in the module doc.
 */
declare function writeConfigValues(patch: JsonObject, path?: string): WriteResult;
/**
 * Make the file's managed keys say exactly what the row says — the page's edit and reset path.
 *
 * An absent non-secret key means the user cleared it (or the file never had it, which is the same
 * no-op), so it is removed. An absent SECRET means untouched: secrets are never seeded into the row
 * (see `SEEDED_FIELDS` in index.ts), so treating absence as "cleared" would delete the user's token
 * the first time they saved any unrelated field. Clearing a secret is an explicit empty write.
 */
declare function reconcileConfigValues(values: JsonObject, path?: string): WriteResult;
/** Which layer of the file a page is editing: the shared top level, or one bank / path override. */
type ConfigScope = {
    readonly kind: "top";
} | {
    readonly kind: "bank";
    readonly id: string;
} | {
    readonly kind: "path";
    readonly dir: string;
};

/**
 * The host-side service the settings page calls.
 *
 * This is the DOCUMENTED shape for host state a page needs: a Cordis service registered on the root
 * context, reached from the browser through a Remote contribution (`docs/api-gateway.md`). It exists
 * because the alternative — projecting the file through the plugin's own `Config` schema — cannot
 * work here at all: `dsh-settings` derives forms from active profile entries and persists edits
 * through the profile patch, while Hindsight's configuration lives in `~/.hindsight/coding-agent.json`
 * and is resolved by a plugin that imports nothing from dsh. Mirroring one into the other was an
 * invention of mine, and a real install refused it twice with "HMR transactions cannot be nested".
 *
 * So the page talks to the file, through this service, and nothing else: no Config schema, no
 * seeding, no volatile references. Every method takes and returns plain JSON, which is what the
 * gateway's codecs carry.
 */

/** One field as the page renders it: the table's metadata plus the file's current value. */
interface SettingsFieldView {
    readonly key: string;
    readonly group: string;
    readonly kind: ConfigField["kind"];
    readonly values?: readonly string[];
    readonly default: ConfigField["default"];
    readonly env?: string;
    readonly editable: boolean;
    readonly scope: string;
    /**
     * The Chinese line from the field table. The wire carries ONE string on purpose: the page bundles
     * the bilingual table itself (`fields.ts` is built from this one declaration), so it renders the
     * half its `ctx.locale` asks for without the response carrying both. This string is only the
     * fallback for a field key the running page does not know.
     */
    readonly summary: string;
    /** The value in the file's top level, or `null` when the file does not set it. */
    readonly value: unknown;
    /** True when the file sets it — the page distinguishes "unset" from "set to the default". */
    readonly inFile: boolean;
    /** True when `harnesses.dsh` also sets it, which wins over the top level the page writes. */
    readonly shadowedByHarness: boolean;
}
/** One `banks.<id>` / `paths.<dir>` section the file already carries. */
interface ScopeMember {
    readonly id: string;
    readonly keys: readonly string[];
}
/** What `describe()` answers. */
interface SettingsView {
    readonly path: string;
    /** Which layer these values came from; the page keeps one tab per scope. */
    readonly scope?: ConfigScope;
    /** Present on a top-level read: the bank and path sections the file already holds. */
    readonly banks?: readonly ScopeMember[];
    readonly paths?: readonly ScopeMember[];
    /** Set when the file exists but cannot be read or parsed; the page must not offer to save then. */
    readonly error?: string;
    readonly fields: readonly SettingsFieldView[];
}
/** What `apply()` answers. */
interface ApplyResult {
    readonly path: string;
    readonly scope?: ConfigScope;
    readonly changed: boolean;
    readonly removed: readonly string[];
}
/** The service face, as `ctx.provide` publishes it and the manifest declares it. */
interface HindsightSettingsService {
    describe(scope?: ConfigScope, configPathOverride?: string): SettingsView;
    apply(patch: Record<string, unknown>, configPathOverride?: string): ApplyResult;
    /** The same write, addressed at one `banks.<id>` / `paths.<dir>` section. */
    applyScoped(scope: ConfigScope, patch: Record<string, unknown>, configPathOverride?: string): ApplyResult;
    /** Accept one diagnostic line from the browser half. See `note` below. */
    note(message: string): NoteAck;
}
/**
 * The binding the gateway demands before it will dispatch a call into a service.
 *
 * `validateBinding` (dsh-api-gateway) reads `typertRemote` off the resolved service and then checks
 * three things: the value is an object, `value.service` IS that same service instance, and
 * `value.serviceKey`/`value.namespace` are the strings the descriptor names. A cordis service that
 * extends `TypertRemoteService`, or one that calls `bindTypertRemote`, gets this object from the
 * protocol package — but that package resolves its own `@deepseek-ai/cordis` to run an `instanceof`
 * check, and this package is installed through a symlink with no node_modules of its own. The binding
 * is therefore built here, to exactly those three requirements, and the self-check asserts them.
 *
 * After this check passes the gateway simply calls the named method on the service, so a plain
 * object with these three methods is all that is needed.
 */
interface TypertRemoteBinding {
    readonly service: unknown;
    readonly serviceKey: string;
    readonly namespace: string;
}
/** What `note()` answers. */
interface NoteAck {
    readonly ok: true;
    readonly at: string;
}
/**
 * Build the service.
 *
 * `apply` delegates to the writer in `config-store`, so the page inherits every rule that module
 * already enforces and tests: managed keys only, unknown keys preserved, no write when nothing
 * changed, `null` removes a key, a file that cannot be parsed is never overwritten, and the file is
 * replaced atomically at mode 0600.
 */
declare function createSettingsService(serviceKey?: string): HindsightSettingsService & {
    readonly typertRemote: TypertRemoteBinding;
};

interface StatusEvent {
    /** ISO timestamp, taken at the moment the step ran. */
    readonly at: string;
    /** What happened: `apply`, `seed`, `seed-failed`, `wrote`, `write-failed`, … */
    readonly step: string;
    readonly [key: string]: unknown;
}
interface StatusFile {
    readonly updatedAt: string;
    readonly package: string;
    readonly entryId: string;
    readonly configPath: string;
    readonly events: readonly StatusEvent[];
}
/** Where the trail lives: beside the config file this package edits. */
declare function statusPath(configFile?: string): string;
/**
 * Append one event. Never throws: a read-only home or a full disk must not take down a plugin that
 * is otherwise working.
 * @param step - short machine-readable name for the step.
 * @param details - the fields worth keeping for that step.
 * @param configFile - override for tests.
 * @returns the event that was written (useful in tests).
 */
declare function recordStatus(step: string, details?: Record<string, unknown>, configFile?: string): StatusEvent;
/** Read the trail outside the plugin (tests, and the report that diagnosed an install). */
declare function readStatusFile(configFile?: string): StatusFile;

/** Cordis plugin name (loader diagnostics). */
declare const name = "@Echo-Note/dsh-hindsight-settings";
/** The Cordis service key the Typert manifest resolves against this plugin's context. */
declare const SERVICE_KEY = "hindsightSettings";
/** Host shapes, taken structurally so this package needs no cordis dependency at all. */
interface DshContext {
    provide?(key: string, value: unknown): void;
    logger?: {
        info?(...args: unknown[]): void;
        warn?(...args: unknown[]): void;
    };
}
/**
 * Register the service.
 *
 * Fail-open: a context without `provide` (an unusual composition) leaves the row mounted and inert —
 * it must never be the reason a harness fails to start.
 */
declare function apply(ctx: DshContext): void;
declare const _default: {
    name: string;
    apply: typeof apply;
};

export { type ApplyResult, CONFIG_FIELDS, type ConfigField, type ConfigFileSnapshot, type DshContext, EDITABLE_FIELDS, FIELD_GROUPS, type FieldGroup, type FieldKind, type FieldSources, type HindsightSettingsService, SERVICE_KEY, type SettingsFieldView, type SettingsView, apply, configPath, createSettingsService, _default as default, describeSources, fieldByKey, fieldsOfGroup, name, readConfigFile, readStatusFile, reconcileConfigValues, recordStatus, statusPath, writeConfigValues };
