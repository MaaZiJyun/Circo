export const attachmentZh = {
  "common.browse": "浏览…",
  "hand.chooseOriginalFile": "选择文件；将复制到项目附件文件夹",
  "hand.fileSize": "大小",
  "hand.openOriginal": "打开原文件",
  "hand.openFileLocation": "打开文件目录",
  "hand.moveAttachment": "移至其他项目",
  "hand.attachmentsSelected": "已选择 {count} 个附件",
  "hand.previewUnavailable": "暂不支持预览此文件格式，请打开原文件查看。",
} as const;

export const attachmentEn: Record<keyof typeof attachmentZh, string> = {
  "common.browse": "Browse…",
  "hand.chooseOriginalFile": "Choose a file; it will be copied to the project's attachment folder",
  "hand.fileSize": "Size",
  "hand.openOriginal": "Open original file",
  "hand.openFileLocation": "Show in Finder",
  "hand.moveAttachment": "Move to another project",
  "hand.attachmentsSelected": "{count} attachments selected",
  "hand.previewUnavailable": "Preview is not available for this file type. Open the original file instead.",
};
