// 全局变量
let isUploading = false;
let selectedFiles = new Set(); // 存储选中的文件ID
let batchMode = false; // 批量操作模式

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
    const folderInput = document.getElementById('folder-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const selectFolderBtn = document.getElementById('select-folder-btn');

    // 按钮点击事件
    selectFilesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUploading) {
            fileInput.click();
        }
    });

    selectFolderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUploading) {
            // 检查浏览器是否支持文件夹选择
            console.log('文件夹按钮被点击');
            console.log('浏览器信息:', navigator.userAgent);
            console.log('webkitdirectory支持:', 'webkitdirectory' in folderInput);
            console.log('directory支持:', 'directory' in folderInput);
            console.log('folderInput元素:', folderInput);
            console.log('folderInput.webkitdirectory:', folderInput.webkitdirectory);
            console.log('folderInput.hasAttribute webkitdirectory:', folderInput.hasAttribute('webkitdirectory'));
            console.log('folderInput.getAttribute webkitdirectory:', folderInput.getAttribute('webkitdirectory'));

            // 检测浏览器类型
            const isFirefox = navigator.userAgent.toLowerCase().includes('firefox') ||
                             navigator.userAgent.toLowerCase().includes('zen');

            if ('webkitdirectory' in folderInput || isFirefox) {
                console.log('开始尝试文件夹选择，浏览器类型:', isFirefox ? 'Firefox/Zen' : 'Webkit');

                // 创建新的input元素，确保属性正确设置
                const newFolderInput = document.createElement('input');
                newFolderInput.type = 'file';
                newFolderInput.id = 'folder-input-dynamic';
                newFolderInput.multiple = true;
                newFolderInput.style.position = 'absolute';
                newFolderInput.style.left = '-9999px';
                newFolderInput.style.opacity = '0';

                // 设置文件夹选择属性
                if (isFirefox) {
                    // Firefox/Zen 浏览器特殊处理
                    newFolderInput.setAttribute('webkitdirectory', '');
                    newFolderInput.setAttribute('directory', '');
                    newFolderInput.setAttribute('mozdirectory', '');
                    console.log('设置Firefox/Zen专用属性');
                } else {
                    // Webkit浏览器
                    newFolderInput.webkitdirectory = true;
                    newFolderInput.setAttribute('webkitdirectory', '');
                    console.log('设置Webkit专用属性');
                }

                // 添加事件监听器
                newFolderInput.addEventListener('change', function(e) {
                    console.log('文件夹选择事件触发，文件数量:', e.target.files.length);
                    handleFolderSelect(e);
                    // 清理元素
                    if (newFolderInput.parentNode) {
                        document.body.removeChild(newFolderInput);
                    }
                });

                // 添加到DOM
                document.body.appendChild(newFolderInput);

                // 延迟触发点击，确保元素已正确添加到DOM
                setTimeout(() => {
                    console.log('触发文件夹选择对话框');
                    console.log('新元素属性检查:');
                    console.log('- webkitdirectory:', newFolderInput.webkitdirectory);
                    console.log('- hasAttribute webkitdirectory:', newFolderInput.hasAttribute('webkitdirectory'));
                    console.log('- hasAttribute directory:', newFolderInput.hasAttribute('directory'));
                    console.log('- hasAttribute mozdirectory:', newFolderInput.hasAttribute('mozdirectory'));

                    newFolderInput.click();

                    // 备用清理，防止元素残留
                    setTimeout(() => {
                        if (newFolderInput.parentNode) {
                            document.body.removeChild(newFolderInput);
                        }
                    }, 5000);
                }, 10);

            } else {
                showToast('您的浏览器不支持文件夹选择功能，请使用Chrome、Edge或Firefox等现代浏览器', 'error');
            }
        }
    });

    // 上传区域点击（排除按钮区域）
    uploadArea.addEventListener('click', (e) => {
        // 如果点击的是按钮或按钮容器，不触发文件选择
        if (e.target.closest('.upload-buttons')) {
            return;
        }
        if (!isUploading) {
            fileInput.click();
        }
    });

    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);
    folderInput.addEventListener('change', handleFolderSelect);

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

