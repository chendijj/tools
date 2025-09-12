/**
 * 基础主题控制框架 - Tools Collection Theme
 * 提供明暗主题切换功能和通用工具函数
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    /**
     * 初始化主题
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.updateThemeIcon();
    }

    /**
     * 应用主题
     * @param {string} theme - 主题名称 ('light' 或 'dark')
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.updateThemeIcon();
    }

    /**
     * 更新主题切换按钮图标
     */
    updateThemeIcon() {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    /**
     * 获取当前主题
     * @returns {string} 当前主题名称
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
}

/**
 * Toast通知管理器
 */
class ToastManager {
    /**
     * 显示Toast通知
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success' 或 'error')
     * @param {number} duration - 显示时长（毫秒），默认3000ms
     */
    static show(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.warn('Toast element not found. Make sure there is an element with id="toast"');
            return;
        }

        toast.textContent = message;
        toast.className = 'toast show';
        
        if (type === 'error') {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     */
    static success(message) {
        this.show(message, 'success');
    }

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     */
    static error(message) {
        this.show(message, 'error');
    }
}

/**
 * 工具函数集合
 */
class Utils {
    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>} 复制是否成功
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降级方案
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                const result = document.execCommand('copy');
                document.body.removeChild(textarea);
                return result;
            } catch (fallbackErr) {
                console.error('Failed to copy text:', fallbackErr);
                return false;
            }
        }
    }

    /**
     * 下载文本文件
     * @param {string} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型，默认为text/plain
     */
    static downloadTextFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} delay - 节流时间间隔（毫秒）
     * @returns {Function} 节流后的函数
     */
    static throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    }
}

// 全局实例
let themeManager;
window.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
});

// 全局函数（保持向后兼容）
function toggleTheme() {
    if (themeManager) {
        themeManager.toggleTheme();
    }
}

function showToast(message, type = 'success') {
    ToastManager.show(message, type);
}

// 导出（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeManager,
        ToastManager,
        Utils
    };
}