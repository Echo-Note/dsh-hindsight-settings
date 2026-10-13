/**
 * The Hindsight coding-agent config surface, as data.
 *
 * This table is the ONE declaration of "what a user may configure" that both halves read: the host
 * builds its Cordis `Config` schema from it, and the browser half renders the page from it. It
 * therefore imports nothing at all — no `node:*`, no schemastery — because the browser bundle
 * inlines it while the host bundle must stay loadable in any profile.
 *
 * It describes the SAME settings `@vectorize-io/hindsight-coding-agents` resolves in its
 * `core/config.ts` (layering: defaults → env → the file's top level → `harnesses.<name>` →
 * `banks.<id>` / `paths.<dir>`). The plugin owns that resolution; this package owns only the page
 * and the file write-back, so every field here must match that table, and `upstream.test.ts`
 * checks this list against the INSTALLED plugin instead of trusting the copy.
 *
 * `editable: false` marks a field the page shows but must not write:
 *   - nested maps (`pages`, `banks`, `recallOptions`, …) — they are file-only by upstream design
 *     because a per-key branch cannot survive a form field, and a half-edited map is worse than
 *     none;
 *   - `harness`, which the host stamps for the adapter it is running as;
 *   - `autoReflect`, which upstream deprecated in favour of `autoInject`.
 */

/** The page's sections, in render order. */
export type FieldGroup =
  "connection" | "routing" | "recall" | "pages" | "retention" | "ingest" | "scope";

/** How a field is rendered and validated. */
export type FieldKind = "string" | "secret" | "number" | "boolean" | "enum" | "stringList" | "json";

/**
 * The languages the page can render. Both halves live in this table because the page bundles it and
 * picks one by `ctx.locale`; the Remote response carries a single string only as a fallback for a
 * field key the running page does not know.
 */
export interface LocalizedText {
  readonly en: string;
  readonly zh: string;
}

/** Where a value may be overridden from. Mirrors upstream's layers. */
export type FieldScope = "global" | "harness" | "bank" | "path";

export interface ConfigField {
  /** The `RawConfig` key, spelled exactly as upstream spells it. */
  readonly key: string;
  readonly group: FieldGroup;
  readonly kind: FieldKind;
  /** Allowed values for `kind: "enum"`. */
  readonly values?: readonly string[];
  /**
   * The documented default, or `null` when the upstream default is "unset" (a value the plugin
   * leaves undefined and each call site interprets). Kept as DATA rather than read from upstream so
   * the browser half can render it; `upstream.test.ts` asserts the ones upstream resolves.
   */
  readonly default: string | number | boolean | null;
  /** The `HINDSIGHT_*` variable upstream's env layer reads for this key, when it has one. */
  readonly env?: string;
  /** False = the page renders it read-only (see the module doc for why). */
  readonly editable: boolean;
  readonly scope: FieldScope;
  /**
   * True when upstream DISCARDS this key inside a `banks.<id>` or `paths.<prefix>` section.
   *
   * Upstream ships the list as `BANK_OVERRIDE_EXCLUDED` (bankId, bankIdTemplate, mapPathToBank,
   * dynamicBankId, resolveWorktrees, optInOnly, optInPaths, harness) with the comment "strip them
   * rather than let them read as effective" — a section naming them would only ever arrive too late,
   * because bank resolution and the opt-in decision both happen BEFORE a section applies. A
   * `harnesses.<name>` section is a plain flat merge and DOES honor them.
   *
   * The page must not offer these for editing inside a bank section: the write would land in the
   * file and be ignored, which is worse than not offering it. `upstream.test.ts` compares this flag
   * against the installed bundle's own list.
   */
  readonly bankScopeIgnored?: boolean;
  /** One line for the page, in every language the page can render. */
  readonly summary: LocalizedText;
}

export interface FieldGroupDescriptor {
  readonly id: FieldGroup;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
}

