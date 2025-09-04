# 部署指南

本文档详细介绍了如何将 JSON 转换工具部署到各种平台。

## 🚀 GitHub Pages 部署

### 前置要求
- GitHub 账户
- 项目已推送到 GitHub 仓库
- 仓库设置为公开（或 GitHub Pro 账户）

### 方法一：GitHub Actions 自动部署（推荐）

#### 1. 配置项目
确保 `vite.config.ts` 中的 base 路径正确：
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/json-converter/', // 替换为你的仓库名
  // 其他配置...
})
```

#### 2. 启用 GitHub Pages
1. 进入 GitHub 仓库页面
2. 点击 **Settings** 选项卡
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**

#### 3. 推送代码
```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

#### 4. 查看部署状态
- 进入仓库的 **Actions** 选项卡
- 查看 "Deploy to GitHub Pages" 工作流
- 部署完成后，访问 `https://username.github.io/json-converter/`

### 方法二：手动部署

#### 1. 配置 base 路径
```typescript
// vite.config.ts
export default defineConfig({
  base: '/json-converter/', // 你的仓库名
  // 其他配置...
})
```

#### 2. 构建项目
```bash
npm run build
```

#### 3. 部署到 gh-pages 分支
```bash
# 进入构建目录
cd dist

# 初始化 git 仓库
git init
git add -A
git commit -m 'deploy'

# 推送到 gh-pages 分支
git push -f https://github.com/username/json-converter.git main:gh-pages

# 返回项目根目录
cd ..
```

#### 4. 配置 GitHub Pages
1. 进入仓库 Settings > Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "gh-pages" / "(root)"
4. 点击 Save

### 方法三：使用 gh-pages 工具

#### 1. 安装 gh-pages
```bash
npm install --save-dev gh-pages
```

#### 2. 配置部署脚本
package.json 中已包含：
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### 3. 执行部署
```bash
npm run deploy
```

## 🌐 Vercel 部署

### 1. 连接 GitHub
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 选择你的 json-converter 仓库

### 2. 配置项目
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. 部署
点击 "Deploy" 按钮，Vercel 会自动构建和部署。

### 4. 自定义域名（可选）
在项目设置中可以添加自定义域名。

## 🔷 Netlify 部署

### 方法一：Git 集成
1. 访问 [netlify.com](https://netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub 并授权
4. 选择 json-converter 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 方法二：拖拽部署
1. 本地构建：`npm run build`
2. 将 `dist` 文件夹拖拽到 Netlify 部署区域

## 🐳 Docker 部署

### 1. 构建镜像
```bash
docker build -t json-converter .
```

### 2. 运行容器
```bash
docker run -p 80:80 json-converter
```

### 3. 使用 Docker Compose
```bash
docker-compose up -d
```

### 4. 访问应用
打开浏览器访问 `http://localhost`

## ☁️ 云平台部署

### AWS S3 + CloudFront
1. 创建 S3 存储桶
2. 启用静态网站托管
3. 上传 dist 文件夹内容
4. 配置 CloudFront 分发

### 阿里云 OSS
1. 创建 OSS 存储桶
2. 启用静态网站托管
3. 上传构建文件
4. 配置 CDN 加速

## 🔧 部署故障排除

### 常见问题

#### 1. 路径问题
**问题**: 页面加载但资源 404
**解决**: 检查 `vite.config.ts` 中的 `base` 配置

#### 2. 路由问题
**问题**: 刷新页面 404
**解决**: 配置服务器重定向到 index.html

#### 3. 构建失败
**问题**: GitHub Actions 构建失败
**解决**: 检查 Node.js 版本和依赖

#### 4. 权限问题
**问题**: GitHub Actions 部署失败
**解决**: 检查仓库的 Pages 权限设置

### 调试技巧

#### 1. 本地预览
```bash
npm run build
npm run preview
```

#### 2. 检查构建产物
```bash
ls -la dist/
```

#### 3. 查看部署日志
- GitHub Actions: Actions 选项卡
- Vercel: 项目仪表板
- Netlify: 部署日志

## 📊 性能优化

### 1. 启用 Gzip 压缩
大多数平台默认启用，Docker 部署需要配置 nginx。

### 2. 配置缓存
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
```

### 3. CDN 加速
使用 CloudFront、CloudFlare 等 CDN 服务。

## 🔒 安全配置

### 1. HTTPS 强制
大多数平台默认提供 HTTPS。

### 2. 安全头配置
nginx.conf 中已包含基本安全头。

### 3. CSP 策略
根据需要调整内容安全策略。

---

选择最适合你的部署方式，开始使用 JSON 转换工具吧！ 🎉
