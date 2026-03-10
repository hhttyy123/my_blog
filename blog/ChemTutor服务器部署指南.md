# ChemTutor 服务器部署指南

> 项目：ChemTutor - 综合性化学教育平台
> 部署方式：Docker + Docker Compose
> 生成时间：2025-03-08

---

## 项目架构

```
┌─────────────────────────────────────────────────────────┐
│                      Nginx (80/443)                      │
│              反向代理 + 静态文件托管                      │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ ai-chem      │   │ 3d-vis       │   │ image-       │
│ (RAG问答)     │   │ (3D可视化)    │   │ identity     │
│ :8000        │   │ :8001        │   │ (图像识别)    │
│ FastAPI      │   │ FastAPI      │   │ :5000        │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 部署前准备

### 服务器要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Ubuntu 20.04+ (推荐) |
| 内存 | 至少 4GB，推荐 8GB+ |
| 磁盘 | 至少 20GB 可用空间 |
| 网络 | 开放 80、443 端口 |
| 软件 | Docker + Docker Compose |

### 本地准备工具

- **XShell** - SSH 连接服务器
- **XFTP** - 上传文件到服务器
- **VS Code** - 编辑配置文件

---

## 部署步骤

### 第一步：本地构建前端

**⚠️ 重要：必须在本地构建，服务器内存可能不足**

```bash
# 进入前端目录
cd ai_chem/frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 确认生成 dist 目录
ls -la dist
```

### 第二步：准备部署文件

```bash
# 在项目根目录打包（排除不必要文件）
tar -czf chemtutor-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='venv' \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='.claude' \
  .
```

### 第三步：上传到服务器

**使用 XFTP：**
1. 连接到服务器
2. 创建目录：`/opt/chemtutor`
3. 上传 `chemtutor-deploy.tar.gz`

**或使用命令行：**
```bash
scp chemtutor-deploy.tar.gz user@your-server:/opt/chemtutor/
```

### 第四步：服务器解压配置

```bash
# 使用 XShell 连接服务器
ssh user@your-server

# 进入目录
cd /opt/chemtutor

# 解压文件
tar -xzf chemtutor-deploy.tar.gz

# 验证前端 dist 目录存在
ls -la ai_chem/frontend/dist
```

### 第五步：配置环境变量

```bash
# 创建 .env 文件
nano .env
```

**输入以下内容：**
```bash
# GLM API 配置
GLM_API_KEY=your_api_key_here

# 服务端口配置
BACKEND_PORT=8000
THREE_D_PORT=8001
IMAGE_ID_PORT=5000
```

按 `Ctrl+X` → `Y` → `Enter` 保存

### 第六步：创建 Nginx 配置

```bash
# 创建 nginx 目录
mkdir -p nginx/ssl

# 创建 nginx 配置文件
nano nginx/nginx.conf
```

**nginx.conf 内容：**
```nginx
user nginx;
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream ai_chem_backend {
        server ai-chem-backend:8000;
    }

    upstream three_d_backend {
        server 3d-vis:8001;
    }

    upstream image_identity_backend {
        server image-identity-backend:5000;
    }

    server {
        listen 80;
        server_name _;

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # ai_chem 后端 API
        location /api/ {
            proxy_pass http://ai_chem_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # 3D 可视化 API
        location /3d/ {
            proxy_pass http://three_d_backend/;
            proxy_set_header Host $host;
        }

        # 图像识别 API
        location /image/ {
            proxy_pass http://image_identity_backend/;
            proxy_set_header Host $host;
        }
    }
}
```

### 第七步：启动服务

```bash
# 分步启动（避免依赖问题）

# 1. 先启动后端服务
docker-compose up -d ai-chem-backend 3d-vis image-identity

# 2. 等待启动完成（约30-60秒）
sleep 60

# 3. 检查状态
docker-compose ps

# 4. 启动 Nginx
docker-compose up -d nginx

# 5. 查看所有服务
docker-compose ps
```

### 第八步：配置防火墙

```bash
# 开放 HTTP 端口
sudo ufw allow 80/tcp

# 开放 HTTPS 端口（如果需要）
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### 第九步：测试访问

- 前端页面：`http://your-server-ip`
- 后端 API：`http://your-server-ip/api/`
- 3D 可视化：`http://your-server-ip/3d/`

---

## 常用维护命令

```bash
# 查看所有容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [服务名]

# 重启单个服务
docker-compose restart [服务名]

# 重启所有服务
docker-compose restart

# 停止所有服务
docker-compose down

# 启动所有服务
docker-compose up -d

# 进入容器调试
docker-compose exec [服务名] bash

# 查看资源使用
docker stats
```

---

## 更新部署流程

```bash
# 1. 本地重新构建前端
cd ai_chem/frontend
npm run build

# 2. 打包上传
cd ../../
tar -czf chemtutor-deploy.tar.gz --exclude='node_modules' --exclude='venv' .
scp chemtutor-deploy.tar.gz user@server:/opt/chemtutor/

# 3. 服务器上更新
ssh user@server
cd /opt/chemtutor
docker-compose down
tar -xzf chemtutor-deploy.tar.gz
docker-compose up -d
```

---

## 常见问题排查

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | `sudo netstat -tulpn \| grep :80` 查找并停止占用进程 |
| 容器启动失败 | `docker-compose logs [服务名]` 查看日志 |
| 内存不足 | 在 docker-compose.yml 中限制内存使用 |
| 前端无法访问 | 检查 dist 目录是否存在 |
| API 请求失败 | 检查后端服务是否正常运行 |

---

## 安全建议

1. **配置 HTTPS**：使用 Let's Encrypt 免费证书
2. **API 限流**：防止恶意请求
3. **定期备份**：备份重要数据
4. **更新镜像**：保持 Docker 镜像最新
5. **监控日志**：定期检查异常访问

---

## SSL 证书配置（可选）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

**部署完成后，请访问服务器 IP 测试功能是否正常。**

如有问题，请检查日志：`docker-compose logs -f`
