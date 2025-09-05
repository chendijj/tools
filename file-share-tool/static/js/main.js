// 全局变量
let isUploading = false;

// 初始化应用
function initializeApp() {
    setupFileUpload();
    setupTextEditor();
    refreshFileList();
    
    // 定期刷新文件列表
    setInterval(refreshFileList, 30000); // 每30秒刷新一次
}

// 设置文件上传功能
function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    // 点击上传区域
    uploadArea.addEventListener('click', () => {
        if (!isUploading) {
            fileInput.click();
        }
    });
    
    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽功能
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
}

// 设置文本编辑器
function setupTextEditor() {
    const textEditor = document.getElementById('text-editor');
    const textFilename = document.getElementById('text-filename');
    
    // 自动调整文本框高度
    textEditor.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(300, this.scrollHeight) + 'px';
    });
}

// 处理拖拽悬停
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

// 处理拖拽离开
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

// 处理文件拖拽
function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFiles(files);
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        uploadFiles(files);
    }
}

// 上传文件
async function uploadFiles(files) {
    if (isUploading) {
        showToast('正在上传中，请稍候...', 'warning');
        return;
    }
    
    isUploading = true;
    showUploadProgress(true);
    
    try {
        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            refreshFileList();
            
            // 清空文件选择
            document.getElementById('file-input').value = '';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('上传失败: ' + error.message, 'error');
    } finally {
        isUploading = false;
        showUploadProgress(false);
    }
}

// 显示/隐藏上传进度
function showUploadProgress(show) {
    const progressDiv = document.getElementById('upload-progress');
    const uploadArea = document.getElementById('upload-area');
    
    if (show) {
        progressDiv.style.display = 'block';
        uploadArea.style.opacity = '0.5';
        uploadArea.style.pointerEvents = 'none';
        
        // 模拟进度（实际项目中应该使用真实进度）
        let progress = 0;
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressFill.style.width = progress + '%';
            progressText.textContent = `上传中... ${Math.round(progress)}%`;
        }, 200);
    } else {
        progressDiv.style.display = 'none';
        uploadArea.style.opacity = '1';
        uploadArea.style.pointerEvents = 'auto';
    }
}

