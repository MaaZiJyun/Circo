export const settingsMediaZh = {
  "settings.profile": "个人资料",
  "settings.username": "用户名",
  "settings.changeAvatar": "更换头像",
  "settings.removeAvatar": "移除头像",
  "settings.avatarHint":
    "右键头像可更换或移除。支持 PNG、JPEG、WebP 或 SVG，最大 2 MB。",
  "settings.avatarInvalid": "请选择不超过 2 MB 的 PNG、JPEG、WebP 或 SVG 图片。",
  "settings.nameRequired": "用户名不能为空。",
  "settings.backgroundMusic": "背景音乐",
  "settings.backgroundMusicPlayback": "开启背景音乐",
  "settings.backgroundMusicHint":
    "运行应用期间随机连续播放，曲目切换时渐出渐入。",
  "settings.backgroundMusicDirectory": "背景音乐存储目录",
  "settings.backgroundMusicDirectoryHint":
    "新上传的 MP3 将存入此目录。更改目录不会移动现有音乐文件。",
  "settings.uploadMusic": "上传 MP3",
  "settings.removeMusic": "删除",
  "settings.musicEmpty": "音乐库为空。可以上传多个 MP3 文件，每个最大 50 MB。",
  "settings.musicUploadFailed": "无法上传 MP3 文件。",
  "settings.musicRemoveFailed": "无法删除音乐。",
  "settings.matrixFormulas": "紧急–重要矩阵公式",
  "settings.tabGeneral": "常规",
  "settings.tabTasks": "任务",
  "settings.tabMedia": "媒体",
  "settings.tabData": "数据",
  "settings.tabTrash": "回收站",
  "settings.deleteForever": "永久删除",
  "settings.confirmDeleteForever": "确定要永久删除此记录吗？此操作无法恢复。",
  "settings.taskPreprocessing": "任务预处理规则",
  "settings.taskPreprocessingHint":
    "根据任务名称中的关键词自动填充描述、预计用时、预期产出和评分；填充后仍可继续修改。",
  "settings.taskPreprocessingName": "分类名称",
  "settings.taskPreprocessingKeywords": "匹配关键词",
  "settings.taskPreprocessingKeywordsHint": "用逗号分隔，例如：报告，汇报，report",
  "settings.taskPreprocessingDescription": "默认描述",
  "settings.taskPreprocessingOutput": "预期产出",
  "settings.taskPreprocessingDuration": "预计用时（分钟）",
  "settings.taskPreprocessingAdd": "添加分类",
  "settings.taskPreprocessingNewName": "新分类",
  "settings.taskPreprocessingDelete": "删除分类",
  "settings.taskPreprocessingGenericLocked": "“其他任务”作为未匹配时的默认分类，不能删除。",
  "settings.taskPreprocessingSave": "保存预处理规则",
  "settings.taskPreprocessingReset": "恢复默认规则",
  "settings.taskPreprocessingSaved": "任务预处理规则已保存。",
  "settings.taskPreprocessingScore": "默认评分",
  "settings.taskPreprocessingDelayLoss": "延期损失",
  "settings.matrixFormulaHint":
    "自定义任务气泡的坐标与直径。支持数字、变量、括号及 + - * / %；坐标会限制在 0–100，直径会限制在 32–200px。",
  "settings.matrixVariables": "可用变量",
  "settings.urgencyFormula": "Urgency 计算公式",
  "settings.importanceFormula": "Importance 计算公式",
  "settings.taskFormulaVariables": "任务公式变量",
  "settings.taskVariable.date": "任务所属日期，转换为毫秒时间戳。",
  "settings.taskVariable.completed": "任务是否完成：未完成为 0，已完成为 1。",
  "settings.taskVariable.dueAt": "任务截止时间，转换为毫秒时间戳。",
  "settings.taskVariable.completedAt":
    "任务完成时间，转换为毫秒时间戳；尚未完成时为 0。",
  "settings.taskVariable.estimatedMinutes":
    "数据库中的任务预期时间，单位为分钟。",
  "settings.taskVariable.actualMinutes":
    "数据库中的任务累计实际投入时间，单位为分钟。",
  "settings.taskVariable.impact": "数据库中的 Impact 评分，范围 1–5。",
  "settings.taskVariable.goal": "数据库中的 Goal 评分，范围 1–5。",
  "settings.taskVariable.risk": "数据库中的 Risk 评分，范围 1–5。",
  "settings.taskVariable.value": "数据库中的 Value 评分，范围 1–5。",
  "settings.taskVariable.importance":
    "数据库中保存的任务重要度，即四项评分之和，范围 4–20。",
  "settings.taskVariable.deadline":
    "由截止时间与当前时间实时计算的 Deadline 评分，范围 1–5。",
  "settings.taskVariable.delayLoss": "数据库中保存的延期损失评分，范围 1–5。",
  "settings.taskVariable.blocking": "依赖当前任务的其他任务数量，范围 0–5。",
  "settings.taskVariable.urgency":
    "deadline、delayLoss 与 blocking 的总和，范围 2–15。",
  "settings.taskVariable.complexity":
    "数据库中保存的任务复杂度评分，范围 1–5。",
  "settings.taskVariable.uncertainty":
    "数据库中保存的任务不确定性评分，范围 1–5。",
  "settings.taskVariable.time": "由预期完成时间实时换算的时间评分，范围 1–5。",
  "settings.taskVariable.effort":
    "time × complexity × uncertainty，范围 1–125。",
  "settings.taskVariable.createdAt":
    "任务创建时间，转换为包含时分秒的毫秒时间戳。",
  "settings.taskVariable.updatedAt": "任务最后更新时间，转换为毫秒时间戳。",
  "settings.taskVariable.currentTime": "当前系统时间的毫秒时间戳。",
  "settings.matrixVariableHelp": "查看变量说明",
  "settings.matrixVariable.urgency":
    "任务紧急度，范围 0–100；由 Deadline、Delay Loss 和 Blocking 计算。",
  "settings.matrixVariable.importance":
    "任务重要度，范围 0–100；数值越大，默认位置越靠上。",
  "settings.matrixVariable.estimatedMinutes":
    "当前任务的预期执行时间，单位为分钟。",
  "settings.matrixVariable.maxEstimatedMinutes":
    "矩阵中所有未完成任务的最大预期时间，最小为 1；适合用于按比例计算气泡大小。",
  "settings.matrixVariable.effort": "任务的 Effort；默认决定气泡大小。",
  "settings.matrixVariable.maxEffort": "矩阵中所有未完成任务的最大 Effort。",
  "settings.matrixVariable.priority":
    "Importance × Urgency ÷ Effort；默认决定气泡颜色深浅。",
  "settings.matrixVariable.remainingMinutes":
    "当前时间距离任务截止时间的分钟数；任务已经超时时为负数。",
  "settings.matrixVariable.ageDays": "从任务创建时间到现在经过的天数。",
  "settings.matrixVariable.createdTimestamp":
    "任务创建时刻的 Unix 时间戳，单位为秒；包含日期与小时、分钟、秒。",
  "settings.matrixVariable.createdHour":
    "任务创建时的小时，使用本地时间，范围 0–23。",
  "settings.matrixVariable.createdMinute": "任务创建时的分钟，范围 0–59。",
  "settings.matrixVariable.createdSecond": "任务创建时的秒数，范围 0–59。",
  "settings.matrixVariable.quadrantXMin":
    "当前任务所属象限的 X 轴最小安全坐标：非紧急象限为 2，紧急象限为 52。",
  "settings.matrixVariable.quadrantYMin":
    "当前任务所属象限的 Y 轴最小安全坐标：非重要象限为 2，重要象限为 52。",
  "settings.matrixVariable.createdX":
    "根据任务创建时间生成的稳定横向偏移量，用于分散坐标相近的气泡。",
  "settings.matrixVariable.createdY":
    "根据任务创建时间生成的稳定纵向偏移量，用于分散坐标相近的气泡。",
  "settings.matrixXFormula": "X 坐标公式",
  "settings.matrixYFormula": "Y 坐标公式",
  "settings.matrixSizeFormula": "气泡直径公式（px）",
  "settings.matrixDispersion": "象限分散倍数",
  "settings.matrixDispersionHint":
    "每个象限分别以几何中位点为中心缩放气泡距离。小于 1 聚合，等于 1 保持，大于 1 分散；范围 0.1–10。",
  "settings.matrixFormulaInvalid": "公式无效：",
  "settings.restoreMatrixDefaults": "恢复默认公式",
} as const;

