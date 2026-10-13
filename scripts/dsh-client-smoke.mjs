#!/usr/bin/env node
/**
 * Bundle-shape smoke test for the browser half.
 *
 * A headless Node process cannot prove that a React page *renders*, and cannot prove that a Remote
 * call succeeds against a live host. What it CAN prove is everything that would stop the page from
 * loading at all, plus the two contracts that are pure shape:
 *
 *   1. the artifact registers with exactly one `window.__ModuleLoader__.load({ id, factory })` call,
 *      and `id` is the package name the client module system keys the bundle by;
 *   2. registration is LAZY — running the file executes no module body, touches no DOM, and calls no
 *      `require` (all of that lives inside the factory closure);
 *   3. materializing the factory with harmless stubs yields the plugin's exports;
 *   4. the artifact requires nothing outside DSH's frozen platform module table, because `require()`
 *      for anything else throws at materialization;
 *   5. `apply()` registers into `settings.section` — NOT `plugins.detail.section` — when given a stub
 *      `slots` service, and mounts its Remote contribution exactly once when given a stub `remote`;
 *   6. the page tolerates a missing `ctx.remote` by rendering an explanation instead of throwing.
 *
 * This file is deliberately platform-neutral: every path is derived from `import.meta.url`, so it
 * runs unchanged on Windows, macOS and Linux.
 *
 * Usage: `node scripts/dsh-client-smoke.mjs` (run after `npx tsup --config tsup.client.config.ts`).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BUNDLE = join(ROOT, "lib", "client.js");
const PACKAGE_JSON = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

/**
 * DSH's frozen module table (`packages/client/web/src/platform.ts`, PLATFORM_MODULES). Nothing else
 * can be required: the shell seeds exactly this table and throws on a request it cannot answer.
 */
const PLATFORM_MODULES = [
  "react",
  "react/jsx-runtime",
  "react-dom",
  "react-dom/client",
  "@deepseek-ai/cordis",
  "@deepseek-ai/dsh-client-store",
  "@deepseek-ai/dsh-client-ui-slots",
  "@deepseek-ai/dsh-client-ui-primitives",
  "@deepseek-ai/dsh-client-ui-dockkit",
];

const passed = [];
async function check(name, run) {
  await run();
  passed.push(name);
  console.log(`  ok  ${name}`);
}

/** Let every pending microtask (and the immediate queue) settle, so an async mount can publish. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Read the artifact
// ─────────────────────────────────────────────────────────────────────────────────────────────────

let source;
try {
  source = readFileSync(BUNDLE, "utf8");
} catch {
  console.error(`missing ${BUNDLE}\nrun: npx tsup --config tsup.client.config.ts`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// 1. Loading the bundle only registers a factory
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const registrations = [];
const documentTouches = [];
const appended = [];

/** A DOM stand-in that records every access, so a module-body side effect cannot hide. */
const documentSpy = new Proxy(
  {
    getElementById: () => undefined,
    createElement: () => ({ id: "", textContent: "", dataset: {} }),
    head: { appendChild: (element) => appended.push(element) },
  },
  {
    get(target, property, receiver) {
      documentTouches.push(String(property));
      return Reflect.get(target, property, receiver);
    },
  }
);

const sandbox = {
  window: { __ModuleLoader__: { load: (registration) => registrations.push(registration) } },
  document: documentSpy,
  console,
};
// Deliberately NO `require` in the sandbox: if the module body ran at registration, its first
// `require("react")` would throw a ReferenceError instead of quietly succeeding.

vm.runInNewContext(source, sandbox, { filename: "lib/client.js" });

await check("the artifact is exactly one `window.__ModuleLoader__.load({ … })` call", () => {
  assert.match(source, /^window\.__ModuleLoader__\.load\(\{\s*id:/);
  assert.match(source.trimEnd(), /\}\);\s*$/);
  assert.equal(registrations.length, 1, `expected one registration, got ${registrations.length}`);
});

const registration = registrations[0];

await check("it registers under the package name, with a factory", () => {
  assert.equal(registration.id, PACKAGE_JSON.name);
  assert.equal(typeof registration.factory, "function");
});

await check("registration is lazy: no module body, no DOM access, no require", () => {
  assert.deepEqual(
    documentTouches,
    [],
    `the bundle touched document at registration: ${documentTouches}`
  );
  assert.deepEqual(appended, [], "the bundle injected a stylesheet at registration");
  assert.equal("require" in sandbox, false);
});
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// 2. Materialization yields the plugin's exports
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const requiredIds = [];

/**
 * A React stand-in.
 *
 * `createElement` invokes a function component eagerly, which turns the page into the whole element
 * tree in one pass — enough to assert what it says without a renderer. `useState` answers with its
 * initial value (invoking a lazy initializer, so a component can read a snapshot synchronously) and
 * `useEffect` is a no-op, which is why an unresolved async load shows as "loading" here.
 */
