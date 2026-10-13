window.__ModuleLoader__.load({ id: "@Echo-Note/dsh-hindsight-settings", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var React = __toESM(require("react"), 1);

// src/fields.ts
var FIELD_GROUPS = [
  {
    id: "connection",
    title: {
      en: "Connection",
      zh: "\u8FDE\u63A5"
    },
    summary: {
      en: "Where memories are stored, and which credential reaches them.",
      zh: "\u8BB0\u5FC6\u5B58\u653E\u5728\u54EA\u91CC\uFF0C\u4F7F\u7528\u4EC0\u4E48\u51ED\u636E\u8BBF\u95EE\u3002"
    }
  },
  {
    id: "routing",
    title: {
      en: "Bank routing",
      zh: "\u8BB0\u5FC6\u5E93\u8DEF\u7531"
    },
    summary: {
      en: "Which bank this work is written into; one per repository by default.",
      zh: "\u8FD9\u6B21\u5DE5\u4F5C\u5199\u8FDB\u54EA\u4E2A bank\uFF1B\u9ED8\u8BA4\u6BCF\u4E2A\u4ED3\u5E93\u4E00\u4E2A\u3002"
    }
  },
  {
    id: "recall",
    title: {
      en: "Recall and injection",
      zh: "\u53EC\u56DE\u4E0E\u6CE8\u5165"
    },
    summary: {
      en: "What gets injected into the model's context each turn, and how long it waits.",
      zh: "\u6BCF\u4E00\u8F6E\u5F80\u6A21\u578B\u4E0A\u4E0B\u6587\u91CC\u6CE8\u5165\u4EC0\u4E48\u3001\u7B49\u591A\u4E45\u3002"
    }
  },
  {
    id: "pages",
    title: {
      en: "Knowledge pages",
      zh: "\u77E5\u8BC6\u9875"
    },
    summary: {
      en: "How knowledge pages are generated, and when they refresh.",
      zh: "\u77E5\u8BC6\u9875\u600E\u4E48\u751F\u6210\u3001\u4EC0\u4E48\u65F6\u5019\u5237\u65B0\u3002"
    }
  },
  {
    id: "retention",
    title: {
      en: "Writing and retention",
      zh: "\u5199\u5165\u4E0E\u4FDD\u7559"
    },
    summary: {
      en: "How sessions land in the store, how finely they are extracted, and how they are grouped.",
      zh: "\u4F1A\u8BDD\u600E\u4E48\u843D\u5E93\u3001\u62BD\u53D6\u591A\u7EC6\u3001\u6309\u4EC0\u4E48\u7C92\u5EA6\u5F52\u5E76\u3002"
    }
  },
  {
    id: "ingest",
    title: {
      en: "Seeding and follow-up",
      zh: "\u79CD\u5B50\u4E0E\u8DDF\u8FDB"
    },
    summary: {
      en: "Where a cold start draws its material from, and how it stays current afterwards.",
      zh: "\u51B7\u542F\u52A8\u65F6\u4ECE\u54EA\u91CC\u53D6\u6599\uFF0C\u4E4B\u540E\u600E\u4E48\u4FDD\u6301\u5F53\u524D\u3002"
    }
  },
  {
    id: "scope",
    title: {
      en: "Scope and switches",
      zh: "\u8303\u56F4\u4E0E\u5F00\u5173"
    },
    summary: {
      en: "Which projects have memory, plus the switches used for troubleshooting.",
      zh: "\u54EA\u4E9B\u9879\u76EE\u6709\u8BB0\u5FC6\uFF0C\u4EE5\u53CA\u6392\u67E5\u7528\u7684\u5F00\u5173\u3002"
    }
  }
];
var CONFIG_FIELDS = [
  {
    key: "serverMode",
    group: "connection",
    kind: "enum",
    values: ["cloud", "self-hosted", "daemon"],
    default: "cloud",
    env: "HINDSIGHT_SERVER_MODE",
    editable: true,
    scope: "global",
    summary: {
      en: "cloud = the official hosted service; self-hosted = your own server (used with apiUrl); daemon = the local hindsight-embed daemon (apiUrl is ignored).",
      zh: "cloud = \u5B98\u65B9\u6258\u7BA1\uFF1Bself-hosted = \u4F60\u81EA\u5DF1\u7684\u670D\u52A1\u5668\uFF08\u914D\u5408 apiUrl\uFF09\uFF1Bdaemon = \u672C\u673A hindsight-embed \u5B88\u62A4\u8FDB\u7A0B\uFF08apiUrl \u88AB\u5FFD\u7565\uFF09\u3002"
    }
  },
  {
    key: "apiUrl",
    group: "connection",
    kind: "string",
    default: "https://api.hindsight.vectorize.io",
    env: "HINDSIGHT_API_URL",
    editable: true,
    scope: "global",
    summary: {
      en: "The Hindsight API address. A common self-hosted one is http://localhost:8888.",
      zh: "Hindsight API \u5730\u5740\u3002\u81EA\u5EFA\u5E38\u89C1 http://localhost:8888\u3002"
    }
  },
  {
    key: "apiToken",
    group: "connection",
    kind: "secret",
    default: null,
    env: "HINDSIGHT_API_TOKEN",
    editable: true,
    scope: "global",
    summary: {
      en: "Hindsight's bearer token (self-hosted = the key your server requires; Cloud = an account key). It is a server/account-level credential and carries no user identity: when several people share one key, isolation depends only on whether the server has the tenant extension installed (one key per user, one schema each), and the bank name itself is not a security boundary. A Cloud key can be limited per bank and created/revoked programmatically.",
      zh: "Hindsight \u7684\u627F\u8F7D\u4EE4\u724C\uFF08\u81EA\u6258\u7BA1\uFF1D\u4F60\u670D\u52A1\u5668\u8981\u6C42\u7684 key\uFF1BCloud\uFF1D\u8D26\u53F7 key\uFF09\u3002\u5B83\u662F\u3010\u670D\u52A1\u5668/\u8D26\u53F7\u7EA7\u3011\u51ED\u636E\uFF0C\u4E0D\u643A\u5E26\u7528\u6237\u8EAB\u4EFD\uFF1A\u591A\u4EBA\u5171\u7528\u4E00\u4E2A key \u65F6\uFF0C\u9694\u79BB\u53EA\u53D6\u51B3\u4E8E\u670D\u52A1\u5668\u7AEF\u662F\u5426\u88C5\u4E86 tenant \u6269\u5C55\uFF08\u4E00\u4EBA\u4E00\u952E\u4E00 schema\uFF09\uFF0Cbank \u540D\u672C\u8EAB\u4E0D\u662F\u5B89\u5168\u8FB9\u754C\u3002Cloud \u7684 key \u53EF\u6309 bank \u9650\u5B9A\u5E76\u53EF\u7A0B\u5E8F\u5316\u521B\u5EFA/\u64A4\u9500\u3002"
    }
  },
  {
    key: "apiPort",
    group: "connection",
    kind: "number",
    default: 9077,
    env: "HINDSIGHT_API_PORT",
    editable: true,
    scope: "global",
    summary: {
      en: "The port daemon mode listens on (not 8888, which is the self-hosted server).",
      zh: "daemon \u6A21\u5F0F\u76D1\u542C\u7684\u7AEF\u53E3\uFF08\u4E0D\u662F\u81EA\u5EFA\u670D\u52A1\u5668\u7684 8888\uFF09\u3002"
    }
  },
  {
    key: "daemonIdleTimeout",
    group: "connection",
    kind: "number",
    default: null,
    env: "HINDSIGHT_DAEMON_IDLE_TIMEOUT",
    editable: true,
    scope: "global",
    summary: {
      en: "How many seconds of idleness before the daemon exits; unset means it never exits on its own.",
      zh: "daemon \u7A7A\u95F2\u591A\u5C11\u79D2\u540E\u9000\u51FA\uFF1B\u4E0D\u8BBE\u5219\u6C38\u4E0D\u81EA\u52A8\u9000\u51FA\u3002"
    }
  },
  {
    key: "daemonProfile",
    group: "connection",
    kind: "string",
    default: "coding-agent",
    env: "HINDSIGHT_DAEMON_PROFILE",
    editable: true,
    scope: "global",
    summary: {
      en: "Which hindsight-embed profile the daemon uses (that is, which local store).",
      zh: "daemon \u4F7F\u7528\u54EA\u4E2A hindsight-embed profile\uFF08\u5373\u54EA\u4E2A\u672C\u5730\u5E93\uFF09\u3002"
    }
  },
  {
    key: "embedVersion",
    group: "connection",
    kind: "string",
    default: null,
    env: "HINDSIGHT_EMBED_VERSION",
    editable: true,
    scope: "global",
    summary: {
      en: "Which hindsight-embed version the daemon runs through uvx; latest by default.",
      zh: "daemon \u901A\u8FC7 uvx \u8FD0\u884C\u54EA\u4E2A hindsight-embed \u7248\u672C\uFF0C\u9ED8\u8BA4 latest\u3002"
    }
  },
  {
    key: "embedPackagePath",
    group: "connection",
    kind: "string",
    default: null,
    env: "HINDSIGHT_EMBED_PACKAGE_PATH",
    editable: true,
    scope: "global",
    summary: {
      en: "Use a local hindsight-embed checkout instead of the published version (for development).",
      zh: "\u6539\u7528\u672C\u5730 hindsight-embed checkout \u800C\u4E0D\u662F\u53D1\u5E03\u7248\uFF08\u5F00\u53D1\u7528\uFF09\u3002"
    }
  },
  // ── routing ───────────────────────────────────────────────────────────────────
  {
    key: "bankId",
    group: "routing",
    kind: "string",
    default: null,
    env: "HINDSIGHT_BANK_ID",
    editable: true,
    scope: "bank",
    summary: {
      en: "Pin this bank. Resolution order: mapPathToBank \u2192 this setting \u2192 bankIdTemplate; once it is set, banks are no longer resolved dynamically per repository, unless dynamicBankId is true.",
      zh: "\u56FA\u5B9A\u4F7F\u7528\u8FD9\u4E2A bank\u3002\u89E3\u6790\u987A\u5E8F\uFF1AmapPathToBank \u2192 \u672C\u9879 \u2192 bankIdTemplate\uFF1B\u8BBE\u4E86\u5B83\u5C31\u4E0D\u518D\u6309\u4ED3\u5E93\u52A8\u6001\u5206\u5E93\uFF0C\u9664\u975E dynamicBankId \u4E3A true\u3002"
    }
  },
  {
    key: "dynamicBankId",
    group: "routing",
    kind: "boolean",
    default: null,
    env: "HINDSIGHT_DYNAMIC_BANK_ID",
    editable: true,
    scope: "bank",
    summary: {
      en: "By default it resolves dynamically when bankId is unset. true = resolve dynamically per repository even when bankId is set; false = force static, always using bankId.",
      zh: "\u9ED8\u8BA4\u5728\u672A\u8BBE bankId \u65F6\u52A8\u6001\u89E3\u6790\u3002\u8BBE true\uFF1D\u5373\u4F7F\u8BBE\u4E86 bankId \u4E5F\u6309\u4ED3\u5E93\u52A8\u6001\u5206\u5E93\uFF1B\u8BBE false\uFF1D\u5F3A\u5236\u9759\u6001\uFF0C\u59CB\u7EC8\u7528 bankId\u3002"
    }
  },
  {
    key: "bankIdTemplate",
    group: "routing",
    kind: "string",
    default: "coding-agent::{gitProject}",
    env: "HINDSIGHT_BANK_ID_TEMPLATE",
    editable: true,
    scope: "bank",
    summary: {
      en: "Template for the dynamic bank id; the default is coding-agent::{gitProject} (every agent shares one bank per repository). Placeholders: {gitProject} = the worktree-aware repository name (shared by every worktree of one repository; outside a repository, the name of the directory the session started in), {project} = the current directory name, {harness}, {channel}, {user}. To split per agent, write {harness}-{gitProject}.",
      zh: "\u52A8\u6001 bank id \u7684\u6A21\u677F\uFF0C\u9ED8\u8BA4 coding-agent::{gitProject}\uFF08\u5404 agent \u5171\u4EAB\u540C\u4E00\u4E2A\u4ED3\u5E93 bank\uFF09\u3002\u5360\u4F4D\u7B26\uFF1A{gitProject}\uFF1Dworktree \u611F\u77E5\u7684\u4ED3\u5E93\u540D\uFF08\u540C\u4E00\u4ED3\u5E93\u7684\u6240\u6709 worktree \u5171\u4EAB\uFF1B\u4E0D\u5728\u4ED3\u5E93\u4E2D\u65F6\u53D6\u4F1A\u8BDD\u542F\u52A8\u76EE\u5F55\u540D\uFF09\u3001{project}\uFF1D\u5F53\u524D\u76EE\u5F55\u540D\u3001{harness}\u3001{channel}\u3001{user}\u3002\u60F3\u6309 agent \u5206\u5F00\u5C31\u5199 {harness}-{gitProject}\u3002"
    }
  },
  {
    key: "mapPathToBank",
    group: "routing",
    kind: "json",
    default: null,
    editable: false,
    scope: "path",
    summary: {
      en: "Absolute path \u2192 bank name; the longest prefix wins and it takes highest priority (it can override bankId); linked worktrees inherit the main checkout's mapping. A key\u2192value map, editable only in the config file.",
      zh: "\u7EDD\u5BF9\u8DEF\u5F84 \u2192 bank \u540D\uFF1B\u6700\u957F\u524D\u7F00\u751F\u6548\uFF0C\u4F18\u5148\u7EA7\u6700\u9AD8\uFF08\u53EF\u76D6\u8FC7 bankId\uFF09\uFF0Clinked worktree \u7EE7\u627F\u4E3B\u68C0\u51FA\u7684\u6620\u5C04\u3002\u952E\u503C\u6620\u5C04\uFF0C\u4EC5\u6587\u4EF6\u53EF\u7F16\u8F91\u3002"
    }
  },
  {
    key: "resolveWorktrees",
    group: "routing",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_RESOLVE_WORKTREES",
    editable: true,
    scope: "bank",
    summary: {
      en: "git worktrees share the main repository's bank (on by default).",
      zh: "git worktree \u5171\u7528\u4E3B\u4ED3\u5E93\u7684 bank\uFF08\u9ED8\u8BA4\u5F00\uFF09\u3002"
    }
  },
  // ── recall ────────────────────────────────────────────────────────────────────
  {
    key: "autoInject",
    group: "recall",
    kind: "enum",
    values: ["reflect", "pages", "recall", "none"],
    default: "reflect",
    env: "HINDSIGHT_AUTO_INJECT",
    editable: true,
    scope: "harness",
    summary: {
      en: "What to inject on the first turn: reflect synthesis / knowledge-page search / memory recall / nothing.",
      zh: "\u9996\u8F6E\u6CE8\u5165\u4EC0\u4E48\uFF1Areflect \u5408\u6210 / \u77E5\u8BC6\u9875\u68C0\u7D22 / \u8BB0\u5FC6\u53EC\u56DE / \u4E0D\u6CE8\u5165\u3002"
    }
  },
  {
    key: "autoReflect",
    group: "recall",
    kind: "boolean",
    default: null,
    env: "HINDSIGHT_AUTO_REFLECT",
    editable: false,
    scope: "harness",
    summary: {
      en: "Deprecated, use autoInject; it still applies for compatibility, but only when autoInject is unset.",
      zh: "\u5DF2\u5E9F\u5F03\uFF0C\u6539\u7528 autoInject\uFF1B\u4EC5\u5728\u672A\u8BBE autoInject \u65F6\u517C\u5BB9\u751F\u6548\u3002"
    }
  },
  {
    key: "reflectBudget",
    group: "recall",
    kind: "enum",
    values: ["low", "mid", "high"],
    default: "high",
    env: "HINDSIGHT_REFLECT_BUDGET",
    editable: true,
    scope: "harness",
    summary: {
      en: "The synthesis budget of the hindsight_reflect tool; a high budget on a large bank can hit the server's wall-clock timeout.",
      zh: "hindsight_reflect \u5DE5\u5177\u7684\u5408\u6210\u9884\u7B97\uFF1B\u5927\u5E93\u4E0A\u9AD8\u9884\u7B97\u53EF\u80FD\u649E\u670D\u52A1\u7AEF\u5899\u949F\u8D85\u65F6\u3002"
    }
  },
  {
    key: "reflectTimeoutMs",
    group: "recall",
    kind: "number",
    default: 2e4,
    env: "HINDSIGHT_REFLECT_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Timeout for the automatic session reflect (milliseconds); it has to fit inside the host's hook window.",
      zh: "\u81EA\u52A8\u4F1A\u8BDD reflect \u7684\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09\uFF0C\u8981\u653E\u8FDB\u5BBF\u4E3B\u7684\u94A9\u5B50\u7A97\u53E3\u3002"
    }
  },
  {
    key: "reflectToolTimeoutMs",
    group: "recall",
    kind: "number",
    default: 33e4,
    env: "HINDSIGHT_REFLECT_TOOL_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Timeout of the hindsight_reflect tool itself, deliberately far larger than the automatic reflect.",
      zh: "hindsight_reflect \u5DE5\u5177\u672C\u8EAB\u7684\u8D85\u65F6\uFF0C\u523B\u610F\u8FDC\u5927\u4E8E\u81EA\u52A8 reflect\u3002"
    }
  },
  {
    key: "injectTimeoutMs",
    group: "recall",
    kind: "number",
    default: 7e3,
    env: "HINDSIGHT_INJECT_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Retrieval timeout for knowledge pages / recall injection; it is also the fallback budget after a reflect failure.",
      zh: "knowledge pages / recall \u6CE8\u5165\u7684\u68C0\u7D22\u8D85\u65F6\uFF0C\u4E5F\u662F reflect \u5931\u8D25\u540E\u7684\u56DE\u9000\u9884\u7B97\u3002"
    }
  },
  {
    key: "pageSearchLimit",
    group: "recall",
    kind: "number",
    default: 10,
    env: "HINDSIGHT_PAGE_SEARCH_LIMIT",
    editable: true,
    scope: "harness",
    summary: {
      en: "How many pages one knowledge-page search returns; injection, the fallback and the tool share the same limit.",
      zh: "\u4E00\u6B21\u77E5\u8BC6\u9875\u68C0\u7D22\u8FD4\u56DE\u51E0\u9875\uFF1B\u6CE8\u5165\u3001\u56DE\u9000\u4E0E\u5DE5\u5177\u5171\u7528\u540C\u4E00\u4E2A\u9650\u5236\u3002"
    }
  },
  {
    key: "recallOptions",
    group: "recall",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Overrides merged key by key into every recall request body. Editable only in the config file.",
      zh: "\u9010\u952E\u5408\u5E76\u8FDB\u6BCF\u6B21 recall \u8BF7\u6C42\u4F53\u7684\u8986\u76D6\u9879\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
    }
  },
  {
    key: "toolGuideExtra",
    group: "recall",
    kind: "string",
    default: null,
    env: "HINDSIGHT_TOOL_GUIDE_EXTRA",
    editable: true,
    scope: "harness",
    summary: {
      en: "Custom guidance appended after the built-in tool guide (it only adds, never replaces).",
      zh: "\u8FFD\u52A0\u5728\u5185\u7F6E\u5DE5\u5177\u6307\u5357\u4E4B\u540E\u7684\u81EA\u5B9A\u4E49\u6307\u5F15\uFF08\u53EA\u589E\u4E0D\u66FF\uFF09\u3002"
    }
  },
  {
    key: "pageRefreshEveryTurns",
    group: "recall",
    kind: "number",
    default: 1,
    env: "HINDSIGHT_PAGE_REFRESH_EVERY_TURNS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Refresh the knowledge-page roster once every this many user turns (0 means the same as 1).",
      zh: "\u6BCF\u591A\u5C11\u4E2A\u7528\u6237\u8F6E\u6B21\u5237\u65B0\u4E00\u6B21\u77E5\u8BC6\u9875\u6E05\u5355\uFF080 \u7B49\u540C 1\uFF09\u3002"
    }
  },
  // ── pages ─────────────────────────────────────────────────────────────────────
  {
    key: "pageTriggerType",
    group: "pages",
    kind: "enum",
    values: ["cron", "auto-refresh", "manual"],
    default: "cron",
    env: "HINDSIGHT_PAGE_TRIGGER_TYPE",
    editable: true,
    scope: "harness",
    summary: {
      en: "What triggers a refresh for newly created knowledge pages; auto-refresh is the most current and the most expensive.",
      zh: "\u65B0\u5EFA\u77E5\u8BC6\u9875\u7528\u4EC0\u4E48\u89E6\u53D1\u5237\u65B0\uFF1Bauto-refresh \u6700\u53CA\u65F6\u4E5F\u6700\u8D35\u3002"
    }
  },
  {
    key: "pageTriggerCron",
    group: "pages",
    kind: "string",
    default: "H * * * *",
    env: "HINDSIGHT_PAGE_TRIGGER_CRON",
    editable: true,
    scope: "harness",
    summary: {
      en: "The schedule for cron triggering (UTC, 5 fields); H means hash each page to its own minute.",
      zh: "cron \u89E6\u53D1\u7684\u65F6\u95F4\u8868\uFF08UTC\uFF0C5 \u6BB5\uFF09\uFF1BH \u8868\u793A\u6309\u9875\u540D\u6563\u5217\u5230\u5404\u81EA\u5206\u949F\u3002"
    }
  },
  {
    key: "pages",
    group: "pages",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Reword or disable the built-in knowledge pages, page by page (false disables one, {source_query} replaces its question). Editable only in the config file.",
      zh: "\u9010\u9875\u6539\u5199\u6216\u505C\u7528\u5185\u7F6E\u77E5\u8BC6\u9875\uFF08false \u505C\u7528\uFF0C{source_query} \u6362\u95EE\u9898\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
    }
  },
  {
    key: "customPages",
    group: "pages",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Knowledge pages of your own (name \u2192 {source_query, tags}). Editable only in the config file.",
      zh: "\u4F60\u81EA\u5DF1\u7684\u77E5\u8BC6\u9875\uFF08\u540D\u79F0 \u2192 {source_query, tags}\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
    }
  },
  // ── retention ─────────────────────────────────────────────────────────────────
  {
    key: "retainSessions",
    group: "retention",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_RETAIN_SESSIONS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Whether the transcript is written back after a session ends; with it off, recall and seeding work as before.",
      zh: "\u4F1A\u8BDD\u7ED3\u675F\u540E\u662F\u5426\u5199\u56DE transcript\uFF1B\u5173\u6389\u540E\u53EC\u56DE\u4E0E\u79CD\u5B50\u7167\u5E38\u3002"
    }
  },
  {
    key: "retainTags",
    group: "retention",
    kind: "stringList",
    default: null,
    env: "HINDSIGHT_RETAIN_TAGS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Tags attached to every write-back, e.g. project:{gitProject}, env:work.",
      zh: "\u6BCF\u6B21\u5199\u56DE\u9644\u52A0\u7684\u6807\u7B7E\uFF0C\u4F8B\uFF1Aproject:{gitProject}\u3001env:work\u3002"
    }
  },
  {
    key: "retainMetadata",
    group: "retention",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Metadata attached to every write-back (the same placeholders as retainTags). Editable only in the config file.",
      zh: "\u6BCF\u6B21\u5199\u56DE\u9644\u52A0\u7684\u5143\u6570\u636E\uFF08\u540C retainTags \u7684\u5360\u4F4D\u7B26\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
    }
  },
  {
    key: "retainContext",
    group: "retention",
    kind: "string",
    default: null,
    editable: true,
    scope: "harness",
    summary: {
      en: "The context sent with every write-back; extraction uses it to decide who said a sentence.",
      zh: "\u968F\u6BCF\u6B21\u5199\u56DE\u53D1\u9001\u7684 context\uFF0C\u62BD\u53D6\u636E\u6B64\u5224\u65AD\u4E00\u53E5\u8BDD\u662F\u8C01\u8BF4\u7684\u3002"
    }
  },
  {
    key: "manageBankConfig",
    group: "retention",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_MANAGE_BANK_CONFIG",
    editable: true,
    scope: "bank",
    summary: {
      en: "Let the plugin shape the bank's own configuration incrementally (it only adds, never changes).",
      zh: "\u5141\u8BB8\u63D2\u4EF6\u589E\u91CF\u5851\u9020 bank \u81EA\u8EAB\u914D\u7F6E\uFF08\u53EA\u8865\u4E0D\u6539\uFF09\u3002"
    }
  },
  {
    key: "retainExtractionMode",
    group: "retention",
    kind: "enum",
    values: ["concise", "verbose", "verbatim", "chunks"],
    default: "concise",
    env: "HINDSIGHT_RETAIN_EXTRACTION_MODE",
    editable: true,
    scope: "bank",
    summary: {
      en: "How hard the server extracts memories from what is written back; verbose is finer and more expensive.",
      zh: "\u670D\u52A1\u7AEF\u4ECE\u5199\u56DE\u5185\u5BB9\u91CC\u62BD\u53D6\u8BB0\u5FC6\u7684\u529B\u5EA6\uFF1Bverbose \u66F4\u7EC6\u4E5F\u66F4\u8D35\u3002"
    }
  },
  {
    key: "defaultBankConfig",
    group: "retention",
    kind: "json",
    default: null,
    editable: false,
    scope: "bank",
    summary: {
      en: "Bank-config fields written when a bank is created (except the fields the plugin manages itself). Editable only in the config file.",
      zh: "\u65B0\u5EFA bank \u65F6\u5199\u5165\u7684 bank-config \u5B57\u6BB5\uFF08\u63D2\u4EF6\u81EA\u7BA1\u7684\u5B57\u6BB5\u9664\u5916\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
    }
  },
  {
    key: "observationScopes",
    group: "retention",
    kind: "enum",
    values: ["shared", "combined", "per_tag", "all_combinations", "per_source"],
    default: "shared",
    env: "HINDSIGHT_OBSERVATION_SCOPES",
    editable: true,
    scope: "bank",
    summary: {
      en: "The granularity at which observations are grouped; an explicit two-dimensional array (a literal scope list) can only be written in the config file.",
      zh: "\u5F52\u5E76\u89C2\u5BDF\u7684\u7C92\u5EA6\uFF1B\u663E\u5F0F\u4E8C\u7EF4\u6570\u7EC4\uFF08\u5B57\u9762 scope \u5217\u8868\uFF09\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u5199\u3002"
    }
  },
  {
    key: "maxParallelRetains",
    group: "retention",
    kind: "number",
    default: 10,
    env: "HINDSIGHT_MAX_PARALLEL_RETAINS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Cap on concurrent write-back requests; when the server returns 429, this should be lowered rather than raised.",
      zh: "\u5E76\u53D1\u5199\u56DE\u8BF7\u6C42\u4E0A\u9650\uFF1B\u670D\u52A1\u5668\u8FD4\u56DE 429 \u65F6\u5E94\u8C03\u4F4E\u800C\u4E0D\u662F\u8C03\u9AD8\u3002"
    }
  },
  // ── ingest ────────────────────────────────────────────────────────────────────
  {
    key: "autoSeed",
    group: "ingest",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_AUTO_SEED",
    editable: true,
    scope: "harness",
    summary: {
      en: "Auto-seed from git history on a cold repository's first session.",
      zh: "\u51B7\u4ED3\u5E93\u9996\u6B21\u4F1A\u8BDD\u65F6\u7528 git \u5386\u53F2\u81EA\u52A8\u64AD\u79CD\u3002"
    }
  },
  {
    key: "seedLimit",
    group: "ingest",
    kind: "number",
    default: 300,
    env: "HINDSIGHT_SEED_LIMIT",
    editable: true,
    scope: "harness",
    summary: {
      en: "At most how many of the most recent commits auto-seeding takes.",
      zh: "\u81EA\u52A8\u64AD\u79CD\u6700\u591A\u53D6\u6700\u8FD1\u591A\u5C11\u6761\u63D0\u4EA4\u3002"
    }
  },
  {
    key: "codebaseSurvey",
    group: "ingest",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_CODEBASE_SURVEY",
    editable: true,
    scope: "harness",
    summary: {
      en: "On a cold repository, start a headless claude to survey the code structure.",
      zh: "\u51B7\u4ED3\u5E93\u65F6\u8D77\u4E00\u4E2A\u65E0\u5934 claude \u5DE1\u89C8\u4EE3\u7801\u7ED3\u6784\u3002"
    }
  },
  {
    key: "surveyModel",
    group: "ingest",
    kind: "string",
    default: "haiku",
    env: "HINDSIGHT_SURVEY_MODEL",
    editable: true,
    scope: "harness",
    summary: {
      en: "The model used for the survey (claude -p --model).",
      zh: "\u5DE1\u89C8\u7528\u7684\u6A21\u578B\uFF08claude -p --model\uFF09\u3002"
    }
  },
  {
    key: "surveyBudgetUsd",
    group: "ingest",
    kind: "number",
    default: 2,
    env: "HINDSIGHT_SURVEY_BUDGET_USD",
    editable: true,
    scope: "harness",
    summary: {
      en: "The spend cap for a single survey (US dollars).",
      zh: "\u5355\u6B21\u5DE1\u89C8\u7684\u82B1\u8D39\u4E0A\u9650\uFF08\u7F8E\u5143\uFF09\u3002"
    }
  },
  {
    key: "surveyRefreshCommits",
    group: "ingest",
    kind: "number",
    default: 20,
    env: "HINDSIGHT_SURVEY_REFRESH_COMMITS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Re-run the survey after this many new commits have accrued; 0 means seeding once at cold start only.",
      zh: "\u7D2F\u8BA1\u591A\u5C11\u6761\u65B0\u63D0\u4EA4\u540E\u91CD\u8DD1\u5DE1\u89C8\uFF1B0 \u8868\u793A\u53EA\u5728\u51B7\u542F\u52A8\u64AD\u4E00\u6B21\u3002"
    }
  },
  {
    key: "gitIngest",
    group: "ingest",
    kind: "enum",
    values: ["message", "full", "none"],
    default: "message",
    env: "HINDSIGHT_GIT_INGEST",
    editable: true,
    scope: "harness",
    summary: {
      en: "How git history enters memory: commit messages only / including full diffs / not ingested.",
      zh: "git \u5386\u53F2\u600E\u4E48\u8FDB\u8BB0\u5FC6\uFF1A\u53EA\u63D0\u4EA4\u4FE1\u606F / \u542B\u5B8C\u6574 diff / \u4E0D\u6444\u53D6\u3002"
    }
  },
  {
    key: "autoUpdate",
    group: "ingest",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_AUTO_UPDATE",
    editable: true,
    scope: "harness",
    summary: {
      en: "Self-check daily and update ~/.hindsight/coding-agents in the background; turning it off pins the version.",
      zh: "\u6BCF\u5929\u81EA\u68C0\u5E76\u540E\u53F0\u66F4\u65B0 ~/.hindsight/coding-agents\uFF1B\u5173\u6389\u5373\u9501\u5B9A\u7248\u672C\u3002"
    }
  },
  // ── scope ─────────────────────────────────────────────────────────────────────
  {
    key: "disabled",
    group: "scope",
    kind: "boolean",
    default: false,
    env: "HINDSIGHT_DISABLED",
    editable: true,
    scope: "bank",
    summary: {
      en: "Hard switch: the whole plugin becomes inert where memory is concerned (no bank, no write-back).",
      zh: "\u786C\u5F00\u5173\uFF1A\u6574\u4E2A\u63D2\u4EF6\u5728\u8BB0\u5FC6\u4E0A\u53D8\u4E3A\u60F0\u6027\uFF08\u65E0 bank\u3001\u65E0\u5199\u56DE\uFF09\u3002"
    }
  },
  {
    key: "optInOnly",
    group: "scope",
    kind: "boolean",
    default: false,
    env: "HINDSIGHT_OPT_IN_ONLY",
    editable: true,
    scope: "global",
    summary: {
      en: "Work only in the named directories; projects that are not listed leave no trace at all.",
      zh: "\u53EA\u5728\u88AB\u70B9\u540D\u7684\u76EE\u5F55\u91CC\u5DE5\u4F5C\uFF1B\u672A\u5217\u51FA\u7684\u9879\u76EE\u5B8C\u5168\u4E0D\u7559\u75D5\u3002"
    }
  },
  {
    key: "optInPaths",
    group: "scope",
    kind: "stringList",
    default: null,
    env: "HINDSIGHT_OPT_IN_PATHS",
    editable: true,
    scope: "path",
    summary: {
      en: "The named directories (matched by prefix, ~ supported); each repository beneath them still gets its own bank.",
      zh: "\u70B9\u540D\u7684\u76EE\u5F55\uFF08\u6309\u524D\u7F00\u5339\u914D\uFF0C\u652F\u6301 ~\uFF09\uFF0C\u5176\u4E0B\u6BCF\u4E2A\u4ED3\u5E93\u4ECD\u5404\u81EA\u6210\u5E93\u3002"
    }
  },
  {
    key: "logLevel",
    group: "scope",
    kind: "enum",
    values: ["debug", "info", "warn", "error"],
    default: "info",
    env: "HINDSIGHT_LOG_LEVEL",
    editable: true,
    scope: "harness",
    summary: {
      en: "Plugin log level; HINDSIGHT_LOG_LEVEL can still be used for temporary troubleshooting.",
      zh: "\u63D2\u4EF6\u65E5\u5FD7\u7EA7\u522B\uFF1BHINDSIGHT_LOG_LEVEL \u4ECD\u53EF\u7528\u4E8E\u4E34\u65F6\u6392\u67E5\u3002"
    }
  },
  {
    key: "harness",
    group: "scope",
    kind: "string",
    default: "dsh",
    env: "HINDSIGHT_HARNESS",
    editable: false,
    scope: "harness",
    summary: {
      en: "The runtime adapter identifier. In DSH it is always dsh, written by the host \u2014 do not change it by hand.",
      zh: "\u8FD0\u884C\u65F6\u9002\u914D\u5668\u6807\u8BC6\u3002\u5728 DSH \u91CC\u6052\u4E3A dsh\uFF0C\u7531\u5BBF\u4E3B\u5199\u5165\uFF0C\u4E0D\u8981\u624B\u6539\u3002"
    }
  },
  {
    key: "harnesses",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Override any field per harness (harnesses.dsh / harnesses.claude-code \u2026); it applies after the file's top level and before paths/banks. Editable only in the file.",
      zh: "\u6309 harness \u8986\u76D6\u4EFB\u610F\u5B57\u6BB5\uFF08harnesses.dsh / harnesses.claude-code \u2026\uFF09\uFF0C\u5728\u6587\u4EF6\u9876\u5C42\u4E4B\u540E\u3001paths/banks \u4E4B\u524D\u751F\u6548\u3002\u4EC5\u6587\u4EF6\u53EF\u7F16\u8F91\u3002"
    }
  },
  {
    key: "banks",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "bank",
    summary: {
      en: `Override by resolved bank id: it applies after bank resolution, so moving a repository elsewhere does not affect it. Any behavioural field can be overridden; a bank may merge several ids into one bank (single hop, literal, and the target's own section no longer takes part). Bank-resolution fields (bankId / mapPathToBank / bank / optInOnly / optInPaths) are ignored inside this section. This page edits it through the "By project (banks)" tab.`,
      zh: "\u6309\u3010\u5DF2\u89E3\u6790\u7684 bank id\u3011\u8986\u76D6\uFF1A\u8BE5\u9879\u5728 bank \u89E3\u6790\u4E4B\u540E\u751F\u6548\uFF0C\u6240\u4EE5\u4ED3\u5E93\u6362\u76EE\u5F55\u4E5F\u4E0D\u53D7\u5F71\u54CD\u3002\u4EFB\u4F55\u884C\u4E3A\u5B57\u6BB5\u90FD\u80FD\u8986\u76D6\uFF1Bbank \u53EF\u628A\u591A\u4E2A id \u5408\u5E76\u5230\u4E00\u4E2A bank\uFF08\u5355\u8DF3\u3001\u5B57\u9762\u91CF\uFF0C\u76EE\u6807\u81EA\u8EAB\u7684\u6BB5\u4E0D\u518D\u53C2\u4E0E\uFF09\u3002bank \u89E3\u6790\u7C7B\u5B57\u6BB5\uFF08bankId / mapPathToBank / bank / optInOnly / optInPaths\uFF09\u5728\u6B64\u6BB5\u5185\u88AB\u5FFD\u7565\u3002\u672C\u9875\u7528\u300C\u6309\u9879\u76EE\uFF08banks\uFF09\u300D\u6807\u7B7E\u9875\u7F16\u8F91\u3002"
    }
  },
  {
    key: "paths",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "path",
    summary: {
      en: "Override connection settings (serverMode / apiUrl / apiPort / apiToken and so on) by absolute path prefix; the longest prefix wins. It applies after bank resolution and before banks.<id>, so a bank section for the same repository still overrides it. Editable only in the file.",
      zh: "\u6309\u3010\u7EDD\u5BF9\u8DEF\u5F84\u524D\u7F00\u3011\u8986\u76D6\u8FDE\u63A5\u7C7B\u8BBE\u7F6E\uFF08serverMode / apiUrl / apiPort / apiToken \u7B49\uFF09\uFF0C\u6700\u957F\u524D\u7F00\u751F\u6548\uFF1B\u5728 bank \u89E3\u6790\u4E4B\u540E\u3001banks.<id> \u4E4B\u524D\u751F\u6548\uFF0C\u6240\u4EE5\u540C\u4E00\u4ED3\u5E93\u7684 bank \u6BB5\u4ECD\u4F1A\u76D6\u8FC7\u5B83\u3002\u4EC5\u6587\u4EF6\u53EF\u7F16\u8F91\u3002"
    }
  }
];
var EDITABLE_FIELDS = CONFIG_FIELDS.filter(
  (field) => field.editable
);

