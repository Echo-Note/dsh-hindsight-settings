/**
 * The write half of the ONE shared Hindsight config file.
 *
 * Upstream (`@vectorize-io/hindsight-coding-agents`, `src/core/config.ts`) only ever READS
 * `~/.hindsight/coding-agent.json`: it resolves
 *
 *   defaults → env (`HINDSIGHT_*`) → the file's top level → `harnesses.<name>` → `banks.<id>` / `paths.<dir>`
 *
 * and ships no writer, because the file is meant to be hand-edited. This package adds the missing
 * writer for its settings page, so the page becomes an editor of that same file instead of a second
 * place to look. Three rules follow from that, and every function here exists to keep one:
 *
 *   1. **Only managed keys are touched.** Everything else in the file — including keys this version
 *      does not know, and the nested `banks` / `paths` / `harnesses` sections — survives verbatim.
 *   2. **No write when nothing changed.** The page mirrors the file; a mirror that rewrites its
 *      source on every load would churn mtimes and defeat any external backup/watcher.
 *   3. **Never write a file that cannot be parsed.** Invalid JSON is reported, not overwritten: the
 *      user's only copy of their settings is that file, and silently replacing it would be data loss.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { CONFIG_FIELDS, type ConfigField } from "./fields";

/** A parsed JSON object with unknown keys, as read from disk. */
export type JsonObject = Record<string, unknown>;

/** The one field name inside the harness section that belongs to this host. */
const HARNESS_ID = "dsh";

/**
 * Mirrors upstream's `CONFIG_PATH` expression: `HINDSIGHT_CONFIG` first (containers, test
 * harnesses), then `~/.hindsight/coding-agent.json`. Duplicated rather than imported because that
 * constant is not part of the plugin's public surface, and this package must not depend on its
 * internals; `upstream.test.ts` is what catches a drift.
 */
export function configPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.HINDSIGHT_CONFIG || join(homedir(), ".hindsight", "coding-agent.json");
}

export interface ConfigFileSnapshot {
  readonly path: string;
  /** The file's top level exactly as written (empty when the file is absent or unreadable). */
  readonly values: JsonObject;
  /** `values.harnesses.dsh` when it is an object — it wins over the top level in upstream's layering. */
  readonly harness: JsonObject;
  /** Set when the file exists but could not be read or parsed; callers must not write then. */
  readonly error?: string;
}

/** Read the config file, turning every failure into a reported snapshot rather than a throw. */
export function readConfigFile(path: string = configPath()): ConfigFileSnapshot {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // Absent is the normal state of a fresh machine, and an empty snapshot is the right answer.
    if (code === "ENOENT") return { path, values: {}, harness: {} };
    return { path, values: {}, harness: {}, error: `cannot read ${path}: ${String(error)}` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { path, values: {}, harness: {}, error: `${path} is not valid JSON: ${String(error)}` };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { path, values: {}, harness: {}, error: `${path} must hold a JSON object` };
  }
  const values = parsed as JsonObject;
  const harnesses = values.harnesses;
  const harness =
    typeof harnesses === "object" && harnesses !== null && !Array.isArray(harnesses)
      ? (((harnesses as JsonObject)[HARNESS_ID] as JsonObject | undefined) ?? {})
      : {};
  return {
    path,
    values,
    harness: typeof harness === "object" && harness !== null ? harness : {},
  };
}

