/**
 * Host half: publish the settings service the page calls.
 *
 * There is deliberately NO `Config` schema here. An earlier revision declared volatile fields and
 * mirrored `~/.hindsight/coding-agent.json` into the profile's own row config so the shipped settings
 * form would show it — an invention of mine, and the wrong tool: `dsh-settings` derives forms from
 * active profile entries and persists edits through the profile patch, while Hindsight's
 * configuration lives in its own file and is resolved by a plugin that imports nothing from dsh. A
 * real install refused the mirror twice with "HMR transactions cannot be nested", and a page reading
 * that form had nothing writable to render.
 *
 * So this row exists for one reason: a package that declares `dsh.client` is what carries a browser
 * half. Its host half publishes one service, the manifest in `./typert` exposes two of its methods to
 * the browser, and the page reads and writes the file through them (`docs/api-gateway.md`).
 */
import { ENTRY_ID, PACKAGE_NAME } from "./namespace";
import { configPath } from "./config-store";
import { createSettingsService } from "./service";
import { recordStatus } from "./status";

/** Cordis plugin name (loader diagnostics). */
export const name = PACKAGE_NAME;

/** The Cordis service key the Typert manifest resolves against this plugin's context. */
export const SERVICE_KEY = "hindsightSettings";

/** Host shapes, taken structurally so this package needs no cordis dependency at all. */
export interface DshContext {
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
export function apply(ctx: DshContext): void {
  if (typeof ctx.provide !== "function") {
    recordStatus("apply", { error: "ctx.provide is unavailable in this composition" });
    ctx.logger?.warn?.(
      "hindsight-settings: this composition exposes no ctx.provide — the settings page cannot reach the config file"
    );
    return;
  }
  ctx.provide(SERVICE_KEY, createSettingsService());
  recordStatus("apply", { provided: SERVICE_KEY, configPath: configPath(), entryId: ENTRY_ID });
}

export default { name, apply };

// The public surface: the field table the page renders from, the file read/write rules, and the
// status trail that makes an install diagnosable without a browser console.
export { CONFIG_FIELDS, EDITABLE_FIELDS, FIELD_GROUPS, fieldByKey, fieldsOfGroup } from "./fields";
export type { ConfigField, FieldGroup, FieldKind } from "./fields";
export { createSettingsService } from "./service";
export type {
  ApplyResult,
  HindsightSettingsService,
  SettingsFieldView,
  SettingsView,
} from "./service";
export {
  configPath,
  describeSources,
  readConfigFile,
  reconcileConfigValues,
  writeConfigValues,
} from "./config-store";
export type { ConfigFileSnapshot, FieldSources } from "./config-store";
export { readStatusFile, recordStatus, statusPath } from "./status";
