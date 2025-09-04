# 时间戳转换工具

一个简洁、功能强大的在线时间戳转换工具，支持多种时间精度和时区转换。

## 🌟 功能特性

- **多精度支持**: 支持纳秒、毫秒、秒三种时间精度
- **多时区支持**: 支持全球主要时区的时间转换
- **双向转换**: 
  - 日期时间 → 时间戳
  - 时间戳 → 日期时间
- **实时时间戳**: 显示当前时间戳，支持暂停和刷新
- **主题切换**: 支持明暗主题切换
- **一键复制**: 转换结果一键复制到剪贴板
- **响应式设计**: 完美适配桌面和移动设备
- **输入验证**: 智能输入验证和错误提示

## 🚀 在线体验

访问 [GitHub Pages 部署地址](https://your-username.github.io/timestamp-converter/) 立即体验

## 📱 界面预览

工具界面简洁美观，模仿桌面应用程序的设计风格：

- 顶部标题栏带有窗口控制按钮
- 时间精度选择器（纳秒/毫秒/秒）
- 时区选择下拉菜单
- 日期转时间戳转换区域
- 时间戳转日期转换区域
- 实时当前时间戳显示

## 🛠️ 技术栈

- **HTML5**: 语义化结构
- **CSS3**: 现代样式设计，支持CSS变量和暗色主题
- **Vanilla JavaScript**: 原生JavaScript，无依赖
- **响应式设计**: 适配各种屏幕尺寸

## 📦 本地运行

1. 克隆仓库：
```bash
git clone https://github.com/your-username/timestamp-converter.git
cd timestamp-converter
```

2. 使用任意HTTP服务器运行：
```bash
# 使用Python
python -m http.server 8000

# 使用Node.js
npx serve .

# 或直接在浏览器中打开 index.html
```

3. 在浏览器中访问 `http://localhost:8000`

## 🌐 GitHub Pages 部署

1. Fork 此仓库到你的GitHub账户
2. 进入仓库设置 (Settings)
3. 滚动到 "Pages" 部分
4. 在 "Source" 下选择 "Deploy from a branch"
5. 选择 "main" 分支和 "/ (root)" 文件夹
6. 点击 "Save"
7. 等待几分钟后，你的网站将在 `https://your-username.github.io/timestamp-converter/` 可用

## 📋 使用说明

### 时间精度选择
- **纳秒**: 精确到纳秒级别（模拟实现）
- **毫秒**: 精确到毫秒级别
- **秒**: 精确到秒级别（默认）

### 时区支持

支持全球完整时区范围（UTC-12 到 UTC+13）：

**负时区 (UTC-12 到 UTC-1)**:
- UTC-12:00 | 夸贾林
- UTC-11:00 | 中途岛
- UTC-10:00 | 檀香山
- UTC-09:00 | 安克雷奇
- UTC-08:00 | 洛杉矶
- UTC-07:00 | 丹佛
- UTC-06:00 | 芝加哥
- UTC-05:00 | 纽约
- UTC-04:00 | 加拉加斯
- UTC-03:00 | 圣保罗
- UTC-02:00 | 费尔南多
- UTC-01:00 | 亚速尔

**零时区和正时区 (UTC+0 到 UTC+13)**:
- UTC+00:00 | UTC
- UTC+00:00 | 伦敦
- UTC+01:00 | 巴黎
- UTC+02:00 | 雅典
- UTC+03:00 | 莫斯科
- UTC+04:00 | 迪拜
- UTC+05:00 | 卡拉奇
- UTC+06:00 | 达卡
- UTC+07:00 | 曼谷
- UTC+08:00 | 北京（默认）
- UTC+09:00 | 东京
- UTC+10:00 | 悉尼
- UTC+11:00 | 努美阿
- UTC+12:00 | 奥克兰
- UTC+13:00 | 努库阿洛法

### 转换功能
1. **日期转时间戳**: 选择日期时间，点击转换按钮
2. **时间戳转日期**: 输入时间戳数值，点击转换按钮
3. **复制结果**: 点击结果旁边的复制按钮

### 实时时间戳
- 自动更新当前时间戳
- 点击暂停按钮可暂停更新
- 点击刷新按钮可重置并继续更新

## 🎨 主题切换

点击右上角的主题切换按钮可在明暗主题间切换，主题偏好会自动保存到本地存储。

## 🔧 自定义配置

你可以通过修改以下文件来自定义工具：

- `styles.css`: 修改样式和主题
- `script.js`: 修改功能逻辑
- `index.html`: 修改页面结构

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/your-username/timestamp-converter/issues)
- Email: your-email@example.com

---

⭐ 如果这个工具对你有帮助，请给个星标支持一下！
