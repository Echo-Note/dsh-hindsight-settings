window.__ModuleLoader__.load({ id: "@local/dsh-hindsight-settings", factory: (require) => {
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
    title: "\u8FDE\u63A5",
    summary: "\u8BB0\u5FC6\u5B58\u653E\u5728\u54EA\u91CC\uFF0C\u7528\u4EC0\u4E48\u51ED\u636E\u8BBF\u95EE\u3002"
  },
  {
    id: "routing",
    title: "\u8BB0\u5FC6\u5E93\u8DEF\u7531",
    summary: "\u8FD9\u6B21\u5DE5\u4F5C\u5199\u8FDB\u54EA\u4E2A bank\uFF1B\u9ED8\u8BA4\u6BCF\u4E2A\u4ED3\u5E93\u4E00\u4E2A\u3002"
  },
  {
    id: "recall",
    title: "\u53EC\u56DE\u4E0E\u6CE8\u5165",
    summary: "\u6BCF\u4E00\u8F6E\u5F80\u6A21\u578B\u4E0A\u4E0B\u6587\u91CC\u6CE8\u5165\u4EC0\u4E48\u3001\u7B49\u591A\u4E45\u3002"
  },
  {
    id: "pages",
    title: "\u77E5\u8BC6\u9875",
    summary: "\u77E5\u8BC6\u9875\u600E\u4E48\u751F\u6210\u3001\u4EC0\u4E48\u65F6\u5019\u5237\u65B0\u3002"
  },
  {
    id: "retention",
    title: "\u5199\u5165\u4E0E\u4FDD\u7559",
    summary: "\u4F1A\u8BDD\u600E\u4E48\u843D\u5E93\u3001\u62BD\u53D6\u591A\u7EC6\u3001\u6309\u4EC0\u4E48\u7C92\u5EA6\u5F52\u5E76\u3002"
  },
  {
    id: "ingest",
    title: "\u79CD\u5B50\u4E0E\u8DDF\u8FDB",
    summary: "\u51B7\u542F\u52A8\u65F6\u4ECE\u54EA\u91CC\u53D6\u6599\uFF0C\u4E4B\u540E\u600E\u4E48\u4FDD\u6301\u5F53\u524D\u3002"
  },
  {
    id: "scope",
    title: "\u8303\u56F4\u4E0E\u5F00\u5173",
    summary: "\u54EA\u4E9B\u9879\u76EE\u6709\u8BB0\u5FC6\uFF0C\u4EE5\u53CA\u6392\u67E5\u7528\u7684\u5F00\u5173\u3002"
  }
];
var CONFIG_FIELDS = [
  // ── connection ────────────────────────────────────────────────────────────────
  {
    key: "serverMode",
    group: "connection",
    kind: "enum",
    values: ["cloud", "self-hosted", "daemon"],
    default: "cloud",
    env: "HINDSIGHT_SERVER_MODE",
    editable: true,
    scope: "global",
    summary: "cloud = \u5B98\u65B9\u6258\u7BA1\uFF1Bself-hosted = \u4F60\u81EA\u5DF1\u7684\u670D\u52A1\u5668\uFF08\u914D\u5408 apiUrl\uFF09\uFF1Bdaemon = \u672C\u673A hindsight-embed \u5B88\u62A4\u8FDB\u7A0B\uFF08apiUrl \u88AB\u5FFD\u7565\uFF09\u3002"
  },
  {
    key: "apiUrl",
    group: "connection",
    kind: "string",
    default: "https://api.hindsight.vectorize.io",
    env: "HINDSIGHT_API_URL",
    editable: true,
    scope: "global",
    summary: "Hindsight API \u5730\u5740\u3002\u81EA\u5EFA\u5E38\u89C1 http://localhost:8888\u3002"
  },
  {
    key: "apiToken",
    group: "connection",
    kind: "secret",
    default: null,
    env: "HINDSIGHT_API_TOKEN",
    editable: true,
    scope: "global",
    summary: "Bearer token\u3002\u4EE5 secret \u5B57\u6BB5\u5904\u7406\uFF0C\u4E0D\u4F1A\u968F\u8868\u5355\u54CD\u5E94\u56DE\u4F20\u3002"
  },
  {
    key: "apiPort",
    group: "connection",
    kind: "number",
    default: 9077,
    env: "HINDSIGHT_API_PORT",
    editable: true,
    scope: "global",
    summary: "daemon \u6A21\u5F0F\u76D1\u542C\u7684\u7AEF\u53E3\uFF08\u4E0D\u662F\u81EA\u5EFA\u670D\u52A1\u5668\u7684 8888\uFF09\u3002"
  },
  {
    key: "daemonIdleTimeout",
    group: "connection",
    kind: "number",
    default: null,
    env: "HINDSIGHT_DAEMON_IDLE_TIMEOUT",
    editable: true,
    scope: "global",
    summary: "daemon \u7A7A\u95F2\u591A\u5C11\u79D2\u540E\u9000\u51FA\uFF1B\u4E0D\u8BBE\u5219\u6C38\u4E0D\u81EA\u52A8\u9000\u51FA\u3002"
  },
  {
    key: "daemonProfile",
    group: "connection",
    kind: "string",
    default: "coding-agent",
    env: "HINDSIGHT_DAEMON_PROFILE",
    editable: true,
    scope: "global",
    summary: "daemon \u4F7F\u7528\u54EA\u4E2A hindsight-embed profile\uFF08\u5373\u54EA\u4E2A\u672C\u5730\u5E93\uFF09\u3002"
  },
  {
    key: "embedVersion",
    group: "connection",
    kind: "string",
    default: null,
    env: "HINDSIGHT_EMBED_VERSION",
    editable: true,
    scope: "global",
    summary: "daemon \u901A\u8FC7 uvx \u8FD0\u884C\u54EA\u4E2A hindsight-embed \u7248\u672C\uFF0C\u9ED8\u8BA4 latest\u3002"
  },
  {
    key: "embedPackagePath",
    group: "connection",
    kind: "string",
    default: null,
    env: "HINDSIGHT_EMBED_PACKAGE_PATH",
    editable: true,
    scope: "global",
    summary: "\u6539\u7528\u672C\u5730 hindsight-embed checkout \u800C\u4E0D\u662F\u53D1\u5E03\u7248\uFF08\u5F00\u53D1\u7528\uFF09\u3002"
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
    summary: "\u56FA\u5B9A bank id\uFF1B\u8BBE\u4E86\u5B83\u5C31\u4E0D\u518D\u6309\u4ED3\u5E93\u52A8\u6001\u5206\u5E93\uFF08\u9664\u975E dynamicBankId \u4E3A true\uFF09\u3002"
  },
  {
    key: "dynamicBankId",
    group: "routing",
    kind: "boolean",
    default: null,
    env: "HINDSIGHT_DYNAMIC_BANK_ID",
    editable: true,
    scope: "bank",
    summary: "\u5373\u4F7F\u8BBE\u4E86 bankId \u4E5F\u5F3A\u5236\u6309\u4ED3\u5E93\u52A8\u6001\u89E3\u6790\u3002"
  },
  {
    key: "bankIdTemplate",
    group: "routing",
    kind: "string",
    default: "coding-agent::{gitProject}",
    env: "HINDSIGHT_BANK_ID_TEMPLATE",
    editable: true,
    scope: "bank",
    summary: "\u52A8\u6001 bank id \u7684\u683C\u5F0F\uFF1B\u5360\u4F4D\u7B26\uFF1A{gitProject} {project} {harness} {channel} {user}\u3002"
  },
  {
    key: "mapPathToBank",
    group: "routing",
    kind: "json",
    default: null,
    editable: false,
    scope: "path",
    summary: "\u7EDD\u5BF9\u8DEF\u5F84 \u2192 bank \u7684\u6620\u5C04\uFF0C\u6700\u957F\u524D\u7F00\u751F\u6548\uFF0C\u4F18\u5148\u7EA7\u6700\u9AD8\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  },
  {
    key: "resolveWorktrees",
    group: "routing",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_RESOLVE_WORKTREES",
    editable: true,
    scope: "bank",
    summary: "git worktree \u5171\u7528\u4E3B\u4ED3\u5E93\u7684 bank\uFF08\u9ED8\u8BA4\u5F00\uFF09\u3002"
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
    summary: "\u9996\u8F6E\u6CE8\u5165\u4EC0\u4E48\uFF1Areflect \u5408\u6210 / \u77E5\u8BC6\u9875\u68C0\u7D22 / \u8BB0\u5FC6\u53EC\u56DE / \u4E0D\u6CE8\u5165\u3002"
  },
  {
    key: "autoReflect",
    group: "recall",
    kind: "boolean",
    default: null,
    env: "HINDSIGHT_AUTO_REFLECT",
    editable: false,
    scope: "harness",
    summary: "\u5DF2\u5E9F\u5F03\uFF0C\u6539\u7528 autoInject\uFF1B\u4EC5\u5728\u672A\u8BBE autoInject \u65F6\u517C\u5BB9\u751F\u6548\u3002"
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
    summary: "hindsight_reflect \u5DE5\u5177\u7684\u5408\u6210\u9884\u7B97\uFF1B\u5927\u5E93\u4E0A\u9AD8\u9884\u7B97\u53EF\u80FD\u649E\u670D\u52A1\u7AEF\u5899\u949F\u8D85\u65F6\u3002"
  },
  {
    key: "reflectTimeoutMs",
    group: "recall",
    kind: "number",
    default: 2e4,
    env: "HINDSIGHT_REFLECT_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: "\u81EA\u52A8\u4F1A\u8BDD reflect \u7684\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09\uFF0C\u8981\u653E\u8FDB\u5BBF\u4E3B\u7684\u94A9\u5B50\u7A97\u53E3\u3002"
  },
  {
    key: "reflectToolTimeoutMs",
    group: "recall",
    kind: "number",
    default: 33e4,
    env: "HINDSIGHT_REFLECT_TOOL_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: "hindsight_reflect \u5DE5\u5177\u672C\u8EAB\u7684\u8D85\u65F6\uFF0C\u523B\u610F\u8FDC\u5927\u4E8E\u81EA\u52A8 reflect\u3002"
  },
  {
    key: "injectTimeoutMs",
    group: "recall",
    kind: "number",
    default: 7e3,
    env: "HINDSIGHT_INJECT_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: "knowledge pages / recall \u6CE8\u5165\u7684\u68C0\u7D22\u8D85\u65F6\uFF0C\u4E5F\u662F reflect \u5931\u8D25\u540E\u7684\u56DE\u9000\u9884\u7B97\u3002"
  },
  {
    key: "pageSearchLimit",
    group: "recall",
    kind: "number",
    default: 10,
    env: "HINDSIGHT_PAGE_SEARCH_LIMIT",
    editable: true,
    scope: "harness",
    summary: "\u4E00\u6B21\u77E5\u8BC6\u9875\u68C0\u7D22\u8FD4\u56DE\u51E0\u9875\uFF1B\u6CE8\u5165\u3001\u56DE\u9000\u4E0E\u5DE5\u5177\u5171\u7528\u540C\u4E00\u4E2A\u9650\u5236\u3002"
  },
  {
    key: "recallOptions",
    group: "recall",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: "\u9010\u952E\u5408\u5E76\u8FDB\u6BCF\u6B21 recall \u8BF7\u6C42\u4F53\u7684\u8986\u76D6\u9879\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  },
  {
    key: "toolGuideExtra",
    group: "recall",
    kind: "string",
    default: null,
    env: "HINDSIGHT_TOOL_GUIDE_EXTRA",
    editable: true,
    scope: "harness",
    summary: "\u8FFD\u52A0\u5728\u5185\u7F6E\u5DE5\u5177\u6307\u5357\u4E4B\u540E\u7684\u81EA\u5B9A\u4E49\u6307\u5F15\uFF08\u53EA\u589E\u4E0D\u66FF\uFF09\u3002"
  },
  {
    key: "pageRefreshEveryTurns",
    group: "recall",
    kind: "number",
    default: 1,
    env: "HINDSIGHT_PAGE_REFRESH_EVERY_TURNS",
    editable: true,
    scope: "harness",
    summary: "\u6BCF\u591A\u5C11\u4E2A\u7528\u6237\u8F6E\u6B21\u5237\u65B0\u4E00\u6B21\u77E5\u8BC6\u9875\u6E05\u5355\uFF080 \u7B49\u540C 1\uFF09\u3002"
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
    summary: "\u65B0\u5EFA\u77E5\u8BC6\u9875\u7528\u4EC0\u4E48\u89E6\u53D1\u5237\u65B0\uFF1Bauto-refresh \u6700\u53CA\u65F6\u4E5F\u6700\u8D35\u3002"
  },
  {
    key: "pageTriggerCron",
    group: "pages",
    kind: "string",
    default: "H * * * *",
    env: "HINDSIGHT_PAGE_TRIGGER_CRON",
    editable: true,
    scope: "harness",
    summary: "cron \u89E6\u53D1\u7684\u65F6\u95F4\u8868\uFF08UTC\uFF0C5 \u6BB5\uFF09\uFF1BH \u8868\u793A\u6309\u9875\u540D\u6563\u5217\u5230\u5404\u81EA\u5206\u949F\u3002"
  },
  {
    key: "pages",
    group: "pages",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: "\u9010\u9875\u6539\u5199\u6216\u505C\u7528\u5185\u7F6E\u77E5\u8BC6\u9875\uFF08false \u505C\u7528\uFF0C{source_query} \u6362\u95EE\u9898\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  },
  {
    key: "customPages",
    group: "pages",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: "\u4F60\u81EA\u5DF1\u7684\u77E5\u8BC6\u9875\uFF08\u540D\u79F0 \u2192 {source_query, tags}\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
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
    summary: "\u4F1A\u8BDD\u7ED3\u675F\u540E\u662F\u5426\u5199\u56DE transcript\uFF1B\u5173\u6389\u540E\u53EC\u56DE\u4E0E\u79CD\u5B50\u7167\u5E38\u3002"
  },
  {
    key: "retainTags",
    group: "retention",
    kind: "stringList",
    default: null,
    env: "HINDSIGHT_RETAIN_TAGS",
    editable: true,
    scope: "harness",
    summary: "\u6BCF\u6B21\u5199\u56DE\u9644\u52A0\u7684\u6807\u7B7E\uFF0C\u4F8B\uFF1Aproject:{gitProject}\u3001env:work\u3002"
  },
  {
    key: "retainMetadata",
    group: "retention",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: "\u6BCF\u6B21\u5199\u56DE\u9644\u52A0\u7684\u5143\u6570\u636E\uFF08\u540C retainTags \u7684\u5360\u4F4D\u7B26\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  },
  {
    key: "retainContext",
    group: "retention",
    kind: "string",
    default: null,
    editable: true,
    scope: "harness",
    summary: "\u968F\u6BCF\u6B21\u5199\u56DE\u53D1\u9001\u7684 context\uFF0C\u62BD\u53D6\u636E\u6B64\u5224\u65AD\u4E00\u53E5\u8BDD\u662F\u8C01\u8BF4\u7684\u3002"
  },
  {
    key: "manageBankConfig",
    group: "retention",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_MANAGE_BANK_CONFIG",
    editable: true,
    scope: "bank",
    summary: "\u5141\u8BB8\u63D2\u4EF6\u589E\u91CF\u5851\u9020 bank \u81EA\u8EAB\u914D\u7F6E\uFF08\u53EA\u8865\u4E0D\u6539\uFF09\u3002"
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
    summary: "\u670D\u52A1\u7AEF\u4ECE\u5199\u56DE\u5185\u5BB9\u91CC\u62BD\u53D6\u8BB0\u5FC6\u7684\u529B\u5EA6\uFF1Bverbose \u66F4\u7EC6\u4E5F\u66F4\u8D35\u3002"
  },
  {
    key: "defaultBankConfig",
    group: "retention",
    kind: "json",
    default: null,
    editable: false,
    scope: "bank",
    summary: "\u65B0\u5EFA bank \u65F6\u5199\u5165\u7684 bank-config \u5B57\u6BB5\uFF08\u63D2\u4EF6\u81EA\u7BA1\u7684\u5B57\u6BB5\u9664\u5916\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
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
    summary: "\u5F52\u5E76\u89C2\u5BDF\u7684\u7C92\u5EA6\uFF1B\u663E\u5F0F\u4E8C\u7EF4\u6570\u7EC4\uFF08\u5B57\u9762 scope \u5217\u8868\uFF09\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u5199\u3002"
  },
  {
    key: "maxParallelRetains",
    group: "retention",
    kind: "number",
    default: 10,
    env: "HINDSIGHT_MAX_PARALLEL_RETAINS",
    editable: true,
    scope: "harness",
    summary: "\u5E76\u53D1\u5199\u56DE\u8BF7\u6C42\u4E0A\u9650\uFF1B\u670D\u52A1\u5668\u8FD4\u56DE 429 \u65F6\u5E94\u8C03\u4F4E\u800C\u4E0D\u662F\u8C03\u9AD8\u3002"
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
    summary: "\u51B7\u4ED3\u5E93\u9996\u6B21\u4F1A\u8BDD\u65F6\u7528 git \u5386\u53F2\u81EA\u52A8\u64AD\u79CD\u3002"
  },
  {
    key: "seedLimit",
    group: "ingest",
    kind: "number",
    default: 300,
    env: "HINDSIGHT_SEED_LIMIT",
    editable: true,
    scope: "harness",
    summary: "\u81EA\u52A8\u64AD\u79CD\u6700\u591A\u53D6\u6700\u8FD1\u591A\u5C11\u6761\u63D0\u4EA4\u3002"
  },
  {
    key: "codebaseSurvey",
    group: "ingest",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_CODEBASE_SURVEY",
    editable: true,
    scope: "harness",
    summary: "\u51B7\u4ED3\u5E93\u65F6\u8D77\u4E00\u4E2A\u65E0\u5934 claude \u5DE1\u89C8\u4EE3\u7801\u7ED3\u6784\u3002"
  },
  {
    key: "surveyModel",
    group: "ingest",
    kind: "string",
    default: "haiku",
    env: "HINDSIGHT_SURVEY_MODEL",
    editable: true,
    scope: "harness",
    summary: "\u5DE1\u89C8\u7528\u7684\u6A21\u578B\uFF08claude -p --model\uFF09\u3002"
  },
  {
    key: "surveyBudgetUsd",
    group: "ingest",
    kind: "number",
    default: 2,
    env: "HINDSIGHT_SURVEY_BUDGET_USD",
    editable: true,
    scope: "harness",
    summary: "\u5355\u6B21\u5DE1\u89C8\u7684\u82B1\u8D39\u4E0A\u9650\uFF08\u7F8E\u5143\uFF09\u3002"
  },
  {
    key: "surveyRefreshCommits",
    group: "ingest",
    kind: "number",
    default: 20,
    env: "HINDSIGHT_SURVEY_REFRESH_COMMITS",
    editable: true,
    scope: "harness",
    summary: "\u7D2F\u8BA1\u591A\u5C11\u6761\u65B0\u63D0\u4EA4\u540E\u91CD\u8DD1\u5DE1\u89C8\uFF1B0 \u8868\u793A\u53EA\u5728\u51B7\u542F\u52A8\u64AD\u4E00\u6B21\u3002"
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
    summary: "git \u5386\u53F2\u600E\u4E48\u8FDB\u8BB0\u5FC6\uFF1A\u53EA\u63D0\u4EA4\u4FE1\u606F / \u542B\u5B8C\u6574 diff / \u4E0D\u6444\u53D6\u3002"
  },
  {
    key: "autoUpdate",
    group: "ingest",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_AUTO_UPDATE",
    editable: true,
    scope: "harness",
    summary: "\u6BCF\u5929\u81EA\u68C0\u5E76\u540E\u53F0\u66F4\u65B0 ~/.hindsight/coding-agents\uFF1B\u5173\u6389\u5373\u9501\u5B9A\u7248\u672C\u3002"
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
    summary: "\u786C\u5F00\u5173\uFF1A\u6574\u4E2A\u63D2\u4EF6\u5728\u8BB0\u5FC6\u4E0A\u53D8\u4E3A\u60F0\u6027\uFF08\u65E0 bank\u3001\u65E0\u5199\u56DE\uFF09\u3002"
  },
  {
    key: "optInOnly",
    group: "scope",
    kind: "boolean",
    default: false,
    env: "HINDSIGHT_OPT_IN_ONLY",
    editable: true,
    scope: "global",
    summary: "\u53EA\u5728\u88AB\u70B9\u540D\u7684\u76EE\u5F55\u91CC\u5DE5\u4F5C\uFF1B\u672A\u5217\u51FA\u7684\u9879\u76EE\u5B8C\u5168\u4E0D\u7559\u75D5\u3002"
  },
  {
    key: "optInPaths",
    group: "scope",
    kind: "stringList",
    default: null,
    env: "HINDSIGHT_OPT_IN_PATHS",
    editable: true,
    scope: "path",
    summary: "\u70B9\u540D\u7684\u76EE\u5F55\uFF08\u6309\u524D\u7F00\u5339\u914D\uFF0C\u652F\u6301 ~\uFF09\uFF0C\u5176\u4E0B\u6BCF\u4E2A\u4ED3\u5E93\u4ECD\u5404\u81EA\u6210\u5E93\u3002"
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
    summary: "\u63D2\u4EF6\u65E5\u5FD7\u7EA7\u522B\uFF1BHINDSIGHT_LOG_LEVEL \u4ECD\u53EF\u7528\u4E8E\u4E34\u65F6\u6392\u67E5\u3002"
  },
  {
    key: "harness",
    group: "scope",
    kind: "string",
    default: "dsh",
    env: "HINDSIGHT_HARNESS",
    editable: false,
    scope: "harness",
    summary: "\u8FD0\u884C\u65F6\u9002\u914D\u5668\u6807\u8BC6\u3002\u5728 DSH \u91CC\u6052\u4E3A dsh\uFF0C\u7531\u5BBF\u4E3B\u5199\u5165\uFF0C\u4E0D\u8981\u624B\u6539\u3002"
  },
  {
    key: "harnesses",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: "\u6309 harness \u8986\u76D6\u4EFB\u610F\u5B57\u6BB5\uFF08harnesses.dsh / harnesses.claude-code \u2026\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  },
  {
    key: "banks",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "bank",
    summary: "\u6309\u5DF2\u89E3\u6790\u7684 bank id \u8986\u76D6\uFF1A\u7981\u7528\u3001\u6539\u540D\uFF08bank\uFF09\u3001\u6539\u884C\u4E3A\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  },
  {
    key: "paths",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "path",
    summary: "\u6309\u7EDD\u5BF9\u8DEF\u5F84\u524D\u7F00\u8986\u76D6\uFF08\u53EF\u6362\u670D\u52A1\u5668/\u79DF\u6237\uFF09\u3002\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002"
  }
];
var EDITABLE_FIELDS = CONFIG_FIELDS.filter(
  (field) => field.editable
);

// src/client/model.ts
var SETTINGS_SLOT = "settings.section";
var PAGE_ID = "hindsight-settings";
var PAGE_ORDER = 35;
var PAGE_LABEL = "Hindsight \u8BB0\u5FC6\u8BBE\u7F6E";
var SERVICE_NAMESPACE = "hindsightSettings";
var SERVICE_KEY = `remote.${SERVICE_NAMESPACE}`;
var CONTRIBUTION_PACKAGE = "@local/dsh-hindsight-settings";
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
function groupDescriptor(group) {
  const declared = FIELD_GROUPS.find((candidate) => candidate.id === group);
  return declared ?? { id: group, title: group, summary: "" };
}
var FIELD_ORDER = new Map(
  CONFIG_FIELDS.map((field, index) => [field.key, index])
);
function byDeclarationOrder(left, right) {
  const a = FIELD_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER;
  const b = FIELD_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER;
  return a - b;
}
function buildSections(fields) {
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
    sections.push({ group: groupDescriptor(group), fields: [...bucket].sort(byDeclarationOrder) });
  };
  for (const group of FIELD_GROUPS) emit(group.id);
  for (const group of buckets.keys()) emit(group);
  return sections;
}
var BANKS_TAB_ID = "__banks__";
var BANKS_TAB_TITLE = "\u6309\u9879\u76EE\uFF08banks\uFF09";
var BANKS_TAB_SUMMARY = "\u4E3A\u5355\u4E2A bank / \u4ED3\u5E93\u8986\u76D6\u8BBE\u7F6E\uFF0C\u5176\u4F59 bank \u4ECD\u7528\u9876\u5C42\u503C\u3002";
function buildTabs(fields) {
  const tabs = buildSections(fields).map((section) => ({
    id: section.group.id,
    title: section.group.title,
    summary: section.group.summary,
    kind: "group",
    fields: section.fields
  }));
  tabs.push({
    id: BANKS_TAB_ID,
    title: BANKS_TAB_TITLE,
    summary: BANKS_TAB_SUMMARY,
    kind: "banks",
    fields: []
  });
  return tabs;
}
function banksScopeText() {
  return "banks.<id> \u8986\u76D6\u8BE5 bank \u7684\u8BBE\u7F6E\uFF08\u9876\u5C42\u4ECD\u5BF9\u5176\u4F59 bank \u751F\u6548\uFF09\uFF1B\u4E00\u4E2A bank \u91CC\u7684\u952E\u5220\u9664\u540E\u4F1A\u56DE\u9000\u5230\u9876\u5C42\u3002";
}
function pathsReadOnlyText() {
  return "paths \u6309\u7EDD\u5BF9\u76EE\u5F55\u524D\u7F00\u8986\u76D6\uFF08paths.<\u76EE\u5F55>\uFF09\uFF0C\u901A\u5E38\u4E0D\u624B\u5199\uFF0C\u56E0\u6B64\u672C\u9875\u53EA\u5217\u51FA\u6587\u4EF6\u91CC\u5DF2\u6709\u7684\u6BB5\u843D\uFF0C\u8BF7\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u7F16\u8F91\u3002";
}
function scopedEditorTitle(scope) {
  return scope.kind === "bank" ? `banks.${scope.id}` : scope.kind === "path" ? `paths.${scope.dir}` : "\u9876\u5C42";
}
var UNSET_TEXT = "\u672A\u8BBE\u7F6E";
function formatScalar(value) {
  if (value === void 0 || value === null) return UNSET_TEXT;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? UNSET_TEXT : value.map((entry) => formatScalar(entry)).join(", ");
  }
  return JSON.stringify(value) ?? UNSET_TEXT;
}
function formatFieldValue(field, value) {
  if (value === void 0 || value === null) return UNSET_TEXT;
  if (field.kind === "json") return JSON.stringify(value, null, 2) ?? UNSET_TEXT;
  if (field.kind === "stringList") {
    return Array.isArray(value) && value.length > 0 ? value.map((entry) => String(entry)).join("\n") : UNSET_TEXT;
  }
  return formatScalar(value);
}
function formatDefault(field) {
  return field.default === null ? UNSET_TEXT : formatScalar(field.default);
}
function scopeLabel(scope) {
  switch (scope) {
    case "global":
      return "\u5168\u5C40";
    case "harness":
      return "\u6309 harness";
    case "bank":
      return "\u6309 bank";
    case "path":
      return "\u6309\u8DEF\u5F84";
    default:
      return scope;
  }
}
function fallbackText(field) {
  const parts = [];
  parts.push(field.default === null ? "\u4E0A\u6E38\u9ED8\u8BA4\u672A\u8BBE\u503C" : `\u9ED8\u8BA4 ${formatScalar(field.default)}`);
  if (field.env !== void 0) parts.push(`\u73AF\u5883\u53D8\u91CF ${field.env}`);
  return `\u6587\u4EF6\u672A\u8BBE\u7F6E\u8BE5\u9879\uFF0C\u5B9E\u9645\u751F\u6548\uFF1A${parts.join(" \u2192 ")}\u3002`;
}
function shadowText() {
  return "harnesses.dsh \u4E5F\u8BBE\u7F6E\u4E86\u8FD9\u4E00\u9879\uFF0C\u5B83\u4F18\u5148\u4E8E\u672C\u9875\u5199\u5165\u7684\u9876\u5C42\u503C\u2014\u2014\u5728\u8FD9\u91CC\u4FDD\u5B58\u4E0D\u4F1A\u6539\u53D8\u5B9E\u9645\u751F\u6548\u7684\u503C\u3002";
}
function readOnlyText() {
  return "\u8BE5\u9879\u662F\u6587\u4EF6\u4E13\u5C5E\u7684\u5D4C\u5957\u7ED3\u6784\u6216\u5BBF\u4E3B\u76D6\u7AE0\u5B57\u6BB5\uFF0C\u8868\u5355\u65E0\u6CD5\u5B89\u5168\u8868\u8FBE\uFF0C\u53EA\u80FD\u5728\u914D\u7F6E\u6587\u4EF6\u91CC\u7F16\u8F91\u3002";
}
function effectiveText(field) {
  return field.default === null || field.default === void 0 ? "" : draftValueFor(field, field.default);
}
function prefillValueFor(field) {
  return field.inFile ? draftValueFor(field, field.value) : effectiveText(field);
}
function valueSourceNote(field, scope = "top") {
  if (field.inFile) return "\u6765\u81EA\u914D\u7F6E\u6587\u4EF6";
  if (field.default === null || field.default === void 0) return void 0;
  const shown = formatScalar(field.default);
  return scope === "bank" ? `\u672C bank \u672A\u8986\u76D6\u8BE5\u9879\uFF1B\u663E\u793A\u7684\u662F\u9ED8\u8BA4\u503C ${shown}\uFF08\u5220\u9664\u540E\u56DE\u9000\u5230\u9876\u5C42\uFF09\u3002` : `\u672A\u5199\u5165\u6587\u4EF6\uFF1B\u663E\u793A\u7684\u662F\u9ED8\u8BA4\u503C ${shown}`;
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
function parseDraft(field, raw) {
  const text = raw.trim();
  switch (field.kind) {
    case "string":
    case "secret":
      return { ok: true, value: raw === "" ? null : raw };
    case "number": {
      if (text === "") return { ok: true, value: null };
      const parsed = Number(text);
      if (!Number.isFinite(parsed)) {
        return { ok: false, message: `${field.key} \u9700\u8981\u4E00\u4E2A\u6570\u5B57\uFF0C\u6536\u5230\u300C${text}\u300D\u3002` };
      }
      return { ok: true, value: parsed };
    }
    case "boolean": {
      if (text === "") return { ok: true, value: null };
      if (text === "true") return { ok: true, value: true };
      if (text === "false") return { ok: true, value: false };
      return { ok: false, message: `${field.key} \u53EA\u63A5\u53D7 true \u6216 false\u3002` };
    }
    case "enum": {
      if (text === "") return { ok: true, value: null };
      const values = field.values ?? [];
      if (!values.includes(text)) {
        return { ok: false, message: `${field.key} \u53EA\u63A5\u53D7 ${values.join(" / ")}\u3002` };
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
        return { ok: false, message: `${field.key} \u4E0D\u662F\u5408\u6CD5\u7684 JSON\u3002` };
      }
    }
    default:
      return { ok: true, value: raw === "" ? null : raw };
  }
}
function diffDraft(fields, draft, cleared = /* @__PURE__ */ new Set()) {
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
    const parsed = parseDraft(field, raw);
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
var LOADING_TEXT = "\u6B63\u5728\u8BFB\u53D6\u5BBF\u4E3B\u914D\u7F6E\u2026";
function describeAvailability(input) {
  if (input.state.kind === "unavailable") return input.state.reason;
  if (input.state.kind === "loading") return LOADING_TEXT;
  if (input.loadError !== void 0) return input.loadError;
  if (input.view === void 0) return LOADING_TEXT;
  if (input.view.error !== void 0) {
    return `\u914D\u7F6E\u6587\u4EF6\u5B58\u5728\u4F46\u65E0\u6CD5\u89E3\u6790\uFF0C\u672C\u9875\u4E0D\u4F1A\u5199\u5165\u4EE5\u514D\u8986\u76D6\u5B83\uFF1A${input.view.error}`;
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
function summarizeApply(patch, result) {
  if (!result.changed) return "\u6587\u4EF6\u6CA1\u6709\u53D8\u5316\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u6539\u52A8\u3002";
  const writes = Object.values(patch).filter((value) => value !== null).length;
  const removals = result.removed.length;
  const parts = [];
  if (writes > 0) parts.push(`\u5199\u5165\u6216\u66F4\u65B0 ${writes} \u9879`);
  if (removals > 0) parts.push(`\u5220\u9664 ${removals} \u9879\uFF08\u56DE\u9000\u5230\u73AF\u5883\u53D8\u91CF\uFF0C\u7136\u540E\u56DE\u9000\u5230\u63D2\u4EF6\u9ED8\u8BA4\u503C\uFF09`);
  if (parts.length === 0) parts.push(`\u5DF2\u66F4\u65B0 ${result.path}`);
  return `\u5DF2\u4FDD\u5B58\u5230 ${result.path}\uFF1A${parts.join("\uFF0C")}\u3002`;
}

// src/client/index.tsx
var NO_REMOTE_REASON = "\u5BBF\u4E3B\u6CA1\u6709\u63D0\u4F9B Remote \u670D\u52A1\uFF08ctx.remote \u4E0D\u5B58\u5728\uFF09\uFF0C\u672C\u9875\u65E0\u6CD5\u8BFB\u5199\u914D\u7F6E\u3002\u8BF7\u786E\u8BA4 dsh-api-gateway \u7684\u5BA2\u6237\u7AEF\u534A\u8FB9\u5DF2\u52A0\u8F7D\u3002";
var name = "dsh-hindsight-settings";
var inject = ["slots", "remote"];
function apply(ctx) {
  const report = createReporter(ctx);
  try {
    const slots = ctx.slots;
    report(
      `apply: slots=${typeof slots} inject=${typeof slots?.inject} register=${typeof slots?.register} effect=${typeof ctx.effect} get=${typeof ctx.get}`
    );
    if (slots === void 0 || typeof slots.inject !== "function" || typeof slots.register !== "function") {
      report("apply: the slot service is missing inject/register \u2014 the page cannot appear");
      return;
    }
    let Page;
    try {
      Page = createPage(createServiceStore(ctx), report);
    } catch (error) {
      const text = messageOf(error);
      report(`setup: threw \u2014 ${text}`);
      Page = () => React.createElement(
        "div",
        { className: "dhs-page", "data-plugin-hindsight-settings": "failed" },
        React.createElement(
          "div",
          { className: "dhs-head" },
          React.createElement("span", { className: "dhs-title" }, PAGE_LABEL)
        ),
        React.createElement("div", { className: "dhs-note dhs-warn" }, `\u521D\u59CB\u5316\u5931\u8D25\uFF1A${text}`)
      );
    }
    const register = () => {
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
        report(`register: threw \u2014 ${text}`);
        if (/already has an entry/.test(text)) {
          const retry = setTimeout(() => {
            try {
              slots.register(
                { name: SETTINGS_SLOT, id: PAGE_ID, order: PAGE_ORDER, label: () => PAGE_LABEL },
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
      reason: `Remote \u8D21\u732E\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u5BBF\u4E3B\u6CA1\u6709\u6302\u8F7D ${SERVICE_KEY}\u3002\u8BF7\u786E\u8BA4 dsh-api-gateway \u6B63\u5728\u670D\u52A1\u8BE5\u547D\u540D\u7A7A\u95F4\u3002`
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
    state = { kind: "unavailable", reason: NO_REMOTE_REASON };
  } else {
    state = { kind: "loading" };
    void mount(ctx, remote).then(publish, (error) => {
      publish({
        kind: "unavailable",
        reason: `Remote \u8D21\u732E\u6302\u8F7D\u5931\u8D25\uFF1A${remoteErrorText(error)}`
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
  ".dhs-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}"
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
function createPage(store, report) {
  return function HindsightSettingsPage() {
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
var TOP_SCOPE = { kind: "top" };
function scopeKey(scope) {
  if (scope === void 0) return "top";
  if (scope.kind === "bank") return `bank:${scope.id}`;
  if (scope.kind === "path") return `path:${scope.dir}`;
  return "top";
}
function useScopeForm(service, scope, report, onSaved) {
  const [view, setView] = React.useState(void 0);
  const [loadError, setLoadError] = React.useState(void 0);
  const [draft, setDraft] = React.useState({});
  const [busy, setBusy] = React.useState(void 0);
  const [cleared, setCleared] = React.useState(() => /* @__PURE__ */ new Set());
  const [notice, setNotice] = React.useState(null);
  const label = scopeKey(scope);
  const reload = React.useCallback(async () => {
    setBusy("reload");
    try {
      const result = await service.describe(scope ?? TOP_SCOPE);
      if (result.ok) {
        if (!isSettingsView(result.value)) {
          setLoadError("\u5BBF\u4E3B\u8FD4\u56DE\u7684\u8BBE\u7F6E\u6570\u636E\u683C\u5F0F\u65E0\u6CD5\u8BC6\u522B\uFF08\u7F3A\u5C11 path / fields\uFF09\u3002");
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
        setLoadError(`\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1A${remoteErrorText(result.error)}`);
      }
    } catch (error) {
      setLoadError(`\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1A${remoteErrorText(error)}`);
    } finally {
      setBusy(void 0);
    }
  }, [service, scope, label, report]);
  React.useEffect(() => {
    void reload();
  }, [reload]);
  const availability = describeAvailability({ state: { kind: "ready", service }, view, loadError });
  const diff = React.useMemo(
    () => view === void 0 ? { patch: {}, errors: [], changed: [] } : diffDraft(view.fields, draft, cleared),
    [view, draft, cleared]
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
        text: `\u6709 ${diff.errors.length} \u4E2A\u5B57\u6BB5\u4E0D\u5408\u6CD5\uFF0C\u672A\u63D0\u4EA4\uFF1A${diff.errors.map((entry) => entry.message).join(" ")}`
      });
      return;
    }
    if (diff.changed.length === 0) {
      setNotice({ kind: "info", text: "\u6CA1\u6709\u9700\u8981\u4FDD\u5B58\u7684\u6539\u52A8\u3002" });
      return;
    }
    setBusy("save");
    setNotice(null);
    void (async () => {
      try {
        const patch = diff.patch;
        const result = scope === void 0 ? await service.apply(patch) : await service.applyScoped(scope, patch);
        if (result.ok) {
          setNotice({ kind: "ok", text: summarizeApply(patch, result.value) });
          if (onSaved !== void 0) onSaved();
        } else {
          setNotice({ kind: "err", text: `\u4FDD\u5B58\u5931\u8D25\uFF1A${remoteErrorText(result.error)}` });
        }
      } catch (error) {
        setNotice({ kind: "err", text: `\u4FDD\u5B58\u5931\u8D25\uFF1A${remoteErrorText(error)}` });
      } finally {
        setBusy(void 0);
        await reload();
      }
    })();
  }, [view, diff, service, scope, reload, onSaved]);
  const discard = React.useCallback(() => {
    if (view !== void 0) setDraft(draftFromFields(view.fields));
    setCleared(/* @__PURE__ */ new Set());
    setNotice({ kind: "info", text: "\u5DF2\u4E22\u5F03\u672A\u4FDD\u5B58\u7684\u6539\u52A8\u3002" });
  }, [view]);
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
  const { service, report } = props;
  const form = useScopeForm(service, void 0, report, void 0);
  const [activeTab, setActiveTab] = React.useState("");
  const tabs = React.useMemo(() => buildTabs(form.view?.fields ?? []), [form.view]);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const groupCount = tabs.filter((tab) => tab.kind === "group").length;
  const disabled = !form.editable || form.busy !== void 0;
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
        form.view === void 0 ? LOADING_TEXT : `${form.view.fields.length} \u4E2A\u914D\u7F6E\u9879 \xB7 \u5206\u7EC4 ${groupCount} \u4E2A`
      )
    ),
    // The path is whatever the host resolved, so this line is correct on every OS.
    React.createElement(
      "div",
      { className: "dhs-note" },
      "\u672C\u9875\u76F4\u63A5\u8BFB\u5199\u5BBF\u4E3B\u5F53\u524D\u4F7F\u7528\u7684\u914D\u7F6E\u6587\u4EF6\uFF1A",
      React.createElement("code", null, form.view?.path ?? LOADING_TEXT),
      React.createElement("br", null),
      "\u7559\u7A7A\u5E76\u4FDD\u5B58\uFF1D\u5220\u9664\u8BE5\u952E\uFF0C\u8BE5\u9879\u968F\u5373\u56DE\u9000\u5230\u73AF\u5883\u53D8\u91CF\uFF0C\u518D\u56DE\u9000\u5230\u63D2\u4EF6\u9ED8\u8BA4\u503C\u3002"
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
        members: form.view?.banks ?? [],
        paths: form.view?.paths ?? [],
        onChanged: form.reload
      }) : renderGroup(active, form, disabled)
    ),
    React.createElement(ActionBar, { form, saveLabel: "\u4FDD\u5B58" })
  );
}
function renderGroup(tab, form, disabled) {
  return React.createElement(
    "div",
    { className: "dhs-group" },
    React.createElement(
      "div",
      { className: "dhs-group-head" },
      React.createElement("span", { className: "dhs-group-title" }, tab.title),
      React.createElement("span", { className: "dhs-sub" }, tab.summary)
    ),
    tab.fields.length === 0 ? React.createElement("div", { className: "dhs-meta" }, "\u672C\u7EC4\u6682\u65E0\u914D\u7F6E\u9879\u3002") : React.createElement(FieldRows, {
      fields: tab.fields,
      form,
      scopeKind: "top",
      disabled
    })
  );
}
function BanksPanel(props) {
  const { service, report, members, paths, onChanged } = props;
  const [openId, setOpenId] = React.useState(void 0);
  const [newId, setNewId] = React.useState("");
  const [addError, setAddError] = React.useState(void 0);
  const open = members.find((member) => member.id === openId);
  const onAdd = () => {
    const candidate = newId.trim();
    if (candidate === "") {
      setAddError("\u8BF7\u8F93\u5165 bank id\uFF08\u4E0D\u80FD\u4E3A\u7A7A\uFF09\u3002");
      return;
    }
    if (members.some((member) => member.id === candidate)) {
      setAddError(`banks.${candidate} \u5DF2\u7ECF\u5B58\u5728\uFF0C\u8BF7\u76F4\u63A5\u4ECE\u4E0A\u9762\u7684\u5217\u8868\u6253\u5F00\u3002`);
      return;
    }
    setAddError(void 0);
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
      React.createElement("span", { className: "dhs-subhead-title" }, "\u5DF2\u6709 bank"),
      React.createElement("span", { className: "dhs-chip" }, `${members.length} \u4E2A`)
    ),
    members.length === 0 ? React.createElement("div", { className: "dhs-meta" }, "\u6587\u4EF6\u91CC\u8FD8\u6CA1\u6709 banks \u6BB5\u843D\u3002") : React.createElement(
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
              `${member.keys.length} \u4E2A\u952E`
            ),
            React.createElement(
              "button",
              {
                type: "button",
                className: "dhs-btn dhs-btn-mini",
                onClick: () => setOpenId(openId === member.id ? void 0 : member.id)
              },
              openId === member.id ? "\u6536\u8D77" : "\u6253\u5F00"
            )
          ),
          member.keys.length === 0 ? null : React.createElement(
            "div",
            { className: "dhs-meta" },
            `\u5DF2\u8BBE\u7F6E\uFF1A${member.keys.join("\u3001")}`
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
        placeholder: "\u65B0\u589E bank id\uFF0C\u4F8B\u5982 coding-agent::my-repo",
        "aria-label": "\u65B0\u589E bank id",
        onChange: (event) => {
          setNewId(event.target.value);
          setAddError(void 0);
        }
      }),
      React.createElement(
        "button",
        { type: "button", className: "dhs-btn dhs-btn-mini", onClick: onAdd },
        "\u65B0\u589E"
      )
    ),
    addError === void 0 ? null : React.createElement("div", { className: "dhs-meta dhs-err" }, addError),
    openId === void 0 ? null : React.createElement(
      "div",
      { className: "dhs-scope", "data-bank": openId },
      React.createElement(
        "div",
        { className: "dhs-subhead" },
        React.createElement("span", { className: "dhs-subhead-title" }, `\u7F16\u8F91 banks.${openId}`),
        open === void 0 ? React.createElement("span", { className: "dhs-chip" }, "\u65B0\u6BB5\u843D") : React.createElement("span", { className: "dhs-chip" }, `${open.keys.length} \u4E2A\u952E`),
        React.createElement(
          "button",
          {
            type: "button",
            className: "dhs-btn dhs-btn-mini",
            onClick: () => setOpenId(void 0)
          },
          "\u5173\u95ED"
        )
      ),
      open === void 0 ? React.createElement(
        "div",
        { className: "dhs-meta" },
        "\u4FDD\u5B58\u540E\u624D\u4F1A\u5728\u6587\u4EF6\u91CC\u521B\u5EFA\u8FD9\u4E00\u6BB5\u3002"
      ) : null,
      React.createElement(ScopedEditor, {
        key: openId,
        service,
        report,
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
        React.createElement("span", { className: "dhs-subhead-title" }, "\u6309\u8DEF\u5F84\uFF08paths\uFF09"),
        React.createElement("span", { className: "dhs-chip dhs-chip-ro" }, "\u53EA\u8BFB")
      ),
      React.createElement("div", { className: "dhs-meta" }, pathsReadOnlyText()),
      ...paths.map(
        (member) => React.createElement(
          "div",
          { className: "dhs-meta", key: member.id },
          React.createElement("code", { className: "dhs-key" }, `paths.${member.id}`),
          ` \xB7 ${member.keys.length} \u4E2A\u952E${member.keys.length === 0 ? "" : `\uFF1A${member.keys.join("\u3001")}`}`
        )
      )
    )
  );
}
function ScopedEditor(props) {
  const { service, report, bankId, onSaved } = props;
  const scope = React.useMemo(() => ({ kind: "bank", id: bankId }), [bankId]);
  const form = useScopeForm(service, scope, report, onSaved);
  const fields = form.view?.fields ?? [];
  const disabled = !form.editable || form.busy !== void 0;
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
        form.view === void 0 ? LOADING_TEXT : `${fields.length} \u4E2A\u914D\u7F6E\u9879 \xB7 \u6587\u4EF6\uFF1A${form.view.path}`
      )
    ),
    React.createElement("div", { className: "dhs-note" }, banksScopeText()),
    form.availability === void 0 ? null : React.createElement("div", { className: "dhs-note dhs-warn" }, form.availability),
    React.createElement(FieldRows, { fields, form, scopeKind: "bank", disabled }),
    React.createElement(ActionBar, { form, saveLabel: `\u4FDD\u5B58\u5230 banks.${bankId}` })
  );
}
function FieldRows(props) {
  const { fields, form, scopeKind, disabled } = props;
  return React.createElement(
    React.Fragment,
    null,
    ...fields.map(
      (field) => React.createElement(FieldRow, {
        key: field.key,
        field,
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
  const { form, saveLabel } = props;
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
      busy === "save" ? "\u4FDD\u5B58\u4E2D\u2026" : form.dirty ? `${saveLabel}\uFF08${diff.changed.length} \u9879\uFF09` : saveLabel
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== void 0, onClick: form.discard },
      "\u64A4\u9500\u4FEE\u6539"
    ),
    React.createElement(
      "button",
      { type: "button", className: "dhs-btn", disabled: busy !== void 0, onClick: form.reload },
      busy === "reload" ? "\u91CD\u65B0\u8BFB\u53D6\u4E2D\u2026" : "\u91CD\u65B0\u8BFB\u53D6"
    ),
    form.invalid ? React.createElement(
      "span",
      { className: "dhs-hint dhs-err", "data-validation": "errors" },
      `\u6709 ${diff.errors.length} \u4E2A\u5B57\u6BB5\u4E0D\u5408\u6CD5\uFF0C\u4E0D\u4F1A\u63D0\u4EA4\uFF1A${diff.errors.map((entry) => entry.message).join(" ")}`
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
  const { field, draft, disabled, scopeKind, onDraft, onClear } = props;
  const onChange = (event) => onDraft(event.target.value);
  const input = (() => {
    if (!field.editable) {
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
            onChange: (event) => onDraft(event.target.checked ? "true" : "false"),
            "aria-label": field.key
          }),
          React.createElement(
            "span",
            { className: "dhs-hint" },
            valueSourceNote(field, scopeKind) ?? fallbackText(field)
          )
        );
      case "enum": {
        const options = [
          { value: "", label: `\u672A\u8BBE\u7F6E\uFF08\u9ED8\u8BA4 ${formatDefault(field)}\uFF09` }
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
          ...field.inFile ? { placeholder: "\u5DF2\u8BBE\u7F6E\uFF08\u4E0D\u663E\u793A\u660E\u6587\uFF09\xB7 \u7559\u7A7A\uFF1D\u4E0D\u6539\u52A8" } : {}
        });
      case "stringList":
        return React.createElement("textarea", {
          className: "dhs-textarea",
          value: draft,
          disabled,
          onChange,
          spellCheck: false,
          placeholder: "\u4E00\u884C\u4E00\u4E2A\uFF1B\u4E5F\u63A5\u53D7\u9017\u53F7\u5206\u9694",
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
      field.editable ? "\u53EF\u7F16\u8F91" : "\u53EA\u8BFB"
    ),
    React.createElement("span", { className: "dhs-chip", key: "kind" }, field.kind),
    React.createElement("span", { className: "dhs-chip", key: "scope" }, scopeLabel(field.scope)),
    React.createElement(
      "span",
      {
        className: field.inFile ? "dhs-chip dhs-chip-set" : "dhs-chip",
        key: "state"
      },
      field.inFile ? "\u6587\u4EF6\u5DF2\u8BBE\u7F6E" : "\u6587\u4EF6\u672A\u8BBE\u7F6E"
    )
  ];
  const sourceNote = field.editable ? valueSourceNote(field, scopeKind) : void 0;
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
    sourceNote === void 0 ? null : React.createElement("div", { className: "dhs-meta" }, sourceNote),
    field.inFile ? null : React.createElement("div", { className: "dhs-meta" }, fallbackText(field)),
    field.shadowedByHarness ? React.createElement("div", { className: "dhs-meta" }, shadowText()) : null,
    !field.editable ? React.createElement("div", { className: "dhs-meta" }, readOnlyText()) : null,
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
          `${UNSET_TEXT}\uFF08\u4FDD\u5B58\u540E\u5220\u9664\u8BE5\u952E\uFF09`
        ) : (
          // A secret is ALWAYS an empty box while set, so its button always reads 清空.
          "\u6E05\u7A7A\uFF08\u4FDD\u5B58\u540E\u5220\u9664\u8BE5\u952E\uFF09"
        ) : "\u6E05\u7A7A\uFF08\u6587\u4EF6\u4E2D\u6CA1\u6709\u8FD9\u4E00\u9879\uFF09"
      ),
      field.kind === "secret" ? React.createElement(
        "span",
        { className: "dhs-hint" },
        "\u5BC6\u94A5\u4E0D\u968F\u63A5\u53E3\u4E0B\u53D1\uFF1A\u7559\u7A7A\uFF1D\u4E0D\u6539\u52A8\uFF0C\u8F93\u5165\u65B0\u503C\uFF1D\u8986\u76D6\uFF0C\u70B9\u300C\u6E05\u7A7A\u300D\u4FDD\u5B58\u540E\u5220\u9664\u8BE5\u952E\u3002"
      ) : null
    ) : null
  );
}
return module.exports; } });