// 保存文本文件
async function saveTextFile() {
    const filename = document.getElementById('text-filename').value.trim();
    const content = document.getElementById('text-editor').value;
    
    if (!filename) {
        showToast('请输入文件名', 'warning');
        return;
    }
    
    if (!content.trim()) {
        showToast('请输入文本内容', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/text/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                content: content
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            refreshFileList();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 清空编辑器
function clearEditor() {
    if (confirm('确定要清空编辑器内容吗？')) {
        document.getElementById('text-editor').value = '';
        document.getElementById('text-filename').value = '新建文本.txt';
        showToast('编辑器已清空', 'success');
    }
}

// 刷新文件列表
async function refreshFileList() {
    try {
        const response = await fetch('/api/files');
        const result = await response.json();
        
        if (result.success) {
            displayFileList(result.files);
            updateStorageInfo(result.storage_info);
        } else {
            showToast('获取文件列表失败: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('获取文件列表失败: ' + error.message, 'error');
    }
}

// 显示文件列表
function displayFileList(files) {
    const fileList = document.getElementById('file-list');
    
    if (files.length === 0) {
        fileList.innerHTML = '<div class="empty-message">暂无文件</div>';
        return;
    }
    
    let html = '';
    files.forEach(file => {
        const uploadTime = new Date(file.upload_time).toLocaleString();
        const expireTime = new Date(file.expire_time).toLocaleString();
        
        html += `
            <div class="file-item">
                <span class="file-icon">${getFileIcon(file.extension)}</span>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-meta">
                        <span>大小: ${file.size}</span>
                        <span>上传: ${uploadTime}</span>
                        <span>过期: ${expireTime}</span>
                    </div>
                </div>
                <div class="file-actions">
                    ${file.is_text ? `<button class="btn btn-secondary" onclick="previewFile('${file.id}')">👁️ 预览</button>` : ''}
                    ${file.is_image ? `<button class="btn btn-secondary" onclick="previewFile('${file.id}')">🖼️ 预览</button>` : ''}
                    <button class="btn btn-success" onclick="downloadFile('${file.id}')">⬇️ 下载</button>
                    <button class="btn btn-danger" onclick="deleteFile('${file.id}')">🗑️ 删除</button>
                </div>
            </div>
        `;
    });
    
    fileList.innerHTML = html;
}

// 更新存储信息
function updateStorageInfo(storageInfo) {
    const storageInfoElement = document.getElementById('storage-info');
    storageInfoElement.textContent = `文件: ${storageInfo.total_files} 个，大小: ${storageInfo.total_size}`;
}

// 获取文件图标
function getFileIcon(extension) {
    const iconMap = {
        'txt': '📄', 'md': '📝', 'py': '🐍', 'js': '📜', 'html': '🌐', 'css': '🎨',
        'json': '📋', 'xml': '📋', 'csv': '📊', 'log': '📋',
        'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗', 'xlsx': '📗',
        'ppt': '📙', 'pptx': '📙',
        'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
        'svg': '🖼️', 'webp': '🖼️',
        'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
        'mp3': '🎵', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'wav': '🎵'
    };
    return iconMap[extension.toLowerCase()] || '📄';
}

// 下载文件
function downloadFile(fileId) {
    window.open(`/api/download/${fileId}`, '_blank');
}

// 删除文件
async function deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/delete/${fileId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            refreshFileList();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// 预览文件
async function previewFile(fileId) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/preview/${fileId}`);
        
        if (response.headers.get('content-type')?.startsWith('image/')) {
            // 图片预览
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            showPreviewModal('图片预览', `<img src="${imageUrl}" alt="预览图片">`);
        } else {
            // 文本预览
            const result = await response.json();
            
            if (result.success) {
                const content = `<pre>${escapeHtml(result.content)}</pre>`;
                showPreviewModal(result.filename, content);
            } else {
                showToast(result.message, 'error');
            }
        }
    } catch (error) {
        showToast('预览失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 显示预览模态框
function showPreviewModal(title, content) {
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-content').innerHTML = content;
    document.getElementById('preview-modal').style.display = 'flex';
}

// 关闭预览模态框
function closePreviewModal() {
    document.getElementById('preview-modal').style.display = 'none';
}

// 清空所有文件
async function clearAllFiles() {
    if (!confirm('确定要删除所有文件吗？此操作不可恢复！')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/files');
        const result = await response.json();
        
        if (result.success && result.files.length > 0) {
            let deletedCount = 0;
            
            for (const file of result.files) {
                try {
                    const deleteResponse = await fetch(`/api/delete/${file.id}`, {
                        method: 'DELETE'
                    });
                    
                    if (deleteResponse.ok) {
                        deletedCount++;
                    }
                } catch (error) {
                    console.error('删除文件失败:', error);
                }
            }
            
            showToast(`成功删除 ${deletedCount} 个文件`, 'success');
            refreshFileList();
        } else {
            showToast('没有文件需要删除', 'warning');
        }
    } catch (error) {
        showToast('清空失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 手动清理过期文件
async function manualCleanup() {
    if (!confirm('确定要清理过期文件吗？')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/cleanup', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            refreshFileList();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('清理失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 复制服务器地址
function copyServerUrl() {
    const serverUrl = document.getElementById('server-url').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(serverUrl).then(() => {
            showToast('地址已复制到剪贴板', 'success');
        }).catch(() => {
            fallbackCopyText(serverUrl);
        });
    } else {
        fallbackCopyText(serverUrl);
    }
}

// 备用复制方法
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('地址已复制到剪贴板', 'success');
    } catch (err) {
        showToast('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 切换二维码显示
function toggleQRCode() {
    const qrContainer = document.getElementById('qr-code-container');
    const isVisible = qrContainer.style.display !== 'none';
    qrContainer.style.display = isVisible ? 'none' : 'block';
}

// 显示Toast通知
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 显示/隐藏加载遮罩
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    const modal = document.getElementById('preview-modal');
    if (e.target === modal) {
        closePreviewModal();
    }
    
    const qrContainer = document.getElementById('qr-code-container');
    if (!e.target.closest('.qr-section') && qrContainer.style.display === 'block') {
        qrContainer.style.display = 'none';
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePreviewModal();
        document.getElementById('qr-code-container').style.display = 'none';
    }
});
