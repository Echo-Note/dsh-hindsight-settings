/**
 * Drift guard against the INSTALLED Hindsight plugin.
 *
 * The field table in `fields.ts` is a copy of upstream's config surface, and a copy is exactly what
 * rots: upstream adds a setting, this package keeps rendering yesterday's list, and the page quietly
 * stops being the whole story. So the table is checked against the plugin that is actually installed
 * (its published bundle keeps the source shape) rather than against a note someone wrote.
 *
 * The check is skipped — loudly, by name — when the plugin is not on this machine, because this
 * package must build and test on a clean checkout.
 */
import { existsSync, readFileSync, globSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONFIG_FIELDS } from "./fields";
import { UPSTREAM_PACKAGE } from "./namespace";

/** Where an installed copy of the plugin's DSH half may live. */
function findUpstreamBundle(): string | undefined {
  const home = process.env.DSH_HOME ?? join(homedir(), ".dsh");
  const candidates = [
    ...globSync(`${home}/profiles/*/node_modules/${UPSTREAM_PACKAGE}/dist/dsh.js`),
    join(home, "cordis", "coding-agents", "dist", "dsh.js"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

const bundlePath = findUpstreamBundle();
const source = bundlePath === undefined ? undefined : readFileSync(bundlePath, "utf8");

/** `ENV_KEYS` as the bundle ships it: field name → HINDSIGHT_* variable. */
function upstreamEnvKeys(text: string): ReadonlyMap<string, string> {
  const block = /var ENV_KEYS = \{([\s\S]*?)\n\};/.exec(text)?.[1];
  if (block === undefined) return new Map();
  return new Map(
    [...block.matchAll(/(\w+):\s*"(HINDSIGHT_\w+)"/g)].map((match) => [match[1]!, match[2]!])
  );
}

/** The keys `resolveConfig` returns, which is the resolved surface every setting lands in. */
function upstreamResolvedKeys(text: string): readonly string[] {
  const start = text.indexOf("function resolveConfig(");
  if (start < 0) return [];
  const body = text.slice(start, start + 8_000);
  const end = body.indexOf("\n}\n");
  const keys = [...(end < 0 ? body : body.slice(0, end)).matchAll(/^ {4}(\w+):/gm)];
  return keys.map((match) => match[1]!);
}

/** `BANK_OVERRIDE_EXCLUDED` as the bundle ships it: the keys a bank / path section may not carry. */
function upstreamBankOverrideExcluded(text: string): readonly string[] {
  const block = /var BANK_OVERRIDE_EXCLUDED = \[([\s\S]*?)\n\];/.exec(text)?.[1];
  if (block === undefined) return [];
  return [...block.matchAll(/"([A-Za-z]+)"/g)].map((match) => match[1]!);
}

describe("field table vs the installed plugin", () => {
  it.skipIf(source === undefined)("names every env variable upstream reads", () => {
    const upstream = upstreamEnvKeys(source!);
    expect(upstream.size).toBeGreaterThan(30);
    const ours = new Map(
      CONFIG_FIELDS.filter((field) => field.env !== undefined).map((field) => [
        field.key,
        field.env!,
      ])
    );
    // Both directions: an upstream setting this table lost, and an invented one it never had.
    expect([...upstream.keys()].filter((key) => !ours.has(key))).toEqual([]);
    expect([...ours.keys()].filter((key) => !upstream.has(key))).toEqual([]);
    for (const [key, env] of upstream) expect(ours.get(key)).toBe(env);
  });

  it.skipIf(source === undefined)("marks exactly the keys a bank section discards", () => {
    // The page must not offer these for editing inside `banks.<id>`: upstream drops them on read
    // ("strip them rather than let them read as effective"), so the write would look saved and do
    // nothing. This ties the flag to the list the plugin actually ships, in both directions.
    const upstream = upstreamBankOverrideExcluded(source!);
    expect(upstream.length).toBeGreaterThan(4);
    const ours = CONFIG_FIELDS.filter((field) => field.bankScopeIgnored === true).map(
      (field) => field.key
    );
    expect([...ours].sort()).toEqual([...upstream].sort());
  });

  it.skipIf(source === undefined)("covers every key upstream resolves", () => {
    const resolved = upstreamResolvedKeys(source!);
    expect(resolved.length).toBeGreaterThan(30);
    const ours = new Set(CONFIG_FIELDS.map((field) => field.key));
    expect(resolved.filter((key) => !ours.has(key))).toEqual([]);
  });
});
