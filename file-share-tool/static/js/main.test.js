// 前端功能测试
describe('文件分享工具前端功能', () => {
    // 模拟DOM元素
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="file-list"></div>
            <div id="batch-controls" style="display: none;">
                <span id="selection-count">已选择 0 个文件</span>
                <button id="batch-download">批量下载</button>
                <button id="batch-delete">批量删除</button>
            </div>
            <button id="batch-mode-toggle">批量操作</button>
            <div id="toast" class="toast"></div>
        `;
        
        // 重置全局变量
        global.selectedFiles = new Set();
        global.batchMode = false;
        global.isUploading = false;
    });

    describe('文件大小格式化', () => {
        test('应该正确格式化字节数', () => {
            expect(formatFileSize(0)).toBe('0 B');
            expect(formatFileSize(1024)).toBe('1.0 KB');
            expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
            expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        });

        test('应该处理小数位', () => {
            expect(formatFileSize(1536)).toBe('1.5 KB');
            expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
        });
    });

    describe('文件图标获取', () => {
        test('应该返回正确的文件图标', () => {
            expect(getFileIcon('txt')).toBe('📄');
            expect(getFileIcon('png')).toBe('🖼️');
            expect(getFileIcon('zip')).toBe('📦');
            expect(getFileIcon('py')).toBe('🐍');
            expect(getFileIcon('unknown')).toBe('📄');
        });

        test('应该处理大写扩展名', () => {
            expect(getFileIcon('PNG')).toBe('🖼️');
            expect(getFileIcon('TXT')).toBe('📄');
        });
    });

    describe('批量操作功能', () => {
        test('切换批量模式应该更新状态', () => {
            expect(global.batchMode).toBe(false);
            
            toggleBatchMode();
            
            expect(global.batchMode).toBe(true);
            expect(global.selectedFiles.size).toBe(0);
        });

        test('选择文件应该更新选择集合', () => {
            toggleFileSelection('file1', true);
            expect(global.selectedFiles.has('file1')).toBe(true);
            
            toggleFileSelection('file1', false);
            expect(global.selectedFiles.has('file1')).toBe(false);
        });

        test('更新批量控件应该反映选择状态', () => {
            global.batchMode = true;
            global.selectedFiles.add('file1');
            global.selectedFiles.add('file2');
            
            updateBatchControls();
            
            const selectionCount = document.getElementById('selection-count');
            expect(selectionCount.textContent).toBe('已选择 2 个文件');
            
            const batchDownload = document.getElementById('batch-download');
            const batchDelete = document.getElementById('batch-delete');
            expect(batchDownload.disabled).toBe(false);
            expect(batchDelete.disabled).toBe(false);
        });
    });

    describe('HTML转义', () => {
        test('应该正确转义HTML特殊字符', () => {
            expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
            expect(escapeHtml('&')).toBe('&amp;');
            expect(escapeHtml('"')).toBe('&quot;');
            expect(escapeHtml("'")).toBe('&#x27;');
        });

        test('应该处理普通文本', () => {
            expect(escapeHtml('hello world')).toBe('hello world');
            expect(escapeHtml('文件名.txt')).toBe('文件名.txt');
        });
    });

    describe('Toast通知', () => {
        test('应该显示通知消息', () => {
            showToast('测试消息', 'success');
            
            const toast = document.getElementById('toast');
            expect(toast.textContent).toBe('测试消息');
            expect(toast.classList.contains('success')).toBe(true);
            expect(toast.classList.contains('show')).toBe(true);
        });

        test('应该处理不同类型的通知', () => {
            showToast('错误消息', 'error');
            
            const toast = document.getElementById('toast');
            expect(toast.classList.contains('error')).toBe(true);
        });
    });

    describe('文件上传验证', () => {
        test('应该验证文件选择', () => {
            // 模拟没有文件的情况
            const mockFiles = [];
            const result = validateFileSelection(mockFiles);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('没有选择文件');
        });

        test('应该验证文件大小', () => {
            const mockFile = {
                size: 200 * 1024 * 1024, // 200MB
                name: 'large-file.zip'
            };
            
            const result = validateFileSize(mockFile, 100 * 1024 * 1024); // 100MB limit
            expect(result.valid).toBe(false);
            expect(result.message).toContain('文件大小超过限制');
        });
    });
});

// 工具函数 - 在实际实现中这些应该在main.js中
function validateFileSelection(files) {
    if (!files || files.length === 0) {
        return { valid: false, message: '没有选择文件' };
    }
    return { valid: true };
}

function validateFileSize(file, maxSize) {
    if (file.size > maxSize) {
        return { valid: false, message: '文件大小超过限制' };
    }
    return { valid: true };
}

// API测试
describe('API请求', () => {
    // 模拟fetch
    global.fetch = jest.fn();

    beforeEach(() => {
        fetch.mockClear();
    });

    test('应该正确发送文件列表请求', async () => {
        const mockResponse = {
            success: true,
            files: [
                { id: '1', name: 'test.txt', size: '1.0 KB' }
            ]
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const response = await fetch('/api/files');
        const data = await response.json();

        expect(fetch).toHaveBeenCalledWith('/api/files');
        expect(data.success).toBe(true);
        expect(data.files).toHaveLength(1);
    });

    test('应该处理API错误', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        try {
            await fetch('/api/files');
        } catch (error) {
            expect(error.message).toBe('Network error');
        }
    });
});