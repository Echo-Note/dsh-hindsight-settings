/**
 * Browser half of `@Echo-Note/dsh-hindsight-settings`.
 *
 * ## Where this page lives, and why
 *
 * It registers into **`settings.section`** — a `list` / `root` slot declared by the Settings shell
 * itself (`@deepseek-ai/dsh-client-ui-settings`, whose own `ui-settings-general` page registers the
 * "general" section the same way). The page is therefore its own entry in the Settings navigation.
 *
 * This replaces an earlier attempt that registered into `plugins.detail.section` behind a subject
 * gate, which meant the settings only existed *inside another plugin's* page. A settings page that
 * cannot be found in Settings is not a settings page.
 *
 * ## How the page reaches its data
 *
 * Not through `configForms`: that service serves the namespaces of Loader entries whose Config schema
 * the shell projects, and this plugin's settings do not live in a Config schema at all — they live in
 * one shared JSON file that a third-party plugin reads. Mirroring one into the other was tried and
 * rejected by a real install.
 *
 * Instead the page mounts its own descriptors once and talks to the host service through the API
 * Gateway:
 *
 * ```ts
 * const dispose = await ctx.remote.$mount(CONTRIBUTION);
 * const service  = ctx.get('remote.hindsightSettings');
 * ```
 *
 * `$mount` creates each namespace as a child Cordis service named `remote.<namespace>`, owned by the
 * calling fiber, so the mount is disposed with this plugin. Every unary call resolves to a
 * `RemoteResult` — `{ ok: true, value }` or `{ ok: false, error }` — and does not reject because the
 * carrier dropped. Assembly faults (arity mismatch, method unmounted, contribution withdrawn) still
 * reject, so each call is guarded on both paths.
 *
 * ## Language
 *
 * Every word this page can show lives in the `dsh-hindsight-settings` namespace's dictionaries
 * ({@link DICTIONARIES}), registered as an owned effect and read through the framework's `t` seat —
 * or through `ctx.locale.bind(NS)` when a composition renders the page without a renderer, which is
 * what the smoke test does. Live switches need no remount: copy is translated at render time, and the
 * page re-renders from a small external store that follows `ctx.locale.subscribe`. The one piece of
 * copy the page does NOT own — each field's summary and each group's heading — is selected from the
 * bundled bilingual table by the active language, with the host's own string as the last resort.
 *
 * ## The page's shape
 *
 * Seven groups of settings in one column was unreadable, so the surface is now a tab bar: one tab per
 * `FIELD_GROUPS` entry plus a final banks tab. The header, the config-file path, the availability line
 * and the action bar stay mounted across tabs; only the active tab's field rows render. The banks tab
 * lists `banks.<id>` sections and opens one in a tabs-free form of its own, which reads
 * `describe({ kind: "bank", id })` and writes through `applyScoped`.
 *
 * ## Failure policy
 *
 * Nothing here may take the shell down. `ctx.remote` is read defensively, `$mount` is wrapped, the
 * service lookup is validated before use, and every branch ends in a sentence the user can act on
 * rather than an exception.
 */

import * as React from "react";
import {
  BANKS_HELP,
  CONTRIBUTION,
  DICTIONARIES,
  LOCALE_NS,
  PAGE_ID,
  PAGE_ORDER,
  SERVICE_KEY,
  SETTINGS_SLOT,
  activeLanguage,
  banksScopeText,
  buildTabs,
  describeAvailability,
  diffDraft,
  draftFromFields,
  fallbackText,
  fallbackTranslate,
  fieldSummary,
  formatDefault,
  formatFieldValue,
  isRecord,
  isSettingsView,
  pageLabel,
  parseDraft,
  pathsReadOnlyText,
  readOnlyText,
  remoteErrorText,
  scopeLabel,
  scopedEditorTitle,
  splitForScope,
  shadowText,
  summarizeApply,
  unsetText,
  valueSourceNote,
  type ActiveLanguage,
  type ConfigScope,
  type CopyKey,
  type CopyParams,
  type DraftDiff,
  type JsonValue,
  type PageTab,
  type RemoteNamespace,
  type ScopeMember,
  type ServiceState,
  type SettingsFieldView,
  type SettingsView,
  type Translate,
} from "./model";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The cordis surface, structurally typed
//
// `@deepseek-ai/cordis` and `@deepseek-ai/dsh-client-locale` are peer dependencies and are not
// installed here, so the shapes actually used are declared locally. That also keeps the bundle
// honest: it can only reach what it declares.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type Disposer = () => void;

interface SlotsLike {
  inject(name: string, register: () => Disposer): Disposer;
  register(spec: Record<string, unknown>, component: unknown): Disposer;
}

interface RemoteLike {
  $mount(contribution: unknown): Promise<unknown>;
}

/** The `locale` service as this page uses it: register, bind, and follow the active language. */
interface LocaleSnapshotLike {
  /** The active language id. */
  readonly active: string;
}

interface LocaleLike {
  /** Registers one namespace's complete dictionary; both shipped locales are required. */
  register(
    ns: string,
    dicts: {
      readonly zh: Readonly<Record<string, string>>;
      readonly en: Readonly<Record<string, string>>;
    }
  ): Disposer;
  /** A stable-identity translate function for the namespace, reading the active locale per call. */
  bind(ns: string): Translate;
  /** The current immutable snapshot. */
  getLocale(): LocaleSnapshotLike;
  /** Notified on every snapshot change; returns the unsubscribe. */
  subscribe(listener: () => void): Disposer;
}

