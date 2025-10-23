# 微服务架构说明

## 架构概述

本项目采用微服务架构，将原有的单体应用拆分为多个独立的服务，每个服务负责特定的功能。

### 服务列表

```
┌─────────────────┐
│   API Gateway   │  端口: 3000 (主入口)
│   (HTTP 网关)   │
└────────┬────────┘
         │
         ├─────────────┬──────────────┬──────────────┬──────────────┬─────────────┐
         │             │              │              │              │             │
    ┌────▼────┐   ┌───▼────┐    ┌────▼────┐    ┌───▼────┐    ┌───▼────┐   ┌───▼────┐
    │ Email   │   │ Email  │    │ Email   │    │ Config │    │ Auth   │   │  Vue   │
    │Generator│   │ Sender │    │Receiver │    │Service │    │Service │   │Frontend│
    │  :3001  │   │ :3002  │    │  :3003  │    │ :3004  │    │ :3005  │   │ :5173  │
    └─────────┘   └────────┘    └─────────┘    └────────┘    └────────┘   └────────┘
         │             │              │              │              │
         └─────────────┴──────────────┴──────────────┴──────────────┘
                                      │
                              ┌───────▼────────┐
                              │  Shared Storage │
                              │  (Memory-based) │
                              └────────────────┘
```

## 各服务职责

### 1. API Gateway (端口 3000)
- **职责**: 统一API入口，请求路由和转发
- **功能**:
  - 接收所有前端请求
  - 将请求路由到相应的微服务
  - 提供静态文件服务（Vue构建产物）
  - 服务健康检查
  
### 2. Email Generator Service (端口 3001)
- **职责**: 邮箱地址生成和管理
- **功能**:
  - 生成随机邮箱地址
  - 存储邮箱信息
  - 查询邮箱详情
  - 列出所有邮箱

### 3. Email Sender Service (端口 3002)
- **职责**: 邮件发送
- **功能**:
  - 通过SMTP发送测试邮件
  - 验证SMTP连接
  - 处理邮件发送错误

### 4. Email Receiver Service (端口 3003)
- **职责**: 邮件接收
- **功能**:
  - 通过IMAP获取邮件
  - 邮件内容解析
  - 支持轮询重试机制
  - 标记邮件为已读

### 5. Config Service (端口 3004)
- **职责**: 配置管理
- **功能**:
  - 保存和获取IMAP配置
  - 保存和获取轮询配置
  - 保存和获取域名配置
  - 测试IMAP连接

### 6. Auth Service (端口 3005)
- **职责**: 认证授权
- **功能**:
  - 生成OTP验证码
  - 验证OTP
  - 管理验证码过期
  - 查询验证码状态

## 技术栈

### 后端微服务
- **Runtime**: Node.js
- **Framework**: Express.js
- **通信**: HTTP/REST API
- **进程间通信**: Axios (HTTP调用)
- **存储**: 共享内存存储 (MemoryStorage)

### 前端
- **Framework**: Vue 3
- **构建工具**: Vite
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **UI**: 原生CSS + 响应式设计

### 部署
- **容器化**: Docker + Docker Compose
- **开发模式**: Node.js多进程启动

## 快速开始

### 开发模式

#### 1. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend && npm install
cd ..
```

#### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置SMTP和IMAP设置
```

#### 3. 启动服务

**选项A: 分别启动**
```bash
# 终端1: 启动所有微服务
npm run microservices

# 终端2: 启动Vue开发服务器
npm run frontend:dev
```

**选项B: 开发模式（带热重载）**
```bash
# 终端1: 微服务热重载
npm run microservices:dev

# 终端2: 前端热重载
npm run frontend:dev
```

#### 4. 访问应用
- 前端开发服务器: http://localhost:5173
- API网关: http://localhost:3000
- 各微服务健康检查:
  - Email Generator: http://localhost:3001/health
  - Email Sender: http://localhost:3002/health
  - Email Receiver: http://localhost:3003/health
  - Config Service: http://localhost:3004/health
  - Auth Service: http://localhost:3005/health

### 生产模式

#### 构建并运行
```bash
# 1. 构建前端
npm run frontend:build

# 2. 启动微服务
npm run microservices

# 3. 访问 http://localhost:3000
```

### Docker部署

```bash
# 启动所有服务
npm run docker:up

# 查看日志
npm run docker:logs

# 停止所有服务
npm run docker:down
```

## API端点

### 通过API Gateway访问

所有API都通过 `http://localhost:3000/api` 访问：

