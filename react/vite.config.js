import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'myObsidian'
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: `@import "${path.resolve(__dirname, 'src/assets/base.less')}";`
      }
    }
  },
  server: {
    proxy: {
      '/memos': {
        target: 'http://127.0.0.1:3033',
        changeOrigin: true
      }
    }
  }
})
