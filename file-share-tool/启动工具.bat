@echo off
chcp 65001 >nul
title 局域网文件分享工具

echo.
echo ========================================
echo    局域网文件分享工具
echo ========================================
echo.

REM 检查Python是否安装
py --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python
    echo 请先安装Python 3.6或更高版本
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo Python环境检查通过

REM 检查依赖
py -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo 正在安装依赖包...
    py -m pip install -r requirements.txt
    if errorlevel 1 (
        echo 安装依赖包失败
        echo 请检查网络连接
        pause
        exit /b 1
    )
    echo 依赖包安装成功
) else (
    echo 依赖包检查通过
)

REM 创建必要的目录
if not exist "static\uploads" mkdir static\uploads

echo.
echo 正在启动服务...
echo 启动后将自动打开浏览器
echo 按 Ctrl+C 停止服务
echo.

REM 启动应用
py app.py

echo.
echo 程序已退出
pause
