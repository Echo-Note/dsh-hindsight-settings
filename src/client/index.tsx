/**
 * Browser half of `@local/dsh-hindsight-settings`.
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
 * ## The page's shape
 *
 * Seven groups of settings in one column was unreadable, so the surface is now a tab bar: one tab per
 * `FIELD_GROUPS` entry plus a final **按项目（banks）** tab. The header, the config-file path, the
 * availability line and the action bar stay mounted across tabs; only the active tab's field rows
 * render. The banks tab lists `banks.<id>` sections and opens one in a tabs-free form of its own,
 * which reads `describe({ kind: "bank", id })` and writes through `applyScoped`.
 *
 * ## Failure policy
 *
 * Nothing here may take the shell down. `ctx.remote` is read defensively, `$mount` is wrapped, the
 * service lookup is validated before use, and every branch ends in a sentence the user can act on
 * rather than an exception.
 */

import * as React from "react";
import {
  CONTRIBUTION,
  LOADING_TEXT,
  PAGE_ID,
  PAGE_LABEL,
  PAGE_ORDER,
  SERVICE_KEY,
  SETTINGS_SLOT,
  UNSET_TEXT,
  banksScopeText,
  buildTabs,
  describeAvailability,
  diffDraft,
  draftFromFields,
  fallbackText,
  formatDefault,
  formatFieldValue,
  isRecord,
  isSettingsView,
  pathsReadOnlyText,
  readOnlyText,
  remoteErrorText,
  scopeLabel,
  scopedEditorTitle,
  shadowText,
  summarizeApply,
  valueSourceNote,
  type ConfigScope,
  type DraftDiff,
  type JsonValue,
  type PageTab,
  type RemoteNamespace,
  type ScopeMember,
  type ServiceState,
  type SettingsFieldView,
  type SettingsView,
} from "./model";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The cordis surface, structurally typed
//
// `@deepseek-ai/cordis` is a peer dependency and is not installed here, so the shape actually used is
// declared locally. That also keeps the bundle honest: it can only reach what it declares.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type Disposer = () => void;

interface SlotsLike {
  inject(name: string, register: () => Disposer): Disposer;
  register(spec: Record<string, unknown>, component: unknown): Disposer;
}

interface RemoteLike {
  $mount(contribution: unknown): Promise<unknown>;
}

interface ClientContextLike {
  get(name: string): unknown;
  effect?(execute: () => Disposer | void, label?: string): Disposer;
  slots?: SlotsLike;
  remote?: RemoteLike;
}

