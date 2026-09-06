import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 使用相对路径，支持 file:// 协议直接打开
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    global: 'globalThis'
  },
  build: {
    outDir: 'dist',
    // 关闭模块预加载，避免 file:// 协议下的 CORS 问题
    modulePreload: false,
    rollupOptions: {
      output: {
        // 手动分包，优化加载
        manualChunks: {
          'vue-vendor': ['vue'],
          'file-viewer-core': ['@file-viewer/core'],
          'file-viewer-vue': ['@file-viewer/vue3-full']
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  optimizeDeps: {
    // 排除需要动态加载 WASM/Worker 的包
    exclude: ['@file-viewer/pptx']
  }
})
