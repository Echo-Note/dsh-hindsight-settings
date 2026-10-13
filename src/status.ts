/**
 * A tiny on-disk status trail, so a real install can be diagnosed without the app's console.
 *
 * This package has two halves that fail in ways nothing else reports: the HOST half seeds a form
 * whose document may not exist yet, and the BROWSER half may never be delivered a bundle at all
 * (dsh composes the client graph at host start, so a plugin installed while the app is running
 * needs a restart). A browser console is not always reachable — especially inside a packaged
 * desktop app — and the host logger is not either.
 *
 * So each interesting step appends one line to `dsh-settings-status.json`, next to the config file
 * it mirrors. It is deliberately boring: a capped array, best-effort writes, and a hard rule that
 * NOTHING here may throw into the plugin — diagnostics that can break the thing they observe are
 * worse than none.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { configPath } from "./config-store";

/** Cap on retained events: enough for a mount + seed + a few edits, small enough to read by eye. */
const MAX_EVENTS = 30;

export interface StatusEvent {
  /** ISO timestamp, taken at the moment the step ran. */
  readonly at: string;
  /** What happened: `apply`, `seed`, `seed-failed`, `wrote`, `write-failed`, … */
  readonly step: string;
  readonly [key: string]: unknown;
}

export interface StatusFile {
  readonly updatedAt: string;
  readonly package: string;
  readonly entryId: string;
  readonly configPath: string;
  readonly events: readonly StatusEvent[];
}

/** Where the trail lives: beside the config file this package edits. */
export function statusPath(configFile: string = configPath()): string {
  return join(dirname(configFile), "dsh-settings-status.json");
}

/** Read the trail, or start a fresh one when it is absent or unreadable. */
function readStatus(path: string, entryId: string, configFile: string): StatusFile {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<StatusFile>;
    if (Array.isArray(parsed.events)) {
      return {
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
        package:
          typeof parsed.package === "string" ? parsed.package : "@Echo-Note/dsh-hindsight-settings",
        entryId: typeof parsed.entryId === "string" ? parsed.entryId : entryId,
        configPath: typeof parsed.configPath === "string" ? parsed.configPath : configFile,
        events: parsed.events as StatusEvent[],
      };
    }
  } catch {
    // Absent or corrupt: a fresh trail is the right answer, and losing it costs nothing.
  }
  return {
    updatedAt: "",
    package: "@Echo-Note/dsh-hindsight-settings",
    entryId,
    configPath: configFile,
    events: [],
  };
}

/**
 * Append one event. Never throws: a read-only home or a full disk must not take down a plugin that
 * is otherwise working.
 * @param step - short machine-readable name for the step.
 * @param details - the fields worth keeping for that step.
 * @param configFile - override for tests.
 * @returns the event that was written (useful in tests).
 */
export function recordStatus(
  step: string,
  details: Record<string, unknown> = {},
  configFile: string = configPath()
): StatusEvent {
  const event: StatusEvent = { at: new Date().toISOString(), step, ...details };
  const path = statusPath(configFile);
  try {
    const previous = readStatus(
      path,
      details.entryId === undefined ? "" : String(details.entryId),
      configFile
    );
    const events = [...previous.events, event].slice(-MAX_EVENTS);
    const next: StatusFile = {
      ...previous,
      updatedAt: event.at,
      configPath: configFile,
      events,
    };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  } catch {
    // Best effort only; see the module doc.
  }
  return event;
}

/** Read the trail outside the plugin (tests, and the report that diagnosed an install). */
export function readStatusFile(configFile: string = configPath()): StatusFile {
  return readStatus(statusPath(configFile), "", configFile);
}
