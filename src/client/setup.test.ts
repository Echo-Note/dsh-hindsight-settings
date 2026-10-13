/**
 * Exercise the page's SETUP path with the REAL React, and turn the client half's silent catch into
 * test output.
 *
 * The smoke test stubs React, so it cannot see a failure that only the real runtime raises; and the
 * page's own `catch` in `apply` sends the cause to `console.error`, which is unreachable from a
 * packaged desktop app. Spying on `console.error` and asserting the log is EMPTY means the failure
 * text lands in this test's diff instead of nowhere.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { apply } from "./index";

interface Registered {
  readonly options: Record<string, unknown>;
  readonly component: unknown;
}

/** The smallest client context that satisfies the documented registration shape. */
function fakeContext(options: { effect?: boolean; remote?: boolean } = {}): {
  ctx: Record<string, unknown>;
  registered: Registered[];
} {
  const registered: Registered[] = [];
  const service = {
    describe: () => Promise.resolve({ ok: true, value: { path: "/tmp/x.json", fields: [] } }),
    apply: () => Promise.resolve({ ok: true, value: { changed: false, removed: [] } }),
  };
  const remote = { $mount: () => Promise.resolve(() => undefined) };
  const ctx: Record<string, unknown> = {
    slots: {
      inject: (_key: string, callback: () => unknown) => callback(),
      register: (spec: Record<string, unknown>, component: unknown) => {
        registered.push({ options: spec, component });
        return () => undefined;
      },
    },
    get: (key: string) =>
      key === "remote" && options.remote === true
        ? remote
        : options.remote === true
          ? service
          : undefined,
  };
  if (options.effect !== false) ctx.effect = (callback: () => unknown) => callback();
  return { ctx, registered };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the page's setup path", () => {
  it("builds the store and the component without logging a failure", () => {
    const errors: unknown[][] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void errors.push(args));
    const { ctx, registered } = fakeContext();
    apply(ctx as never);
    // A non-empty log IS the diagnosis: its text is in the assertion diff below.
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
    expect(registered[0]?.options.id).toBe("hindsight-settings");
    expect(registered[0]?.options.name).toBe("settings.section");
  });

  it("still registers when the shell offers no ctx.effect", () => {
    const errors: unknown[][] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void errors.push(args));
    const { ctx, registered } = fakeContext({ effect: false });
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
  });

  it("never reads a service as a property, because an undeclared read throws", () => {
    // Regression for the exact failure the page reported: `cannot get property "remote" without
    // inject`. A property read on a service this plugin did not inject throws, so every access must
    // go through ctx.get; this fake throws if any code path touches the property.
    const errors: unknown[][] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void errors.push(args));
    const { ctx, registered } = fakeContext({ remote: false });
    Object.defineProperty(ctx, "remote", {
      configurable: true,
      get() {
        throw new Error('cannot get property "remote" without inject');
      },
    });
    expect(() => apply(ctx as never)).not.toThrow();
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
  });

  it("still registers when the gateway client is absent", () => {
    const errors: unknown[][] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void errors.push(args));
    const { ctx, registered } = fakeContext({ remote: false });
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
  });
});