/** Where a field's current value comes from, layer by layer (highest upstream priority first). */
export interface FieldSources {
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
export function describeSources(
  snapshot: ConfigFileSnapshot,
  env: NodeJS.ProcessEnv = process.env
): readonly FieldSources[] {
  return CONFIG_FIELDS.map((field) => {
    const fromEnv = field.env === undefined ? undefined : env[field.env];
    const sources: {
      key: string;
      harness?: unknown;
      file?: unknown;
      env?: string;
    } = { key: field.key };
    if (field.key in snapshot.harness) sources.harness = snapshot.harness[field.key];
    if (field.key in snapshot.values) sources.file = snapshot.values[field.key];
    if (fromEnv !== undefined && fromEnv !== "") sources.env = fromEnv;
    return sources;
  });
}

/** One rejected field: the value cannot be what the settings page writes. */
export interface FieldError {
  readonly key: string;
  readonly message: string;
}

/**
 * Check a patch against the field table BEFORE it reaches the file.
 *
 * Upstream tolerates a bad value by falling back to a default with a warning — right for a
 * hand-edited file, wrong for a form: a page that accepts `"maybe"` for a boolean would report a
 * successful save while the plugin ignored it. `null` means "remove this key", which is how the
 * page's reset reaches the file.
 */
export function validatePatch(patch: JsonObject): readonly FieldError[] {
  const errors: FieldError[] = [];
  for (const [key, value] of Object.entries(patch)) {
    const field = CONFIG_FIELDS.find((candidate) => candidate.key === key);
    if (field === undefined) {
      errors.push({ key, message: `unknown setting` });
      continue;
    }
    if (!field.editable) {
      errors.push({ key, message: `${key} is file-only and cannot be written from the page` });
      continue;
    }
    if (value === null) continue;
    const problem = checkValue(field, value);
    if (problem !== undefined) errors.push({ key, message: problem });
  }
  return errors;
}

/** Type check for one editable field. */
function checkValue(field: ConfigField, value: unknown): string | undefined {
  switch (field.kind) {
    case "boolean":
      return typeof value === "boolean" ? undefined : `${field.key} must be true or false`;
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? undefined
        : `${field.key} must be a number`;
    case "enum":
      return typeof value === "string" && field.values?.includes(value)
        ? undefined
        : `${field.key} must be one of ${(field.values ?? []).join(", ")}`;
    case "stringList":
      return Array.isArray(value) && value.every((item) => typeof item === "string")
        ? undefined
        : `${field.key} must be a list of strings`;
    case "secret":
    case "string":
      return typeof value === "string" ? undefined : `${field.key} must be a string`;
    case "json":
      // Not editable (validatePatch rejects it first); kept exhaustive for the type checker.
      return `${field.key} is file-only`;
  }
}

export interface WriteResult {
  readonly path: string;
  /** False when the file already said exactly this — the caller should report "no change". */
  readonly changed: boolean;
  /** Keys this call removed, for the page's feedback line. */
  readonly removed: readonly string[];
}

/** Whether two JSON values are the same as far as a settings file is concerned. */
function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (typeof left !== typeof right) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  if (typeof left === "object" && typeof right === "object" && left !== null && right !== null) {
    // Key order in a hand-edited file is not meaningful; compare structurally.
    const leftKeys = Object.keys(left as JsonObject).sort();
    const rightKeys = Object.keys(right as JsonObject).sort();
    if (leftKeys.length !== rightKeys.length) return false;
    if (leftKeys.some((key, index) => key !== rightKeys[index])) return false;
    return leftKeys.every((key) =>
      sameValue((left as JsonObject)[key], (right as JsonObject)[key])
    );
  }
  return false;
}

/**
 * Write managed fields into the file, leaving every other key alone.
 *
 * A `null` value removes the key (the file falls back to env/default), and values that already
 * match are not rewritten at all.
 * @throws when the file exists but cannot be parsed — see rule 3 in the module doc.
 */
export function writeConfigValues(patch: JsonObject, path: string = configPath()): WriteResult {
  const errors = validatePatch(patch);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `${error.key}: ${error.message}`).join("; "));
  }
  const snapshot = readConfigFile(path);
  if (snapshot.error !== undefined) throw new Error(snapshot.error);
  const next: JsonObject = { ...snapshot.values };
  const removed: string[] = [];
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      if (key in next) {
        delete next[key];
        removed.push(key);
        changed = true;
      }
      continue;
    }
    if (!(key in next) || !sameValue(next[key], value)) {
      next[key] = value;
      changed = true;
    }
  }
  if (changed) writeJsonAtomically(path, next);
  return { path, changed, removed };
}

/**
 * Make the file's managed keys say exactly what the row says — the page's edit and reset path.
 *
 * An absent non-secret key means the user cleared it (or the file never had it, which is the same
 * no-op), so it is removed. An absent SECRET means untouched: secrets are never seeded into the row
 * (see `SEEDED_FIELDS` in index.ts), so treating absence as "cleared" would delete the user's token
 * the first time they saved any unrelated field. Clearing a secret is an explicit empty write.
 */
export function reconcileConfigValues(
  values: JsonObject,
  path: string = configPath()
): WriteResult {
  const patch: JsonObject = {};
  for (const field of CONFIG_FIELDS) {
    if (!field.editable) continue;
    if (field.key in values) {
      patch[field.key] = values[field.key];
      continue;
    }
    if (field.kind === "secret") continue;
    patch[field.key] = null;
  }
  return writeConfigValues(patch, path);
}

/**
 * Write JSON through a sibling temp file and a rename.
 *
 * A crash mid-write must not leave a half-written settings file: `rename` is atomic within a
 * directory, so a reader sees either the old file or the new one. The mode is forced to 0600
 * because `apiToken` lives in this file, and a hand-created file may well be 0644.
 */
