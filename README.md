# File Viewer Standalone（离线网页版）

> 基于 [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) 的纯前端离线文件查看器，支持 50+ 种格式，无需服务器端转换，适用于私密和内部网络环境。

[![Build Web Version](https://github.com/sixiang-world/file-viewer-standalone/actions/workflows/build.yml/badge.svg)](https://github.com/sixiang-world/file-viewer-standalone/actions/workflows/build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 🔗 与桌面版的关系

本仓库是 **纯网页版**，构建产物是静态 HTML/JS/CSS，可以直接在浏览器中打开。

**姊妹仓库**：[file-viewer-desktop](https://github.com/sixiang-world/file-viewer-desktop) — Windows 桌面版（EXE），它会自动拉取本仓库的代码进行构建，然后用 Electron 打包成 Windows 安装包。

```
┌─────────────────────────────────┐
│  file-viewer-standalone (本仓库) │
│  Vue 3 + Vite + @file-viewer    │
│  构建产物: dist/ (静态网页)       │
└──────────────┬──────────────────┘
               │ 被依赖
               ▼
┌─────────────────────────────────┐
│  file-viewer-desktop             │
│  Electron 包装 + 文件关联         │
│  构建产物: .exe (Windows安装包)   │
└─────────────────────────────────┘
```

---

## ✨ 特性

- **完全离线**：所有 WASM、Worker、字体资源均本地打包，无需服务器端转换
- **零依赖部署**：构建产物是纯静态文件，可部署到任意静态服务器或直接用 `file://` 打开
- **全格式支持**：Office、PDF/OFD、CAD、压缩包、电子邮件、电子书、图片、音频、视频、3D 模型、数据文件等
- **拖拽上传**：直接将文件拖放到页面即可预览
- **URL 参数加载**：支持 `?url=` 参数加载远程文件
- **Electron 就绪**：内置桌面端集成接口，可直接被 Electron 应用调用
- **响应式设计**：适配桌面和移动设备

---

## 📋 支持的文件格式

| 类别 | 格式 |
|------|------|
| 文档 | PDF, DOC, DOCX, ODT, RTF, TXT, MD, OFD, EPUB |
| 表格 | XLS, XLSX, CSV, ODS |
| 演示 | PPT, PPTX, ODP |
| CAD | DWG, DXF, DWF, DWFx |
| 压缩包 | ZIP, RAR, 7Z, TAR, GZ |
| 邮件 | EML, MSG |
| 图片 | PNG, JPG, GIF, SVG, WebP, BMP, TIFF, ICO |
| 视频 | MP4, WebM, MKV, AVI, MOV |
| 音频 | MP3, WAV, FLAC, OGG, AAC |
| 3D 模型 | STL, OBJ, glTF, GLB, FBX |
| 数据 | JSON, XML, YAML, CSV |

---

## 🚀 快速开始

### 方式一：下载预构建版本（推荐）

1. 前往 [Actions 页面](https://github.com/sixiang-world/file-viewer-standalone/actions/workflows/build.yml)
2. 选择最新的成功构建
3. 下载 `file-viewer-web-zip` 产物
4. 解压后双击 `index.html` 即可使用

或者，手动触发构建并创建 Release：
1. 点击 [Actions → Build Web Version → Run workflow](https://github.com/sixiang-world/file-viewer-standalone/actions/workflows/build.yml)
2. 将 `Create GitHub Release` 设为 `true`
3. 构建完成后在 [Releases](https://github.com/sixiang-world/file-viewer-standalone/releases) 页面下载

### 方式二：本地构建

#### 前置要求

- Node.js >= 18
- 建议 8GB+ 内存（构建 full 包需要较大内存）

#### 构建步骤

```bash
# 1. 克隆仓库
git clone https://github.com/sixiang-world/file-viewer-standalone.git
cd file-viewer-standalone

# 2. 安装依赖
npm install

# 3. 构建（Windows 设置内存限制）
set NODE_OPTIONS=--max-old-space-size=8192
npm run build

# Linux/macOS
# NODE_OPTIONS=--max-old-space-size=8192 npm run build

# 4. 构建产物在 dist/ 目录
# 双击 dist/index.html 即可在浏览器中打开
```

---

## 📖 使用方式

### 1. 直接打开
双击 `dist/index.html` 在浏览器中打开

### 2. 拖拽文件
将文件拖放到页面中查看

### 3. 点击上传
点击页面中央的"选择文件"区域，选择要预览的文件

### 4. URL 参数加载
```
index.html?url=https://example.com/file.pdf
```

### 5. 查看器控制
- **缩放**：工具栏 +/- 按钮，或鼠标滚轮
- **适应页面/宽度**：工具栏按钮
- **搜索**：搜索按钮，支持文档内搜索
- **下载**：下载原始文件
- **打印**：打印当前文档

---

## 🔧 GitHub Actions 自动构建

本仓库配置了 GitHub Actions 自动构建工作流（`.github/workflows/build.yml`）：

### 触发条件
- **自动触发**：push 或 PR 到 `main` 分支时自动构建
- **手动触发**：Actions 页面点击 "Run workflow"

### 构建产物
- `file-viewer-web-dist`：完整的 dist 目录（artifact，保留 30 天）
- `file-viewer-web-zip`：打包好的 zip 文件（artifact，保留 30 天）
- **可选 Release**：手动触发时可选择创建 GitHub Release

### 工作流步骤
1. Checkout 代码
2. Setup Node.js 20
3. `npm ci` 安装依赖
4. `npm run build` 构建（8GB 内存）
5. 验证构建产物
6. 打包为 zip
7. 上传 artifacts
8. （可选）创建 GitHub Release

---

## 📁 项目结构

```
file-viewer-standalone/
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions 自动构建
├── public/
│   └── favicon.svg            # 应用图标
├── src/
│   ├── App.vue                # 主组件（拖拽/上传/搜索/缩放/Electron集成）
│   ├── main.ts                # Vue 应用入口
│   ├── style.css              # 全局样式
│   └── env.d.ts               # TypeScript 类型声明
├── index.html                 # 入口页面（带加载动画）
├── vite.config.ts             # Vite 配置（base: './' 支持离线）
├── tsconfig.json              # TypeScript 配置
├── package.json               # 依赖配置
└── README.md                  # 本文件
```

---

## 🏗️ 技术架构

### 核心技术栈
- **Vue 3**：前端框架
- **Vite**：构建工具
- **@file-viewer/vue3-full**：文件查看器全量包（包含所有渲染器）
- **TypeScript**：类型安全

### 离线原理
file-viewer 采用浏览器原生技术栈，所有解析均在前端完成：
- **WebAssembly (WASM)**：PDF、CAD、压缩包等格式的解析引擎
- **Web Workers**：后台线程处理大文件，避免 UI 阻塞
- **本地字体**：CJK 字体、PDF 标准字体等均打包在本地
- **相对路径**：Vite `base: './'` 配置，所有资源使用相对路径，支持 `file://` 协议直接打开

### Electron 集成
代码内置了桌面端集成接口（`src/App.vue`）：
- 检测 `window.fileViewerDesktop` 对象判断是否在 Electron 环境
- 监听 `file:open` IPC 事件接收来自主进程的文件
- 暴露 `window.openFileViewerFile()` 全局方法供外部调用
- 支持运行中拖拽文件到窗口

---

## 🔒 隐私与安全

- **零服务器依赖**：所有文件解析在本地浏览器中完成，文件不会上传到任何服务器
- **内网部署友好**：可部署到企业内网，无需外网访问
- **纯静态产物**：构建产物不包含任何后端代码，可安全部署到任意静态服务器
- **Content Security**：不加载任何外部 CDN 资源，所有依赖均本地打包

---

## ❓ 常见问题

### Q: 直接双击 index.html，某些格式无法预览？

A: 部分浏览器（如 Chrome）对 `file://` 协议下的 Worker 和 WASM 加载有限制。建议：
- 使用 Firefox 或 Edge 浏览器
- 或用本地静态服务器打开：`npx serve dist/`
- 或使用 [桌面版 EXE](https://github.com/sixiang-world/file-viewer-desktop)

### Q: 构建时内存溢出？

A: `@file-viewer/vue3-full` 包含所有格式的渲染器，构建时需要较大内存。请确保：
- 设置 `NODE_OPTIONS=--max-old-space-size=8192`
- 机器有 8GB+ 可用内存
- 或使用 GitHub Actions 自动构建（免费）

### Q: 如何只支持部分格式以减小体积？

A: 可以将 `@file-viewer/vue3-full` 替换为 `@file-viewer/vue3` + 按需引入需要的渲染器包。具体请参考 [file-viewer 官方文档](https://doc.file-viewer.app)。

### Q: 如何部署到内网服务器？

A: 将 `dist/` 目录的所有文件上传到任意静态文件服务器（Nginx、Apache、IIS 等）即可。无需任何后端服务或数据库。

---

## 📄 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证，与上游 file-viewer 保持一致。

---

## 🙏 致谢

- [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) - 浏览器原生文件预览引擎
- [file-viewer-desktop](https://github.com/sixiang-world/file-viewer-desktop) - 姊妹仓库，Windows 桌面版