/** The message shown when the host offers no Remote service at all. */
const NO_REMOTE_REASON =
  "宿主没有提供 Remote 服务（ctx.remote 不存在），本页无法读写配置。请确认 dsh-api-gateway 的客户端半边已加载。";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Plugin exports (the lazy-CJS factory's `module.exports`)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export const name = "dsh-hindsight-settings";

/**
 * The hard dependency gate.
 *
 * Every service this half reads is declared, `remote` included: the api-gateway reference states
 * that a plugin calling `ctx.remote.<namespace>` declares both `remote` and `remote.<namespace>`, and
 * cordis refuses a property read on any service that is not injected. Every access still goes through
 * `ctx.get(...)` with a fallback, so a composition without the gateway renders the explanatory line
 * instead of throwing (which is how this page once failed: an undeclared `ctx.remote` property read).
 */
export const inject = ["slots", "remote"];

export function apply(ctx: ClientContextLike): void {
  const report = createReporter(ctx);
  try {
    const slots = ctx.slots;
    report(
      `apply: slots=${typeof slots} inject=${typeof slots?.inject} register=${typeof slots?.register} effect=${typeof ctx.effect} get=${typeof ctx.get}`
    );
    if (
      slots === undefined ||
      typeof slots.inject !== "function" ||
      typeof slots.register !== "function"
    ) {
      report("apply: the slot service is missing inject/register — the page cannot appear");
      return;
    }

    // Built once per `apply`, so the component identity the renderer holds stays stable across
    // renders while still closing over this instance's mount.
    // Setup is reported rather than swallowed: `createServiceStore` builds the mount and the page
    // factory builds the component, and a throw in either used to leave no trace anywhere.
    let Page: () => React.ReactElement;
    try {
      Page = createPage(createServiceStore(ctx), report);
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
            React.createElement("span", { className: "dhs-title" }, PAGE_LABEL)
          ),
          React.createElement("div", { className: "dhs-note dhs-warn" }, `初始化失败：${text}`)
        );
    }
    // The inject callback can run LATER than this call, so a throw from `register` would escape the
    // try/catch below and vanish. Catching it here — inside the callback — is what makes the failure
    // visible at all, which is how the missing registration was finally explained.
    const register = (): Disposer => {
      report("register: calling slots.register");
      try {
        const dispose = slots.register(
          { name: SETTINGS_SLOT, id: PAGE_ID, order: PAGE_ORDER, label: () => PAGE_LABEL },
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
                { name: SETTINGS_SLOT, id: PAGE_ID, order: PAGE_ORDER, label: () => PAGE_LABEL },
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
      reason: `Remote 贡献已提交，但宿主没有挂载 ${SERVICE_KEY}。请确认 dsh-api-gateway 正在服务该命名空间。`,
    };
  }
  return { kind: "ready", service };
}

/**
 * The page's Remote state, as a subscribable snapshot.
 *
 * The missing-`remote` case is decided **synchronously**, before any promise exists, so the very
 * first render can already say why nothing is editable. Every other outcome is published when the
 * mount settles.
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
    state = { kind: "unavailable", reason: NO_REMOTE_REASON };
  } else {
    state = { kind: "loading" };
    void mount(ctx, remote).then(publish, (error: unknown) => {
      publish({
        kind: "unavailable",
        reason: `Remote 贡献挂载失败：${remoteErrorText(error)}`,
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
  ".dhs-page{display:flex;flex-direction:column;gap:12px;font-size:13px;color:var(--dsw-alias-label-primary,inherit)}",
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
  ".dhs-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border-top:1px solid var(--dsw-alias-border-l1,currentColor);padding-top:10px;position:sticky;bottom:0;background:var(--dsw-alias-bg-base,transparent)}",
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

type NoticeKind = "ok" | "err" | "info";

interface Notice {
  readonly kind: NoticeKind;
  readonly text: string;
}

/**
 * Bind the page to one store.
 *
 * The gate is a separate component so the hooks below it are unconditional: `<HindsightSettingsPage>`
 * runs a single hook and then either explains itself or mounts `<SettingsForm>`.
 */
function createPage(
  store: ServiceStore,
  report: (message: string) => void
): () => React.ReactElement {
  return function HindsightSettingsPage(): React.ReactElement {
    ensureStyles();
    report("render: entered");
    const state = useServiceState(store);

    if (state.kind !== "ready") {
      return React.createElement(
        "div",
        { className: "dhs-page", "data-plugin-hindsight-settings": "unavailable" },
        React.createElement(
          "div",
          { className: "dhs-head" },
          React.createElement("span", { className: "dhs-title" }, PAGE_LABEL)
        ),
        React.createElement(
          "div",
          { className: state.kind === "loading" ? "dhs-note" : "dhs-note dhs-warn" },
          state.kind === "loading" ? LOADING_TEXT : state.reason
        )
      );
    }

    return React.createElement(SettingsForm, { service: state.service, report });
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// One scope's form state (top level, or one banks.<id> section)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** How a field's source is worded: the top level says "文件", a bank says "本 bank". */
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
  onSaved: (() => void) | undefined
): ScopeForm {
  const [view, setView] = React.useState<SettingsView | undefined>(undefined);
  const [loadError, setLoadError] = React.useState<string | undefined>(undefined);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<"save" | "reload" | undefined>(undefined);
  /** Fields the user explicitly cleared; a redacted secret has no loaded value to differ from. */
  const [cleared, setCleared] = React.useState<ReadonlySet<string>>(() => new Set());
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const label = scopeKey(scope);

  const reload = React.useCallback(async (): Promise<void> => {
    setBusy("reload");
    try {
      const result = await service.describe(scope ?? TOP_SCOPE);
      if (result.ok) {
        if (!isSettingsView(result.value)) {
          setLoadError("宿主返回的设置数据格式无法识别（缺少 path / fields）。");
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
        setLoadError(`读取配置失败：${remoteErrorText(result.error)}`);
      }
    } catch (error) {
      // An assembly fault still rejects, unlike a carrier failure.
      setLoadError(`读取配置失败：${remoteErrorText(error)}`);
    } finally {
      setBusy(undefined);
    }
  }, [service, scope, label, report]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const availability = describeAvailability({ state: { kind: "ready", service }, view, loadError });

  const diff = React.useMemo(
    () =>
      view === undefined
        ? { patch: {}, errors: [], changed: [] }
        : diffDraft(view.fields, draft, cleared),
    [view, draft, cleared]
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
        text: `有 ${diff.errors.length} 个字段不合法，未提交：${diff.errors
          .map((entry) => entry.message)
          .join(" ")}`,
      });
      return;
    }
    if (diff.changed.length === 0) {
      setNotice({ kind: "info", text: "没有需要保存的改动。" });
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
          setNotice({ kind: "ok", text: summarizeApply(patch, result.value) });
          if (onSaved !== undefined) onSaved();
        } else {
          setNotice({ kind: "err", text: `保存失败：${remoteErrorText(result.error)}` });
        }
      } catch (error) {
        setNotice({ kind: "err", text: `保存失败：${remoteErrorText(error)}` });
      } finally {
        setBusy(undefined);
        await reload();
      }
    })();
  }, [view, diff, service, scope, reload, onSaved]);

  const discard = React.useCallback((): void => {
    if (view !== undefined) setDraft(draftFromFields(view.fields));
    setCleared(new Set());
    setNotice({ kind: "info", text: "已丢弃未保存的改动。" });
  }, [view]);

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

