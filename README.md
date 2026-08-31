# Circo

Circo 是一款本地优先的个人成长周期与成果管理平台。它把时间投入、文献阅读、灵感、项目执行和正式成果连接为一个可追溯闭环：

```text
Me → Find → Mind → Hand → Land → Me
```

当前仓库包含可运行的 v0.1 MVP。

## MVP 功能

- **Overview**：当前周期、透明效率指标、目标差距、成长闭环和最近成果。
- **Me**：目标、专注计时、工时补录、有效投入率、计划完成率、成功/错误原因和周期复盘草稿。
- **Find**：文献库与列表管理、PDF/Markdown/TXT 导入、PDF 转 Markdown、原文对照阅读、本地中英翻译、阅读标记和来源追溯。
- **灵感库**：手动记录或基于 Library List 按七类方式推演灵感，通过 15 题五维评估决定是否孵化项目。
- **Hand**：通过项目库管理由灵感孵化或手动建立的项目，进入项目后管理任务、里程碑、进度、日志及附件。
- **Land**：论文、海报、PPT 大纲、自媒体文案、博文与自定义成果，支持草稿生成、Markdown 导出和打印为 PDF。
- **Shared**：全文搜索、软删除与回收站、简体中文/英文、白天/夜间/跟随系统、完整 ZIP 备份与恢复。

AI 辅助功能在 MVP 中使用可替换的本地规则适配器，不会发送外部请求。生成结果会明确标为待核实草稿；后续可在不修改 View 或领域模型的情况下接入真实 AI 服务。

## Find 文献模块

Find 用于管理、阅读和整理研究资料。文献可以加入自定义列表，并记录标题、作者、年份、来源、标签、评分、收藏状态和阅读进度。列表支持最近添加、已标记、批量选择、拖动归类和文件删除。

支持导入 PDF、Markdown 和纯文本文件。PDF 导入后会同时保留原文件，并在本地生成可编辑的 Markdown：

- 使用本地 MinerU 识别版面、标题、段落、列表、表格、公式和图片。
- 支持文本型 PDF 与扫描 PDF OCR，不再使用 PDF.js 文本提取或自定义排版规则。
- 将 MinerU 提取的图片复制到 Circo 文献资源目录，并改写 Markdown 引用。
- 支持从原 PDF 重新转换，以刷新 Markdown、表格和图片资源。

PDF 转换要求本机安装 MinerU。macOS 推荐使用 Python 3.10–3.13 的独立环境：

```bash
uv pip install -U "mineru[all]"
mineru --version
```

翻译模型和 MinerU 是可选的外部模块，不随主应用代码一同提供。在 Settings → Modules
选择 `Circo-modules` 目录后即可使用，修改目录无需重启。开发模式未配置模块目录时，
仍可通过 `MINERU_COMMAND=/absolute/path/to/mineru` 临时指定 MinerU。

阅读界面采用 PDF 与 Markdown 双栏布局。桌面端可以拖动中间分隔条调整宽度，比例会保存在浏览器中；Markdown 支持阅读和编辑模式。PDF 中可以选择文本进行本地中英互译，也可以截取文本或页面区域创建带页码位置的文献观点。

中英翻译使用本地 q8 量化 OPUS-MT 模型，不调用第三方翻译 API。首次使用前可下载模型：

```bash
npm run models:download
```

模型下载到 `data/models/`，随后可与 MinerU 一起生成独立模块包：

```bash
npm run mineru:prepare
npm run modules:package
```

## 技术栈

- Next.js 16.3 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Heroicons
- SQLite + `better-sqlite3`
- MinerU（本地 PDF 版面分析、OCR 与 Markdown 转换）
- Transformers.js + OPUS-MT ONNX 模型
- Vitest

## 架构

项目遵循 MVVM 与外层适配器结构：

```text
View → ViewModel → Use Case / Model ← Repository Interface
                                      ↑
                         Infrastructure Adapter
```

主要目录：

```text
src/
  app/                    # Next.js 路由和 HTTP 接口
  modules/                # dashboard / me / find / mind / hand / land
    */view-models/        # 页面状态与操作编排
    */views/              # React View
  shared/
    model/                # 领域实体、指标与接口
    infrastructure/       # SQLite、HTTP、AI 等适配器
    components/           # 共享 UI 与应用外壳
    i18n/                 # 中英文资源
    theme/                # 主题状态
```

所有受控源文件必须小于或等于 300 行。详细规范见 [开发要求](docs/DEVELOPMENT_REQUIREMENTS.md)，产品需求见 [SRS](docs/SRS.md)。

## 启动 Web 应用

一条命令初始化数据库并启动完整开发环境：

```bash
npm run dev:all
```

浏览器打开 [http://localhost:1204](http://localhost:1204)。应用为单用户、无账号、本地运行模式。

开发服务器支持热更新；保存代码后直接刷新浏览器或等待页面自动更新，无需重新构建。

也可以分步启动：

```bash
npm install
npm run db:init
npm run dev
```

生产环境使用标准 Next.js Web 服务：

```bash
npm run build
npm run start
```

## 可选的 macOS 应用

日常开发默认使用上述 Web 模式。需要生成无地址栏、自带 Node.js 与 production server 的独立 macOS 应用时，再执行：

```bash
npm run app:macos
```

生成文件为 `dist/Circo.app`，分享文件为 `dist/Circo-macOS-arm64.zip`。完整要求和签名说明见 [macOS 桌面应用](docs/MACOS_APP.md)。

## 数据

- SQLite 数据库：`data/circo.db`
- 文献原文件：`data/library/`
- 转换后的 Markdown：`data/library/markdown/<UUID>.md`
- PDF 提取图片：`data/library/markdown/<UUID>/`
- 本地翻译模型：`data/models/`
- 项目附件：`data/attachments/`
- 项目 Markdown 日志：`data/project/<project-id>/logs/`
- 数据库开启 WAL 模式。
- 以上个人数据默认不进入 Git。

设置页可以导出完整 ZIP 备份。备份包含版本化业务快照、文献原文件和项目附件，恢复前会校验结构及文件路径。

## 质量检查

运行全部自动门禁：

```bash
npm run check
```

该命令依次执行：

- 300 行文件限制检查
- 中英文资源键一致性检查
- ESLint
- TypeScript 类型检查
- Vitest 测试

生产构建：

```bash
npm run build
npm run start
```

## MVP 边界

- 扫描 PDF OCR、复杂公式、无边框表格、多栏顺序和版面坐标的高保真恢复不在 v0.1 范围。
- 提取的图片和表格按来源页写入 Markdown，但无法保证恢复到原页面中的精确位置。
- 可导入文献文件最大 200 MB，普通项目附件最大 50 MB，完整备份最大 1 GB。
- 音视频作为附件保存，不执行自动转写或语义分析。
- Markdown 预览使用安全的纯文本呈现，不执行导入内容中的 HTML 或脚本。
- PPT 在 MVP 中输出结构化大纲，不生成专业排版的 PPTX 文件。
