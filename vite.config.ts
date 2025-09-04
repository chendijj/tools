import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // GitHub Pages 部署配置
  // 如果部署到 GitHub Pages，请取消注释下面的 base 配置
  // base: '/json-converter/', // 替换为你的仓库名

  server: {
    port: 5174,
    open: true
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    // 确保资源路径正确
    assetsDir: 'assets'
  }
})
