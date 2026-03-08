# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# 创建数据目录
RUN mkdir -p /app/data

# 设置工作目录
WORKDIR /app

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server/server.js"]
