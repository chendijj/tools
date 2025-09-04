# GitHub Pages 部署指南

本指南将帮助您将时间戳转换工具部署到GitHub Pages。

## 📋 部署前准备

1. **GitHub账户**: 确保您有一个GitHub账户
2. **Git工具**: 在本地安装Git
3. **项目文件**: 确保所有项目文件都已准备就绪

## 🚀 部署步骤

### 步骤1: 创建GitHub仓库

1. 登录GitHub
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `timestamp-converter`
   - Description: `一个简洁、功能强大的在线时间戳转换工具`
   - 选择 "Public"（GitHub Pages免费版需要公开仓库）
   - 勾选 "Add a README file"
4. 点击 "Create repository"

### 步骤2: 上传项目文件

#### 方法A: 使用Git命令行

```bash
# 克隆仓库到本地
git clone https://github.com/your-username/timestamp-converter.git
cd timestamp-converter

# 复制项目文件到仓库目录
# 将本项目的所有文件复制到克隆的仓库目录中

# 添加文件到Git
git add .

# 提交更改
git commit -m "Initial commit: Add timestamp converter tool"

# 推送到GitHub
git push origin main
```

#### 方法B: 使用GitHub网页界面

1. 在GitHub仓库页面点击 "uploading an existing file"
2. 拖拽或选择项目文件上传
3. 填写提交信息
4. 点击 "Commit changes"

### 步骤3: 启用GitHub Pages

1. 进入仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch: 选择 "main"
   - Folder: 选择 "/ (root)"
5. 点击 "Save"

### 步骤4: 等待部署完成

- GitHub会自动构建和部署您的网站
- 通常需要几分钟时间
- 部署完成后，您会看到一个绿色的勾号和网站URL

## 🌐 访问您的网站

部署完成后，您的网站将在以下地址可用：
```
https://your-username.github.io/timestamp-converter/
```

## 🔧 自定义域名（可选）

如果您有自己的域名，可以配置自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入您的域名，例如：`timestamp.yourdomain.com`
3. 在您的域名DNS设置中添加CNAME记录，指向 `your-username.github.io`

## 📝 更新网站

要更新网站内容：

1. 修改本地文件
2. 提交并推送更改到GitHub：
```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```
3. GitHub Pages会自动重新部署

## 🛠️ 故障排除

### 常见问题

1. **404错误**: 
   - 检查文件路径是否正确
   - 确保 `index.html` 在根目录

2. **样式不显示**:
   - 检查CSS文件路径
   - 确保所有文件都已上传

3. **JavaScript不工作**:
   - 检查浏览器控制台错误
   - 确保script.js文件路径正确

4. **部署失败**:
   - 检查GitHub Actions页面的错误日志
   - 确保所有文件格式正确

### 调试技巧

1. 使用浏览器开发者工具检查错误
2. 查看GitHub Actions的构建日志
3. 确保所有文件都使用UTF-8编码

## 📊 性能优化建议

1. **压缩文件**: 使用工具压缩CSS和JavaScript文件
2. **图片优化**: 如果添加图片，使用适当的格式和大小
3. **缓存策略**: GitHub Pages自动处理缓存
4. **CDN**: GitHub Pages已经使用CDN加速

## 🔒 安全注意事项

1. 不要在代码中包含敏感信息
2. 定期更新依赖项（如果有的话）
3. 使用HTTPS（GitHub Pages默认启用）

## 📈 监控和分析

可以集成以下服务来监控网站：

1. **Google Analytics**: 添加跟踪代码
2. **GitHub Insights**: 查看仓库访问统计
3. **Uptime监控**: 使用第三方服务监控网站可用性

## 🎯 下一步

部署完成后，您可以：

1. 分享网站链接给朋友
2. 在社交媒体上推广
3. 收集用户反馈并改进功能
4. 考虑添加更多功能

## 📞 获取帮助

如果遇到问题：

1. 查看GitHub Pages官方文档
2. 在项目仓库提交Issue
3. 搜索相关的Stack Overflow问题
4. 联系GitHub支持

---

🎉 恭喜！您的时间戳转换工具现在已经在线可用了！
