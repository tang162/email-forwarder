# 快速开始指南

## 🚀 5分钟快速启动

### 步骤1: 安装依赖

```bash
# 安装根目录依赖（微服务所需）
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 步骤2: 启动服务

打开两个终端窗口：

**终端1 - 启动微服务**:
```bash
npm run microservices
```

你应该看到类似输出：
```
🚀 Starting microservices...
[Email Generator] Running on port 3001
[Email Sender] Running on port 3002
[Email Receiver] Running on port 3003
[Config Service] Running on port 3004
[Auth Service] Running on port 3005
[API Gateway] Running on port 3000
✅ All services started!
```

**终端2 - 启动Vue前端**:
```bash
npm run frontend:dev
```

你应该看到：
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 步骤3: 访问应用

打开浏览器访问: **http://localhost:5173**

## 🎯 快速测试

### 1. 生成邮箱
1. 在首页点击"生成新邮箱"
2. 复制生成的邮箱地址（例如: abc123@tangtangs.cn）
3. 记下6位OTP验证码

### 2. 发送测试邮件
1. 在"发送测试邮件"区域
2. 粘贴刚才生成的邮箱地址
3. 输入主题和内容
4. 点击"发送测试邮件"

### 3. 查看邮件
1. 在邮箱列表找到你的邮箱
2. 点击"查看收件箱"
3. 输入OTP验证码（如需要）
4. 查看收到的邮件

## 🐳 使用Docker（推荐生产环境）

### 前提：先构建前端

```bash
npm run frontend:build
```

### 启动所有服务

```bash
docker-compose up -d
```

### 访问应用

打开浏览器: **http://localhost:3000**

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

## ⚙️ 可选：配置真实邮箱

如果你想接收真实邮件，需要配置SMTP和IMAP。

### 1. 创建环境变量文件

```bash
cp .env.example .env
```

### 2. 编辑 .env 文件

**Gmail示例**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-specific-password
```

**注意**: Gmail需要使用应用专用密码，不是普通密码！

### 3. 重启服务

停止服务（Ctrl+C），然后重新启动。

## 🔧 常见问题

### Q: 端口被占用怎么办？

A: 修改 `.env` 文件中的端口配置：
```env
API_GATEWAY_PORT=3000
EMAIL_GENERATOR_PORT=3001
# ... 等等
```

### Q: 前端无法连接到API？

A: 
1. 确认微服务已启动（检查终端1）
2. 确认API Gateway运行在3000端口
3. 检查浏览器控制台错误信息

### Q: npm install 失败？

A: 
1. 确认Node.js版本 >= 18
2. 清除缓存: `npm cache clean --force`
3. 删除node_modules重新安装

### Q: 不配置邮箱能用吗？

A: 可以！不配置邮箱也能运行，发送的邮件会自动添加到收件箱（演示模式）。

## 📚 下一步

- 查看 [完整README](./README-MICROSERVICES.md) 了解更多功能
- 查看 [微服务架构文档](./MICROSERVICES.md) 了解架构细节
- 访问"配置"页面设置IMAP
- 访问"状态"页面查看系统状态

## 💡 提示

- **开发模式**: 使用 `npm run microservices:dev` 和 `npm run frontend:dev` 获得热重载
- **生产模式**: 先构建前端 `npm run frontend:build`，然后启动微服务
- **原版应用**: 可以使用 `npm start` 运行原来的单体版本

## 🎉 成功！

如果你看到了首页，恭喜！你已经成功运行了微服务版的临时邮箱工具。

有问题？查看 [故障排除指南](./README-MICROSERVICES.md#-故障排除)
