# 迁移指南

如果你正在使用原版单体应用，本指南将帮助你迁移到微服务版本。

## 🔄 为什么要迁移？

### 微服务版本的优势

✅ **更好的扩展性**: 可以独立扩展各个服务  
✅ **更现代的UI**: Vue 3提供更好的用户体验  
✅ **更灵活的部署**: 支持Docker、Kubernetes等  
✅ **更好的开发体验**: 热重载、组件化开发  
✅ **更易维护**: 代码模块化、职责清晰  

## 📊 版本对比

| 特性 | 原版 (v1.x) | 微服务版 (v2.x) |
|------|-------------|----------------|
| 架构 | 单体应用 | 微服务 |
| 前端 | 原生HTML/JS | Vue 3 |
| 启动方式 | `npm start` | `npm run microservices` |
| 开发模式 | `npm run dev` | `npm run microservices:dev` + `npm run frontend:dev` |
| 数据存储 | 内存 | 内存（可扩展为Redis） |
| 部署 | 单进程 | 多进程/Docker |
| 端口 | 3000 | 3000-3005 |

## 🚀 迁移步骤

### 步骤1: 备份数据

虽然原版和新版都使用内存存储（重启即丢失），但如果你有自定义配置，请备份：

```bash
# 备份配置文件
cp .env .env.backup

# 备份自定义代码（如果有）
cp app.js app.js.backup
```

### 步骤2: 安装新版依赖

```bash
# 更新根目录依赖（已包含所需包）
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 步骤3: 配置环境变量

新版使用相同的环境变量，但添加了微服务端口配置：

```bash
# 如果没有.env文件
cp .env.example .env

# 编辑.env，添加微服务端口（可选，有默认值）
# API_GATEWAY_PORT=3000
# EMAIL_GENERATOR_PORT=3001
# ...等等
```

### 步骤4: 选择运行模式

#### 选项A: 继续使用原版
```bash
# 原版仍然可用！
npm start
# 访问: http://localhost:3000
```

#### 选项B: 使用微服务版（开发模式）
```bash
# 终端1: 启动微服务
npm run microservices:dev

# 终端2: 启动前端
npm run frontend:dev

# 访问: http://localhost:5173
```

#### 选项C: 使用微服务版（生产模式）
```bash
# 1. 构建前端
npm run frontend:build

# 2. 启动微服务
npm run microservices

# 访问: http://localhost:3000
```

#### 选项D: 使用Docker
```bash
# 1. 构建前端
npm run frontend:build

# 2. 启动Docker
docker-compose up -d

# 访问: http://localhost:3000
```

## 🔧 配置迁移

### SMTP/IMAP配置

**保持不变！** 新版使用完全相同的环境变量：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

### Web界面配置

原版的手动配置功能在新版中得到保留和增强：

- 原版: 访问 `/config.html`
- 新版: 访问 `/config`（更现代的Vue界面）

功能完全相同，但UI更友好！

## 📡 API兼容性

### 完全兼容的API

以下API在新版中**完全兼容**：

```
✅ POST /api/generate-email
✅ GET  /api/email/:emailId
✅ GET  /api/emails
✅ POST /api/send-test-email
✅ GET  /api/inbox/:emailId
✅ POST /api/email/:emailId/otp
✅ GET  /api/email/:emailId/otp
✅ POST /api/email/:emailId/otp/verify
✅ GET  /api/config
✅ POST /api/config
✅ POST /api/test-imap
✅ GET  /api/status
```

**重要**: 如果你有客户端代码调用这些API，无需修改！

## 🔀 新增功能

### 1. 健康检查

新版每个服务都提供健康检查：

```bash
# 检查单个服务
curl http://localhost:3001/health

# 检查所有服务
curl http://localhost:3000/api/health
```

### 2. Vue前端

新版提供现代化的Vue 3界面：

- **首页**: 邮箱管理、发送邮件
- **收件箱**: 查看邮件详情
- **配置**: IMAP设置
- **状态**: 系统状态监控

### 3. 独立服务

可以独立运行各个服务进行调试：

```bash
# 只运行邮箱生成服务
node microservices/email-generator/index.js

# 只运行认证服务
node microservices/auth-service/index.js
```

## 🐛 常见迁移问题

### 问题1: 端口冲突

**原因**: 微服务需要使用多个端口（3000-3005）

**解决**:
```bash
# 方法1: 修改.env文件
API_GATEWAY_PORT=4000
EMAIL_GENERATOR_PORT=4001
# ...