interface SettingsFormProps {
  readonly service: RemoteNamespace;
  readonly report: (message: string) => void;
}

function SettingsForm(props: SettingsFormProps): React.ReactElement {
  const { service, report } = props;
  const form = useScopeForm(service, undefined, report, undefined);
  // Empty means "no explicit choice yet": the fallback below resolves it to the FIRST group tab.
  const [activeTab, setActiveTab] = React.useState<string>("");

  const tabs = React.useMemo(() => buildTabs(form.view?.fields ?? []), [form.view]);
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
      React.createElement("span", { className: "dhs-title" }, PAGE_LABEL),
      React.createElement(
        "span",
        { className: "dhs-sub" },
        form.view === undefined
          ? LOADING_TEXT
          : `${form.view.fields.length} 个配置项 · 分组 ${groupCount} 个`
      )
    ),
    // The path is whatever the host resolved, so this line is correct on every OS.
    React.createElement(
      "div",
      { className: "dhs-note" },
      "本页直接读写宿主当前使用的配置文件：",
      React.createElement("code", null, form.view?.path ?? LOADING_TEXT),
      React.createElement("br", null),
      "留空并保存＝删除该键，该项随即回退到环境变量，再回退到插件默认值。"
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
              members: form.view?.banks ?? [],
              paths: form.view?.paths ?? [],
              onChanged: form.reload,
            })
          : renderGroup(active, form, disabled)
    ),
    React.createElement(ActionBar, { form, saveLabel: "保存" })
  );
}

