/**
 * Pure page model for the Hindsight settings page.
 *
 * Everything here is a plain function, plain type, or frozen data: no React, no cordis, no DOM, no
 * `node:*`. That is what makes the write contract — the part of this page that can damage a user's
 * config — testable in Node, and it is why the browser half inlines this module rather than
 * re-deriving any of it.
 *
 * ## Two sources of truth, and which one wins
 *
 *  - `../fields` owns **presentation metadata** the page must not invent: group order, group titles,
 *    group summaries, and field order within a group.
 *  - The host's `describe()` owns **every live value and every fact about the file**: the path, each
 *    field's value, `inFile`, `shadowedByHarness`, and the field-level `summary`/`kind`/`default`/…
 *    It is the only thing that knows where the config file actually is.
 *
 * The path is the important one. The config file does NOT live at a fixed location: it is
 * `~/.hindsight/coding-agent.json` on macOS and Linux but something else entirely on Windows. This
 * module therefore never spells a config path; it renders `view.path`, which the host resolves.
 *
 * ## Copy is dictionary data, never a literal
 *
 * DSH's client UI may only show text that enters through a typed locale dictionary
 * (`verify-client-ui-i18n`), so every user-visible sentence this page can produce lives in
 * {@link DICTIONARIES} as one flat `key → template` map per shipped locale. Nothing else in this
 * file — or in `index.tsx` — may hold user-visible words; `model.test.ts` scans both sources and
 * fails on a stray CJK literal outside the dictionary block.
 *
 * Two different consumers read that one table:
 *
 *  - the framework's `t` seat (or `ctx.locale.bind(NS)` on a composition without a renderer) does the
 *    translating at render time, so a live language switch is followed by a plain re-render;
 *  - {@link interpolate} is the same `{name}` substitution for the copy this module composes itself
 *    (`valueSourceNote`, `fallbackText`, …), which is why those helpers take the active language
 *    instead of returning a finished sentence.
 *
 * ## The write contract
 *
 * `describe()` and `apply()` are reached through the API Gateway and every unary call resolves to a
 * `RemoteResult` — `{ ok: true, value }` or `{ ok: false, error }`. A call does not reject because the
 * carrier dropped; it can still reject on an assembly fault (wrong arity, method unmounted, the
 * contribution withdrawn), so callers guard both.
 *
 * `apply(patch)` takes `Record<string, unknown>`: a key set to a value writes it, and a key set to
 * `null` REMOVES it, so the setting falls back to the environment variable and then to the plugin
 * default. `null` is therefore a real instruction, not "no value" — {@link parseDraft} returns it for
 * a cleared cell and {@link diffDraft} only emits it when the file actually held something.
 */

