<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import type { FileViewerFileRef, FileViewerPublicApi, FileViewerOptions, FileViewerZoomState } from '@file-viewer/core'

// ── 状态 ──
const file = ref<FileViewerFileRef | undefined>()
const fileUrl = ref<string | undefined>()
const filename = ref('')
const fileSize = ref(0)
const isDragging = ref(false)
const viewerRef = ref<FileViewerPublicApi | null>(null)
const showWelcome = ref(true)
const zoomLevel = ref(100)
const searchQuery = ref('')
const showSearch = ref(false)
const searchResult = ref<{ current: number; total: number } | null>(null)

// 检测是否在 Electron 环境中
const isElectron = computed(() => {
  return typeof window !== 'undefined' && !!(window as any).fileViewerDesktop?.isElectron
})

// ── 文件格式支持列表 ──
const supportedFormats = [
  { category: '文档', extensions: ['PDF', 'DOC', 'DOCX', 'ODT', 'RTF', 'TXT', 'MD', 'OFD'] },
  { category: '表格', extensions: ['XLS', 'XLSX', 'CSV', 'ODS'] },
  { category: '演示', extensions: ['PPT', 'PPTX', 'ODP'] },
  { category: 'CAD', extensions: ['DWG', 'DXF', 'DWF'] },
  { category: '压缩包', extensions: ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'] },
  { category: '邮件', extensions: ['EML', 'MSG'] },
  { category: '图片', extensions: ['PNG', 'JPG', 'GIF', 'SVG', 'WebP', 'BMP'] },
  { category: '视频', extensions: ['MP4', 'WebM', 'MKV'] },
  { category: '音频', extensions: ['MP3', 'WAV', 'FLAC'] },
  { category: '3D模型', extensions: ['STL', 'OBJ', 'glTF', 'GLB'] },
  { category: '数据', extensions: ['JSON', 'XML', 'YAML'] }
]

// ── 工具函数 ──
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : ''
}

// ── 文件处理 ──
function openFile(fileObj: File) {
  if (!fileObj) return
  filename.value = fileObj.name
  fileSize.value = fileObj.size
  file.value = fileObj
  fileUrl.value = undefined
  showWelcome.value = false
  showSearch.value = false
  searchResult.value = null
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  const fileObj = target.files?.[0]
  if (fileObj) {
    openFile(fileObj)
  }
  target.value = ''
}

function triggerFileInput() {
  const input = document.getElementById('file-input') as HTMLInputElement
  input?.click()
}

// ── 拖拽处理 ──
let dragCounter = 0

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  dragCounter++
  if (event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
    dragCounter = 0
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  dragCounter = 0
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    openFile(files[0])
  }
}

// ── 查看器操作 ──
async function zoomIn() {
  const state = await viewerRef.value?.zoomIn()
  if (state?.scale) {
    zoomLevel.value = Math.round(state.scale * 100)
  }
}

async function zoomOut() {
  const state = await viewerRef.value?.zoomOut()
  if (state?.scale) {
    zoomLevel.value = Math.round(state.scale * 100)
  }
}

async function resetZoom() {
  const state = await viewerRef.value?.resetZoom()
  if (state?.scale) {
    zoomLevel.value = Math.round(state.scale * 100)
  } else {
    zoomLevel.value = 100
  }
}

function updateZoom(state: FileViewerZoomState) {
  if (state?.scale) {
    zoomLevel.value = Math.round(state.scale * 100)
  }
}

function fitToView() {
  viewerRef.value?.fitToView('contain')
}

function fitToWidth() {
  viewerRef.value?.fitToView('width')
}

async function performSearch() {
  if (!searchQuery.value.trim()) {
    clearSearch()
    return
  }
  const result = await viewerRef.value?.searchDocument(searchQuery.value)
  if (result) {
    searchResult.value = {
      current: result.currentIndex ?? 0,
      total: result.total ?? 0
    }
  }
}

function nextSearchResult() {
  viewerRef.value?.nextSearchResult()
}

function prevSearchResult() {
  viewerRef.value?.previousSearchResult()
}

function clearSearch() {
  viewerRef.value?.clearDocumentSearch()
  searchQuery.value = ''
  searchResult.value = null
}

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    clearSearch()
  }
}

function downloadFile() {
  viewerRef.value?.downloadOriginalFile()
}

function printFile() {
  viewerRef.value?.printWithMask()
}

function closeFile() {
  file.value = undefined
  fileUrl.value = undefined
  filename.value = ''
  fileSize.value = 0
  showWelcome.value = true
  showSearch.value = false
  searchResult.value = null
}