/** One group tab's body: the heading, then that group's field rows only. */
function renderGroup(tab: PageTab, form: ScopeForm, disabled: boolean): React.ReactElement {
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
      ? React.createElement("div", { className: "dhs-meta" }, "本组暂无配置项。")
      : React.createElement(FieldRows, {
          fields: tab.fields,
          form,
          scopeKind: "top",
          disabled,
        })
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The 按项目（banks） tab
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface BanksPanelProps {
  readonly service: RemoteNamespace;
  readonly report: (message: string) => void;
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
  const { service, report, members, paths, onChanged } = props;
  const [openId, setOpenId] = React.useState<string | undefined>(undefined);
  const [newId, setNewId] = React.useState("");
  const [addError, setAddError] = React.useState<string | undefined>(undefined);

  const open = members.find((member) => member.id === openId);

  const onAdd = (): void => {
    const candidate = newId.trim();
    if (candidate === "") {
      setAddError("请输入 bank id（不能为空）。");
      return;
    }
    if (members.some((member) => member.id === candidate)) {
      setAddError(`banks.${candidate} 已经存在，请直接从上面的列表打开。`);
      return;
    }
    setAddError(undefined);
    setNewId("");
    setOpenId(candidate);
  };

  return React.createElement(
    "div",
    { className: "dhs-scope" },
    React.createElement("div", { className: "dhs-note" }, banksScopeText()),
    React.createElement(
      "div",
      { className: "dhs-subhead" },
      React.createElement("span", { className: "dhs-subhead-title" }, "已有 bank"),
      React.createElement("span", { className: "dhs-chip" }, `${members.length} 个`)
    ),
    members.length === 0
      ? React.createElement("div", { className: "dhs-meta" }, "文件里还没有 banks 段落。")
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
                  `${member.keys.length} 个键`
                ),
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "dhs-btn dhs-btn-mini",
                    onClick: () => setOpenId(openId === member.id ? undefined : member.id),
                  },
                  openId === member.id ? "收起" : "打开"
                )
              ),
              member.keys.length === 0
                ? null
                : React.createElement(
                    "div",
                    { className: "dhs-meta" },
                    `已设置：${member.keys.join("、")}`
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
        placeholder: "新增 bank id，例如 coding-agent::my-repo",
        "aria-label": "新增 bank id",
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          setNewId(event.target.value);
          setAddError(undefined);
        },
      }),
      React.createElement(
        "button",
        { type: "button", className: "dhs-btn dhs-btn-mini", onClick: onAdd },
        "新增"
      )
    ),
    addError === undefined
      ? null
      : React.createElement("div", { className: "dhs-meta dhs-err" }, addError),
    openId === undefined
      ? null
      : React.createElement(
          "div",
          { className: "dhs-scope", "data-bank": openId },
          React.createElement(
            "div",
            { className: "dhs-subhead" },
            React.createElement("span", { className: "dhs-subhead-title" }, `编辑 banks.${openId}`),
            open === undefined
              ? React.createElement("span", { className: "dhs-chip" }, "新段落")
              : React.createElement("span", { className: "dhs-chip" }, `${open.keys.length} 个键`),
            React.createElement(
              "button",
              {
                type: "button",
                className: "dhs-btn dhs-btn-mini",
                onClick: () => setOpenId(undefined),
              },
              "关闭"
            )
          ),
          open === undefined
            ? React.createElement(
                "div",
                { className: "dhs-meta" },
                "保存后才会在文件里创建这一段。"
              )
            : null,
          React.createElement(ScopedEditor, {
            key: openId,
            service,
            report,
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
            React.createElement("span", { className: "dhs-subhead-title" }, "按路径（paths）"),
            React.createElement("span", { className: "dhs-chip dhs-chip-ro" }, "只读")
          ),
          React.createElement("div", { className: "dhs-meta" }, pathsReadOnlyText()),
          ...paths.map((member) =>
            React.createElement(
              "div",
              { className: "dhs-meta", key: member.id },
              React.createElement("code", { className: "dhs-key" }, `paths.${member.id}`),
              ` · ${member.keys.length} 个键${member.keys.length === 0 ? "" : `：${member.keys.join("、")}`}`
            )
          )
        )
  );
}

interface ScopedEditorProps {
  readonly service: RemoteNamespace;
  readonly report: (message: string) => void;
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
  const { service, report, bankId, onSaved } = props;
  const scope = React.useMemo<ConfigScope>(() => ({ kind: "bank", id: bankId }), [bankId]);
  const form = useScopeForm(service, scope, report, onSaved);
  const fields = form.view?.fields ?? [];
  const disabled = !form.editable || form.busy !== undefined;

