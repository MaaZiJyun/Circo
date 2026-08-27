# Circo 数据库现状

> 更新时间：2026-08-25（Asia/Shanghai）  
> 本文记录当前代码和本地数据库的实际实现。数据库结构或 `AppState` 变化时，应同步更新本文。

## 1. 总览

Circo 使用本地 SQLite 数据库，通过 `better-sqlite3` 在 Next.js Node.js Route Handler 中读写。当前数据库不是传统的多表关系模型，而是“单行快照”模型：完整 `AppState` 被序列化为 JSON，存入 `app_snapshots.payload`。

| 项目                    | 当前值                    |
| ----------------------- | ------------------------- |
| 数据库引擎              | SQLite / `better-sqlite3` |
| 默认数据库              | `data/circo.db`           |
| Journal mode            | WAL                       |
| App schema version      | 1                         |
| Backup manifest version | 2                         |
| 物理业务表              | `app_snapshots`           |
| 当前快照行数            | 1                         |
| 软删除字段              | `deletedAt`               |
| 主要状态入口            | `/api/state`              |
| 数据库信息入口          | `/api/db-info`            |
| 完整备份入口            | `/api/backup`             |

## 2. 物理 SQLite 结构

数据库启动时自动执行：

```sql
CREATE TABLE IF NOT EXISTS app_snapshots (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  schema_version INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

字段含义：

| 字段             | 含义                                     |
| ---------------- | ---------------------------------------- |
| `id`             | 固定为 `1`，保证数据库只有一个当前快照   |
| `schema_version` | `AppState.schemaVersion`，当前必须为 `1` |
| `revision`       | 每次成功保存自动加一                     |
| `payload`        | 完整 `AppState` JSON                     |
| `updated_at`     | 本次快照保存时间，ISO 8601 字符串        |

保存使用 SQLite transaction 和 `INSERT ... ON CONFLICT DO UPDATE`。数据库没有业务级 SQL 外键、业务索引或独立实体表；项目、任务、文献等关系由 JSON 中的 ID 字段维护。

## 3. AppState 逻辑集合

所有集合都位于 `payload` 中。大部分实体继承 `BaseEntity`：`id`、`createdAt`、`updatedAt`、可选 `deletedAt`。

| 集合                     | 数据类型           | 主要关系和用途                                           |
| ------------------------ | ------------------ | -------------------------------------------------------- |
| `profile`                | `UserProfile`      | 用户资料、背景音频、倒计时槽位、矩阵公式、任务预处理规则 |
| `cycles`                 | `Cycle[]`          | 成长周期                                                 |
| `goals`                  | `Goal[]`           | 通过 `cycleId` 关联周期                                  |
| `sessions`               | `WorkSession[]`    | 可关联 `cycleId`、`goalId`、`projectId`、`taskId`        |
| `events`                 | `EventReason[]`    | 复盘事件，可关联周期和项目                               |
| `sources`                | `SourceRecord[]`   | 文献、文件/Markdown 路径、阅读状态、评价和转换状态       |
| `libraryLists`           | `LibraryList[]`    | 文献列表，`sources.listIds` 引用                         |
| `projectLists`           | `ProjectList[]`    | 项目列表，`projects.listIds` 引用                        |
| `taskLists`              | `TaskList[]`       | 任务列表，`tasks.listIds` 引用                           |
| `ideaLists`              | `IdeaList[]`       | 想法列表，`ideas.listIds` 引用                           |
| `pointLists`             | `PointList[]`      | Reference Point 列表                                     |
| `points`                 | `ReferencePoint[]` | 通过 `sourceId` 关联文献，支持文本或图片坐标             |
| `annotations`            | `Annotation[]`     | 文献批注，通过 `sourceId` 关联文献                       |
| `ideas`                  | `Idea[]`           | 想法、评估、来源引用、聊天记录和列表                     |
| `projects`               | `ProjectRecord[]`  | 项目基础信息、状态、日期、目标、想法和列表               |
| `tasks`                  | `TaskRecord[]`     | 项目任务、层级、依赖、排期、进度、评分和周期规则         |
| `taskHistory`            | `TaskHistoryRecord[]` | 已完成任务快照，完成后从 `tasks` 移入                    |
| `logs`                   | `ProjectLog[]`     | 项目日志元数据；正文同时写入 Markdown 文件               |
| `attachments`            | `Attachment[]`     | 项目附件元数据；二进制文件位于文件系统                   |
| `artifacts`              | `Artifact[]`       | 输出物及其项目、文献、想法关系                           |
| `relations`              | `Relation[]`       | 跨实体通用关系：source/derived/supports/produces         |
| `aiJobs`                 | `AIJob[]`          | 本地演示型 AI 任务历史；与 Gantt 任务预处理无关          |
| `messages`               | `FutureMessage[]`  | 未来消息、附件引用、每日计划和每日复盘                   |

### TaskRecord 关键字段

任务除基础字段外，包含：

- 归属与层级：`projectId`、`listIds`、`parentId`。
- 排期：`startDate`、`dueDate`、`estimatedMinutes`、`actualMinutes`。
- 状态：`todo | doing | done | overdue`、`completedAt`。
- Gantt：`dependencyIds`、`milestone`。
- 内容：`title`、`description`、`expectedOutput`。
- 优先级：`priority`、`importance`。
- Importance：`impact`、`goal`、`risk`、`value`。
- Urgency：`delayLoss`、`dependencyIds`。
- Effort：`complexity`、`uncertainty`。
- 周期任务：`recurrence`、`recurrenceSourceId`。

当前关系约定：

- `parentId` 指向同一项目中的父任务。
- `dependencyIds` 保存当前任务的前置任务 ID，即 Finish-to-Start 的 source task。
- 应用层负责防止自身依赖、循环依赖、跨项目依赖及将自己的子任务设为前置任务。
- Done 任务在 Gantt 中按 100% 进度显示。

## 4. 当前本地数据库快照

以下数据采集于 2026-08-25 14:30–14:36（Asia/Shanghai），用于记录当时状态，并非固定配置。

| 指标                     |                         值 |
| ------------------------ | -------------------------: |
| 数据库文件               |            `data/circo.db` |
| 文件大小                 |                 约 1.5 MiB |
| JSON payload             |              683,411 bytes |
| Revision                 |                      2,156 |
| 更新时间                 | `2026-08-25T06:30:11.217Z` |
| SQLite page size         |                4,096 bytes |
| Page count               |                        395 |
| Freelist pages           |                        222 |
| WAL 文件                 |          0 bytes（采集时） |
| SHM 文件                 |           32 KiB（采集时） |
| `PRAGMA integrity_check` |                       `ok` |

集合数量包含回收站中的软删除记录；每日任务清单不属于数据库，而是浏览器 localStorage 中按日期保存的 task ID：

| 集合         | 数量 | 集合         | 数量 |
| ------------ | ---: | ------------ | ---: |
| cycles       |    1 | goals        |    2 |
| sessions     |   21 | events       |    1 |
| sources      |    6 | libraryLists |    8 |
| projectLists |    3 | taskLists    |    3 |
| ideaLists    |    2 | pointLists   |    3 |
| points       |   14 | annotations  |    0 |
| ideas        |    3 | projects     |    7 |
| tasks        |   49 | taskHistory  |   63 |
| logs         |   16 | attachments  |    6 |
| artifacts    |    1 | relations    |    3 |
| aiJobs       |   11 | messages     |   30 |

补充状态：当前 active tasks 为 37、回收站 tasks 为 12、active projects 为 4、active sources 为 6。

## 5. 读写流程

### 5.1 SQLite 关系型核心表

当前 SQLite 使用关系型核心表承载可查询数据，同时保留 `app_snapshots` 作为完整状态兼容和备份快照：

| 表 | 主要用途 |
| --- | --- |
| `projects` | 项目核心字段和完整 JSON payload |
| `tasks` | 未完成任务、排期、状态和实际时间 |
| `task_history` | 已完成任务历史快照 |
| `sessions` | 专注工作会话和实际投入时间 |

每张核心表都保留 `payload` 字段，用于保存暂时未拆成独立列的扩展字段。应用保存时会在同一事务内更新快照和关系型表；旧快照首次读取时会自动回填关系型表。

```text
React StoreContext
  → HttpAppRepository
    → /api/state
      → SqliteAppRepository
        → app_snapshots(id = 1)
