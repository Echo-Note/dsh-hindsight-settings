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
import {
  configPath,
  describeSources,
  readConfigFile,
  readScopeMembers,
  readScopedValues,
  writeConfigValues,
  writeScopedValues,
  type ConfigScope,
} from "./config-store";
import { CONFIG_FIELDS, type ConfigField } from "./fields";
import { recordStatus } from "./status";

/** One field as the page renders it: the table's metadata plus the file's current value. */
export interface SettingsFieldView {
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
export interface ScopeMember {
  readonly id: string;
  readonly keys: readonly string[];
}

/** What `describe()` answers. */
export interface SettingsView {
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
export interface ApplyResult {
  readonly path: string;
  readonly scope?: ConfigScope;
  readonly changed: boolean;
  readonly removed: readonly string[];
}

/** The service face, as `ctx.provide` publishes it and the manifest declares it. */
export interface HindsightSettingsService {
  describe(scope?: ConfigScope, configPathOverride?: string): SettingsView;
  apply(patch: Record<string, unknown>, configPathOverride?: string): ApplyResult;
  /** The same write, addressed at one `banks.<id>` / `paths.<dir>` section. */
  applyScoped(
    scope: ConfigScope,
    patch: Record<string, unknown>,
    configPathOverride?: string
  ): ApplyResult;
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
export interface TypertRemoteBinding {
  readonly service: unknown;
  readonly serviceKey: string;
  readonly namespace: string;
}

/** What `note()` answers. */
export interface NoteAck {
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
export function createSettingsService(
  serviceKey = "hindsightSettings"
): HindsightSettingsService & { readonly typertRemote: TypertRemoteBinding } {
  const service: HindsightSettingsService = {
    describe(scope: ConfigScope = { kind: "top" }, configPathOverride?: string): SettingsView {
      const path = configPathOverride ?? configPath();
      const snapshot = readConfigFile(path);
      // A bank/path scope reads ITS section; the top scope reads the file's own keys.
      const values = readScopedValues(snapshot.values, scope);
      const sources = new Map(describeSources(snapshot).map((source) => [source.key, source]));
      const fields: SettingsFieldView[] = CONFIG_FIELDS.map((field) => {
        const source = sources.get(field.key);
        const inFile = field.key in values;
        return {
          key: field.key,
          group: field.group,
          kind: field.kind,
          ...(field.values === undefined ? {} : { values: field.values }),
          default: field.default,
          ...(field.env === undefined ? {} : { env: field.env }),
          editable: field.editable,
          scope: field.scope,
          // The wire keeps ONE string (the Chinese half) because the page bundles the bilingual
          // table itself and picks a language from `ctx.locale`; this is only the fallback for a
          // field key the running page does not know, so the contract need not carry both.
          summary: field.summary.zh,
          // Secrets are redacted from every response, the way dsh's own settings service redacts a
          // `role('secret')` field ("kept out of form responses"). The page still knows whether the
          // file sets one (`inFile`), and `apply` accepts a replacement or an explicit clear.
          value: field.kind === "secret" ? null : inFile ? values[field.key] : null,
          inFile,
          shadowedByHarness: scope.kind === "top" ? source?.harness !== undefined : false,
        };
      });
      recordStatus("describe", {
        path,
        scope: scope.kind,
        error: snapshot.error ?? null,
        fields: fields.length,
        withValues: fields.filter((field) => field.inFile).length,
      });
      const base = {
        path,
        scope,
        ...(scope.kind === "top"
          ? {
              banks: readScopeMembers(snapshot.values, "banks"),
              paths: readScopeMembers(snapshot.values, "paths"),
            }
          : {}),
        fields,
      };
      return snapshot.error === undefined ? base : { ...base, error: snapshot.error };
    },

    /**
     * Record one line from the browser half.
     *
     * The page's failures are otherwise unreachable: a client plugin's `apply` catches to
     * `console.error`, which nobody can read inside a packaged desktop app, and the live slot ledger
     * only shows the contributions that SUCCEEDED. This method is the page's only way to say "I ran,
     * I got this far, this threw", and it lands in the same status trail as the host's own steps.
     */
    note(message: string): NoteAck {
      const at = new Date().toISOString();
      recordStatus("client", { message: String(message).slice(0, 500) });
      return { ok: true, at };
    },

    apply(patch: Record<string, unknown>, configPathOverride?: string): ApplyResult {
      const path = configPathOverride ?? configPath();
      const result = writeConfigValues(patch, path);
      recordStatus("apply", {
        path,
        scope: "top",
        changed: result.changed,
        removed: result.removed,
      });
      return {
        path: result.path,
        scope: { kind: "top" },
        changed: result.changed,
        removed: result.removed,
      };
    },

    applyScoped(
      scope: ConfigScope,
      patch: Record<string, unknown>,
      configPathOverride?: string
    ): ApplyResult {
      const path = configPathOverride ?? configPath();
      const result = writeScopedValues(scope, patch, path);
      recordStatus("apply", {
        path,
        scope:
          scope.kind === "top"
            ? "top"
            : `${scope.kind}:${scope.kind === "bank" ? scope.id : scope.dir}`,
        changed: result.changed,
        removed: result.removed,
      });
      return { path: result.path, scope, changed: result.changed, removed: result.removed };
    },
  };
  // Bound LAST, and to this exact object: the validator requires `binding.service` to be the very
  // instance the gateway resolved, so a copy or a wrapper would be rejected as inconsistent.
  return Object.assign(service, {
    typertRemote: Object.freeze({ service, serviceKey, namespace: serviceKey }),
  });
}
