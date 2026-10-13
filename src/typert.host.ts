/**
 * Hand-written Typert Host face.
 *
 * `@deepseek-ai/dsh-typert-loader` scans every mounted package for a `./typert` export and registers
 * what it finds in `ctx.typert`; `dsh-api-gateway` then dispatches `POST /api/<namespace>/<method>`
 * to the service named by `descriptor.service` on the plugin's context. The shape below is the one
 * `docs/api-gateway.md` describes:
 *
 *   - `id` is `<package>#<service>/<method>`;
 *   - `service` is the Cordis service key the gateway resolves on the plugin context;
 *   - `parameters` are listed in call order and must carry a STRICT codec (the Gateway's
 *     `requireStrictInputs` refuses anything else);
 *   - `result` must ALSO be a strict codec on the Host face — a loose (`src-json`) result is rejected
 *     at registration with "result codec must use a strict codec".
 *
 * The payloads are plain JSON by construction (see `service.ts`), so every codec is a pass-through
 * validator with a registered `schemas[]` entry rather than a second schema to keep in sync.
 */
const PACKAGE = "@local/dsh-hindsight-settings";
const SERVICE = "hindsightSettings";

/** One strict, pass-through codec for a JSON payload. */
const strictCodec = (typeSymbol: string) =>
  Object.freeze({
    mode: "strict",
    typeSymbol,
    create: () => ({ parse: (value: unknown) => value }),
  });

const VIEW_SYMBOL = `${PACKAGE}#SettingsView`;
const APPLY_SYMBOL = `${PACKAGE}#ApplyResult`;
const PATCH_SYMBOL = `${PACKAGE}#SettingsPatch`;
const NOTE_SYMBOL = `${PACKAGE}#ClientNote`;
const ACK_SYMBOL = `${PACKAGE}#NoteAck`;
const SCOPE_SYMBOL = `${PACKAGE}#ConfigScope`;

export const TYPERT = {
  package: PACKAGE,
  face: "host",
  schemas: [
    { name: "SettingsView", create: () => ({ parse: (value: unknown) => value }) },
    { name: "ApplyResult", create: () => ({ parse: (value: unknown) => value }) },
    { name: "SettingsPatch", create: () => ({ parse: (value: unknown) => value }) },
    { name: "ClientNote", create: () => ({ parse: (value: unknown) => value }) },
    { name: "NoteAck", create: () => ({ parse: (value: unknown) => value }) },
    { name: "ConfigScope", create: () => ({ parse: (value: unknown) => value }) },
  ],
  /**
   * Package reflection. Required: without it registration fails with `TYPERT.model must be an
   * object`, the namespace never mounts, and every call answers 404 on `/api/<namespace>/<method>`.
   * Every service, event and object needs a `tags` array.
   */
  model: {
    services: [
      {
        key: SERVICE,
        exportName: SERVICE,
        tags: [],
        members: [
          {
            kind: "method",
            name: "describe",
            signature: "describe(): Promise<SettingsView>",
            summary:
              "Every Hindsight setting with its value in the shared config file, plus whether the file sets it at all.",
          },
          {
            kind: "method",
            name: "note",
            signature: "note(message: ClientNote): Promise<NoteAck>",
            summary:
              "Record one diagnostic line from the settings page in the host status trail, so a browser-side failure is readable without a console.",
          },
          {
            kind: "method",
            name: "applyScoped",
            signature:
              "applyScoped(scope: ConfigScope, patch: SettingsPatch): Promise<ApplyResult>",
            summary:
              "Write one banks.<bankId> or paths.<dir> section, which is how a single repository differs from the shared top level.",
          },
          {
            kind: "method",
            name: "apply",
            signature: "apply(patch: SettingsPatch): Promise<ApplyResult>",
            summary:
              "Merge a patch into the shared config file; a null value removes the key so the setting falls back to the environment variable, then the plugin default.",
          },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
  invocations: [
    {
      id: `${PACKAGE}#${SERVICE}/describe`,
      service: SERVICE,
      namespace: SERVICE,
      method: "describe",
      invocation: { kind: "direct" },
      // Optional: the scope defaults to the file's top level, so an older page that sends no
      // argument keeps working.
      parameters: [
        {
          name: "scope",
          wire: "scope",
          source: "json",
          codec: strictCodec(SCOPE_SYMBOL),
          acceptsUndefined: true,
        },
      ],
      result: strictCodec(VIEW_SYMBOL),
    },
    {
      id: `${PACKAGE}#${SERVICE}/note`,
      service: SERVICE,
      namespace: SERVICE,
      method: "note",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "message",
          wire: "message",
          source: "json",
          codec: strictCodec(NOTE_SYMBOL),
        },
      ],
      result: strictCodec(ACK_SYMBOL),
    },
    {
      id: `${PACKAGE}#${SERVICE}/applyScoped`,
      service: SERVICE,
      namespace: SERVICE,
      method: "applyScoped",
      invocation: { kind: "direct" },
      parameters: [
        { name: "scope", wire: "scope", source: "json", codec: strictCodec(SCOPE_SYMBOL) },
        { name: "patch", wire: "patch", source: "json", codec: strictCodec(PATCH_SYMBOL) },
      ],
      result: strictCodec(APPLY_SYMBOL),
    },
    {
      id: `${PACKAGE}#${SERVICE}/apply`,
      service: SERVICE,
      namespace: SERVICE,
      method: "apply",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "patch",
          wire: "patch",
          source: "json",
          codec: strictCodec(PATCH_SYMBOL),
        },
      ],
      result: strictCodec(APPLY_SYMBOL),
    },
  ],
};