export const FIELD_GROUPS: readonly FieldGroupDescriptor[] = [
  {
    id: "connection",
    title: {
      en: "Connection",
      zh: "连接",
    },
    summary: {
      en: "Where memories are stored, and which credential reaches them.",
      zh: "记忆存放在哪里，用什么凭据访问。",
    },
  },
  {
    id: "routing",
    title: {
      en: "Bank routing",
      zh: "记忆库路由",
    },
    summary: {
      en: "Which bank this work is written into; one per repository by default.",
      zh: "这次工作写进哪个 bank；默认每个仓库一个。",
    },
  },
  {
    id: "recall",
    title: {
      en: "Recall and injection",
      zh: "召回与注入",
    },
    summary: {
      en: "What gets injected into the model's context each turn, and how long it waits.",
      zh: "每一轮往模型上下文里注入什么、等多久。",
    },
  },
  {
    id: "pages",
    title: {
      en: "Knowledge pages",
      zh: "知识页",
    },
    summary: {
      en: "How knowledge pages are generated, and when they refresh.",
      zh: "知识页怎么生成、什么时候刷新。",
    },
  },
  {
    id: "retention",
    title: {
      en: "Writing and retention",
      zh: "写入与保留",
    },
    summary: {
      en: "How sessions land in the store, how finely they are extracted, and how they are grouped.",
      zh: "会话怎么落库、抽取多细、按什么粒度归并。",
    },
  },
  {
    id: "ingest",
    title: {
      en: "Seeding and follow-up",
      zh: "种子与跟进",
    },
    summary: {
      en: "Where a cold start draws its material from, and how it stays current afterwards.",
      zh: "冷启动时从哪里取料，之后怎么保持当前。",
    },
  },
  {
    id: "scope",
    title: {
      en: "Scope and switches",
      zh: "范围与开关",
    },
    summary: {
      en: "Which projects have memory, plus the switches used for troubleshooting.",
      zh: "哪些项目有记忆，以及排查用的开关。",
    },
  },
];