```

1. 客户端启动时通过 `GET /api/state` 加载完整状态。
2. `StoreContext.mutate` 先乐观更新内存状态，再进入串行 save queue。
3. `PUT /api/state` 校验 `AppState` 后保存完整快照。
4. SQLite transaction 内重新读取当前 revision，保存时 revision 加一。
5. 服务端保存完成后，将服务端返回的 revision 和 updatedAt 同步回客户端。
6. 首次启动且没有快照时，写入 `createSeedState()`。

任务截止状态会在客户端加载和最近截止时间到达时自动同步；非 Done 且超过截止时间的任务可变为 Overdue。

## 6. 兼容与规范化

当前没有独立 SQL migration 文件。旧数据兼容主要由 `normalizeState()` 在读取时完成，包括：

- 补齐系统 Library/Project/Task/Idea/Point lists。
- 补齐 profile、背景音频、矩阵公式等可选字段。
- 补齐文献路径、列表、标签、阅读评价和转换字段。
- 补齐项目列表、标签和 score。
- 规范化 Task/TaskHistory 的 Importance、Urgency、Effort 和旧字段。
- 将旧 `dailyTasks` 中的任务迁移为正式任务或历史快照，并将每日清单迁移到浏览器 localStorage。
- 去除旧 routine task 表达并迁移到当前任务结构。
- 对项目日志去重并补齐 Markdown 路径。
- 补齐附件、Artifact、Idea 和 Reference Point 的新增字段。

`schemaVersion` 当前严格要求为 `1`。未来发生不兼容结构变化时，应：

1. 提升 `AppState.schemaVersion`。
2. 增加明确、可测试的逐版本迁移函数。
3. 同步更新 `isAppState`、seed、备份恢复和本文档。

## 7. 文件系统数据

SQLite 主要保存元数据和路径；较大的二进制或 Markdown 内容位于 `storageDirectory`。默认目录为 `data/`。

| 目录                | 内容               | 完整备份是否包含 |
| ------------------- | ------------------ | ---------------- |
| `files/`            | 通用文件           | 是               |
| `attachments/`      | 项目附件           | 是               |
| `library/`          | 文献文件及转换结果 | 是               |
| `notes/`            | 笔记及图片         | 是               |
| `project/`          | 项目日志及关联图片 | 是               |
| `reference/`        | Reference 文件     | 是               |
| `background-audio/` | 背景音频           | 是               |
| `models/`           | 本地模型资产       | 否               |

默认配置保存在 `data/storage-config.json`；文件不存在时使用：

- Database：`data/circo.db`
- Storage：`data/`
- Background music：`data/background-audio/`

设置新路径只改变后续读取位置，不会自动移动原数据库或文件。路径必须为绝对路径，并在保存配置时验证可写性。

## 8. 备份与恢复

完整备份是 ZIP，manifest version 为 2：

```text
Circo-backup-YYYY-MM-DD.zip
├── manifest.json
├── circo.json
├── files/
├── attachments/
├── library/
├── notes/
├── project/
├── reference/
└── background-audio/
```

- `circo.json` 是 AppState，不是 SQLite 数据库文件的直接副本。
- `manifest.json` 记录 version、状态文件名、目录列表和创建时间。
- 恢复文件最大 1 GiB。
- 恢复前检查 AppState 兼容性、manifest version 和 ZIP 路径安全性。
- 附件绝对路径会重新映射到当前 `storageDirectory`。
- 恢复会替换当前数据库状态，并替换备份声明的文件目录。
- `storage-config.json`、SQLite 文件本身、外部模块目录和模型不包含在完整备份中。

## 9. 删除与回收站

- 普通删除是软删除：写入 `deletedAt` 和新的 `updatedAt`。
- `activeItems()` 只返回没有 `deletedAt` 的实体。
- 恢复会清除 `deletedAt`。
- 回收站永久删除会从对应 AppState 集合中移除实体，并在下一次保存时写入新快照。
- 当前没有数据库级 cascade；删除项目不会依赖 SQL 外键自动删除任务或文件，相关清理由业务层负责。

## 10. 当前限制与维护建议

1. 单行 JSON 快照实现简单、备份完整，但任意小修改都会重写完整 payload。
2. SQLite 内部无法直接利用业务字段索引、外键或增量查询；集合统计依赖加载 JSON 或 SQLite JSON 函数。
3. 当前客户端有串行保存队列，但没有跨窗口、跨进程的业务级 optimistic-lock 冲突提示。
4. `revision` 能记录保存次数，但当前 API 不要求客户端提交 expected revision。
5. 物理数据库的空闲页较多；如需要压缩，应先完整备份，再在应用停止写入时评估 `VACUUM`，不能在正常交互中自动执行。
6. `isAppState()` 对顶层结构进行了兼容性校验，但并非对每个集合中的每个实体做完整运行时 schema 校验。
7. 数据关系依靠 ID 约定，应继续在业务入口统一执行跨项目、层级、依赖环和孤儿引用检查。
8. 当数据规模明显增长或需要复杂检索、并发写入时，应评估从单快照逐步迁移到规范化实体表。

## 11. 相关代码

- `src/shared/infrastructure/sqlite-repository.ts`：SQLite 建表、读写、规范化。
- `src/shared/model/app-state.ts`：AppState、集合和兼容性校验。
- `src/shared/model/entities.ts`：主要实体结构。
- `src/shared/infrastructure/seed.ts`：首次启动数据。
- `src/shared/infrastructure/storage-config.ts`：数据库和文件目录配置。
- `src/shared/view-models/store-context.tsx`：客户端状态、保存队列、软删除和恢复。
- `src/app/api/state/route.ts`：状态读写 API。
- `src/app/api/backup/route.ts`：完整 ZIP 备份和恢复。
- `src/app/api/db-info/route.ts`：数据库状态面板数据。
