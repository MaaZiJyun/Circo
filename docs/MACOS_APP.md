# Circo macOS 桌面套壳

Circo 可以构建为一个轻量 macOS `.app`。应用窗口使用系统 WebKit 显示本地 Next.js WebApp，没有地址栏，也不会把 Circo 主界面交给外部浏览器。

## 日常使用

构建完成后，直接在 Finder 双击：

```text
dist/Circo.app
```

应用会自动：

1. 在后台执行 `npm run dev:all`。
2. 初始化或打开现有 SQLite 数据库。
3. 等待 `http://localhost:1204` 就绪。
4. 在 Circo 原生窗口的 WKWebView 中加载完整 WebApp。
5. 关闭或退出 Circo 时停止由它启动的 npm/Next.js 进程组。

启动过程中不会显示 Terminal。加载失败时可在应用内重新加载或打开日志。

## 界面边界

- Circo 页面、Next.js 资源和本地 API 保持在应用窗口中。
- 只允许 `localhost:1204`、`127.0.0.1:1204` 和 WebView 内部的 `about/blob/data` 导航。
- 外部 HTTP、HTTPS 和邮件链接交给 macOS 默认应用打开。
- 文件上传继续使用系统文件选择器。
- 下载通过 macOS 保存面板选择目标位置。
- `Command-R` 重新加载 Circo，`Control-Command-F` 可进入全屏。

## 运行要求

当前 `.app` 是轻量套壳，不把约 1GB 的 `node_modules` 和个人 `data` 打进应用包。

- macOS 13 或更高版本。
- Node.js/npm 已安装，并能从登录 shell 找到。
- 项目目录仍存在。
- `node_modules` 缺失时，现有 `dev:all` 脚本会自动运行 `npm install`。
- SQLite 使用 macOS 自带的 `sqlite3`。

应用内部记录了构建时的绝对项目路径。可以移动 `Circo.app`，但移动或重命名项目目录后需要重新构建。

## 构建

开发者在项目根目录运行：

```bash
npm run app:macos
```

构建脚本会：

- 使用 Swift/AppKit/WebKit 编译当前 Mac 架构的原生可执行文件。
- 生成 Circo `.icns` 图标。
- 把当前项目绝对路径写入 `Info.plist`。
- 进行本地 ad-hoc codesign。
- 输出 `dist/Circo.app`。

生成 `.app` 需要 Xcode Command Line Tools，但运行 `.app` 不需要 Xcode。

## 数据和日志

套壳不复制或迁移数据，仍使用项目现有配置：

- SQLite：`data/circo.db` 或设置中指定的数据库路径。
- 文件存储：`data/` 或设置中指定的存储路径。
- 启动日志：`~/Library/Logs/Circo/circo.log`。

数据库和完整备份规则见 [DATABASE.md](DATABASE.md)。

## 发布限制

当前构建使用本地 ad-hoc 签名，适合当前机器和内部测试。若要发送给普通 macOS 用户并避免 Gatekeeper 提示，需要：

1. 使用 Apple Developer ID 正式签名。
2. 提交 Apple notarization。
3. 决定是否随应用嵌入 Node runtime 和生产构建。
4. 明确个人数据目录不进入安装包。

如果后续需要真正独立分发，建议另做“production standalone + 内嵌 Node”包，而不是把当前开发目录和 `data` 整体塞进 `.app`。

## 相关文件

- `macos/CircoApp/main.swift`：应用生命周期和后台服务。
- `macos/CircoApp/CircoWindowController.swift`：WebView、加载页、导航和下载。
- `macos/CircoApp/IconGenerator.swift`：应用图标生成。
- `macos/CircoApp/Info.plist`：应用元数据和本地网络权限。
- `scripts/build-macos-app.sh`：打包脚本。