import { CONFIG_FIELDS, FIELD_GROUPS, type FieldKind } from "../fields";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// THE DICTIONARIES ─────────────────────────────────────────────────────────────────────────────────
//
// The ONLY user-visible text in this bundle. `en` is the canonical key set (the `CopyKey` union is
// derived from it) and `zh` is checked against it at compile time, so a key added on one side and
// forgotten on the other fails `tsc` as well as `model.test.ts`.
//
// Placeholders use the single-brace `{name}` form the locale service substitutes, and a placeholder
// with no matching param is left verbatim — which is why the help text can quote upstream's literal
// `{gitProject}` / `{harness}` templates unchanged.
//
// >>> dictionaries
const EN = {
  title: "Hindsight memory settings",

  "loading.text": "Reading the host configuration…",
  "unset.text": "Not set",
  "unset.optionPrefix": "Not set (default {value})",

  "tabs.banks.title": "Per project (banks)",
  "tabs.banks.summary":
    "Override settings for an individual bank / repository; every other bank keeps the top-level value.",

  "group.empty": "No settings in this group.",

  "field.chip.editable": "Editable",
  "field.chip.readOnly": "Read-only",
  "field.chip.inFile": "Set in the file",
  "field.chip.notInFile": "Not set in the file",
  "field.placeholder.secretSet": "Set (value never shown) · leave empty = keep it",
  "field.placeholder.list": "One per line; comma-separated also accepted",
  "field.secretHint":
    "A secret never travels back over the API: leave the box empty to keep it, type a new value to replace it, or press “Clear” and save to remove the key.",
  "field.clearInFile": "Clear (removes the key on save)",
  "field.clearUnsetStored": "{value} (removes the key on save)",
  "field.clearNotInFile": "Clear (the file does not set it)",

  "errors.readFailed": "Could not read the configuration: {message}",
  "errors.saveFailed": "Could not save: {message}",
  "errors.badFormat":
    "The settings payload from the host is not recognizable (path / fields missing).",
  "errors.invalidFields": "{count} field(s) are invalid and were not submitted: {messages}",
  "errors.invalidFieldsShort": "{count} field(s) are invalid and will not be submitted: {messages}",
  "errors.parseNumber": "{key} expects a number but received “{value}”.",
  "errors.parseBoolean": "{key} accepts only true or false.",
  "errors.parseEnum": "{key} accepts only {values}.",
  "errors.enumSeparator": " / ",
  "errors.parseJson": "{key} is not valid JSON.",
  "errors.unparsableFile":
    "The configuration file exists but cannot be parsed, so this page will not write to it and overwrite it: {message}",

  "notices.discarded": "Unsaved changes discarded.",
  "notices.nothingToSave": "There is nothing to save.",
  "notice.saved": "Saved to {path}: {parts}.",
  "notice.unchanged": "The file did not change, so nothing was written.",
  "notice.writes": "wrote or updated {count} setting(s)",
  "notice.removals":
    "removed {count} setting(s) (falling back to the environment variable, then the plugin default)",
  "notice.touched": "updated {path}",

  "page.fileIntro":
    "This page reads and writes the configuration file the host is currently using:",
  "page.blankHint":
    "Leaving a cell empty and saving = removing that key, after which the setting falls back to the environment variable and then to the plugin default.",

  "source.inFile": "From the configuration file",
  "source.defaultTop": "Not written to the file; showing the default {value}",
  "source.defaultBank":
    "This bank does not override the setting; showing the default {value} (removing it falls back to the top level).",
  "fallback.line": "The file does not set this; what actually applies: {parts}.",
  "fallback.none": "no upstream default",
  "fallback.default": "default {value}",
  "fallback.env": "environment variable {env}",
  "shadow.text":
    "harnesses.dsh sets this too, and it wins over the top-level value written here — saving on this page will not change the value actually in effect.",
  "readonly.text":
    "This setting is a file-only nested structure or a host-stamped field that the form cannot express safely, so it can only be edited in the configuration file.",

  "scope.global": "Global",
  "scope.harness": "Per harness",
  "scope.bank": "Per bank",
  "scope.path": "Per path",
  "scope.top": "Top level",

  "banks.scopeText":
    "banks.<id> overrides the settings for that bank (the top level still applies to the other banks); removing a key inside a bank falls back to the top level.",
  "banks.pathsReadOnly":
    "paths overrides by absolute directory prefix (paths.<dir>); it is normally not hand-written, so this page only lists the sections the file already has — edit them in the configuration file.",
  "banks.title": "Existing banks",
  "banks.count": "{count}",
  "banks.empty": "The file has no banks section yet.",
  "banks.keysCount": "{count} key(s)",
  "banks.keysSet": "Set: {keys}",
  "banks.keySeparator": ", ",
  "editor.ignoredHere":
    "Not listed here: {fields}. Upstream discards these keys inside a banks.<id> or paths.<prefix> section — bank resolution and the opt-in decision happen before a section applies — so set them at the top level.",
  "banks.open": "Open",
  "banks.close": "Collapse",
  "banks.newPlaceholder": "New bank id, for example coding-agent::my-repo",
  "banks.newAria": "New bank id",
  "banks.add": "Add",
  "banks.addEmpty": "Enter a bank id (it cannot be empty).",
  "banks.addExists": "banks.{id} already exists — open it from the list above.",
  "banks.editTitle": "Edit banks.{id}",
  "banks.newSection": "New section",
  "banks.newSectionNote": "This section is created in the file only once you save.",
  "banks.closeEditor": "Close",
  "banks.pathsTitle": "By path (paths)",
  "banks.pathsReadOnlyChip": "Read-only",
  "banks.pathKeysSuffix": " · {count} key(s)",
  "banks.pathKeysList": " · {count} key(s): {keys}",

  "editor.countAndPath": "{count} setting(s) · file: {path}",
  "editor.saveTo": "Save to banks.{id}",

  "actions.save": "Save",
  "actions.saveTo": "Save to banks.{id}",
  "actions.saving": "Saving…",
  "actions.saveCount": "{label} ({count})",
  "actions.discard": "Discard changes",
  "actions.reloading": "Reloading…",
  "actions.reload": "Reload",

  "counts.fieldsAndGroups": "{count} setting(s) · {groups} group(s)",

  "unavailable.noRemote":
    "The host offers no Remote service (ctx.remote is absent), so this page cannot read or write the configuration. Check that the client half of dsh-api-gateway is loaded.",
  "unavailable.noNamespace":
    "The Remote contribution was submitted, but the host did not mount {service}. Check that dsh-api-gateway is serving that namespace.",
  "unavailable.mountFailed": "Mounting the Remote contribution failed: {message}",
  "unavailable.initFailed": "Initialization failed: {message}",

  "help.toggleOpen": "Collapse “How is the bank resolved?”",
  "help.toggleClosed": "Not sure how to set this up? How the bank is resolved (expand)",

  "help.a.title": "One bank per repository",
  "help.a.line1":
    "Memory is isolated per repository. The plugin resolves the bank from the [current working directory], in this order (first match wins):",
  "help.a.line2":
    "① mapPathToBank — the longest prefix of the absolute path; it has the highest priority and beats bankId; a linked worktree inherits the main checkout's mapping.",
  "help.a.line3": "② Static — a bankId is set (or dynamicBankId is false).",
  "help.a.line4":
    "③ Dynamic — generated from bankIdTemplate, by default coding-agent::{gitProject}.",

  "help.b.title": "Is a bank something I create by hand? No",
  "help.b.line1":
    "bankIdTemplate only [computes the id] from the template; the bank is created by the plugin the first time it runs an agent in that repository, along with its baseline config. The documentation says: a new repo an agent touches spawns a new bank; defaultBankConfig “travels in the same import that creates the bank”.",
  "help.b.line2":
    "Each session start only fills in what is missing (the first step of the bundled deepen engine is bank configuration), so a bank appearing in a repository needs no manual work.",
  "help.b.line3":
    "The other way round: with optInOnly on, projects that are not listed in optInPaths [never get a bank at all] (no bank is created), and nothing is recorded there.",
  "help.b.line4":
    "defaultBankConfig decides the baseline a new bank is born with (by default the server values: automatic consolidation on, observations on, mental-model refresh floor 60s); manageBankConfig: false stops the plugin from touching that bank's own config at all. Writes are [incremental] and do not overwrite values you tuned in the console.",
  "help.b.line5":
    "To confirm that the bank was created and the sync finished: use hindsight_sync_status (a finished sync reports synced: true), or look for seed_started in ~/.hindsight/coding-agents-logs/diag.jsonl.",

  "help.c.title": "bankIdTemplate placeholders",
  "help.c.line1":
    "{gitProject} — the worktree-aware repository name: every worktree of one repository shares one bank; outside a repository it takes the name of the session's starting directory.",
  "help.c.line2":
    "{project} — the current directory name; {harness} — the entry point that made the call (dsh / claude-code / codex …).",
  "help.c.line3": "{channel} / {user} — from $HINDSIGHT_CHANNEL_ID / $HINDSIGHT_USER_ID.",
  "help.c.line4":
    "The default template is harness-neutral, so every agent shares the same repository bank; write {harness}-{gitProject} to separate them per agent.",

  "help.d.title": "Who overrides whom (the later one wins)",
  "help.d.line1":
    "built-in defaults → environment variables → file top level → harnesses.<name> → paths.<prefix> → banks.<resolved id>.",
  "help.d.line2":
    "mapPathToBank, harnesses, paths, banks and retainMetadata are key-value maps and can only be written in the file.",

  "help.e.title": "This tab edits banks.<id>",
  "help.e.line1":
    "It selects by [resolved bank id] and takes effect after resolution — so a moved repository still matches.",
  "help.e.line2":
    "Any behavior field can be overridden here; a bank field can merge several ids into one bank (single hop, literal, and the target's own section no longer participates).",
  "help.e.line3":
    "Bank-resolution fields (bankId / mapPathToBank / bank / optInOnly / optInPaths) are ignored when written inside a bank section.",
  "help.e.line4":
    'Example: {"banks": {"coding-agent::backend": {"bank": "team::product"}, "coding-agent::frontend": {"bank": "team::product"}}}',

  "help.f.title": "paths.<prefix> and common recipes",
  "help.f.line1":
    "paths overrides connection settings by directory prefix (serverMode / apiUrl / apiPort / apiToken); it takes effect after resolution and before banks.<id>, so a bank section can still override it. This page only lists them — edit the file.",
  "help.f.line2":
    'Group a set of repositories into one bank by [directory]: {"mapPathToBank": {"/Users/me/work/client-x": "client-x-memory"}}',
  "help.f.line3":
    "Group a hand-picked set of repositories into one bank by [id]: use the banks example above.",

  "help.g.title": "How do I find out which bank id is actually mine?",
  "help.g.line1":
    "The upstream v2 plugin writes the seed / session banner into the plugin log: ~/.hindsight/coding-agents-logs/plugin.log (the log carries bank=<id>).",
  "help.g.line2":
    "Setting logLevel to debug records a more detailed trace; the structured events are in diag.jsonl in the same directory.",
  "help.g.line3":
    "The authoritative description is the Bank resolution section of hindsight-integrations/coding-agents/README.md.",
} satisfies Readonly<Record<string, string>>;