interface ClientContextLike {
  get(name: string): unknown;
  effect?(execute: () => Disposer | void, label?: string): Disposer;
  slots?: SlotsLike;
  remote?: RemoteLike;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Plugin exports (the lazy-CJS factory's `module.exports`)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export const name = "dsh-hindsight-settings";

/**
 * The hard dependency gate.
 *
 * Every service this half reads is declared, `remote`, `locale` and `slots` included: the api-gateway
 * reference states that a plugin calling `ctx.remote.<namespace>` declares both `remote` and
 * `remote.<namespace>`, and cordis refuses a property read on any service that is not injected. Every
 * access still goes through `ctx.get(...)` with a fallback, so a composition without the gateway
 * renders the explanatory line instead of throwing (which is how this page once failed: an undeclared
 * `ctx.remote` property read), and a composition without `locale` still registers with the built-in
 * dictionaries.
 */
export const inject = ["slots", "remote", "locale"];

export function apply(ctx: ClientContextLike): void {
  const report = createReporter(ctx);
  try {
    const slots = ctx.slots;
    report(
      `apply: slots=${typeof slots} inject=${typeof slots?.inject} register=${typeof slots?.register} effect=${typeof ctx.effect} get=${typeof ctx.get} locale=${typeof readLocale(ctx)}`
    );
    if (
      slots === undefined ||
      typeof slots.inject !== "function" ||
      typeof slots.register !== "function"
    ) {
      report("apply: the slot service is missing inject/register — the page cannot appear");
      return;
    }

    // Dictionaries and the page's own language link first: the copy rendered on every later path
    // (including the always-renders fallback card below) reads through them.
    registerDictionaries(ctx, report);
    const bridge = createLocaleBridge(ctx, report);
    const copy = bridge.getSnapshot();

    // Built once per `apply`, so the component identity the renderer holds stays stable across
    // renders while still closing over this instance's mount.
    // Setup is reported rather than swallowed: `createServiceStore` builds the mount and the page
    // factory builds the component, and a throw in either used to leave no trace anywhere.
    let Page: (props: unknown) => React.ReactElement;
    try {
      Page = createPage(createServiceStore(ctx), report, bridge);
    } catch (error) {
      // Never leave the user with nothing: the page still appears, carrying the failure text.
      const text = messageOf(error);
      report(`setup: threw — ${text}`);
      Page = () =>
        React.createElement(
          "div",
          { className: "dhs-page", "data-plugin-hindsight-settings": "failed" },
          React.createElement(
            "div",
            { className: "dhs-head" },
            React.createElement("span", { className: "dhs-title" }, pageLabel(copy.t))
          ),
          React.createElement(
            "div",
            { className: "dhs-note dhs-warn" },
            copy.t("unavailable.initFailed", { message: text })
          )
        );
    }
    // The inject callback can run LATER than this call, so a throw from `register` would escape the
    // try/catch below and vanish. Catching it here — inside the callback — is what makes the failure
    // visible at all, which is how the missing registration was finally explained.
    const register = (): Disposer => {
      report("register: calling slots.register");
      try {
        const dispose = slots.register(
          {
            name: SETTINGS_SLOT,
            id: PAGE_ID,
            order: PAGE_ORDER,
            // Declared namespace: the rendered component receives the framework's typed `t` seat,
            // and the navigation label is a thunk so it is re-read on every projection — a live
            // language switch therefore reaches the nav row without re-registering.
            locale: LOCALE_NS,
            label: () => pageLabel(bridge.translate()),
          },
          Page
        );
        report("register: ok");
        return dispose;
      } catch (error) {
        const text = messageOf(error);
        report(`register: threw — ${text}`);
        // A hot reload can run this generation BEFORE the previous one is disposed, and the ledger
        // refuses a second entry with the same id+priority. Retrying once, shortly, is what makes a
        // reloaded page reappear instead of leaving an empty ledger behind.
        if (/already has an entry/.test(text)) {
          const retry = setTimeout(() => {
            try {
              slots.register(
                {
                  name: SETTINGS_SLOT,
                  id: PAGE_ID,
                  order: PAGE_ORDER,
                  locale: LOCALE_NS,
                  label: () => pageLabel(bridge.translate()),
                },
                Page
              );
              report("register: ok on retry");
            } catch (again) {
              report(`register: retry threw — ${messageOf(again)}`);
            }
          }, 250);
          return () => clearTimeout(retry);
        }
        throw error;
      }
    };

    if (typeof ctx.effect === "function") {
      ctx.effect(() => slots.inject(SETTINGS_SLOT, register), "dsh-hindsight-settings: page");
    } else {
      slots.inject(SETTINGS_SLOT, register);
    }
  } catch (error) {
    // A companion page must never be the reason the shell fails to mount — but it must not fail
    // silently either, so the cause goes to the host trail as well as the console.
    report(`apply: threw — ${messageOf(error)}`);
    console.error(
      "[dsh-hindsight-settings] client half failed to register (host unaffected):",
      error
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Read `ctx.locale`, accepting only a service that carries the three methods this page calls. */
function readLocale(ctx: ClientContextLike): LocaleLike | undefined {
  // `ctx.get`, never `ctx.locale`. Cordis throws `cannot get property "locale" without inject` for a
  // property read on a service this plugin did not inject, and the optional lookup is the documented
  // form for a service whose absence the caller handles (`ctx.get("X")` + an undefined check).
  let candidate: unknown;
  try {
    candidate = ctx.get("locale");
  } catch {
    return undefined;
  }
  return isRecord(candidate) &&
    typeof candidate.register === "function" &&
    typeof candidate.bind === "function" &&
    typeof candidate.getLocale === "function" &&
    typeof candidate.subscribe === "function"
    ? (candidate as unknown as LocaleLike)
    : undefined;
}

/**
 * The page's link to the active language.
 *
 * `translate()` returns the namespace-bound translate function when a locale service is present
 * (stable identity, reads the active locale at call time) and the built-in English-bound one
 * otherwise, so the page can always render. `getSnapshot()`/`subscribe()` follow the service's
 * snapshot revision, which is why a language switch re-renders the mounted page with no remount and
 * no re-registration: every string is translated during render.
 */
interface LocaleBridge {
  translate(): Translate;
  getSnapshot(): { readonly t: Translate; readonly lang: ActiveLanguage };
  subscribe(listener: () => void): Disposer;
}

function createLocaleBridge(
  ctx: ClientContextLike,
  report: (message: string) => void
): LocaleBridge {
  const service = readLocale(ctx);
  const bound = service === undefined ? undefined : service.bind(LOCALE_NS);

  const translate = (): Translate => bound ?? fallbackTranslate;

  const snapshot = (): { readonly t: Translate; readonly lang: ActiveLanguage } => ({
    t: translate(),
    lang: activeLanguage(service?.getLocale().active),
  });

  return {
    translate,
    getSnapshot: snapshot,
    subscribe(listener: Disposer): Disposer {
      if (service === undefined) return () => undefined;
      try {
        let last = snapshot().lang;
        report(`locale: active=${service.getLocale().active}`);
        return service.subscribe(() => {
          const next = snapshot().lang;
          // One line per real language change: a dictionary registration also bumps the revision, and
          // a line per registration would flood the trail at boot.
          if (next !== last) {
            last = next;
            report(`locale: switched to ${next}`);
          }
          listener();
        });
      } catch (error) {
        report(`locale: subscribe threw — ${messageOf(error)}`);
        return () => undefined;
      }
    },
  };
}

/** Register this page's dictionaries inside an owned effect; both shipped locales, every key. */
function registerDictionaries(ctx: ClientContextLike, report: (message: string) => void): void {
  const service = readLocale(ctx);
  if (service === undefined) {
    report("locale: no locale service — using the built-in dictionaries (English)");
    return;
  }
  const run = (): Disposer => {
    try {
      return service.register(LOCALE_NS, DICTIONARIES);
    } catch (error) {
      // A composition that already owns this namespace, or a service that refuses the pair, must not
      // take the page down: the built-in dictionaries still render every string.
      report(`locale: register threw — ${messageOf(error)}`);
      return () => undefined;
    }
  };
  if (typeof ctx.effect === "function") {
    try {
      ctx.effect(run, "hindsight-settings: dictionaries");
      return;
    } catch (error) {
      report(`locale: effect threw — ${messageOf(error)}`);
    }
  }
  run();
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The Remote mount
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface ServiceStore {
  getSnapshot(): ServiceState;
  subscribe(listener: () => void): Disposer;
}

/**
 * Fire-and-forget diagnostics from the browser half to the host's status trail.
 *
 * This exists because the page's failures are otherwise invisible: `apply` catches to
 * `console.error`, which nobody can read inside a packaged desktop app, and the live slot ledger
 * only ever shows the contributions that SUCCEEDED. A reporter that could itself throw would be
 * worse than none, so every step is swallowed — the worst case is a missing log line.
 *
 * It shares ONE mount with the page through a property on the context, so a diagnostic never
 * creates a second contribution.
 */
type MountCarrier = ClientContextLike & { __dshHindsightMount?: Promise<unknown> };

function messageOf(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

function mountOnce(ctx: ClientContextLike, remote: RemoteLike): Promise<unknown> {
  const carrier = ctx as MountCarrier;
  carrier.__dshHindsightMount ??= remote.$mount(CONTRIBUTION);
  return carrier.__dshHindsightMount;
}

function createReporter(ctx: ClientContextLike): (message: string) => void {
  return (message: string): void => {
    void (async () => {
      try {
        const remote = readRemote(ctx);
        if (remote === undefined) return;
        await mountOnce(ctx, remote);
        const service = ctx.get(SERVICE_KEY) as { note?: (line: string) => unknown } | undefined;
        await service?.note?.(message);
      } catch {
        // Diagnostics are best-effort by construction; see the doc comment above.
      }
    })();
  };
}

/** Read `ctx.remote`, accepting either the property or the service lookup, and never throwing. */
function readRemote(ctx: ClientContextLike): RemoteLike | undefined {
  // `ctx.get`, never `ctx.remote`. Cordis throws `cannot get property "remote" without inject` for a
  // property read on a service this plugin did not inject, and the optional lookup is the documented
  // form for a service whose absence the caller handles (`ctx.get("X")` + an undefined check).
  let candidate: unknown;
  try {
    candidate = ctx.get("remote");
  } catch {
    return undefined;
  }
  return isRecord(candidate) && typeof candidate.$mount === "function"
    ? (candidate as unknown as RemoteLike)
    : undefined;
}

/** Read the mounted namespace service and confirm it carries the two methods the page calls. */
function readService(ctx: ClientContextLike): RemoteNamespace | undefined {
  let candidate: unknown;
  try {
    candidate = ctx.get(SERVICE_KEY);
  } catch {
    return undefined;
  }
  return isRecord(candidate) &&
    typeof candidate.describe === "function" &&
    typeof candidate.apply === "function"
    ? (candidate as unknown as RemoteNamespace)
    : undefined;
}

/**
 * Mount the contribution and publish the resulting state.
 *
 * `$mount` owns the descriptors in the CALLER's fiber, so the returned disposer is not needed for
 * normal teardown — the mount disappears with this plugin. It is deliberately not stored: keeping a
 * reference would invite a second, redundant unmount.
 */
async function mount(ctx: ClientContextLike, remote: RemoteLike): Promise<ServiceState> {
  await mountOnce(ctx, remote);
  const service = readService(ctx);
  if (service === undefined) {
    return {
      kind: "unavailable",
      reasonKey: "unavailable.noNamespace",
      reasonParams: { service: SERVICE_KEY },
    };
  }
  return { kind: "ready", service };
}

/**
 * The page's Remote state, as a subscribable snapshot.
 *
 * The missing-`remote` case is decided **synchronously**, before any promise exists, so the very
 * first render can already say why nothing is editable. Every other outcome is published when the
 * mount settles. Each failure is stored as a copy REQUEST (key + params) rather than a finished
 * sentence, so the line is rendered in the active language at render time — a switch therefore
 * re-words an already-shown failure instead of leaving it in the old language.
 */
function createServiceStore(ctx: ClientContextLike): ServiceStore {
  const listeners = new Set<() => void>();
  let state: ServiceState;

  const publish = (next: ServiceState): void => {
    state = next;
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        console.error("[dsh-hindsight-settings] service listener failed", error);
      }
    }
  };

  const remote = readRemote(ctx);
  if (remote === undefined) {
    state = { kind: "unavailable", reasonKey: "unavailable.noRemote" };
  } else {
    state = { kind: "loading" };
    void mount(ctx, remote).then(publish, (error: unknown) => {
      publish({
        kind: "unavailable",
        reasonKey: "unavailable.mountFailed",
        reasonParams: { message: remoteErrorText(error) },
      });
    });
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: Disposer): Disposer {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Styles
//
// Injected as a real `<style>` element: there is no `styles.insert()` builtin to call.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "dsh-hindsight-settings-styles";

const STYLES = [
  // The trailing padding is clearance for the sticky action bar below, so the last field row can
  // always be scrolled clear of it.
  ".dhs-page{display:flex;flex-direction:column;gap:12px;font-size:13px;color:var(--dsw-alias-label-primary,inherit);padding-bottom:56px}",
  ".dhs-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}",
  ".dhs-title{font-size:15px;font-weight:600}",
  ".dhs-sub{font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}",
  ".dhs-note{border:1px solid var(--dsw-alias-border-l2,currentColor);background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:8px 10px;font-size:12px;line-height:1.7}",
  ".dhs-note code{font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);color:var(--dsw-alias-label-primary,inherit);word-break:break-all}",
  ".dhs-warn{border-color:var(--dsw-alias-state-warn-primary,#b26a00);color:var(--dsw-alias-state-warn-primary,#b26a00)}",
  ".dhs-err{border-color:var(--dsw-alias-state-error-primary,#c0392b);color:var(--dsw-alias-state-error-primary,#c0392b)}",
  ".dhs-ok{color:var(--dsw-alias-state-success-primary,#1e7f4f)}",
  ".dhs-tabs{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1,currentColor);padding-bottom:6px}",
  ".dhs-tab{font:inherit;font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer}",
  ".dhs-tab:hover{background:var(--dsw-alias-bg-layer-2,transparent)}",
  ".dhs-tab-active{background:var(--dsw-alias-bg-layer-2,transparent);border-color:var(--dsw-alias-border-l2,currentColor);color:var(--dsw-alias-label-primary,inherit);font-weight:600}",
  ".dhs-tabpanel{display:flex;flex-direction:column;gap:8px}",
  ".dhs-group{border-top:1px solid var(--dsw-alias-border-l1,currentColor);padding-top:10px}",
  ".dhs-group:first-of-type{border-top:0;padding-top:0}",
  ".dhs-group-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;margin-bottom:8px}",
  ".dhs-group-title{font-weight:600}",
  ".dhs-field{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;padding:8px 0;border-top:1px dashed var(--dsw-alias-border-l2,currentColor)}",
  ".dhs-field:first-of-type{border-top:0}",
  ".dhs-field-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px}",
  ".dhs-key{font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12px;font-weight:600;word-break:break-all}",
  ".dhs-chip{border:1px solid var(--dsw-alias-border-l2,currentColor);background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;padding:0 7px;font-size:11px;line-height:1.8;white-space:nowrap}",
  ".dhs-chip-ro{color:var(--dsw-alias-state-warn-primary,#b26a00)}",
  ".dhs-chip-set{color:var(--dsw-alias-state-success-primary,#1e7f4f)}",
  ".dhs-summary{color:var(--dsw-alias-label-secondary,inherit);font-size:12px;line-height:1.6}",
  ".dhs-meta{color:var(--dsw-alias-label-secondary,inherit);font-size:11px;line-height:1.6;word-break:break-all}",
  ".dhs-input,.dhs-select,.dhs-textarea{box-sizing:border-box;width:100%;padding:5px 8px;font:inherit;font-size:12px;color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-bg-layer-1,transparent);border:1px solid var(--dsw-alias-border-l2,currentColor);border-radius:6px;outline:none}",
  ".dhs-input:focus,.dhs-select:focus,.dhs-textarea:focus{border-color:var(--dsw-alias-brand-primary,#3b6fd4)}",
  ".dhs-input:disabled,.dhs-select:disabled,.dhs-textarea:disabled{opacity:.55;cursor:not-allowed}",
  ".dhs-textarea{min-height:56px;resize:vertical;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace)}",
  ".dhs-check{display:flex;align-items:center;gap:6px}",
  ".dhs-readonly{margin:0;padding:6px 8px;background:var(--dsw-alias-bg-layer-2,transparent);border:1px solid var(--dsw-alias-border-l1,currentColor);border-radius:6px;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12px;white-space:pre-wrap;word-break:break-word;max-height:160px;overflow:auto;color:var(--dsw-alias-label-secondary,inherit)}",
  // An OPAQUE bar: this is sticky, so the row it covers must not show through it. A theme token
  // with a solid fallback, because the plain `transparent` fallback is what let text bleed through.
  ".dhs-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border-top:1px solid var(--dsw-alias-border-l1,currentColor);padding:10px 0 6px;position:sticky;bottom:0;background:var(--dsw-alias-bg-base,#17171a)}",
  ".dhs-btn{font:inherit;font-size:12px;padding:5px 14px;border-radius:6px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,currentColor);background:transparent;color:var(--dsw-alias-label-primary,inherit)}",
  ".dhs-btn:disabled{opacity:.45;cursor:not-allowed}",
  ".dhs-btn-primary{background:var(--dsw-alias-brand-primary,#3b6fd4);color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}",
  ".dhs-btn-mini{padding:2px 8px;font-size:11px}",
  ".dhs-hint{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit)}",
  ".dhs-bank{border:1px solid var(--dsw-alias-border-l2,currentColor);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:4px}",
  ".dhs-bank-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}",
  ".dhs-scope{border:1px dashed var(--dsw-alias-border-l2,currentColor);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px}",
  ".dhs-scope-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}",
  ".dhs-subhead{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}",
  ".dhs-subhead-title{font-weight:600}",
  ".dhs-add{display:flex;flex-wrap:wrap;align-items:center;gap:6px}",
  ".dhs-add-input{flex:1 1 220px;min-width:160px}",
  ".dhs-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
  ".dhs-help{margin:6px 0 10px}",
  ".dhs-help-toggle{cursor:pointer;font:inherit;padding:4px 10px;border-radius:6px;border:1px solid var(--dsh-border,rgba(127,127,127,.35));background:transparent;color:inherit}",
  ".dhs-help-body{margin-top:8px;padding:10px 12px;border-left:3px solid var(--dsh-border,rgba(127,127,127,.35));display:flex;flex-direction:column;gap:10px}",
  ".dhs-help-title{font-weight:600}",
  ".dhs-help-line{opacity:.85;line-height:1.55;font-size:.92em}",
  ".dhs-help-section{display:flex;flex-direction:column;gap:2px}",
].join("");

/** Inject the stylesheet once; the element id is the guard. */
function ensureStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The page
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Subscribe to the service store, falling back to one snapshot when hooks are unavailable. */
function useServiceState(store: ServiceStore): ServiceState {
  const [state, setState] = React.useState<ServiceState>(() => store.getSnapshot());
  React.useEffect(() => {
    setState(store.getSnapshot());
    return store.subscribe(() => setState(store.getSnapshot()));
  }, [store]);
  return state;
}

/**
 * Subscribe to the active language, so a live switch re-renders this page.
 *
 * The bridge's snapshot is a fresh object each call, so the hook re-reads it on every notification
 * instead of comparing identities. With no locale service (the smoke test) the subscription is a
 * no-op and the page renders once, in English, from the built-in dictionaries.
 */
function useLocaleCopy(bridge: LocaleBridge): {
  readonly t: Translate;
  readonly lang: ActiveLanguage;
} {
  const [snapshot, setSnapshot] = React.useState(() => bridge.getSnapshot());
  React.useEffect(() => {
    setSnapshot(bridge.getSnapshot());
    return bridge.subscribe(() => setSnapshot(bridge.getSnapshot()));
  }, [bridge]);
  // One stable object per language: `t` already keeps a stable identity per namespace, so memoizing
  // here keeps the tab list (and every other memo that takes the copy) from recomputing per render.
  return React.useMemo(() => ({ t: snapshot.t, lang: snapshot.lang }), [snapshot.t, snapshot.lang]);
}

type NoticeKind = "ok" | "err" | "info";

interface Notice {
  readonly kind: NoticeKind;
  readonly text: string;
}

/** The bank-resolution help, from the upstream README's Bank resolution section. */
function BanksHelp(props: { readonly t: Translate }): React.ReactElement {
  const { t } = props;
  const [open, setOpen] = React.useState(false);
  return React.createElement(
    "div",
    { className: "dhs-help" },
    React.createElement(
      "button",
      {
        type: "button",
        className: "dhs-help-toggle",
        onClick: () => setOpen((previous) => !previous),
      },
      open ? t("help.toggleOpen") : t("help.toggleClosed")
    ),
    open
      ? React.createElement(
          "div",
          { className: "dhs-help-body" },
          BANKS_HELP.map((section) =>
            React.createElement(
              "div",
              { className: "dhs-help-section", key: section.titleKey },
              React.createElement("div", { className: "dhs-help-title" }, t(section.titleKey)),
              section.lineKeys.map((lineKey) =>
                React.createElement("div", { className: "dhs-help-line", key: lineKey }, t(lineKey))
              )
            )
          )
        )
      : null
  );
}

/**
 * Bind the page to one store.
 *
 * The gate is a separate component so the hooks below it are unconditional: `<HindsightSettingsPage>`
 * runs a single hook and then either explains itself or mounts `<SettingsForm>`.
 */
function createPage(
  store: ServiceStore,
  report: (message: string) => void,
  bridge: LocaleBridge
): (props: unknown) => React.ReactElement {
  return function HindsightSettingsPage(props: unknown): React.ReactElement {
    const seat =
      isRecord(props) && typeof props.t === "function" ? (props.t as Translate) : undefined;
    const followed = useLocaleCopy(bridge);
    // The framework seat (declared namespace) when the shell rendered this entry; the namespace-bound
    // function otherwise, which is what a composition without a renderer — and this plugin's own
    // smoke test — reaches for.
    const copy = seat === undefined ? followed : { t: seat, lang: followed.lang };
    const t = copy.t;

    ensureStyles();
    const entered = React.useRef(false);
    if (!entered.current) {
      // Once per mount: a line per render would flood the trail the moment a user clicks a tab.
      entered.current = true;
      report(`render: entered locale=${copy.lang}`);
    }
    const state = useServiceState(store);

    if (state.kind !== "ready") {
      return React.createElement(
        "div",
        { className: "dhs-page", "data-plugin-hindsight-settings": "unavailable" },
        React.createElement(
          "div",
          { className: "dhs-head" },
          React.createElement("span", { className: "dhs-title" }, pageLabel(t))
        ),
        React.createElement(
          "div",
          { className: state.kind === "loading" ? "dhs-note" : "dhs-note dhs-warn" },
          describeAvailability({ state, view: undefined, loadError: undefined, copy })
        )
      );
    }

    return React.createElement(SettingsForm, { service: state.service, report, copy });
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// One scope's form state (top level, or one banks.<id> section)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** How a field's source is worded: the top level says "file", a bank says "this bank". */
type ScopeKind = "top" | "bank";

/**
 * The top scope, spelled out.
 *
 * `describe`'s `scope` is optional, but the page always sends one: the SAME descriptor serves the
 * top read and a bank read, and an explicit `{ kind: "top" }` is the one argument shape both calls
 * share — no reliance on how a missing optional argument is marshalled.
 */
const TOP_SCOPE: ConfigScope = { kind: "top" };

/** A stable, readable name for a scope, used in the diagnostic lines. */
function scopeKey(scope: ConfigScope | undefined): string {
  if (scope === undefined) return "top";
  if (scope.kind === "bank") return `bank:${scope.id}`;
  if (scope.kind === "path") return `path:${scope.dir}`;
  return "top";
}

/**
 * Everything the action bar and the field rows need for ONE scope.
 *
 * The top form and a bank form are the same machine with a different `scope`: `undefined` means the
 * top level (`describe()` / `apply()`), a scope means that section (`describe(scope)` /
 * `applyScoped(scope, patch)`). Keeping it in one hook is what makes the bank form inherit the whole
 * diff/notice/clear contract instead of re-deriving it.
 */
interface ScopeForm {
  readonly view: SettingsView | undefined;
  readonly draft: Readonly<Record<string, string>>;
  readonly diff: DraftDiff;
  readonly notice: Notice | null;
  readonly busy: "save" | "reload" | undefined;
  /** The line explaining why nothing can be saved, or `undefined` when saving is allowed. */
  readonly availability: string | undefined;
  readonly dirty: boolean;
  readonly invalid: boolean;
  readonly editable: boolean;
  setField(key: string, next: string): void;
  clearField(key: string): void;
  save(): void;
  discard(): void;
  reload(): void;
}

function useScopeForm(
  service: RemoteNamespace,
  scope: ConfigScope | undefined,
  report: (message: string) => void,
  copy: { readonly t: Translate; readonly lang: ActiveLanguage },
  onSaved: (() => void) | undefined
): ScopeForm {
  const [view, setView] = React.useState<SettingsView | undefined>(undefined);
  /**
   * A failed read, kept as a copy REQUEST (key + params) rather than a finished sentence: this line
   * stays on screen while the user changes the language, so it must be rendered from the dictionary
   * in force at render time. A page re-render is what follows a switch, so it re-words itself.
   */
  const [loadError, setLoadError] = React.useState<
    { readonly key: CopyKey; readonly params?: CopyParams } | undefined
  >(undefined);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<"save" | "reload" | undefined>(undefined);
  /** Fields the user explicitly cleared; a redacted secret has no loaded value to differ from. */
  const [cleared, setCleared] = React.useState<ReadonlySet<string>>(() => new Set());
  /** A transient confirmation: rendered in the language active when the action was taken. */
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const label = scopeKey(scope);
  const { t, lang } = copy;

  const reload = React.useCallback(async (): Promise<void> => {
    setBusy("reload");
    try {
      const result = await service.describe(scope ?? TOP_SCOPE);
      if (result.ok) {
        if (!isSettingsView(result.value)) {
          setLoadError({ key: "errors.badFormat" });
          return;
        }
        setView(result.value);
        const nextDraft = draftFromFields(result.value.fields);
        setDraft(nextDraft);
        // What the page ACTUALLY received, with sample values: the difference between "the host sent
        // nothing" and "the page did not render it" is not visible from either side alone.
        report(
          `describe(${label}): ${result.value.fields.length} fields, ${result.value.fields.filter((f) => f.inFile).length} with values, ${Object.values(nextDraft).filter((v) => v !== "").length} non-empty drafts, sample=${JSON.stringify(
            result.value.fields
              .filter((f) => f.inFile)
              .slice(0, 4)
              .map((f) => [f.key, f.value])
          )}`
        );
        setLoadError(undefined);
      } else {
        setLoadError({
          key: "errors.readFailed",
          params: { message: remoteErrorText(result.error) },
        });
      }
    } catch (error) {
      // An assembly fault still rejects, unlike a carrier failure.
      setLoadError({
        key: "errors.readFailed",
        params: { message: remoteErrorText(error) },
      });
    } finally {
      setBusy(undefined);
    }
  }, [service, scope, label, report, t]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const availability = describeAvailability({
    state: { kind: "ready", service },
    view,
    loadError: loadError === undefined ? undefined : t(loadError.key, loadError.params),
    copy,
  });

  const diff = React.useMemo(
    () =>
      view === undefined
        ? { patch: {}, errors: [], changed: [] }
        : diffDraft(view.fields, draft, t, cleared),
    [view, draft, cleared, t]
  );
  const dirty = diff.changed.length > 0;
  const invalid = diff.errors.length > 0;

  const setField = React.useCallback((key: string, next: string): void => {
    setDraft((current) => ({ ...current, [key]: next }));
    setCleared((current) => {
      if (!current.has(key)) return current;
      const nextSet = new Set(current);
      nextSet.delete(key);
      return nextSet;
    });
  }, []);

  const clearField = React.useCallback((key: string): void => {
    // Clearing is an explicit act, not just an empty cell: a redacted secret carries no value to
    // differ from, so the intent is recorded here and the diff turns it into `null` (which removes
    // the key, so the setting falls back to the environment variable, then to the plugin default).
    setDraft((current) => ({ ...current, [key]: "" }));
    setCleared((current) => new Set(current).add(key));
  }, []);

  const save = React.useCallback((): void => {
    if (view === undefined) return;
    if (diff.errors.length > 0) {
      setNotice({
        kind: "err",
        text: t("errors.invalidFields", {
          count: diff.errors.length,
          messages: diff.errors.map((entry) => entry.message).join(" "),
        }),
      });
      return;
    }
    if (diff.changed.length === 0) {
      setNotice({ kind: "info", text: t("notices.nothingToSave") });
      return;
    }
    setBusy("save");
    setNotice(null);
    void (async () => {
      try {
        const patch = diff.patch as Record<string, JsonValue>;
        const result =
          scope === undefined
            ? await service.apply(patch)
            : await service.applyScoped(scope, patch);
        if (result.ok) {
          // The host's own answer decides the wording; the page never re-derives what "should" have
          // happened from the patch it sent.
          setNotice({ kind: "ok", text: summarizeApply(patch, result.value, t) });
          if (onSaved !== undefined) onSaved();
        } else {
          setNotice({
            kind: "err",
            text: t("errors.saveFailed", { message: remoteErrorText(result.error) }),
          });
        }
      } catch (error) {
        setNotice({
          kind: "err",
          text: t("errors.saveFailed", { message: remoteErrorText(error) }),
        });
      } finally {
        setBusy(undefined);
        await reload();
      }
    })();
  }, [view, diff, service, scope, reload, onSaved, t]);

  const discard = React.useCallback((): void => {
    if (view !== undefined) setDraft(draftFromFields(view.fields));
    setCleared(new Set());
    setNotice({ kind: "info", text: t("notices.discarded") });
  }, [view, t]);

  const reloadNow = React.useCallback((): void => {
    void reload();
  }, [reload]);

  return {
    view,
    draft,
    diff,
    notice,
    busy,
    availability,
    dirty,
    invalid,
    editable: availability === undefined,
    setField,
    clearField,
    save,
    discard,
    reload: reloadNow,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The top-level form: header + tabs + the always-visible action bar
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface Copy {
  readonly t: Translate;
  readonly lang: ActiveLanguage;
}

interface SettingsFormProps {
  readonly service: RemoteNamespace;
  readonly report: (message: string) => void;
  readonly copy: Copy;
}

function SettingsForm(props: SettingsFormProps): React.ReactElement {
  const { service, report, copy } = props;
  const { t, lang } = copy;
  const form = useScopeForm(service, undefined, report, copy, undefined);
  // Empty means "no explicit choice yet": the fallback below resolves it to the FIRST group tab.
  const [activeTab, setActiveTab] = React.useState<string>("");

  const tabs = React.useMemo(() => buildTabs(form.view?.fields ?? [], copy), [form.view, copy]);
  // Default to the first group tab; an unknown active id (a view that lost a group) falls back too.
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const groupCount = tabs.filter((tab) => tab.kind === "group").length;
  const disabled = !form.editable || form.busy !== undefined;

  return React.createElement(
    "div",
    { className: "dhs-page", "data-plugin-hindsight-settings": form.view?.path ?? "" },
    React.createElement(
      "div",
      { className: "dhs-head" },
      React.createElement("span", { className: "dhs-title" }, pageLabel(t)),
      React.createElement(
        "span",
        { className: "dhs-sub" },
        form.view === undefined
          ? t("loading.text")
          : t("counts.fieldsAndGroups", { count: form.view.fields.length, groups: groupCount })
      )
    ),
    // The path is whatever the host resolved, so this line is correct on every OS.
    React.createElement(
      "div",
      { className: "dhs-note" },
      t("page.fileIntro"),
      React.createElement("code", null, form.view?.path ?? t("loading.text")),
      React.createElement("br", null),
      t("page.blankHint")
    ),
    form.availability === undefined
      ? null
      : React.createElement("div", { className: "dhs-note dhs-warn" }, form.availability),
    React.createElement(
      "div",
      { className: "dhs-tabs", role: "tablist" },
      ...tabs.map((tab) =>
        React.createElement(
          "button",
          {
            key: tab.id,
            type: "button",
            role: "tab",
            "aria-selected": tab.id === active?.id,
            className: tab.id === active?.id ? "dhs-tab dhs-tab-active" : "dhs-tab",
            onClick: () => setActiveTab(tab.id),
          },
          tab.title
        )
      )
    ),
    React.createElement(
      "div",
      { className: "dhs-tabpanel", role: "tabpanel" },
      active === undefined
        ? null
        : active.kind === "banks"
          ? React.createElement(BanksPanel, {
              service,
              report,
              copy,
              members: form.view?.banks ?? [],
              paths: form.view?.paths ?? [],
              onChanged: form.reload,
            })
          : renderGroup(active, form, disabled, copy)
    ),
    React.createElement(ActionBar, {
      form,
      copy,
      saveLabel: t("actions.save"),
    })
  );
}

/** One group tab's body: the heading, then that group's field rows only. */
function renderGroup(
  tab: PageTab,
  form: ScopeForm,
  disabled: boolean,
  copy: Copy
): React.ReactElement {
  const { t } = copy;
  return React.createElement(
    "div",
    { className: "dhs-group" },
    React.createElement(
      "div",
      { className: "dhs-group-head" },
      React.createElement("span", { className: "dhs-group-title" }, tab.title),
      React.createElement("span", { className: "dhs-sub" }, tab.summary)
    ),
    tab.fields.length === 0
      ? React.createElement("div", { className: "dhs-meta" }, t("group.empty"))
      : React.createElement(FieldRows, {
          fields: tab.fields,
          form,
          copy,
          scopeKind: "top",
          disabled,
        })
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The banks tab
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface BanksPanelProps {
  readonly service: RemoteNamespace;
  readonly report: (message: string) => void;
  readonly copy: Copy;
  readonly members: readonly ScopeMember[];
  readonly paths: readonly ScopeMember[];
  readonly onChanged: () => void;
}

/**
 * The banks browser.
 *
 * The list itself comes from the top read (`view.banks`), so it is always the file's real content;
 * a newly typed id is not in it yet and is labelled as a new section until it is saved.
 */
function BanksPanel(props: BanksPanelProps): React.ReactElement {
  const { service, report, copy, members, paths, onChanged } = props;
  const { t } = copy;
  const [openId, setOpenId] = React.useState<string | undefined>(undefined);
  const [newId, setNewId] = React.useState("");
  const [addError, setAddError] = React.useState<
    { readonly key: CopyKey; readonly params?: CopyParams } | undefined
  >(undefined);

  const open = members.find((member) => member.id === openId);

  const onAdd = (): void => {
    const candidate = newId.trim();
    if (candidate === "") {
      setAddError({ key: "banks.addEmpty" });
      return;
    }
    if (members.some((member) => member.id === candidate)) {
      setAddError({ key: "banks.addExists", params: { id: candidate } });
      return;
    }
    setAddError(undefined);
    setNewId("");
    setOpenId(candidate);
  };

  return React.createElement(
    "div",
    { className: "dhs-scope" },
    React.createElement("div", { className: "dhs-note" }, banksScopeText(t)),
    React.createElement(BanksHelp, { t }),
    React.createElement(
      "div",
      { className: "dhs-subhead" },
      React.createElement("span", { className: "dhs-subhead-title" }, t("banks.title")),
      React.createElement(
        "span",
        { className: "dhs-chip" },
        t("banks.count", { count: members.length })
      )
    ),
    members.length === 0
      ? React.createElement("div", { className: "dhs-meta" }, t("banks.empty"))
      : React.createElement(
          React.Fragment,
          null,
          ...members.map((member) =>
            React.createElement(
              "div",
              { className: "dhs-bank", key: member.id },
              React.createElement(
                "div",
                { className: "dhs-bank-head" },
                React.createElement("code", { className: "dhs-key" }, `banks.${member.id}`),
                React.createElement(
                  "span",
                  { className: "dhs-chip" },
                  t("banks.keysCount", { count: member.keys.length })
                ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "dhs-btn dhs-btn-mini",
                    onClick: () => setOpenId(openId === member.id ? undefined : member.id),
                  },
                  openId === member.id ? t("banks.close") : t("banks.open")
                )
              ),
              member.keys.length === 0
                ? null
                : React.createElement(
                    "div",
                    { className: "dhs-meta" },
                    t("banks.keysSet", { keys: member.keys.join(t("banks.keySeparator")) })
                  )
            )
          )
        ),
    React.createElement(
      "div",
      { className: "dhs-add" },
      React.createElement("input", {
        className: "dhs-input dhs-add-input",
        type: "text",
        value: newId,
        spellCheck: false,
        placeholder: t("banks.newPlaceholder"),
        "aria-label": t("banks.newAria"),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          setNewId(event.target.value);
          setAddError(undefined);
        },
      }),
      React.createElement(
        "button",
        { type: "button", className: "dhs-btn dhs-btn-mini", onClick: onAdd },
        t("banks.add")
      )
    ),
    addError === undefined
      ? null
      : React.createElement(
          "div",
          { className: "dhs-meta dhs-err" },
          t(addError.key, addError.params)
        ),
    openId === undefined
      ? null
      : React.createElement(
          "div",
          { className: "dhs-scope", "data-bank": openId },
          React.createElement(
            "div",
            { className: "dhs-subhead" },
            React.createElement(
              "span",
              { className: "dhs-subhead-title" },
              t("banks.editTitle", { id: openId })
            ),
            open === undefined
              ? React.createElement("span", { className: "dhs-chip" }, t("banks.newSection"))
              : React.createElement(
                  "span",
                  { className: "dhs-chip" },
                  t("banks.keysCount", { count: open.keys.length })
                ),
            React.createElement(
              "button",
              {
                type: "button",
                className: "dhs-btn dhs-btn-mini",
                onClick: () => setOpenId(undefined),
              },
              t("banks.closeEditor")
            )
          ),
          open === undefined
            ? React.createElement("div", { className: "dhs-meta" }, t("banks.newSectionNote"))
            : null,
          React.createElement(ScopedEditor, {
            key: openId,
            service,
            report,
            copy,
            bankId: openId,
            onSaved: onChanged,
          })
        ),
    paths.length === 0
      ? null
      : React.createElement(
          "div",
          { className: "dhs-group" },
          React.createElement(
            "div",
            { className: "dhs-subhead" },
            React.createElement("span", { className: "dhs-subhead-title" }, t("banks.pathsTitle")),
            React.createElement(
              "span",
              { className: "dhs-chip dhs-chip-ro" },
              t("banks.pathsReadOnlyChip")
            )
          ),
          React.createElement("div", { className: "dhs-meta" }, pathsReadOnlyText(t)),
          ...paths.map((member) =>
            React.createElement(
              "div",
              { className: "dhs-meta", key: member.id },
              React.createElement("code", { className: "dhs-key" }, `paths.${member.id}`),
              member.keys.length === 0
                ? t("banks.pathKeysSuffix", { count: member.keys.length })
                : t("banks.pathKeysList", {
                    count: member.keys.length,
                    keys: member.keys.join(t("banks.keySeparator")),
                  })
            )
          )
        )
  );
}

interface ScopedEditorProps {
  readonly service: RemoteNamespace;
  readonly report: (message: string) => void;
  readonly copy: Copy;
  readonly bankId: string;
  readonly onSaved?: () => void;
}

/**
 * One `banks.<id>` section, rendered with the same field rows as the top level but no tabs.
 *
 * Saving goes through `applyScoped`, which merges into that section only; removing a key there falls
 * back to the top level, which is what the explanation above the form says.
 */
function ScopedEditor(props: ScopedEditorProps): React.ReactElement {
  const { service, report, copy, bankId, onSaved } = props;
  const { t } = copy;
  const scope = React.useMemo<ConfigScope>(() => ({ kind: "bank", id: bankId }), [bankId]);
  const form = useScopeForm(service, scope, report, copy, onSaved);
  const allFields = form.view?.fields ?? [];
  const { offered, ignored } = splitForScope(allFields, scope);
  const fields = offered;
  const disabled = !form.editable || form.busy !== undefined;

  return React.createElement(
    "div",
    { className: "dhs-scope", "data-scope": `bank:${bankId}` },
    React.createElement(
      "div",
      { className: "dhs-scope-head" },
      React.createElement("span", { className: "dhs-subhead-title" }, scopedEditorTitle(scope, t)),
      React.createElement(
        "span",
        { className: "dhs-sub" },
        form.view === undefined
          ? t("loading.text")
          : t("editor.countAndPath", { count: fields.length, path: form.view.path })
      )
    ),
    React.createElement("div", { className: "dhs-note" }, banksScopeText(t)),
    ignored.length === 0
      ? null
      : React.createElement(
          "div",
          { className: "dhs-note dhs-warn" },
          t("editor.ignoredHere", { fields: ignored.join(t("banks.keySeparator")) })
        ),
    form.availability === undefined
      ? null
      : React.createElement("div", { className: "dhs-note dhs-warn" }, form.availability),
    React.createElement(FieldRows, { fields, form, copy, scopeKind: "bank", disabled }),
    React.createElement(ActionBar, {
      form,
      copy,
      saveLabel: t("actions.saveTo", { id: bankId }),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Shared pieces
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface FieldRowsProps {
  readonly fields: readonly SettingsFieldView[];
  readonly form: ScopeForm;
  readonly copy: Copy;
  readonly scopeKind: ScopeKind;
  readonly disabled: boolean;
}

function FieldRows(props: FieldRowsProps): React.ReactElement {
  const { fields, form, copy, scopeKind, disabled } = props;
  return React.createElement(
    React.Fragment,
    null,
    ...fields.map((field) =>
      React.createElement(FieldRow, {
        key: field.key,
        field,
        copy,
        draft: form.draft[field.key] ?? "",
        disabled,
        scopeKind,
        onDraft: (next: string) => form.setField(field.key, next),
        onClear: () => form.clearField(field.key),
      })
    )
  );
}

interface ActionBarProps {
  readonly form: ScopeForm;
  readonly copy: Copy;
  /** The save button's base label; the change count is appended when the form is dirty. */
  readonly saveLabel: string;
}

/** Save / discard / reload plus the validation and notice lines, rendered for one scope. */
function ActionBar(props: ActionBarProps): React.ReactElement {
  const { form, copy, saveLabel } = props;
  const { t } = copy;
  const { diff, busy, editable } = form;
  const disabled = !editable || busy !== undefined;
  return React.createElement(
    "div",
    { className: "dhs-actions" },
    React.createElement(
      "button",
      {
        type: "button",
        className: "dhs-btn dhs-btn-primary",
        // Left enabled while a field is invalid so the click can say WHICH field it is.
        disabled: disabled || (!form.dirty && !form.invalid),
        onClick: form.save,
      },
      busy === "save"
        ? t("actions.saving")
        : form.dirty
          ? t("actions.saveCount", { label: saveLabel, count: diff.changed.length })
          : saveLabel
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== undefined, onClick: form.discard },
      t("actions.discard")
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== undefined, onClick: form.reload },
      busy === "reload" ? t("actions.reloading") : t("actions.reload")
    ),
    form.invalid
      ? React.createElement(
          "span",
          { className: "dhs-hint dhs-err", "data-validation": "errors" },
          t("errors.invalidFieldsShort", {
            count: diff.errors.length,
            messages: diff.errors.map((entry) => entry.message).join(" "),
          })
        )
      : null,
    form.notice === null
      ? null
      : React.createElement("span", { className: noticeClass(form.notice) }, form.notice.text),
    // The same message as a live region: the visual line is not announced by itself.
    React.createElement(
      "span",
      { role: "status", "aria-live": "polite", className: "dhs-sr" },
      form.notice === null ? "" : form.notice.text
    )
  );
}

function noticeClass(notice: Notice): string {
  if (notice.kind === "ok") return "dhs-hint dhs-ok";
  if (notice.kind === "err") return "dhs-hint dhs-err";
  return "dhs-hint";
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// One field
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface FieldRowProps {
  readonly field: SettingsFieldView;
  readonly copy: Copy;
  readonly draft: string;
  readonly disabled: boolean;
  readonly scopeKind: ScopeKind;
  readonly onDraft: (next: string) => void;
  readonly onClear: () => void;
}

function FieldRow(props: FieldRowProps): React.ReactElement {
  const { field, copy, draft, disabled, scopeKind, onDraft, onClear } = props;
  const { t, lang } = copy;

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => onDraft(event.target.value);

  const input = ((): React.ReactElement => {
    if (!field.editable) {
      // A read-only field shows the file's value and offers no control: a disabled input would imply
      // the value is merely locked, when in fact the form has no safe way to represent it.
      return React.createElement(
        "pre",
        { className: "dhs-readonly" },
        formatFieldValue(field, field.inFile ? field.value : null, t)
      );
    }
    switch (field.kind) {
      case "boolean":
        return React.createElement(
          "label",
          { className: "dhs-check" },
          React.createElement("input", {
            type: "checkbox",
            checked: draft === "true",
            disabled,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
              onDraft(event.target.checked ? "true" : "false"),
            "aria-label": field.key,
          }),
          React.createElement(
            "span",
            { className: "dhs-hint" },
            valueSourceNote(field, copy, scopeKind) ?? fallbackText(field, copy)
          )
        );
      case "enum": {
        const options: Array<{ readonly value: string; readonly label: string }> = [
          { value: "", label: t("unset.optionPrefix", { value: formatDefault(field, t) }) },
        ];
        for (const entry of field.values ?? []) options.push({ value: entry, label: entry });
        return React.createElement(
          "select",
          { className: "dhs-select", value: draft, disabled, onChange, "aria-label": field.key },
          ...options.map((option) =>
            React.createElement("option", { key: option.value, value: option.value }, option.label)
          )
        );
      }
      case "number":
        return React.createElement("input", {
          className: "dhs-input",
          type: "number",
          inputMode: "decimal",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          "aria-label": field.key,
        });
      case "secret":
        return React.createElement("input", {
          className: "dhs-input",
          type: "password",
          autoComplete: "off",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          "aria-label": field.key,
          // The host never sends a secret's value, so an in-file secret is an EMPTY box that is
          // nevertheless set. The placeholder is the only place that distinction can live.
          ...(field.inFile ? { placeholder: t("field.placeholder.secretSet") } : {}),
        });
      case "stringList":
        return React.createElement("textarea", {
          className: "dhs-textarea",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          placeholder: t("field.placeholder.list"),
          "aria-label": field.key,
        });
      case "json":
        return React.createElement("textarea", {
          className: "dhs-textarea",
          value: draft,
          disabled,
          onChange,
          "aria-label": field.key,
        });
      default:
        return React.createElement("input", {
          className: "dhs-input",
          type: "text",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          "aria-label": field.key,
        });
    }
  })();

  const chips: React.ReactNode[] = [
    React.createElement(
      "span",
      { className: field.editable ? "dhs-chip" : "dhs-chip dhs-chip-ro", key: "rw" },
      field.editable ? t("field.chip.editable") : t("field.chip.readOnly")
    ),
    React.createElement("span", { className: "dhs-chip", key: "kind" }, field.kind),
    React.createElement(
      "span",
      { className: "dhs-chip", key: "scope" },
      scopeLabel(field.scope, t)
    ),
    React.createElement(
      "span",
      {
        className: field.inFile ? "dhs-chip dhs-chip-set" : "dhs-chip",
        key: "state",
      },
      field.inFile ? t("field.chip.inFile") : t("field.chip.notInFile")
    ),
  ];

  // Where the text in the box came from. Only for editable rows: a read-only row renders a `pre`
  // and never shows the prefilled control, so the note would contradict what is on screen.
  const sourceNote = field.editable ? valueSourceNote(field, copy, scopeKind) : undefined;

  return React.createElement(
    "div",
    { className: "dhs-field", "data-field": field.key },
    React.createElement(
      "div",
      { className: "dhs-field-head" },
      React.createElement("span", { className: "dhs-key" }, field.key),
      ...chips
    ),
    React.createElement("div", { className: "dhs-summary" }, fieldSummary(field, lang)),
    input,
    // The source of the displayed value, then the fallback chain: a box showing the default must say
    // so, and an empty box must not read as "the value is empty" when an exported variable decides it.
    sourceNote === undefined
      ? null
      : React.createElement("div", { className: "dhs-meta" }, sourceNote),
    field.inFile
      ? null
      : React.createElement("div", { className: "dhs-meta" }, fallbackText(field, copy)),
    field.shadowedByHarness
      ? React.createElement("div", { className: "dhs-meta" }, shadowText(t))
      : null,
    !field.editable ? React.createElement("div", { className: "dhs-meta" }, readOnlyText(t)) : null,
    field.editable
      ? React.createElement(
          "div",
          { className: "dhs-field-head" },
          React.createElement(
            "button",
            {
              type: "button",
              className: "dhs-btn dhs-btn-mini",
              // Removing a key the file does not set changes nothing, so the control is inert there.
              disabled: disabled || !field.inFile,
              onClick: onClear,
            },
            field.inFile
              ? draft === "" && field.kind !== "secret"
                ? // An empty cell for a value the file stores as "" is still a stored key.
                  t("field.clearUnsetStored", { value: unsetText(t) })
                : // A secret is ALWAYS an empty box while set, so its button always reads "clear".
                  t("field.clearInFile")
              : t("field.clearNotInFile")
          ),
          field.kind === "secret"
            ? React.createElement("span", { className: "dhs-hint" }, t("field.secretHint"))
            : null
        )
      : null
  );
}
