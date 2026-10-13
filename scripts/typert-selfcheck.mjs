/**
 * Self-check the Host half the way the gateway drives it.
 *
 * `dsh-api-gateway` resolves `descriptor.service` on the plugin context (`receiverContext.get(...)`)
 * and invokes `descriptor.method` with the manifest's parameters. This script does the same thing
 * against a throwaway config file, so the manifest, the service key and the method names are proven
 * to line up WITHOUT a browser, a dsh host, or a running profile — the three things a headless test
 * otherwise cannot have.
 *
 * It also asserts the two registration rules the loader enforces at runtime: `model` must be an
 * object (else the namespace never mounts and every call 404s), and every result codec must be strict
 * (else registration is refused with "result codec must use a strict codec").
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TYPERT } from "../lib/typert.host.js";
import { createSettingsService } from "../lib/index.js";

const failures = [];
const check = (label, condition, detail = "") => {
  if (condition) console.log(`  ok  ${label}${detail ? ` — ${detail}` : ""}`);
  else failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
};

console.log("manifest");
check("model is an object", typeof TYPERT.model === "object" && TYPERT.model !== null);
check("names its package", TYPERT.package === "@local/dsh-hindsight-settings", TYPERT.package);
check(
  "declares every invocation's service in the model",
  TYPERT.model.services.every((service) =>
    TYPERT.invocations.every((i) => i.service === service.key)
  )
);
check(
  "every result codec is strict and registered",
  TYPERT.invocations.every(
    (i) =>
      i.result.mode === "strict" &&
      TYPERT.schemas.some((s) => i.result.typeSymbol.endsWith(`#${s.name}`))
  )
);
check(
  "every parameter codec is strict",
  TYPERT.invocations.every((i) => i.parameters.every((p) => p.codec?.mode === "strict"))
);

// The plugin's apply() publishes exactly the service key the manifest names.
const provided = new Map();
createSettingsService(); // construction must not throw
const { apply } = await import("../lib/index.js");
apply({ provide: (key, value) => provided.set(key, value), logger: { info() {}, warn() {} } });
check(
  "apply() publishes the manifest's service key",
  provided.has(TYPERT.invocations[0].service),
  TYPERT.invocations[0].service
);
const service = provided.get(TYPERT.invocations[0].service);
check(
  "the service carries the frozen binding the gateway validates",
  (() => {
    const binding = service?.typertRemote;
    // The three requirements dsh-api-gateway's validateBinding/readBinding enforce.
    return (
      binding !== undefined &&
      Object.isFrozen(binding) &&
      binding.service === service &&
      binding.serviceKey === TYPERT.invocations[0].service &&
      typeof binding.namespace === "string" &&
      binding.namespace === TYPERT.invocations[0].namespace
    );
  })(),
  "typertRemote"
);

// A throwaway file shaped like a real one, including keys the page must never touch.
const dir = mkdtempSync(join(tmpdir(), "hindsight-typert-"));
const file = join(dir, "coding-agent.json");
writeFileSync(
  file,
  JSON.stringify({
    serverMode: "self-hosted",
    apiUrl: "http://100.102.61.13:8888",
    apiToken: "tok",
    bankId: "gaoxiaogang",
    autoInject: "reflect",
    unknownKey: 1,
    harnesses: { dsh: { logLevel: "debug" } },
  })
);

console.log("dispatch");
for (const invocation of TYPERT.invocations) {
  const method = service[invocation.method];
  check(`${invocation.id} resolves to a method`, typeof method === "function");
  if (typeof method !== "function") continue;

  // Dispatch by method name, with each method's own argument list: the manifest grows (describe,
  // note, apply, applyScoped), and a fixed shape assumed from a count breaks the day one appears.
  if (invocation.method === "describe") {
    const top = method.call(service, { kind: "top" }, file);
    check("describe answers every field", top.fields.length === 52, `${top.fields.length} fields`);
    check(
      "describe reports the file's values",
      top.fields.find((f) => f.key === "bankId")?.value === "gaoxiaogang"
    );
    check(
      "describe distinguishes 'unset' from 'set to the default'",
      top.fields.find((f) => f.key === "pageSearchLimit")?.inFile === false
    );
    check(
      "describe flags a harness override",
      top.fields.find((f) => f.key === "logLevel")?.shadowedByHarness === true
    );
    check(
      "describe never carries a secret value",
      top.fields.find((f) => f.key === "apiToken")?.value === null &&
        top.fields.find((f) => f.key === "apiToken")?.inFile === true
    );
    check("describe lists the bank sections the file carries", Array.isArray(top.banks));
  } else if (invocation.method === "note") {
    const result = method.call(service, "self-check: the page reports through this method");
    check("note acknowledges a diagnostic line", result?.ok === true);
  } else if (invocation.method === "applyScoped") {
    const bank = method.call(service, { kind: "bank", id: "self-check" }, { gitIngest: "none" }, file);
    check("applyScoped writes one bank section", bank.changed === true);
  } else {
    const result = method.call(service, { reflectTimeoutMs: 45000, bankId: null }, file);
    check("apply reports the change", result.changed === true, `removed: ${result.removed.join(",") || "none"}`);
  }
}

const written = JSON.parse(readFileSync(file, "utf8"));
console.log("the file after apply()");
check("the edit landed", written.reflectTimeoutMs === 45000);
check("null removed the key", written.bankId === undefined);
check(
  "the token and unknown keys survived",
  written.apiToken === "tok" && written.unknownKey === 1
);
check("a file-only section survived", written.harnesses?.dsh?.logLevel === "debug");

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n - ${failures.join("\n - ")}`);
  process.exit(1);
}
console.log("\nall checks passed");