// 处理文件夹选择
function handleFolderSelect(e) {
    const files = e.target.files;
    console.log('文件夹选择事件触发');
    console.log('选择的文件数量:', files.length);

    if (files.length > 0) {
        console.log('文件列表:');
        for (let i = 0; i < Math.min(files.length, 5); i++) {
            console.log(`- ${files[i].webkitRelativePath || files[i].name}`);
        }
        uploadFiles(files);
    } else {
        console.log('没有选择任何文件');
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
        let totalSize = 0;

        // 处理文件，包括文件夹结构
        for (let file of files) {
            formData.append('files', file);
            totalSize += file.size;
            // 如果文件有webkitRelativePath属性，说明是从文件夹选择的
            if (file.webkitRelativePath) {
                formData.append('paths', file.webkitRelativePath);
            } else {
                formData.append('paths', file.name);
            }
        }

        updateUploadProgress(10, `准备上传 ${files.length} 个文件 (${formatFileSize(totalSize)})...`);

        // 创建XMLHttpRequest以支持进度监控
        const xhr = new XMLHttpRequest();

        // 上传进度监听
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                updateUploadProgress(percentComplete, `上传中... ${Math.round(percentComplete)}%`);
            }
        });

        // 创建Promise包装XMLHttpRequest
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('响应解析失败'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => reject(new Error('网络错误'));
            xhr.ontimeout = () => reject(new Error('上传超时'));

            xhr.open('POST', '/api/upload');
            xhr.timeout = 300000; // 5分钟超时
            xhr.send(formData);
        });

        const result = await uploadPromise;

        if (result.success) {
            updateUploadProgress(100, '上传完成！');
            showToast(result.message, 'success');
            refreshFileList();

            // 清空文件选择
            document.getElementById('file-input').value = '';
            document.getElementById('folder-input').value = '';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('上传错误:', error);
        showToast('上传失败: ' + error.message, 'error');
    } finally {
        // 延迟恢复按钮状态，让用户看到完成状态
        setTimeout(() => {
            isUploading = false;
            showUploadProgress(false);
        }, 1000);
    }
}

// 显示/隐藏上传进度
function showUploadProgress(show) {
    const progressDiv = document.getElementById('upload-progress');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const selectFolderBtn = document.getElementById('select-folder-btn');

    if (show) {
        progressDiv.style.display = 'block';

        // 只禁用按钮，不禁用整个上传区域
        selectFilesBtn.disabled = true;
        selectFolderBtn.disabled = true;
        selectFilesBtn.style.opacity = '0.6';
        selectFolderBtn.style.opacity = '0.6';
        selectFilesBtn.style.cursor = 'not-allowed';
        selectFolderBtn.style.cursor = 'not-allowed';

        // 初始化进度条
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        progressFill.style.width = '0%';
        progressText.textContent = '准备上传...';
    } else {
        progressDiv.style.display = 'none';

        // 恢复按钮状态
        selectFilesBtn.disabled = false;
        selectFolderBtn.disabled = false;
        selectFilesBtn.style.opacity = '1';
        selectFolderBtn.style.opacity = '1';
        selectFilesBtn.style.cursor = 'pointer';
        selectFolderBtn.style.cursor = 'pointer';
    }
}

// 更新上传进度
function updateUploadProgress(progress, message) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill && progressText) {
        progressFill.style.width = progress + '%';
        progressText.textContent = message || `上传中... ${Math.round(progress)}%`;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        const filesResponse = await fetch('/api/files');
        const filesResult = await filesResponse.json();

        if (filesResult.success) {
            // 分离文件和文件夹
            const files = filesResult.files.filter(item => !item.is_folder);
            const folders = filesResult.files.filter(item => item.is_folder);

            displayFileList(files);
            displayFolderList(folders);
            updateStorageInfo(filesResult.storage_info);
        } else {
            showToast('获取文件列表失败: ' + filesResult.message, 'error');
        }
    } catch (error) {
        showToast('获取文件列表失败: ' + error.message, 'error');
    }
}

