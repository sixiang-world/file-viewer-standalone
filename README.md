# File Viewer Standalone（离线网页版）

> 基于 [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) 的纯前端离线文件查看器，支持 50+ 种格式，无需服务器端转换，适用于私密和内部网络环境。

[![Build Web Version](https://github.com/sixiang-world/file-viewer-standalone/actions/workflows/build.yml/badge.svg)](https://github.com/sixiang-world/file-viewer-standalone/actions/workflows/build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff)](https://vitejs.dev/)

---

## 📑 目录

- [🔗 与桌面版的关系](#-与桌面版的关系)
- [✨ 特性](#-特性)
- [📋 支持的文件格式](#-支持的文件格式)
- [🚀 快速开始](#-快速开始)
- [📖 使用方式](#-使用方式)
- [💻 开发指南](#-开发指南)
- [⚙️ 配置说明](#️-配置说明)
- [🔧 GitHub Actions 自动构建](#-github-actions-自动构建)
- [📁 项目结构](#-项目结构)
- [🏗️ 技术架构](#️-技术架构)
- [🔒 隐私与安全](#-隐私与安全)
- [🐛 故障排除](#-故障排除)
- [❓ 常见问题](#-常见问题)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)
- [🙏 致谢](#-致谢)

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
- **文档搜索**：支持 PDF、Word 等文档的全文搜索
- **缩放控制**：支持放大、缩小、适应页面、适应宽度

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

## 💻 开发指南

### 本地开发调试

```bash
# 1. 克隆仓库
git clone https://github.com/sixiang-world/file-viewer-standalone.git
cd file-viewer-standalone

# 2. 安装依赖
npm install

# 3. 启动开发服务器（热更新）
npm run dev

# 4. 浏览器打开 http://localhost:5173
```

### 项目脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |

### 开发注意事项

1. **内存设置**：开发时如果遇到内存问题，设置 `NODE_OPTIONS=--max-old-space-size=4096`
2. **大文件测试**：测试大文件（>100MB）时，建议使用本地静态服务器而不是 `file://` 协议
3. **WASM 调试**：WASM 相关问题可以在浏览器 DevTools 的 Network 面板检查加载状态
4. **Electron 集成测试**：可以在浏览器控制台模拟 `window.fileViewerDesktop` 对象进行测试

---

## ⚙️ 配置说明

### vite.config.ts 关键配置

```typescript
export default defineConfig({
  base: './',           // 相对路径，支持 file:// 协议离线打开
  build: {
    modulePreload: false,  // 关闭模块预加载，避免 file:// 协议 CORS 问题
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue'],
          'file-viewer-core': ['@file-viewer/core'],
          'file-viewer-vue': ['@file-viewer/vue3-full']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@file-viewer/pptx']  // PPT 渲染器需要动态加载 WASM/Worker
  }
})
```

### package.json 依赖说明

| 依赖 | 版本 | 说明 |
|------|------|------|
| `@file-viewer/vue3-full` | ^3.0.0 | Vue 3 全量包，包含所有渲染器 |
| `@file-viewer/core` | ^3.0.0 | 核心渲染引擎 |
| `@file-viewer/preset-all` | ^3.0.0 | 所有格式的预设配置 |
| `vue` | ^3.4.0 | 前端框架 |

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_OPTIONS` | Node.js 内存限制等选项 | 无（建议设置 `--max-old-space-size=8192`） |

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

### 手动触发参数

| 参数 | 说明 | 选项 | 默认值 |
|------|------|------|--------|
| `create_release` | 是否创建 GitHub Release | `true` / `false` | `false` |

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
├── tsconfig.node.json         # Node 环境 TypeScript 配置
├── package.json               # 依赖配置
├── package-lock.json          # 依赖锁定
├── LICENSE                    # Apache-2.0 许可证
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

### 数据流

```
用户操作（拖拽/点击/URL）
    │
    ▼
App.vue 接收文件（File 对象或 URL）
    │
    ▼
<file-viewer> 组件（@file-viewer/vue3-full）
    │
    ├──► 根据文件扩展名选择渲染器
    ├──► 加载对应的 WASM/Worker（本地资源）
    └──► 解析并渲染到页面
```

---

## 🔒 隐私与安全

- **零服务器依赖**：所有文件解析在本地浏览器中完成，文件不会上传到任何服务器
- **内网部署友好**：可部署到企业内网，无需外网访问
- **纯静态产物**：构建产物不包含任何后端代码，可安全部署到任意静态服务器
- **Content Security**：不加载任何外部 CDN 资源，所有依赖均本地打包
- **无遥测**：不收集任何使用数据或用户信息
- **无 Cookie**：不使用任何 Cookie 或本地存储（除了用户主动的文件选择）

---

## 🐛 故障排除

### 构建时内存溢出（JavaScript heap out of memory）

**症状**：构建时报错 `FATAL ERROR: Ineffective mark-compacts near heap limit`

**解决方案**：
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=8192
npm run build

# Linux/macOS
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

如果仍然溢出，尝试增加到 12288（12GB）。

### 构建时报错 "Module 'stream' has been externalized"

**症状**：构建时出现警告，某些模块被 externalized

**说明**：这是正常警告，不影响构建。这些是 Node.js 内置模块，在浏览器环境中会被自动 externalize。

**解决方案**：无需处理，构建会正常完成。

### 开发服务器启动慢

**症状**：`npm run dev` 启动需要很长时间

**原因**：`@file-viewer/vue3-full` 包很大，Vite 需要预构建很多依赖

**解决方案**：
1. 耐心等待，首次启动后会有缓存
2. 确保使用 SSD 硬盘
3. 关闭杀毒软件的实时扫描（可能会扫描大量小文件）

### 某些格式无法预览

**症状**：某些文件格式显示"不支持"或空白

**可能原因**：
1. 文件损坏或格式不标准
2. 该格式的渲染器加载失败
3. 浏览器安全限制

**排查步骤**：
1. 打开浏览器 DevTools（F12），查看 Console 错误信息
2. 查看 Network 面板，检查 WASM/Worker 文件是否加载成功
3. 尝试用其他浏览器打开
4. 检查文件是否能在其他软件中正常打开

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

**Nginx 配置示例**：
```nginx
server {
    listen 80;
    server_name file-viewer.internal;
    root /var/www/file-viewer;
    index index.html;
    
    # 确保 WASM 文件正确的 MIME 类型
    types {
        application/wasm wasm;
    }
}
```

### Q: 可以嵌入到其他网页中吗？

A: 可以。使用 iframe 嵌入：
```html
<iframe src="file-viewer/index.html?url=https://example.com/file.pdf" 
        width="100%" height="600px" frameborder="0"></iframe>
```

### Q: 支持移动端吗？

A: 支持响应式布局，但某些复杂格式（如 CAD、3D 模型）在移动端性能可能有限。建议在桌面端使用。

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

### 提交 Issue
- 使用 [Issues](https://github.com/sixiang-world/file-viewer-standalone/issues) 页面提交 bug 报告或功能请求
- 提交时请包含：复现步骤、预期行为、实际行为、环境信息

### 提交 Pull Request
1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript，确保类型安全
- 遵循 Vue 3 组合式 API 风格
- 保持代码简洁，添加必要的注释
- 提交前确保 `npm run build` 能正常通过

### 开发环境设置
```bash
# 1. Fork 并克隆你的仓库
git clone https://github.com/your-username/file-viewer-standalone.git
cd file-viewer-standalone

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 构建测试
npm run build
```

---

## 📄 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证，与上游 file-viewer 保持一致。

```
Copyright 2024 File Viewer Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 🙏 致谢

- [flyfish-dev/file-viewer](https://github.com/flyfish-dev/file-viewer) - 浏览器原生文件预览引擎
- [file-viewer-desktop](https://github.com/sixiang-world/file-viewer-desktop) - 姊妹仓库，Windows 桌面版
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF 渲染引擎
- [Three.js](https://threejs.org/) - 3D 渲染引擎

---

**如果这个项目对你有帮助，请给个 ⭐ Star 支持！**
