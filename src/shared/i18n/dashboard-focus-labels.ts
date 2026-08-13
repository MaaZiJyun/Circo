export const dashboardFocusZh = {
  "dashboard.focusTimer": "专注计时",
  "dashboard.focusReady": "准备开始",
  "dashboard.focusRunning": "专注进行中",
  "dashboard.focusPaused": "已暂停",
  "dashboard.focusStopped": "本次专注已停止",
  "dashboard.pauseFocus": "暂停",
  "dashboard.startFocusTimer": "开始",
  "dashboard.resumeFocus": "继续",
  "dashboard.stopFocus": "停止",
  "dashboard.cancelFocus": "取消",
  "dashboard.assignFocusTask": "将这段工时记入每日任务",
  "dashboard.saveFocus": "保存工时",
  "dashboard.noDailyTasks": "今天没有可选择的每日任务。",
  "dashboard.editFocusTime": "编辑专注时间，格式为时:分:秒.毫秒",
  "dashboard.averageScore": "日均 score",
  "dashboard.scoreFormula":
    "score = 完成率 40 分 + 投入时间 30 分 + 紧急/重要任务完成度 30 分。投入时间按累计实际用时 ÷ 计划用时计算，最高 30 分。",
  "dashboard.scoreBreakdown":
    "完成 {completed} 项，未完成 {incomplete} 项；投入 {actual} / {planned} 分钟。完成率 +{completionScore}，投入时间 +{timeScore}，紧急/重要程度 +{priorityScore}。",
  "dashboard.scoreReason.empty":
    "当天没有加入每日清单的任务，因此 score 为 0。",
  "dashboard.scoreReason.excellent":
    "当天计划完成充分，时间投入达到预期，并优先处理了紧急且重要的任务。",
  "dashboard.scoreReason.good":
    "当天完成度和投入较好，但仍有部分计划或高优先级任务可以推进。",
  "dashboard.scoreReason.partial":
    "当天已有有效投入，但未完成任务、投入不足或高优先级任务未完成拉低了得分。",
  "dashboard.scoreReason.low":
    "当天完成任务和实际投入较少，尤其需要优先处理紧急且重要的未完成任务。",
} as const;

export const dashboardFocusEn: Record<keyof typeof dashboardFocusZh, string> = {
  "dashboard.focusTimer": "Focus timer",
  "dashboard.focusReady": "Ready to start",
  "dashboard.focusRunning": "Focus in progress",
  "dashboard.focusPaused": "Paused",
  "dashboard.focusStopped": "Focus session stopped",
  "dashboard.pauseFocus": "Pause",
  "dashboard.startFocusTimer": "Start",
  "dashboard.resumeFocus": "Resume",
  "dashboard.stopFocus": "Stop",
  "dashboard.cancelFocus": "Cancel",
  "dashboard.assignFocusTask": "Log this time to a daily task",
  "dashboard.saveFocus": "Save time",
  "dashboard.noDailyTasks": "There are no daily tasks to choose today.",
  "dashboard.editFocusTime":
    "Edit focus time in hours:minutes:seconds.milliseconds",
  "dashboard.averageScore": "Average daily score",
  "dashboard.scoreFormula":
    "score = completion rate (40) + invested time (30) + urgent/important task completion (30). Invested time is actual accumulated time ÷ planned time, capped at 30.",
  "dashboard.scoreBreakdown":
    "{completed} completed, {incomplete} incomplete; {actual} / {planned} minutes invested. Completion +{completionScore}, time +{timeScore}, urgency/importance +{priorityScore}.",
  "dashboard.scoreReason.empty":
    "No tasks were added to the daily list, so the score is 0.",
  "dashboard.scoreReason.excellent":
    "The plan was completed well, time investment met expectations, and urgent important work was prioritized.",
  "dashboard.scoreReason.good":
    "Completion and investment were good, with some planned or high-priority work still available to advance.",
  "dashboard.scoreReason.partial":
    "There was useful investment, but incomplete work, insufficient time, or unfinished high-priority tasks reduced the score.",
  "dashboard.scoreReason.low":
    "Few tasks and little invested time were completed; urgent important unfinished work needs attention first.",
};