// 显示文件夹列表
function displayFolderList(folders) {
    const folderContainer = document.getElementById('folder-list');
    if (!folderContainer) return;

    if (folders.length === 0) {
        folderContainer.innerHTML = '';
        return;
    }

    let html = '<h3>📁 文件夹列表</h3>';
    folders.forEach(folder => {
        const uploadTime = new Date(folder.upload_time).toLocaleString();
        html += `
            <div class="folder-item">
                <span class="folder-icon">📁</span>
                <div class="folder-info" onclick="viewFolderContents('${folder.folder_path}')" style="cursor: pointer;">
                    <div class="folder-name">${escapeHtml(folder.name)}</div>
                    <div class="folder-meta">
                        <span>文件数: ${folder.file_count}</span>
                        <span>总大小: ${folder.size}</span>
                        <span>上传时间: ${uploadTime}</span>
                    </div>
                </div>
                <div class="folder-actions">
                    <button class="btn btn-primary" onclick="viewFolderContents('${folder.folder_path}')">👁️ 查看</button>
                    <button class="btn btn-success" onclick="downloadFolder('${folder.folder_path}')">📦 下载</button>
                </div>
            </div>
        `;
    });

    folderContainer.innerHTML = html;
}

// 显示文件列表
function displayFileList(files) {
    const fileList = document.getElementById('file-list');

    if (files.length === 0) {
        fileList.innerHTML = '<div class="empty-message">暂无文件</div>';
        updateBatchControls();
        return;
    }

    let html = '';
    files.forEach(file => {
        const uploadTime = new Date(file.upload_time).toLocaleString();
        const expireTime = new Date(file.expire_time).toLocaleString();

        if (file.is_folder) {
            // 文件夹项
            html += `
                <div class="file-item folder-item">
                    <span class="file-icon">📁</span>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(file.name)}</div>
                        <div class="file-meta">
                            <span>文件数: ${file.file_count} 个</span>
                            <span>大小: ${file.size}</span>
                            <span>上传: ${uploadTime}</span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-secondary" onclick="viewFolder('${file.folder_path}')">📂 查看</button>
                        <button class="btn btn-success" onclick="downloadFolder('${file.folder_path}')">⬇️ 下载</button>
                        <button class="btn btn-danger" onclick="deleteFolder('${file.folder_path}')">🗑️ 删除</button>
                    </div>
                </div>
            `;
        } else {
            // 普通文件项
            const pathInfo = file.relative_path !== file.name ?
                `<span class="file-path">路径: ${escapeHtml(file.relative_path)}</span>` : '';
            
            const isSelected = selectedFiles.has(file.id);
            const selectedClass = isSelected ? 'selected' : '';
            const checkboxChecked = isSelected ? 'checked' : '';
            const batchCheckbox = batchMode ? 
                `<input type="checkbox" class="file-checkbox" data-file-id="${file.id}" ${checkboxChecked} onchange="toggleFileSelection('${file.id}', this.checked)">` : '';

            html += `
                <div class="file-item ${selectedClass}" data-file-id="${file.id}">
                    ${batchCheckbox}
                    <span class="file-icon">${getFileIcon(file.extension)}</span>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(file.name)}</div>
                        <div class="file-meta">
                            ${pathInfo}
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
        }
    });

    fileList.innerHTML = html;
    updateBatchControls();
}

// 更新存储信息
function updateStorageInfo(storageInfo) {
    const storageInfoElement = document.getElementById('storage-info');
    storageInfoElement.textContent = `文件: ${storageInfo.total_files} 个，大小: ${storageInfo.total_size}`;
}

// 获取文件图标
function getFileIcon(extension) {
    const iconMap = {
        // 文本文件
        'txt': '📄', 'md': '📝', 'py': '🐍', 'js': '📜', 'html': '🌐', 'css': '🎨',
        'json': '📋', 'xml': '📋', 'csv': '📊', 'log': '📋',
        // 文档文件
        'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗', 'xlsx': '📗',
        'ppt': '📙', 'pptx': '📙',
        // 图片文件
        'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
        'svg': '🖼️', 'webp': '🖼️',
        // 压缩文件
        'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
        // 可执行文件
        'exe': '⚙️', 'msi': '📦', 'bat': '⚡', 'cmd': '⚡', 'sh': '⚡', 'app': '📱',
        'dmg': '💿', 'deb': '📦', 'rpm': '📦',
        // 库文件
        'dll': '🔧', 'so': '🔧', 'dylib': '🔧', 'lib': '📚', 'a': '📚',
        // 配置文件
        'ini': '⚙️', 'cfg': '⚙️', 'conf': '⚙️', 'properties': '⚙️',
        'yaml': '⚙️', 'yml': '⚙️', 'toml': '⚙️',
        // 开发文件
        'c': '💻', 'cpp': '💻', 'h': '📋', 'hpp': '📋', 'java': '☕',
        'class': '☕', 'jar': '☕', 'war': '☕',
        // 数据文件
        'db': '🗄️', 'sqlite': '🗄️', 'sql': '🗄️', 'bak': '💾',
        // 媒体文件
        'mp3': '🎵', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'wav': '🎵',
        'flv': '🎬', 'mkv': '🎬', 'wmv': '🎬',
        // 其他文件
        'bin': '⚙️', 'dat': '📊', 'tmp': '🗂️', 'cache': '🗂️', 'lock': '🔒'
    };
    return iconMap[extension.toLowerCase()] || '📄';
}

// 下载文件
function downloadFile(fileId) {
    window.open(`/api/download/${fileId}`, '_blank');
}

// 下载文件夹
function downloadFolder(folderPath) {
    const encodedPath = encodeURIComponent(folderPath);
    window.open(`/api/download-folder/${encodedPath}`, '_blank');
}

// 查看文件夹（别名函数）
function viewFolder(folderPath) {
    viewFolderContents(folderPath);
}

// 查看文件夹内容
async function viewFolderContents(folderPath) {
    try {
        const encodedPath = encodeURIComponent(folderPath);
        const response = await fetch(`/api/folder-files/${encodedPath}`);
        const result = await response.json();

        if (result.success) {
            // 显示文件夹内容模态框
            showFolderContentsModal(result.folder_name, result.files, folderPath);
        } else {
            showToast('获取文件夹内容失败: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('获取文件夹内容失败: ' + error.message, 'error');
    }
}

// 显示文件夹内容模态框
function showFolderContentsModal(folderName, files, folderPath) {
    // 创建模态框HTML
    const modalHtml = `
        <div class="modal-overlay" id="folder-modal-overlay">
            <div class="modal-content folder-modal">
                <div class="modal-header">
                    <h3>📁 ${escapeHtml(folderName)} (${files.length} 个文件)</h3>
                    <button class="modal-close" onclick="closeFolderModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="folder-file-list">
                        ${files.map(file => {
                            const uploadTime = new Date(file.upload_time).toLocaleString();
                            const expireTime = new Date(file.expire_time).toLocaleString();

                            return `
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
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" onclick="downloadFolder('${folderPath}')">📦 下载整个文件夹</button>
                    <button class="btn btn-secondary" onclick="closeFolderModal()">关闭</button>
                </div>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 添加点击外部关闭功能
    document.getElementById('folder-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'folder-modal-overlay') {
            closeFolderModal();
        }
    });
}

// 关闭文件夹模态框
function closeFolderModal() {
    const modal = document.getElementById('folder-modal-overlay');
    if (modal) {
        modal.remove();
    }
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

// 删除文件夹
async function deleteFolder(folderPath) {
    if (!confirm(`确定要删除文件夹 "${folderPath}" 及其所有文件吗？`)) {
        return;
    }

    try {
        const encodedPath = encodeURIComponent(folderPath);
        const response = await fetch(`/api/delete-folder/${encodedPath}`, {
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
        showToast('删除文件夹失败: ' + error.message, 'error');
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
                    let deleteResponse;
                    
                    if (file.is_folder) {
                        // 删除文件夹
                        const encodedPath = encodeURIComponent(file.folder_path);
                        deleteResponse = await fetch(`/api/delete-folder/${encodedPath}`, {
                            method: 'DELETE'
                        });
                    } else {
                        // 删除文件
                        deleteResponse = await fetch(`/api/delete/${file.id}`, {
                            method: 'DELETE'
                        });
                    }
                    
                    if (deleteResponse.ok) {
                        const deleteResult = await deleteResponse.json();
                        if (deleteResult.success) {
                            deletedCount++;
                        }
                    }
                } catch (error) {
                    console.error('删除项目失败:', error);
                }
            }
            
            showToast(`成功删除 ${deletedCount} 个项目`, 'success');
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
});

// 切换批量操作模式
function toggleBatchMode() {
    batchMode = !batchMode;
    selectedFiles.clear();
    refreshFileList();
    updateBatchControls();
    
    const toggleBtn = document.getElementById('batch-mode-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = batchMode ? '🚫 退出批量' : '☑️ 批量操作';
        toggleBtn.className = batchMode ? 'btn btn-warning' : 'btn btn-secondary';
    }
}

// 切换文件选择状态
function toggleFileSelection(fileId, selected) {
    if (selected) {
        selectedFiles.add(fileId);
    } else {
        selectedFiles.delete(fileId);
    }
    updateBatchControls();
    
    // 更新视觉效果
    const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileItem) {
        if (selected) {
            fileItem.classList.add('selected');
        } else {
            fileItem.classList.remove('selected');
        }
    }
}

// 全选/取消全选
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    const allSelected = selectedFiles.size === checkboxes.length;
    
    checkboxes.forEach(checkbox => {
        const fileId = checkbox.dataset.fileId;
        if (allSelected) {
            checkbox.checked = false;
            selectedFiles.delete(fileId);
            document.querySelector(`[data-file-id="${fileId}"]`).classList.remove('selected');
        } else {
            checkbox.checked = true;
            selectedFiles.add(fileId);
            document.querySelector(`[data-file-id="${fileId}"]`).classList.add('selected');
        }
    });
    
    updateBatchControls();
}

// 更新批量操作控件状态
function updateBatchControls() {
    const batchControls = document.getElementById('batch-controls');
    if (!batchControls) return;
    
    const selectedCount = selectedFiles.size;
    const hasSelection = selectedCount > 0;
    
    // 更新选择计数
    const selectionCount = document.getElementById('selection-count');
    if (selectionCount) {
        selectionCount.textContent = `已选择 ${selectedCount} 个文件`;
    }
    
    // 更新按钮状态
    const batchDownloadBtn = document.getElementById('batch-download');
    const batchDeleteBtn = document.getElementById('batch-delete');
    
    if (batchDownloadBtn) {
        batchDownloadBtn.disabled = !hasSelection;
        batchDownloadBtn.style.opacity = hasSelection ? '1' : '0.5';
    }
    
    if (batchDeleteBtn) {
        batchDeleteBtn.disabled = !hasSelection;
        batchDeleteBtn.style.opacity = hasSelection ? '1' : '0.5';
    }
    
    // 显示/隐藏批量控件
    if (batchMode) {
        batchControls.style.display = 'flex';
    } else {
        batchControls.style.display = 'none';
        selectedFiles.clear();
    }
}

// 批量下载文件
async function batchDownloadFiles() {
    if (selectedFiles.size === 0) {
        showToast('请先选择要下载的文件', 'warning');
        return;
    }
    
    if (selectedFiles.size > 50) {
        showToast('单次批量下载不能超过50个文件', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/batch/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_ids: Array.from(selectedFiles)
            })
        });
        
        if (response.ok) {
            // 处理文件下载
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `batch_download_${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast(`成功下载 ${selectedFiles.size} 个文件`, 'success');
        } else {
            const result = await response.json();
            showToast(result.message || '批量下载失败', 'error');
        }
    } catch (error) {
        showToast('批量下载失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 批量删除文件
async function batchDeleteFiles() {
    if (selectedFiles.size === 0) {
        showToast('请先选择要删除的文件', 'warning');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？此操作不可恢复！`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/batch/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_ids: Array.from(selectedFiles)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            selectedFiles.clear();
            refreshFileList();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('批量删除失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ESC键关闭模态框和退出批量模式
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePreviewModal();
        closeFolderModal();
        
        // ESC键退出批量模式
        if (batchMode) {
            toggleBatchMode();
        }
    }
});
