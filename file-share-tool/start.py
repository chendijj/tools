#!/usr/bin/env python3
"""
局域网文件分享工具启动脚本
"""

import os
import sys
import socket
import qrcode
from io import BytesIO
import base64
import webbrowser
import threading
import time
from datetime import datetime

def get_local_ip():
    """获取本机IP地址"""
    try:
        # 连接到外部地址来获取本机IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def generate_qr_code(url):
    """生成二维码并保存为文件"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 保存二维码图片
        qr_path = os.path.join('static', 'qr_code.png')
        os.makedirs('static', exist_ok=True)
        img.save(qr_path)
        
        return qr_path
    except Exception as e:
        print(f"生成二维码失败: {e}")
        return None

def check_dependencies():
    """检查依赖是否安装"""
    try:
        import flask
        import qrcode
        import PIL
        return True
    except ImportError as e:
        print(f"缺少依赖: {e}")
        print("请运行以下命令安装依赖:")
        print("py -m pip install -r requirements.txt")
        return False

def open_browser(url, delay=2):
    """延迟打开浏览器"""
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception:
        pass

def main():
    """主函数"""
    
    # 检查依赖
    if not check_dependencies():
        input("按回车键退出...")
        sys.exit(1)
    
    # 获取本机IP和端口
    local_ip = get_local_ip()
    port = 5000
    
    # 检查端口是否被占用
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex((local_ip, port))
    sock.close()
    
    if result == 0:
        print(f"⚠️  端口 {port} 已被占用，尝试使用其他端口...")
        for test_port in range(5001, 5010):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex((local_ip, test_port))
            sock.close()
            if result != 0:
                port = test_port
                break
        else:
            print("❌ 无法找到可用端口，请检查网络设置")
            input("按回车键退出...")
            sys.exit(1)
    
    # 构建访问地址
    local_url = f"http://localhost:{port}"
    network_url = f"http://{local_ip}:{port}"
    
    # 生成二维码
    qr_path = generate_qr_code(network_url)
    
    # 延迟打开浏览器
    browser_thread = threading.Thread(target=open_browser, args=(local_url,))
    browser_thread.daemon = True
    browser_thread.start()
    
    # 导入并启动Flask应用
    try:
        # 添加当前目录到Python路径
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

        from app import app

        # 更新配置
        app.config['PORT'] = port

        # 启动Flask应用
        app.run(
            host='0.0.0.0',
            port=port,
            debug=False,
            use_reloader=False,
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n")
        print("🛑 服务已停止")
        print("👋 感谢使用局域网文件分享工具！")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        print("请检查错误信息并重试")
    finally:
        # 清理二维码文件
        if qr_path and os.path.exists(qr_path):
            try:
                os.remove(qr_path)
            except:
                pass
        
        input("按回车键退出...")

if __name__ == '__main__':
    main()
