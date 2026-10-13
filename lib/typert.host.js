// src/typert.host.ts
var PACKAGE = "@Echo-Note/dsh-hindsight-settings";
var SERVICE = "hindsightSettings";
var strictCodec = (typeSymbol) => Object.freeze({
  mode: "strict",
  typeSymbol,
  create: () => ({ parse: (value) => value })
});
var VIEW_SYMBOL = `${PACKAGE}#SettingsView`;
var APPLY_SYMBOL = `${PACKAGE}#ApplyResult`;
var PATCH_SYMBOL = `${PACKAGE}#SettingsPatch`;
var NOTE_SYMBOL = `${PACKAGE}#ClientNote`;
var ACK_SYMBOL = `${PACKAGE}#NoteAck`;
var SCOPE_SYMBOL = `${PACKAGE}#ConfigScope`;
var TYPERT = {
  package: PACKAGE,
  face: "host",
  schemas: [
    { name: "SettingsView", create: () => ({ parse: (value) => value }) },
    { name: "ApplyResult", create: () => ({ parse: (value) => value }) },
    { name: "SettingsPatch", create: () => ({ parse: (value) => value }) },
    { name: "ClientNote", create: () => ({ parse: (value) => value }) },
    { name: "NoteAck", create: () => ({ parse: (value) => value }) },
    { name: "ConfigScope", create: () => ({ parse: (value) => value }) }
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
            summary: "Every Hindsight setting with its value in the shared config file, plus whether the file sets it at all."
          },
          {
            kind: "method",
            name: "note",
            signature: "note(message: ClientNote): Promise<NoteAck>",
            summary: "Record one diagnostic line from the settings page in the host status trail, so a browser-side failure is readable without a console."
          },
          {
            kind: "method",
            name: "applyScoped",
            signature: "applyScoped(scope: ConfigScope, patch: SettingsPatch): Promise<ApplyResult>",
            summary: "Write one banks.<bankId> or paths.<dir> section, which is how a single repository differs from the shared top level."
          },
          {
            kind: "method",
            name: "apply",
            signature: "apply(patch: SettingsPatch): Promise<ApplyResult>",
            summary: "Merge a patch into the shared config file; a null value removes the key so the setting falls back to the environment variable, then the plugin default."
          }
        ],
        types: []
      }
    ],
    events: [],
    objects: []
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
          acceptsUndefined: true
        }
      ],
      result: strictCodec(VIEW_SYMBOL)
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
          codec: strictCodec(NOTE_SYMBOL)
        }
      ],
      result: strictCodec(ACK_SYMBOL)
    },
    {
      id: `${PACKAGE}#${SERVICE}/applyScoped`,
      service: SERVICE,
      namespace: SERVICE,
      method: "applyScoped",
      invocation: { kind: "direct" },
      parameters: [
        { name: "scope", wire: "scope", source: "json", codec: strictCodec(SCOPE_SYMBOL) },
        { name: "patch", wire: "patch", source: "json", codec: strictCodec(PATCH_SYMBOL) }
      ],
      result: strictCodec(APPLY_SYMBOL)
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
          codec: strictCodec(PATCH_SYMBOL)
        }
      ],
      result: strictCodec(APPLY_SYMBOL)
    }
  ]
};
export {
  TYPERT
};
//# sourceMappingURL=typert.host.js.map