#!/bin/bash

# 文件分享工具部署脚本

set -e

echo "🚀 开始部署文件分享工具..."

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装 Python 依赖
echo "📥 安装 Python 依赖..."
pip install -r requirements.txt

# 检查 Node.js 环境（可选）
if command -v npm &> /dev/null; then
    echo "📦 安装前端依赖..."
    npm install
    
    echo "🔨 构建前端资源..."
    npm run build
else
    echo "⚠️  Node.js 未安装，跳过前端构建"
fi

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p static/uploads
mkdir -p logs

# 设置权限
echo "🔒 设置目录权限..."
chmod 755 static/uploads
chmod 755 logs

# 检查配置
echo "⚙️  检查配置文件..."
if [ ! -f ".env" ]; then
    echo "📝 创建默认配置文件..."
    cat > .env << EOL
# 服务器配置
HOST=0.0.0.0
PORT=5000
DEBUG=False

# 文件配置
MAX_CONTENT_LENGTH=104857600  # 100MB
FILE_EXPIRE_HOURS=24

# 清理配置
CLEANUP_INTERVAL_MINUTES=60
EOL
fi

echo "✅ 部署完成！"
echo ""
echo "🎯 启动命令："
echo "   开发模式: python start.py"
echo "   生产模式: gunicorn -w 4 -b 0.0.0.0:5000 app:app"
echo ""
echo "🌐 访问地址："
echo "   本地: http://localhost:5000"
echo "   局域网: http://$(hostname -I | awk '{print $1}'):5000"