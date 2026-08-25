# Circo macOS 桌面应用

Circo 可以构建为自包含的 macOS `.app`。应用使用系统 WebKit 显示本地 Next.js WebApp，没有地址栏，也不会将主界面交给外部浏览器。

## 接收方如何使用

发送构建生成的压缩包：

```text
dist/Circo-macOS-arm64.zip
```

接收方解压后把 `Circo.app` 拖入“应用程序”并双击即可，不需要：

- Circo 工程目录；
- Node.js、npm 或 `node_modules`；
- Xcode、Terminal 或 SQLite 命令行工具；
- 网络连接，双向翻译模型也已包含在应用中。

压缩包比直接通过普通文件传输发送 `.app` 更可靠，可以保留 macOS bundle 的权限和资源属性。

## 应用包含的内容

- 原生 AppKit/WKWebView 外壳；
- 官方 Node.js 20 便携运行时；
- Next.js production standalone server；
- `public` 与 `.next/static` 前端资源；
- 中英双向本地翻译模型。

应用不会包含构建者的 SQLite 数据库、文献、附件、笔记、日志、备份或工程源码。

## 数据与日志

每位用户的数据独立保存在：

```text
~/Library/Application Support/Circo/data
```

主要位置：

- SQLite：`~/Library/Application Support/Circo/data/circo.db`
- 文件存储：`~/Library/Application Support/Circo/data/`
- 启动日志：`~/Library/Logs/Circo/circo.log`

首次运行会自动创建数据库。卸载应用本身不会删除用户数据。数据库和完整备份规则见 [DATABASE.md](DATABASE.md)。

开发模式仍默认使用工程中的 `data/`，因此开发数据库与独立应用数据库相互隔离。需要迁移现有内容时，请在旧环境生成完整备份，再在桌面应用中恢复。

如果旧界面已经无法正常导出，可以在工程根目录生成兼容的 manifest v2 备份：

```bash
npm run data:export
```

该命令读取旧 `data/circo.db` 与文件目录，默认输出 `dist/Circo-backup-YYYY-MM-DD.zip`。它不会包含本地模型、原始 SQLite 文件或 `data/` 中已有的其他压缩包。

## 运行行为

1. Circo 启动应用包内的 Node.js 和 production server。
2. WebView 等待 `http://localhost:1204` 就绪并加载界面。
3. 退出 Circo 时停止其拥有的 server 进程组。

只有 Circo 本地页面会留在应用窗口内；外部 HTTP、HTTPS 和邮件链接交给系统默认应用。文件上传使用系统选择器，下载使用 macOS 保存面板。`Command-R` 可重新加载，`Control-Command-F` 可进入全屏。

## 构建

在 Apple Silicon Mac 的项目根目录运行：

```bash
npm run app:macos
```

首次构建会从 nodejs.org 下载固定版本的官方 Node.js 运行时并缓存到 `.build-cache/`，后续构建复用缓存。构建机器需要 Node.js/npm 和 Xcode Command Line Tools。

输出：

```text
dist/Circo.app
dist/Circo-macOS-arm64.zip
```

当前构建跟随构建机器架构。Apple Silicon 产物不能在 Intel Mac 上运行；Intel 版本需要在 Intel 构建环境中生成，通用版本则需要分别构建并合并原生可执行文件及 Node native addons。

## 签名和公开分发

默认构建使用 ad-hoc 签名，适合本机测试。把应用发到其他 Mac 后，Gatekeeper 仍可能阻止首次启动。要达到“下载、解压、双击即可使用且无安全警告”，需要 Apple Developer Program 的 `Developer ID Application` 证书、hardened runtime 和 notarization。

使用 Developer ID 构建：

```bash
CIRCO_SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)" npm run app:macos
```

然后用 `xcrun notarytool submit` 上传生成的 zip，等待 Apple 验证，并用 `xcrun stapler staple dist/Circo.app` 附加票据；staple 后应重新生成分享 zip。证书和 notarization 凭据属于发布者账号，不能直接写入仓库。

## 相关文件

- `macos/CircoApp/main.swift`：应用生命周期、用户目录和内置 server。
- `macos/CircoApp/CircoWindowController.swift`：WebView、导航和下载。
- `macos/CircoApp/IconGenerator.swift`：应用图标生成。
- `macos/CircoApp/Info.plist`：应用元数据和本地网络权限。
- `scripts/build-macos-app.sh`：production 构建与自包含打包。
