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

# 创建Flask应用
app = Flask(__name__)
app.config.from_object(Config)

# 初始化配置
Config.init_app(app)

# 创建文件管理器
file_manager = FileManager(
    upload_folder=app.config['UPLOAD_FOLDER'],
    allowed_extensions=app.config['ALLOWED_EXTENSIONS'],
    expire_hours=app.config['FILE_EXPIRE_HOURS']
)

# 启动文件清理调度器
cleanup_scheduler = start_cleanup_scheduler(
    file_manager, 
    app.config['CLEANUP_INTERVAL_MINUTES']
)

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
def upload_file():
    """文件上传API"""
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'success': False, 'message': '没有选择文件'}), 400
        
        uploaded_files = []
        failed_files = []
        
        for file in files:
            if file and file.filename != '':
                file_id, metadata = file_manager.save_file(file)
                if file_id:
                    uploaded_files.append({
                        'id': file_id,
                        'name': metadata['original_name'],
                        'size': format_file_size(metadata['file_size'])
                    })
                else:
                    failed_files.append(file.filename)
        
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
    """获取文件列表API"""
    try:
        files = file_manager.get_file_list()
        storage_info = file_manager.get_storage_info()
        
        # 格式化文件信息
        formatted_files = []
        for file_info in files:
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
                'is_text_file': file_info.get('is_text_file', False)
            })
        
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
