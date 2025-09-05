#!/bin/bash

# 局域网文件分享工具启动脚本 (Linux/macOS)

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印横幅
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🗂️  局域网文件分享工具                      ║"
    echo "║                                                              ║"
    echo "║  正在检查运行环境...                                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查Python版本
check_python() {
    if command_exists python3; then
        PYTHON_CMD="python3"
    elif command_exists python; then
        PYTHON_CMD="python"
    else
        echo -e "${RED}❌ 错误: 未找到Python${NC}"
        echo "请先安装Python 3.6或更高版本"
        echo "Ubuntu/Debian: sudo apt install python3 python3-pip python3-venv"
        echo "CentOS/RHEL: sudo yum install python3 python3-pip"
        echo "macOS: brew install python3"
        exit 1
    fi
    
    # 检查Python版本
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 6 ]); then
        echo -e "${RED}❌ 错误: Python版本过低 ($PYTHON_VERSION)${NC}"
        echo "需要Python 3.6或更高版本"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Python环境检查通过 ($PYTHON_VERSION)${NC}"
}

# 检查项目目录
check_project_dir() {
    if [ ! -f "app.py" ]; then
        echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
        echo "当前目录: $(pwd)"
        exit 1
    fi
    echo -e "${GREEN}✅ 项目目录检查通过${NC}"
}

# 创建虚拟环境
setup_venv() {
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}🔧 首次运行，正在创建虚拟环境...${NC}"
        $PYTHON_CMD -m venv venv
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 创建虚拟环境失败${NC}"
            echo "请确保已安装python3-venv包"
            echo "Ubuntu/Debian: sudo apt install python3-venv"
            exit 1
        fi
        echo -e "${GREEN}✅ 虚拟环境创建成功${NC}"
    fi
}

# 激活虚拟环境
activate_venv() {
    echo -e "${YELLOW}🔧 激活虚拟环境...${NC}"
    source venv/bin/activate
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 激活虚拟环境失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 虚拟环境激活成功${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}🔧 检查依赖包...${NC}"
    
    # 检查是否已安装Flask
    python -c "import flask" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}📦 正在安装依赖包...${NC}"
        pip install -r requirements.txt
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 安装依赖包失败${NC}"
            echo "请检查网络连接或手动安装: pip install -r requirements.txt"
            exit 1
        fi
        echo -e "${GREEN}✅ 依赖包安装成功${NC}"
    else
        echo -e "${GREEN}✅ 依赖包检查通过${NC}"
    fi
}

# 创建必要目录
create_directories() {
    mkdir -p static/uploads static/css static/js
}

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 正在停止服务...${NC}"
    if [ -n "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
    fi
    echo -e "${GREEN}👋 程序已退出${NC}"
    exit 0
}

# 主函数
main() {
    # 设置信号处理
    trap cleanup SIGINT SIGTERM
    
    print_banner
    
    # 检查环境
    check_python
    check_project_dir
    
    # 设置虚拟环境
    setup_venv
    activate_venv
    
    # 安装依赖和创建目录
    install_dependencies
    create_directories
    
    echo ""
    echo -e "${BLUE}🚀 正在启动服务...${NC}"
    echo ""
    
    # 启动应用
    $PYTHON_CMD start.py &
    FLASK_PID=$!
    
    # 等待进程结束
    wait $FLASK_PID
}

# 检查是否以root用户运行
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  警告: 不建议以root用户运行此程序${NC}"
    echo "按Ctrl+C取消，或等待5秒继续..."
    sleep 5
fi

# 运行主函数
main
