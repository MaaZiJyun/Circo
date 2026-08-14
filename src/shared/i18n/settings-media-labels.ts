export const settingsMediaZh = {
  "settings.profile": "个人资料",
  "settings.username": "用户名",
  "settings.changeAvatar": "更换头像",
  "settings.removeAvatar": "移除头像",
  "settings.avatarHint":
    "右键头像可更换或移除。支持 PNG、JPEG 或 WebP，最大 2 MB。",
  "settings.avatarInvalid": "请选择不超过 2 MB 的 PNG、JPEG 或 WebP 图片。",
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
} as const;

export const settingsMediaEn: Record<keyof typeof settingsMediaZh, string> = {
  "settings.profile": "Profile",
  "settings.username": "Username",
  "settings.changeAvatar": "Replace avatar",
  "settings.removeAvatar": "Remove avatar",
  "settings.avatarHint":
    "Right-click the avatar to replace or remove it. PNG, JPEG, or WebP up to 2 MB.",
  "settings.avatarInvalid": "Choose a PNG, JPEG, or WebP image up to 2 MB.",
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
};
