@echo off
chcp 65001 >nul
title 文件分享工具 - 部署脚本

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 文件分享工具部署脚本                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 检查Python环境
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Python
    echo 请先安装Python 3.6或更高版本
    pause
    exit /b 1
)

echo ✅ Python环境检查通过

REM 检查虚拟环境
if not exist "venv" (
    echo 📦 创建虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 创建虚拟环境失败
        pause
        exit /b 1
    )
)

REM 激活虚拟环境
echo 🔧 激活虚拟环境...
call venv\Scripts\activate.bat

REM 安装Python依赖
echo 📥 安装Python依赖...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ 安装Python依赖失败
    pause
    exit /b 1
)

REM 检查Node.js环境
where npm >nul 2>&1
if not errorlevel 1 (
    echo 📦 安装前端依赖...
    npm install
    
    echo 🔨 构建前端资源...
    npm run build
) else (
    echo ⚠️  Node.js未安装，跳过前端构建
)

REM 创建必要目录
echo 📁 创建必要目录...
if not exist "static\uploads" mkdir static\uploads
if not exist "logs" mkdir logs

REM 创建默认配置文件
if not exist ".env" (
    echo 📝 创建默认配置文件...
    (
        echo # 服务器配置
        echo HOST=0.0.0.0
        echo PORT=5000
        echo DEBUG=False
        echo.
        echo # 文件配置
        echo MAX_CONTENT_LENGTH=104857600
        echo FILE_EXPIRE_HOURS=24
        echo.
        echo # 清理配置
        echo CLEANUP_INTERVAL_MINUTES=60
    ) > .env
)

echo.
echo ✅ 部署完成！
echo.
echo 🎯 启动命令：
echo    开发模式: python start.py
echo    生产模式: waitress-serve --host=0.0.0.0 --port=5000 app:app
echo.

REM 获取本机IP
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4"') do (
    set ip=%%i
    goto :found_ip
)
:found_ip
set ip=%ip: =%

echo 🌐 访问地址：
echo    本地: http://localhost:5000
echo    局域网: http://%ip%:5000
echo.

pause