# 前端架构文档

> 范围：分层与组件清单、API 分组、所有 Table 及其数据结构。
> 分层约定：`page(页面) → view(子页面) → section(区块) → widget(组件) → component(控件) → button/text(原子)`。

> 维护入口：组件的当前完整盘点、复用边界和迁移记录见
> [FRONTEND_COMPONENT_CATALOG.md](./FRONTEND_COMPONENT_CATALOG.md)。本文保留稳定的架构基线和实体/Table 说明；新增组件应先登记到维护入口。

---

## 一、分层架构

| 层 | 职责 | 位置 | 典型例子 |
|---|---|---|---|
| **page (页面)** | 顶级页面（AppSection），由 `app-shell` 路由到主区 | `src/modules/{dashboard,me,find,mind,hand,land,messages}` | `find/` `hand/` `mind/` |
| **view (子页面)** | 同一页面下的子页面/模式，由 `Tabs` 或局部状态切换 | `src/modules/*/views/*-view.tsx`、`stuff-view.tsx`、`reference-workspace.tsx` | `StuffView`(hand) `LibraryView`/`ReferenceView`(find) |
| **section (区块)** | 页面骨架 / 区块容器（页头、卡片、工作区、工具栏） | `src/shared/components/page-elements.tsx`、`table-library-workspace.tsx`、`selection-toolbar.tsx` | `PageHeader` `SectionHeader` `StatCard` `TableLibraryWorkspace` `SelectionToolbar` |
| **widget (组件)** | 可复用业务/交互组件（组合多个 component） | `src/shared/components/*` | `DataTable` `ListSidebar` `ListFormDialog` `ChooseListDialog` `ContextMenu` `TaskRow` |
| **component (控件)** | 无业务含义的基础 UI 控件 | `src/shared/components/ui.tsx`、`controls.tsx` | `Button` `Input` `Select` `Badge` `Dialog` `Tabs` |
| **button/text (原子)** | 原生 HTML 元素（只出现在 component 内部，业务层不直接书写） | —— | `<button>` `<input>` `<select>` `<textarea>` 文本 |

应用外壳（唯一 shell）：`src/shared/components/app-shell.tsx` —— 侧边栏导航 + 顶栏搜索 + 主区路由，把 8 个页面分发到 `<main>`。

---

## 二、组件清单（`src/shared/components/`）

### 2.1 section（区块）

| 组件 | 文件 | 说明 |
|---|---|---|
| `PageHeader` | `page-elements.tsx` | 页头（eyebrow + title + subtitle + actions） |
| `SectionHeader` | `page-elements.tsx` | 区块标题（title + controls + action） |
| `StatCard` | `page-elements.tsx` | 统计卡（⚠️ 目前零使用，待接入） |
| `TableLibraryWorkspace` | `table-library-workspace.tsx` | 表格工作区（SectionHeader + 选择工具栏 + 内容槽） |
| `SelectionToolbar` | `selection-toolbar.tsx` | 多选工具栏（计数 + 操作 + 取消） |
| `LibrarySortControls` | `library-sort-controls.tsx` | 排序下拉 + 升降序切换 |

### 2.2 widget（复合组件）

| 组件 | 文件 | 说明 |
|---|---|---|
| `ContextMenu` / `ContextMenuItem` | `context-menu.tsx` | 右键菜单（含视口边缘碰撞检测） |
| `DataTable<T>` | `data-table.tsx` | 通用表格：选择列 + 全选 + 长按/点击/右键/拖拽手势 + sticky 表头 + 空态 |
| `ListSidebar<T>` | `list-sidebar.tsx` | 通用列表侧栏：active/图标/标签/计数 + 长按菜单 + 右键 + 拖拽入列表 |
| `ListFormDialog` | `list-dialogs.tsx` | 列表新建/编辑表单（name/note/color + 可选 tags） |
| `ChooseListDialog` | `list-dialogs.tsx` | 选择列表对话框（色点 + 名称行） |
| `ColorPalette` | `color-palette.tsx` | 取色器 |
| `useLongPress<T>` | `use-long-press.ts` | 长按手势 hook（触发 + 吞噬合成点击） |
| `TaskRow` / `TaskHierarchyList` | `task-row.tsx` / `task-hierarchy-list.tsx` | 任务行 / 任务层级列表（拖拽设父任务） |
| `TaskImportanceFields` / `TaskUrgencyFields` / `TaskEffortFields` / `TaskRecurrenceFields` | `task-*-fields.tsx` | 任务四维表单字段组 |
| `ProfileAvatar` / `SidebarProfile` | `profile-avatar.tsx` / `sidebar-profile.tsx` | 头像 / 侧栏个人卡片 |
| `BackgroundMusicPlayer` / `BackgroundMusicSettings` | `background-music-*.tsx` | 背景音乐播放器 / 设置 |
| `StorageSettings` / `SettingsView` / `ProfileSettings` | `*-settings.tsx` | 设置页各区块 |
| `AppSearchResults` / `TaskDeadlineReminder` / `DailySummaryScheduler` | —— | 搜索、提醒、调度 |

