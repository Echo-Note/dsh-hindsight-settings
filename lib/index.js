// src/namespace.ts
var PACKAGE_NAME = "@local/dsh-hindsight-settings";
var ENTRY_ID = "hindsight-settings";

// src/config-store.ts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";

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
function fieldByKey(key) {
  return CONFIG_FIELDS.find((field) => field.key === key);
}
function fieldsOfGroup(group) {
  return CONFIG_FIELDS.filter((field) => field.group === group);
}

// src/config-store.ts
var HARNESS_ID = "dsh";
function configPath(env = process.env) {
  return env.HINDSIGHT_CONFIG || join(homedir(), ".hindsight", "coding-agent.json");
}
function readConfigFile(path = configPath()) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    const code = error.code;
    if (code === "ENOENT") return { path, values: {}, harness: {} };
    return { path, values: {}, harness: {}, error: `cannot read ${path}: ${String(error)}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { path, values: {}, harness: {}, error: `${path} is not valid JSON: ${String(error)}` };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { path, values: {}, harness: {}, error: `${path} must hold a JSON object` };
  }
  const values = parsed;
  const harnesses = values.harnesses;
  const harness = typeof harnesses === "object" && harnesses !== null && !Array.isArray(harnesses) ? harnesses[HARNESS_ID] ?? {} : {};
  return {
    path,
    values,
    harness: typeof harness === "object" && harness !== null ? harness : {}
  };
}
function describeSources(snapshot, env = process.env) {
  return CONFIG_FIELDS.map((field) => {
    const fromEnv = field.env === void 0 ? void 0 : env[field.env];
    const sources = { key: field.key };
    if (field.key in snapshot.harness) sources.harness = snapshot.harness[field.key];
    if (field.key in snapshot.values) sources.file = snapshot.values[field.key];
    if (fromEnv !== void 0 && fromEnv !== "") sources.env = fromEnv;
    return sources;
  });
}
function validatePatch(patch) {
  const errors = [];
  for (const [key, value] of Object.entries(patch)) {
    const field = CONFIG_FIELDS.find((candidate) => candidate.key === key);
    if (field === void 0) {
      errors.push({ key, message: `unknown setting` });
      continue;
    }
    if (!field.editable) {
      errors.push({ key, message: `${key} is file-only and cannot be written from the page` });
      continue;
    }
    if (value === null) continue;
    const problem = checkValue(field, value);
    if (problem !== void 0) errors.push({ key, message: problem });
  }
  return errors;
}
function checkValue(field, value) {
  switch (field.kind) {
    case "boolean":
      return typeof value === "boolean" ? void 0 : `${field.key} must be true or false`;
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? void 0 : `${field.key} must be a number`;
    case "enum":
      return typeof value === "string" && field.values?.includes(value) ? void 0 : `${field.key} must be one of ${(field.values ?? []).join(", ")}`;
    case "stringList":
      return Array.isArray(value) && value.every((item) => typeof item === "string") ? void 0 : `${field.key} must be a list of strings`;
    case "secret":
    case "string":
      return typeof value === "string" ? void 0 : `${field.key} must be a string`;
    case "json":
      return `${field.key} is file-only`;
  }
}
function sameValue(left, right) {
  if (left === right) return true;
  if (typeof left !== typeof right) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  if (typeof left === "object" && typeof right === "object" && left !== null && right !== null) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (leftKeys.length !== rightKeys.length) return false;
    if (leftKeys.some((key, index) => key !== rightKeys[index])) return false;
    return leftKeys.every(
      (key) => sameValue(left[key], right[key])
    );
  }
  return false;
}
function writeConfigValues(patch, path = configPath()) {
  const errors = validatePatch(patch);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `${error.key}: ${error.message}`).join("; "));
  }
  const snapshot = readConfigFile(path);
  if (snapshot.error !== void 0) throw new Error(snapshot.error);
  const next = { ...snapshot.values };
  const removed = [];
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      if (key in next) {
        delete next[key];
        removed.push(key);
        changed = true;
      }
      continue;
    }
    if (!(key in next) || !sameValue(next[key], value)) {
      next[key] = value;
      changed = true;
    }
  }
  if (changed) writeJsonAtomically(path, next);
  return { path, changed, removed };
}
function reconcileConfigValues(values, path = configPath()) {
  const patch = {};
  for (const field of CONFIG_FIELDS) {
    if (!field.editable) continue;
    if (field.key in values) {
      patch[field.key] = values[field.key];
      continue;
    }
    if (field.kind === "secret") continue;
    patch[field.key] = null;
  }
  return writeConfigValues(patch, path);
}
function writeJsonAtomically(path, values) {
  const directory = dirname(path);
  mkdirSync(directory, { recursive: true, mode: 448 });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporary, `${JSON.stringify(values, null, 2)}
`, {
    encoding: "utf8",
    mode: 384
  });
  renameSync(temporary, path);
}
function scopeSection(scope) {
  if (scope.kind === "bank") return { map: "banks", key: scope.id };
  if (scope.kind === "path") return { map: "paths", key: scope.dir };
  return void 0;
}
function readScopedValues(values, scope) {
  const section = scopeSection(scope);
  if (section === void 0) return values;
  const map = values[section.map];
  if (typeof map !== "object" || map === null || Array.isArray(map)) return {};
  const entry = map[section.key];
  return typeof entry === "object" && entry !== null && !Array.isArray(entry) ? entry : {};
}
function readScopeMembers(values, map) {
  const section = values[map];
  if (typeof section !== "object" || section === null || Array.isArray(section)) return [];
  return Object.entries(section).filter(([, entry]) => typeof entry === "object" && entry !== null && !Array.isArray(entry)).map(([id, entry]) => ({ id, keys: Object.keys(entry).sort() }));
}
function writeScopedValues(scope, patch, path = configPath()) {
  const errors = validatePatch(patch);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `${error.key}: ${error.message}`).join("; "));
  }
  const snapshot = readConfigFile(path);
  if (snapshot.error !== void 0) throw new Error(snapshot.error);
  const next = structuredCloneSafe(snapshot.values);
  const section = scopeSection(scope);
  if (section === void 0) {
    const merged2 = mergeInto(next, patch);
    if (merged2.changed) writeJsonAtomically(path, merged2.values);
    return { path, changed: merged2.changed, removed: merged2.removed };
  }
  const mapRaw = next[section.map];
  const map = typeof mapRaw === "object" && mapRaw !== null && !Array.isArray(mapRaw) ? mapRaw : {};
  const entryRaw = map[section.key];
  const entry = typeof entryRaw === "object" && entryRaw !== null && !Array.isArray(entryRaw) ? entryRaw : {};
  const merged = mergeInto(entry, patch);
  const empty = Object.keys(merged.values).length === 0;
  const removedEntry = empty && Object.keys(entry).length > 0;
  if (!merged.changed && !removedEntry) return { path, changed: false, removed: [] };
  if (empty) delete map[section.key];
  else map[section.key] = merged.values;
  if (Object.keys(map).length === 0) delete next[section.map];
  else next[section.map] = map;
  writeJsonAtomically(path, next);
  return { path, changed: true, removed: merged.removed };
}
function mergeInto(target, patch) {
  const values = { ...target };
  const removed = [];
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      if (key in values) {
        delete values[key];
        removed.push(key);
        changed = true;
      }
      continue;
    }
    if (!(key in values) || !sameValue(values[key], value)) {
      values[key] = value;
      changed = true;
    }
  }
  return { values, changed, removed };
}
function structuredCloneSafe(values) {
  return JSON.parse(JSON.stringify(values));
}

// src/status.ts
import { mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "fs";
import { dirname as dirname2, join as join2 } from "path";
var MAX_EVENTS = 30;
function statusPath(configFile = configPath()) {
  return join2(dirname2(configFile), "dsh-settings-status.json");
}
function readStatus(path, entryId, configFile) {
  try {
    const parsed = JSON.parse(readFileSync2(path, "utf8"));
    if (Array.isArray(parsed.events)) {
      return {
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
        package: typeof parsed.package === "string" ? parsed.package : "@local/dsh-hindsight-settings",
        entryId: typeof parsed.entryId === "string" ? parsed.entryId : entryId,
        configPath: typeof parsed.configPath === "string" ? parsed.configPath : configFile,
        events: parsed.events
      };
    }
  } catch {
  }
  return {
    updatedAt: "",
    package: "@local/dsh-hindsight-settings",
    entryId,
    configPath: configFile,
    events: []
  };
}
function recordStatus(step, details = {}, configFile = configPath()) {
  const event = { at: (/* @__PURE__ */ new Date()).toISOString(), step, ...details };
  const path = statusPath(configFile);
  try {
    const previous = readStatus(
      path,
      details.entryId === void 0 ? "" : String(details.entryId),
      configFile
    );
    const events = [...previous.events, event].slice(-MAX_EVENTS);
    const next = {
      ...previous,
      updatedAt: event.at,
      configPath: configFile,
      events
    };
    mkdirSync2(dirname2(path), { recursive: true });
    writeFileSync2(path, `${JSON.stringify(next, null, 2)}
`, { encoding: "utf8", mode: 384 });
  } catch {
  }
  return event;
}
function readStatusFile(configFile = configPath()) {
  return readStatus(statusPath(configFile), "", configFile);
}

// src/service.ts
function createSettingsService(serviceKey = "hindsightSettings") {
  const service = {
    describe(scope = { kind: "top" }, configPathOverride) {
      const path = configPathOverride ?? configPath();
      const snapshot = readConfigFile(path);
      const values = readScopedValues(snapshot.values, scope);
      const sources = new Map(describeSources(snapshot).map((source) => [source.key, source]));
      const fields = CONFIG_FIELDS.map((field) => {
        const source = sources.get(field.key);
        const inFile = field.key in values;
        return {
          key: field.key,
          group: field.group,
          kind: field.kind,
          ...field.values === void 0 ? {} : { values: field.values },
          default: field.default,
          ...field.env === void 0 ? {} : { env: field.env },
          editable: field.editable,
          scope: field.scope,
          summary: field.summary,
          // Secrets are redacted from every response, the way dsh's own settings service redacts a
          // `role('secret')` field ("kept out of form responses"). The page still knows whether the
          // file sets one (`inFile`), and `apply` accepts a replacement or an explicit clear.
          value: field.kind === "secret" ? null : inFile ? values[field.key] : null,
          inFile,
          shadowedByHarness: scope.kind === "top" ? source?.harness !== void 0 : false
        };
      });
      recordStatus("describe", {
        path,
        scope: scope.kind,
        error: snapshot.error ?? null,
        fields: fields.length,
        withValues: fields.filter((field) => field.inFile).length
      });
      const base = {
        path,
        scope,
        ...scope.kind === "top" ? {
          banks: readScopeMembers(snapshot.values, "banks"),
          paths: readScopeMembers(snapshot.values, "paths")
        } : {},
        fields
      };
      return snapshot.error === void 0 ? base : { ...base, error: snapshot.error };
    },
    /**
     * Record one line from the browser half.
     *
     * The page's failures are otherwise unreachable: a client plugin's `apply` catches to
     * `console.error`, which nobody can read inside a packaged desktop app, and the live slot ledger
     * only shows the contributions that SUCCEEDED. This method is the page's only way to say "I ran,
     * I got this far, this threw", and it lands in the same status trail as the host's own steps.
     */
    note(message) {
      const at = (/* @__PURE__ */ new Date()).toISOString();
      recordStatus("client", { message: String(message).slice(0, 500) });
      return { ok: true, at };
    },
    apply(patch, configPathOverride) {
      const path = configPathOverride ?? configPath();
      const result = writeConfigValues(patch, path);
      recordStatus("apply", {
        path,
        scope: "top",
        changed: result.changed,
        removed: result.removed
      });
      return {
        path: result.path,
        scope: { kind: "top" },
        changed: result.changed,
        removed: result.removed
      };
    },
    applyScoped(scope, patch, configPathOverride) {
      const path = configPathOverride ?? configPath();
      const result = writeScopedValues(scope, patch, path);
      recordStatus("apply", {
        path,
        scope: scope.kind === "top" ? "top" : `${scope.kind}:${scope.kind === "bank" ? scope.id : scope.dir}`,
        changed: result.changed,
        removed: result.removed
      });
      return { path: result.path, scope, changed: result.changed, removed: result.removed };
    }
  };
  return Object.assign(service, {
    typertRemote: Object.freeze({ service, serviceKey, namespace: serviceKey })
  });
}

// src/index.ts
var name = PACKAGE_NAME;
var SERVICE_KEY = "hindsightSettings";
function apply(ctx) {
  if (typeof ctx.provide !== "function") {
    recordStatus("apply", { error: "ctx.provide is unavailable in this composition" });
    ctx.logger?.warn?.(
      "hindsight-settings: this composition exposes no ctx.provide \u2014 the settings page cannot reach the config file"
    );
    return;
  }
  ctx.provide(SERVICE_KEY, createSettingsService());
  recordStatus("apply", { provided: SERVICE_KEY, configPath: configPath(), entryId: ENTRY_ID });
}
var src_default = { name, apply };
export {
  CONFIG_FIELDS,
  EDITABLE_FIELDS,
  FIELD_GROUPS,
  SERVICE_KEY,
  apply,
  configPath,
  createSettingsService,
  src_default as default,
  describeSources,
  fieldByKey,
  fieldsOfGroup,
  name,
  readConfigFile,
  readStatusFile,
  reconcileConfigValues,
  recordStatus,
  statusPath,
  writeConfigValues
};
//# sourceMappingURL=index.js.map