function writeJsonAtomically(path: string, values: JsonObject): void {
  const directory = dirname(path);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporary, `${JSON.stringify(values, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, path);
}

/** Which layer of the file a page is editing: the shared top level, or one bank / path override. */
export type ConfigScope =
  | { readonly kind: "top" }
  | { readonly kind: "bank"; readonly id: string }
  | { readonly kind: "path"; readonly dir: string };

/** The map a scope lives in, and the key inside it (`banks.<id>` / `paths.<dir>`). */
function scopeSection(
  scope: ConfigScope
): { readonly map: "banks" | "paths"; readonly key: string } | undefined {
  if (scope.kind === "bank") return { map: "banks", key: scope.id };
  if (scope.kind === "path") return { map: "paths", key: scope.dir };
  return undefined;
}

/** The values a scope currently sets, as a flat object. */
export function readScopedValues(values: JsonObject, scope: ConfigScope): JsonObject {
  const section = scopeSection(scope);
  if (section === undefined) return values;
  const map = values[section.map];
  if (typeof map !== "object" || map === null || Array.isArray(map)) return {};
  const entry = (map as JsonObject)[section.key];
  return typeof entry === "object" && entry !== null && !Array.isArray(entry)
    ? (entry as JsonObject)
    : {};
}

/** Every id a scope map currently holds, with the keys it sets — what the page lists as tabs. */
export function readScopeMembers(
  values: JsonObject,
  map: "banks" | "paths"
): readonly { readonly id: string; readonly keys: readonly string[] }[] {
  const section = values[map];
  if (typeof section !== "object" || section === null || Array.isArray(section)) return [];
  return Object.entries(section as JsonObject)
    .filter(([, entry]) => typeof entry === "object" && entry !== null && !Array.isArray(entry))
    .map(([id, entry]) => ({ id, keys: Object.keys(entry as JsonObject).sort() }));
}

/**
 * Write a patch inside one scope.
 *
 * `banks.<id>` and `paths.<dir>` are how upstream lets one repository (or one bank) differ from the
 * shared top level, and upstream documents them as file-only because a form cannot express a map. A
 * scoped writer keeps that promise while still making the section editable: the map is created when
 * the id is new, keys merge, `null` removes one, and an entry that ends up empty is dropped so the
 * file does not accumulate empty `{}` sections.
 */
export function writeScopedValues(
  scope: ConfigScope,
  patch: JsonObject,
  path: string = configPath()
): WriteResult {
  const errors = validatePatch(patch);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `${error.key}: ${error.message}`).join("; "));
  }
  const snapshot = readConfigFile(path);
  if (snapshot.error !== undefined) throw new Error(snapshot.error);
  const next: JsonObject = structuredCloneSafe(snapshot.values);
  const section = scopeSection(scope);
  if (section === undefined) {
    const merged = mergeInto(next, patch);
    if (merged.changed) writeJsonAtomically(path, merged.values);
    return { path, changed: merged.changed, removed: merged.removed };
  }
  const mapRaw = next[section.map];
  const map: JsonObject =
    typeof mapRaw === "object" && mapRaw !== null && !Array.isArray(mapRaw)
      ? (mapRaw as JsonObject)
      : {};
  const entryRaw = map[section.key];
  const entry: JsonObject =
    typeof entryRaw === "object" && entryRaw !== null && !Array.isArray(entryRaw)
      ? (entryRaw as JsonObject)
      : {};
  const merged = mergeInto(entry, patch);
  const empty = Object.keys(merged.values).length === 0;
  const removedEntry = empty && Object.keys(entry).length > 0;
  if (!merged.changed && !removedEntry) return { path, changed: false, removed: [] };
  if (empty) delete map[section.key];
  else map[section.key] = merged.values;
  // An emptied section is dropped whole, so a file never accumulates `"banks": {}` litter.
  if (Object.keys(map).length === 0) delete next[section.map];
  else next[section.map] = map;
  writeJsonAtomically(path, next);
  return { path, changed: true, removed: merged.removed };
}

/** Merge a patch into a copy, treating `null` as removal. */
function mergeInto(
  target: JsonObject,
  patch: JsonObject
): { readonly values: JsonObject; readonly changed: boolean; readonly removed: readonly string[] } {
  const values: JsonObject = { ...target };
  const removed: string[] = [];
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      if (key in values) {
        delete values[key];
        removed.push(key);
        changed = true;
      }
      continue;
    }
    if (!(key in values) || !sameValue(values[key], value)) {
      values[key] = value;
      changed = true;
    }
  }
  return { values, changed, removed };
}

/** `structuredClone` with a JSON fallback, so a caller cannot hand us a value we then mutate. */
function structuredCloneSafe(values: JsonObject): JsonObject {
  return JSON.parse(JSON.stringify(values)) as JsonObject;
}
