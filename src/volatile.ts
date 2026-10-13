/**
 * Volatile config references, without importing cordis.
 *
 * A Config field declared `.volatile()` does not arrive as a value: the loader hands the plugin a
 * cosmokit reference (`{ get() }`) so an edit can be committed IN PLACE — the plugin instance keeps
 * its identity and `loader/volatile-update` says "the references you hold now read new values".
 *
 * The marker is `Symbol.for('cosmokit.volatile.write')` on purpose, and this module repeats that
 * expression rather than importing cosmokit: the host may have supplied references built by its own
 * copy of the library, and a registry symbol is the only identity that survives two copies.
 * (`@vectorize-io/hindsight-coding-agents` reaches the same conclusion for its own host, and this
 * package must not add a cordis dependency to the plugin's resolution graph.)
 */

/** cosmokit's marker for a volatile reference; see the module doc for why it is a registry symbol. */
const VOLATILE_WRITE = Symbol.for("cosmokit.volatile.write");

/** The loader's event, emitted after volatile references were committed in place. */
export const VOLATILE_UPDATE_EVENT = "loader/volatile-update";

/** Whether a resolved config field is a reference rather than a plain value. */
export function isVolatileRef(value: unknown): boolean {
  return typeof value === "object" && value !== null && VOLATILE_WRITE in value;
}

/** The current plain value of a field, reference or not. */
export function plainValue(value: unknown): unknown {
  return isVolatileRef(value) ? (value as { get(): unknown }).get() : value;
}

/**
 * Copy a resolved config onto a plain object, unwrapping references.
 *
 * A reference is truthy and would pass every `if (value)` test, so any reader that wants the value
 * the user actually sees must go through here first.
 */
export function plainConfig(source: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) out[key] = plainValue(value);
  return out;
}
