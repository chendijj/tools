@echo off
chcp 65001 >nul
title 局域网文件分享工具

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🗂️  局域网文件分享工具                      ║
echo ║                                                              ║
echo ║  正在检查运行环境...                                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Python
    echo.
    echo 请先安装Python 3.6或更高版本:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python环境检查通过

REM 检查是否在正确的目录
if not exist "app.py" (
    echo ❌ 错误: 请在项目根目录运行此脚本
    echo 当前目录: %CD%
    echo.
    pause
    exit /b 1
)

echo ✅ 项目目录检查通过

REM 检查虚拟环境
if not exist "venv" (
    echo 🔧 首次运行，正在创建虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo ✅ 虚拟环境创建成功
)

REM 激活虚拟环境
echo 🔧 激活虚拟环境...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 激活虚拟环境失败
    pause
    exit /b 1
)

echo ✅ 虚拟环境激活成功

REM 检查并安装依赖
echo 🔧 检查依赖包...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo 📦 正在安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ 安装依赖包失败
        echo 请检查网络连接或手动安装: pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo ✅ 依赖包安装成功
) else (
    echo ✅ 依赖包检查通过
)

REM 创建必要的目录
if not exist "static" mkdir static
if not exist "static\uploads" mkdir static\uploads
if not exist "static\css" mkdir static\css
if not exist "static\js" mkdir static\js

echo.
echo 🚀 正在启动服务...
echo.

REM 启动应用
python start.py

REM 停用虚拟环境
deactivate

echo.
echo 👋 程序已退出
pause
