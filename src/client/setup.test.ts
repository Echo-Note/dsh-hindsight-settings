/**
 * Exercise the page's SETUP path with the REAL React, and turn the client half's silent catch into
 * test output.
 *
 * The smoke test stubs React, so it cannot see a failure that only the real runtime raises; and the
 * page's own `catch` in `apply` sends the cause to `console.error`, which is unreachable from a
 * packaged desktop app. Spying on `console.error` and asserting the log is EMPTY means the failure
 * text lands in this test's diff instead of nowhere.
 *
 * ## The `locale` contract these tests pin down
 *
 * `locale` IS declared in `inject`, because this page reads `ctx.locale` — cordis refuses a property
 * read on a service that is not injected. Reading it is still defensive: every access goes through
 * `ctx.get("locale")` and validates the shape, so a context WITHOUT `ctx.locale` (a legitimate
 * composition, and exactly what the third test below builds) still registers the page. `locale` is
 * therefore a declared dependency whose absence degrades to the built-in English dictionaries rather
 * than a hard failure.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { DICTIONARIES, LOCALE_NS } from "./model";
import { apply } from "./index";

interface Registered {
  readonly options: Record<string, unknown>;
  readonly component: unknown;
}

interface LocaleStub {
  readonly active: { value: string };
  readonly registrations: Array<{ ns: string; dicts: Record<string, unknown> }>;
  readonly service: Record<string, unknown>;
  /** Test-only: switch the active language and notify subscribers, like the real service. */
  switchTo(next: string): void;
}

/** A `locale` service stand-in carrying the four methods the page calls. */
function makeLocale(initial: string): LocaleStub {
  const listeners: Array<() => void> = [];
  const registrations: Array<{ ns: string; dicts: Record<string, unknown> }> = [];
  const active = { value: initial };
  const service = {
    register: (ns: string, dicts: Record<string, unknown>) => {
      registrations.push({ ns, dicts });
      return () => undefined;
    },
    bind: (ns: string) => (key: string) =>
      DICTIONARIES[active.value === "zh" ? "zh" : "en"][key as never] ?? key,
    getLocale: () => ({ active: active.value, locales: [], revision: 1 }),
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => undefined;
    },
  };
  return {
    active,
    registrations,
    service,
    // Test-only: switch the language and notify, exactly like a real switch.
    switchTo: (next: string) => {
      active.value = next;
      for (const listener of listeners) listener();
    },
  };
}

/** The smallest client context that satisfies the documented registration shape. */
function fakeContext(
  options: { effect?: boolean; remote?: boolean; locale?: boolean | "zh" } = {}
): {
  ctx: Record<string, unknown>;
  registered: Registered[];
  locale: LocaleStub;
} {
  const registered: Registered[] = [];
  const service = {
    describe: () => Promise.resolve({ ok: true, value: { path: "/tmp/x.json", fields: [] } }),
    apply: () => Promise.resolve({ ok: true, value: { changed: false, removed: [] } }),
  };
  const remote = { $mount: () => Promise.resolve(() => undefined) };
  const locale = makeLocale(options.locale === "zh" ? "zh" : "en");
  const ctx: Record<string, unknown> = {
    slots: {
      inject: (_key: string, callback: () => unknown) => callback(),
      register: (spec: Record<string, unknown>, component: unknown) => {
        registered.push({ options: spec, component });
        return () => undefined;
      },
    },
    get: (key: string) => {
      if (key === "locale") return options.locale === false ? undefined : locale.service;
      if (key === "remote") return options.remote === true ? remote : undefined;
      return options.remote === true ? service : undefined;
    },
  };
  if (options.effect !== false) ctx.effect = (callback: () => unknown) => callback();
  return { ctx, registered, locale };
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** Spy on console.error so a swallowed setup failure shows up in the assertion diff. */
function trapErrors(): unknown[][] {
  const errors: unknown[][] = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void errors.push(args));
  return errors;
}

