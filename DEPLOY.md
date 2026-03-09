# 博客部署指南

使用 Docker + XShell + XFTP 部署到服务器

---

## 前置准备

### 1. 服务器要求
- 操作系统：Linux（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- 内存：至少 1GB
- 磁盘：至少 10GB

### 2. 需要开放的端口
| 端口 | 用途 |
|------|------|
| 3000 | 博客应用访问 |
| 3306 | MySQL 数据库（可选，建议仅内网访问） |

### 3. 工具准备
- **XShell**：SSH 连接服务器
- **XFTP**：上传文件到服务器

---

## 服务器安装 Docker

### Ubuntu/Debian
```bash
# 更新包索引
sudo apt-get update

# 安装必要依赖
sudo apt-get install -y ca-certificates curl gnupg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### CentOS/RHEL
```bash
# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 部署步骤

### 第一步：上传文件（使用 XFTP）

将以下文件/文件夹上传到服务器目录（如 `/home/blog`）：

```
/home/blog/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── index.html
├── vite.config.js
├── src/
├── server/
├── public/
└── .env          # 需要新建，见下文
```

**不需要上传**：
- `node_modules/`
- `dist/`

### 第二步：创建环境变量文件（使用 XShell）

```bash
# SSH 连接服务器后
cd /home/blog

# 创建 .env 文件
nano .env
```

粘贴以下内容（**务必修改密码**）：

```env
ADMIN_PASSWORD=your_strong_admin_password
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_strong_mysql_password
DB_NAME=blog_db
NODE_ENV=production
```

保存：`Ctrl+O` → `Enter` → `Ctrl+X`

### 第三步：构建并启动

```bash
# 构建并启动（首次运行会下载镜像，需要几分钟）
docker compose up -d --build

# 查看运行状态
docker compose ps

# 查看日志（确认无错误）
docker compose logs -f
```

### 第四步：验证部署

```bash
# 检查容器状态
docker compose ps

# 应该看到两个容器都在运行：
# - blog-1
# - blog-mysql-1
```

在浏览器访问：`http://your_server_ip:3000`

---

## 常用运维命令

```bash
# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f blog
docker compose logs -f mysql

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 停止并删除数据（危险！）
docker compose down -v

# 重新构建
docker compose up -d --build

# 进入容器调试
docker compose exec blog sh
docker compose exec mysql mysql -uroot -p
```

---

## 数据库备份

```bash
# 备份数据库
docker compose exec mysql mysqldump -uroot -p${DB_PASSWORD} blog_db > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T mysql mysql -uroot -p${DB_PASSWORD} blog_db < backup.sql
```

---

## 安全建议

### 1. 配置防火墙
```bash
# Ubuntu UFW
sudo ufw allow 3000/tcp
sudo ufw allow 22/tcp    # SSH
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

### 2. 使用 Nginx 反向代理 + SSL

推荐配置 Nginx 并使用 Let's Encrypt 免费证书：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 定期备份数据
```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * cd /home/blog && docker compose exec mysql mysqldump -uroot -p${DB_PASSWORD} blog_db > backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 故障排查

### 端口被占用
```bash
# 查看端口占用
sudo netstat -tulpn | grep :3000

# 停止占用进程或修改 docker-compose.yml 中的端口映射
```

### 容器启动失败
```bash
# 查看详细日志
docker compose logs blog
docker compose logs mysql

# 检查磁盘空间
df -h
```

### 数据库连接失败
```bash
# 检查 MySQL 容器健康状态
docker compose ps

# 等待 MySQL 完全启动后再启动 blog
docker compose up -d mysql
# 等待 10-20 秒
docker compose up -d blog
```

---

## 更新部署

当代码更新后：

```bash
# 1. 上传新文件（XFTP）

# 2. 重新构建并启动
docker compose up -d --build

# 3. 清理旧镜像（可选）
docker image prune -f
```
