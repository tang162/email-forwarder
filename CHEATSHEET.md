# 速查表 Quick Reference

## 🚀 快速启动

### 开发模式（推荐）
```bash
# 安装依赖（首次）
npm install
cd frontend && npm install && cd ..

# 终端1
npm run microservices:dev

# 终端2
npm run frontend:dev

# 访问: http://localhost:5173
```

### 生产模式
```bash
npm run frontend:build
npm run microservices
# 访问: http://localhost:3000
```

### Docker模式
```bash
npm run frontend:build
docker-compose up -d
# 访问: http://localhost:3000
```

## 📦 NPM命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动原版单体应用 |
| `npm run microservices` | 启动微服务 |
| `npm run microservices:dev` | 启动微服务（热重载） |
| `npm run frontend:dev` | 启动Vue开发服务器 |
| `npm run frontend:build` | 构建前端生产版本 |
| `npm run docker:up` | Docker启动 |
| `npm run docker:down` | Docker停止 |
| `npm run docker:logs` | 查看Docker日志 |
| `npm run test:setup` | 验证设置 |

## 🌐 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| Vue Dev Server | 5173 | 前端开发服务器 |
| API Gateway | 3000 | 主入口 |
| Email Generator | 3001 | 邮箱生成 |
| Email Sender | 3002 | 发送邮件 |
| Email Receiver | 3003 | 接收邮件 |
| Config Service | 3004 | 配置管理 |
| Auth Service | 3005 | OTP认证 |

## 🔧 快速配置

### Gmail配置
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # 应用专用密码

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

### QQ邮箱配置
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your@qq.com
SMTP_PASS=授权码

IMAP_HOST=imap.qq.com
IMAP_PORT=993
IMAP_USER=your@qq.com
IMAP_PASS=授权码
```

## 📁 项目结构速览

```
project/
├── app.js                    # 原版单体应用
├── start-microservices.js   # 微服务启动
├── docker-compose.yml       # Docker编排
├── microservices/           # 微服务目录
│   ├── api-gateway/        # :3000
│   ├── email-generator/    # :3001
│   ├── email-sender/       # :3002
│   ├── email-receiver/     # :3003
│   ├── config-service/     # :3004
│   └── auth-service/       # :3005
├── frontend/               # Vue 3前端
│   ├── src/
│   │   ├── views/         # 页面
│   │   ├── components/    # 组件
│   │   ├── services/      # API
│   │   └── router/        # 路由
│   └── dist/              # 构建产物
├── shared/                # 共享模块
│   ├── config.js
│   └── storage.js
└── services/              # 邮件服务
    ├── emailService.js
    └── imapPollerService.js
```

## 🐛 常见问题

### 端口被占用
```bash
# 查看占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 依赖安装失败
```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 前端构建失败
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Docker问题
```bash
# 完全重置
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🔍 健康检查

```bash
# 检查微服务
curl http://localhost:3001/health  # Email Generator
curl http://localhost:3002/health  # Email Sender
curl http://localhost:3003/health  # Email Receiver
curl http://localhost:3004/health  # Config Service
curl http://localhost:3005/health  # Auth Service

# 统一检查
curl http://localhost:3000/api/health

# 系统状态
curl http://localhost:3000/api/status
```

## 📊 API速查

### 邮箱管理
```bash
# 生成邮箱
curl -X POST http://localhost:3000/api/generate-email

# 获取所有邮箱
curl http://localhost:3000/api/emails

# 获取收件箱
curl http://localhost:3000/api/inbox/{emailId}
```

### 发送邮件
```bash
curl -X POST http://localhost:3000/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@tangtangs.cn",
    "subject": "测试",
    "content": "内容"
  }'
```

### 配置管理
```bash
# 获取配置
curl http://localhost:3000/api/config

# 保存配置
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "imap": {
      "host": "imap.gmail.com",
      "port": 993,
      "user": "user@gmail.com",
      "password": "pass"
    }
  }'
```

## 🎯 前端路由

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 生成邮箱、发送邮件 |
| `/inbox/:emailId` | 收件箱 | 查看邮件 |
| `/config` | 配置 | IMAP配置 |
| `/status` | 状态 | 系统状态 |

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目主页 |
| [QUICKSTART.md](./QUICKSTART.md) | 快速开始（5分钟） |
| [README-MICROSERVICES.md](./README-MICROSERVICES.md) | 完整功能说明 |
| [MICROSERVICES.md](./MICROSERVICES.md) | 架构详解 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署指南 |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | 项目总结 |
| [USAGE.md](./USAGE.md) | 原版使用指南 |
| [MANUAL_CONFIG.md](./MANUAL_CONFIG.md) | 配置说明 |

## 💡 Tips

- 开发时使用 `:dev` 版本命令可获得热重载
- 生产环境记得先 `npm run frontend:build`
- 不配置SMTP/IMAP也能运行（演示模式）
- 使用 `npm run test:setup` 验证环境
- Docker部署前必须构建前端
- 查看日志：`docker-compose logs -f`
- PM2管理：`pm2 start ecosystem.config.js`

## 🆘 获取帮助

1. 阅读相关文档
2. 运行 `npm run test:setup` 检查问题
3. 查看错误日志
4. 提交GitHub Issue

---

**快速上手**: `npm run test:setup` → `npm run microservices:dev` + `npm run frontend:dev`