describe("the page's setup path", () => {
  it("builds the store and the component without logging a failure", () => {
    const errors = trapErrors();
    const { ctx, registered } = fakeContext();
    apply(ctx as never);
    // A non-empty log IS the diagnosis: its text is in the assertion diff below.
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
    expect(registered[0]?.options.id).toBe("hindsight-settings");
    expect(registered[0]?.options.name).toBe("settings.section");
  });

  it("registers both shipped dictionaries for the page's namespace", () => {
    // The registration is the whole i18n contract: one namespace, both locales, inside an owned
    // effect so a reload cannot leave a stale dictionary behind.
    const errors = trapErrors();
    const { ctx, locale } = fakeContext();
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(locale.registrations).toHaveLength(1);
    const [registration] = locale.registrations;
    expect(registration?.ns).toBe(LOCALE_NS);
    expect(Object.keys(registration?.dicts ?? {})).toEqual(["en", "zh"]);
    const dicts = registration?.dicts as { en: Record<string, string>; zh: Record<string, string> };
    expect(Object.keys(dicts.en)).toEqual(Object.keys(DICTIONARIES.en));
    expect(Object.keys(dicts.zh)).toEqual(Object.keys(DICTIONARIES.en));
  });

  it("gives the page the t seat by declaring its locale namespace on the slot", () => {
    const errors = trapErrors();
    const { ctx, registered } = fakeContext();
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(registered[0]?.options.locale).toBe(LOCALE_NS);
    // The label is a thunk, so the navigation row follows a switch without re-registering.
    const label = registered[0]?.options.label as () => string;
    expect(typeof label).toBe("function");
    expect(label()).toBe(DICTIONARIES.en.title);
  });

  it("translates the navigation label through the active language", () => {
    const errors = trapErrors();
    const { ctx, registered, locale } = fakeContext({ locale: "zh" });
    apply(ctx as never);
    expect(errors).toEqual([]);
    const label = registered[0]?.options.label as () => string;
    expect(label()).toBe(DICTIONARIES.zh.title);
    locale.switchTo("en");
    // The thunk is re-read on every projection, so the same registration now reports English.
    expect(label()).toBe(DICTIONARIES.en.title);
  });

  it("still renders a context that offers no ctx.locale", () => {
    // A composition without the locale service is legitimate: `locale` is declared so the service can
    // be read, but its ABSENCE must degrade to the built-in dictionaries, not to an exception.
    const errors = trapErrors();
    const { ctx, registered } = fakeContext({ locale: false });
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
    const label = registered[0]?.options.label as () => string;
    expect(label()).toBe(DICTIONARIES.en.title);
  });

  it("still registers when the shell offers no ctx.effect", () => {
    const errors = trapErrors();
    const { ctx, registered, locale } = fakeContext({ effect: false });
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
    // Without an effect the dictionaries are still registered, just not owned by one.
    expect(locale.registrations).toHaveLength(1);
  });

  it("never reads a service as a property, because an undeclared read throws", () => {
    // Regression for the exact failure the page reported: `cannot get property "remote" without
    // inject`. A property read on a service this plugin did not inject throws, so every access must
    // go through ctx.get; this fake throws if any code path touches either property.
    const errors = trapErrors();
    const { ctx, registered } = fakeContext({ remote: false });
    for (const property of ["remote", "locale"]) {
      Object.defineProperty(ctx, property, {
        configurable: true,
        get() {
          throw new Error(`cannot get property "${property}" without inject`);
        },
      });
    }
    expect(() => apply(ctx as never)).not.toThrow();
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
  });

  it("still registers when the gateway client is absent", () => {
    const errors = trapErrors();
    const { ctx, registered } = fakeContext({ remote: false });
    apply(ctx as never);
    expect(errors).toEqual([]);
    expect(registered).toHaveLength(1);
  });
});
