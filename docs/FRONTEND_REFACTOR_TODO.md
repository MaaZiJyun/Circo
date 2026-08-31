# 前端重构待办清单

> 原则：所有前端一律 `page → view → section → widget → component → button/text`；禁止在业务层重复实现 component/widget 已提供的能力；**所有改动行为保持、不破坏现有功能**，每项完成后跑 `tsc --noEmit` + `eslint` + 手动验证。

状态标记：`[ ]` 待办 / `[x]` 已完成 / `[~]` 评估后跳过（视觉/行为差异大，不宜强行替换）。

## 高优先级（低风险，先做）

- [x] 删除死代码 `FindModeSwitch`（`find/views/find-mode-switch.tsx`，保留 `FindMode` 类型）
- [x] 合并重复 `taskInput()`（移到 `hand/view-models/use-project-task-actions.ts`，`project-task-actions` / `planning-task-actions` / `stuff-view` 共用）
- [~] 接入零使用组件 `StatCard` —— 评估跳过：`StatCard` 是带边框的 `Card`（uppercase label + text-2xl），而 `database-info-panel` 的集合统计卡是 `bg-zinc-50` 无边框磁贴（text-xs + text-xl），强行替换会改变视觉。需先扩展 `StatCard` 变体或接受视觉变更。
- [x] 接入零使用组件 `DescriptionList` —— 已扩展 `variant`(row/stacked) / `divided` / `tabular` / `columns` 变体，并迁移 3 处：`database-info-panel`（row+divided+tabular）、`markdown-entity-card`（stacked）、`point-preview-dialog`（stacked+columns=2）。
- [x] 原生 `<select>` 改 `Select`（`hand/views/project-attachment-table.tsx` 移动附件对话框）

## 中优先级（等价替换，需视觉核对）

- [x] 原生图标按钮改 `IconButton` —— 扩展 `size`(xs/sm/md) + `tone`(neutral/danger)，迁移 `project-gantt` 前后翻页（sm）、`countdown-task-slots` eject（xs）、`idea-reader` 删除（sm+danger+`opacity-0 group-hover` 渐显）。
- [x] `Badge` 手写药丸改 `Badge` —— 扩展 `color` + `variant`(outline/solid)，迁移彩色药丸（`reference-workspace` / `point-preview-dialog`）与 `literature-table` tags（solid 无边款）。
- [x] `me/views/me-view.tsx` 补 `PageHeader`（`me.eyebrow/title/subtitle` 键已存在，仅未使用）

## 低优先级（需扩展共享 widget 或视觉评估）

- [~] 手写 overlay 改 `Dialog` —— 已给 `Dialog` 增加 `size`(md/lg/xl) 变体；三处 overlay 仍因自定义 header/footer + `overflow-hidden` 内部滚动区未迁移（待后续处理）。
- [~] 分段切换改 `Tabs` —— 评估跳过：`ReaderSwitch`/`PointTypeControl`/甘特 scale 是紧凑分段控件，`Tabs` 是带滑动指示器的胶囊 tab，视觉差异大。需先给 `Tabs` 增加紧凑变体。
- [ ] `find/views/library-sidebar.tsx` 迁 `ListSidebar`（需先扩展：elementFromPoint 拖拽 + marked + 未读态）
- [ ] `hand/views/project-attachment-table.tsx` 迁 `DataTable`（需先扩展：附件预览/移动对话框）
- [ ] `mind/views/mind-view.tsx` 迁 `TableLibraryWorkspace`
- [ ] 原生 radio（`dashboard/views/focus-timer-dialog.tsx`、`mind/views/idea-evaluation-dialog.tsx` —— 无共享 radio，需新建或保留）

## 记录

- 详见 `docs/FRONTEND_ARCHITECTURE.md`（分层、组件清单、API、Table、主题）。