/** The canonical key set of the page's copy, derived from the English table. */
type CanonicalCopyKey = keyof typeof EN;

/** The Chinese table, checked exhaustively against {@link CanonicalCopyKey}: no key may be missing. */
const ZH: Readonly<Record<CanonicalCopyKey, string>> = {
  title: "Hindsight 记忆设置",

  "loading.text": "正在读取宿主配置…",
  "unset.text": "未设置",
  "unset.optionPrefix": "未设置（默认 {value}）",

  "tabs.banks.title": "按项目（banks）",
  "tabs.banks.summary": "为单个 bank / 仓库覆盖设置，其余 bank 仍用顶层值。",

  "group.empty": "本组暂无配置项。",

  "field.chip.editable": "可编辑",
  "field.chip.readOnly": "只读",
  "field.chip.inFile": "文件已设置",
  "field.chip.notInFile": "文件未设置",
  "field.placeholder.secretSet": "已设置（不显示明文）· 留空＝不改动",
  "field.placeholder.list": "一行一个；也接受逗号分隔",
  "field.secretHint": "密钥不随接口下发：留空＝不改动，输入新值＝覆盖，点「清空」保存后删除该键。",
  "field.clearInFile": "清空（保存后删除该键）",
  "field.clearUnsetStored": "{value}（保存后删除该键）",
  "field.clearNotInFile": "清空（文件中没有这一项）",

  "errors.readFailed": "读取配置失败：{message}",
  "errors.saveFailed": "保存失败：{message}",
  "errors.badFormat": "宿主返回的设置数据格式无法识别（缺少 path / fields）。",
  "errors.invalidFields": "有 {count} 个字段不合法，未提交：{messages}",
  "errors.invalidFieldsShort": "有 {count} 个字段不合法，不会提交：{messages}",
  "errors.parseNumber": "{key} 需要一个数字，收到「{value}」。",
  "errors.parseBoolean": "{key} 只接受 true 或 false。",
  "errors.parseEnum": "{key} 只接受 {values}。",
  "errors.enumSeparator": " / ",
  "errors.parseJson": "{key} 不是合法的 JSON。",
  "errors.unparsableFile": "配置文件存在但无法解析，本页不会写入以免覆盖它：{message}",

  "notices.discarded": "已丢弃未保存的改动。",
  "notices.nothingToSave": "没有需要保存的改动。",
  "notice.saved": "已保存到 {path}：{parts}。",
  "notice.unchanged": "文件没有变化，未写入任何改动。",
  "notice.writes": "写入或更新 {count} 项",
  "notice.removals": "删除 {count} 项（回退到环境变量，然后回退到插件默认值）",
  "notice.touched": "已更新 {path}",

  "page.fileIntro": "本页直接读写宿主当前使用的配置文件：",
  "page.blankHint": "留空并保存＝删除该键，该项随即回退到环境变量，再回退到插件默认值。",

  "source.inFile": "来自配置文件",
  "source.defaultTop": "未写入文件；显示的是默认值 {value}",
  "source.defaultBank": "本 bank 未覆盖该项；显示的是默认值 {value}（删除后回退到顶层）。",
  "fallback.line": "文件未设置该项，实际生效：{parts}。",
  "fallback.none": "上游默认未设值",
  "fallback.default": "默认 {value}",
  "fallback.env": "环境变量 {env}",
  "shadow.text":
    "harnesses.dsh 也设置了这一项，它优先于本页写入的顶层值——在这里保存不会改变实际生效的值。",
  "readonly.text":
    "该项是文件专属的嵌套结构或宿主盖章字段，表单无法安全表达，只能在配置文件里编辑。",

  "scope.global": "全局",
  "scope.harness": "按 harness",
  "scope.bank": "按 bank",
  "scope.path": "按路径",
  "scope.top": "顶层",

  "banks.scopeText":
    "banks.<id> 覆盖该 bank 的设置（顶层仍对其余 bank 生效）；一个 bank 里的键删除后会回退到顶层。",
  "banks.pathsReadOnly":
    "paths 按绝对目录前缀覆盖（paths.<目录>），通常不手写，因此本页只列出文件里已有的段落，请在配置文件中编辑。",
  "banks.title": "已有 bank",
  "banks.count": "{count} 个",
  "banks.empty": "文件里还没有 banks 段落。",
  "banks.keysCount": "{count} 个键",
  "banks.keysSet": "已设置：{keys}",
  "banks.keySeparator": "、",
  "editor.ignoredHere":
    "此处不列出：{fields}。这些键写在 banks.<id> 或 paths.<前缀> 段里会被上游丢弃——bank 解析与 opt-in 判定发生在段生效之前——请改在顶层设置。",
  "banks.open": "打开",
  "banks.close": "收起",
  "banks.newPlaceholder": "新增 bank id，例如 coding-agent::my-repo",
  "banks.newAria": "新增 bank id",
  "banks.add": "新增",
  "banks.addEmpty": "请输入 bank id（不能为空）。",
  "banks.addExists": "banks.{id} 已经存在，请直接从上面的列表打开。",
  "banks.editTitle": "编辑 banks.{id}",
  "banks.newSection": "新段落",
  "banks.newSectionNote": "保存后才会在文件里创建这一段。",
  "banks.closeEditor": "关闭",
  "banks.pathsTitle": "按路径（paths）",
  "banks.pathsReadOnlyChip": "只读",
  "banks.pathKeysSuffix": " · {count} 个键",
  "banks.pathKeysList": " · {count} 个键：{keys}",

  "editor.countAndPath": "{count} 个配置项 · 文件：{path}",
  "editor.saveTo": "保存到 banks.{id}",

  "actions.save": "保存",
  "actions.saveTo": "保存到 banks.{id}",
  "actions.saving": "保存中…",
  "actions.saveCount": "{label}（{count} 项）",
  "actions.discard": "撤销修改",
  "actions.reloading": "重新读取中…",
  "actions.reload": "重新读取",

  "counts.fieldsAndGroups": "{count} 个配置项 · 分组 {groups} 个",

  "unavailable.noRemote":
    "宿主没有提供 Remote 服务（ctx.remote 不存在），本页无法读写配置。请确认 dsh-api-gateway 的客户端半边已加载。",
  "unavailable.noNamespace":
    "Remote 贡献已提交，但宿主没有挂载 {service}。请确认 dsh-api-gateway 正在服务该命名空间。",
  "unavailable.mountFailed": "Remote 贡献挂载失败：{message}",
  "unavailable.initFailed": "初始化失败：{message}",

  "help.toggleOpen": "收起「bank 是怎么解析的」",
  "help.toggleClosed": "不知道怎么设置？bank 是怎么解析的（展开说明）",

  "help.a.title": "一个仓库一个 bank",
  "help.a.line1": "记忆按仓库隔离。插件按【当前工作目录】解析 bank，顺序如下（先命中者胜）：",
  "help.a.line2":
    "① mapPathToBank —— 绝对路径的最长前缀；优先级最高，能盖过 bankId；linked worktree 继承主检出的映射。",
  "help.a.line3": "② 静态 —— 设了 bankId（或把 dynamicBankId 设为 false）。",
  "help.a.line4": "③ 动态 —— 用 bankIdTemplate 生成，默认 coding-agent::{gitProject}。",

  "help.b.title": "bank 需要我手工建吗？不需要",
  "help.b.line1":
    "bankIdTemplate 只负责按模板【算出 id】；bank 由插件在该仓库第一次跑 agent 时自动创建，并顺带写入它的基线配置。文档原文：a new repo an agent touches spawns a new bank；defaultBankConfig “travels in the same import that creates the bank”。",
  "help.b.line2":
    "每次会话启动只做缺的部分（bundled deepen 引擎的第一步就是 bank configuration），所以仓库里新出现一个 bank 不需要任何手工操作。",
  "help.b.line3":
    "反过来说：optInOnly 打开后，未列入 optInPaths 的项目【根本不会建库】（no bank is created），那里什么都不记。",
  "help.b.line4":
    "defaultBankConfig 决定新库出生时的基线（默认是服务端值：自动整合开、observations 开、心智模型刷新下限 60s）；manageBankConfig: false 则让插件完全不碰该库自身的配置。写入是【增量】的，不会覆盖你在控制台里调过的值。",
  "help.b.line5":
    "要确认建库与同步是否完成：用 hindsight_sync_status（同步好了会报 synced: true），或在 ~/.hindsight/coding-agents-logs/diag.jsonl 里看 seed_started。",

  "help.c.title": "bankIdTemplate 的占位符",
  "help.c.line1":
    "{gitProject} —— worktree 感知的仓库名：同一仓库的所有 worktree 共用一个 bank；不在仓库里时，取会话启动目录的名字。",
  "help.c.line2":
    "{project} —— 当前目录名；{harness} —— 发起调用的入口（dsh / claude-code / codex …）。",
  "help.c.line3": "{channel} / {user} —— 来自 $HINDSIGHT_CHANNEL_ID / $HINDSIGHT_USER_ID。",
  "help.c.line4":
    "默认模板对 harness 中立，所以各 agent 共享同一个仓库 bank；想按 agent 分开就写 {harness}-{gitProject}。",

  "help.d.title": "谁盖过谁（后者胜）",
  "help.d.line1":
    "内置默认值 → 环境变量 → 文件顶层 → harnesses.<name> → paths.<前缀> → banks.<已解析 id>。",
  "help.d.line2":
    "mapPathToBank、harnesses、paths、banks、retainMetadata 是键值映射，只能写在文件里。",

  "help.e.title": "本标签页改的是 banks.<id>",
  "help.e.line1": "它按【已解析的 bank id】选中，并在解析之后生效 —— 所以仓库搬到别处也依然命中。",
  "help.e.line2":
    "任何行为字段都能在此覆盖；bank 字段可以把多个 id 合并到一个 bank（单跳、字面量，目标自身的段不再参与）。",
  "help.e.line3":
    "bank 解析类字段（bankId / mapPathToBank / bank / optInOnly / optInPaths）写在 bank 段里会被忽略。",
  "help.e.line4":
    '示例：{"banks": {"coding-agent::backend": {"bank": "team::product"}, "coding-agent::frontend": {"bank": "team::product"}}}',

  "help.f.title": "paths.<前缀> 与常见配方",
  "help.f.line1":
    "paths 按目录前缀覆盖连接类设置（serverMode / apiUrl / apiPort / apiToken）；在解析之后、banks.<id> 之前生效，所以 bank 段仍能盖过它。本页只列出，请在文件里编辑。",
  "help.f.line2":
    '按【目录】把一片仓库归到一个 bank：{"mapPathToBank": {"/Users/me/work/client-x": "client-x-memory"}}',
  "help.f.line3": "按【id】把手工挑的几个仓库归到一个 bank：用上面的 banks 示例。",

  "help.g.title": "怎么看我的 bank id 到底是哪个",
  "help.g.line1":
    "上游 v2 插件把 seed / 会话横幅写进插件日志：~/.hindsight/coding-agents-logs/plugin.log（日志里出现 bank=<id>）。",
  "help.g.line2": "把 logLevel 设为 debug 会记下更详细的过程；结构化事件在同目录的 diag.jsonl。",
  "help.g.line3":
    "权威说明见 hindsight-integrations/coding-agents/README.md 的 Bank resolution 一节。",
};
// <<< dictionaries