function makeReact() {
  const invoke = (type, props, children) => {
    const withChildren = { ...(props ?? {}) };
    if (children.length > 0) withChildren.children = children;
    return typeof type === "function" ? type(withChildren) : { type, props: withChildren };
  };
  const hooks = {
    useState: (initial) => [typeof initial === "function" ? initial() : initial, () => undefined],
    useReducer: (_reducer, initial) => [initial, () => undefined],
    useMemo: (factory) => factory(),
    useCallback: (factory) => factory,
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
    useRef: (value) => ({ current: value }),
    useContext: () => undefined,
    useId: () => "dsh-smoke",
    createElement: (type, props, ...children) => invoke(type, props, children),
    createContext: () => ({ Provider: "Provider", Consumer: "Consumer" }),
    Fragment: Symbol.for("react.fragment"),
    memo: (component) => component,
    forwardRef: (component) => component,
  };
  return new Proxy(hooks, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
      return () => undefined;
    },
  });
}

const React = makeReact();
const JSX_RUNTIME = {
  jsx: (type, props) => ({ type, props: props ?? {} }),
  jsxs: (type, props) => ({ type, props: props ?? {} }),
  Fragment: React.Fragment,
};

/** Harmless stubs for every baseline module; anything unknown gets a permissive stand-in too. */
function requireStub(id) {
  requiredIds.push(id);
  if (id === "react") return React;
  if (id === "react/jsx-runtime") return JSX_RUNTIME;
  return new Proxy({}, { get: () => () => undefined });
}

/** One descriptor by method, so adding an invocation cannot break an index-based assertion. */
function descriptorByMethod(contribution, method) {
  const found = contribution.descriptors.find((descriptor) => descriptor.method === method);
  assert.ok(found, `the contribution declares ${method}`);
  return found;
}

const pluginExports = registration.factory(requireStub);

await check("materializing the factory returns the plugin exports", () => {
  assert.equal(typeof pluginExports, "object");
  assert.equal(pluginExports.name, "dsh-hindsight-settings");
  assert.equal(typeof pluginExports.apply, "function");
  assert.ok(Array.isArray(pluginExports.inject), "inject must be an array");
  assert.ok(pluginExports.inject.includes("slots"), "slots is a hard dependency");
  // `remote` IS injected: cordis refuses a property read on a service that is not injected
  // (`cannot get property "remote" without inject` — the failure this page actually reported), and
  // the api-gateway reference says a plugin calling `ctx.remote.<namespace>` declares `remote` too.
  // Absence is still handled: every read goes through `ctx.get(...)` and the page explains the gap.
  assert.ok(
    pluginExports.inject.includes("remote"),
    "remote is read by this page and must be injected"
  );
  // The service that never served this plugin's namespace must not come back as a dependency.
  assert.equal(pluginExports.inject.includes("configForms"), false);
});

