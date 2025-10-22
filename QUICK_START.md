# 快速开始指南

## 🚀 5分钟快速上手

### 1. 安装依赖
```bash
npm install
```

### 2. 启动应用（模拟模式）

无需配置，直接启动：
```bash
npm start
```

访问: http://localhost:3000

在Web界面中：
- 点击"生成新邮箱"
- 点击"发送测试邮件"
- 点击"检查收件箱"查看邮件

### 3. 运行演示脚本

在另一个终端：
```bash
node demo.js
```

## 🔧 使用真实IMAP（可选）

### Gmail 配置示例

1. **开启两步验证** (https://myaccount.google.com/security)

2. **生成应用专用密码** (https://myaccount.google.com/apppasswords)

3. **配置环境变量**:
```bash
cp .env.example .env
```

编辑 `.env`:
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-16-digit-app-password
```

4. **启动应用**:
```bash
npm start
```

### QQ邮箱配置示例

1. **开启IMAP服务**: 
   - 登录QQ邮箱 -> 设置 -> 账户
   - 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   - 开启IMAP服务，获取授权码

2. **配置环境变量**:
```env
IMAP_HOST=imap.qq.com
IMAP_PORT=993
IMAP_USER=your-email@qq.com
IMAP_PASS=your-authorization-code
```

## 📟 命令行轮询工具

### 使用环境变量
```bash
export IMAP_USER="your-email@gmail.com"
export IMAP_PASS="your-app-password"
npm run poller
```

### 使用配置文件
```bash
cp config.example.js config.js
# 编辑 config.js，填写您的邮箱信息
npm run poller:config
```

## 📝 所有可用命令

```bash
npm start              # 启动Web服务
npm run dev            # 开发模式（自动重启）
npm run poller         # 命令行轮询工具（环境变量）
npm run poller:config  # 命令行轮询工具（配置文件）
npm run test:poller    # 测试IMAP轮询功能
node demo.js           # 运行演示脚本
```

## 🎯 使用场景选择

| 场景 | 推荐方式 | 说明 |
|------|---------|------|
| 快速测试 | 模拟模式 | 无需配置，立即可用 |
| Web界面使用 | 启动app.js | 提供完整的Web UI |
| 命令行使用 | poller.js | 适合脚本集成 |
| 真实邮件接收 | 配置IMAP | 需要域名和邮件转发 |

## 📚 更多文档

- [README.md](README.md) - 完整功能介绍
- [USAGE.md](USAGE.md) - 详细使用指南
- [IMAP_POLLER.md](IMAP_POLLER.md) - IMAP轮询功能文档

## ❓ 常见问题

### Q: 为什么收不到邮件？
A: 如果使用模拟模式，邮件会自动添加到收件箱。如果使用真实IMAP，需要配置域名邮件转发。

### Q: 重启后邮件丢失了？
A: 本工具使用内存存储，重启后数据会丢失。这是设计上的选择，适合临时使用。

### Q: 如何配置域名转发？
A: 请查看 [IMAP_POLLER.md](IMAP_POLLER.md) 的"域名配置要求"章节。

### Q: Gmail应用密码在哪里生成？
A: 访问 https://myaccount.google.com/apppasswords （需要先开启两步验证）

## 🔐 安全提示

- ✅ `.env` 和 `config.js` 不会被提交到Git
- ✅ 使用应用专用密码，不要使用主密码
- ✅ 定期更换应用密码
- ❌ 不要将密码写在代码中
- ❌ 不要分享您的 `.env` 或 `config.js` 文件

## 🆘 需要帮助？

1. 查看完整文档: [README.md](README.md)
2. 查看IMAP配置: [IMAP_POLLER.md](IMAP_POLLER.md)
3. 运行测试: `npm run test:poller`