/** The locale namespace this page's dictionaries are registered under. */
export const LOCALE_NS = "dsh-hindsight-settings";

/**
 * The shipped dictionaries, one complete flat map per locale.
 *
 * `en` is the canonical key set; `zh` is typed against it with `satisfies`, so the two can never
 * drift apart without a compile error (and `model.test.ts` asserts the same equality at runtime).
 */
export const DICTIONARIES: {
  readonly en: Readonly<Record<CopyKey, string>>;
  readonly zh: Readonly<Record<CopyKey, string>>;
} = { en: EN, zh: ZH };

/** Every key this page's dictionaries define. Derived from the English table, the canonical set. */
export type CopyKey = CanonicalCopyKey & string;

/** The two shipped locale ids; anything that is not `zh` is treated as English. */
export type ActiveLanguage = "zh" | "en";

/** Values interpolated into a `{name}` placeholder at translation time. */
export type CopyParams = Readonly<Record<string, string | number>>;

/** What this module's pure helpers need to read the active language and translate one key. */
export interface CopyContext {
  readonly t: Translate;
  readonly lang: ActiveLanguage;
}

/** The locale service's translate function, structurally typed (it keeps a stable identity). */
export type Translate = (key: string, params?: CopyParams) => string;

/** Map any locale id to one of the two shipped languages; anything that is not `zh` is English. */
export function activeLanguage(active: string | undefined): ActiveLanguage {
  return active === "zh" ? "zh" : "en";
}

/**
 * The `{name}` substitution the locale service performs on a dictionary template.
 *
 * A placeholder with no matching param is left verbatim, which is exactly what keeps upstream's
 * literal `{gitProject}` / `{harness}` templates readable in the help text.
 */
