export const dashboardFocusZh = {
  "status.overdue": "超时",
  "dashboard.startFocus": "专注",
  "dashboard.finishTodayIntro":
    "回答六个问题后，将立即结算今天的 score，并向消息收件箱发送一封未读 Daily Summary。",
  "dashboard.finishToday.question.accomplished": "What did I accomplish today?",
  "dashboard.finishToday.hint.accomplished": "今天实际完成了什么？",
  "dashboard.finishToday.question.learned": "What did I learn today?",
  "dashboard.finishToday.hint.learned": "今天获得了什么新知识、发现或经验？",
  "dashboard.finishToday.question.wentWrong": "What went wrong, and why?",
  "dashboard.finishToday.hint.wentWrong": "什么没做好？根本原因是什么？",
  "dashboard.finishToday.question.unfinished":
    "What remains unfinished, and why?",
  "dashboard.finishToday.hint.unfinished": "哪些任务没完成？为什么？",
  "dashboard.finishToday.question.changeNextTime":
    "What should I do differently next time?",
  "dashboard.finishToday.hint.changeNextTime": "下次应该改变什么？",
  "dashboard.finishToday.question.tomorrowPriority":
    "What is the most important thing tomorrow?",
  "dashboard.finishToday.hint.tomorrowPriority": "明天最重要的一件事是什么？",
  "dashboard.finishTodaySubmit": "提交并生成 Daily Summary",
  "dashboard.finishToday.reflection": "Finish Today 回答：",
  "dashboard.totalTime": "累计投入",
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
    "基础分 = 完成率 40 分 + 投入时间 30 分 + 紧急/重要任务完成度 30 分；最终 score = 基础分 ×（1 − 超时任务占比 × 20%）。",
  "dashboard.scoreBreakdown":
    "完成 {completed} 项，未完成 {incomplete} 项，其中超时 {overdue} 项；投入 {actual} / {planned} 分钟。完成率 +{completionScore}，投入时间 +{timeScore}，紧急/重要程度 +{priorityScore}；最终得分折扣 {overdueDiscount}%。",
  "dashboard.scoreReason.empty":
    "当天没有加入每日清单的任务，因此 score 为 0。",
  "dashboard.scoreReason.excellent":
    "当天计划完成充分，时间投入达到预期，并优先处理了紧急且重要的任务。",
  "dashboard.scoreReason.good":
    "当天完成度和投入较好，但仍有部分计划或高优先级任务可以推进。",
  "dashboard.scoreReason.partial":
    "当天已有有效投入，但未完成或超时任务、投入不足、高优先级任务未完成拉低了得分。",
  "dashboard.scoreReason.low":
    "当天完成任务和实际投入较少，超时折扣也可能进一步降低得分，需要优先处理紧急且重要的未完成任务。",
} as const;

export const dashboardFocusEn: Record<keyof typeof dashboardFocusZh, string> = {
  "status.overdue": "Overdue",
  "dashboard.startFocus": "Focus",
  "dashboard.finishTodayIntro":
    "Answer all six questions to settle today's score now and receive an unread Daily Summary in Messages.",
  "dashboard.finishToday.question.accomplished": "What did I accomplish today?",
  "dashboard.finishToday.hint.accomplished":
    "What did you actually complete today?",
  "dashboard.finishToday.question.learned": "What did I learn today?",
  "dashboard.finishToday.hint.learned":
    "What new knowledge, discovery, or experience did you gain?",
  "dashboard.finishToday.question.wentWrong": "What went wrong, and why?",
  "dashboard.finishToday.hint.wentWrong":
    "What did not go well, and what was the root cause?",
  "dashboard.finishToday.question.unfinished":
    "What remains unfinished, and why?",
  "dashboard.finishToday.hint.unfinished":
    "Which activities remain incomplete, and why?",
  "dashboard.finishToday.question.changeNextTime":
    "What should I do differently next time?",
  "dashboard.finishToday.hint.changeNextTime":
    "What should change the next time you face a similar day?",
  "dashboard.finishToday.question.tomorrowPriority":
    "What is the most important thing tomorrow?",
  "dashboard.finishToday.hint.tomorrowPriority":
    "Identify tomorrow's single most important thing.",
  "dashboard.finishTodaySubmit": "Submit and generate Daily Summary",
  "dashboard.finishToday.reflection": "Finish Today responses:",
  "dashboard.totalTime": "Total effort",
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
  "dashboard.noDailyTasks": "There are no daily activities to choose today.",
  "dashboard.editFocusTime":
    "Edit focus time in hours:minutes:seconds.milliseconds",
  "dashboard.averageScore": "Average daily score",
  "dashboard.scoreFormula":
    "Base score = completion rate (40) + invested time (30) + urgent/important task completion (30); final score = base score × (1 − overdue task ratio × 20%).",
  "dashboard.scoreBreakdown":
    "{completed} completed, {incomplete} incomplete, including {overdue} overdue; {actual} / {planned} minutes invested. Completion +{completionScore}, time +{timeScore}, urgency/importance +{priorityScore}; final-score discount {overdueDiscount}%.",
  "dashboard.scoreReason.empty":
    "No activities were added to the daily list, so the score is 0.",
  "dashboard.scoreReason.excellent":
    "The plan was completed well, time investment met expectations, and urgent important work was prioritized.",
  "dashboard.scoreReason.good":
    "Completion and investment were good, with some planned or high-priority work still available to advance.",
  "dashboard.scoreReason.partial":
    "There was useful investment, but incomplete or overdue work, insufficient time, or unfinished high-priority activities reduced the score.",
  "dashboard.scoreReason.low":
    "Few activities and little invested time were completed, and the overdue discount may have reduced the score further; urgent important unfinished work needs attention first.",
};
