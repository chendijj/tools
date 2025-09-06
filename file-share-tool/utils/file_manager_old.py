import os
import json
import uuid
import mimetypes
import zipfile
import tempfile
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename

class FileManager:
    """文件管理器类"""
    
    def __init__(self, upload_folder, allowed_extensions, expire_hours=24):
        self.upload_folder = upload_folder
        self.allowed_extensions = allowed_extensions
        self.expire_hours = expire_hours
        self.metadata_file = os.path.join(upload_folder, 'metadata.json')
        self.ensure_upload_folder()
    
    def ensure_upload_folder(self):
        """确保上传目录存在"""
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
    
    def allowed_file(self, filename):
        """检查文件是否允许上传"""
        # 允许所有文件类型，包括没有扩展名的文件
        if not filename or filename.startswith('.'):
            return False
        return True
    
    def get_file_extension(self, filename):
        """获取文件扩展名"""
        return filename.rsplit('.', 1)[1].lower() if '.' in filename else 'bin'
    
    def get_file_type(self, filename):
        """获取文件MIME类型"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or 'application/octet-stream'
    
    def save_file(self, file, relative_path=None):
        """保存上传的文件"""
        if file and self.allowed_file(file.filename):
            file_id = str(uuid.uuid4())

            # 使用相对路径或原始文件名
            if relative_path:
                original_filename = relative_path
                display_name = relative_path
            else:
                original_filename = secure_filename(file.filename)
                display_name = original_filename

            file_extension = self.get_file_extension(os.path.basename(original_filename))
            stored_filename = f"{file_id}.{file_extension}"
            file_path = os.path.join(self.upload_folder, stored_filename)

            # 保存文件
            file.save(file_path)

            # 获取文件信息
            file_size = os.path.getsize(file_path)
            upload_time = datetime.now()
            expire_time = upload_time + timedelta(hours=self.expire_hours)

            # 创建元数据
            metadata = {
                'id': file_id,
                'original_name': display_name,
                'stored_name': stored_filename,
                'file_path': os.path.normpath(file_path),
                'file_size': file_size,
                'file_type': self.get_file_type(os.path.basename(original_filename)),
                'file_extension': file_extension,
                'upload_time': upload_time.isoformat(),
                'expire_time': expire_time.isoformat(),
                'relative_path': relative_path or original_filename
            }

            # 保存元数据
            self.save_metadata(metadata)
            return file_id, metadata
        return None, None
    
    def save_text_file(self, filename, content):
        """保存文本文件"""
        if not filename.endswith('.txt'):
            filename += '.txt'
        
        file_id = str(uuid.uuid4())
        original_filename = secure_filename(filename)
        stored_filename = f"{file_id}.txt"
        file_path = os.path.join(self.upload_folder, stored_filename)
        
        # 保存文本内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 获取文件信息
        file_size = os.path.getsize(file_path)
        upload_time = datetime.now()
        expire_time = upload_time + timedelta(hours=self.expire_hours)
        
        # 创建元数据
        metadata = {
            'id': file_id,
            'original_name': original_filename,
            'stored_name': stored_filename,
            'file_path': os.path.normpath(file_path),
            'file_size': file_size,
            'file_type': 'text/plain',
            'file_extension': 'txt',
            'upload_time': upload_time.isoformat(),
            'expire_time': expire_time.isoformat(),
            'is_text_file': True
        }
        
        # 保存元数据
        self.save_metadata(metadata)
        return file_id, metadata
    
    def load_metadata(self):
        """加载元数据"""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def save_all_metadata(self, metadata_dict):
        """保存所有元数据"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata_dict, f, ensure_ascii=False, indent=2)
        except IOError:
            pass
    
    def save_metadata(self, metadata):
        """保存单个文件的元数据"""
        all_metadata = self.load_metadata()
        all_metadata[metadata['id']] = metadata
        self.save_all_metadata(all_metadata)
    
    def get_file_list(self):
        """获取文件列表"""
        metadata_dict = self.load_metadata()
        file_list = []
        
        for file_id, metadata in metadata_dict.items():
            # 检查文件是否仍然存在
            if os.path.exists(metadata['file_path']):
                # 检查是否过期
                expire_time = datetime.fromisoformat(metadata['expire_time'])
                if datetime.now() < expire_time:
                    file_list.append(metadata)
        
        # 按上传时间倒序排列
        file_list.sort(key=lambda x: x['upload_time'], reverse=True)
        return file_list
    
    def get_file_metadata(self, file_id):
        """获取单个文件的元数据"""
        metadata_dict = self.load_metadata()
        return metadata_dict.get(file_id)
    
    def delete_file(self, file_id):
        """删除文件"""
        metadata_dict = self.load_metadata()
        if file_id in metadata_dict:
            metadata = metadata_dict[file_id]
            file_path = metadata['file_path']
            
            # 删除物理文件
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # 删除元数据
            del metadata_dict[file_id]
            self.save_all_metadata(metadata_dict)
            return True
        return False
    
    def cleanup_expired_files(self):
        """清理过期文件"""
        metadata_dict = self.load_metadata()
        current_time = datetime.now()
        expired_files = []
        
        for file_id, metadata in list(metadata_dict.items()):
            expire_time = datetime.fromisoformat(metadata['expire_time'])
            if current_time >= expire_time:
                # 删除过期文件
                file_path = metadata['file_path']
                if os.path.exists(file_path):
                    os.remove(file_path)
                expired_files.append(file_id)
                del metadata_dict[file_id]
        
        if expired_files:
            self.save_all_metadata(metadata_dict)
        
        return len(expired_files)
    
    def get_storage_info(self):
        """获取存储信息"""
        metadata_dict = self.load_metadata()
        total_files = len(metadata_dict)
        total_size = sum(metadata.get('file_size', 0) for metadata in metadata_dict.values())

        return {
            'total_files': total_files,
            'total_size': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2)
        }

    def get_folder_structure(self):
        """获取文件夹结构"""
        metadata_dict = self.load_metadata()
        folders = {}

        for file_id, metadata in metadata_dict.items():
            # 检查文件是否仍然存在且未过期
            if os.path.exists(metadata['file_path']):
                expire_time = datetime.fromisoformat(metadata['expire_time'])
                if datetime.now() < expire_time:
                    relative_path = metadata.get('relative_path', metadata['original_name'])

                    # 提取文件夹路径
                    if '/' in relative_path or '\\' in relative_path:
                        # 标准化路径分隔符
                        normalized_path = relative_path.replace('\\', '/')
                        # 使用顶级文件夹名称作为键
                        folder_name = normalized_path.split('/')[0]

                        if folder_name not in folders:
                            folders[folder_name] = []
                        folders[folder_name].append(metadata)

        return folders

    def create_folder_zip(self, folder_path):
        """为指定文件夹创建ZIP文件"""
        folders = self.get_folder_structure()

        if folder_path not in folders:
            return None

        # 创建临时ZIP文件
        temp_dir = tempfile.gettempdir()
        zip_filename = f"folder_{uuid.uuid4().hex[:8]}.zip"
        zip_path = os.path.join(temp_dir, zip_filename)

        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_metadata in folders[folder_path]:
                    file_path = file_metadata['file_path']
                    if os.path.exists(file_path):
                        # 在ZIP中保持相对路径结构
                        relative_path = file_metadata.get('relative_path', file_metadata['original_name'])
                        # 标准化路径分隔符
                        archive_name = relative_path.replace('\\', '/')
                        zipf.write(file_path, archive_name)

            return zip_path
        except Exception as e:
            # 如果创建失败，删除临时文件
            if os.path.exists(zip_path):
                os.remove(zip_path)
            raise e
