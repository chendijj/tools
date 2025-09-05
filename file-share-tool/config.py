import os

class Config:
    """应用配置类"""
    
    # 基础配置
    SECRET_KEY = os.urandom(24)
    
    # 文件上传配置
    UPLOAD_FOLDER = os.path.join('static', 'uploads')
    MAX_CONTENT_LENGTH = None  # 无文件大小限制
    
    # 文件过期时间（小时）
    FILE_EXPIRE_HOURS = 24
    
    # 允许的文件扩展名
    ALLOWED_EXTENSIONS = {
        # 文本文件
        'txt', 'md', 'py', 'js', 'html', 'css', 'json', 'xml', 'csv', 'log',
        # 文档文件
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        # 图片文件
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp',
        # 压缩文件
        'zip', 'rar', '7z', 'tar', 'gz',
        # 可执行文件
        'exe', 'msi', 'bat', 'cmd', 'sh', 'app', 'dmg', 'deb', 'rpm',
        # 库文件
        'dll', 'so', 'dylib', 'lib', 'a',
        # 配置文件
        'ini', 'cfg', 'conf', 'properties', 'yaml', 'yml', 'toml',
        # 开发文件
        'c', 'cpp', 'h', 'hpp', 'java', 'class', 'jar', 'war',
        # 数据文件
        'db', 'sqlite', 'sql', 'bak',
        # 媒体文件
        'mp3', 'mp4', 'avi', 'mov', 'wav', 'flv', 'mkv', 'wmv',
        # 其他常见文件
        'bin', 'dat', 'tmp', 'cache', 'lock'
    }
    
    # 可预览的文件类型
    PREVIEWABLE_EXTENSIONS = {
        'txt', 'md', 'py', 'js', 'html', 'css', 'json', 'xml', 'csv', 'log'
    }
    
    # 图片文件类型
    IMAGE_EXTENSIONS = {
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'
    }
    
    # 服务器配置
    HOST = '0.0.0.0'  # 允许局域网访问
    PORT = 5000
    DEBUG = True
    
    # 清理任务配置
    CLEANUP_INTERVAL_MINUTES = 60  # 每60分钟执行一次清理
    
    @staticmethod
    def init_app(app):
        """初始化应用配置"""
        # 确保上传目录存在
        upload_dir = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
