export const dashboardCountdownZh = {
  "dashboard.countdown": "周期倒计时",
  "dashboard.countdown.year": "年",
  "dashboard.countdown.month": "月",
  "dashboard.countdown.day": "日",
  "dashboard.countdown.hour": "时",
  "dashboard.timeRemaining": "剩余时间",
} as const;

export const dashboardCountdownEn: Record<
  keyof typeof dashboardCountdownZh,
  string
> = {
  "dashboard.countdown": "Period countdown",
  "dashboard.countdown.year": "Year",
  "dashboard.countdown.month": "Month",
  "dashboard.countdown.day": "Day",
  "dashboard.countdown.hour": "Hour",
  "dashboard.timeRemaining": "Time remaining",
};