export const settingsMediaEn: Record<keyof typeof settingsMediaZh, string> = {
  "settings.profile": "Profile",
  "settings.username": "Username",
  "settings.changeAvatar": "Replace avatar",
  "settings.removeAvatar": "Remove avatar",
  "settings.avatarHint":
    "Right-click the avatar to replace or remove it. PNG, JPEG, WebP, or SVG up to 2 MB.",
  "settings.avatarInvalid": "Choose a PNG, JPEG, WebP, or SVG image up to 2 MB.",
  "settings.nameRequired": "Username is required.",
  "settings.backgroundMusic": "Background music",
  "settings.backgroundMusicPlayback": "Enable background music",
  "settings.backgroundMusicHint":
    "Plays randomly while the app is running, with fade transitions between tracks.",
  "settings.backgroundMusicDirectory": "Background music directory",
  "settings.backgroundMusicDirectoryHint":
    "New MP3 uploads are stored here. Changing the directory does not move existing music files.",
  "settings.uploadMusic": "Upload MP3",
  "settings.removeMusic": "Delete",
  "settings.musicEmpty":
    "The music library is empty. Upload multiple MP3 files up to 50 MB each.",
  "settings.musicUploadFailed": "Unable to upload the MP3 file.",
  "settings.musicRemoveFailed": "Unable to delete the music.",
  "settings.matrixFormulas": "Urgent–Important Matrix formulas",
  "settings.tabGeneral": "General",
  "settings.tabTasks": "Tasks",
  "settings.tabMedia": "Media",
  "settings.tabData": "Data",
  "settings.tabTrash": "Trash",
  "settings.deleteForever": "Delete permanently",
  "settings.confirmDeleteForever": "Permanently delete this record? This cannot be undone.",
  "settings.taskPreprocessing": "Task preprocessing rules",
  "settings.taskPreprocessingHint":
    "Keywords in the task name fill the description, duration, expected output, and scores. You can still edit them afterward.",
  "settings.taskPreprocessingName": "Category name",
  "settings.taskPreprocessingKeywords": "Matching keywords",
  "settings.taskPreprocessingKeywordsHint": "Separate keywords with commas, for example: report, write, document",
  "settings.taskPreprocessingDescription": "Default description",
  "settings.taskPreprocessingOutput": "Expected output",
  "settings.taskPreprocessingDuration": "Expected duration (minutes)",
  "settings.taskPreprocessingAdd": "Add category",
  "settings.taskPreprocessingNewName": "New category",
  "settings.taskPreprocessingDelete": "Delete category",
  "settings.taskPreprocessingGenericLocked": "The “Other tasks” category is the fallback and cannot be deleted.",
  "settings.taskPreprocessingSave": "Save preprocessing rules",
  "settings.taskPreprocessingReset": "Restore default rules",
  "settings.taskPreprocessingSaved": "Task preprocessing rules saved.",
  "settings.taskPreprocessingScore": "Default scores",
  "settings.taskPreprocessingDelayLoss": "Delay loss",
  "settings.matrixFormulaHint":
    "Customize task bubble coordinates and diameter. Supports numbers, variables, parentheses, and + - * / %. Coordinates are limited to 0–100 and diameter to 32–200px.",
  "settings.matrixVariables": "Available variables",
  "settings.urgencyFormula": "Urgency formula",
  "settings.importanceFormula": "Importance formula",
  "settings.taskFormulaVariables": "Task formula variables",
  "settings.taskVariable.date":
    "The task date converted to a millisecond timestamp.",
  "settings.taskVariable.completed":
    "Whether the task is complete: 0 for incomplete and 1 for complete.",
  "settings.taskVariable.dueAt":
    "The task deadline converted to a millisecond timestamp.",
  "settings.taskVariable.completedAt":
    "The completion time as a millisecond timestamp, or 0 when incomplete.",
  "settings.taskVariable.estimatedMinutes":
    "The task’s estimated duration stored in the database, in minutes.",
  "settings.taskVariable.actualMinutes":
    "The task’s accumulated actual time stored in the database, in minutes.",
  "settings.taskVariable.impact":
    "The Impact score stored in the database, from 1–5.",
  "settings.taskVariable.goal":
    "The Goal score stored in the database, from 1–5.",
  "settings.taskVariable.risk":
    "The Risk score stored in the database, from 1–5.",
  "settings.taskVariable.value":
    "The Value score stored in the database, from 1–5.",
  "settings.taskVariable.importance":
    "The stored task importance: the sum of all four scores, from 4–20.",
  "settings.taskVariable.deadline":
    "The live Deadline score calculated from the due time and current time, from 1–5.",
  "settings.taskVariable.delayLoss": "The stored delay-loss score, from 1–5.",
  "settings.taskVariable.blocking":
    "The number of other tasks that depend on this task, from 0–5.",
  "settings.taskVariable.urgency":
    "The sum of deadline, delayLoss, and blocking, from 2–15.",
  "settings.taskVariable.complexity":
    "The stored task complexity score, from 1–5.",
  "settings.taskVariable.uncertainty":
    "The stored task uncertainty score, from 1–5.",
  "settings.taskVariable.time":
    "The live time score derived from the estimated duration, from 1–5.",
  "settings.taskVariable.effort":
    "time × complexity × uncertainty, from 1–125.",
  "settings.taskVariable.createdAt":
    "The creation time converted to a millisecond timestamp including hours, minutes, and seconds.",
  "settings.taskVariable.updatedAt":
    "The last update time converted to a millisecond timestamp.",
  "settings.taskVariable.currentTime":
    "The current system time in milliseconds.",
  "settings.matrixVariableHelp": "Show variable explanations",
  "settings.matrixVariable.urgency":
    "Task urgency from 0–100, calculated from Deadline, Delay Loss, and Blocking.",
  "settings.matrixVariable.importance":
    "Task importance from 0–100. Higher values appear farther upward by default.",
  "settings.matrixVariable.estimatedMinutes":
    "The current task’s estimated duration in minutes.",
  "settings.matrixVariable.maxEstimatedMinutes":
    "The largest estimated duration among unfinished tasks in the matrix, with a minimum of 1. Useful for proportional bubble sizing.",
  "settings.matrixVariable.effort":
    "The task Effort; it controls bubble size by default.",
  "settings.matrixVariable.maxEffort":
    "The maximum Effort among unfinished tasks in the matrix.",
  "settings.matrixVariable.priority":
    "Importance × Urgency ÷ Effort; it controls color intensity by default.",
  "settings.matrixVariable.remainingMinutes":
    "Minutes from now until the task deadline. The value is negative when the task is overdue.",
  "settings.matrixVariable.ageDays":
    "Number of days elapsed since the task was created.",
  "settings.matrixVariable.createdTimestamp":
    "The task creation Unix timestamp in seconds, including the date, hour, minute, and second.",
  "settings.matrixVariable.createdHour":
    "The local hour when the task was created, from 0–23.",
  "settings.matrixVariable.createdMinute":
    "The minute when the task was created, from 0–59.",
  "settings.matrixVariable.createdSecond":
    "The second when the task was created, from 0–59.",
  "settings.matrixVariable.quadrantXMin":
    "The safe minimum X coordinate of the task’s quadrant: 2 for non-urgent and 52 for urgent.",
  "settings.matrixVariable.quadrantYMin":
    "The safe minimum Y coordinate of the task’s quadrant: 2 for non-important and 52 for important.",
  "settings.matrixVariable.createdX":
    "A stable horizontal offset derived from creation time, used to separate bubbles with similar coordinates.",
  "settings.matrixVariable.createdY":
    "A stable vertical offset derived from creation time, used to separate bubbles with similar coordinates.",
  "settings.matrixXFormula": "X coordinate formula",
  "settings.matrixYFormula": "Y coordinate formula",
  "settings.matrixSizeFormula": "Bubble diameter formula (px)",
  "settings.matrixDispersion": "Quadrant dispersion multiplier",
  "settings.matrixDispersionHint":
    "Scales bubble distances around each quadrant’s geometric median. Below 1 aggregates, 1 preserves, and above 1 disperses. Range: 0.1–10.",
  "settings.matrixFormulaInvalid": "Invalid formula:",
  "settings.restoreMatrixDefaults": "Restore default formulas",
};
