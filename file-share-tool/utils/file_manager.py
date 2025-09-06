import os
import json
import uuid
import mimetypes
import zipfile
import tempfile
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from .database import DatabaseManager
from .logging_config import get_logger

class FileManager:
    """文件管理器类（SQLite版本）"""
    
    def __init__(self, upload_folder, allowed_extensions, expire_hours=24):
        self.upload_folder = upload_folder
        self.allowed_extensions = allowed_extensions
        self.expire_hours = expire_hours
        self.logger = get_logger()
        
        # SQLite数据库路径
        self.db_path = os.path.join(upload_folder, 'metadata.db')
        self.database = DatabaseManager(self.db_path)
        
        # 确保上传目录存在
        self.ensure_upload_folder()
        
        # 从旧的JSON文件迁移数据（如果存在）
        self.migrate_from_json()
    
    def ensure_upload_folder(self):
        """确保上传目录存在"""
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
            self.logger.info(f"创建上传目录: {self.upload_folder}")
    
    def migrate_from_json(self):
        """从JSON文件迁移数据到SQLite"""
        json_file = os.path.join(self.upload_folder, 'metadata.json')
        if os.path.exists(json_file):
            self.logger.info("检测到旧的JSON元数据文件，开始迁移...")
            if self.database.migrate_from_json(json_file):
                # 迁移成功后备份JSON文件
                backup_file = f"{json_file}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                os.rename(json_file, backup_file)
                self.logger.info(f"JSON数据迁移完成，原文件已备份为: {backup_file}")
    
    def allowed_file(self, filename):
        """检查文件是否允许上传"""
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
        try:
            if not file or not self.allowed_file(file.filename):
                return None, None
            
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
            self.logger.info(f"文件保存成功: {stored_filename}")
            
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
            
            # 保存元数据到数据库
            if self.database.save_file_metadata(metadata):
                self.logger.info(f"文件元数据保存成功: {file_id}")
                return file_id, metadata
            else:
                # 如果数据库保存失败，删除已保存的文件
                if os.path.exists(file_path):
                    os.remove(file_path)
                self.logger.error(f"文件元数据保存失败，已删除文件: {stored_filename}")
                return None, None
                
        except Exception as e:
            self.logger.error(f"保存文件失败: {str(e)}", exc_info=True)
            return None, None
    
    def save_text_file(self, filename, content):
        """保存文本文件"""
        try:
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
            
            # 保存元数据到数据库
            if self.database.save_file_metadata(metadata):
                self.logger.info(f"文本文件保存成功: {file_id}")
                return file_id, metadata
            else:
                if os.path.exists(file_path):
                    os.remove(file_path)
                return None, None
                
        except Exception as e:
            self.logger.error(f"保存文本文件失败: {str(e)}", exc_info=True)
            return None, None
    
    def get_file_list(self, limit=None, offset=0):
        """获取文件列表"""
        try:
            return self.database.get_all_files(limit, offset)
        except Exception as e:
            self.logger.error(f"获取文件列表失败: {str(e)}", exc_info=True)
            return []
    
    def get_folder_structure(self):
        """获取文件夹结构"""
        try:
            return self.database.get_folder_structure()
        except Exception as e:
            self.logger.error(f"获取文件夹结构失败: {str(e)}", exc_info=True)
            return {}
    
    def get_file_metadata(self, file_id):
        """获取文件元数据"""
        return self.database.get_file_metadata(file_id)
    
    def delete_file(self, file_id):
        """删除文件"""
        try:
            # 获取文件元数据
            metadata = self.database.get_file_metadata(file_id)
            if not metadata:
                self.logger.warning(f"要删除的文件不存在: {file_id}")
                return False
            
            # 删除物理文件
            file_path = metadata['file_path']
            if os.path.exists(file_path):
                os.remove(file_path)
                self.logger.info(f"删除物理文件: {file_path}")
            
            # 删除数据库记录
            success = self.database.delete_file_metadata(file_id)
            if success:
                self.logger.info(f"文件删除成功: {file_id}")
            return success
            
        except Exception as e:
            self.logger.error(f"删除文件失败: {str(e)}", exc_info=True)
            return False
    
    def cleanup_expired_files(self):
        """清理过期文件"""
        try:
            expired_files = self.database.get_expired_files()
            cleanup_count = 0
            
            for file_metadata in expired_files:
                try:
                    file_id = file_metadata['id']
                    file_path = file_metadata['file_path']
                    
                    # 删除物理文件
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    
                    # 删除数据库记录
                    if self.database.delete_file_metadata(file_id):
                        cleanup_count += 1
                        self.logger.info(f"清理过期文件: {file_id}")
                    
                except Exception as e:
                    self.logger.error(f"清理单个文件失败: {str(e)}")
                    continue
            
            if cleanup_count > 0:
                self.logger.info(f"文件清理完成，共清理 {cleanup_count} 个过期文件")
                # 优化数据库
                self.database.vacuum_database()
            
            return cleanup_count
            
        except Exception as e:
            self.logger.error(f"清理过期文件失败: {str(e)}", exc_info=True)
            return 0
    
    def get_storage_info(self):
        """获取存储信息"""
        try:
            return self.database.get_storage_stats()
        except Exception as e:
            self.logger.error(f"获取存储信息失败: {str(e)}", exc_info=True)
            return {
                'total_files': 0,
                'total_size': 0,
                'expired_files': 0,
                'type_statistics': []
            }
    
    def create_folder_zip(self, folder_path):
        """创建文件夹的ZIP压缩包"""
        try:
            folder_structure = self.database.get_folder_structure()
            
            if folder_path not in folder_structure:
                self.logger.warning(f"文件夹不存在: {folder_path}")
                return None
            
            files_in_folder = folder_structure[folder_path]
            if not files_in_folder:
                self.logger.warning(f"文件夹为空: {folder_path}")
                return None
            
            # 创建临时ZIP文件
            temp_zip = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
            temp_zip.close()
            
            with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_info in files_in_folder:
                    file_path = file_info['file_path']
                    if os.path.exists(file_path):
                        # 在ZIP中使用相对路径
                        relative_path = file_info.get('relative_path', file_info['original_name'])
                        # 移除文件夹前缀，只保留文件名
                        zip_path = os.path.basename(relative_path)
                        zipf.write(file_path, zip_path)
            
            self.logger.info(f"创建文件夹ZIP: {folder_path} -> {temp_zip.name}")
            return temp_zip.name
            
        except Exception as e:
            self.logger.error(f"创建文件夹ZIP失败: {str(e)}", exc_info=True)
            return None