import { defineConfig } from "tsup";

/**
 * Browser half.
 *
 * dsh's client module system does not load an ES module: it serves a bundle that REGISTERS a
 * factory and materializes it lazily. The artifact is therefore CommonJS wrapped in
 * `window.__ModuleLoader__.load({ id, factory(require) })`, with `module`/`exports` defined by the
 * wrapper because the factory body is not run by Node. This reproduces the shape of dsh's own
 * `packages/client/tsdown.client.ts` preset (banner/footer/intro + entryFileNames `client.js`)
 * without depending on it — that preset imports dsh-repository internals and ships in no package.
 */
const PLUGIN_ID = "@Echo-Note/dsh-hindsight-settings";

/**
 * The shell's frozen module table (dsh `packages/client/web/src/platform.ts`, PLATFORM_MODULES).
 * Anything else must inline: a `require()` the table cannot answer throws at materialization.
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

export default defineConfig({
  entry: { client: "src/client/index.tsx" },
  outDir: "lib",
  format: ["cjs"],
  platform: "browser",
  target: "es2020",
  dts: false,
  // `package.json` declares `"type": "module"`, which makes tsup's default CJS extension `.cjs`.
  // The package's `exports["./client"]` points at `./lib/client.js` — and, more importantly, the
  // client module system serves the file named by that export, so the extension is part of the
  // contract rather than a preference.
  outExtension: () => ({ js: ".js" }),
  // The host half is already in lib/; a clean here would delete it.
  clean: false,
  splitting: false,
  external: PLATFORM_MODULES,
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {\nvar module = { exports: {} }; var exports = module.exports;`,
  },
  footer: { js: "return module.exports; } });" },
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