### 2.3 component（基础控件）

| 组件 | 文件 | 说明 |
|---|---|---|
| `Button` | `controls.tsx` | 4 变体 primary / secondary / ghost / danger |
| `IconButton` | `controls.tsx` | 方形图标按钮（带 `aria-label`/`title`） |
| `Switch` | `controls.tsx` | 开关 |
| `Checkbox` | `controls.tsx` | 圆形勾选框 |
| `Input` / `Textarea` / `Select` | `controls.tsx` | 表单输入（`Select` 自带下拉箭头） |
| `Field` | `controls.tsx` | 带 label + hint 的表单字段容器 |
| `Card` | `controls.tsx` | 卡片容器 |
| `Badge` | `ui.tsx` | 5 色调徽章（neutral/info/success/warning/danger） |
| `Alert` | `ui.tsx` | 4 色调提示条 |
| `Dialog` | `ui.tsx` | 模态框（标题 + 关闭按钮） |
| `EmptyState` / `LoadingState` | `ui.tsx` | 空态 / 加载态 |
| `ProgressBar` | `ui.tsx` | 进度条 |
| `Tabs` | `ui.tsx` | 分段胶囊式 tab（滑动指示器） |
| `DescriptionList` | `ui.tsx` | dl/dt/dd 键值对（⚠️ 目前零使用，待接入） |

### 2.4 button/text（原子）

原生 HTML 元素（`<button>` `<input>` `<select>` `<textarea>` `<span>` 文本等），**只应出现在 component 内部**；业务代码（view/section/widget）不直接书写。

| 辅助 | 说明 |
|---|---|
| `focusRing` | 统一的 focus 环形样式常量（`controls.tsx`） |

---

## 三、页面（page）与视图（view）清单

| page | views（子页面） | 结构 |
|---|---|---|
| dashboard | （单一视图） | `PageHeader` + 统计卡 + 组件网格（`PeriodCountdown` `DailyTaskList` `ContributionCalendar`） |
| me | （单一视图） | `DailyTaskHistory` + `DatabaseInfoPanel` |
| find | library view / reference view | `Tabs` 切换，各自 `ListSidebar` + `DataTable` / `ReferenceWorkspace` |
| mind | （单一视图） | 灵感列表/网格 + 表单 |
| hand | project view / stuff view | 顶层 `Tabs` 切换；project view 内再分 overview/plan/logs/attachments 区块 |
| land | （单一视图） | `PageHeader` + 成果工作区 |
| messages | （单一视图） | 侧栏 + 消息列表 + 阅读器 |
| settings | （单一视图） | 设置项集合 |

---

## 四、API 分组（`src/app/api/`）

所有路由均为 Node 运行时（`runtime = "nodejs"`、`dynamic = "force-dynamic"`）。

### 4.1 状态持久化

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/state` | GET / PUT / POST | 读取 / 保存 / 恢复应用快照 |
| `/api/backup` | GET / POST | 导出完整 ZIP 备份 / 从 ZIP 恢复 |
| `/api/storage-config` | GET / PUT | 读取 / 更新数据库与存储目录 |
| `/api/db-info` | GET | 数据库信息 |
| `/api/path-picker` | POST | 调用原生 Finder 路径选择器 |

`/api/backup` 导出的 ZIP 包含 `circo.json` 应用快照、`manifest.json` 版本清单，以及应用管理的 `files`、`attachments`、`library`、`notes`、`project`、`reference` 和 `background-audio` 文件目录。恢复时会校验目录路径，清理并替换备份中声明的文件目录；附件路径会重新映射到当前存储目录。

### 4.2 文件与附件

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/attachments` | GET / POST / PUT | 解析/上传附件 / 打开或定位文件 |
| `/api/attachments/[id]` | GET | 提供附件内容 |
| `/api/files/[id]` | GET | 提供文献原文件 |
| `/api/library-files` | PUT / DELETE | 写入 / 删除文献文件 |
| `/api/reference-files` | POST | 上传参考文件 |
| `/api/reference-files/[id]` | GET | 提供参考文件 |
| `/api/notes/[noteId]` | GET / PUT | 读取 / 更新笔记 |
| `/api/notes/[noteId]/[image]` | POST / GET | 笔记图片上传 / 读取 |
| `/api/project-logs` | POST / PUT / DELETE | 项目日志 创建 / 更新 / 删除 |
| `/api/project-logs/[projectId]/[logId]/[image]` | POST / GET | 日志图片上传 / 读取 |
| `/api/markdown-assets/[directory]/[image]` | GET | 提供 Markdown 内嵌资源 |