// ── Electron 集成 ──
function setupElectronIntegration() {
  const desktopApi = (window as any).fileViewerDesktop
  if (!desktopApi?.isElectron) return

  // 暴露全局方法
  ;(window as any).openFileViewerFile = (fileObj: File) => {
    if (fileObj) openFile(fileObj)
  }

  // 监听来自主进程的文件打开事件
  desktopApi.onFileOpen(async (files: Array<{ path: string; name: string }>) => {
    if (!files || files.length === 0) return
    const firstFile = files[0]
    try {
      const fileObj = await desktopApi.readFileAsFile(firstFile.path)
      if (fileObj) {
        openFile(fileObj)
      }
    } catch (err) {
      console.error('[Electron] Failed to open file:', err)
    }
  })
}

// ── URL 参数加载 ──
function loadFromUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const url = params.get('url')
  if (url) {
    // 加载远程 URL
    filename.value = decodeURIComponent(url.split('/').pop() || url)
    fileUrl.value = url
    file.value = undefined
    showWelcome.value = false
  }
}

// ── 生命周期 ──
onMounted(() => {
  // 添加全局拖拽事件
  window.addEventListener('dragenter', handleDragEnter)
  window.addEventListener('dragover', handleDragOver)
  window.addEventListener('dragleave', handleDragLeave)
  window.addEventListener('drop', handleDrop)

  // 设置 Electron 集成
  setupElectronIntegration()

  // 从 URL 参数加载
  loadFromUrlParams()
})

onBeforeUnmount(() => {
  window.removeEventListener('dragenter', handleDragEnter)
  window.removeEventListener('dragover', handleDragOver)
  window.removeEventListener('dragleave', handleDragLeave)
  window.removeEventListener('drop', handleDrop)
})

// 查看器配置
const viewerOptions = shallowRef<FileViewerOptions>({
  locale: 'zh-CN',
  theme: 'light'
})
</script>

<template>
  <div class="app-container" :class="{ 'drag-over': isDragging }">
    <!-- 顶部工具栏 -->
    <header class="toolbar" v-if="!showWelcome">
      <div class="toolbar-left">
        <button class="btn btn-icon" @click="closeFile" title="关闭文件">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="file-info">
          <span class="file-name" :title="filename">{{ filename }}</span>
          <span class="file-meta">{{ getFileExtension(filename) }} · {{ formatFileSize(fileSize) }}</span>
        </div>
      </div>

      <div class="toolbar-center">
        <div class="zoom-controls">
          <button class="btn btn-icon" @click="zoomOut" title="缩小">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/>
            </svg>
          </button>
          <button class="btn btn-text" @click="resetZoom" title="重置缩放">{{ zoomLevel }}%</button>
          <button class="btn btn-icon" @click="zoomIn" title="放大">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </button>
          <div class="divider"></div>
          <button class="btn btn-icon" @click="fitToWidth" title="适应宽度">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/>
            </svg>
          </button>
          <button class="btn btn-icon" @click="fitToView" title="适应页面">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="search-bar" v-if="showSearch">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索文档..."
            @keyup.enter="performSearch"
            class="search-input"
          />
          <button class="btn btn-icon btn-sm" @click="prevSearchResult" title="上一个">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
          <button class="btn btn-icon btn-sm" @click="nextSearchResult" title="下一个">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <span class="search-count" v-if="searchResult">{{ searchResult.current + 1 }}/{{ searchResult.total }}</span>
        </div>
        <button class="btn btn-icon" @click="toggleSearch" :class="{ active: showSearch }" title="搜索">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <button class="btn btn-icon" @click="downloadFile" title="下载">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-7M7 10l5 5 5-5M12 15V3"/>
          </svg>
        </button>
        <button class="btn btn-icon" @click="printFile" title="打印">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
          </svg>
        </button>
        <button class="btn btn-icon" @click="triggerFileInput" title="打开文件">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 隐藏的文件输入 -->
    <input
      id="file-input"
      type="file"
      class="hidden-input"
      @change="handleFileInput"
    />

    <!-- 欢迎页面 -->
    <div class="welcome-screen" v-if="showWelcome">
      <div class="welcome-content">
        <div class="welcome-logo">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h1 class="welcome-title">文件查看器</h1>
        <p class="welcome-subtitle">离线文件查看器 · 无需服务器端转换 · 支持 100+ 格式</p>

        <div class="drop-zone" @click="triggerFileInput">
          <div class="drop-icon-wrapper">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-7"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="drop-text">点击选择文件，或将文件拖放到此处</p>
          <p class="drop-hint">支持 Office、PDF、CAD、压缩包、邮件、图片、视频、音频、3D 模型等</p>
        </div>

        <div class="formats-grid">
          <div class="format-group" v-for="group in supportedFormats" :key="group.category">
            <div class="format-category">{{ group.category }}</div>
            <div class="format-tags">
              <span class="format-tag" v-for="ext in group.extensions" :key="ext">{{ ext }}</span>
            </div>
          </div>
        </div>

        <div class="features">
          <div class="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>完全离线 · 隐私安全</span>
          </div>
          <div class="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>本地解析 · 极速加载</span>
          </div>
          <div class="feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>100+ 格式支持</span>
          </div>
        </div>

        <div class="footer-links">
          <a href="https://github.com/sixiang-world/file-viewer-standalone" target="_blank" rel="noopener" class="footer-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>
          <span class="footer-divider">·</span>
          <span class="footer-version">v1.0.0</span>
          <span class="footer-divider">·</span>
          <span class="footer-credit">基于 flyfish-dev/file-viewer</span>
        </div>
      </div>
    </div>

    <!-- 文件查看器 -->
    <div class="viewer-container" v-if="!showWelcome">
      <file-viewer
        ref="viewerRef"
        :file="file"
        :url="fileUrl"
        :options="viewerOptions"
        @zoom-change="updateZoom"
        class="file-viewer"
      />
    </div>

    <!-- 拖拽遮罩 -->
    <div class="drag-overlay" v-if="isDragging">
      <div class="drag-overlay-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-7"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p>释放鼠标以打开文件</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f6f8f7;
  color: #172033;
  position: relative;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  display: flex;
  align-items: center;
}

