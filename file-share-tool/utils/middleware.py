"""
Flask异常处理中间件和工具函数
"""
from functools import wraps
from flask import request, jsonify, g
import traceback
import time
from .exceptions import FileShareException
from .logging_config import get_logger, log_error, log_operation

def get_client_ip():
    """获取客户端IP地址"""
    if request.environ.get('HTTP_X_FORWARDED_FOR'):
        return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
    elif request.environ.get('HTTP_X_REAL_IP'):
        return request.environ.get('HTTP_X_REAL_IP')
    else:
        return request.environ.get('REMOTE_ADDR', 'unknown')

def setup_error_handlers(app):
    """设置Flask应用的错误处理器"""
    
    logger = get_logger()
    
    @app.errorhandler(FileShareException)
    def handle_file_share_exception(error):
        """处理自定义异常"""
        client_ip = get_client_ip()
        
        log_error(
            f"业务异常: {error.message}",
            exception=error,
            user_ip=client_ip,
            error_code=error.code,
            error_details=error.details
        )
        
        return jsonify({
            'success': False,
            'message': error.message,
            'code': error.code,
            'timestamp': time.time()
        }), error.code
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """处理404错误"""
        client_ip = get_client_ip()
        
        log_error(
            f"页面未找到: {request.url}",
            user_ip=client_ip,
            url=request.url,
            method=request.method
        )
        
        return jsonify({
            'success': False,
            'message': '请求的资源不存在',
            'code': 404,
            'timestamp': time.time()
        }), 404
    
    @app.errorhandler(413)
    def handle_too_large(error):
        """处理文件过大错误"""
        client_ip = get_client_ip()
        
        log_error(
            "文件上传大小超过限制",
            user_ip=client_ip,
            content_length=request.content_length
        )
        
        return jsonify({
            'success': False,
            'message': '文件大小超过限制',
            'code': 413,
            'timestamp': time.time()
        }), 413
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """处理内部服务器错误"""
        client_ip = get_client_ip()
        
        log_error(
            "内部服务器错误",
            exception=error,
            user_ip=client_ip,
            url=request.url,
            method=request.method
        )
        
        return jsonify({
            'success': False,
            'message': '服务器内部错误',
            'code': 500,
            'timestamp': time.time()
        }), 500
    
    @app.before_request
    def before_request():
        """请求前处理"""
        g.start_time = time.time()
        g.client_ip = get_client_ip()
    
    @app.after_request
    def after_request(response):
        """请求后处理"""
        # 记录请求日志
        duration = time.time() - g.get('start_time', time.time())
        
        if request.endpoint and not request.endpoint.startswith('static'):
            logger.info(
                f"{request.method} {request.path} - {response.status_code}",
                extra={
                    'user_ip': g.get('client_ip', 'unknown'),
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'duration_ms': round(duration * 1000, 2),
                    'content_length': response.content_length
                }
            )
        
        return response

def require_operation_log(operation_type):
    """装饰器：自动记录操作日志"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = get_client_ip()
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                
                # 记录成功操作
                log_operation(
                    operation_type,
                    client_ip,
                    duration_ms=round((time.time() - start_time) * 1000, 2),
                    success=True
                )
                
                return result
                
            except Exception as e:
                # 记录失败操作
                log_operation(
                    operation_type,
                    client_ip,
                    duration_ms=round((time.time() - start_time) * 1000, 2),
                    success=False,
                    error=str(e)
                )
                raise
                
        return decorated_function
    return decorator