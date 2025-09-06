from flask import Flask, request, render_template, send_file, jsonify, url_for
from werkzeug.exceptions import RequestEntityTooLarge
import os
import socket
import qrcode
from io import BytesIO
import base64
from config import Config
from utils.file_manager import FileManager
from utils.cleanup import start_cleanup_scheduler
from utils.logging_config import setup_logging
from utils.middleware import setup_error_handlers, require_operation_log
from utils.health_check import create_health_routes
from utils.logging_config import Operations

# 创建Flask应用
app = Flask(__name__)
app.config.from_object(Config)

# 初始化配置
Config.init_app(app)

# 设置日志系统
logger = setup_logging(app)
logger.info("文件分享服务启动中...")

# 创建文件管理器
file_manager = FileManager(
    upload_folder=app.config['UPLOAD_FOLDER'],
    allowed_extensions=app.config['ALLOWED_EXTENSIONS'],
    expire_hours=app.config['FILE_EXPIRE_HOURS']
)

# 设置错误处理
setup_error_handlers(app)

# 创建健康检查路由
create_health_routes(app, file_manager)

# 启动文件清理调度器
cleanup_scheduler = start_cleanup_scheduler(
    file_manager, 
    app.config['CLEANUP_INTERVAL_MINUTES']
)

logger.info("文件分享服务初始化完成")

def get_local_ip():
    """获取本机IP地址"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def generate_qr_code(url):
    """生成二维码"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()

def format_file_size(size_bytes):
    """格式化文件大小"""
    if size_bytes == 0:
        return "0 B"
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f} {size_names[i]}"

@app.route('/')
def index():
    """主页面"""
    local_ip = get_local_ip()
    server_url = f"http://{local_ip}:{app.config['PORT']}"
    qr_code = generate_qr_code(server_url)
    
    return render_template('index.html', 
                         server_url=server_url,
                         qr_code=qr_code,
                         local_ip=local_ip)

@app.route('/api/upload', methods=['POST'])
@require_operation_log(Operations.FILE_UPLOAD)
def upload_file():
    """文件上传API"""
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'}), 400

        files = request.files.getlist('files')
        paths = request.form.getlist('paths')  # 获取文件路径信息

        if not files or all(file.filename == '' for file in files):
            return jsonify({'success': False, 'message': '没有选择文件'}), 400

        uploaded_files = []
        failed_files = []

        for i, file in enumerate(files):
            if file and file.filename != '':
                # 获取对应的路径信息
                relative_path = paths[i] if i < len(paths) else None

                file_id, metadata = file_manager.save_file(file, relative_path)
                if file_id:
                    uploaded_files.append({
                        'id': file_id,
                        'name': metadata['original_name'],
                        'size': format_file_size(metadata['file_size'])
                    })
                else:
                    failed_files.append(relative_path or file.filename)

        if uploaded_files:
            message = f"成功上传 {len(uploaded_files)} 个文件"
            if failed_files:
                message += f"，{len(failed_files)} 个文件上传失败"
            return jsonify({
                'success': True,
                'message': message,
                'uploaded_files': uploaded_files,
                'failed_files': failed_files
            })
        else:
            return jsonify({'success': False, 'message': '所有文件上传失败'}), 400

    except RequestEntityTooLarge:
        return jsonify({'success': False, 'message': '文件太大，请检查服务器配置'}), 413
    except Exception as e:
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'}), 500