  return React.createElement(
    "div",
    { className: "dhs-scope", "data-scope": `bank:${bankId}` },
    React.createElement(
      "div",
      { className: "dhs-scope-head" },
      React.createElement("span", { className: "dhs-subhead-title" }, scopedEditorTitle(scope)),
      React.createElement(
        "span",
        { className: "dhs-sub" },
        form.view === undefined
          ? LOADING_TEXT
          : `${fields.length} 个配置项 · 文件：${form.view.path}`
      )
    ),
    React.createElement("div", { className: "dhs-note" }, banksScopeText()),
    form.availability === undefined
      ? null
      : React.createElement("div", { className: "dhs-note dhs-warn" }, form.availability),
    React.createElement(FieldRows, { fields, form, scopeKind: "bank", disabled }),
    React.createElement(ActionBar, { form, saveLabel: `保存到 banks.${bankId}` })
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Shared pieces
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface FieldRowsProps {
  readonly fields: readonly SettingsFieldView[];
  readonly form: ScopeForm;
  readonly scopeKind: ScopeKind;
  readonly disabled: boolean;
}

function FieldRows(props: FieldRowsProps): React.ReactElement {
  const { fields, form, scopeKind, disabled } = props;
  return React.createElement(
    React.Fragment,
    null,
    ...fields.map((field) =>
      React.createElement(FieldRow, {
        key: field.key,
        field,
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
  /** The save button's base label; the change count is appended when the form is dirty. */
  readonly saveLabel: string;
}

/** Save / discard / reload plus the validation and notice lines, rendered for one scope. */
function ActionBar(props: ActionBarProps): React.ReactElement {
  const { form, saveLabel } = props;
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
        ? "保存中…"
        : form.dirty
          ? `${saveLabel}（${diff.changed.length} 项）`
          : saveLabel
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== undefined, onClick: form.discard },
      "撤销修改"
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== undefined, onClick: form.reload },
      busy === "reload" ? "重新读取中…" : "重新读取"
    ),
    form.invalid
      ? React.createElement(
          "span",
          { className: "dhs-hint dhs-err", "data-validation": "errors" },
          `有 ${diff.errors.length} 个字段不合法，不会提交：${diff.errors
            .map((entry) => entry.message)
            .join(" ")}`
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
  readonly draft: string;
  readonly disabled: boolean;
  readonly scopeKind: ScopeKind;
  readonly onDraft: (next: string) => void;
  readonly onClear: () => void;
}

function FieldRow(props: FieldRowProps): React.ReactElement {
  const { field, draft, disabled, scopeKind, onDraft, onClear } = props;

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
        formatFieldValue(field, field.inFile ? field.value : null)
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
            valueSourceNote(field, scopeKind) ?? fallbackText(field)
          )
        );
      case "enum": {
        const options: Array<{ readonly value: string; readonly label: string }> = [
          { value: "", label: `未设置（默认 ${formatDefault(field)}）` },
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
          ...(field.inFile ? { placeholder: "已设置（不显示明文）· 留空＝不改动" } : {}),
        });
      case "stringList":
        return React.createElement("textarea", {
          className: "dhs-textarea",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          placeholder: "一行一个；也接受逗号分隔",
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
      field.editable ? "可编辑" : "只读"
    ),
    React.createElement("span", { className: "dhs-chip", key: "kind" }, field.kind),
    React.createElement("span", { className: "dhs-chip", key: "scope" }, scopeLabel(field.scope)),
    React.createElement(
      "span",
      {
        className: field.inFile ? "dhs-chip dhs-chip-set" : "dhs-chip",
        key: "state",
      },
      field.inFile ? "文件已设置" : "文件未设置"
    ),
  ];

  // Where the text in the box came from. Only for editable rows: a read-only row renders a `pre`
  // and never shows the prefilled control, so the note would contradict what is on screen.
  const sourceNote = field.editable ? valueSourceNote(field, scopeKind) : undefined;

  return React.createElement(
    "div",
    { className: "dhs-field", "data-field": field.key },
    React.createElement(
      "div",
      { className: "dhs-field-head" },
      React.createElement("span", { className: "dhs-key" }, field.key),
      ...chips
    ),
    React.createElement("div", { className: "dhs-summary" }, field.summary),
    input,
    // The source of the displayed value, then the fallback chain: a box showing the default must say
    // so, and an empty box must not read as "the value is empty" when an exported variable decides it.
    sourceNote === undefined
      ? null
      : React.createElement("div", { className: "dhs-meta" }, sourceNote),
    field.inFile
      ? null
      : React.createElement("div", { className: "dhs-meta" }, fallbackText(field)),
    field.shadowedByHarness
      ? React.createElement("div", { className: "dhs-meta" }, shadowText())
      : null,
    !field.editable ? React.createElement("div", { className: "dhs-meta" }, readOnlyText()) : null,
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
                  `${UNSET_TEXT}（保存后删除该键）`
                : // A secret is ALWAYS an empty box while set, so its button always reads 清空.
                  "清空（保存后删除该键）"
              : "清空（文件中没有这一项）"
          ),
          field.kind === "secret"
            ? React.createElement(
                "span",
                { className: "dhs-hint" },
                "密钥不随接口下发：留空＝不改动，输入新值＝覆盖，点「清空」保存后删除该键。"
              )
            : null
        )
      : null
  );
}