export const CONFIG_FIELDS: readonly ConfigField[] = [
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
      zh: "cloud = 官方托管；self-hosted = 你自己的服务器（配合 apiUrl）；daemon = 本机 hindsight-embed 守护进程（apiUrl 被忽略）。",
    },
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
      zh: "Hindsight API 地址。自建常见 http://localhost:8888。",
    },
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
      zh: "Hindsight 的承载令牌（自托管＝你服务器要求的 key；Cloud＝账号 key）。它是【服务器/账号级】凭据，不携带用户身份：多人共用一个 key 时，隔离只取决于服务器端是否装了 tenant 扩展（一人一键一 schema），bank 名本身不是安全边界。Cloud 的 key 可按 bank 限定并可程序化创建/撤销。",
    },
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
      zh: "daemon 模式监听的端口（不是自建服务器的 8888）。",
    },
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
      zh: "daemon 空闲多少秒后退出；不设则永不自动退出。",
    },
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
      zh: "daemon 使用哪个 hindsight-embed profile（即哪个本地库）。",
    },
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
      zh: "daemon 通过 uvx 运行哪个 hindsight-embed 版本，默认 latest。",
    },
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
      zh: "改用本地 hindsight-embed checkout 而不是发布版（开发用）。",
    },
  },

  // ── routing ───────────────────────────────────────────────────────────────────
  {
    key: "bankId",
    group: "routing",
    kind: "string",
    default: null,
    env: "HINDSIGHT_BANK_ID",
    editable: true,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "Pin this bank. Resolution order: mapPathToBank → this setting → bankIdTemplate; once it is set, banks are no longer resolved dynamically per repository, unless dynamicBankId is true.",
      zh: "固定使用这个 bank。解析顺序：mapPathToBank → 本项 → bankIdTemplate；设了它就不再按仓库动态分库，除非 dynamicBankId 为 true。",
    },
  },
  {
    key: "dynamicBankId",
    group: "routing",
    kind: "boolean",
    default: null,
    env: "HINDSIGHT_DYNAMIC_BANK_ID",
    editable: true,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "By default it resolves dynamically when bankId is unset. true = resolve dynamically per repository even when bankId is set; false = force static, always using bankId.",
      zh: "默认在未设 bankId 时动态解析。设 true＝即使设了 bankId 也按仓库动态分库；设 false＝强制静态，始终用 bankId。",
    },
  },
  {
    key: "bankIdTemplate",
    group: "routing",
    kind: "string",
    default: "coding-agent::{gitProject}",
    env: "HINDSIGHT_BANK_ID_TEMPLATE",
    editable: true,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "Template for the dynamic bank id; the default is coding-agent::{gitProject} (every agent shares one bank per repository). Placeholders: {gitProject} = the worktree-aware repository name (shared by every worktree of one repository; outside a repository, the name of the directory the session started in), {project} = the current directory name, {harness}, {channel}, {user}. To split per agent, write {harness}-{gitProject}.",
      zh: "动态 bank id 的模板，默认 coding-agent::{gitProject}（各 agent 共享同一个仓库 bank）。占位符：{gitProject}＝worktree 感知的仓库名（同一仓库的所有 worktree 共享；不在仓库中时取会话启动目录名）、{project}＝当前目录名、{harness}、{channel}、{user}。想按 agent 分开就写 {harness}-{gitProject}。",
    },
  },
  {
    key: "mapPathToBank",
    group: "routing",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "Absolute path → bank name; the longest prefix wins and it takes highest priority (it can override bankId); linked worktrees inherit the main checkout's mapping. A key→value map, editable only in the config file.",
      zh: "绝对路径 → bank 名；最长前缀生效，优先级最高（可盖过 bankId），linked worktree 继承主检出的映射。键值映射，仅文件可编辑。",
    },
  },
  {
    key: "resolveWorktrees",
    group: "routing",
    kind: "boolean",
    default: true,
    env: "HINDSIGHT_RESOLVE_WORKTREES",
    editable: true,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "git worktrees share the main repository's bank (on by default).",
      zh: "git worktree 共用主仓库的 bank（默认开）。",
    },
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
      zh: "首轮注入什么：reflect 合成 / 知识页检索 / 记忆召回 / 不注入。",
    },
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
      zh: "已废弃，改用 autoInject；仅在未设 autoInject 时兼容生效。",
    },
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
      zh: "hindsight_reflect 工具的合成预算；大库上高预算可能撞服务端墙钟超时。",
    },
  },
  {
    key: "reflectTimeoutMs",
    group: "recall",
    kind: "number",
    default: 20000,
    env: "HINDSIGHT_REFLECT_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Timeout for the automatic session reflect (milliseconds); it has to fit inside the host's hook window.",
      zh: "自动会话 reflect 的超时（毫秒），要放进宿主的钩子窗口。",
    },
  },
  {
    key: "reflectToolTimeoutMs",
    group: "recall",
    kind: "number",
    default: 330000,
    env: "HINDSIGHT_REFLECT_TOOL_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Timeout of the hindsight_reflect tool itself, deliberately far larger than the automatic reflect.",
      zh: "hindsight_reflect 工具本身的超时，刻意远大于自动 reflect。",
    },
  },
  {
    key: "injectTimeoutMs",
    group: "recall",
    kind: "number",
    default: 7000,
    env: "HINDSIGHT_INJECT_TIMEOUT_MS",
    editable: true,
    scope: "harness",
    summary: {
      en: "Retrieval timeout for knowledge pages / recall injection; it is also the fallback budget after a reflect failure.",
      zh: "knowledge pages / recall 注入的检索超时，也是 reflect 失败后的回退预算。",
    },
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
      zh: "一次知识页检索返回几页；注入、回退与工具共用同一个限制。",
    },
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
      zh: "逐键合并进每次 recall 请求体的覆盖项。只能在配置文件里编辑。",
    },
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
      zh: "追加在内置工具指南之后的自定义指引（只增不替）。",
    },
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
      zh: "每多少个用户轮次刷新一次知识页清单（0 等同 1）。",
    },
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
      zh: "新建知识页用什么触发刷新；auto-refresh 最及时也最贵。",
    },
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
      zh: "cron 触发的时间表（UTC，5 段）；H 表示按页名散列到各自分钟。",
    },
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
      zh: "逐页改写或停用内置知识页（false 停用，{source_query} 换问题）。只能在配置文件里编辑。",
    },
  },
  {
    key: "customPages",
    group: "pages",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Knowledge pages of your own (name → {source_query, tags}). Editable only in the config file.",
      zh: "你自己的知识页（名称 → {source_query, tags}）。只能在配置文件里编辑。",
    },
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
      zh: "会话结束后是否写回 transcript；关掉后召回与种子照常。",
    },
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
      zh: "每次写回附加的标签，例：project:{gitProject}、env:work。",
    },
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
      zh: "每次写回附加的元数据（同 retainTags 的占位符）。只能在配置文件里编辑。",
    },
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
      zh: "随每次写回发送的 context，抽取据此判断一句话是谁说的。",
    },
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
      zh: "允许插件增量塑造 bank 自身配置（只补不改）。",
    },
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
      zh: "服务端从写回内容里抽取记忆的力度；verbose 更细也更贵。",
    },
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
      zh: "新建 bank 时写入的 bank-config 字段（插件自管的字段除外）。只能在配置文件里编辑。",
    },
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
      zh: "归并观察的粒度；显式二维数组（字面 scope 列表）只能在配置文件里写。",
    },
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
      zh: "并发写回请求上限；服务器返回 429 时应调低而不是调高。",
    },
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
      zh: "冷仓库首次会话时用 git 历史自动播种。",
    },
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
      zh: "自动播种最多取最近多少条提交。",
    },
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
      zh: "冷仓库时起一个无头 claude 巡览代码结构。",
    },
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
      zh: "巡览用的模型（claude -p --model）。",
    },
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
      zh: "单次巡览的花费上限（美元）。",
    },
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
      zh: "累计多少条新提交后重跑巡览；0 表示只在冷启动播一次。",
    },
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
      zh: "git 历史怎么进记忆：只提交信息 / 含完整 diff / 不摄取。",
    },
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
      zh: "每天自检并后台更新 ~/.hindsight/coding-agents；关掉即锁定版本。",
    },
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
      zh: "硬开关：整个插件在记忆上变为惰性（无 bank、无写回）。",
    },
  },
  {
    key: "optInOnly",
    group: "scope",
    kind: "boolean",
    default: false,
    env: "HINDSIGHT_OPT_IN_ONLY",
    editable: true,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "Work only in the named directories; projects that are not listed leave no trace at all.",
      zh: "只在被点名的目录里工作；未列出的项目完全不留痕。",
    },
  },
  {
    key: "optInPaths",
    group: "scope",
    kind: "stringList",
    default: null,
    env: "HINDSIGHT_OPT_IN_PATHS",
    editable: true,
    scope: "harness",
    bankScopeIgnored: true,
    summary: {
      en: "The named directories (matched by prefix, ~ supported); each repository beneath them still gets its own bank.",
      zh: "点名的目录（按前缀匹配，支持 ~），其下每个仓库仍各自成库。",
    },
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
      zh: "插件日志级别；HINDSIGHT_LOG_LEVEL 仍可用于临时排查。",
    },
  },
  {
    key: "harness",
    group: "scope",
    kind: "string",
    default: "dsh",
    env: "HINDSIGHT_HARNESS",
    editable: false,
    scope: "global",
    bankScopeIgnored: true,
    summary: {
      en: "Read by the deepen engine only: which session format --conversations is parsed as (upstream default opencode). Every DSH entry point passes its own harness (dsh) explicitly, so this setting has no effect in normal use.",
      zh: "仅 deepen 引擎读取：--conversations 按哪种会话格式解析（上游默认 opencode）。DSH 的每个入口都会显式传入自己的 harness（dsh），所以日常使用中本项不起作用。",
    },
  },
  {
    key: "harnesses",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "harness",
    summary: {
      en: "Override any field per harness (harnesses.dsh / harnesses.claude-code …); it applies after the file's top level and before paths/banks. Editable only in the file.",
      zh: "按 harness 覆盖任意字段（harnesses.dsh / harnesses.claude-code …），在文件顶层之后、paths/banks 之前生效。仅文件可编辑。",
    },
  },
  {
    key: "banks",
    group: "scope",
    kind: "json",
    default: null,
    editable: false,
    scope: "bank",
    summary: {
      en: 'Override by resolved bank id: it applies after bank resolution, so moving a repository elsewhere does not affect it. Any behavioural field can be overridden; a bank may merge several ids into one bank (single hop, literal, and the target\'s own section no longer takes part). Bank-resolution fields (bankId / mapPathToBank / bank / optInOnly / optInPaths) are ignored inside this section. This page edits it through the "By project (banks)" tab.',
      zh: "按【已解析的 bank id】覆盖：该项在 bank 解析之后生效，所以仓库换目录也不受影响。任何行为字段都能覆盖；bank 可把多个 id 合并到一个 bank（单跳、字面量，目标自身的段不再参与）。bank 解析类字段（bankId / mapPathToBank / bank / optInOnly / optInPaths）在此段内被忽略。本页用「按项目（banks）」标签页编辑。",
    },
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
      zh: "按【绝对路径前缀】覆盖连接类设置（serverMode / apiUrl / apiPort / apiToken 等），最长前缀生效；在 bank 解析之后、banks.<id> 之前生效，所以同一仓库的 bank 段仍会盖过它。仅文件可编辑。",
    },
  },
];

/** The fields the page may write. Everything else is display-only. */
export const EDITABLE_FIELDS: readonly ConfigField[] = CONFIG_FIELDS.filter(
  (field) => field.editable
);

/** One field by key, for lookups from the page or the host. */
export function fieldByKey(key: string): ConfigField | undefined {
  return CONFIG_FIELDS.find((field) => field.key === key);
}

/** Fields of one group, in declaration order. */
export function fieldsOfGroup(group: FieldGroup): readonly ConfigField[] {
  return CONFIG_FIELDS.filter((field) => field.group === group);
}
