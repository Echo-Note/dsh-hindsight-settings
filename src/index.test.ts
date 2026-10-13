import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { apply, type DshContext, type HindsightSettingsService } from "./index";
import { SERVICE_KEY } from "./index";
import { statusPath } from "./status";

let dir: string;
let file: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hindsight-settings-"));
  file = join(dir, "coding-agent.json");
});

/** A context that records what the host half published. */
function harness(options: { withoutProvide?: boolean } = {}): {
  ctx: DshContext;
  provided: Map<string, unknown>;
  warnings: unknown[][];
} {
  const provided = new Map<string, unknown>();
  const warnings: unknown[][] = [];
  const ctx: DshContext = {
    logger: { info: () => undefined, warn: (...args: unknown[]) => warnings.push(args) },
    ...(options.withoutProvide === true
      ? {}
      : { provide: (key, value) => void provided.set(key, value) }),
  };
  return { ctx, provided, warnings };
}

const serviceOf = (provided: Map<string, unknown>): HindsightSettingsService =>
  provided.get(SERVICE_KEY) as HindsightSettingsService;

describe("apply", () => {
  it("publishes the settings service the manifest addresses", () => {
    const host = harness();
    apply(host.ctx);
    const service = serviceOf(host.provided);
    expect(typeof service.describe).toBe("function");
    expect(typeof service.apply).toBe("function");
  });

  it("stays inert on a composition without ctx.provide", () => {
    const host = harness({ withoutProvide: true });
    expect(() => apply(host.ctx)).not.toThrow();
    expect(host.provided.size).toBe(0);
    expect(host.warnings).toHaveLength(1);
  });
});

