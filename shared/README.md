# Tools Collection 主题框架使用指南

## 概述

这是一个统一的主题样式框架，为Tools Collection项目提供一致的UI设计和交互体验。包含明暗主题切换、响应式布局、通用组件样式等功能。

## 文件结构

```
shared/
├── theme.css      # 主题样式文件
├── theme.js       # 主题控制脚本
├── template.html  # 基础HTML模板
└── README.md      # 使用说明（本文件）
```

## 快速开始

### 1. 创建新工具页面

复制 `template.html` 到你的工具目录：

```bash
cp shared/template.html your-tool/index.html
```

### 2. 修改页面信息

```html
<!-- 修改标题 -->
<title>你的工具名称 - Tools Collection</title>

<!-- 修改图标和标题 -->
<span class="icon">📝</span>
<h1>你的工具名称</h1>
```

### 3. 添加具体功能

在 `<script>` 标签中添加你的业务逻辑，替换示例代码。

## CSS类和组件

### 基础容器类

- `.app-container` - 主应用容器
- `.header` - 顶部标题栏
- `.title-bar` - 标题栏内容
- `.theme-toggle` - 主题切换按钮

### 按钮样式

```html
<!-- 基础按钮 -->
<button class="tool-button">基础按钮</button>

<!-- 主要按钮 -->
<button class="tool-button primary">主要按钮</button>

<!-- 成功按钮 -->
<button class="tool-button success">成功按钮</button>

<!-- 危险按钮 -->
<button class="tool-button danger">危险按钮</button>
```

### 卡片组件

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">
            <span>📝</span>
            卡片标题
        </h3>
    </div>
    <div class="card-body">
        卡片内容
    </div>
</div>
```

### 工具栏

```html
<div class="toolbar">
    <div class="toolbar-content">
        <div class="toolbar-group">
            <!-- 左侧按钮组 -->
        </div>
        <div class="toolbar-group">
            <!-- 右侧按钮组 -->
        </div>
    </div>
</div>
```

### 表单控件

```html
<textarea class="form-control monospace"></textarea>
<input type="text" class="form-control">
```

### 布局网格

```html
<!-- 输入输出两列布局 -->
<div class="input-output-grid">
    <div class="card">...</div>
    <div class="card">...</div>
</div>

<!-- 统计信息网格 -->
<div class="stats-grid">
    <div class="stat-item">
        <div class="stat-number">123</div>
        <div class="stat-label">标签</div>
    </div>
</div>
```

## JavaScript API

### ThemeManager 类

```javascript
// 获取主题管理器实例
const themeManager = new ThemeManager();

// 切换主题
themeManager.toggleTheme();

// 获取当前主题
const currentTheme = themeManager.getCurrentTheme();

// 应用指定主题
themeManager.applyTheme('dark');
```

### ToastManager 类

```javascript
// 显示成功消息
ToastManager.success('操作成功！');

// 显示错误消息
ToastManager.error('操作失败！');

// 自定义显示时长
ToastManager.show('消息', 'success', 5000);
```

### Utils 工具类

```javascript
// 复制文本到剪贴板
const success = await Utils.copyToClipboard('要复制的文本');

// 下载文本文件
Utils.downloadTextFile('文件内容', 'filename.txt');

// 防抖函数
const debouncedFn = Utils.debounce(originalFunction, 300);

// 节流函数
const throttledFn = Utils.throttle(originalFunction, 1000);
```

## CSS变量（主题变量）

### 颜色变量

```css
/* 浅色主题 */
--bg-primary: #f5f5f5;      /* 主背景色 */
--bg-secondary: #ffffff;     /* 次要背景色 */
--bg-tertiary: #f8f9fa;     /* 第三背景色 */
--text-primary: #333333;     /* 主文字色 */
--text-secondary: #666666;   /* 次要文字色 */
--border-color: #e0e0e0;     /* 边框色 */
--accent-color: #007bff;     /* 强调色 */
--success-color: #28a745;    /* 成功色 */
--danger-color: #dc3545;     /* 危险色 */
```

### 尺寸和效果变量

```css
--border-radius: 8px;        /* 圆角大小 */
--shadow: 0 2px 10px rgba(0, 0, 0, 0.1);  /* 阴影效果 */
--transition: all 0.3s ease; /* 过渡效果 */
```

## 响应式断点

- **桌面端**: > 1200px
- **平板端**: 768px - 1200px  
- **移动端**: < 768px
- **小屏移动端**: < 480px

## 最佳实践

### 1. 文件组织

```
your-tool/
├── index.html          # 主页面
├── script.js          # 工具专有脚本（可选）
└── style.css          # 工具专有样式（可选）
```

### 2. 引入资源

```html
<!-- 必须引入 -->
<link rel="stylesheet" href="../shared/theme.css">
<script src="../shared/theme.js"></script>

<!-- 可选引入 -->
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
```

### 3. 事件绑定

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 在这里绑定事件，确保DOM已加载
});
```

### 4. 错误处理

```javascript
try {
    // 业务逻辑
} catch (error) {
    ToastManager.error('操作失败：' + error.message);
}
```

## 自定义扩展

### 添加新的CSS变量

```css
:root {
    --your-custom-color: #ff6b6b;
}

[data-theme="dark"] {
    --your-custom-color: #ff8e8e;
}
```

### 创建新的组件类

```css
.your-component {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 16px;
    transition: var(--transition);
}
```

## 常见问题

### Q: 如何禁用主题切换按钮？

A: 移除HTML中的主题切换按钮，或者添加CSS隐藏：

```css
.theme-toggle {
    display: none;
}
```

### Q: 如何自定义Toast的位置？

A: 修改CSS中的`.toast`类：

```css
.toast {
    top: 20px;    /* 距离顶部 */
    left: 20px;   /* 改为左侧显示 */
    right: auto;  /* 重置右侧位置 */
}
```

### Q: 如何添加更多统计项？

A: 在HTML中添加更多`.stat-item`元素，并在JavaScript中更新对应的值。

## 更新日志

- **v1.0.0** - 初始版本，包含基础主题系统
- 支持明暗主题切换
- 提供完整的组件库
- 响应式设计
- JavaScript工具类

## 贡献指南

如需改进主题框架，请：

1. 修改 `shared/` 目录中的文件
2. 更新所有使用该框架的工具页面
3. 更新本文档

---

通过这个主题框架，你可以快速创建具有一致UI风格的工具页面，专注于业务逻辑的实现。