// src/client/model.ts
var EN = {
  title: "Hindsight memory settings",
  "loading.text": "Reading the host configuration\u2026",
  "unset.text": "Not set",
  "unset.optionPrefix": "Not set (default {value})",
  "tabs.banks.title": "Per project (banks)",
  "tabs.banks.summary": "Override settings for an individual bank / repository; every other bank keeps the top-level value.",
  "group.empty": "No settings in this group.",
  "field.chip.editable": "Editable",
  "field.chip.readOnly": "Read-only",
  "field.chip.inFile": "Set in the file",
  "field.chip.notInFile": "Not set in the file",
  "field.placeholder.secretSet": "Set (value never shown) \xB7 leave empty = keep it",
  "field.placeholder.list": "One per line; comma-separated also accepted",
  "field.secretHint": "A secret never travels back over the API: leave the box empty to keep it, type a new value to replace it, or press \u201CClear\u201D and save to remove the key.",
  "field.clearInFile": "Clear (removes the key on save)",
  "field.clearUnsetStored": "{value} (removes the key on save)",
  "field.clearNotInFile": "Clear (the file does not set it)",
  "errors.readFailed": "Could not read the configuration: {message}",
  "errors.saveFailed": "Could not save: {message}",
  "errors.badFormat": "The settings payload from the host is not recognizable (path / fields missing).",
  "errors.invalidFields": "{count} field(s) are invalid and were not submitted: {messages}",
  "errors.invalidFieldsShort": "{count} field(s) are invalid and will not be submitted: {messages}",
  "errors.parseNumber": "{key} expects a number but received \u201C{value}\u201D.",
  "errors.parseBoolean": "{key} accepts only true or false.",
  "errors.parseEnum": "{key} accepts only {values}.",
  "errors.enumSeparator": " / ",
  "errors.parseJson": "{key} is not valid JSON.",
  "errors.unparsableFile": "The configuration file exists but cannot be parsed, so this page will not write to it and overwrite it: {message}",
  "notices.discarded": "Unsaved changes discarded.",
  "notices.nothingToSave": "There is nothing to save.",
  "notice.saved": "Saved to {path}: {parts}.",
  "notice.unchanged": "The file did not change, so nothing was written.",
  "notice.writes": "wrote or updated {count} setting(s)",
  "notice.removals": "removed {count} setting(s) (falling back to the environment variable, then the plugin default)",
  "notice.touched": "updated {path}",
  "page.fileIntro": "This page reads and writes the configuration file the host is currently using:",
  "page.blankHint": "Leaving a cell empty and saving = removing that key, after which the setting falls back to the environment variable and then to the plugin default.",
  "source.inFile": "From the configuration file",
  "source.defaultTop": "Not written to the file; showing the default {value}",
  "source.defaultBank": "This bank does not override the setting; showing the default {value} (removing it falls back to the top level).",
  "fallback.line": "The file does not set this; what actually applies: {parts}.",
  "fallback.none": "no upstream default",
  "fallback.default": "default {value}",
  "fallback.env": "environment variable {env}",
  "shadow.text": "harnesses.dsh sets this too, and it wins over the top-level value written here \u2014 saving on this page will not change the value actually in effect.",
  "readonly.text": "This setting is a file-only nested structure or a host-stamped field that the form cannot express safely, so it can only be edited in the configuration file.",
  "scope.global": "Global",
  "scope.harness": "Per harness",
  "scope.bank": "Per bank",
  "scope.path": "Per path",
  "scope.top": "Top level",
  "banks.scopeText": "banks.<id> overrides the settings for that bank (the top level still applies to the other banks); removing a key inside a bank falls back to the top level.",
  "banks.pathsReadOnly": "paths overrides by absolute directory prefix (paths.<dir>); it is normally not hand-written, so this page only lists the sections the file already has \u2014 edit them in the configuration file.",
  "banks.title": "Existing banks",
  "banks.count": "{count}",
  "banks.empty": "The file has no banks section yet.",
  "banks.keysCount": "{count} key(s)",
  "banks.keysSet": "Set: {keys}",
  "banks.keySeparator": ", ",
  "banks.open": "Open",
  "banks.close": "Collapse",
  "banks.newPlaceholder": "New bank id, for example coding-agent::my-repo",
  "banks.newAria": "New bank id",
  "banks.add": "Add",
  "banks.addEmpty": "Enter a bank id (it cannot be empty).",
  "banks.addExists": "banks.{id} already exists \u2014 open it from the list above.",
  "banks.editTitle": "Edit banks.{id}",
  "banks.newSection": "New section",
  "banks.newSectionNote": "This section is created in the file only once you save.",
  "banks.closeEditor": "Close",
  "banks.pathsTitle": "By path (paths)",
  "banks.pathsReadOnlyChip": "Read-only",
  "banks.pathKeysSuffix": " \xB7 {count} key(s)",
  "banks.pathKeysList": " \xB7 {count} key(s): {keys}",
  "editor.countAndPath": "{count} setting(s) \xB7 file: {path}",
  "editor.saveTo": "Save to banks.{id}",
  "actions.save": "Save",
  "actions.saveTo": "Save to banks.{id}",
  "actions.saving": "Saving\u2026",
  "actions.saveCount": "{label} ({count})",
  "actions.discard": "Discard changes",
  "actions.reloading": "Reloading\u2026",
  "actions.reload": "Reload",
  "counts.fieldsAndGroups": "{count} setting(s) \xB7 {groups} group(s)",
  "unavailable.noRemote": "The host offers no Remote service (ctx.remote is absent), so this page cannot read or write the configuration. Check that the client half of dsh-api-gateway is loaded.",
  "unavailable.noNamespace": "The Remote contribution was submitted, but the host did not mount {service}. Check that dsh-api-gateway is serving that namespace.",
  "unavailable.mountFailed": "Mounting the Remote contribution failed: {message}",
  "unavailable.initFailed": "Initialization failed: {message}",
  "help.toggleOpen": "Collapse \u201CHow is the bank resolved?\u201D",
  "help.toggleClosed": "Not sure how to set this up? How the bank is resolved (expand)",
  "help.a.title": "One bank per repository",
  "help.a.line1": "Memory is isolated per repository. The plugin resolves the bank from the [current working directory], in this order (first match wins):",
  "help.a.line2": "\u2460 mapPathToBank \u2014 the longest prefix of the absolute path; it has the highest priority and beats bankId; a linked worktree inherits the main checkout's mapping.",
  "help.a.line3": "\u2461 Static \u2014 a bankId is set (or dynamicBankId is false).",
  "help.a.line4": "\u2462 Dynamic \u2014 generated from bankIdTemplate, by default coding-agent::{gitProject}.",
  "help.b.title": "Is a bank something I create by hand? No",
  "help.b.line1": "bankIdTemplate only [computes the id] from the template; the bank is created by the plugin the first time it runs an agent in that repository, along with its baseline config. The documentation says: a new repo an agent touches spawns a new bank; defaultBankConfig \u201Ctravels in the same import that creates the bank\u201D.",
  "help.b.line2": "Each session start only fills in what is missing (the first step of the bundled deepen engine is bank configuration), so a bank appearing in a repository needs no manual work.",
  "help.b.line3": "The other way round: with optInOnly on, projects that are not listed in optInPaths [never get a bank at all] (no bank is created), and nothing is recorded there.",
  "help.b.line4": "defaultBankConfig decides the baseline a new bank is born with (by default the server values: automatic consolidation on, observations on, mental-model refresh floor 60s); manageBankConfig: false stops the plugin from touching that bank's own config at all. Writes are [incremental] and do not overwrite values you tuned in the console.",
  "help.b.line5": "To confirm that the bank was created and the sync finished: use hindsight_sync_status (a finished sync reports synced: true), or look for seed_started in ~/.hindsight/coding-agents-logs/diag.jsonl.",
  "help.c.title": "bankIdTemplate placeholders",
  "help.c.line1": "{gitProject} \u2014 the worktree-aware repository name: every worktree of one repository shares one bank; outside a repository it takes the name of the session's starting directory.",
  "help.c.line2": "{project} \u2014 the current directory name; {harness} \u2014 the entry point that made the call (dsh / claude-code / codex \u2026).",
  "help.c.line3": "{channel} / {user} \u2014 from $HINDSIGHT_CHANNEL_ID / $HINDSIGHT_USER_ID.",
  "help.c.line4": "The default template is harness-neutral, so every agent shares the same repository bank; write {harness}-{gitProject} to separate them per agent.",
  "help.d.title": "Who overrides whom (the later one wins)",
  "help.d.line1": "built-in defaults \u2192 environment variables \u2192 file top level \u2192 harnesses.<name> \u2192 paths.<prefix> \u2192 banks.<resolved id>.",
  "help.d.line2": "mapPathToBank, harnesses, paths, banks and retainMetadata are key-value maps and can only be written in the file.",
  "help.e.title": "This tab edits banks.<id>",
  "help.e.line1": "It selects by [resolved bank id] and takes effect after resolution \u2014 so a moved repository still matches.",
  "help.e.line2": "Any behavior field can be overridden here; a bank field can merge several ids into one bank (single hop, literal, and the target's own section no longer participates).",
  "help.e.line3": "Bank-resolution fields (bankId / mapPathToBank / bank / optInOnly / optInPaths) are ignored when written inside a bank section.",
  "help.e.line4": 'Example: {"banks": {"coding-agent::backend": {"bank": "team::product"}, "coding-agent::frontend": {"bank": "team::product"}}}',
  "help.f.title": "paths.<prefix> and common recipes",
  "help.f.line1": "paths overrides connection settings by directory prefix (serverMode / apiUrl / apiPort / apiToken); it takes effect after resolution and before banks.<id>, so a bank section can still override it. This page only lists them \u2014 edit the file.",
  "help.f.line2": 'Group a set of repositories into one bank by [directory]: {"mapPathToBank": {"/Users/me/work/client-x": "client-x-memory"}}',
  "help.f.line3": "Group a hand-picked set of repositories into one bank by [id]: use the banks example above.",
  "help.g.title": "How do I find out which bank id is actually mine?",
  "help.g.line1": "The upstream v2 plugin writes the seed / session banner into the plugin log: ~/.hindsight/coding-agents-logs/plugin.log (the log carries bank=<id>).",
  "help.g.line2": "Setting logLevel to debug records a more detailed trace; the structured events are in diag.jsonl in the same directory.",
  "help.g.line3": "The authoritative description is the Bank resolution section of hindsight-integrations/coding-agents/README.md."
};
var ZH = {
  title: "Hindsight \u8BB0\u5FC6\u8BBE\u7F6E",
  "loading.text": "\u6B63\u5728\u8BFB\u53D6\u5BBF\u4E3B\u914D\u7F6E\u2026",
  "unset.text": "\u672A\u8BBE\u7F6E",
  "unset.optionPrefix": "\u672A\u8BBE\u7F6E\uFF08\u9ED8\u8BA4 {value}\uFF09",
  "tabs.banks.title": "\u6309\u9879\u76EE\uFF08banks\uFF09",
  "tabs.banks.summary": "\u4E3A\u5355\u4E2A bank / \u4ED3\u5E93\u8986\u76D6\u8BBE\u7F6E\uFF0C\u5176\u4F59 bank \u4ECD\u7528\u9876\u5C42\u503C\u3002",
  "group.empty": "\u672C\u7EC4\u6682\u65E0\u914D\u7F6E\u9879\u3002",
  "field.chip.editable": "\u53EF\u7F16\u8F91",
  "field.chip.readOnly": "\u53EA\u8BFB",
  "field.chip.inFile": "\u6587\u4EF6\u5DF2\u8BBE\u7F6E",
  "field.chip.notInFile": "\u6587\u4EF6\u672A\u8BBE\u7F6E",
  "field.placeholder.secretSet": "\u5DF2\u8BBE\u7F6E\uFF08\u4E0D\u663E\u793A\u660E\u6587\uFF09\xB7 \u7559\u7A7A\uFF1D\u4E0D\u6539\u52A8",
  "field.placeholder.list": "\u4E00\u884C\u4E00\u4E2A\uFF1B\u4E5F\u63A5\u53D7\u9017\u53F7\u5206\u9694",
  "field.secretHint": "\u5BC6\u94A5\u4E0D\u968F\u63A5\u53E3\u4E0B\u53D1\uFF1A\u7559\u7A7A\uFF1D\u4E0D\u6539\u52A8\uFF0C\u8F93\u5165\u65B0\u503C\uFF1D\u8986\u76D6\uFF0C\u70B9\u300C\u6E05\u7A7A\u300D\u4FDD\u5B58\u540E\u5220\u9664\u8BE5\u952E\u3002",
  "field.clearInFile": "\u6E05\u7A7A\uFF08\u4FDD\u5B58\u540E\u5220\u9664\u8BE5\u952E\uFF09",
  "field.clearUnsetStored": "{value}\uFF08\u4FDD\u5B58\u540E\u5220\u9664\u8BE5\u952E\uFF09",
  "field.clearNotInFile": "\u6E05\u7A7A\uFF08\u6587\u4EF6\u4E2D\u6CA1\u6709\u8FD9\u4E00\u9879\uFF09",
  "errors.readFailed": "\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1A{message}",
  "errors.saveFailed": "\u4FDD\u5B58\u5931\u8D25\uFF1A{message}",
  "errors.badFormat": "\u5BBF\u4E3B\u8FD4\u56DE\u7684\u8BBE\u7F6E\u6570\u636E\u683C\u5F0F\u65E0\u6CD5\u8BC6\u522B\uFF08\u7F3A\u5C11 path / fields\uFF09\u3002",
  "errors.invalidFields": "\u6709 {count} \u4E2A\u5B57\u6BB5\u4E0D\u5408\u6CD5\uFF0C\u672A\u63D0\u4EA4\uFF1A{messages}",
  "errors.invalidFieldsShort": "\u6709 {count} \u4E2A\u5B57\u6BB5\u4E0D\u5408\u6CD5\uFF0C\u4E0D\u4F1A\u63D0\u4EA4\uFF1A{messages}",
  "errors.parseNumber": "{key} \u9700\u8981\u4E00\u4E2A\u6570\u5B57\uFF0C\u6536\u5230\u300C{value}\u300D\u3002",
  "errors.parseBoolean": "{key} \u53EA\u63A5\u53D7 true \u6216 false\u3002",
  "errors.parseEnum": "{key} \u53EA\u63A5\u53D7 {values}\u3002",
  "errors.enumSeparator": " / ",
  "errors.parseJson": "{key} \u4E0D\u662F\u5408\u6CD5\u7684 JSON\u3002",
  "errors.unparsableFile": "\u914D\u7F6E\u6587\u4EF6\u5B58\u5728\u4F46\u65E0\u6CD5\u89E3\u6790\uFF0C\u672C\u9875\u4E0D\u4F1A\u5199\u5165\u4EE5\u514D\u8986\u76D6\u5B83\uFF1A{message}",
  "notices.discarded": "\u5DF2\u4E22\u5F03\u672A\u4FDD\u5B58\u7684\u6539\u52A8\u3002",
  "notices.nothingToSave": "\u6CA1\u6709\u9700\u8981\u4FDD\u5B58\u7684\u6539\u52A8\u3002",
  "notice.saved": "\u5DF2\u4FDD\u5B58\u5230 {path}\uFF1A{parts}\u3002",
  "notice.unchanged": "\u6587\u4EF6\u6CA1\u6709\u53D8\u5316\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u6539\u52A8\u3002",
  "notice.writes": "\u5199\u5165\u6216\u66F4\u65B0 {count} \u9879",
  "notice.removals": "\u5220\u9664 {count} \u9879\uFF08\u56DE\u9000\u5230\u73AF\u5883\u53D8\u91CF\uFF0C\u7136\u540E\u56DE\u9000\u5230\u63D2\u4EF6\u9ED8\u8BA4\u503C\uFF09",
  "notice.touched": "\u5DF2\u66F4\u65B0 {path}",
  "page.fileIntro": "\u672C\u9875\u76F4\u63A5\u8BFB\u5199\u5BBF\u4E3B\u5F53\u524D\u4F7F\u7528\u7684\u914D\u7F6E\u6587\u4EF6\uFF1A",
  "page.blankHint": "\u7559\u7A7A\u5E76\u4FDD\u5B58\uFF1D\u5220\u9664\u8BE5\u952E\uFF0C\u8BE5\u9879\u968F\u5373\u56DE\u9000\u5230\u73AF\u5883\u53D8\u91CF\uFF0C\u518D\u56DE\u9000\u5230\u63D2\u4EF6\u9ED8\u8BA4\u503C\u3002",
  "source.inFile": "\u6765\u81EA\u914D\u7F6E\u6587\u4EF6",
  "source.defaultTop": "\u672A\u5199\u5165\u6587\u4EF6\uFF1B\u663E\u793A\u7684\u662F\u9ED8\u8BA4\u503C {value}",
  "source.defaultBank": "\u672C bank \u672A\u8986\u76D6\u8BE5\u9879\uFF1B\u663E\u793A\u7684\u662F\u9ED8\u8BA4\u503C {value}\uFF08\u5220\u9664\u540E\u56DE\u9000\u5230\u9876\u5C42\uFF09\u3002",
  "fallback.line": "\u6587\u4EF6\u672A\u8BBE\u7F6E\u8BE5\u9879\uFF0C\u5B9E\u9645\u751F\u6548\uFF1A{parts}\u3002",
  "fallback.none": "\u4E0A\u6E38\u9ED8\u8BA4\u672A\u8BBE\u503C",
  "fallback.default": "\u9ED8\u8BA4 {value}",
  "fallback.env": "\u73AF\u5883\u53D8\u91CF {env}",
  "shadow.text": "harnesses.dsh \u4E5F\u8BBE\u7F6E\u4E86\u8FD9\u4E00\u9879\uFF0C\u5B83\u4F18\u5148\u4E8E\u672C\u9875\u5199\u5165\u7684\u9876\u5C42\u503C\u2014\u2014\u5728\u8FD9\u91CC\u4FDD\u5B58\u4E0D\u4F1A\u6539\u53D8\u5B9E\u9645\u751F\u6548\u7684\u503C\u3002",
  "readonly.text": "\u8BE5\u9879\u662F\u6587\u4EF6\u4E13\u5C5E\u7684\u5D4C\u5957\u7ED3\u6784\u6216\u5BBF\u4E3B\u76D6\u7AE0\u5B57\u6BB5\uFF0C\u8868\u5355\u65E0\u6CD5\u5B89\u5168\u8868\u8FBE\uFF0C\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002",
  "scope.global": "\u5168\u5C40",
  "scope.harness": "\u6309 harness",
  "scope.bank": "\u6309 bank",
  "scope.path": "\u6309\u8DEF\u5F84",
  "scope.top": "\u9876\u5C42",
  "banks.scopeText": "banks.<id> \u8986\u76D6\u8BE5 bank \u7684\u8BBE\u7F6E\uFF08\u9876\u5C42\u4ECD\u5BF9\u5176\u4F59 bank \u751F\u6548\uFF09\uFF1B\u4E00\u4E2A bank \u91CC\u7684\u952E\u5220\u9664\u540E\u4F1A\u56DE\u9000\u5230\u9876\u5C42\u3002",
  "banks.pathsReadOnly": "paths \u6309\u7EDD\u5BF9\u76EE\u5F55\u524D\u7F00\u8986\u76D6\uFF08paths.<\u76EE\u5F55>\uFF09\uFF0C\u901A\u5E38\u4E0D\u624B\u5199\uFF0C\u56E0\u6B64\u672C\u9875\u53EA\u5217\u51FA\u6587\u4EF6\u91CC\u5DF2\u6709\u7684\u6BB5\u843D\uFF0C\u8BF7\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u7F16\u8F91\u3002",
  "banks.title": "\u5DF2\u6709 bank",
  "banks.count": "{count} \u4E2A",
  "banks.empty": "\u6587\u4EF6\u91CC\u8FD8\u6CA1\u6709 banks \u6BB5\u843D\u3002",
  "banks.keysCount": "{count} \u4E2A\u952E",
  "banks.keysSet": "\u5DF2\u8BBE\u7F6E\uFF1A{keys}",
  "banks.keySeparator": "\u3001",
  "banks.open": "\u6253\u5F00",
  "banks.close": "\u6536\u8D77",
  "banks.newPlaceholder": "\u65B0\u589E bank id\uFF0C\u4F8B\u5982 coding-agent::my-repo",
  "banks.newAria": "\u65B0\u589E bank id",
  "banks.add": "\u65B0\u589E",
  "banks.addEmpty": "\u8BF7\u8F93\u5165 bank id\uFF08\u4E0D\u80FD\u4E3A\u7A7A\uFF09\u3002",
  "banks.addExists": "banks.{id} \u5DF2\u7ECF\u5B58\u5728\uFF0C\u8BF7\u76F4\u63A5\u4ECE\u4E0A\u9762\u7684\u5217\u8868\u6253\u5F00\u3002",
  "banks.editTitle": "\u7F16\u8F91 banks.{id}",
  "banks.newSection": "\u65B0\u6BB5\u843D",
  "banks.newSectionNote": "\u4FDD\u5B58\u540E\u624D\u4F1A\u5728\u6587\u4EF6\u91CC\u521B\u5EFA\u8FD9\u4E00\u6BB5\u3002",
  "banks.closeEditor": "\u5173\u95ED",
  "banks.pathsTitle": "\u6309\u8DEF\u5F84\uFF08paths\uFF09",
  "banks.pathsReadOnlyChip": "\u53EA\u8BFB",
  "banks.pathKeysSuffix": " \xB7 {count} \u4E2A\u952E",
  "banks.pathKeysList": " \xB7 {count} \u4E2A\u952E\uFF1A{keys}",
  "editor.countAndPath": "{count} \u4E2A\u914D\u7F6E\u9879 \xB7 \u6587\u4EF6\uFF1A{path}",
  "editor.saveTo": "\u4FDD\u5B58\u5230 banks.{id}",
  "actions.save": "\u4FDD\u5B58",
  "actions.saveTo": "\u4FDD\u5B58\u5230 banks.{id}",
  "actions.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "actions.saveCount": "{label}\uFF08{count} \u9879\uFF09",
  "actions.discard": "\u64A4\u9500\u4FEE\u6539",
  "actions.reloading": "\u91CD\u65B0\u8BFB\u53D6\u4E2D\u2026",
  "actions.reload": "\u91CD\u65B0\u8BFB\u53D6",
  "counts.fieldsAndGroups": "{count} \u4E2A\u914D\u7F6E\u9879 \xB7 \u5206\u7EC4 {groups} \u4E2A",
  "unavailable.noRemote": "\u5BBF\u4E3B\u6CA1\u6709\u63D0\u4F9B Remote \u670D\u52A1\uFF08ctx.remote \u4E0D\u5B58\u5728\uFF09\uFF0C\u672C\u9875\u65E0\u6CD5\u8BFB\u5199\u914D\u7F6E\u3002\u8BF7\u786E\u8BA4 dsh-api-gateway \u7684\u5BA2\u6237\u7AEF\u534A\u8FB9\u5DF2\u52A0\u8F7D\u3002",
  "unavailable.noNamespace": "Remote \u8D21\u732E\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u5BBF\u4E3B\u6CA1\u6709\u6302\u8F7D {service}\u3002\u8BF7\u786E\u8BA4 dsh-api-gateway \u6B63\u5728\u670D\u52A1\u8BE5\u547D\u540D\u7A7A\u95F4\u3002",
  "unavailable.mountFailed": "Remote \u8D21\u732E\u6302\u8F7D\u5931\u8D25\uFF1A{message}",
  "unavailable.initFailed": "\u521D\u59CB\u5316\u5931\u8D25\uFF1A{message}",
  "help.toggleOpen": "\u6536\u8D77\u300Cbank \u662F\u600E\u4E48\u89E3\u6790\u7684\u300D",
  "help.toggleClosed": "\u4E0D\u77E5\u9053\u600E\u4E48\u8BBE\u7F6E\uFF1Fbank \u662F\u600E\u4E48\u89E3\u6790\u7684\uFF08\u5C55\u5F00\u8BF4\u660E\uFF09",
  "help.a.title": "\u4E00\u4E2A\u4ED3\u5E93\u4E00\u4E2A bank",
  "help.a.line1": "\u8BB0\u5FC6\u6309\u4ED3\u5E93\u9694\u79BB\u3002\u63D2\u4EF6\u6309\u3010\u5F53\u524D\u5DE5\u4F5C\u76EE\u5F55\u3011\u89E3\u6790 bank\uFF0C\u987A\u5E8F\u5982\u4E0B\uFF08\u5148\u547D\u4E2D\u8005\u80DC\uFF09\uFF1A",
  "help.a.line2": "\u2460 mapPathToBank \u2014\u2014 \u7EDD\u5BF9\u8DEF\u5F84\u7684\u6700\u957F\u524D\u7F00\uFF1B\u4F18\u5148\u7EA7\u6700\u9AD8\uFF0C\u80FD\u76D6\u8FC7 bankId\uFF1Blinked worktree \u7EE7\u627F\u4E3B\u68C0\u51FA\u7684\u6620\u5C04\u3002",
  "help.a.line3": "\u2461 \u9759\u6001 \u2014\u2014 \u8BBE\u4E86 bankId\uFF08\u6216\u628A dynamicBankId \u8BBE\u4E3A false\uFF09\u3002",
  "help.a.line4": "\u2462 \u52A8\u6001 \u2014\u2014 \u7528 bankIdTemplate \u751F\u6210\uFF0C\u9ED8\u8BA4 coding-agent::{gitProject}\u3002",
  "help.b.title": "bank \u9700\u8981\u6211\u624B\u5DE5\u5EFA\u5417\uFF1F\u4E0D\u9700\u8981",
  "help.b.line1": "bankIdTemplate \u53EA\u8D1F\u8D23\u6309\u6A21\u677F\u3010\u7B97\u51FA id\u3011\uFF1Bbank \u7531\u63D2\u4EF6\u5728\u8BE5\u4ED3\u5E93\u7B2C\u4E00\u6B21\u8DD1 agent \u65F6\u81EA\u52A8\u521B\u5EFA\uFF0C\u5E76\u987A\u5E26\u5199\u5165\u5B83\u7684\u57FA\u7EBF\u914D\u7F6E\u3002\u6587\u6863\u539F\u6587\uFF1Aa new repo an agent touches spawns a new bank\uFF1BdefaultBankConfig \u201Ctravels in the same import that creates the bank\u201D\u3002",
  "help.b.line2": "\u6BCF\u6B21\u4F1A\u8BDD\u542F\u52A8\u53EA\u505A\u7F3A\u7684\u90E8\u5206\uFF08bundled deepen \u5F15\u64CE\u7684\u7B2C\u4E00\u6B65\u5C31\u662F bank configuration\uFF09\uFF0C\u6240\u4EE5\u4ED3\u5E93\u91CC\u65B0\u51FA\u73B0\u4E00\u4E2A bank \u4E0D\u9700\u8981\u4EFB\u4F55\u624B\u5DE5\u64CD\u4F5C\u3002",
  "help.b.line3": "\u53CD\u8FC7\u6765\u8BF4\uFF1AoptInOnly \u6253\u5F00\u540E\uFF0C\u672A\u5217\u5165 optInPaths \u7684\u9879\u76EE\u3010\u6839\u672C\u4E0D\u4F1A\u5EFA\u5E93\u3011\uFF08no bank is created\uFF09\uFF0C\u90A3\u91CC\u4EC0\u4E48\u90FD\u4E0D\u8BB0\u3002",
  "help.b.line4": "defaultBankConfig \u51B3\u5B9A\u65B0\u5E93\u51FA\u751F\u65F6\u7684\u57FA\u7EBF\uFF08\u9ED8\u8BA4\u662F\u670D\u52A1\u7AEF\u503C\uFF1A\u81EA\u52A8\u6574\u5408\u5F00\u3001observations \u5F00\u3001\u5FC3\u667A\u6A21\u578B\u5237\u65B0\u4E0B\u9650 60s\uFF09\uFF1BmanageBankConfig: false \u5219\u8BA9\u63D2\u4EF6\u5B8C\u5168\u4E0D\u78B0\u8BE5\u5E93\u81EA\u8EAB\u7684\u914D\u7F6E\u3002\u5199\u5165\u662F\u3010\u589E\u91CF\u3011\u7684\uFF0C\u4E0D\u4F1A\u8986\u76D6\u4F60\u5728\u63A7\u5236\u53F0\u91CC\u8C03\u8FC7\u7684\u503C\u3002",
  "help.b.line5": "\u8981\u786E\u8BA4\u5EFA\u5E93\u4E0E\u540C\u6B65\u662F\u5426\u5B8C\u6210\uFF1A\u7528 hindsight_sync_status\uFF08\u540C\u6B65\u597D\u4E86\u4F1A\u62A5 synced: true\uFF09\uFF0C\u6216\u5728 ~/.hindsight/coding-agents-logs/diag.jsonl \u91CC\u770B seed_started\u3002",
  "help.c.title": "bankIdTemplate \u7684\u5360\u4F4D\u7B26",
  "help.c.line1": "{gitProject} \u2014\u2014 worktree \u611F\u77E5\u7684\u4ED3\u5E93\u540D\uFF1A\u540C\u4E00\u4ED3\u5E93\u7684\u6240\u6709 worktree \u5171\u7528\u4E00\u4E2A bank\uFF1B\u4E0D\u5728\u4ED3\u5E93\u91CC\u65F6\uFF0C\u53D6\u4F1A\u8BDD\u542F\u52A8\u76EE\u5F55\u7684\u540D\u5B57\u3002",
  "help.c.line2": "{project} \u2014\u2014 \u5F53\u524D\u76EE\u5F55\u540D\uFF1B{harness} \u2014\u2014 \u53D1\u8D77\u8C03\u7528\u7684\u5165\u53E3\uFF08dsh / claude-code / codex \u2026\uFF09\u3002",
  "help.c.line3": "{channel} / {user} \u2014\u2014 \u6765\u81EA $HINDSIGHT_CHANNEL_ID / $HINDSIGHT_USER_ID\u3002",
  "help.c.line4": "\u9ED8\u8BA4\u6A21\u677F\u5BF9 harness \u4E2D\u7ACB\uFF0C\u6240\u4EE5\u5404 agent \u5171\u4EAB\u540C\u4E00\u4E2A\u4ED3\u5E93 bank\uFF1B\u60F3\u6309 agent \u5206\u5F00\u5C31\u5199 {harness}-{gitProject}\u3002",
  "help.d.title": "\u8C01\u76D6\u8FC7\u8C01\uFF08\u540E\u8005\u80DC\uFF09",
  "help.d.line1": "\u5185\u7F6E\u9ED8\u8BA4\u503C \u2192 \u73AF\u5883\u53D8\u91CF \u2192 \u6587\u4EF6\u9876\u5C42 \u2192 harnesses.<name> \u2192 paths.<\u524D\u7F00> \u2192 banks.<\u5DF2\u89E3\u6790 id>\u3002",
  "help.d.line2": "mapPathToBank\u3001harnesses\u3001paths\u3001banks\u3001retainMetadata \u662F\u952E\u503C\u6620\u5C04\uFF0C\u53EA\u80FD\u5199\u5728\u6587\u4EF6\u91CC\u3002",
  "help.e.title": "\u672C\u6807\u7B7E\u9875\u6539\u7684\u662F banks.<id>",
  "help.e.line1": "\u5B83\u6309\u3010\u5DF2\u89E3\u6790\u7684 bank id\u3011\u9009\u4E2D\uFF0C\u5E76\u5728\u89E3\u6790\u4E4B\u540E\u751F\u6548 \u2014\u2014 \u6240\u4EE5\u4ED3\u5E93\u642C\u5230\u522B\u5904\u4E5F\u4F9D\u7136\u547D\u4E2D\u3002",
  "help.e.line2": "\u4EFB\u4F55\u884C\u4E3A\u5B57\u6BB5\u90FD\u80FD\u5728\u6B64\u8986\u76D6\uFF1Bbank \u5B57\u6BB5\u53EF\u4EE5\u628A\u591A\u4E2A id \u5408\u5E76\u5230\u4E00\u4E2A bank\uFF08\u5355\u8DF3\u3001\u5B57\u9762\u91CF\uFF0C\u76EE\u6807\u81EA\u8EAB\u7684\u6BB5\u4E0D\u518D\u53C2\u4E0E\uFF09\u3002",
  "help.e.line3": "bank \u89E3\u6790\u7C7B\u5B57\u6BB5\uFF08bankId / mapPathToBank / bank / optInOnly / optInPaths\uFF09\u5199\u5728 bank \u6BB5\u91CC\u4F1A\u88AB\u5FFD\u7565\u3002",
  "help.e.line4": '\u793A\u4F8B\uFF1A{"banks": {"coding-agent::backend": {"bank": "team::product"}, "coding-agent::frontend": {"bank": "team::product"}}}',
  "help.f.title": "paths.<\u524D\u7F00> \u4E0E\u5E38\u89C1\u914D\u65B9",
  "help.f.line1": "paths \u6309\u76EE\u5F55\u524D\u7F00\u8986\u76D6\u8FDE\u63A5\u7C7B\u8BBE\u7F6E\uFF08serverMode / apiUrl / apiPort / apiToken\uFF09\uFF1B\u5728\u89E3\u6790\u4E4B\u540E\u3001banks.<id> \u4E4B\u524D\u751F\u6548\uFF0C\u6240\u4EE5 bank \u6BB5\u4ECD\u80FD\u76D6\u8FC7\u5B83\u3002\u672C\u9875\u53EA\u5217\u51FA\uFF0C\u8BF7\u5728\u6587\u4EF6\u91CC\u7F16\u8F91\u3002",
  "help.f.line2": '\u6309\u3010\u76EE\u5F55\u3011\u628A\u4E00\u7247\u4ED3\u5E93\u5F52\u5230\u4E00\u4E2A bank\uFF1A{"mapPathToBank": {"/Users/me/work/client-x": "client-x-memory"}}',
  "help.f.line3": "\u6309\u3010id\u3011\u628A\u624B\u5DE5\u6311\u7684\u51E0\u4E2A\u4ED3\u5E93\u5F52\u5230\u4E00\u4E2A bank\uFF1A\u7528\u4E0A\u9762\u7684 banks \u793A\u4F8B\u3002",
  "help.g.title": "\u600E\u4E48\u770B\u6211\u7684 bank id \u5230\u5E95\u662F\u54EA\u4E2A",
  "help.g.line1": "\u4E0A\u6E38 v2 \u63D2\u4EF6\u628A seed / \u4F1A\u8BDD\u6A2A\u5E45\u5199\u8FDB\u63D2\u4EF6\u65E5\u5FD7\uFF1A~/.hindsight/coding-agents-logs/plugin.log\uFF08\u65E5\u5FD7\u91CC\u51FA\u73B0 bank=<id>\uFF09\u3002",
  "help.g.line2": "\u628A logLevel \u8BBE\u4E3A debug \u4F1A\u8BB0\u4E0B\u66F4\u8BE6\u7EC6\u7684\u8FC7\u7A0B\uFF1B\u7ED3\u6784\u5316\u4E8B\u4EF6\u5728\u540C\u76EE\u5F55\u7684 diag.jsonl\u3002",
  "help.g.line3": "\u6743\u5A01\u8BF4\u660E\u89C1 hindsight-integrations/coding-agents/README.md \u7684 Bank resolution \u4E00\u8282\u3002"
};
var LOCALE_NS = "dsh-hindsight-settings";
var DICTIONARIES = { en: EN, zh: ZH };
function activeLanguage(active) {
  return active === "zh" ? "zh" : "en";
}
function interpolate(template, params) {
  if (params === void 0) return template;
  return template.replace(
    /\{(\w+)\}/g,
    (match, name2) => name2 in params ? String(params[name2]) : match
  );
}
function makeTranslate(dictionaries) {
  return (key, params) => {
    const template = dictionaries.en[key] ?? dictionaries.zh[key] ?? key;
    return interpolate(template, params);
  };
}
var fallbackTranslate = makeTranslate(DICTIONARIES);
var SETTINGS_SLOT = "settings.section";
var PAGE_ID = "hindsight-settings";
var PAGE_ORDER = 35;
function pageLabel(t) {
  return t("title");
}
var SERVICE_NAMESPACE = "hindsightSettings";
var SERVICE_KEY = `remote.${SERVICE_NAMESPACE}`;
var CONTRIBUTION_PACKAGE = "@Echo-Note/dsh-hindsight-settings";
function jsonCodec(typeSymbol) {
  return { mode: "strict", typeSymbol, create: () => ({ parse: (value) => value }) };
}
var CONTRIBUTION = deepFreeze({
  package: CONTRIBUTION_PACKAGE,
  descriptors: [
    {
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/describe`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "describe",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "scope",
          wire: "scope",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ConfigScope`),
          // Optional: a call with no argument means the file's top level, so the page's default
          // top-scope read stays a zero-argument call.
          acceptsUndefined: true
        }
      ],
      result: { mode: "src-json" }
    },
    {
      // Diagnostics from the page itself. Without it a client-side failure is invisible: the live
      // slot ledger shows only what SUCCEEDED, and console.error inside a packaged desktop app is
      // unreachable to everyone but the user.
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/note`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "note",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "message",
          wire: "message",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ClientNote`)
        }
      ],
      result: { mode: "src-json" }
    },
    {
      // One `banks.<id>` (or `paths.<dir>`) section: how a single bank differs from the shared top
      // level the other two methods address.
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/applyScoped`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "applyScoped",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "scope",
          wire: "scope",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ConfigScope`)
        },
        {
          name: "patch",
          wire: "patch",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#SettingsPatch`)
        }
      ],
      result: { mode: "src-json" }
    },
    {
      id: `${CONTRIBUTION_PACKAGE}#${SERVICE_NAMESPACE}/apply`,
      service: SERVICE_NAMESPACE,
      namespace: SERVICE_NAMESPACE,
      method: "apply",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "patch",
          wire: "patch",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#SettingsPatch`)
        }
      ],
      result: { mode: "src-json" }
    }
  ]
});
function deepFreeze(value) {
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isSettingsView(value) {
  return isRecord(value) && typeof value.path === "string" && Array.isArray(value.fields);
}
function jsonEquals(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((entry, index) => jsonEquals(entry, right[index]));
  }
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) return false;
    return keys.every((key) => key in right && jsonEquals(left[key], right[key]));
  }
  return false;
}
function isLocalizedText(value) {
  return isRecord(value) && typeof value.en === "string" && typeof value.zh === "string" && value.en !== "" && value.zh !== "";
}
function localizedText(value, lang) {
  return isLocalizedText(value) ? value[lang] : value;
}
function fieldMetadata(key) {
  return CONFIG_FIELDS.find((field) => field.key === key);
}
function fieldSummary(field, lang) {
  const declared = fieldMetadata(field.key);
  return declared === void 0 ? field.summary : localizedText(declared.summary, lang);
}
function groupDescriptor(group, lang) {
  const declared = FIELD_GROUPS.find((candidate) => candidate.id === group);
  return declared === void 0 ? { id: group, title: group, summary: "" } : {
    id: group,
    title: localizedText(declared.title, lang),
    summary: localizedText(declared.summary, lang)
  };
}
var FIELD_ORDER = new Map(
  CONFIG_FIELDS.map((field, index) => [field.key, index])
);
function byDeclarationOrder(left, right) {
  const a = FIELD_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER;
  const b = FIELD_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER;
  return a - b;
}
function buildSections(fields, lang) {
  const buckets = /* @__PURE__ */ new Map();
  for (const field of fields) {
    const bucket = buckets.get(field.group);
    if (bucket === void 0) buckets.set(field.group, [field]);
    else bucket.push(field);
  }
  const sections = [];
  const emitted = /* @__PURE__ */ new Set();
  const emit = (group) => {
    if (emitted.has(group)) return;
    emitted.add(group);
    const bucket = buckets.get(group) ?? [];
    sections.push({
      group: groupDescriptor(group, lang),
      fields: [...bucket].sort(byDeclarationOrder)
    });
  };
  for (const group of FIELD_GROUPS) emit(group.id);
  for (const group of buckets.keys()) emit(group);
  return sections;
}
var BANKS_TAB_ID = "__banks__";
function buildTabs(fields, copy) {
  const tabs = buildSections(fields, copy.lang).map((section) => ({
    id: section.group.id,
    title: section.group.title,
    summary: section.group.summary,
    kind: "group",
    fields: section.fields
  }));
  tabs.push({
    id: BANKS_TAB_ID,
    title: copy.t("tabs.banks.title"),
    summary: copy.t("tabs.banks.summary"),
    kind: "banks",
    fields: []
  });
  return tabs;
}
function banksScopeText(t) {
  return t("banks.scopeText");
}
function pathsReadOnlyText(t) {
  return t("banks.pathsReadOnly");
}
function scopedEditorTitle(scope, t) {
  if (scope.kind === "bank") return t("banks.editTitle", { id: scope.id });
  if (scope.kind === "path") return `paths.${scope.dir}`;
  return t("scope.top");
}
function unsetText(t) {
  return t("unset.text");
}
function formatScalar(value, t) {
  if (value === void 0 || value === null) return unsetText(t);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? unsetText(t) : value.map((entry) => formatScalar(entry, t)).join(", ");
  }
  return JSON.stringify(value) ?? unsetText(t);
}
function formatFieldValue(field, value, t) {
  if (value === void 0 || value === null) return unsetText(t);
  if (field.kind === "json") return JSON.stringify(value, null, 2) ?? unsetText(t);
  if (field.kind === "stringList") {
    return Array.isArray(value) && value.length > 0 ? value.map((entry) => String(entry)).join("\n") : unsetText(t);
  }
  return formatScalar(value, t);
}
function formatDefault(field, t) {
  return field.default === null ? unsetText(t) : formatScalar(field.default, t);
}
function scopeLabel(scope, t) {
  switch (scope) {
    case "global":
      return t("scope.global");
    case "harness":
      return t("scope.harness");
    case "bank":
      return t("scope.bank");
    case "path":
      return t("scope.path");
    default:
      return scope;
  }
}
function fallbackText(field, copy) {
  const { t } = copy;
  const parts = [];
  parts.push(
    field.default === null ? t("fallback.none") : t("fallback.default", { value: formatScalar(field.default, t) })
  );
  if (field.env !== void 0) parts.push(t("fallback.env", { env: field.env }));
  return t("fallback.line", { parts: parts.join(" \u2192 ") });
}
function shadowText(t) {
  return t("shadow.text");
}
function readOnlyText(t) {
  return t("readonly.text");
}
function effectiveText(field) {
  return field.default === null || field.default === void 0 ? "" : draftValueFor(field, field.default);
}
function prefillValueFor(field) {
  return field.inFile ? draftValueFor(field, field.value) : effectiveText(field);
}
function valueSourceNote(field, copy, scope = "top") {
  const { t } = copy;
  if (field.inFile) return t("source.inFile");
  if (field.default === null || field.default === void 0) return void 0;
  const shown = formatScalar(field.default, t);
  return scope === "bank" ? t("source.defaultBank", { value: shown }) : t("source.defaultTop", { value: shown });
}
function draftValueFor(field, value) {
  if (value === void 0 || value === null) return "";
  if (Array.isArray(value)) {
    return field.kind === "stringList" ? value.map((entry) => String(entry)).join("\n") : JSON.stringify(value) ?? "";
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (isRecord(value)) return JSON.stringify(value) ?? "";
  return String(value);
}
function draftFromFields(fields) {
  const draft = {};
  for (const field of fields) draft[field.key] = prefillValueFor(field);
  return draft;
}
function parseDraft(field, raw, t) {
  const text = raw.trim();
  switch (field.kind) {
    case "string":
    case "secret":
      return { ok: true, value: raw === "" ? null : raw };
    case "number": {
      if (text === "") return { ok: true, value: null };
      const parsed = Number(text);
      if (!Number.isFinite(parsed)) {
        return { ok: false, message: t("errors.parseNumber", { key: field.key, value: text }) };
      }
      return { ok: true, value: parsed };
    }
    case "boolean": {
      if (text === "") return { ok: true, value: null };
      if (text === "true") return { ok: true, value: true };
      if (text === "false") return { ok: true, value: false };
      return { ok: false, message: t("errors.parseBoolean", { key: field.key }) };
    }
    case "enum": {
      if (text === "") return { ok: true, value: null };
      const values = field.values ?? [];
      if (!values.includes(text)) {
        return {
          ok: false,
          message: t("errors.parseEnum", {
            key: field.key,
            values: values.join(t("errors.enumSeparator"))
          })
        };
      }
      return { ok: true, value: text };
    }
    case "stringList": {
      if (text === "") return { ok: true, value: null };
      const items = text.split(/[\n,]/).map((item) => item.trim()).filter((item) => item !== "");
      return { ok: true, value: items.length === 0 ? null : items };
    }
    case "json": {
      if (text === "") return { ok: true, value: null };
      try {
        return { ok: true, value: JSON.parse(text) };
      } catch {
        return { ok: false, message: t("errors.parseJson", { key: field.key }) };
      }
    }
    default:
      return { ok: true, value: raw === "" ? null : raw };
  }
}
function diffDraft(fields, draft, t, cleared = /* @__PURE__ */ new Set()) {
  const patch = {};
  const errors = [];
  const changed = [];
  for (const field of fields) {
    if (!field.editable) continue;
    const raw = draft[field.key] ?? "";
    const baselineText = prefillValueFor(field);
    if (raw === baselineText && !cleared.has(field.key)) continue;
    if (cleared.has(field.key)) {
      if (!field.inFile) continue;
      patch[field.key] = null;
      changed.push(field.key);
      continue;
    }
    const parsed = parseDraft(field, raw, t);
    if (!parsed.ok) {
      errors.push({ key: field.key, message: parsed.message });
      continue;
    }
    if (parsed.value === null) {
      if (!field.inFile) continue;
      patch[field.key] = null;
      changed.push(field.key);
      continue;
    }
    if (field.inFile && jsonEquals(parsed.value, field.value)) continue;
    patch[field.key] = parsed.value;
    changed.push(field.key);
  }
  return { patch, errors, changed };
}
function describeAvailability(input) {
  if (input.state.kind === "unavailable") {
    return input.copy.t(input.state.reasonKey, input.state.reasonParams);
  }
  if (input.state.kind === "loading") return input.copy.t("loading.text");
  if (input.loadError !== void 0) return input.loadError;
  if (input.view === void 0) return input.copy.t("loading.text");
  if (input.view.error !== void 0) {
    return input.copy.t("errors.unparsableFile", { message: input.view.error });
  }
  return void 0;
}
function remoteErrorText(error) {
  let message;
  let code;
  if (error instanceof Error) message = error.message;
  if (isRecord(error)) {
    if (message === void 0 && typeof error.message === "string") message = error.message;
    if (typeof error.code === "string") code = error.code;
  }
  if (message === void 0) message = typeof error === "string" ? error : String(error);
  return code === void 0 ? message : `${message}\uFF08${code}\uFF09`;
}
function summarizeApply(patch, result, t) {
  if (!result.changed) return t("notice.unchanged");
  const writes = Object.values(patch).filter((value) => value !== null).length;
  const removals = result.removed.length;
  const parts = [];
  if (writes > 0) parts.push(t("notice.writes", { count: writes }));
  if (removals > 0) parts.push(t("notice.removals", { count: removals }));
  if (parts.length === 0) parts.push(t("notice.touched", { path: result.path }));
  return t("notice.saved", { path: result.path, parts: parts.join("\uFF1B") });
}
var BANKS_HELP = Object.freeze([
  {
    titleKey: "help.a.title",
    lineKeys: ["help.a.line1", "help.a.line2", "help.a.line3", "help.a.line4"]
  },
  {
    titleKey: "help.b.title",
    lineKeys: ["help.b.line1", "help.b.line2", "help.b.line3", "help.b.line4", "help.b.line5"]
  },
  {
    titleKey: "help.c.title",
    lineKeys: ["help.c.line1", "help.c.line2", "help.c.line3", "help.c.line4"]
  },
  {
    titleKey: "help.d.title",
    lineKeys: ["help.d.line1", "help.d.line2"]
  },
  {
    titleKey: "help.e.title",
    lineKeys: ["help.e.line1", "help.e.line2", "help.e.line3", "help.e.line4"]
  },
  {
    titleKey: "help.f.title",
    lineKeys: ["help.f.line1", "help.f.line2", "help.f.line3"]
  },
  {
    titleKey: "help.g.title",
    lineKeys: ["help.g.line1", "help.g.line2", "help.g.line3"]
  }
]);

// src/client/index.tsx
var name = "dsh-hindsight-settings";
var inject = ["slots", "remote", "locale"];
function apply(ctx) {
  const report = createReporter(ctx);
  try {
    const slots = ctx.slots;
    report(
      `apply: slots=${typeof slots} inject=${typeof slots?.inject} register=${typeof slots?.register} effect=${typeof ctx.effect} get=${typeof ctx.get} locale=${typeof readLocale(ctx)}`
    );
    if (slots === void 0 || typeof slots.inject !== "function" || typeof slots.register !== "function") {
      report("apply: the slot service is missing inject/register \u2014 the page cannot appear");
      return;
    }
    registerDictionaries(ctx, report);
    const bridge = createLocaleBridge(ctx, report);
    const copy = bridge.getSnapshot();
    let Page;
    try {
      Page = createPage(createServiceStore(ctx), report, bridge);
    } catch (error) {
      const text = messageOf(error);
      report(`setup: threw \u2014 ${text}`);
      Page = () => React.createElement(
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
    const register = () => {
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
            label: () => pageLabel(bridge.translate())
          },
          Page
        );
        report("register: ok");
        return dispose;
      } catch (error) {
        const text = messageOf(error);
        report(`register: threw \u2014 ${text}`);
        if (/already has an entry/.test(text)) {
          const retry = setTimeout(() => {
            try {
              slots.register(
                {
                  name: SETTINGS_SLOT,
                  id: PAGE_ID,
                  order: PAGE_ORDER,
                  locale: LOCALE_NS,
                  label: () => pageLabel(bridge.translate())
                },
                Page
              );
              report("register: ok on retry");
            } catch (again) {
              report(`register: retry threw \u2014 ${messageOf(again)}`);
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
    report(`apply: threw \u2014 ${messageOf(error)}`);
    console.error(
      "[dsh-hindsight-settings] client half failed to register (host unaffected):",
      error
    );
  }
}
function readLocale(ctx) {
  let candidate;
  try {
    candidate = ctx.get("locale");
  } catch {
    return void 0;
  }
  return isRecord(candidate) && typeof candidate.register === "function" && typeof candidate.bind === "function" && typeof candidate.getLocale === "function" && typeof candidate.subscribe === "function" ? candidate : void 0;
}
function createLocaleBridge(ctx, report) {
  const service = readLocale(ctx);
  const bound = service === void 0 ? void 0 : service.bind(LOCALE_NS);
  const translate = () => bound ?? fallbackTranslate;
  const snapshot = () => ({
    t: translate(),
    lang: activeLanguage(service?.getLocale().active)
  });
  return {
    translate,
    getSnapshot: snapshot,
    subscribe(listener) {
      if (service === void 0) return () => void 0;
      try {
        let last = snapshot().lang;
        report(`locale: active=${service.getLocale().active}`);
        return service.subscribe(() => {
          const next = snapshot().lang;
          if (next !== last) {
            last = next;
            report(`locale: switched to ${next}`);
          }
          listener();
        });
      } catch (error) {
        report(`locale: subscribe threw \u2014 ${messageOf(error)}`);
        return () => void 0;
      }
    }
  };
}
function registerDictionaries(ctx, report) {
  const service = readLocale(ctx);
  if (service === void 0) {
    report("locale: no locale service \u2014 using the built-in dictionaries (English)");
    return;
  }
  const run = () => {
    try {
      return service.register(LOCALE_NS, DICTIONARIES);
    } catch (error) {
      report(`locale: register threw \u2014 ${messageOf(error)}`);
      return () => void 0;
    }
  };
  if (typeof ctx.effect === "function") {
    try {
      ctx.effect(run, "hindsight-settings: dictionaries");
      return;
    } catch (error) {
      report(`locale: effect threw \u2014 ${messageOf(error)}`);
    }
  }
  run();
}
function messageOf(error) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}
function mountOnce(ctx, remote) {
  const carrier = ctx;
  carrier.__dshHindsightMount ?? (carrier.__dshHindsightMount = remote.$mount(CONTRIBUTION));
  return carrier.__dshHindsightMount;
}
function createReporter(ctx) {
  return (message) => {
    void (async () => {
      try {
        const remote = readRemote(ctx);
        if (remote === void 0) return;
        await mountOnce(ctx, remote);
        const service = ctx.get(SERVICE_KEY);
        await service?.note?.(message);
      } catch {
      }
    })();
  };
}
function readRemote(ctx) {
  let candidate;
  try {
    candidate = ctx.get("remote");
  } catch {
    return void 0;
  }
  return isRecord(candidate) && typeof candidate.$mount === "function" ? candidate : void 0;
}
function readService(ctx) {
  let candidate;
  try {
    candidate = ctx.get(SERVICE_KEY);
  } catch {
    return void 0;
  }
  return isRecord(candidate) && typeof candidate.describe === "function" && typeof candidate.apply === "function" ? candidate : void 0;
}
async function mount(ctx, remote) {
  await mountOnce(ctx, remote);
  const service = readService(ctx);
  if (service === void 0) {
    return {
      kind: "unavailable",
      reasonKey: "unavailable.noNamespace",
      reasonParams: { service: SERVICE_KEY }
    };
  }
  return { kind: "ready", service };
}
function createServiceStore(ctx) {
  const listeners = /* @__PURE__ */ new Set();
  let state;
  const publish = (next) => {
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
  if (remote === void 0) {
    state = { kind: "unavailable", reasonKey: "unavailable.noRemote" };
  } else {
    state = { kind: "loading" };
    void mount(ctx, remote).then(publish, (error) => {
      publish({
        kind: "unavailable",
        reasonKey: "unavailable.mountFailed",
        reasonParams: { message: remoteErrorText(error) }
      });
    });
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
var STYLE_ID = "dsh-hindsight-settings-styles";
var STYLES = [
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
  ".dhs-help-section{display:flex;flex-direction:column;gap:2px}"
].join("");
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}
function useServiceState(store) {
  const [state, setState] = React.useState(() => store.getSnapshot());
  React.useEffect(() => {
    setState(store.getSnapshot());
    return store.subscribe(() => setState(store.getSnapshot()));
  }, [store]);
  return state;
}
function useLocaleCopy(bridge) {
  const [snapshot, setSnapshot] = React.useState(() => bridge.getSnapshot());
  React.useEffect(() => {
    setSnapshot(bridge.getSnapshot());
    return bridge.subscribe(() => setSnapshot(bridge.getSnapshot()));
  }, [bridge]);
  return React.useMemo(() => ({ t: snapshot.t, lang: snapshot.lang }), [snapshot.t, snapshot.lang]);
}
function BanksHelp(props) {
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
        onClick: () => setOpen((previous) => !previous)
      },
      open ? t("help.toggleOpen") : t("help.toggleClosed")
    ),
    open ? React.createElement(
      "div",
      { className: "dhs-help-body" },
      BANKS_HELP.map(
        (section) => React.createElement(
          "div",
          { className: "dhs-help-section", key: section.titleKey },
          React.createElement("div", { className: "dhs-help-title" }, t(section.titleKey)),
          section.lineKeys.map(
            (lineKey) => React.createElement("div", { className: "dhs-help-line", key: lineKey }, t(lineKey))
          )
        )
      )
    ) : null
  );
}
function createPage(store, report, bridge) {
  return function HindsightSettingsPage(props) {
    const seat = isRecord(props) && typeof props.t === "function" ? props.t : void 0;
    const followed = useLocaleCopy(bridge);
    const copy = seat === void 0 ? followed : { t: seat, lang: followed.lang };
    const t = copy.t;
    ensureStyles();
    const entered = React.useRef(false);
    if (!entered.current) {
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
          describeAvailability({ state, view: void 0, loadError: void 0, copy })
        )
      );
    }
    return React.createElement(SettingsForm, { service: state.service, report, copy });
  };
}
var TOP_SCOPE = { kind: "top" };
function scopeKey(scope) {
  if (scope === void 0) return "top";
  if (scope.kind === "bank") return `bank:${scope.id}`;
  if (scope.kind === "path") return `path:${scope.dir}`;
  return "top";
}
function useScopeForm(service, scope, report, copy, onSaved) {
  const [view, setView] = React.useState(void 0);
  const [loadError, setLoadError] = React.useState(void 0);
  const [draft, setDraft] = React.useState({});
  const [busy, setBusy] = React.useState(void 0);
  const [cleared, setCleared] = React.useState(() => /* @__PURE__ */ new Set());
  const [notice, setNotice] = React.useState(null);
  const label = scopeKey(scope);
  const { t, lang } = copy;
  const reload = React.useCallback(async () => {
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
        report(
          `describe(${label}): ${result.value.fields.length} fields, ${result.value.fields.filter((f) => f.inFile).length} with values, ${Object.values(nextDraft).filter((v) => v !== "").length} non-empty drafts, sample=${JSON.stringify(
            result.value.fields.filter((f) => f.inFile).slice(0, 4).map((f) => [f.key, f.value])
          )}`
        );
        setLoadError(void 0);
      } else {
        setLoadError({
          key: "errors.readFailed",
          params: { message: remoteErrorText(result.error) }
        });
      }
    } catch (error) {
      setLoadError({
        key: "errors.readFailed",
        params: { message: remoteErrorText(error) }
      });
    } finally {
      setBusy(void 0);
    }
  }, [service, scope, label, report, t]);
  React.useEffect(() => {
    void reload();
  }, [reload]);
  const availability = describeAvailability({
    state: { kind: "ready", service },
    view,
    loadError: loadError === void 0 ? void 0 : t(loadError.key, loadError.params),
    copy
  });
  const diff = React.useMemo(
    () => view === void 0 ? { patch: {}, errors: [], changed: [] } : diffDraft(view.fields, draft, t, cleared),
    [view, draft, cleared, t]
  );
  const dirty = diff.changed.length > 0;
  const invalid = diff.errors.length > 0;
  const setField = React.useCallback((key, next) => {
    setDraft((current) => ({ ...current, [key]: next }));
    setCleared((current) => {
      if (!current.has(key)) return current;
      const nextSet = new Set(current);
      nextSet.delete(key);
      return nextSet;
    });
  }, []);
  const clearField = React.useCallback((key) => {
    setDraft((current) => ({ ...current, [key]: "" }));
    setCleared((current) => new Set(current).add(key));
  }, []);
  const save = React.useCallback(() => {
    if (view === void 0) return;
    if (diff.errors.length > 0) {
      setNotice({
        kind: "err",
        text: t("errors.invalidFields", {
          count: diff.errors.length,
          messages: diff.errors.map((entry) => entry.message).join(" ")
        })
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
        const patch = diff.patch;
        const result = scope === void 0 ? await service.apply(patch) : await service.applyScoped(scope, patch);
        if (result.ok) {
          setNotice({ kind: "ok", text: summarizeApply(patch, result.value, t) });
          if (onSaved !== void 0) onSaved();
        } else {
          setNotice({
            kind: "err",
            text: t("errors.saveFailed", { message: remoteErrorText(result.error) })
          });
        }
      } catch (error) {
        setNotice({
          kind: "err",
          text: t("errors.saveFailed", { message: remoteErrorText(error) })
        });
      } finally {
        setBusy(void 0);
        await reload();
      }
    })();
  }, [view, diff, service, scope, reload, onSaved, t]);
  const discard = React.useCallback(() => {
    if (view !== void 0) setDraft(draftFromFields(view.fields));
    setCleared(/* @__PURE__ */ new Set());
    setNotice({ kind: "info", text: t("notices.discarded") });
  }, [view, t]);
  const reloadNow = React.useCallback(() => {
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
    editable: availability === void 0,
    setField,
    clearField,
    save,
    discard,
    reload: reloadNow
  };
}
function SettingsForm(props) {
  const { service, report, copy } = props;
  const { t, lang } = copy;
  const form = useScopeForm(service, void 0, report, copy, void 0);
  const [activeTab, setActiveTab] = React.useState("");
  const tabs = React.useMemo(() => buildTabs(form.view?.fields ?? [], copy), [form.view, copy]);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const groupCount = tabs.filter((tab) => tab.kind === "group").length;
  const disabled = !form.editable || form.busy !== void 0;
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
        form.view === void 0 ? t("loading.text") : t("counts.fieldsAndGroups", { count: form.view.fields.length, groups: groupCount })
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
    form.availability === void 0 ? null : React.createElement("div", { className: "dhs-note dhs-warn" }, form.availability),
    React.createElement(
      "div",
      { className: "dhs-tabs", role: "tablist" },
      ...tabs.map(
        (tab) => React.createElement(
          "button",
          {
            key: tab.id,
            type: "button",
            role: "tab",
            "aria-selected": tab.id === active?.id,
            className: tab.id === active?.id ? "dhs-tab dhs-tab-active" : "dhs-tab",
            onClick: () => setActiveTab(tab.id)
          },
          tab.title
        )
      )
    ),
    React.createElement(
      "div",
      { className: "dhs-tabpanel", role: "tabpanel" },
      active === void 0 ? null : active.kind === "banks" ? React.createElement(BanksPanel, {
        service,
        report,
        copy,
        members: form.view?.banks ?? [],
        paths: form.view?.paths ?? [],
        onChanged: form.reload
      }) : renderGroup(active, form, disabled, copy)
    ),
    React.createElement(ActionBar, {
      form,
      copy,
      saveLabel: t("actions.save")
    })
  );
}
function renderGroup(tab, form, disabled, copy) {
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
    tab.fields.length === 0 ? React.createElement("div", { className: "dhs-meta" }, t("group.empty")) : React.createElement(FieldRows, {
      fields: tab.fields,
      form,
      copy,
      scopeKind: "top",
      disabled
    })
  );
}
function BanksPanel(props) {
  const { service, report, copy, members, paths, onChanged } = props;
  const { t } = copy;
  const [openId, setOpenId] = React.useState(void 0);
  const [newId, setNewId] = React.useState("");
  const [addError, setAddError] = React.useState(void 0);
  const open = members.find((member) => member.id === openId);
  const onAdd = () => {
    const candidate = newId.trim();
    if (candidate === "") {
      setAddError({ key: "banks.addEmpty" });
      return;
    }
    if (members.some((member) => member.id === candidate)) {
      setAddError({ key: "banks.addExists", params: { id: candidate } });
      return;
    }
    setAddError(void 0);
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
    members.length === 0 ? React.createElement("div", { className: "dhs-meta" }, t("banks.empty")) : React.createElement(
      React.Fragment,
      null,
      ...members.map(
        (member) => React.createElement(
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
                onClick: () => setOpenId(openId === member.id ? void 0 : member.id)
              },
              openId === member.id ? t("banks.close") : t("banks.open")
            )
          ),
          member.keys.length === 0 ? null : React.createElement(
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
        onChange: (event) => {
          setNewId(event.target.value);
          setAddError(void 0);
        }
      }),
      React.createElement(
        "button",
        { type: "button", className: "dhs-btn dhs-btn-mini", onClick: onAdd },
        t("banks.add")
      )
    ),
    addError === void 0 ? null : React.createElement(
      "div",
      { className: "dhs-meta dhs-err" },
      t(addError.key, addError.params)
    ),
    openId === void 0 ? null : React.createElement(
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
        open === void 0 ? React.createElement("span", { className: "dhs-chip" }, t("banks.newSection")) : React.createElement(
          "span",
          { className: "dhs-chip" },
          t("banks.keysCount", { count: open.keys.length })
        ),
        React.createElement(
          "button",
          {
            type: "button",
            className: "dhs-btn dhs-btn-mini",
            onClick: () => setOpenId(void 0)
          },
          t("banks.closeEditor")
        )
      ),
      open === void 0 ? React.createElement("div", { className: "dhs-meta" }, t("banks.newSectionNote")) : null,
      React.createElement(ScopedEditor, {
        key: openId,
        service,
        report,
        copy,
        bankId: openId,
        onSaved: onChanged
      })
    ),
    paths.length === 0 ? null : React.createElement(
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
      ...paths.map(
        (member) => React.createElement(
          "div",
          { className: "dhs-meta", key: member.id },
          React.createElement("code", { className: "dhs-key" }, `paths.${member.id}`),
          member.keys.length === 0 ? t("banks.pathKeysSuffix", { count: member.keys.length }) : t("banks.pathKeysList", {
            count: member.keys.length,
            keys: member.keys.join(t("banks.keySeparator"))
          })
        )
      )
    )
  );
}
function ScopedEditor(props) {
  const { service, report, copy, bankId, onSaved } = props;
  const { t } = copy;
  const scope = React.useMemo(() => ({ kind: "bank", id: bankId }), [bankId]);
  const form = useScopeForm(service, scope, report, copy, onSaved);
  const fields = form.view?.fields ?? [];
  const disabled = !form.editable || form.busy !== void 0;
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
        form.view === void 0 ? t("loading.text") : t("editor.countAndPath", { count: fields.length, path: form.view.path })
      )
    ),
    React.createElement("div", { className: "dhs-note" }, banksScopeText(t)),
    form.availability === void 0 ? null : React.createElement("div", { className: "dhs-note dhs-warn" }, form.availability),
    React.createElement(FieldRows, { fields, form, copy, scopeKind: "bank", disabled }),
    React.createElement(ActionBar, {
      form,
      copy,
      saveLabel: t("actions.saveTo", { id: bankId })
    })
  );
}
function FieldRows(props) {
  const { fields, form, copy, scopeKind, disabled } = props;
  return React.createElement(
    React.Fragment,
    null,
    ...fields.map(
      (field) => React.createElement(FieldRow, {
        key: field.key,
        field,
        copy,
        draft: form.draft[field.key] ?? "",
        disabled,
        scopeKind,
        onDraft: (next) => form.setField(field.key, next),
        onClear: () => form.clearField(field.key)
      })
    )
  );
}
function ActionBar(props) {
  const { form, copy, saveLabel } = props;
  const { t } = copy;
  const { diff, busy, editable } = form;
  const disabled = !editable || busy !== void 0;
  return React.createElement(
    "div",
    { className: "dhs-actions" },
    React.createElement(
      "button",
      {
        type: "button",
        className: "dhs-btn dhs-btn-primary",
        // Left enabled while a field is invalid so the click can say WHICH field it is.
        disabled: disabled || !form.dirty && !form.invalid,
        onClick: form.save
      },
      busy === "save" ? t("actions.saving") : form.dirty ? t("actions.saveCount", { label: saveLabel, count: diff.changed.length }) : saveLabel
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== void 0, onClick: form.discard },
      t("actions.discard")
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== void 0, onClick: form.reload },
      busy === "reload" ? t("actions.reloading") : t("actions.reload")
    ),
    form.invalid ? React.createElement(
      "span",
      { className: "dhs-hint dhs-err", "data-validation": "errors" },
      t("errors.invalidFieldsShort", {
        count: diff.errors.length,
        messages: diff.errors.map((entry) => entry.message).join(" ")
      })
    ) : null,
    form.notice === null ? null : React.createElement("span", { className: noticeClass(form.notice) }, form.notice.text),
    // The same message as a live region: the visual line is not announced by itself.
    React.createElement(
      "span",
      { role: "status", "aria-live": "polite", className: "dhs-sr" },
      form.notice === null ? "" : form.notice.text
    )
  );
}
function noticeClass(notice) {
  if (notice.kind === "ok") return "dhs-hint dhs-ok";
  if (notice.kind === "err") return "dhs-hint dhs-err";
  return "dhs-hint";
}
function FieldRow(props) {
  const { field, copy, draft, disabled, scopeKind, onDraft, onClear } = props;
  const { t, lang } = copy;
  const onChange = (event) => onDraft(event.target.value);
  const input = (() => {
    if (!field.editable) {
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
            onChange: (event) => onDraft(event.target.checked ? "true" : "false"),
            "aria-label": field.key
          }),
          React.createElement(
            "span",
            { className: "dhs-hint" },
            valueSourceNote(field, copy, scopeKind) ?? fallbackText(field, copy)
          )
        );
      case "enum": {
        const options = [
          { value: "", label: t("unset.optionPrefix", { value: formatDefault(field, t) }) }
        ];
        for (const entry of field.values ?? []) options.push({ value: entry, label: entry });
        return React.createElement(
          "select",
          { className: "dhs-select", value: draft, disabled, onChange, "aria-label": field.key },
          ...options.map(
            (option) => React.createElement("option", { key: option.value, value: option.value }, option.label)
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
          "aria-label": field.key
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
          ...field.inFile ? { placeholder: t("field.placeholder.secretSet") } : {}
        });
      case "stringList":
        return React.createElement("textarea", {
          className: "dhs-textarea",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          placeholder: t("field.placeholder.list"),
          "aria-label": field.key
        });
      case "json":
        return React.createElement("textarea", {
          className: "dhs-textarea",
          value: draft,
          disabled,
          onChange,
          "aria-label": field.key
        });
      default:
        return React.createElement("input", {
          className: "dhs-input",
          type: "text",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          "aria-label": field.key
        });
    }
  })();
  const chips = [
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
        key: "state"
      },
      field.inFile ? t("field.chip.inFile") : t("field.chip.notInFile")
    )
  ];
  const sourceNote = field.editable ? valueSourceNote(field, copy, scopeKind) : void 0;
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
    sourceNote === void 0 ? null : React.createElement("div", { className: "dhs-meta" }, sourceNote),
    field.inFile ? null : React.createElement("div", { className: "dhs-meta" }, fallbackText(field, copy)),
    field.shadowedByHarness ? React.createElement("div", { className: "dhs-meta" }, shadowText(t)) : null,
    !field.editable ? React.createElement("div", { className: "dhs-meta" }, readOnlyText(t)) : null,
    field.editable ? React.createElement(
      "div",
      { className: "dhs-field-head" },
      React.createElement(
        "button",
        {
          type: "button",
          className: "dhs-btn dhs-btn-mini",
          // Removing a key the file does not set changes nothing, so the control is inert there.
          disabled: disabled || !field.inFile,
          onClick: onClear
        },
        field.inFile ? draft === "" && field.kind !== "secret" ? (
          // An empty cell for a value the file stores as "" is still a stored key.
          t("field.clearUnsetStored", { value: unsetText(t) })
        ) : (
          // A secret is ALWAYS an empty box while set, so its button always reads "clear".
          t("field.clearInFile")
        ) : t("field.clearNotInFile")
      ),
      field.kind === "secret" ? React.createElement("span", { className: "dhs-hint" }, t("field.secretHint")) : null
    ) : null
  );
}
return module.exports; } });
