import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // GitHub Pages 部署配置
  // 如果部署到 GitHub Pages，请取消注释下面的 base 配置
  base: '/tools/json-converter/', // 替换为你的仓库名和项目路径

  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5007,
    open: true
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    // 确保资源路径正确
    assetsDir: 'assets'
  }
})