export function interpolate(template: string, params?: CopyParams): string {
  if (params === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/**
 * A translator over a LOCAL dictionary table, for compositions with no locale service at all (the
 * smoke test renders without a renderer). Falls back to English so a key can never come out
 * `undefined`; the live path always goes through the framework's `bind`, which reads the active
 * locale at call time.
 */
export function makeTranslate(dictionaries: {
  readonly en: Readonly<Record<string, string>>;
  readonly zh: Readonly<Record<string, string>>;
}): Translate {
  return (key, params) => {
    const template = dictionaries.en[key] ?? dictionaries.zh[key] ?? key;
    return interpolate(template, params);
  };
}

/** A translate function bound to the built-in dictionaries, and therefore to English. */
export const fallbackTranslate: Translate = makeTranslate(DICTIONARIES);

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The host contract (mirrors the host's `service.ts`; do not invent fields)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A JSON-shaped value, which is all the gateway carries. */
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/** One field as `describe()` reports it. */
export interface SettingsFieldView {
  readonly key: string;
  readonly group: string;
  readonly kind: FieldKind;
  readonly values?: readonly string[];
  readonly default: string | number | boolean | null;
  readonly env?: string;
  readonly editable: boolean;
  readonly scope: string;
  /**
   * The host's own one-line description. The host sends it as a plain STRING in its own language,
   * so the page uses it only as the fallback for a key the bundled table does not know.
   */
  readonly summary: string;
  /** The value the FILE sets, or `null` when the file does not set it. */
  readonly value: unknown;
  /** Distinguishes "the file does not set this" from "the file sets it to the default". */
  readonly inFile: boolean;
  /** True when `harnesses.dsh` also sets it, which wins over the top level this page writes. */
  readonly shadowedByHarness: boolean;
}

/**
 * The layer a read or write addresses.
 *
 * `top` is the shared file level; `bank` is one `banks.<id>` section; `path` is one `paths.<dir>`
 * section. `describe()` accepts the scope as an OPTIONAL argument (the host defaults it to `top`), so
 * `describe()` and `describe({ kind: "top" })` mean the same thing.
 */
export type ConfigScope =
  | { readonly kind: "top" }
  | { readonly kind: "bank"; readonly id: string }
  | { readonly kind: "path"; readonly dir: string };

/** One `banks.<id>` / `paths.<dir>` section the file already carries, with the keys it sets. */
export interface ScopeMember {
  readonly id: string;
  readonly keys: readonly string[];
}

/** What `describe()` answers. */
export interface SettingsView {
  /** The config file's real path, resolved by the host — never assume a platform layout. */
  readonly path: string;
  /** Which layer these values came from; absent means the top level. */
  readonly scope?: ConfigScope;
  /** Set when the file exists but cannot be parsed; the page must not offer to save then. */
  readonly error?: string;
  readonly fields: readonly SettingsFieldView[];
  /** Present on a top-level read: the bank sections the file already holds. */
  readonly banks?: readonly ScopeMember[];
  /** Present on a top-level read: the path sections the file already holds. */
  readonly paths?: readonly ScopeMember[];
}

/** What `apply()` / `applyScoped()` answer. */
export interface ApplyResult {
  readonly path: string;
  readonly scope?: ConfigScope;
  readonly changed: boolean;
  readonly removed: readonly string[];
}

/**
 * Every gateway unary call resolves to this and never rejects for a carrier failure.
 *
 * `error` is an opaque `RemoteError` (an object carrying `code` and `message`); it is deliberately
 * typed `unknown` so nothing downstream can pretend to know its shape.
 */
export type RemoteResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: unknown };

/** The `remote.<namespace>` service the client half mounts and then addresses. */
export interface RemoteNamespace {
  /** The top level when no scope is given (the host's own default). */
  describe(scope?: ConfigScope): Promise<RemoteResult<SettingsView>>;
  /** A top-level write. */
  apply(patch: Record<string, JsonValue>): Promise<RemoteResult<ApplyResult>>;
  /** The same write, addressed at one `banks.<id>` / `paths.<dir>` section. */
  applyScoped(
    scope: ConfigScope,
    patch: Record<string, JsonValue>
  ): Promise<RemoteResult<ApplyResult>>;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The seat
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The Settings-list seat.
 *
 * `settings.section` is a `list` / `root` slot declared by the settings shell; this page is its own
 * entry in the Settings navigation rather than a section inside another plugin's detail page.
 */
export const SETTINGS_SLOT = "settings.section";
/** The contribution id — also the navigation key the shell matches. */
export const PAGE_ID = "hindsight-settings";
/** Navigation order; the shell sorts its sections by this. */
export const PAGE_ORDER = 35;

/** The Settings-navigation label, translated through the page's own namespace. */
export function pageLabel(t: Translate): string {
  return t("title");
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The Remote mount
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The host namespace this page calls. */
const SERVICE_NAMESPACE = "hindsightSettings";

/**
 * The service key the gateway installs the namespace under.
 *
 * `ClientRemote.$mount()` creates each namespace as a child Cordis service named `remote.<ns>`, which
 * is why the page reads `ctx.get('remote.hindsightSettings')` rather than the bare namespace.
 */
export const SERVICE_KEY = `remote.${SERVICE_NAMESPACE}`;

/** The contribution package name; it must be unique per registration. */
const CONTRIBUTION_PACKAGE = "@Echo-Note/dsh-hindsight-settings";

/**
 * A pass-through STRICT codec for a plain-JSON payload.
 *
 * `$mount` refuses a Client parameter whose `codec.mode` is not `'strict'`; the `create()` factory
 * only has to validate, and every payload here is plain JSON by construction (see the host's
 * `service.ts`), so there is no second schema to drift out of sync.
 */
function jsonCodec(typeSymbol: string): {
  readonly mode: "strict";
  readonly typeSymbol: string;
  readonly create: () => { parse(value: unknown): unknown };
} {
  return { mode: "strict", typeSymbol, create: () => ({ parse: (value: unknown) => value }) };
}

/**
 * The Client-for-Host contribution handed to `ctx.remote.$mount()`.
 *
 * Two rules from the gateway are load-bearing and are asserted by the unit tests:
 *
 *  1. every parameter of a Client contribution needs a STRICT codec — `$mount` rejects a parameter
 *     whose `codec.mode` is not `'strict'` before any method becomes callable;
 *  2. a RESULT may be `src-json`, which is what every method uses because they return plain JSON the
 *     client needs no schema for.
 *
 * `describe` declares its optional `scope` argument (with `acceptsUndefined`) exactly as the host
 * manifest does, so both `describe()` and `describe({ kind: "bank", id })` dispatch; `applyScoped`
 * takes the scope and the patch in that order.
 */
export const CONTRIBUTION = deepFreeze({
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
          acceptsUndefined: true,
        },
      ],
      result: { mode: "src-json" },
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
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ClientNote`),
        },
      ],
      result: { mode: "src-json" },
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
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#ConfigScope`),
        },
        {
          name: "patch",
          wire: "patch",
          source: "json",
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#SettingsPatch`),
        },
      ],
      result: { mode: "src-json" },
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
          codec: jsonCodec(`${CONTRIBUTION_PACKAGE}#SettingsPatch`),
        },
      ],
      result: { mode: "src-json" },
    },
  ],
});

/** `Object.freeze` deep enough that a stray mutation cannot corrupt a live mount. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Structural helpers
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A plain data object; arrays and `null` are not records. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Whether a `describe()` payload is usable. */
export function isSettingsView(value: unknown): value is SettingsView {
  return isRecord(value) && typeof value.path === "string" && Array.isArray(value.fields);
}

