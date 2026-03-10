
> [!NOTE] 前言
> 这个方法主要解决了直接在Docker中安装依赖时造成的空间紧张问题
> 主要讲AI不能准确解答的问题，如有其他报错，可以找AI帮忙
# 准备工作
### 1.安装Xshell和Xftp
### 2.租用阿里云的服务器
### 3.创建一个阿里云容器镜像
### 4.安装Docker

---

# 具体步骤
### 1.用Xshell连接服务器
- 这里只要知道如何在服务器上开放端口就行

---
### 2.安装Docker和Docker-compose

- 先安装Docker，可以直接在Xshell中运行命令：
``` bash
sudo apt update
```
- 然后：
``` bash
sudo apt install -y docker.io
```
- 安装完成后，尝试运行：
```bash
sudo docker run hello-world
```
- 若出现hello-world字样，且无报错，则成功安装了Docker，接着就可以继续尝试安装Docker-compose，直接运行：
```bash
sudo apt update
```
```bash
sudo apt install -y docker-compose
```
-  之后运行：
```bash
docker-compose --version
```
- 若有版本信息，则安装成功。

---
## 3.创建容器镜像与拉取
- 首先前往阿里云官网的**容器镜像服务**网站：[(https://cr.console.aliyun.com/cn-shanghai/instance/repositories)]()
	1.创建一个个人版实例，然后创建一个命名空间（随便起个名字）
	
	2.在命名空间中创建一个新的镜像仓库
	
	3.现在在**WSL**中尝试将你的项目打包为镜像,先登录：
	``` bash
	docker login --username=yourname crpi-zapnyuqlrws037uw.cn-shanghai.personal.cr.aliyuncs.com
	```
	然后构建（类似这样，规则在官网有）：
	``` bash
	docker build -t crpi-zapnyuqlrws037uw.cn-shanghai.personal.cr.aliyuncs.com/chemtutor/blog:v1 .
	```
	然后尝试拉取：（先在Xshell上试试这个）
	``` bash
	docker pull hello-world
	docker run hello-world
	```
	如果有任何报错，多半是网络问题，请用阿里云的镜像加速器（官网上免费有）
	
	5.构建完成后，尝试推送(类似这样)：
	``` bash
	docker push crpi-zapnyuqlrws037uw.cn-shanghai.personal.cr.aliyuncs.com/chemtutor/ai-backend:[镜像版本号]
	```
	6.然后在Xshell中尝试拉取：
	``` bash
	docker pull crpi-zapnyuqlrws037uw.cn-shanghai.personal.cr.aliyuncs.com/chemtutor/ai-backend:[镜像版本号]
	```
	或者直接一次性拉取：
	``` bash
	docker-compose pull
	```
	没有任何报错就行了。

---
## 4.配置文件
- 接下来就是配置docker-compose.yml和nginx.conf文件，他们的大致结构如下：
- docker-compose.yml:
``` YAML
version: '3.8'  # 版本号（现在很多新版本已不再强制）

services:       # 定义应用的所有容器（即“服务”）
  web:          # 服务名 1
    image: nginx:latest
    ports:
      - "80:80"
  db:           # 服务名 2
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data

networks:       # 定义虚拟网络，让容器间可以通信
  my_net:

volumes:        # 定义数据卷，用于数据持久化
  db_data:
```
- nginx.conf:
``` Nginx
# 1. 全局块 (Global Block) - 设置 nginx 的运行参数
user nginx;
worker_processes auto;

events {                # 2. 事件块 (Events Block)
    worker_connections 1024;
}

http {                  # 3. HTTP 块 (HTTP Block) - 处理所有 Web 流量
    include mime.types;
    
    server {            # 4. Server 块 - 定义虚拟主机 (一个域名对应一个)
        listen 80;
        server_name example.com;

        location / {    # 5. Location 块 - 定义请求的转发逻辑
            proxy_pass http://my_web_service:80; # 将流量转发到 docker 容器
        }
    }
}
```
> 具体结合自己的项目询问AI即可（尤其注意自己的项目结构！！！）
---
## 5.尝试运行（会有各种各样的报错的）
 - 在Xshell上面运行完拉取之后，尝试运行：
	 ``` bash
	 docker-compose up -d
	 ```
	 各项服务均显示**done**即可。
- 然后就可以尝试访问网站，如果遇到各种问题，只要在浏览器上打开F12，把具体报错信息完整复制给AI即可。

---
## 6.一些Docker维护的基本指令

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

# 开机自启动
sudo systemctl enable docker
```

---
## 7.更新项目
- 采用容器镜像服务部署网站时，更新就变得很简单了，只要将自己的项目重复上述的**构建**—>**推送**—>**拉取**过程即可
- 但别忘了每次更新前关闭docker

---
*大概过程就这样的了*