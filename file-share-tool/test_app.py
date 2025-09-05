#!/usr/bin/env python3
"""
简化测试版本
"""

try:
    print("正在导入模块...")
    
    from flask import Flask
    print("✅ Flask导入成功")
    
    import os
    print("✅ os导入成功")
    
    from config import Config
    print("✅ Config导入成功")
    
    from utils.file_manager import FileManager
    print("✅ FileManager导入成功")
    
    from utils.cleanup import start_cleanup_scheduler
    print("✅ cleanup导入成功")
    
    # 创建Flask应用
    app = Flask(__name__)
    app.config.from_object(Config)
    print("✅ Flask应用创建成功")
    
    # 初始化配置
    Config.init_app(app)
    print("✅ 配置初始化成功")
    
    # 创建文件管理器
    file_manager = FileManager(
        upload_folder=app.config['UPLOAD_FOLDER'],
        allowed_extensions=app.config['ALLOWED_EXTENSIONS'],
        expire_hours=app.config['FILE_EXPIRE_HOURS']
    )
    print("✅ 文件管理器创建成功")
    
    @app.route('/')
    def index():
        return "Hello World! 文件分享工具测试页面"
    
    print("✅ 所有模块导入成功，准备启动服务器...")
    
    if __name__ == '__main__':
        app.run(host='0.0.0.0', port=5000, debug=True)
        
except Exception as e:
    import traceback
    print(f"❌ 错误: {e}")
    print("详细错误信息:")
    traceback.print_exc()