/** Structural equality for JSON values; keeps a re-typed value out of the write queue. */
export function jsonEquals(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((entry, index) => jsonEquals(entry, right[index]))
    );
  }
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) return false;
    return keys.every((key) => key in right && jsonEquals(left[key], right[key]));
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Localized metadata from the shared field table
//
// `../fields` is being made bilingual: a field's `summary` and a group's `title` / `summary` are a
// `{ en, zh }` pair. This module reads that shape, but tolerates the plain-string form too, because
// the browser bundle must keep rendering (in whatever language that string is) against a table that
// has not been converted yet.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A string whose translation ships with the shared field table. */
export interface LocalizedText {
  readonly en: string;
  readonly zh: string;
}

/** Whether a table entry carries the bilingual shape rather than a plain string. */
export function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    isRecord(value) &&
    typeof value.en === "string" &&
    typeof value.zh === "string" &&
    value.en !== "" &&
    value.zh !== ""
  );
}

/** Pick one language out of a bilingual table entry, with a plain string passing through. */
export function localizedText(value: string | LocalizedText, lang: ActiveLanguage): string {
  return isLocalizedText(value) ? value[lang] : value;
}

/** The bundled table's entry for a field key, or `undefined` when this build does not know it. */
export function fieldMetadata(
  key: string
): { readonly summary: string | LocalizedText } | undefined {
  return CONFIG_FIELDS.find((field) => field.key === key);
}

/**
 * A field row's description: the bundled, localized table first; the host's own string only as the
 * fallback for a key this build does not declare.
 */
