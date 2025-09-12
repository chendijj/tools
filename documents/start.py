#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
功能单据分类工具 - 独立启动服务器
专门用于启动文档分类工具的HTTP服务器
"""

import os
import sys
import argparse
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import time
import socket

class DocumentsHTTPRequestHandler(SimpleHTTPRequestHandler):
    """文档分类工具专用HTTP请求处理器"""
    
    def __init__(self, *args, **kwargs):
        # 设置文档目录为当前目录
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def end_headers(self):
        # 添加CORS头部支持
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 设置缓存策略
        if self.path.endswith('.css') or self.path.endswith('.js'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")
    
    def do_GET(self):
        """处理GET请求"""
        # 根目录重定向到index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        # 处理shared资源访问
        if self.path.startswith('/shared/'):
            # 访问上一级目录的shared文件夹
            shared_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), self.path[1:])
            if os.path.exists(shared_path):
                with open(shared_path, 'rb') as f:
                    content = f.read()
                
                # 设置正确的Content-Type
                if self.path.endswith('.css'):
                    content_type = 'text/css; charset=utf-8'
                elif self.path.endswith('.js'):
                    content_type = 'application/javascript; charset=utf-8'
                else:
                    content_type = 'text/plain; charset=utf-8'
                
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return
        
        return super().do_GET()

def check_port_available(port):
    """检查端口是否可用"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result != 0

def find_available_port(start_port=8001, max_port=9000):
    """找到可用的端口"""
    for port in range(start_port, max_port):
        if check_port_available(port):
            return port
    return None

def open_browser(url, delay=1):
    """延迟打开浏览器"""
    def _open():
        time.sleep(delay)
        try:
            webbrowser.open(url)
            print(f"🌐 已在浏览器中打开: {url}")
        except Exception as e:
            print(f"⚠️  无法自动打开浏览器: {e}")
    
    thread = threading.Thread(target=_open)
    thread.daemon = True
    thread.start()

def main():
    parser = argparse.ArgumentParser(
        description='功能单据分类工具 - 独立启动服务器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例用法:
  python start.py                     # 使用默认端口8001
  python start.py -p 3000            # 使用端口3000
  python start.py --no-browser       # 不自动打开浏览器
  python start.py --host 0.0.0.0     # 允许外部访问
        '''
    )
    
    parser.add_argument(
        '-p', '--port', 
        type=int, 
        default=8001, 
        help='服务器端口号 (默认: 8001)'
    )
    
    parser.add_argument(
        '--host', 
        type=str, 
        default='127.0.0.1', 
        help='服务器主机地址 (默认: 127.0.0.1)'
    )
    
    parser.add_argument(
        '--no-browser', 
        action='store_true', 
        help='不自动打开浏览器'
    )
    
    parser.add_argument(
        '--auto-port', 
        action='store_true', 
        help='自动寻找可用端口'
    )
    
    args = parser.parse_args()
    
    # 检查必需文件
    current_dir = os.path.dirname(os.path.abspath(__file__))
    required_files = ['index.html']
    shared_files = ['../shared/theme.css', '../shared/theme.js']
    
    missing_files = []
    for f in required_files:
        if not os.path.exists(os.path.join(current_dir, f)):
            missing_files.append(f)
    
    for f in shared_files:
        if not os.path.exists(os.path.join(current_dir, f)):
            missing_files.append(f)
    
    if missing_files:
        print("❌ 错误: 以下必需文件未找到:")
        for f in missing_files:
            print(f"   - {f}")
        print("\n请确保在documents目录下运行此脚本，且shared目录存在")
        sys.exit(1)
    
    # 确定使用的端口
    port = args.port
    if args.auto_port or not check_port_available(port):
        available_port = find_available_port(port)
        if available_port is None:
            print(f"❌ 错误: 无法找到可用端口 (尝试范围: {port}-9000)")
            sys.exit(1)
        
        if available_port != port:
            print(f"⚠️  端口 {port} 已被占用, 使用端口 {available_port}")
        port = available_port
    
    try:
        # 切换到documents目录
        os.chdir(current_dir)
        
        # 创建HTTP服务器
        httpd = HTTPServer((args.host, port), DocumentsHTTPRequestHandler)
        
        print("📋 功能单据分类工具服务器已启动!")
        print("=" * 45)
        print(f"📍 访问地址: http://{args.host}:{port}")
        
        if args.host == '0.0.0.0':
            local_ip = socket.gethostbyname(socket.gethostname())
            print(f"📍 局域网访问: http://{local_ip}:{port}")
        
        print("=" * 45)
        print("✨ 功能特色:")
        print("   - 智能分类功能单据")
        print("   - 自定义分类规则管理")
        print("   - 关键词冲突检测")
        print("   - 支持明暗主题切换")
        print("=" * 45)
        print("按 Ctrl+C 停止服务器\n")
        
        # 自动打开浏览器
        if not args.no_browser:
            server_url = f"http://127.0.0.1:{port}" if args.host == '0.0.0.0' else f"http://{args.host}:{port}"
            open_browser(server_url)
        
        # 启动服务器
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n\n👋 正在关闭服务器...")
        httpd.server_close()
        print("✅ 功能单据分类工具服务器已关闭")
        
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 错误: 端口 {port} 已被占用")
            print("请尝试使用 --auto-port 参数自动选择可用端口")
        else:
            print(f"❌ 启动服务器时出错: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()