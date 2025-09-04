// 时间戳转换器主要功能
class TimestampConverter {
    constructor() {
        this.currentPrecision = 'second'; // 默认精度为秒
        this.currentTimezone = 'Asia/Shanghai'; // 默认时区为北京时间
        this.isTimestampPaused = false;
        this.timestampInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.startTimestampUpdate();
        this.updateCurrentTimestamp();
        this.initTheme();
    }

    // 绑定事件监听器
    bindEvents() {
        // 精度选择按钮
        document.querySelectorAll('.precision-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPrecision(e.target.dataset.precision);
            });
        });

        // 时区选择
        document.getElementById('timezone-select').addEventListener('change', (e) => {
            this.setTimezone(e.target.value);
        });

        // 日期转时间戳
        document.getElementById('date-to-timestamp').addEventListener('click', () => {
            this.convertDateToTimestamp();
        });

        // 时间戳转日期
        document.getElementById('timestamp-to-date').addEventListener('click', () => {
            this.convertTimestampToDate();
        });

        // 当前时间戳控制
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.toggleTimestampUpdate();
        });

        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshTimestamp();
        });

        // 复制功能
        document.getElementById('copy-timestamp').addEventListener('click', () => {
            this.copyToClipboard('timestamp-output');
        });

        document.getElementById('copy-date').addEventListener('click', () => {
            this.copyToClipboard('date-output');
        });

        // 主题切换
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 时区信息按钮
        document.querySelector('.info-btn').addEventListener('click', () => {
            this.showTimezoneInfo();
        });

        // 输入框回车键支持
        document.getElementById('date-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertDateToTimestamp();
        });

        document.getElementById('time-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertDateToTimestamp();
        });

        document.getElementById('timestamp-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertTimestampToDate();
        });

        // 快捷操作：点击当前时间戳复制
        document.getElementById('current-timestamp').addEventListener('click', () => {
            this.copyCurrentTimestamp();
        });

        // 自动转换功能（输入时实时转换）
        let timestampInputTimeout;
        document.getElementById('timestamp-input').addEventListener('input', (e) => {
            clearTimeout(timestampInputTimeout);
            timestampInputTimeout = setTimeout(() => {
                if (e.target.value.trim()) {
                    this.convertTimestampToDate();
                }
            }, 500);
        });

        // 快速填入当前时间戳
        document.getElementById('timestamp-input').addEventListener('focus', (e) => {
            if (!e.target.value.trim()) {
                e.target.placeholder = `例如: ${this.getCurrentTimestamp()}`;
            }
        });

        // 快速操作按钮
        document.getElementById('fill-current-timestamp').addEventListener('click', () => {
            this.fillCurrentTimestamp();
        });

        document.getElementById('fill-current-date').addEventListener('click', () => {
            this.fillCurrentDate();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAllInputs();
        });
    }

    // 设置时间精度
    setPrecision(precision) {
        this.currentPrecision = precision;
        
        // 更新按钮状态
        document.querySelectorAll('.precision-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-precision="${precision}"]`).classList.add('active');
        
        // 更新当前时间戳显示
        this.updateCurrentTimestamp();
    }

    // 设置时区
    setTimezone(timezone) {
        this.currentTimezone = timezone;
        this.updateCurrentTimestamp();
        this.updateTimezoneLabels();
    }

    // 更新时区标签
    updateTimezoneLabels() {
        const timezoneNames = {
            // UTC-12 到 UTC-1
            'Pacific/Kwajalein': '夸贾林',
            'Pacific/Midway': '中途岛',
            'Pacific/Honolulu': '檀香山',
            'America/Anchorage': '安克雷奇',
            'America/Los_Angeles': '洛杉矶',
            'America/Denver': '丹佛',
            'America/Chicago': '芝加哥',
            'America/New_York': '纽约',
            'America/Caracas': '加拉加斯',
            'America/Sao_Paulo': '圣保罗',
            'America/Noronha': '费尔南多',
            'Atlantic/Azores': '亚速尔',

            // UTC+0 到 UTC+13
            'UTC': 'UTC',
            'Europe/London': '伦敦',
            'Europe/Paris': '巴黎',
            'Europe/Athens': '雅典',
            'Europe/Moscow': '莫斯科',
            'Asia/Dubai': '迪拜',
            'Asia/Karachi': '卡拉奇',
            'Asia/Dhaka': '达卡',
            'Asia/Bangkok': '曼谷',
            'Asia/Shanghai': '北京',
            'Asia/Tokyo': '东京',
            'Australia/Sydney': '悉尼',
            'Pacific/Noumea': '努美阿',
            'Pacific/Auckland': '奥克兰',
            'Pacific/Tongatapu': '努库阿洛法'
        };

        const timezoneName = timezoneNames[this.currentTimezone] || '北京';
        document.querySelectorAll('.converter-section h2').forEach(h2 => {
            if (h2.textContent.includes('→')) {
                h2.textContent = h2.textContent.replace(/\([^)]+\)/, `(${timezoneName})`);
            }
        });
    }

    // 获取当前时间戳
    getCurrentTimestamp() {
        const now = new Date();
        switch (this.currentPrecision) {
            case 'nanosecond':
                return Math.floor(now.getTime() * 1000000); // 纳秒 (模拟)
            case 'millisecond':
                return now.getTime(); // 毫秒
            case 'second':
            default:
                return Math.floor(now.getTime() / 1000); // 秒
        }
    }

    // 更新当前时间戳显示
    updateCurrentTimestamp() {
        if (!this.isTimestampPaused) {
            const timestamp = this.getCurrentTimestamp();
            document.getElementById('current-timestamp').textContent = timestamp;
            
            // 更新当前日期显示
            const now = new Date();
            const options = {
                timeZone: this.currentTimezone,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            
            const formatter = new Intl.DateTimeFormat('zh-CN', options);
            document.getElementById('current-date').textContent = formatter.format(now);
        }
    }

    // 开始时间戳更新
    startTimestampUpdate() {
        this.timestampInterval = setInterval(() => {
            this.updateCurrentTimestamp();
        }, 1000);
    }

    // 切换时间戳更新状态
    toggleTimestampUpdate() {
        this.isTimestampPaused = !this.isTimestampPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isTimestampPaused) {
            pauseBtn.textContent = '▶';
            pauseBtn.title = '继续';
        } else {
            pauseBtn.textContent = '⏸';
            pauseBtn.title = '暂停';
        }
    }

    // 刷新时间戳
    refreshTimestamp() {
        this.isTimestampPaused = false;
        document.getElementById('pause-btn').textContent = '⏸';
        document.getElementById('pause-btn').title = '暂停';
        this.updateCurrentTimestamp();
    }

    // 日期转时间戳
    convertDateToTimestamp() {
        const dateInput = document.getElementById('date-input');
        const timeInput = document.getElementById('time-input');
        const timestampOutput = document.getElementById('timestamp-output');

        if (!dateInput.value) {
            this.showError(dateInput, '请选择日期');
            return;
        }

        try {
            // 组合日期和时间
            const dateValue = dateInput.value;
            const timeValue = timeInput.value || '00:00:00';
            const dateTimeString = `${dateValue}T${timeValue}`;

            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) {
                throw new Error('无效的日期时间格式');
            }

            let timestamp;
            switch (this.currentPrecision) {
                case 'nanosecond':
                    timestamp = Math.floor(date.getTime() * 1000000);
                    break;
                case 'millisecond':
                    timestamp = date.getTime();
                    break;
                case 'second':
                default:
                    timestamp = Math.floor(date.getTime() / 1000);
                    break;
            }

            timestampOutput.textContent = timestamp;
            this.clearError(dateInput);
            this.clearError(timeInput);
        } catch (error) {
            this.showError(dateInput, error.message);
        }
    }

    // 时间戳转日期
    convertTimestampToDate() {
        const timestampInput = document.getElementById('timestamp-input');
        const dateOutput = document.getElementById('date-output');
        
        if (!timestampInput.value.trim()) {
            this.showError(timestampInput, '请输入时间戳');
            return;
        }

        try {
            let timestamp = parseInt(timestampInput.value.trim());
            if (isNaN(timestamp)) {
                throw new Error('无效的时间戳格式');
            }

            let date;
            switch (this.currentPrecision) {
                case 'nanosecond':
                    date = new Date(timestamp / 1000000);
                    break;
                case 'millisecond':
                    date = new Date(timestamp);
                    break;
                case 'second':
                default:
                    date = new Date(timestamp * 1000);
                    break;
            }

            if (isNaN(date.getTime())) {
                throw new Error('时间戳超出有效范围');
            }

            const options = {
                timeZone: this.currentTimezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };

            const formatter = new Intl.DateTimeFormat('zh-CN', options);
            dateOutput.textContent = formatter.format(date);
            this.clearError(timestampInput);
        } catch (error) {
            this.showError(timestampInput, error.message);
        }
    }

    // 复制到剪贴板
    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.textContent;

        if (text === '-') {
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showCopySuccess(element);
        } catch (error) {
            // 降级方案
            this.fallbackCopyToClipboard(text);
            this.showCopySuccess(element);
        }
    }

    // 复制当前时间戳
    async copyCurrentTimestamp() {
        const currentTimestamp = document.getElementById('current-timestamp');
        const text = currentTimestamp.textContent;

        try {
            await navigator.clipboard.writeText(text);
            // 显示复制成功提示
            const originalText = currentTimestamp.textContent;
            currentTimestamp.style.color = 'var(--success-color)';
            currentTimestamp.textContent = '已复制!';

            setTimeout(() => {
                currentTimestamp.style.color = 'var(--accent-color)';
                currentTimestamp.textContent = originalText;
            }, 1000);
        } catch (error) {
            this.fallbackCopyToClipboard(text);
        }
    }

    // 降级复制方案
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    // 显示复制成功
    showCopySuccess(element) {
        const copyBtn = element.parentElement.querySelector('.copy-btn');
        copyBtn.classList.add('copy-success');
        copyBtn.textContent = '✓';
        
        setTimeout(() => {
            copyBtn.classList.remove('copy-success');
            copyBtn.textContent = '📋';
        }, 1000);
    }

    // 显示错误
    showError(input, message) {
        input.classList.add('error');
        
        // 移除已存在的错误消息
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 添加错误消息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentElement.appendChild(errorDiv);
        
        // 3秒后自动清除错误
        setTimeout(() => {
            this.clearError(input);
        }, 3000);
    }

    // 清除错误
    clearError(input) {
        input.classList.remove('error');
        const errorMessage = input.parentElement.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // 显示时区信息
    showTimezoneInfo() {
        const now = new Date();

        // 获取当前时区的详细信息
        const formatter = new Intl.DateTimeFormat('zh-CN', {
            timeZone: this.currentTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'long'
        });

        const currentTime = formatter.format(now);
        const offset = this.getTimezoneOffset(this.currentTimezone);

        const timezoneNames = {
            // UTC-12 到 UTC-1
            'Pacific/Kwajalein': '夸贾林',
            'Pacific/Midway': '中途岛',
            'Pacific/Honolulu': '檀香山',
            'America/Anchorage': '安克雷奇',
            'America/Los_Angeles': '洛杉矶',
            'America/Denver': '丹佛',
            'America/Chicago': '芝加哥',
            'America/New_York': '纽约',
            'America/Caracas': '加拉加斯',
            'America/Sao_Paulo': '圣保罗',
            'America/Noronha': '费尔南多',
            'Atlantic/Azores': '亚速尔',

            // UTC+0 到 UTC+13
            'UTC': 'UTC',
            'Europe/London': '伦敦',
            'Europe/Paris': '巴黎',
            'Europe/Athens': '雅典',
            'Europe/Moscow': '莫斯科',
            'Asia/Dubai': '迪拜',
            'Asia/Karachi': '卡拉奇',
            'Asia/Dhaka': '达卡',
            'Asia/Bangkok': '曼谷',
            'Asia/Shanghai': '北京',
            'Asia/Tokyo': '东京',
            'Australia/Sydney': '悉尼',
            'Pacific/Noumea': '努美阿',
            'Pacific/Auckland': '奥克兰',
            'Pacific/Tongatapu': '努库阿洛法'
        };

        const timezoneName = timezoneNames[this.currentTimezone] || this.currentTimezone;

        const infoText = `时区信息：\n\n` +
                        `时区：${timezoneName}\n` +
                        `标识符：${this.currentTimezone}\n` +
                        `UTC偏移：${offset}\n` +
                        `当前时间：${currentTime}`;

        alert(infoText);
    }

    // 获取时区偏移
    getTimezoneOffset(timezone) {
        const now = new Date();
        const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        const targetTime = new Date(utc.toLocaleString("en-US", {timeZone: timezone}));
        const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);

        const sign = offset >= 0 ? '+' : '-';
        const hours = Math.floor(Math.abs(offset));
        const minutes = Math.round((Math.abs(offset) - hours) * 60);

        return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }



    // 初始化主题
    initTheme() {
        const savedTheme = localStorage.getItem('timestamp-converter-theme') || 'light';
        this.setTheme(savedTheme);
    }

    // 切换主题
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // 设置主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('timestamp-converter-theme', theme);

        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // 快速操作：填入当前时间戳
    fillCurrentTimestamp() {
        const timestampInput = document.getElementById('timestamp-input');
        timestampInput.value = this.getCurrentTimestamp();
        this.convertTimestampToDate();

        // 添加视觉反馈
        timestampInput.style.backgroundColor = 'var(--success-color)';
        timestampInput.style.color = 'white';
        setTimeout(() => {
            timestampInput.style.backgroundColor = '';
            timestampInput.style.color = '';
        }, 500);
    }

    // 快速操作：填入当前日期
    fillCurrentDate() {
        const dateInput = document.getElementById('date-input');
        const timeInput = document.getElementById('time-input');
        const now = new Date();

        // 格式化日期和时间
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        dateInput.value = `${year}-${month}-${day}`;
        timeInput.value = `${hours}:${minutes}:${seconds}`;
        this.convertDateToTimestamp();

        // 添加视觉反馈
        dateInput.style.backgroundColor = 'var(--success-color)';
        dateInput.style.color = 'white';
        timeInput.style.backgroundColor = 'var(--success-color)';
        timeInput.style.color = 'white';

        setTimeout(() => {
            dateInput.style.backgroundColor = '';
            dateInput.style.color = '';
            timeInput.style.backgroundColor = '';
            timeInput.style.color = '';
        }, 500);
    }

    // 快速操作：清空所有输入
    clearAllInputs() {
        document.getElementById('date-input').value = '';
        document.getElementById('time-input').value = '00:00:00';
        document.getElementById('timestamp-input').value = '';
        document.getElementById('timestamp-output').textContent = '-';
        document.getElementById('date-output').textContent = '-';

        // 清除所有错误状态
        document.querySelectorAll('.error').forEach(element => {
            this.clearError(element);
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new TimestampConverter();
});