export function fieldSummary(field: SettingsFieldView, lang: ActiveLanguage): string {
  const declared = fieldMetadata(field.key);
  return declared === undefined ? field.summary : localizedText(declared.summary, lang);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A rendered group: heading metadata plus the fields the host reported for it. */
export interface GroupDescriptor {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

export interface FieldSection {
  readonly group: GroupDescriptor;
  readonly fields: readonly SettingsFieldView[];
}

/**
 * The declared heading for a group id, translated into the active language.
 *
 * A group the host reports but this build has no heading for keeps the raw id as its title (an
 * upstream rename then shows up as a visibly untitled section instead of losing its fields).
 */
/**
 * Split a scope's field list into the rows its editor may offer, and the keys upstream discards there.
 *
 * Upstream filters a `banks.<id>` (and `paths.<prefix>`) section through `BANK_OVERRIDE_EXCLUDED`:
 * bank resolution and the opt-in decision both happen BEFORE a section applies, so those keys are
 * dropped on read — its own comment says "strip them rather than let them read as effective".
 * Offering them for editing would write a value that is silently ignored, which is worse than not
 * offering it, so the editor omits them and names them instead.
 *
 * A `harnesses.<name>` section is a plain flat merge upstream and is NOT filtered; this page has no
 * harness editor, so the split only applies to the bank scope it does expose.
 */
export function splitForScope(
  fields: readonly SettingsFieldView[],
  scope: ConfigScope
): { readonly offered: readonly SettingsFieldView[]; readonly ignored: readonly string[] } {
  if (scope.kind !== "bank" && scope.kind !== "path") return { offered: fields, ignored: [] };
  const offered: SettingsFieldView[] = [];
  const ignored: string[] = [];
  for (const field of fields) {
    if (fieldIsBankScopeIgnored(field.key)) ignored.push(field.key);
    else offered.push(field);
  }
  return { offered, ignored };
}

/** True when the bundled table marks this key as discarded inside a bank / path section. */
function fieldIsBankScopeIgnored(key: string): boolean {
  return CONFIG_FIELDS.find((field) => field.key === key)?.bankScopeIgnored === true;
}

export function groupDescriptor(group: string, lang: ActiveLanguage): GroupDescriptor {
  const declared = FIELD_GROUPS.find((candidate) => candidate.id === group);
  return declared === undefined
    ? { id: group, title: group, summary: "" }
    : {
        id: group,
        title: localizedText(declared.title, lang),
        summary: localizedText(declared.summary, lang),
      };
}

/** Declaration order of every known field key, used to order a group's rows. */
const FIELD_ORDER: ReadonlyMap<string, number> = new Map(
  CONFIG_FIELDS.map((field, index) => [field.key, index] as const)
);

function byDeclarationOrder(left: SettingsFieldView, right: SettingsFieldView): number {
  const a = FIELD_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER;
  const b = FIELD_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER;
  return a - b;
}

/**
 * The page's sections, in `FIELD_GROUPS` order.
 *
 * A declared group with no fields is kept rather than dropped: the table is the contract, and a group
 * that silently vanishes because the host stopped reporting a field is harder to notice than an empty
 * heading. A group the host reports but this build has no heading for is appended, so an upstream
 * rename shows up as a visibly untitled section instead of losing its fields.
 */
export function buildSections(
  fields: readonly SettingsFieldView[],
  lang: ActiveLanguage
): readonly FieldSection[] {
  const buckets = new Map<string, SettingsFieldView[]>();
  for (const field of fields) {
    const bucket = buckets.get(field.group);
    if (bucket === undefined) buckets.set(field.group, [field]);
    else bucket.push(field);
  }

  const sections: FieldSection[] = [];
  const emitted = new Set<string>();
  const emit = (group: string): void => {
    if (emitted.has(group)) return;
    emitted.add(group);
    const bucket = buckets.get(group) ?? [];
    sections.push({
      group: groupDescriptor(group, lang),
      fields: [...bucket].sort(byDeclarationOrder),
    });
  };

  for (const group of FIELD_GROUPS) emit(group.id);
  for (const group of buckets.keys()) emit(group);
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Tabs
//
// The page shows ONE group at a time: seven groups of settings in a single column was the "really
// ugly" surface this upgrade removes. The tab list is derived from the same sections, so a group the
// host reports but this build has no heading for still gets a tab (and does not vanish), and the
// banks table is always the last tab.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The id of the final, non-group tab (“按项目”). */
export const BANKS_TAB_ID = "__banks__";

/** One entry in the page's tab bar. */
export interface PageTab {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  /** `group` renders field rows; `banks` renders the scope browser. */
  readonly kind: "group" | "banks";
  /** The fields this tab renders; always empty for the banks tab. */
  readonly fields: readonly SettingsFieldView[];
}

/** The tab bar: one tab per section, then the banks tab. Both carry translated copy. */
export function buildTabs(
  fields: readonly SettingsFieldView[],
  copy: CopyContext
): readonly PageTab[] {
  const tabs: PageTab[] = buildSections(fields, copy.lang).map((section) => ({
    id: section.group.id,
    title: section.group.title,
    summary: section.group.summary,
    kind: "group",
    fields: section.fields,
  }));
  tabs.push({
    id: BANKS_TAB_ID,
    title: copy.t("tabs.banks.title"),
    summary: copy.t("tabs.banks.summary"),
    kind: "banks",
    fields: [],
  });
  return tabs;
}

/** What `banks.<id>` means, in the user's words, shown above the bank list. */
export function banksScopeText(t: Translate): string {
  return t("banks.scopeText");
}

/** Why `paths` is listed but not edited. */
export function pathsReadOnlyText(t: Translate): string {
  return t("banks.pathsReadOnly");
}

/** The heading for one bank section while it is open for editing. */
export function scopedEditorTitle(scope: ConfigScope, t: Translate): string {
  if (scope.kind === "bank") return t("banks.editTitle", { id: scope.id });
  if (scope.kind === "path") return `paths.${scope.dir}`;
  return t("scope.top");
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Display
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Shown wherever a value is genuinely absent from the file. */
export function unsetText(t: Translate): string {
  return t("unset.text");
}

/** Render any value as one line of text. Internal: every public formatter goes through it. */
function formatScalar(value: unknown, t: Translate): string {
  if (value === undefined || value === null) return unsetText(t);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.length === 0
      ? unsetText(t)
      : value.map((entry) => formatScalar(entry, t)).join(", ");
  }
  return JSON.stringify(value) ?? unsetText(t);
}

/** Render a value for its field's kind — pretty JSON for `json`, one item per line for lists. */
export function formatFieldValue(field: SettingsFieldView, value: unknown, t: Translate): string {
  if (value === undefined || value === null) return unsetText(t);
  if (field.kind === "json") return JSON.stringify(value, null, 2) ?? unsetText(t);
  if (field.kind === "stringList") {
    return Array.isArray(value) && value.length > 0
      ? value.map((entry) => String(entry)).join("\n")
      : unsetText(t);
  }
  return formatScalar(value, t);
}

/** The field's documented default. `null` in the contract means upstream leaves it unset. */
export function formatDefault(field: SettingsFieldView, t: Translate): string {
  return field.default === null ? unsetText(t) : formatScalar(field.default, t);
}

/** A short label for a field's override scope, translated into the active language. */
export function scopeLabel(scope: string, t: Translate): string {
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
      // An undeclared scope is host vocabulary, not page copy: show it verbatim rather than inventing
      // a translation for a layer this build does not know.
      return scope;
  }
}

/**
 * The fallback chain to show while the file does not set a field: default, then environment variable.
 *
 * This is the line that makes `inFile: false` honest. The page shows an empty control for such a
 * field, and "empty" must not read as "the value is empty" when the plugin will actually use the
 * default or an exported variable.
 */
export function fallbackText(field: SettingsFieldView, copy: CopyContext): string {
  const { t } = copy;
  const parts: string[] = [];
  parts.push(
    field.default === null
      ? t("fallback.none")
      : t("fallback.default", { value: formatScalar(field.default, t) })
  );
  if (field.env !== undefined) parts.push(t("fallback.env", { env: field.env }));
  return t("fallback.line", { parts: parts.join(" → ") });
}

/** The warning for a field the harness block overrides. */
export function shadowText(t: Translate): string {
  return t("shadow.text");
}

/** Why a read-only field cannot be edited, and where it can be. */
export function readOnlyText(t: Translate): string {
  return t("readonly.text");
}

/**
 * The value shown for a field the file does not set: the plugin default, or nothing.
 *
 * The host does NOT send the environment variable's value — only its NAME — so the default is the
 * closest honest thing the page can put in the box. For `apiPort` (unset in the file, default 9077)
 * that is `9077` instead of an empty box that reads as "no value".
 */
export function effectiveText(field: SettingsFieldView): string {
  return field.default === null || field.default === undefined
    ? ""
    : draftValueFor(field, field.default);
}

/**
 * The text a freshly loaded form shows for one field.
 *
 * `inFile` wins: the file's value is the truth. Otherwise the effective default is prefilled so the
 * user sees what the plugin will actually use. Prefilling is display-only — {@link diffDraft} uses
 * this same text as the baseline, so an untouched form still produces an empty patch.
 */
export function prefillValueFor(field: SettingsFieldView): string {
  return field.inFile ? draftValueFor(field, field.value) : effectiveText(field);
}

/** Where the text currently in a field's box came from, or `undefined` when there is nothing to say. */
export function valueSourceNote(
  field: SettingsFieldView,
  copy: CopyContext,
  scope: "top" | "bank" = "top"
): string | undefined {
  const { t } = copy;
  if (field.inFile) return t("source.inFile");
  if (field.default === null || field.default === undefined) return undefined;
  const shown = formatScalar(field.default, t);
  return scope === "bank"
    ? t("source.defaultBank", { value: shown })
    : t("source.defaultTop", { value: shown });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Drafts
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Turn a stored value into the text an input starts with.
 *
 * The inverse of {@link parseDraft} for every editable kind — that round trip is what lets an
 * untouched field produce no write at all.
 */
export function draftValueFor(field: SettingsFieldView, value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return field.kind === "stringList"
      ? value.map((entry) => String(entry)).join("\n")
      : (JSON.stringify(value) ?? "");
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (isRecord(value)) return JSON.stringify(value) ?? "";
  return String(value);
}

/**
 * A fresh draft: the file's value where it has one, and the effective default where it does not.
 *
 * The prefilled default is a BASELINE, not a pending write: {@link diffDraft} compares against the
 * same text, so opening the page and pressing Save sends nothing.
 */
export function draftFromFields(fields: readonly SettingsFieldView[]): Record<string, string> {
  const draft: Record<string, string> = {};
  for (const field of fields) draft[field.key] = prefillValueFor(field);
  return draft;
}

/** A parsed draft cell, or the reason the text is not acceptable. */
export type ParseResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly message: string };

/**
 * Parse one draft cell into the value the host should store; `null` means "remove the key".
 *
 * The empty cell means **remove** for every kind, which is how a field returns to the environment
 * variable and then the plugin default. `string` and `secret` keep their text verbatim — a token or a
 * custom instruction must not be silently trimmed — so only an exactly-empty cell clears them.
 */
export function parseDraft(field: SettingsFieldView, raw: string, t: Translate): ParseResult {
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
            values: values.join(t("errors.enumSeparator")),
          }),
        };
      }
      return { ok: true, value: text };
    }
    case "stringList": {
      if (text === "") return { ok: true, value: null };
      const items = text
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter((item) => item !== "");
      return { ok: true, value: items.length === 0 ? null : items };
    }
    case "json": {
      if (text === "") return { ok: true, value: null };
      try {
        return { ok: true, value: JSON.parse(text) as JsonValue };
      } catch {
        return { ok: false, message: t("errors.parseJson", { key: field.key }) };
      }
    }
    default:
      return { ok: true, value: raw === "" ? null : raw };
  }
}

/** One field whose draft text cannot be turned into a value. */
export interface DraftError {
  readonly key: string;
  readonly message: string;
}

/** What a save would send, and what it refuses to send. */
export interface DraftDiff {
  /** Key → value to write; a key mapped to `null` removes it from the file. */
  readonly patch: Record<string, JsonValue>;
  readonly errors: readonly DraftError[];
  /** Keys that would actually change something, in field order. */
  readonly changed: readonly string[];
}

