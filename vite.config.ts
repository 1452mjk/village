import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ElementPlus from 'unplugin-element-plus/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    ElementPlus({
      // options
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 关键配置
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})