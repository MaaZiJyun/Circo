# 前端可复用组件清单

本文档是当前代码的维护入口。组件按照依赖方向组织：

```text
page → view → section → widget → component → button/text
```

`page` 只负责路由/应用壳；`view` 负责组合页面状态；`section` 负责页面骨架；`widget` 负责可复用业务交互；`component` 只负责无业务含义的视觉控件；原生 HTML 交互元素只允许出现在 component 内，或在富文本/PDF/表格等明确的渲染适配器中。

## 1. 共享 component

统一入口：[component/index.ts](../src/shared/components/component/index.ts)。旧入口 `ui.tsx`、`controls.tsx` 暂时保留，避免一次性迁移造成行为风险。

| 组件 | 当前实现 | 复用职责 |
| --- | --- | --- |
| `Button` / `IconButton` | `controls.tsx` | 文本按钮、图标按钮、键盘 focus、禁用态 |
| `Input` / `Textarea` / `Select` | `controls.tsx` | 表单输入和统一主题样式 |
| `Switch` / `Checkbox` | `controls.tsx` | 布尔值交互 |
| `Field` / `Card` | `controls.tsx` | 表单字段和表面容器 |
| `Badge` / `Alert` | `ui.tsx` | 状态标签和提示 |
| `Dialog` | `ui.tsx` | 通用模态框外壳 |
| `EmptyState` / `LoadingState` | `ui.tsx` | 空态和加载态 |
| `ProgressBar` / `Tabs` | `ui.tsx` | 进度和紧凑导航 |
| `DescriptionList` | `ui.tsx` | 键值信息展示 |

## 2. 共享 section

统一入口：[section/index.ts](../src/shared/components/section/index.ts)。

| Section | 用途 |
| --- | --- |
| `PageHeader` | 页面 eyebrow、标题、副标题和顶层 actions |
| `SectionHeader` | 卡片/工作区标题和局部 controls |
| `StatCard` | 统计卡片（当前保留变体差异，未强制替换所有统计磁贴） |
| `SelectionToolbar` | 多选状态下的操作区 |
| `TableLibraryWorkspace` | 侧栏 + 表格库内容的共同工作区骨架 |

## 3. 共享 widget

统一入口：[widget/index.ts](../src/shared/components/widget/index.ts)。

| Widget | 用途 |
| --- | --- |
| `DataTable<T>` | 选择、点击、右键、拖拽和空态统一的实体表格 |
| `ListSidebar<T>` | 列表侧栏、当前项、计数、拖拽和长按菜单 |
| `ListFormDialog` / `ChooseListDialog` | 列表创建、编辑和选择 |
| `ContextMenu` | 视口边缘碰撞处理的右键菜单 |
| `ColorPalette` | 统一颜色选择 |
| `LibrarySortControls` | 排序字段和方向 |
| `TaskRow` / `TaskHierarchyList` | 任务行和父子任务树 |
| `ProfileAvatar` / `SidebarProfile` | 个人头像和导航个人区 |
| `AppSearchResults` | 顶栏搜索结果 |
| `useLongPress` | 长按选择手势 |

另外，`background-music-*`、`*-settings`、`Task*Fields`、`TaskDeadlineReminder`、`DailySummaryScheduler` 是带明确应用职责的共享 widget；它们不应下沉到 component。

## 4. 业务模块的复用边界

| 模块 | view | 可复用 section/widget |
| --- | --- | --- |
| `dashboard` | `DashboardView` | `PeriodCountdown`、`ContributionCalendar`、规划/专注/复盘区块 |
| `me` | `MeView` | 每日任务、历史、数据库信息区块 |
| `find` | `FindView`、阅读器 | 文献库、参考点、阅读器、Markdown 编辑器区块 |
| `mind` | `MindView` | 灵感列表、网格、编辑/评估区块 |
| `hand` | `HandView`、项目工作区、Stuff | 项目库、任务库、甘特、日志、附件区块 |
| `land` | `LandView` | 成果工作区和成果编辑区块 |
| `messages` | `MessagesView` | 消息侧栏、列表、阅读器、庆祝区块 |

这些文件当前位于各模块的 `views/` 中，下一阶段按职责迁移到模块私有的 `sections/` 和 `widgets/`；旧路径会保留兼容导出，迁移期间不改变行为。

## 5. 已确认的复用缺口

- `find` 的 library sidebar 仍自定义实现了 `ListSidebar` 的部分能力；需要先补齐未读态、marked 列表和拖拽命中检测。
- `hand` 的附件表格仍是独立 `<table>`，因为它同时承载预览、移动和批量操作；应先把附件动作拆成 widget，再迁移到 `DataTable`。
- 甘特图同时包含时间轴模型、SVG 绘制和交互状态；已列为独立 section/widget 拆分项，不能继续作为一个超长 view 文件维护。
- Markdown、PDF、SVG 等渲染适配器可以保留必要的原生元素；这类元素不应被机械替换为业务按钮。

## 6. 维护规则

1. 新增跨模块复用能力先进入 `shared`，模块私有能力留在模块内。
2. ViewModel 不得包含 JSX、Tailwind class 或数据库查询。
3. 业务 view 不直接创建原生 `button/input/select/textarea`；优先使用 component/widget。
4. 每个源文件不超过 300 行，接近 240 行时主动拆分。
5. 迁移必须保留旧导出，待所有调用方切换后再删除旧入口。