.file-info {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.file-meta {
  font-size: 12px;
  color: #6b7b8f;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;
}

.btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.btn.active {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
}

.btn-sm {
  width: 26px;
  height: 26px;
}

.btn-text {
  min-width: 56px;
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 4px;
}

/* 缩放控制 */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: #f8fafc;
  border-radius: 8px;
}

/* 搜索 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 160px;
  padding: 4px 0;
}

.search-count {
  font-size: 12px;
  color: #6b7b8f;
  min-width: 40px;
  text-align: center;
}

/* 隐藏输入 */
.hidden-input {
  display: none;
}

/* 欢迎页面 */
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 20px;
}

.welcome-content {
  max-width: 720px;
  width: 100%;
  text-align: center;
}

.welcome-logo {
  width: 96px;
  height: 96px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #1f966e 0%, #0d7a55 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 40px rgba(31, 150, 110, 0.3);
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #172033;
}

.welcome-subtitle {
  font-size: 16px;
  color: #6b7b8f;
  margin-bottom: 32px;
}

/* 拖拽区域 */
.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 48px 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  margin-bottom: 32px;
}

.drop-zone:hover {
  border-color: #1f966e;
  background: #f0fdf4;
}

.drop-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.drop-zone:hover .drop-icon-wrapper {
  background: linear-gradient(135deg, #1f966e 0%, #0d7a55 100%);
  transform: scale(1.05);
}

.drop-zone:hover .drop-icon-wrapper svg {
  color: white;
}

.drop-zone svg {
  color: #1f966e;
  transition: color 0.2s ease;
}

.drop-text {
  font-size: 16px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}

.drop-hint {
  font-size: 13px;
  color: #94a3b8;
}

/* 格式网格 */
.formats-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  text-align: left;
}

.formats-grid > * {
  flex: 0 0 calc(33.333% - 11px);
  min-width: 180px;
  max-width: 240px;
}

.format-group {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.format-category {
  font-size: 13px;
  font-weight: 600;
  color: #1f966e;
  margin-bottom: 10px;
}

.format-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.format-tag {
  font-size: 11px;
  padding: 3px 8px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-weight: 500;
}

/* 特性 */
.features {
  display: flex;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
}

.feature svg {
  color: #1f966e;
}

/* 底部链接 */
.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: #1f966e;
}

.footer-divider {
  color: #cbd5e1;
  font-size: 12px;
}

.footer-version {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.footer-credit {
  font-size: 12px;
  color: #94a3b8;
}

/* 查看器容器 */
.viewer-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.file-viewer {
  width: 100%;
  height: 100%;
}

/* 拖拽遮罩 */
.drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(31, 150, 110, 0.1);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border: 3px dashed #1f966e;
}

.drag-overlay-content {
  text-align: center;
  color: #1f966e;
}

.drag-overlay-content svg {
  margin-bottom: 16px;
}

.drag-overlay-content p {
  font-size: 18px;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-center {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .file-name {
    max-width: 150px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .formats-grid > * {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .features {
    flex-direction: column;
    gap: 12px;
  }

  .footer-links {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 1024px) {
  .formats-grid > * {
    flex: 0 0 calc(50% - 8px);
  }
}
</style>
