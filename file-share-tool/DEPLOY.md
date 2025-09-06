# 🚀 开发部署指南

## 📋 快速开始

### 基础环境要求
- Python 3.8+ 
- Node.js 16+ (可选，用于前端构建)
- Git

### 开发环境搭建

#### 1. 克隆项目
```bash
git clone <repository-url>
cd file-share-tool
```

#### 2. Python环境配置
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### 3. 前端环境配置（可选）
```bash
# 安装Node.js依赖
npm install

# 开发模式构建
npm run dev

# 生产模式构建
npm run build
```

#### 4. 启动开发服务器
```bash
# 开发模式
python start.py

# 或直接运行Flask应用
python app.py
```

## 🛠️ 开发工具

### 代码格式化
```bash
# Python代码格式化
black .

# 代码检查
flake8 .

# JavaScript格式化
npm run format

# JavaScript检查
npm run lint
```

### 测试
```bash
# Python测试
pytest

# 前端测试
npm test
```

## 🚀 部署方案

### 方案1: 直接部署

#### 使用自动化脚本
```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

#### 手动部署步骤
1. 安装依赖：`pip install -r requirements.txt`
2. 构建前端：`npm run build`
3. 配置环境变量
4. 启动服务：`gunicorn -w 4 -b 0.0.0.0:5000 app:app`

### 方案2: Docker部署

#### 单容器部署
```bash
# 构建镜像
docker build -t file-share-tool .

# 运行容器
docker run -d -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  --name file-share-tool \
  file-share-tool
```

#### Docker Compose部署
```bash
# 基础部署
docker-compose up -d

# 包含Nginx反向代理
docker-compose --profile with-nginx up -d
```

### 方案3: 系统服务部署

#### systemd服务（Linux）
```bash
# 复制服务文件
sudo cp file-share-tool.service /etc/systemd/system/

# 重载配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start file-share-tool

# 开机自启
sudo systemctl enable file-share-tool

# 查看状态
sudo systemctl status file-share-tool
```

## ⚙️ 配置说明

### 环境变量配置
创建 `.env` 文件：
```env
# 服务器配置
HOST=0.0.0.0
PORT=5000
DEBUG=False

# 文件配置  
MAX_CONTENT_LENGTH=104857600  # 100MB
FILE_EXPIRE_HOURS=24

# 数据库配置
DATABASE_URL=sqlite:///data/metadata.db

# 清理配置
CLEANUP_INTERVAL_MINUTES=60

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

### Nginx反向代理配置
1. 复制 `nginx.conf` 到Nginx配置目录
2. 配置SSL证书路径
3. 重启Nginx服务

## 📊 监控与维护

### 健康检查
- 基础检查：`GET /health`
- 详细检查：`GET /health/detailed`
- 简单检查：`GET /health/simple`

### 日志查看
```bash
# 应用日志
tail -f logs/app.log

# 审计日志
tail -f logs/audit.log

# 错误日志
tail -f logs/error.log

# Docker日志
docker logs -f file-share-tool
```

### 性能监控
- CPU使用率监控
- 内存使用监控
- 磁盘空间监控
- 文件上传/下载统计

### 数据库维护
```bash
# 手动清理过期文件
curl -X POST http://localhost:5000/api/cleanup

# 数据库优化（通过健康检查自动执行）
```

## 🔒 安全配置

### 基础安全设置
1. **文件上传限制**：配置最大文件大小
2. **访问控制**：仅局域网访问
3. **文件过期**：自动清理过期文件
4. **路径安全**：防止路径遍历攻击

### 生产环境安全
1. **HTTPS配置**：使用SSL证书
2. **防火墙设置**：限制端口访问
3. **用户权限**：使用非root用户运行
4. **定期更新**：保持依赖包更新

## 🐛 故障排除

### 常见问题

#### 端口被占用
```bash
# 查找占用进程
netstat -tlnp | grep :5000

# 杀死进程
kill -9 <PID>
```

#### 文件权限问题
```bash
# 设置正确权限
chown -R www-data:www-data /opt/file-share-tool
chmod -R 755 /opt/file-share-tool
```

#### 数据库问题
```bash
# 重建数据库
rm -f static/uploads/metadata.db
# 重启应用会自动创建新数据库
```

#### 内存不足
```bash
# 检查内存使用
free -h

# 调整Gunicorn worker数量
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

### 调试模式
```bash
# 启用调试模式
export DEBUG=True
python app.py

# 查看详细日志
export LOG_LEVEL=DEBUG
```

## 📈 性能优化

### 应用层优化
1. **缓存策略**：文件元数据缓存
2. **数据库优化**：定期VACUUM
3. **压缩算法**：优化ZIP压缩
4. **并发处理**：调整worker数量

### 系统层优化
1. **文件系统**：使用SSD存储
2. **网络配置**：调整TCP参数
3. **内存管理**：配置swap
4. **负载均衡**：多实例部署

### 前端优化
1. **资源压缩**：Gzip压缩
2. **缓存控制**：设置合适的缓存头
3. **CDN加速**：静态资源CDN
4. **懒加载**：大列表虚拟滚动

## 📞 技术支持

### 日志分析
- 应用异常日志在 `logs/error.log`
- 用户操作审计在 `logs/audit.log`
- 系统运行日志在 `logs/app.log`

### 性能分析
```bash
# 查看系统资源使用
htop

# 查看网络连接
ss -tlnp

# 查看磁盘使用
df -h
du -sh static/uploads/*
```

### 版本信息
```bash
# 检查应用版本
curl http://localhost:5000/health/detailed

# 检查依赖版本
pip list
```