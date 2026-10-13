/**
 * Cross-check the two halves of the Remote contract against each other.
 *
 * The host manifest and the browser contribution are written in different files and different
 * languages of description, and the gateway refuses a call whose shapes disagree ("missing
 * <wire>", arity mismatch, a non-strict input codec). Neither half's own test can see the other:
 * the host self-check loads `lib/typert.host.js` alone, and the client smoke loads `lib/client.js`
 * alone. This compares them, so a disagreement fails here instead of in the browser.
 *
 * Run: node scripts/contract-crosscheck.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(import.meta.url);
const { TYPERT } = await import(join(root, "lib/typert.host.js"));

// ── the browser contribution, captured the way the shell receives it
const source = readFileSync(join(root, "lib/client.js"), "utf8");
const registration =
  /window\.__ModuleLoader__\.load\(\{[\s\S]*?\bid:\s*"([^"]+)"[\s\S]*?factory:\s*\(([^)]*)\)\s*=>/.exec(
    source
  );
assert.ok(registration, "lib/client.js is not a lazy module-loader registration");
const mounts = [];
const evaluation = new Function(
  "require",
  `const window = { __ModuleLoader__: { load: (r) => { globalThis.__reg = r } } };
   ${source}
   const registration = globalThis.__reg;
   return registration.factory(require);`
);
const pluginExports = evaluation((id) => (id === "react" ? require("react") : {}));
const ctx = {
  get: (key) =>
    key === "remote"
      ? {
          $mount: (contribution) => {
            mounts.push(contribution);
            return Promise.resolve(() => undefined);
          },
        }
      : undefined,
  effect: (run) => {
    run();
    return () => undefined;
  },
  slots: {
    inject: (_slot, register) => register(),
    register: () => () => undefined,
  },
};
Object.defineProperty(ctx, "remote", {
  get() {
    throw new Error("property read");
  },
});
pluginExports.apply(ctx);
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(mounts.length, 1, `expected one mounted contribution, got ${mounts.length}`);
const contribution = mounts[0];
const client = new Map(contribution.descriptors.map((d) => [d.method, d]));
const host = new Map(TYPERT.invocations.map((i) => [i.method, i]));
const problems = [];

assert.equal(contribution.package, TYPERT.package, "the contribution mounts a different package");
for (const [method, invocation] of host) {
  const descriptor = client.get(method);
  if (descriptor === undefined) {
    problems.push(`${method}: the host declares it, the page does not`);
    continue;
  }
  if (descriptor.service !== invocation.service)
    problems.push(`${method}: service ${descriptor.service} != ${invocation.service}`);
  if (descriptor.namespace !== invocation.namespace)
    problems.push(`${method}: namespace ${descriptor.namespace} != ${invocation.namespace}`);
  const hostWires = invocation.parameters.map((p) => p.wire).join(",");
  const clientWires = descriptor.parameters.map((p) => p.wire).join(",");
  if (hostWires !== clientWires)
    problems.push(`${method}: parameters [${clientWires}] != [${hostWires}]`);
  // Every host parameter is a strict-codec input; a client that sends it loosely is refused.
  for (const parameter of descriptor.parameters) {
    if (parameter.codec?.mode !== "strict")
      problems.push(`${method}.${parameter.wire}: the client codec is not strict`);
    if (parameter.source !== "json")
      problems.push(`${method}.${parameter.wire}: source is ${parameter.source}`);
  }
  for (const parameter of invocation.parameters) {
    if (parameter.codec?.mode !== "strict")
      problems.push(`${method}.${parameter.wire}: the host codec is not strict`);
  }
  if (descriptor.result?.mode !== "src-json")
    problems.push(`${method}: result mode ${descriptor.result?.mode}`);
}
for (const method of client.keys()) {
  if (!host.has(method)) problems.push(`${method}: the page declares it, the host does not`);
}

if (problems.length > 0) {
  console.error("contract cross-check FAILED:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(
  `contract cross-check passed: ${host.size} methods agree in name, namespace, parameter wires and codec strictness`
);
console.log(`  methods: ${[...host.keys()].join(", ")}`);