await check("the bundle requires nothing outside the platform module table", () => {
  const requested = [
    ...new Set([...source.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1])),
  ];
  const nonBaseline = requested.filter(
    (id) => !id.startsWith(".") && !PLATFORM_MODULES.includes(id)
  );
  assert.deepEqual(
    nonBaseline,
    [],
    `non-baseline require(s): ${nonBaseline.join(", ")} — a require the shell's frozen table cannot answer throws at materialization`
  );
  const deepseek = requested.filter((id) => id.startsWith("@deepseek-ai/"));
  assert.deepEqual(
    deepseek,
    [],
    `@deepseek-ai/* VALUE imports are rejected by the build gate; collaborate through cordis services instead (found: ${deepseek.join(", ")})`
  );
  assert.ok(requiredIds.length > 0, "the factory required nothing: react was not reached");
  assert.deepEqual(
    requiredIds.filter((id) => !PLATFORM_MODULES.includes(id)),
    []
  );
  console.log(`      requires: ${requested.length === 0 ? "(none)" : requested.join(", ")}`);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// 3. `apply()` registers on the Settings seat and mounts its Remote contribution
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const VIEW = {
  path: "/home/someone/.hindsight/coding-agent.json",
  fields: [
    {
      key: "serverMode",
      group: "connection",
      kind: "enum",
      values: ["cloud", "self-hosted", "daemon"],
      default: "cloud",
      env: "HINDSIGHT_SERVER_MODE",
      editable: true,
      scope: "global",
      summary: "记忆存放在哪里。",
      value: "cloud",
      inFile: true,
      shadowedByHarness: false,
    },
    {
      key: "banks",
      group: "scope",
      kind: "json",
      default: null,
      editable: false,
      scope: "bank",
      summary: "按 bank 覆盖。",
      value: null,
      inFile: false,
      shadowedByHarness: false,
    },
  ],
};

/** A `remote` stand-in: records the contribution it was handed, then exposes a namespace service. */
function makeRemote({ mountThrows = false } = {}) {
  const mounts = [];
  const remote = {
    async $mount(contribution) {
      if (mountThrows) throw new Error("mount refused");
      mounts.push(contribution);
      return async () => undefined;
    },
  };
  return { remote, mounts };
}

/** A `remote.hindsightSettings` stand-in: both methods answer the gateway's `RemoteResult`. */
function makeNamespace({ describe = async () => ({ ok: true, value: VIEW }) } = {}) {
  return {
    describe,
    apply: async (patch) => ({
      ok: true,
      value: { path: VIEW.path, changed: true, removed: ["x"] },
    }),
  };
}

function runApply({ remote, service, slots = true } = {}) {
  const registered = [];
  const disposers = [];
  const ctx = {
    // The page reads `remote` through ctx.get (never the property, which cordis refuses without
    // inject), so the stub must answer that lookup as the real context does.
    get: (key) =>
      key === "remote" ? remote : key === "remote.hindsightSettings" ? service : undefined,
    effect: (execute) => {
      const disposer = execute();
      if (typeof disposer === "function") disposers.push(disposer);
      return () => undefined;
    },
  };
  // A property read on an uninjected service is what cordis refuses, so this stub throws exactly
  // like the real context does: any code path that reads ctx.remote instead of ctx.get("remote")
  // fails here, which is how the page's real failure was found.
  Object.defineProperty(ctx, "remote", {
    configurable: true,
    get() {
      throw new Error('cannot get property "remote" without inject');
    },
  });
  if (slots) {
    ctx.slots = {
      inject: (_slot, register) => register(),
      register: (spec, component) => {
        registered.push({ slot: spec.name, spec, component });
        return () => undefined;
      },
    };
  }
  pluginExports.apply(ctx);
  return { registered, disposers };
}

await check("apply() registers one `settings.section` contribution owned by an effect", () => {
  const { remote } = makeRemote();
  const { registered, disposers } = runApply({ remote, service: makeNamespace() });
  assert.equal(registered.length, 1, `expected one registration, got ${registered.length}`);
  assert.equal(registered[0].slot, "settings.section");
  assert.notEqual(registered[0].slot, "plugins.detail.section");
  assert.equal(registered[0].spec.id, "hindsight-settings");
  assert.equal(registered[0].spec.order, 35);
  assert.equal(typeof registered[0].spec.label, "function");
  assert.equal(registered[0].spec.label(), "Hindsight 记忆设置");
  assert.equal(typeof registered[0].component, "function");
  assert.equal(disposers.length, 1, "the registration must be owned by an effect");
  for (const dispose of disposers) dispose();
});

await check(
  "apply() mounts exactly one contribution for the hindsightSettings namespace",
  async () => {
    const { remote, mounts } = makeRemote();
    runApply({ remote, service: makeNamespace() });
    await flush();
    assert.equal(mounts.length, 1, `expected one $mount call, got ${mounts.length}`);
    const contribution = mounts[0];
    assert.equal(contribution.package, "@local/dsh-hindsight-settings");
    // Spread into a host array first: the contribution was built inside the `vm` realm, so its arrays
    // carry that realm's prototype and a deep comparison against a host array fails on identity.
    assert.deepEqual(
      [...contribution.descriptors].map((d) => d.method),
      ["describe", "note", "apply"]
    );
    for (const descriptor of contribution.descriptors) {
      assert.equal(descriptor.service, "hindsightSettings");
      assert.equal(descriptor.namespace, "hindsightSettings");
      assert.equal(descriptor.result.mode, "src-json");
    }
    // $mount refuses a Client parameter without a strict codec, so the input must carry one.
    const [parameter] = descriptorByMethod(contribution, "apply").parameters;
    assert.equal(parameter.codec.mode, "strict");
    assert.equal(parameter.wire, "patch");
  }
);

await check("apply() never throws when the Remote service is absent", () => {
  const { registered } = runApply({ service: undefined });
  assert.equal(registered.length, 1, "the page still registers so it can explain itself");
});

await check("the page explains a missing ctx.remote instead of throwing", () => {
  const { registered } = runApply({ service: undefined });
  const tree = registered[0].component({});
  assert.ok(tree !== null && typeof tree === "object", "expected a rendered element");
  const rendered = JSON.stringify(tree);
  assert.ok(rendered.includes("Remote"), "the missing Remote service is not named");
  assert.ok(rendered.includes("Hindsight"), "the page title is missing");
});

await check("the page explains a failed $mount instead of throwing", async () => {
  const { remote } = makeRemote({ mountThrows: true });
  const { registered } = runApply({ remote, service: makeNamespace() });
  await flush();
  const tree = registered[0].component({});
  assert.ok(JSON.stringify(tree).includes("挂载失败"), "the mount failure is not reported");
});

await check("a mounted page renders without a renderer and shows the loading state", async () => {
  // With `useEffect` stubbed out the async describe never lands, so this proves the ready-branch
  // shell is constructible — NOT that fields render. That needs a real browser.
  const { remote } = makeRemote();
  const { registered } = runApply({ remote, service: makeNamespace() });
  await flush();
  const tree = registered[0].component({});
  assert.ok(tree !== null && typeof tree === "object", "expected a rendered element");
  assert.ok(
    JSON.stringify(tree).includes("正在读取"),
    "no loading state while describe is in flight"
  );
});

console.log(`\n${passed.length} checks passed (${BUNDLE.slice(ROOT.length + 1)})`);
console.log(
  "NOTE: this proves bundle shape, the export contract, slot registration and the mount call."
);
console.log(
  "      It does NOT prove that fields render or that a Remote call succeeds: that needs a"
);
console.log(
  "      real browser against a live host (no React renderer, slot registry or host here)."
);
