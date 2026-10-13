import { defineConfig } from "tsup";

/** Host half: a plain Cordis plugin row, loaded by the profile from node_modules. */
export default defineConfig({
  entry: { index: "src/index.ts", "typert.host": "src/typert.host.ts" },
  outDir: "lib",
  format: ["esm"],
  platform: "node",
  target: "node18",
  dts: true,
  // NOT `clean`: the browser half lands in the same lib/, so a host-only rebuild would delete
  // `lib/client.js` — and a missing client bundle fails dsh activation loudly. The npm `build`
  // script removes lib/ once, before both passes, so the ordering is explicit.
  clean: false,
  splitting: false,
  sourcemap: true,
});
