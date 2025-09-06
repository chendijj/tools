"""
系统健康检查模块
"""
import os
import time
import psutil
from datetime import datetime, timedelta
from flask import jsonify
from .file_manager import FileManager
from .logging_config import get_logger

class HealthChecker:
    """系统健康检查器"""
    
    def __init__(self, file_manager: FileManager):
        self.file_manager = file_manager
        self.logger = get_logger()
        self.start_time = time.time()
    
    def check_system_resources(self):
        """检查系统资源"""
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # 内存使用率
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # 磁盘使用率
            upload_folder = self.file_manager.upload_folder
            disk_usage = psutil.disk_usage(os.path.dirname(upload_folder) if os.path.exists(upload_folder) else '/')
            disk_percent = (disk_usage.used / disk_usage.total) * 100
            
            return {
                'status': 'healthy' if cpu_percent < 80 and memory_percent < 80 and disk_percent < 90 else 'warning',
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'memory_available_gb': round(memory.available / (1024**3), 2),
                'disk_percent': round(disk_percent, 2),
                'disk_free_gb': round(disk_usage.free / (1024**3), 2)
            }
        except Exception as e:
            self.logger.error(f"系统资源检查失败: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def check_storage_system(self):
        """检查存储系统"""
        try:
            # 检查上传目录
            if not os.path.exists(self.file_manager.upload_folder):
                return {
                    'status': 'error',
                    'error': '上传目录不存在'
                }
            
            # 检查元数据文件
            metadata_accessible = os.access(self.file_manager.metadata_file, os.R_OK | os.W_OK)
            
            # 获取存储信息
            storage_info = self.file_manager.get_storage_info()
            
            return {
                'status': 'healthy' if metadata_accessible else 'warning',
                'upload_folder_exists': True,
                'metadata_accessible': metadata_accessible,
                'total_files': storage_info.get('total_files', 0),
                'total_size_mb': round(storage_info.get('total_size', 0) / (1024*1024), 2)
            }
        except Exception as e:
            self.logger.error(f"存储系统检查失败: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def check_file_cleanup(self):
        """检查文件清理状态"""
        try:
            # 统计过期文件数量
            metadata_dict = self.file_manager.load_metadata()
            now = datetime.now()
            expired_count = 0
            
            for file_id, metadata in metadata_dict.items():
                try:
                    expire_time = datetime.fromisoformat(metadata.get('expire_time', ''))
                    if now > expire_time:
                        expired_count += 1
                except (ValueError, TypeError):
                    pass
            
            return {
                'status': 'healthy' if expired_count < 100 else 'warning',
                'expired_files_count': expired_count,
                'total_files_count': len(metadata_dict)
            }
        except Exception as e:
            self.logger.error(f"文件清理状态检查失败: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def get_service_info(self):
        """获取服务信息"""
        uptime_seconds = time.time() - self.start_time
        uptime_hours = uptime_seconds / 3600
        
        return {
            'service_name': '局域网文件分享工具',
            'version': '2.0.0',
            'uptime_seconds': round(uptime_seconds, 2),
            'uptime_hours': round(uptime_hours, 2),
            'start_time': datetime.fromtimestamp(self.start_time).isoformat()
        }
    
    def comprehensive_health_check(self):
        """综合健康检查"""
        checks = {
            'service': self.get_service_info(),
            'system_resources': self.check_system_resources(),
            'storage_system': self.check_storage_system(),
            'file_cleanup': self.check_file_cleanup()
        }
        
        # 确定整体状态
        statuses = [check.get('status', 'unknown') for check in checks.values() if isinstance(check, dict) and 'status' in check]
        
        if 'error' in statuses:
            overall_status = 'unhealthy'
        elif 'warning' in statuses:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'
        
        return {
            'status': overall_status,
            'timestamp': datetime.now().isoformat(),
            'checks': checks
        }

def create_health_routes(app, file_manager: FileManager):
    """创建健康检查路由"""
    
    health_checker = HealthChecker(file_manager)
    logger = get_logger()
    
    @app.route('/health')
    def health_check():
        """基础健康检查"""
        try:
            from flask import request
            result = health_checker.comprehensive_health_check()
            status_code = 200 if result['status'] == 'healthy' else (503 if result['status'] == 'unhealthy' else 200)
            
            logger.info("健康检查请求", extra={
                'health_status': result['status'],
                'user_ip': getattr(request, 'remote_addr', 'unknown')
            })
            
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"健康检查失败: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': '健康检查失败',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/health/simple')
    def simple_health_check():
        """简单健康检查"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/health/detailed')
    def detailed_health_check():
        """详细健康检查"""
        try:
            result = health_checker.comprehensive_health_check()
            return jsonify(result)
        except Exception as e:
            logger.error(f"详细健康检查失败: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': '详细健康检查失败',
                'timestamp': datetime.now().isoformat()
            }), 500