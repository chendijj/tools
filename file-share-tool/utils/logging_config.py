"""
日志配置和工具函数
"""
import logging
import logging.handlers
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional

class JsonFormatter(logging.Formatter):
    """JSON格式的日志格式器"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # 添加额外的字段
        if hasattr(record, 'user_ip'):
            log_data['user_ip'] = record.user_ip
        if hasattr(record, 'file_id'):
            log_data['file_id'] = record.file_id
        if hasattr(record, 'operation'):
            log_data['operation'] = record.operation
        if hasattr(record, 'file_name'):
            log_data['file_name'] = record.file_name
        if hasattr(record, 'file_size'):
            log_data['file_size'] = record.file_size
            
        # 添加异常信息
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_data, ensure_ascii=False)

def setup_logging(app):
    """设置应用日志配置"""
    
    # 创建日志目录
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    # 应用日志
    app_logger = logging.getLogger('file_share')
    app_logger.setLevel(logging.INFO)
    
    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    app_logger.addHandler(console_handler)
    
    # 文件处理器
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(logs_dir, 'app.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(JsonFormatter())
    app_logger.addHandler(file_handler)
    
    # 审计日志
    audit_logger = logging.getLogger('audit')
    audit_logger.setLevel(logging.INFO)
    
    audit_handler = logging.handlers.RotatingFileHandler(
        os.path.join(logs_dir, 'audit.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10,
        encoding='utf-8'
    )
    audit_handler.setFormatter(JsonFormatter())
    audit_logger.addHandler(audit_handler)
    
    # 错误日志
    error_logger = logging.getLogger('error')
    error_logger.setLevel(logging.ERROR)
    
    error_handler = logging.handlers.RotatingFileHandler(
        os.path.join(logs_dir, 'error.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10,
        encoding='utf-8'
    )
    error_handler.setFormatter(JsonFormatter())
    error_logger.addHandler(error_handler)
    
    return app_logger

def get_logger(name: str = 'file_share') -> logging.Logger:
    """获取日志记录器"""
    return logging.getLogger(name)

def log_operation(operation: str, user_ip: str, **kwargs):
    """记录操作审计日志"""
    audit_logger = logging.getLogger('audit')
    
    # 创建带有额外信息的日志记录
    extra = {
        'operation': operation,
        'user_ip': user_ip,
        **kwargs
    }
    
    audit_logger.info(f"用户操作: {operation}", extra=extra)

def log_error(error_msg: str, exception: Exception = None, **kwargs):
    """记录错误日志"""
    error_logger = logging.getLogger('error')
    
    extra = kwargs
    
    if exception:
        error_logger.error(error_msg, exc_info=True, extra=extra)
    else:
        error_logger.error(error_msg, extra=extra)

# 操作类型常量
class Operations:
    FILE_UPLOAD = "file_upload"
    FILE_DOWNLOAD = "file_download"
    FILE_DELETE = "file_delete"
    FILE_PREVIEW = "file_preview"
    TEXT_SAVE = "text_save"
    FOLDER_DOWNLOAD = "folder_download"
    FOLDER_DELETE = "folder_delete"
    CLEANUP = "cleanup"