@app.route('/api/files')
def list_files():
    """获取文件列表API - 返回根目录文件和文件夹"""
    try:
        files = file_manager.get_file_list()
        folders = file_manager.get_folder_structure()
        storage_info = file_manager.get_storage_info()

        # 格式化文件信息，包括根目录文件和文件夹
        formatted_files = []

        # 首先添加所有文件夹
        for folder_name, folder_files in folders.items():
            if folder_files:  # 确保文件夹不为空
                total_size = sum(f['file_size'] for f in folder_files)
                file_count = len(folder_files)

                # 获取文件夹的最早上传时间
                upload_times = [f['upload_time'] for f in folder_files]
                earliest_time = min(upload_times) if upload_times else folder_files[0]['upload_time']

                # 获取过期时间（使用最晚的过期时间）
                expire_times = [f['expire_time'] for f in folder_files]
                latest_expire_time = max(expire_times) if expire_times else folder_files[0]['expire_time']

                formatted_files.append({
                    'id': f'folder_{folder_name}',
                    'name': folder_name,
                    'size': format_file_size(total_size),
                    'size_bytes': total_size,
                    'type': 'folder',
                    'extension': 'folder',
                    'upload_time': earliest_time,
                    'expire_time': latest_expire_time,
                    'is_text': False,
                    'is_image': False,
                    'is_text_file': False,
                    'is_folder': True,
                    'file_count': file_count,
                    'folder_path': folder_name,
                    'relative_path': folder_name
                })

        # 然后添加根目录文件
        for file_info in files:
            relative_path = file_info.get('relative_path', file_info['original_name'])

            # 只处理根目录文件（不在文件夹中的文件）
            if not ('/' in relative_path or '\\' in relative_path):
                formatted_files.append({
                    'id': file_info['id'],
                    'name': file_info['original_name'],
                    'size': format_file_size(file_info['file_size']),
                    'size_bytes': file_info['file_size'],
                    'type': file_info['file_type'],
                    'extension': file_info['file_extension'],
                    'upload_time': file_info['upload_time'],
                    'expire_time': file_info['expire_time'],
                    'is_text': file_info['file_extension'] in app.config['PREVIEWABLE_EXTENSIONS'],
                    'is_image': file_info['file_extension'] in app.config['IMAGE_EXTENSIONS'],
                    'is_text_file': file_info.get('is_text_file', False),
                    'is_folder': False,
                    'relative_path': relative_path
                })

        # 按上传时间排序
        formatted_files.sort(key=lambda x: x['upload_time'], reverse=True)

        return jsonify({
            'success': True,
            'files': formatted_files,
            'storage_info': {
                'total_files': storage_info['total_files'],
                'total_size': format_file_size(storage_info['total_size'])
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取文件列表失败: {str(e)}'}), 500

@app.route('/api/folders')
def get_folders():
    """获取文件夹列表API"""
    try:
        folders = file_manager.get_folder_structure()

        # 格式化文件夹信息
        formatted_folders = []
        for folder_path, files in folders.items():
            if folder_path:  # 只显示有文件夹路径的
                total_size = sum(file_info['file_size'] for file_info in files)
                formatted_folder = {
                    'path': folder_path,
                    'name': folder_path.split('/')[-1] if '/' in folder_path else folder_path,
                    'file_count': len(files),
                    'total_size': format_file_size(total_size),
                    'files': [f['original_name'] for f in files[:3]]  # 显示前3个文件名
                }
                formatted_folders.append(formatted_folder)

        # 按文件夹名称排序
        formatted_folders.sort(key=lambda x: x['name'])

        return jsonify({'success': True, 'folders': formatted_folders})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取文件夹列表失败: {str(e)}'}), 500

@app.route('/api/folder-files/<path:folder_path>')
def get_folder_files(folder_path):
    """获取指定文件夹内的文件列表API"""
    try:
        # URL解码文件夹路径
        from urllib.parse import unquote
        folder_path = unquote(folder_path)

        folders = file_manager.get_folder_structure()

        if folder_path not in folders:
            return jsonify({'success': False, 'message': '文件夹不存在'}), 404

        # 格式化文件夹内的文件信息
        formatted_files = []
        for file_info in folders[folder_path]:
            formatted_files.append({
                'id': file_info['id'],
                'name': file_info['original_name'],
                'size': format_file_size(file_info['file_size']),
                'size_bytes': file_info['file_size'],
                'type': file_info['file_type'],
                'extension': file_info['file_extension'],
                'upload_time': file_info['upload_time'],
                'expire_time': file_info['expire_time'],
                'is_text': file_info['file_extension'] in app.config['PREVIEWABLE_EXTENSIONS'],
                'is_image': file_info['file_extension'] in app.config['IMAGE_EXTENSIONS'],
                'is_text_file': file_info.get('is_text_file', False),
                'relative_path': file_info.get('relative_path', file_info['original_name'])
            })

        # 按文件名排序
        formatted_files.sort(key=lambda x: x['name'])

        return jsonify({
            'success': True,
            'files': formatted_files,
            'folder_path': folder_path,
            'folder_name': folder_path.split('/')[-1] if '/' in folder_path else folder_path
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取文件夹文件失败: {str(e)}'}), 500

@app.route('/api/download/<file_id>')
def download_file(file_id):
    """文件下载API"""
    try:
        metadata = file_manager.get_file_metadata(file_id)
        if not metadata:
            return jsonify({'success': False, 'message': '文件不存在'}), 404

        file_path = metadata['file_path']
        # 确保使用绝对路径
        if not os.path.isabs(file_path):
            file_path = os.path.abspath(file_path)

        # 调试信息
        print(f"Debug - 当前工作目录: {os.getcwd()}")
        print(f"Debug - 原始路径: {metadata['file_path']}")
        print(f"Debug - 绝对路径: {file_path}")
        print(f"Debug - 文件存在: {os.path.exists(file_path)}")

        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': f'文件不存在: {file_path}'}), 404

        return send_file(
            file_path,
            as_attachment=True,
            download_name=metadata['original_name']
        )
    except Exception as e:
        return jsonify({'success': False, 'message': f'下载失败: {str(e)}'}), 500

@app.route('/api/download-folder/<path:folder_path>')
def download_folder(folder_path):
    """文件夹下载API"""
    try:
        # URL解码文件夹路径
        from urllib.parse import unquote
        folder_path = unquote(folder_path)

        # 创建ZIP文件
        zip_path = file_manager.create_folder_zip(folder_path)
        if not zip_path:
            return jsonify({'success': False, 'message': '文件夹不存在或为空'}), 404

        # 生成下载文件名
        folder_name = folder_path.split('/')[-1] if '/' in folder_path else folder_path
        download_name = f"{folder_name}.zip"

        def remove_file():
            """下载完成后删除临时文件"""
            try:
                if os.path.exists(zip_path):
                    os.remove(zip_path)
            except:
                pass

        # 发送文件并在完成后删除
        response = send_file(
            zip_path,
            as_attachment=True,
            download_name=download_name,
            mimetype='application/zip'
        )

        # 注册清理函数
        response.call_on_close(remove_file)
        return response

    except Exception as e:
        return jsonify({'success': False, 'message': f'下载失败: {str(e)}'}), 500

@app.route('/api/delete/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """文件删除API"""
    try:
        if file_manager.delete_file(file_id):
            return jsonify({'success': True, 'message': '文件删除成功'})
        else:
            return jsonify({'success': False, 'message': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'}), 500

@app.route('/api/delete-folder/<path:folder_path>', methods=['DELETE'])
def delete_folder(folder_path):
    """文件夹删除API"""
    try:
        # URL解码文件夹路径
        from urllib.parse import unquote
        folder_path = unquote(folder_path)

        folders = file_manager.get_folder_structure()

        # 调试信息：打印可用的文件夹
        print(f"尝试删除文件夹: {folder_path}")
        print(f"可用的文件夹: {list(folders.keys())}")

        if folder_path not in folders:
            return jsonify({
                'success': False,
                'message': f'文件夹不存在。可用文件夹: {list(folders.keys())}'
            }), 404

        # 删除文件夹中的所有文件
        deleted_count = 0
        failed_count = 0
        for file_info in folders[folder_path]:
            if file_manager.delete_file(file_info['id']):
                deleted_count += 1
            else:
                failed_count += 1

        if deleted_count > 0:
            message = f'文件夹删除成功，共删除 {deleted_count} 个文件'
            if failed_count > 0:
                message += f'，{failed_count} 个文件删除失败'
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': f'文件夹为空或删除失败，失败数量: {failed_count}'}), 400

    except Exception as e:
        import traceback
        print(f"删除文件夹异常: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'删除文件夹失败: {str(e)}'}), 500

@app.route('/api/preview/<file_id>')
def preview_file(file_id):
    """文件预览API"""
    try:
        metadata = file_manager.get_file_metadata(file_id)
        if not metadata:
            return jsonify({'success': False, 'message': '文件不存在'}), 404
        
        file_path = metadata['file_path']
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': '文件不存在'}), 404
        
        # 检查是否为可预览的文本文件
        if metadata['file_extension'] in app.config['PREVIEWABLE_EXTENSIONS']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return jsonify({
                    'success': True,
                    'content': content,
                    'filename': metadata['original_name'],
                    'type': 'text'
                })
            except UnicodeDecodeError:
                return jsonify({'success': False, 'message': '文件编码不支持预览'}), 400
        
        # 检查是否为图片文件
        elif metadata['file_extension'] in app.config['IMAGE_EXTENSIONS']:
            return send_file(file_path)
        
        else:
            return jsonify({'success': False, 'message': '文件类型不支持预览'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'预览失败: {str(e)}'}), 500

@app.route('/api/text/save', methods=['POST'])
def save_text():
    """保存文本文件API"""
    try:
        data = request.get_json()
        if not data or 'filename' not in data or 'content' not in data:
            return jsonify({'success': False, 'message': '缺少文件名或内容'}), 400
        
        filename = data['filename']
        content = data['content']
        
        file_id, metadata = file_manager.save_text_file(filename, content)
        if file_id:
            return jsonify({
                'success': True,
                'message': '文本文件保存成功',
                'file_id': file_id,
                'filename': metadata['original_name'],
                'size': format_file_size(metadata['file_size'])
            })
        else:
            return jsonify({'success': False, 'message': '保存失败'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'保存失败: {str(e)}'}), 500

@app.route('/api/cleanup', methods=['POST'])
def manual_cleanup():
    """手动清理过期文件API"""
    try:
        expired_count = file_manager.cleanup_expired_files()
        return jsonify({
            'success': True,
            'message': f'清理完成，删除了 {expired_count} 个过期文件'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'清理失败: {str(e)}'}), 500

@app.route('/api/batch/delete', methods=['POST'])
@require_operation_log(Operations.FILE_DELETE)
def batch_delete_files():
    """批量删除文件API"""
    try:
        data = request.get_json()
        if not data or 'file_ids' not in data:
            return jsonify({'success': False, 'message': '缺少文件ID列表'}), 400
        
        file_ids = data['file_ids']
        if not isinstance(file_ids, list) or len(file_ids) == 0:
            return jsonify({'success': False, 'message': '文件ID列表格式错误或为空'}), 400
        
        if len(file_ids) > 100:  # 限制批量操作数量
            return jsonify({'success': False, 'message': '批量删除数量不能超过100个'}), 400
        
        success_count = 0
        failed_count = 0
        failed_files = []
        
        for file_id in file_ids:
            try:
                if file_manager.delete_file(file_id):
                    success_count += 1
                else:
                    failed_count += 1
                    failed_files.append(file_id)
            except Exception as e:
                failed_count += 1
                failed_files.append(file_id)
                logger.error(f"删除文件失败 {file_id}: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': f'批量删除完成：成功 {success_count} 个，失败 {failed_count} 个',
            'success_count': success_count,
            'failed_count': failed_count,
            'failed_files': failed_files
        })
        
    except Exception as e:
        logger.error(f"批量删除失败: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f'批量删除失败: {str(e)}'}), 500

@app.route('/api/batch/download', methods=['POST'])
@require_operation_log(Operations.FILE_DOWNLOAD)
def batch_download_files():
    """批量下载文件API（创建ZIP包）"""
    try:
        data = request.get_json()
        if not data or 'file_ids' not in data:
            return jsonify({'success': False, 'message': '缺少文件ID列表'}), 400
        
        file_ids = data['file_ids']
        if not isinstance(file_ids, list) or len(file_ids) == 0:
            return jsonify({'success': False, 'message': '文件ID列表格式错误或为空'}), 400
        
        if len(file_ids) > 50:  # 限制批量下载数量
            return jsonify({'success': False, 'message': '批量下载数量不能超过50个'}), 400
        
        # 创建临时ZIP文件
        temp_zip = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
        temp_zip.close()
        
        added_files = 0
        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_id in file_ids:
                try:
                    metadata = file_manager.get_file_metadata(file_id)
                    if metadata and os.path.exists(metadata['file_path']):
                        # 使用原始文件名，如果重名则添加数字后缀
                        zip_name = metadata['original_name']
                        counter = 1
                        original_zip_name = zip_name
                        
                        # 检查ZIP中是否已存在同名文件
                        while zip_name in zipf.namelist():
                            name, ext = os.path.splitext(original_zip_name)
                            zip_name = f"{name}_{counter}{ext}"
                            counter += 1
                        
                        zipf.write(metadata['file_path'], zip_name)
                        added_files += 1
                except Exception as e:
                    logger.error(f"添加文件到ZIP失败 {file_id}: {str(e)}")
                    continue
        
        if added_files == 0:
            os.remove(temp_zip.name)
            return jsonify({'success': False, 'message': '没有可下载的文件'}), 404
        
        # 生成下载文件名
        download_name = f"batch_download_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        def remove_file():
            """下载完成后删除临时文件"""
            try:
                if os.path.exists(temp_zip.name):
                    os.remove(temp_zip.name)
            except:
                pass
        
        # 发送文件并在完成后删除
        response = send_file(
            temp_zip.name,
            as_attachment=True,
            download_name=download_name,
            mimetype='application/zip'
        )
        
        # 注册清理函数
        response.call_on_close(remove_file)
        return response
        
    except Exception as e:
        logger.error(f"批量下载失败: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f'批量下载失败: {str(e)}'}), 500

@app.errorhandler(413)
def too_large(e):
    """文件过大错误处理"""
    return jsonify({'success': False, 'message': '文件太大，请检查服务器配置'}), 413

@app.errorhandler(404)
def not_found(e):
    """404错误处理"""
    return jsonify({'success': False, 'message': '页面不存在'}), 404

@app.errorhandler(500)
def internal_error(e):
    """500错误处理"""
    return jsonify({'success': False, 'message': '服务器内部错误'}), 500

if __name__ == '__main__':
    app.run(host=app.config['HOST'], port=app.config['PORT'], debug=app.config['DEBUG'])
