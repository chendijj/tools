"""
自定义异常类和统一异常处理
"""

class FileShareException(Exception):
    """文件分享系统基础异常"""
    def __init__(self, message, code=500, details=None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

class FileUploadException(FileShareException):
    """文件上传异常"""
    def __init__(self, message, details=None):
        super().__init__(message, 400, details)

class FileNotFoundError(FileShareException):
    """文件未找到异常"""
    def __init__(self, message="文件不存在", details=None):
        super().__init__(message, 404, details)

class FileTooLargeException(FileShareException):
    """文件过大异常"""
    def __init__(self, message="文件大小超过限制", details=None):
        super().__init__(message, 413, details)

class InvalidFileTypeException(FileShareException):
    """无效文件类型异常"""
    def __init__(self, message="不支持的文件类型", details=None):
        super().__init__(message, 400, details)

class RateLimitException(FileShareException):
    """频率限制异常"""
    def __init__(self, message="请求过于频繁", details=None):
        super().__init__(message, 429, details)

class StorageException(FileShareException):
    """存储系统异常"""
    def __init__(self, message="存储系统错误", details=None):
        super().__init__(message, 500, details)

class SecurityException(FileShareException):
    """安全异常"""
    def __init__(self, message="安全检查失败", details=None):
        super().__init__(message, 403, details)