### 4.3 本地 AI / 处理

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/convert` | POST | PDF → Markdown 转换 |
| `/api/translate` | POST | 本地中英互译（OPUS-MT） |

### 4.4 背景音乐

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/background-audio` | POST | 上传音频 |
| `/api/background-audio/[id]` | GET / DELETE | 流式播放 / 删除音频 |
| `/api/background-audio/config` | GET / PUT | 读取 / 更新背景音乐配置 |

---

## 五、Table 及其数据结构

### 5.1 通用 `DataTable<T>` 结构

`src/shared/components/data-table.tsx`。列以 `DataTableColumn<T> = { header, className?, render(item) }` 配置，行约束 `T extends { id: string }`。

内置能力：选择列 + 全选（`selectedIds` / `onSelectAll` / `onToggleSelect`）、长按进入选择（`onEnterSelection`）、单击（`onClick`）、右键菜单（`onOpenMenu`）、拖拽（`onDragStart` / `onDragEnd`）、sticky 表头、空态、`minWidth`。

### 5.2 各 Table 与实体映射

| 组件 | 文件 | 实体 | 列（header → 字段） |
|---|---|---|---|
| `LiteratureTable` | `find/views/literature-table.tsx` | `SourceRecord` | 标题→`title`；作者→`authors`；添加时间→`createdAt`；来源→`origin`；发表日期→`publicationDate`；标签→`tags[]`；收藏→`favorite`；评分→`rating` |
| `ProjectTable` | `hand/views/project-table.tsx` | `ProjectRecord` | 标题→`name`；简介→`purpose`；状态→`status`；score→`score`；开始→`startDate`；结束→`endDate`；标签→`tags[]`；关联灵感→`ideaIds[]` |
| `TaskLibraryTable` | `hand/views/task-library-table.tsx` | `TaskRecord` | 标题→`title`；分类→`projectId`(项目名) / `listIds[]`(列表名)；状态→`status`；截止→`dueDate`；重要度→`importance`；估时→`estimatedMinutes` |
| `ProjectAttachmentTable` | `hand/views/project-attachment-table.tsx` | `Attachment` | 图标(文件类型)；标题→`name`+`filePath`；类型→`mimeType`/扩展名；大小→`size`；日期→`createdAt`；说明→`description` |

> 注：`ProjectAttachmentTable` 仍是独立 `<table>` 实现（含内嵌的附件预览/移动对话框），尚未迁移到 `DataTable`，列为后续统一项。

### 5.3 实体数据结构

`BaseEntity = { id, createdAt, updatedAt, deletedAt? }`

**SourceRecord**（文献）
```ts
title, authors, year, origin, citation, category, fileName,
fileToken, filePath, markdownToken, markdownPath,
fileType: "pdf"|"markdown"|"manual", content, summary, guide,
tags: string[], listIds: string[], favorite: boolean, rating: number,
publicationDate, readingStatus: "unread"|"reading"|"read",
readingStartedAt?, readingCompletedAt?, studyDurationMinutes,
readingReview: LiteratureReview, conversionStatus: "ready"|"processing"|"failed",
conversionMessage
```

**ProjectRecord**（项目）
```ts
name, purpose, expected, startDate, endDate,
status: "concept"|"planning"|"active"|"paused"|"completed"|"archived",
goalId?, ideaIds: string[], listIds: string[], tags: string[], score: number
```

**TaskRecord**（任务）
```ts
projectId?, listIds?, parentId?, title, description, startDate, dueDate,
priority: "low"|"medium"|"high", status: "todo"|"doing"|"done"|"overdue",
estimatedMinutes, actualMinutes, milestone, expectedOutput, importance: number,
recurrence: TaskRecurrence|null, recurrenceSourceId?, completedAt?
// TaskImportanceDimensions: impact, goal, risk, value
// TaskUrgencyInputs:        delayLoss, dependencyIds
// TaskEffortInputs:         complexity, uncertainty
```

**Attachment**（附件）
```ts
projectId, logId?, name, filePath, fileToken?, mimeType,
size: number, description, status: "available"|"missing"
```

### 5.4 列表集合（供 `ListSidebar` / `DataTable` 分类）

