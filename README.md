# JSON 转换工具

一个功能强大、界面美观的在线 JSON 转换工具，支持多种格式转换和数据处理功能。

## 🚀 功能特性

### 核心功能
- **JSON 格式化** - 美化 JSON 数据，提高可读性
- **JSON 压缩** - 移除空格和换行，减小文件大小
- **JSON 转义** - 将 JSON 转换为转义字符串格式
- **注释移除** - 清理 JSON 中的注释内容
- **XML 转换** - 将 JSON 数据转换为 XML 格式
- **TypeScript 接口生成** - 根据 JSON 结构生成 TypeScript 类型定义

### 用户体验
- **实时转换** - 输入即时转换，无需手动触发
- **错误提示** - 智能错误检测和友好提示信息
- **历史记录** - 支持撤销/重做操作
- **一键复制** - 快速复制转换结果
- **示例数据** - 内置示例数据，快速上手
- **响应式设计** - 完美适配桌面和移动设备

## 🛠️ 技术栈

### 前端框架
- **React 18** - 现代化的前端框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的构建工具和开发服务器

### 样式方案
- **Tailwind CSS** - 实用优先的 CSS 框架
- **PostCSS** - CSS 后处理器
- **自定义动画** - 流畅的交互动画效果

### 开发工具
- **ESLint** - 代码质量检查
- **TypeScript Compiler** - 类型检查和编译
- **Vite HMR** - 热模块替换，提升开发体验

## 📦 项目结构

```
json-converter/
├── src/
│   ├── App.tsx          # 主应用组件（包含所有功能）
│   ├── index.css        # 全局样式和 Tailwind 配置
│   ├── main.tsx         # 应用入口文件
│   └── vite-env.d.ts    # Vite 环境类型定义
├── public/              # 静态资源目录
├── package.json         # 项目依赖和脚本配置
├── vite.config.ts       # Vite 构建配置
├── tailwind.config.js   # Tailwind CSS 配置
├── postcss.config.js    # PostCSS 配置
├── tsconfig.json        # TypeScript 配置
├── eslint.config.js     # ESLint 代码规范配置
└── index.html           # HTML 模板
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 或使用 yarn
yarn dev
```

访问 `http://localhost:5174` 查看应用

### 构建生产版本
```bash
# 构建生产版本
npm run build

# 或使用 yarn
yarn build
```

构建文件将输出到 `dist/` 目录

### 预览生产版本
```bash
# 预览构建结果
npm run preview

# 或使用 yarn
yarn preview
```

## 🔧 配置说明

### Vite 配置 (vite.config.ts)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Tailwind 配置 (tailwind.config.js)
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
```

## 📱 使用指南

### 基本操作
1. **输入 JSON 数据** - 在左侧输入框中粘贴或输入 JSON 数据
2. **选择转换类型** - 点击工具栏中的相应按钮
3. **查看结果** - 转换结果将实时显示在右侧输出框
4. **复制结果** - 点击"复制"按钮将结果复制到剪贴板

### 功能详解

#### JSON 格式化
- 自动缩进和换行
- 语法高亮显示
- 错误位置提示

#### JSON 压缩
- 移除所有空白字符
- 最小化文件大小
- 保持数据完整性

#### 转义功能
- 转换特殊字符
- 生成可嵌入的字符串
- 支持多种编程语言格式

#### XML 转换
- 智能结构映射
- 保持数据层次
- 符合 XML 标准

#### TypeScript 接口
- 自动类型推断
- 生成标准接口定义
- 支持嵌套对象和数组

## 🎨 界面特色

### 设计理念
- **简洁美观** - 现代化的界面设计
- **用户友好** - 直观的操作流程
- **响应式** - 适配各种屏幕尺寸

### 视觉效果
- **渐变背景** - 优雅的色彩过渡
- **毛玻璃效果** - 现代化的视觉层次
- **流畅动画** - 提升交互体验
- **阴影效果** - 增强界面层次感

## 🔍 技术实现

### 核心算法
- **JSON 解析** - 使用原生 JSON.parse/stringify
- **错误处理** - 完善的异常捕获机制
- **实时转换** - 防抖技术优化性能
- **历史管理** - 基于数组的撤销/重做实现

### 性能优化
- **防抖处理** - 避免频繁的转换操作
- **内存管理** - 及时清理无用数据
- **懒加载** - 按需加载功能模块
- **代码分割** - 优化打包体积

### 代码架构
- **单文件组件** - 所有功能集中在 App.tsx
- **函数式编程** - 使用 React Hooks
- **TypeScript 严格模式** - 确保类型安全
- **模块化设计** - 功能清晰分离

## 🚀 部署指南

### 静态部署
项目构建后生成的 `dist/` 目录可以部署到任何静态文件服务器：

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署到 Vercel
vercel --prod
```

#### Netlify 部署 
```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署到 Netlify
netlify deploy --prod --dir=dist
```

#### GitHub Pages 部署

##### 方法一：手动部署
1. **配置 base 路径**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/json-converter/', // 替换为你的仓库名
     build: {
       outDir: 'dist'
     }
   })
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **部署到 GitHub Pages**
   ```bash
   # 进入构建目录
   cd dist

   # 初始化 git 仓库
   git init
   git add -A
   git commit -m 'deploy'

   # 推送到 gh-pages 分支
   git push -f git@github.com:username/json-converter.git main:gh-pages

   # 返回项目根目录
   cd ..
   ```

##### 方法二：使用 GitHub Actions 自动部署
1. **创建 GitHub Actions 工作流**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
       - name: Checkout
         uses: actions/checkout@v3

       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           cache: 'npm'

       - name: Install dependencies
         run: npm ci

       - name: Build
         run: npm run build

       - name: Deploy to GitHub Pages
         uses: peaceiris/actions-gh-pages@v3
         if: github.ref == 'refs/heads/main'
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./dist
   ```

2. **配置 GitHub Pages**
   - 进入仓库的 Settings > Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "gh-pages"
   - 点击 Save

##### 方法三：使用 gh-pages 工具
1. **安装 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **添加部署脚本**
   ```json
   // package.json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **执行部署**
   ```bash
   npm run deploy
   ```

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

