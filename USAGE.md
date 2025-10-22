# 使用指南

## 快速开始

### 1. 安装并启动
```bash
npm install
npm start
```

### 2. 访问Web界面
打开浏览器访问: http://localhost:3000

### 3. 使用演示脚本
```bash
# 在另一个终端窗口运行
node demo.js
```

## 主要功能

### 🎯 生成临时邮箱
- 点击"生成新邮箱"按钮
- 自动生成格式: `随机字符@tangtangs.cn`
- 可复制邮箱地址

### 📧 发送测试邮件
- 填写收件邮箱（使用生成的邮箱）
- 填写邮件主题和内容
- 点击发送，邮件会自动添加到对应收件箱

### 📬 查看收件箱
- 在邮箱列表中点击"检查收件箱"
- 查看收到的邮件列表
- 点击"查看"按钮查看邮件详情

## 工作原理

本工具使用**模拟邮件服务**的方式工作：

1. **生成邮箱**: 创建随机的 `@tangtangs.cn` 邮箱地址
2. **发送邮件**: 使用 Nodemailer 发送邮件（可选配置真实SMTP）
3. **接收邮件**: 发送到 `@tangtangs.cn` 域名的邮件自动添加到内存收件箱
4. **查看邮件**: 通过Web界面或API查看收到的邮件

## 配置说明

### 环境变量 (.env文件)
```env
# SMTP配置（可选，用于真实发送邮件）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IMAP配置（可选，用于真实接收邮件）
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password

# 服务端口
PORT=3000
```

### 无配置运行
- 即使不配置真实邮箱服务，工具仍可正常演示
- 发送的邮件会自动添加到模拟收件箱
- 适合测试和演示使用

## API使用示例

### 生成邮箱
```javascript
const response = await fetch('/api/generate-email', {
    method: 'POST'
});
const { emailId, emailAddress } = await response.json();
```

### 发送邮件
```javascript
const response = await fetch('/api/send-test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        toEmail: 'test@tangtangs.cn',
        subject: '测试邮件',
        content: '这是邮件内容'
    })
});
```

### 检查收件箱
```javascript
const response = await fetch(`/api/inbox/${emailId}`);
const { messages } = await response.json();
```

## 注意事项

1. **内存存储**: 重启服务后数据会丢失
2. **演示用途**: 主要用于测试和演示，不建议生产环境使用
3. **无验证**: 无需身份验证，任何人都可访问
4. **域名**: 目前固定使用 `tangtangs.cn` 域名

## 扩展功能

如需扩展功能，可以考虑：

1. **数据持久化**: 集成数据库存储
2. **真实域名**: 配置真实的邮箱转发服务
3. **用户认证**: 添加用户系统和权限控制
4. **邮件过期**: 自动清理过期邮件
5. **WebSocket**: 实时推送新邮件通知