<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import type { FileViewerFileRef, FileViewerPublicApi, FileViewerOptions } from '@file-viewer/core'

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
function zoomIn() {
  viewerRef.value?.zoomIn()
  updateZoom()
}

function zoomOut() {
  viewerRef.value?.zoomOut()
  updateZoom()
}

function resetZoom() {
  viewerRef.value?.resetZoom()
  zoomLevel.value = 100
}

function updateZoom() {
  const state = viewerRef.value?.getZoomState()
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
        <h1 class="welcome-title">File Viewer</h1>
        <p class="welcome-subtitle">离线文件查看器 · 无需服务器端转换</p>

        <div class="drop-zone" @click="triggerFileInput">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-7"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
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

.drop-zone svg {
  color: #94a3b8;
  margin-bottom: 16px;
}

.drop-zone:hover svg {
  color: #1f966e;
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  text-align: left;
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

  .formats-grid {
    grid-template-columns: 1fr;
  }

  .features {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
