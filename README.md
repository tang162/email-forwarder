# 无限邮箱接码工具

一个基于Node.js的临时邮箱接码工具，可以生成 `***@tangtangs.cn` 格式的临时邮箱地址，并接收转发到指定邮箱的邮件。

> 📖 **新用户？** 查看 [快速开始指南](QUICK_START.md) 5分钟上手！
> 
> 🔄 **IMAP轮询？** 查看 [IMAP轮询文档](IMAP_POLLER.md) 了解详细配置！

## 功能特点

- 🎯 生成无限数量的临时邮箱地址
- 📧 支持发送测试邮件功能
- 📬 实时接收和查看邮件内容
- 🔄 IMAP轮询功能，支持重试机制
- 🚀 无需数据库，纯内存存储
- 💻 简洁的Web界面
- 🔄 实时刷新收件箱
- 📟 支持命令行模式（CLI）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置邮箱信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的邮箱配置：

```env
# SMTP配置 - 用于发送测试邮件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IMAP配置 - 用于接收邮件（转发邮箱的配置）
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
```

### 3. 启动应用

```bash
npm start
```

或者开发模式：

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 命令行模式（IMAP轮询）

除了Web界面，工具还提供了独立的命令行模式，用于测试IMAP轮询功能：

```bash
# 设置环境变量
export IMAP_USER="your-email@gmail.com"
export IMAP_PASS="your-app-password"
export IMAP_HOST="imap.gmail.com"
export IMAP_PORT="993"

# 运行轮询工具
node poller.js
```

该模式会：
1. 生成一个随机临时邮箱地址
2. 等待您向该地址发送测试邮件
3. 使用IMAP轮询机制（默认10次重试，每次间隔5秒）查找邮件
4. 显示接收到的邮件内容

### 环境变量配置

可选的IMAP轮询配置：
- `IMAP_RETRY_TIMES`: 重试次数（默认10次）
- `IMAP_RETRY_DELAY`: 重试间隔毫秒数（默认5000毫秒）
- `EMAIL_DOMAIN`: 邮箱域名（默认tangtangs.cn）

## 使用说明

### 生成临时邮箱

1. 点击"生成新邮箱"按钮
2. 系统会自动生成一个 `随机字符@tangtangs.cn` 格式的邮箱地址
3. 可以复制该地址用于接收邮件

### 发送测试邮件

1. 在"测试发送邮件"区域填写：
   - 收件邮箱（可以使用刚生成的临时邮箱）
   - 邮件主题
   - 邮件内容
2. 点击"发送测试邮件"按钮

### 查看邮件

1. 在邮箱列表中找到对应的邮箱
2. 点击"检查收件箱"按钮刷新邮件
3. 点击邮件的"查看"按钮查看详细内容

## 邮箱配置说明

### Gmail配置

如果使用Gmail作为转发邮箱，需要：

1. 开启"两步验证"
2. 生成"应用专用密码"
3. 在`.env`文件中使用应用密码而不是普通密码

### 其他邮箱服务商

支持任何标准的SMTP/IMAP服务，只需要在`.env`文件中配置相应的服务器信息。

## API接口

### 生成邮箱
```
POST /api/generate-email
```

### 获取邮箱信息
```
GET /api/email/:emailId
```

### 发送测试邮件
```
POST /api/send-test-email
Body: {
  "toEmail": "test@tangtangs.cn",
  "subject": "测试邮件",
  "content": "这是测试内容"
}
```

### 获取收件箱
```
GET /api/inbox/:emailId
```

### 轮询获取邮件（支持重试）
```
POST /api/inbox/:emailId/poll
Body: {
  "retryTimes": 10,        // 可选，默认10次
  "retryDelay": 5000,      // 可选，默认5000毫秒
  "markAsSeen": true       // 可选，默认true
}
```

### 获取所有邮箱
```
GET /api/emails
```

### 获取系统状态
```
GET /api/status
```

## 注意事项

1. 本工具使用内存存储，重启服务后数据会丢失
2. 需要配置有效的SMTP和IMAP服务才能正常收发邮件
3. 确保邮箱服务商支持IMAP协议
4. 建议在测试环境中使用，不要用于生产环境

## 技术栈

- **后端**: Node.js + Express
- **邮件处理**: Nodemailer + IMAP + imap-simple
- **前端**: Bootstrap 5 + 原生JavaScript
- **邮件解析**: mailparser
- **轮询机制**: 基于imap-simple的重试轮询

## 许可证

MIT License