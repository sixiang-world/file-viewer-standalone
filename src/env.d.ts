/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron 桌面 API 类型声明
interface FileViewerDesktopAPI {
  isElectron: boolean
  platform: string
  readFile: (filePath: string) => Promise<{
    success: boolean
    data?: Uint8Array
    name?: string
    size?: number
    error?: string
  }>
  getFileInfo: (filePath: string) => Promise<{
    success: boolean
    path?: string
    name?: string
    extension?: string
    size?: number
    lastModified?: number
    created?: number
    error?: string
  }>
  openFileDialog: () => Promise<{
    canceled: boolean
    filePaths: string[]
  }>
  showInFolder: (filePath: string) => void
  onFileOpen: (callback: (files: Array<{
    path: string
    name: string
    extension: string
    size: number
    lastModified: number
  }>) => void) => () => void
  onceFileOpen: (callback: (files: any[]) => void) => void
  pathToUrl: (filePath: string) => string
  readFileAsFile: (filePath: string) => Promise<File | null>
}

interface Window {
  fileViewerDesktop?: FileViewerDesktopAPI
  openFileViewerFile?: (file: File) => void
}
