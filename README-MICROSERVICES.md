# 临时邮箱接码工具 - 微服务版

一个基于微服务架构和Vue 3的现代化临时邮箱接码工具，支持生成 `***@tangtangs.cn` 格式的临时邮箱地址，并接收转发到指定邮箱的邮件。

## ✨ 特性

### 🎯 核心功能
- ✅ 生成无限数量的临时邮箱地址
- 📧 支持发送测试邮件功能
- 📬 实时接收和查看邮件内容
- 🔄 IMAP轮询功能，支持重试机制
- 🔐 OTP验证码保护
- 💻 现代化Vue 3界面
- 🌐 响应式设计，支持移动端

### 🏗️ 架构特性
- 🚀 微服务架构，易于扩展
- 📦 服务独立部署
- 🐳 Docker容器化支持
- 🔧 开发模式热重载
- 📊 服务健康检查
- 🎨 Vue 3 + Vite前端

## 📋 系统要求

- Node.js 18+ 或 Docker
- npm 或 pnpm
- 可选：有效的SMTP/IMAP邮箱服务

## 🚀 快速开始

### 方式一：本地开发（推荐用于开发）

#### 1. 克隆项目并安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

#### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的邮箱信息（可选，不配置也能运行演示模式）：

```env
# SMTP配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IMAP配置
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

#### 3. 启动所有服务

**开发模式（推荐）**:
```bash
# 终端1: 启动微服务（带热重载）
npm run microservices:dev

# 终端2: 启动Vue前端（带热重载）
npm run frontend:dev
```

**普通模式**:
```bash
# 终端1: 启动微服务
npm run microservices

# 终端2: 启动Vue前端
npm run frontend:dev
```

#### 4. 访问应用

- **前端界面**: http://localhost:5173
- **API网关**: http://localhost:3000

### 方式二：生产构建

#### 1. 构建前端

```bash
npm run frontend:build
```

#### 2. 启动微服务

```bash
npm run microservices
```

#### 3. 访问应用

打开浏览器访问: http://localhost:3000

### 方式三：Docker部署（推荐用于生产）

#### 1. 构建前端

```bash
npm run frontend:build
```

#### 2. 启动Docker容器

```bash
# 启动所有服务
npm run docker:up

# 或直接使用docker-compose
docker-compose up -d
```

#### 3. 查看日志

```bash
npm run docker:logs
```

#### 4. 停止服务

```bash
npm run docker:down
```

## 📖 使用指南

### 1️⃣ 生成临时邮箱

1. 访问首页
2. 点击"生成新邮箱"按钮
3. 系统会生成一个临时邮箱地址和6位OTP验证码
4. 复制邮箱地址使用

### 2️⃣ 查看收件箱

1. 在邮箱列表中找到你的邮箱
2. 点击"查看收件箱"按钮
3. 如需验证，输入OTP验证码
4. 查看收到的邮件

### 3️⃣ 发送测试邮件

1. 在首页找到"发送测试邮件"区域
2. 输入收件邮箱、主题和内容
3. 点击"发送测试邮件"
4. 到收件箱刷新查看邮件

### 4️⃣ 配置IMAP

1. 访问"配置"页面
2. 填写IMAP服务器信息
3. 点击"测试连接"验证配置
4. 点击"保存配置"应用设置

### 5️⃣ 查看系统状态

访问"状态"页面查看：
- SMTP连接状态
- IMAP连接状态
- 邮箱总数
- 邮件总数

## 🏗️ 架构说明

### 微服务架构图

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │ :3000
                    │  + Frontend │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼─────┐  ┌────────▼──────┐
│Email Generator │  │Email Sender│  │Email Receiver │
│     :3001      │  │   :3002    │  │    :3003      │
└────────────────┘  └────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼─────┐
│ Config Service │  │Auth Service│
│     :3004      │  │   :3005    │
└────────────────┘  └────────────┘
```

### 服务说明

| 服务 | 端口 | 职责 |
|------|------|------|
| API Gateway | 3000 | 请求路由、静态文件服务 |
| Email Generator | 3001 | 邮箱地址生成和管理 |
| Email Sender | 3002 | SMTP邮件发送 |
| Email Receiver | 3003 | IMAP邮件接收 |
| Config Service | 3004 | 配置管理 |
| Auth Service | 3005 | OTP认证 |
| Vue Frontend | 5173 | 开发模式前端服务 |

详细架构说明请查看 [MICROSERVICES.md](./MICROSERVICES.md)

## 📁 项目结构