/**
 * Turn a draft into the patch `apply()` takes.
 *
 * Two gates keep this from rewriting a config the user never touched:
 *
 *  1. a cell whose text equals the text a fresh form shows is skipped outright — the baseline is
 *     {@link prefillValueFor}, so this covers both "the file stores this exact text" (including an
 *     empty string stored in the file) and "the file stores nothing and the box shows the default";
 *  2. a parsed value equal to the file's value is skipped, so reformatting a list does not write.
 *
 * The prefilled default is therefore never written by itself: only a cell the user actually changed
 * (or explicitly cleared) produces an entry. A field the file does not set produces a write only when
 * the user typed something DIFFERENT from the displayed default; clearing it stays a no-op. Fields
 * the host marks `editable: false` are never touched.
 */
export function diffDraft(
  fields: readonly SettingsFieldView[],
  draft: Readonly<Record<string, string>>,
  t: Translate,
  /**
   * Fields the user explicitly asked to clear. Needed because a REDACTED secret has no loaded value
   * to differ from: its empty cell means "unchanged", so without this set the page could show a
   * secret as set and never be able to remove it.
   */
  cleared: ReadonlySet<string> = new Set()
): DraftDiff {
  const patch: Record<string, JsonValue> = {};
  const errors: DraftError[] = [];
  const changed: string[] = [];

  for (const field of fields) {
    if (!field.editable) continue;
    const raw = draft[field.key] ?? "";
    // The baseline is what the box was prefilled with, NOT the empty string: a default shown in an
    // unset field must not become a write just because the user opened the page.
    const baselineText = prefillValueFor(field);
    if (raw === baselineText && !cleared.has(field.key)) continue;
    if (cleared.has(field.key)) {
      // Removing a key the file does not set changes nothing.
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
      // Clearing a field the file does not set changes nothing.
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

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Availability, status copy and errors
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * What the page knows about the Remote side.
 *
 * An unavailable state carries a copy REQUEST — the dictionary key plus its params — rather than a
 * finished sentence. The reason is a standing explanation that must re-word itself when the user
 * switches language, which a stored string cannot do.
 */
export type ServiceState =
  | { readonly kind: "loading" }
  | {
      readonly kind: "unavailable";
      readonly reasonKey: CopyKey;
      readonly reasonParams?: CopyParams;
    }
  | { readonly kind: "ready"; readonly service: RemoteNamespace };

/** Everything that can block editing, flattened for one decision. */
export interface AvailabilityInput {
  readonly state: ServiceState;
  /** The last `describe()` payload, or `undefined` while none has arrived. */
  readonly view: SettingsView | undefined;
  /** Set when the `describe()` call itself failed or the service could not be resolved. */
  readonly loadError: string | undefined;
  /** The active language, for the two lines this function composes itself. */
  readonly copy: CopyContext;
}

/**
 * The line explaining why the page cannot be edited, or `undefined` when it can.
 *
 * The order matters. A missing service is reported before anything else because no later branch can
 * be trusted without it; the file's own parse error is reported last because it is the only one the
 * user can fix by editing the file. Save is disabled exactly when this returns a string.
 *
 * The two strings that arrive already formatted (an unavailable reason, a failed read) are passed
 * through: each was rendered in the active language at the point it was produced, and both are
 * re-produced on a locale switch because the store they live in is re-read on every render.
 */
export function describeAvailability(input: AvailabilityInput): string | undefined {
  if (input.state.kind === "unavailable") {
    return input.copy.t(input.state.reasonKey, input.state.reasonParams);
  }
  if (input.state.kind === "loading") return input.copy.t("loading.text");
  if (input.loadError !== undefined) return input.loadError;
  if (input.view === undefined) return input.copy.t("loading.text");
  if (input.view.error !== undefined) {
    return input.copy.t("errors.unparsableFile", { message: input.view.error });
  }
  return undefined;
}

/** Render whatever the gateway put in the failure branch. `RemoteError` carries `code` + `message`. */
export function remoteErrorText(error: unknown): string {
  let message: string | undefined;
  let code: string | undefined;

  if (error instanceof Error) message = error.message;
  if (isRecord(error)) {
    if (message === undefined && typeof error.message === "string") message = error.message;
    if (typeof error.code === "string") code = error.code;
  }
  if (message === undefined) message = typeof error === "string" ? error : String(error);
  return code === undefined ? message : `${message}（${code}）`;
}

/**
 * The line reporting what a successful save actually did.
 *
 * The counts come from the host's own answer and from the patch that was sent — never from an
 * assumption about what "should" have happened. A host that reports `changed: false` is believed:
 * saying "saved 3 fields" when the file did not move is exactly the lie this page exists to avoid.
 */
export function summarizeApply(
  patch: Readonly<Record<string, JsonValue>>,
  result: ApplyResult,
  t: Translate
): string {
  if (!result.changed) return t("notice.unchanged");

  const writes = Object.values(patch).filter((value) => value !== null).length;
  const removals = result.removed.length;
  const parts: string[] = [];
  if (writes > 0) parts.push(t("notice.writes", { count: writes }));
  if (removals > 0) parts.push(t("notice.removals", { count: removals }));
  if (parts.length === 0) parts.push(t("notice.touched", { path: result.path }));
  return t("notice.saved", { path: result.path, parts: parts.join("；") });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The banks help
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** One block of the bank-resolution help shown on the banks tab. */
export interface HelpSection {
  readonly titleKey: CopyKey;
  readonly lineKeys: readonly CopyKey[];
}

/**
 * How banking actually works, taken from the upstream README's *Bank resolution*,
 * *Per-repo opt-in/out* and *Per-directory overrides* sections.
 *
 * The structure lives here and the words live in the dictionaries, so the help is translated like
 * every other string. It is data rather than a paragraph so a test can hold BOTH shipped locales to
 * the documented placeholders and resolution order: a help text that drifts from the plugin's real
 * behaviour is worse than none, and nobody reads a paragraph twice to check it.
 */
export const BANKS_HELP: readonly HelpSection[] = Object.freeze([
  {
    titleKey: "help.a.title",
    lineKeys: ["help.a.line1", "help.a.line2", "help.a.line3", "help.a.line4"],
  },
  {
    titleKey: "help.b.title",
    lineKeys: ["help.b.line1", "help.b.line2", "help.b.line3", "help.b.line4", "help.b.line5"],
  },
  {
    titleKey: "help.c.title",
    lineKeys: ["help.c.line1", "help.c.line2", "help.c.line3", "help.c.line4"],
  },
  {
    titleKey: "help.d.title",
    lineKeys: ["help.d.line1", "help.d.line2"],
  },
  {
    titleKey: "help.e.title",
    lineKeys: ["help.e.line1", "help.e.line2", "help.e.line3", "help.e.line4"],
  },
  {
    titleKey: "help.f.title",
    lineKeys: ["help.f.line1", "help.f.line2", "help.f.line3"],
  },
  {
    titleKey: "help.g.title",
    lineKeys: ["help.g.line1", "help.g.line2", "help.g.line3"],
  },
]);
