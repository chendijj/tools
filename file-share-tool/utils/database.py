"""
SQLite数据库管理模块
"""
import sqlite3
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import threading
from contextlib import contextmanager
from .logging_config import get_logger

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.logger = get_logger()
        self._lock = threading.RLock()
        self.init_database()
    
    def init_database(self):
        """初始化数据库"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # 创建文件元数据表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS file_metadata (
                        id TEXT PRIMARY KEY,
                        original_name TEXT NOT NULL,
                        stored_name TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        file_size INTEGER NOT NULL,
                        file_type TEXT,
                        file_extension TEXT,
                        upload_time TIMESTAMP NOT NULL,
                        expire_time TIMESTAMP NOT NULL,
                        relative_path TEXT,
                        is_text_file BOOLEAN DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # 创建索引
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_expire_time ON file_metadata(expire_time)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_upload_time ON file_metadata(upload_time)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_file_extension ON file_metadata(file_extension)')
                
                # 创建操作日志表（用于审计）
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS operation_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        operation_type TEXT NOT NULL,
                        file_id TEXT,
                        user_ip TEXT,
                        user_agent TEXT,
                        success BOOLEAN NOT NULL,
                        error_message TEXT,
                        duration_ms REAL,
                        extra_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_operation_created_at ON operation_logs(created_at)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_operation_type ON operation_logs(operation_type)')
                
                conn.commit()
                self.logger.info("数据库初始化完成")
                
        except Exception as e:
            self.logger.error(f"数据库初始化失败: {str(e)}", exc_info=True)
            raise
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = None
        try:
            with self._lock:
                conn = sqlite3.connect(self.db_path, timeout=30.0)
                conn.row_factory = sqlite3.Row
                conn.execute('PRAGMA journal_mode=WAL')
                conn.execute('PRAGMA synchronous=NORMAL')
                conn.execute('PRAGMA temp_store=MEMORY')
                conn.execute('PRAGMA mmap_size=268435456')  # 256MB
                yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            self.logger.error(f"数据库连接错误: {str(e)}", exc_info=True)
            raise
        finally:
            if conn:
                conn.close()
    
    def save_file_metadata(self, metadata: Dict[str, Any]) -> bool:
        """保存文件元数据"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT OR REPLACE INTO file_metadata 
                    (id, original_name, stored_name, file_path, file_size, file_type, 
                     file_extension, upload_time, expire_time, relative_path, is_text_file,
                     updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (
                    metadata['id'],
                    metadata['original_name'],
                    metadata['stored_name'],
                    metadata['file_path'],
                    metadata['file_size'],
                    metadata['file_type'],
                    metadata['file_extension'],
                    metadata['upload_time'],
                    metadata['expire_time'],
                    metadata.get('relative_path'),
                    metadata.get('is_text_file', False)
                ))
                
                conn.commit()
                return True
                
        except Exception as e:
            self.logger.error(f"保存文件元数据失败: {str(e)}", exc_info=True)
            return False
    
    def get_file_metadata(self, file_id: str) -> Optional[Dict[str, Any]]:
        """获取文件元数据"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM file_metadata WHERE id = ?', (file_id,))
                row = cursor.fetchone()
                
                if row:
                    return dict(row)
                return None
                
        except Exception as e:
            self.logger.error(f"获取文件元数据失败: {str(e)}", exc_info=True)
            return None
    
    def get_all_files(self, limit: int = None, offset: int = 0) -> List[Dict[str, Any]]:
        """获取所有文件列表"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                query = '''
                    SELECT * FROM file_metadata 
                    ORDER BY upload_time DESC
                '''
                
                params = []
                if limit:
                    query += ' LIMIT ? OFFSET ?'
                    params.extend([limit, offset])
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            self.logger.error(f"获取文件列表失败: {str(e)}", exc_info=True)
            return []
    
    def get_folder_structure(self) -> Dict[str, List[Dict[str, Any]]]:
        """获取文件夹结构 - 只返回根文件夹"""
        try:
            files = self.get_all_files()
            folder_structure = {}
            
            for file_info in files:
                relative_path = file_info.get('relative_path', file_info['original_name'])
                
                # 检查是否在文件夹中
                if '/' in relative_path or '\\' in relative_path:
                    # 统一使用正斜杠
                    path_parts = relative_path.replace('\\', '/').split('/')
                    if len(path_parts) > 1:
                        # 只取第一级文件夹作为根文件夹
                        root_folder = path_parts[0]
                        
                        if root_folder not in folder_structure:
                            folder_structure[root_folder] = []
                        folder_structure[root_folder].append(file_info)
            
            return folder_structure
            
        except Exception as e:
            self.logger.error(f"获取文件夹结构失败: {str(e)}", exc_info=True)
            return {}
    
    def delete_file_metadata(self, file_id: str) -> bool:
        """删除文件元数据"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM file_metadata WHERE id = ?', (file_id,))
                conn.commit()
                
                return cursor.rowcount > 0
                
        except Exception as e:
            self.logger.error(f"删除文件元数据失败: {str(e)}", exc_info=True)
            return False
    
    def get_expired_files(self) -> List[Dict[str, Any]]:
        """获取过期文件列表"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                current_time = datetime.now().isoformat()
                
                cursor.execute('''
                    SELECT * FROM file_metadata 
                    WHERE expire_time < ? 
                    ORDER BY expire_time ASC
                ''', (current_time,))
                
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
                
        except Exception as e:
            self.logger.error(f"获取过期文件失败: {str(e)}", exc_info=True)
            return []
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """获取存储统计信息"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # 总文件数和总大小
                cursor.execute('SELECT COUNT(*), SUM(file_size) FROM file_metadata')
                total_files, total_size = cursor.fetchone()
                
                # 按文件类型统计
                cursor.execute('''
                    SELECT file_extension, COUNT(*), SUM(file_size) 
                    FROM file_metadata 
                    GROUP BY file_extension 
                    ORDER BY SUM(file_size) DESC
                    LIMIT 10
                ''')
                type_stats = cursor.fetchall()
                
                # 过期文件统计
                current_time = datetime.now().isoformat()
                cursor.execute('SELECT COUNT(*) FROM file_metadata WHERE expire_time < ?', (current_time,))
                expired_count = cursor.fetchone()[0]
                
                return {
                    'total_files': total_files or 0,
                    'total_size': total_size or 0,
                    'expired_files': expired_count,
                    'type_statistics': [
                        {
                            'extension': row[0],
                            'count': row[1],
                            'total_size': row[2]
                        } for row in type_stats
                    ]
                }
                
        except Exception as e:
            self.logger.error(f"获取存储统计失败: {str(e)}", exc_info=True)
            return {
                'total_files': 0,
                'total_size': 0,
                'expired_files': 0,
                'type_statistics': []
            }
    
    def log_operation(self, operation_type: str, user_ip: str, file_id: str = None, 
                     success: bool = True, error_message: str = None, 
                     duration_ms: float = None, extra_data: Dict = None):
        """记录操作日志"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO operation_logs 
                    (operation_type, file_id, user_ip, success, error_message, duration_ms, extra_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    operation_type,
                    file_id,
                    user_ip,
                    success,
                    error_message,
                    duration_ms,
                    json.dumps(extra_data) if extra_data else None
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"记录操作日志失败: {str(e)}", exc_info=True)
    
    def get_operation_logs(self, limit: int = 100, operation_type: str = None) -> List[Dict[str, Any]]:
        """获取操作日志"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                query = 'SELECT * FROM operation_logs'
                params = []
                
                if operation_type:
                    query += ' WHERE operation_type = ?'
                    params.append(operation_type)
                
                query += ' ORDER BY created_at DESC LIMIT ?'
                params.append(limit)
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                logs = []
                for row in rows:
                    log_data = dict(row)
                    if log_data.get('extra_data'):
                        try:
                            log_data['extra_data'] = json.loads(log_data['extra_data'])
                        except:
                            pass
                    logs.append(log_data)
                
                return logs
                
        except Exception as e:
            self.logger.error(f"获取操作日志失败: {str(e)}", exc_info=True)
            return []
    
    def cleanup_old_logs(self, days_to_keep: int = 30) -> int:
        """清理旧的操作日志"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).isoformat()
                
                cursor.execute('DELETE FROM operation_logs WHERE created_at < ?', (cutoff_date,))
                conn.commit()
                
                return cursor.rowcount
                
        except Exception as e:
            self.logger.error(f"清理旧日志失败: {str(e)}", exc_info=True)
            return 0
    
    def migrate_from_json(self, json_file_path: str) -> bool:
        """从JSON文件迁移数据"""
        try:
            if not os.path.exists(json_file_path):
                return True
            
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            migrated_count = 0
            for file_id, metadata in json_data.items():
                if self.save_file_metadata(metadata):
                    migrated_count += 1
            
            self.logger.info(f"成功从JSON迁移 {migrated_count} 条记录")
            return True
            
        except Exception as e:
            self.logger.error(f"从JSON迁移失败: {str(e)}", exc_info=True)
            return False
    
    def vacuum_database(self):
        """清理和优化数据库"""
        try:
            with self.get_connection() as conn:
                conn.execute('VACUUM')
                conn.execute('ANALYZE')
            
            self.logger.info("数据库优化完成")
            
        except Exception as e:
            self.logger.error(f"数据库优化失败: {str(e)}", exc_info=True)