```
.
├── frontend/                  # Vue 3 前端
│   ├── src/
│   │   ├── components/       # Vue组件
│   │   ├── views/           # 页面视图
│   │   ├── router/          # 路由配置
│   │   ├── services/        # API服务
│   │   └── App.vue          # 根组件
│   ├── public/              # 静态资源
│   └── package.json
│
├── microservices/            # 微服务
│   ├── api-gateway/         # API网关
│   ├── email-generator/     # 邮箱生成服务
│   ├── email-sender/        # 邮件发送服务
│   ├── email-receiver/      # 邮件接收服务
│   ├── config-service/      # 配置服务
│   └── auth-service/        # 认证服务
│
├── shared/                   # 共享模块
│   ├── config.js            # 配置管理
│   └── storage.js           # 内存存储
│
├── services/                 # 原有服务（复用）
│   ├── emailService.js      # SMTP服务
│   └── imapPollerService.js # IMAP服务
│
├── app.js                    # 原单体应用（保留）
├── start-microservices.js   # 微服务启动脚本
├── docker-compose.yml       # Docker编排
└── package.json             # 项目依赖
```

## 🛠️ 开发指南

### NPM脚本

```bash
# 单体应用（原版）
npm start              # 启动原版单体应用
npm run dev            # 开发模式（nodemon）

# 微服务
npm run microservices      # 启动所有微服务
npm run microservices:dev  # 开发模式（热重载）

# 前端
npm run frontend:dev       # 启动Vue开发服务器
npm run frontend:build     # 构建生产版本

# Docker
npm run docker:up          # 启动容器
npm run docker:down        # 停止容器
npm run docker:logs        # 查看日志
```

### 添加新服务

1. 在 `microservices/` 下创建新服务目录
2. 创建 `index.js` 入口文件
3. 在 `shared/config.js` 添加服务配置
4. 在 `start-microservices.js` 添加启动脚本
5. 在 `api-gateway/index.js` 添加路由转发
6. 在 `docker-compose.yml` 添加服务定义

### API开发

所有API通过API Gateway统一暴露：

```javascript
// 在相应的微服务中定义端点
app.get('/your-endpoint', (req, res) => {
  // 处理逻辑
});

// 在api-gateway中添加路由转发
app.get('/api/your-endpoint', async (req, res) => {
  const result = await forwardRequest('yourService', '/your-endpoint');
  res.json(result);
});
```

## 🔧 配置说明

### 环境变量

参考 `.env.example` 文件：

```env
# 微服务端口
API_GATEWAY_PORT=3000
EMAIL_GENERATOR_PORT=3001
EMAIL_SENDER_PORT=3002
EMAIL_RECEIVER_PORT=3003
CONFIG_SERVICE_PORT=3004
AUTH_SERVICE_PORT=3005

# SMTP配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IMAP配置
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

### Gmail配置

使用Gmail需要：
1. 开启两步验证
2. 生成应用专用密码
3. 在`.env`中使用应用密码

### 前端代理配置

开发模式下，前端通过Vite代理访问API：

```javascript
// frontend/vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

## 📊 监控和维护

### 健康检查

每个服务都提供健康检查端点：

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

### 统一健康检查

```bash
curl http://localhost:3000/api/health
```

### 系统状态

```bash
curl http://localhost:3000/api/status
```

## 🐛 故障排除

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 服务无法启动

1. 检查依赖是否安装完整
2. 确认环境变量配置正确
3. 查看端口是否被占用
4. 检查Node.js版本 (需要18+)

### 前端无法连接API

1. 确认API Gateway运行在3000端口
2. 检查浏览器控制台错误信息
3. 验证Vite代理配置
4. 确认CORS设置

### Docker容器问题

```bash
# 查看容器状态
docker-compose ps

# 查看详细日志
docker-compose logs -f <service-name>

# 重新构建
docker-compose build --no-cache

# 完全重置
docker-compose down -v
docker-compose up -d --build
```

## 🔄 迁移指南

### 从原版迁移

原版单体应用仍然保留在 `app.js`，可以继续使用：

```bash
# 运行原版
npm start
```

### 数据迁移

当前版本使用内存存储，重启后数据会丢失。如需持久化：

1. 实现Redis存储适配器
2. 实现数据库存储适配器
3. 替换 `shared/storage.js` 中的实现

## 📚 相关文档

- [微服务架构详解](./MICROSERVICES.md)
- [原版使用指南](./USAGE.md)
- [手动配置说明](./MANUAL_CONFIG.md)
- [原版README](./README.md)

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## ⭐ 技术栈

### 后端
- Node.js 18+
- Express.js
- Nodemailer (SMTP)
- imap-simple (IMAP)
- Axios (服务间通信)

### 前端
- Vue 3
- Vue Router 4
- Vite 5
- Axios
- 原生CSS

### 部署
- Docker
- Docker Compose

## 📞 联系方式

如有问题或建议，欢迎提Issue！