#### 邮箱管理
- `POST /api/generate-email` - 生成新邮箱
- `GET /api/email/:emailId` - 获取邮箱详情
- `GET /api/emails` - 获取所有邮箱
- `GET /api/inbox/:emailId` - 获取收件箱

#### 邮件发送
- `POST /api/send-test-email` - 发送测试邮件

#### 配置管理
- `GET /api/config` - 获取配置
- `POST /api/config` - 保存配置
- `POST /api/test-imap` - 测试IMAP连接

#### OTP认证
- `POST /api/email/:emailId/otp` - 生成/刷新OTP
- `GET /api/email/:emailId/otp` - 获取OTP
- `POST /api/email/:emailId/otp/verify` - 验证OTP

#### 系统状态
- `GET /api/status` - 获取系统状态
- `GET /api/health` - 健康检查

## 共享存储

所有微服务通过 `shared/storage.js` 共享内存存储：

```javascript
const storage = require('./shared/storage');

// 邮箱操作
storage.setEmail(id, data);
storage.getEmail(id);
storage.getAllEmails();

// OTP操作
storage.setOtp(emailId, otpData);
storage.getOtp(emailId);

// 配置操作
storage.setImapConfig(config);
storage.getImapConfig();
```

**注意**: 
- 当前使用内存存储，服务重启数据会丢失
- 生产环境建议使用Redis或数据库
- 多实例部署需要外部存储方案

## 环境变量

### 服务端口配置
```env
API_GATEWAY_PORT=3000
EMAIL_GENERATOR_PORT=3001
EMAIL_SENDER_PORT=3002
EMAIL_RECEIVER_PORT=3003
CONFIG_SERVICE_PORT=3004
AUTH_SERVICE_PORT=3005
```

### 服务主机配置 (Docker)
```env
EMAIL_GENERATOR_HOST=localhost
EMAIL_SENDER_HOST=localhost
EMAIL_RECEIVER_HOST=localhost
CONFIG_SERVICE_HOST=localhost
AUTH_SERVICE_HOST=localhost
```

### SMTP配置
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### IMAP配置
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
IMAP_RETRY_TIMES=10
IMAP_RETRY_DELAY=5000
```

### 其他配置
```env
EMAIL_DOMAIN=tangtangs.cn
```

## 扩展和优化

### 水平扩展
由于采用微服务架构，可以独立扩展各个服务：

```bash
# Docker Compose扩展示例
docker-compose up -d --scale email-receiver=3 --scale email-sender=2
```

### 添加负载均衡
在API Gateway前添加Nginx：

```nginx
upstream api_gateway {
    server localhost:3000;
    server localhost:3010;
    server localhost:3020;
}

server {
    listen 80;
    location / {
        proxy_pass http://api_gateway;
    }
}
```

### 服务发现
可以集成Consul、Eureka等服务发现工具：

```javascript
// 示例：使用Consul进行服务注册
const consul = require('consul')();
consul.agent.service.register({
  name: 'email-generator',
  port: 3001
});
```

### 消息队列
对于异步任务，可以引入消息队列：

```javascript
// 示例：使用RabbitMQ
const amqp = require('amqplib');
// 邮件发送任务进入队列
channel.sendToQueue('email-queue', Buffer.from(JSON.stringify(emailData)));
```

## 监控和日志

### 健康检查
每个服务都提供 `/health` 端点：

```bash
curl http://localhost:3001/health
# 返回: {"status":"ok","service":"email-generator"}
```

### 集中式日志
建议使用ELK Stack或类似工具：

```javascript
// 使用winston进行结构化日志
const winston = require('winston');
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 故障排除

### 服务无法启动
1. 检查端口是否被占用
2. 确认依赖是否已安装
3. 查看环境变量配置

### 服务间通信失败
1. 检查服务健康状态: `GET /health`
2. 确认主机名和端口配置
3. 查看网络连接

### 前端无法连接API
1. 确认API Gateway运行在3000端口
2. 检查CORS配置
3. 确认前端代理配置（vite.config.js）

## 与原版本的差异

| 特性 | 原版本 | 微服务版本 |
|------|--------|-----------|
| 架构 | 单体应用 | 微服务架构 |
| 前端 | 原生HTML/JS | Vue 3 + Vite |
| 路由 | 服务器路由 | Vue Router |
| 部署 | 单进程 | 多进程/容器化 |
| 扩展性 | 垂直扩展 | 水平扩展 |
| 开发体验 | 基础 | 热重载、组件化 |

## 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -am 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 提交Pull Request

## 许可证

MIT License
