/**
 * Structural guards for the hand-written Typert manifest.
 *
 * Every rule here corresponds to a way a manifest fails AT RUNTIME, on the user's machine, with a
 * message that never mentions this package:
 *
 *   - no `model` object    → `TYPERT.model must be an object`; the namespace never mounts and every
 *                            call answers 404 on `/api/<namespace>/<method>`;
 *   - a loose result codec → `invocation "…" result codec must use a strict codec` (the loader
 *                            validates the Host face at registration);
 *   - a parameter without a strict codec → refused before the call is made;
 *   - an `id` or `service` that disagrees with what the host publishes → 404, or a call that reaches
 *                            the wrong service.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SERVICE_KEY } from "./index";
import { PACKAGE_NAME } from "./namespace";
import { TYPERT } from "./typert.host";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

interface Codec {
  readonly mode?: string;
  readonly typeSymbol?: string;
  readonly create?: () => { parse(value: unknown): unknown };
}
interface Invocation {
  readonly id: string;
  readonly service: string;
  readonly namespace: string;
  readonly method: string;
  readonly parameters: readonly {
    readonly name: string;
    readonly wire: string;
    readonly codec?: Codec;
  }[];
  readonly result: Codec;
}

const manifest = TYPERT as unknown as {
  package: string;
  face: string;
  schemas: readonly { name: string; create: () => { parse(value: unknown): unknown } }[];
  model: {
    services: readonly {
      key: string;
      tags?: readonly string[];
      members: readonly { name: string }[];
    }[];
  };
  invocations: readonly Invocation[];
};

const schemaNames = new Set(manifest.schemas.map((schema) => schema.name));

/** Every type symbol a codec names must resolve to a registered schema (via its `#Name` suffix). */
function registered(codec: Codec): boolean {
  const symbol = codec.typeSymbol ?? "";
  const name = symbol.slice(symbol.indexOf("#") + 1);
  return schemaNames.has(name) && typeof codec.create === "function";
}

describe("the Typert manifest", () => {
  it("names the package the loader scans, and the Host face", () => {
    expect(manifest.package).toBe(PACKAGE_NAME);
    expect(manifest.face).toBe("host");
  });

  it("carries the model reflection the loader requires", () => {
    expect(typeof manifest.model).toBe("object");
    expect(manifest.model.services.length).toBeGreaterThan(0);
    for (const service of manifest.model.services) expect(Array.isArray(service.tags)).toBe(true);
  });

  it("addresses the service key the host actually publishes", () => {
    expect(manifest.model.services.map((service) => service.key)).toEqual([SERVICE_KEY]);
    for (const invocation of manifest.invocations) {
      expect(invocation.service).toBe(SERVICE_KEY);
      expect(invocation.namespace).toBe(SERVICE_KEY);
    }
  });

  it("spells every id as <package>#<service>/<method>", () => {
    for (const invocation of manifest.invocations) {
      expect(invocation.id).toBe(`${PACKAGE_NAME}#${SERVICE_KEY}/${invocation.method}`);
    }
  });

  it("uses a strict, registered codec for every result and parameter", () => {
    for (const invocation of manifest.invocations) {
      expect(invocation.result.mode).toBe("strict");
      expect(registered(invocation.result)).toBe(true);
      for (const parameter of invocation.parameters) {
        expect(parameter.codec?.mode).toBe("strict");
        expect(registered(parameter.codec ?? {})).toBe(true);
        expect(parameter.wire.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every declared member a method the manifest invokes", () => {
    const invoked = new Set(manifest.invocations.map((invocation) => invocation.method));
    for (const member of manifest.model.services[0]?.members ?? []) {
      expect(invoked.has(member.name)).toBe(true);
    }
    expect(invoked.size).toBe(manifest.invocations.length);
  });

  it("is what package.json exports as ./typert", () => {
    const manifestJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
      exports: Record<string, string>;
    };
    expect(manifestJson.exports["./typert"]).toBe("./lib/typert.host.js");
  });
});