describe("the service the page calls", () => {
  it("reports every setting with the file's value and whether the file sets it", () => {
    writeFileSync(file, JSON.stringify({ bankId: "gaoxiaogang", reflectTimeoutMs: 20000 }));
    const host = harness();
    apply(host.ctx);
    const view = serviceOf(host.provided).describe({ kind: "top" }, file);
    const bankId = view.fields.find((field) => field.key === "bankId");
    const pageSearchLimit = view.fields.find((field) => field.key === "pageSearchLimit");
    expect(bankId).toMatchObject({ value: "gaoxiaogang", inFile: true });
    expect(pageSearchLimit).toMatchObject({ value: null, inFile: false });
    expect(view.path).toBe(file);
    expect(view.error).toBeUndefined();
    expect(view.fields).toHaveLength(52);
  });

  it("flags a field the harness section overrides, because the page writes the top level", () => {
    writeFileSync(
      file,
      JSON.stringify({ bankId: "top", harnesses: { dsh: { bankId: "harness" } } })
    );
    const host = harness();
    apply(host.ctx);
    const view = serviceOf(host.provided).describe({ kind: "top" }, file);
    expect(view.fields.find((field) => field.key === "bankId")?.shadowedByHarness).toBe(true);
  });

  it("never returns a secret value, because every response crosses the gateway", () => {
    // dsh's own settings service redacts a `role('secret')` field from form responses; a token in a
    // page's DOM is the same leak whether the page is loopback-only or not.
    writeFileSync(file, JSON.stringify({ apiToken: "super-secret", logLevel: "debug" }));
    const host = harness();
    apply(host.ctx);
    const view = serviceOf(host.provided).describe({ kind: "top" }, file);
    expect(view.fields.find((field) => field.key === "apiToken")).toMatchObject({
      value: null,
      inFile: true,
    });
    expect(JSON.stringify(view)).not.toContain("super-secret");
  });

  it("reports a file it cannot parse instead of pretending it is empty", () => {
    writeFileSync(file, "{ broken");
    const host = harness();
    apply(host.ctx);
    const view = serviceOf(host.provided).describe({ kind: "top" }, file);
    expect(view.error).toContain("not valid JSON");
  });

  it("writes a patch into the file and preserves everything else", () => {
    writeFileSync(file, JSON.stringify({ apiToken: "tok", banks: { "a::b": {} } }));
    const host = harness();
    apply(host.ctx);
    const result = serviceOf(host.provided).apply({ bankId: "team", logLevel: "debug" }, file);
    expect(result.changed).toBe(true);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
      apiToken: "tok",
      banks: { "a::b": {} },
      bankId: "team",
      logLevel: "debug",
    });
  });

  it("removes a key on null, so the setting falls back to the environment, then the default", () => {
    writeFileSync(file, JSON.stringify({ bankId: "team", logLevel: "debug" }));
    const host = harness();
    apply(host.ctx);
    const result = serviceOf(host.provided).apply({ bankId: null }, file);
    expect(result.removed).toEqual(["bankId"]);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ logLevel: "debug" });
  });

  it("refuses a file-only setting and an unknown key", () => {
    writeFileSync(file, JSON.stringify({}));
    const host = harness();
    apply(host.ctx);
    const service = serviceOf(host.provided);
    expect(() => service.apply({ banks: {} }, file)).toThrow(/file-only/);
    expect(() => service.apply({ nope: 1 }, file)).toThrow(/unknown setting/);
    expect(readFileSync(file, "utf8")).toBe("{}");
  });

  it("records a line the browser half sends, so a client failure is readable", () => {
    const host = harness();
    apply(host.ctx);
    const ack = serviceOf(host.provided).note("register: threw — Error: slot is not declared");
    expect(ack.ok).toBe(true);
    const trail = JSON.parse(readFileSync(statusPath(), "utf8")) as {
      events: Array<{ step: string; message?: string }>;
    };
    expect(trail.events.at(-1)).toMatchObject({
      step: "client",
      message: "register: threw — Error: slot is not declared",
    });
  });

  it("reads one bank's overrides when asked for that scope", () => {
    writeFileSync(
      file,
      JSON.stringify({
        logLevel: "info",
        banks: { gaoxiaogang: { logLevel: "debug", gitIngest: "full" } },
      })
    );
    const host = harness();
    apply(host.ctx);
    const service = serviceOf(host.provided);
    const top = service.describe({ kind: "top" }, file);
    // The top read also lists the sections the file already carries, which is what the page's
    // per-bank tab is built from.
    expect(top.banks).toEqual([{ id: "gaoxiaogang", keys: ["gitIngest", "logLevel"] }]);
    const bank = service.describe({ kind: "bank", id: "gaoxiaogang" }, file);
    expect(bank.fields.find((field) => field.key === "logLevel")).toMatchObject({
      value: "debug",
      inFile: true,
    });
    expect(bank.fields.find((field) => field.key === "gitIngest")).toMatchObject({ value: "full" });
    expect(bank.fields.find((field) => field.key === "bankId")).toMatchObject({ inFile: false });
  });

  it("writes into one bank section without disturbing the rest of the file", () => {
    writeFileSync(
      file,
      JSON.stringify({ apiToken: "tok", banks: { gaoxiaogang: { logLevel: "debug" } }, myKey: 1 })
    );
    const host = harness();
    apply(host.ctx);
    const result = serviceOf(host.provided).applyScoped(
      { kind: "bank", id: "team" },
      { gitIngest: "none", logLevel: null },
      file
    );
    expect(result.changed).toBe(true);
    const written = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    expect(written.banks).toEqual({
      gaoxiaogang: { logLevel: "debug" },
      team: { gitIngest: "none" },
    });
    expect(written.apiToken).toBe("tok");
    expect(written.myKey).toBe(1);
  });

  it("drops a bank section that ends up empty instead of leaving an empty object", () => {
    writeFileSync(file, JSON.stringify({ banks: { solo: { logLevel: "debug" } } }));
    const host = harness();
    apply(host.ctx);
    serviceOf(host.provided).applyScoped({ kind: "bank", id: "solo" }, { logLevel: null }, file);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({});
  });

  it("does not touch the file when the patch says what it already says", () => {
    writeFileSync(file, JSON.stringify({ logLevel: "debug" }));
    const host = harness();
    apply(host.ctx);
    const result = serviceOf(host.provided).apply({ logLevel: "debug" }, file);
    expect(result.changed).toBe(false);
  });
});