| 集合 | 类型 | 系统列表 |
|---|---|---|
| `libraryLists` | `LibraryList` | `default`(全部) / `recent`(最近) / `marked`(已标记) |
| `projectLists` | `ProjectList` | `default`(全部项目) / `recent`(最近) |
| `taskLists` | `TaskList` | `default`(全部) / `formal`(有 projectId) / `casual`(无 projectId) |
| `ideaLists` | `IdeaList` | `default` / `recent` |
| `pointLists` | `PointList` | `default` / `recent` |

通用列表字段：`ListSidebarItem = { id, name, color, system: string|null }`，`LibraryList` 额外含 `tags`。

---

## 六、主题与颜色设计

### 6.1 主题机制

- 主题状态：`src/shared/theme/theme-context.tsx`，`ThemeProvider` + `useTheme()`。
- 三态偏好：`ThemePreference = "system" | "light" | "dark"`，默认 `system`。
- 持久化：`localStorage` 键 `circo-theme`；跨标签页/组件通过 `circo-theme-change` 事件同步（`useSyncExternalStore`）。
- 应用方式：给 `<html>` 加 `.dark` class（`dark` 或 `system` 且系统偏好深色时），并设置 `document.documentElement.style.colorScheme`。
- `system` 模式下监听 `prefers-color-scheme` 变化实时切换。
- Tailwind 深色变体：`globals.css` 的 `@custom-variant dark (&:where(.dark, .dark *));`，所有组件用 `dark:` 前缀反色。

### 6.2 颜色 token（`src/app/globals.css`）

| token | light | dark | 说明 |
|---|---|---|---|
| `--background` | `#ffffff` | `#09090b`(zinc-950) | 页面背景 |
| `--foreground` | `#18181b`(zinc-900) | `#fafafa`(zinc-50) | 主文字 |
| `--cursor-dot` / `--cursor-pointer` | 黑点/黑圈（白描边） | 白点/白圈（黑描边） | 自定义光标 SVG |

- `@theme inline` 把 `--background`/`--foreground` 映射为 `--color-background`/`--color-foreground`。
- 中性色统一使用 Tailwind **zinc** 阶梯（`zinc-50` → `zinc-950`），浅色用深字浅底、深色反转为浅字深底。
- 字体：`--font-sans`（系统无衬线）、`--font-mono`（SF Mono/Consolas）；品牌字标 `.brand-wordmark` 用圆体（`ui-rounded` / "SF Pro Rounded" / "Nunito"）。

### 6.3 语义色

**Badge / Alert 色调（`ui.tsx`）**

| tone | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `neutral` | zinc | zinc | 默认/待办 |
| `info` | blue | blue | 进行中/信息 |
| `success` | green | green | 完成/成功 |
| `warning` | yellow/amber | yellow/amber | 逾期/警告 |
| `danger` | red | red | 删除/错误 |

**Button 变体（`controls.tsx`）**

| variant | 说明 |
|---|---|
| `primary` | 实底：浅色 `bg-zinc-950 text-white`，深色 `bg-zinc-50 text-zinc-950` |
| `secondary` | 描边：`border-zinc-200/800` + 同底色 |
| `ghost` | 无底：`text-zinc-600` / 深色 `text-zinc-400` |
| `danger` | 描边红：`border-red-200 text-red-700` / 深色 `border-red-900 text-red-300` |

**状态徽章映射（表格/列表中的 `status`）**

| 状态 | Badge tone |
|---|---|
| `done` / `completed` / `active` | `success` |
| `doing` / `reading` / `planning` | `info` |
| `overdue` | `warning` |
| `todo` 及默认 | `neutral` |

**其它交互色**

- 选中/多选高亮：`bg-blue-50` / 深色 `bg-blue-950/30`。
- 焦点环：`focusRing` = `focus-visible:ring-zinc-950` / 深色 `ring-zinc-50`。
- 文本选择 `::selection`：浅色黑底白字、深色反白。
- 列表系统色（seed，`ColorPalette` 默认 `#2563eb`）：`#18181b`(全部) / `#2563eb`(recent/formal) / `#f59e0b`(casual/point) / `#ef4444`(marked)。

### 6.4 其它设计约定

- 自定义光标：`body` 用 `--cursor-dot`，可点击元素（button/a/select/label 等）用 `--cursor-pointer`，文本输入用 `cursor: text`（`.textfield-cursor`）。
- 无障碍：`prefers-reduced-motion: reduce` 时禁用彩带动画；`-webkit-tap-highlight-color: transparent`。
- 打印：`.artifact-print` 区域在 `@media print` 下独占可见，隐藏按钮/编辑区。

---

## 七、维护待办

重构与规范化待办清单见独立文档：[`docs/FRONTEND_REFACTOR_TODO.md`](./FRONTEND_REFACTOR_TODO.md)（按优先级排序、带状态勾选、逐条进度记录）。