# 方法2: 临时设置
export API_GATEWAY_PORT=4000
npm run microservices
```

### 问题2: 前端构建失败

**原因**: 前端依赖未安装

**解决**:
```bash
cd frontend
npm install
npm run build
cd ..
```

### 问题3: API调用失败

**原因**: 微服务未全部启动

**解决**:
```bash
# 检查所有服务状态
curl http://localhost:3000/api/health

# 查看启动日志
npm run microservices
# 确认看到所有6个服务的启动信息
```

### 问题4: Docker启动失败

**原因**: 前端未构建

**解决**:
```bash
# Docker模式需要先构建前端
npm run frontend:build
docker-compose up -d
```

## 📦 数据迁移

### 当前版本

**原版和新版都使用内存存储**，数据在服务重启后会丢失。

### 如果需要持久化

新版更容易扩展存储方案：

```javascript
// 在 shared/storage.js 中
// 替换为Redis、MongoDB等

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

module.exports = {
  setEmail: (id, data) => redis.set(`email:${id}`, JSON.stringify(data)),
  getEmail: async (id) => {
    const data = await redis.get(`email:${id}`);
    return data ? JSON.parse(data) : null;
  }
  // ... 其他方法
};
```

## 🔄 回滚计划

如果新版出现问题，可以随时回滚到原版：

```bash
# 停止微服务
# Ctrl+C 或 docker-compose down

# 启动原版
npm start
```

原版代码（`app.js`）完全保留，随时可用！

## 🎯 推荐迁移路径

### 1. 开发/测试环境先行

```bash
# 1. 在开发环境测试新版
npm run microservices:dev
npm run frontend:dev

# 2. 验证所有功能正常
# 3. 确认API兼容性
# 4. 测试性能
```

### 2. 逐步迁移到生产

```bash
# 1. 在生产环境保持原版运行
npm start

# 2. 并行部署新版到不同端口
export API_GATEWAY_PORT=4000
npm run frontend:build
npm run microservices

# 3. 使用负载均衡逐步切流量
# 4. 验证稳定后完全切换
```

### 3. 使用Docker部署

```bash
# 1. 构建镜像
npm run frontend:build
docker-compose build

# 2. 小规模测试
docker-compose up -d

# 3. 验证后扩展
docker-compose up -d --scale email-receiver=3
```

## 📊 性能对比

| 指标 | 原版 | 微服务版 |
|------|------|----------|
| 启动时间 | ~1秒 | ~3秒（6个服务） |
| 内存占用 | ~50MB | ~150MB（6个服务） |
| 响应时间 | 基准 | +5-10ms（转发开销） |
| 并发能力 | 中等 | 高（可独立扩展） |
| 开发体验 | 基础 | 优秀（热重载） |

## ⚖️ 选择建议

### 继续使用原版，如果：

- ✅ 小规模使用，流量不大
- ✅ 不需要独立扩展服务
- ✅ 简单部署即可
- ✅ 资源有限

### 迁移到微服务版，如果：

- ✅ 需要高可用和扩展性
- ✅ 想要现代化UI
- ✅ 计划使用Docker/K8s
- ✅ 团队协作开发
- ✅ 需要独立部署各服务

## 🆘 获取帮助

如果迁移过程中遇到问题：

1. 查看 [QUICKSTART.md](./QUICKSTART.md)
2. 查看 [README-MICROSERVICES.md](./README-MICROSERVICES.md)
3. 运行 `npm run test:setup` 检查环境
4. 查看服务日志排查问题
5. 提交GitHub Issue

## ✅ 迁移检查清单

- [ ] 备份现有配置
- [ ] 安装新版依赖
- [ ] 配置环境变量
- [ ] 测试原版功能正常
- [ ] 测试新版功能正常
- [ ] 验证API兼容性
- [ ] 性能测试
- [ ] 准备回滚方案
- [ ] 文档和培训
- [ ] 正式切换
- [ ] 监控和调优

## 🎉 迁移成功！

恭喜！你已经成功迁移到微服务架构。享受新版本带来的：

- 🚀 更好的性能和扩展性
- 🎨 更现代的用户界面
- 🛠️ 更灵活的开发体验
- 📦 更强大的部署选项

---

**提示**: 两个版本可以共存！你可以在不同端口同时运行原版和新版。
