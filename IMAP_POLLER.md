# IMAP 轮询功能文档

## 概述

IMAP轮询功能是本工具的核心特性之一，它允许您从真实的IMAP邮箱中轮询获取发送到临时邮箱的邮件。该功能基于 `imap-simple` 库实现，支持可配置的重试机制。

## 功能特点

- ✅ **自动重试**: 支持配置重试次数和间隔
- ✅ **标记已读**: 自动标记已获取的邮件为已读，避免重复处理
- ✅ **搜索未读邮件**: 只获取新邮件（UNSEEN标记）
- ✅ **灵活配置**: 支持环境变量或配置文件两种方式
- ✅ **错误处理**: 完善的错误处理和日志记录
- ✅ **回退机制**: 如果IMAP失败，自动回退到模拟服务

## 使用场景

1. **临时邮箱接码**: 生成临时邮箱用于注册/验证
2. **邮件测试**: 测试邮件发送功能
3. **邮件转发服务**: 配合域名Catch-all转发使用
4. **自动化测试**: 在自动化测试中验证邮件发送

## 配置方式

### 方式1: 环境变量（推荐用于Web服务）

在 `.env` 文件中配置：

```env
# IMAP基础配置
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password

# 轮询配置
IMAP_RETRY_TIMES=10      # 重试次数（默认10）
IMAP_RETRY_DELAY=5000    # 重试间隔毫秒（默认5000）

# 邮箱域名
EMAIL_DOMAIN=tangtangs.cn
```

### 方式2: 配置文件（推荐用于CLI工具）

复制 `config.example.js` 为 `config.js` 并修改：

```javascript
module.exports = {
  imap: {
    user: 'your-email@qq.com',
    password: 'your_app_password',
    host: 'imap.qq.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  },
  domain: 'tangtangs.cn',
  fetchRetry: {
    times: 10,
    delay: 5000
  }
};
```

## 使用示例

### 1. Web API 方式

#### 普通获取邮件
```bash
curl http://localhost:3000/api/inbox/{emailId}
```

#### 轮询获取邮件（支持重试）
```bash
curl -X POST http://localhost:3000/api/inbox/{emailId}/poll \
  -H "Content-Type: application/json" \
  -d '{
    "retryTimes": 10,
    "retryDelay": 5000,
    "markAsSeen": true
  }'
```

### 2. 命令行方式

#### 使用环境变量
```bash
export IMAP_USER="your-email@gmail.com"
export IMAP_PASS="your-app-password"
node poller.js
```

或使用npm脚本：
```bash
npm run poller
```

#### 使用配置文件
```bash
cp config.example.js config.js
# 编辑 config.js
node poller-config.js
```

或使用npm脚本：
```bash
npm run poller:config
```

### 3. 代码集成方式

```javascript
const imapPollerService = require('./services/imapPollerService');

// 轮询获取邮件
async function fetchEmails() {
  const emails = await imapPollerService.fetchEmailWithRetry(
    'test123@tangtangs.cn',
    {
      retryTimes: 10,
      retryDelay: 5000,
      markAsSeen: true,
      onRetry: (attempt, total, delay) => {
        console.log(`第 ${attempt}/${total} 次尝试`);
      }
    }
  );
  
  return emails;
}

// 直接获取邮件（不重试）
async function getEmails() {
  const emails = await imapPollerService.getEmailsByAddress(
    'test123@tangtangs.cn'
  );
  
  return emails;
}
```

## 邮件格式

获取到的邮件对象格式：

```javascript
{
  id: 12345,              // 邮件UID
  uid: 12345,            // 邮件UID（同id）
  subject: '测试邮件',    // 主题
  from: 'sender@example.com',  // 发件人
  to: 'test@tangtangs.cn',     // 收件人
  date: '2024-01-01T00:00:00.000Z',  // 日期
  text: '邮件纯文本内容',  // 纯文本内容
  html: '<p>邮件HTML内容</p>',  // HTML内容
  receivedAt: '2024-01-01T00:00:00.000Z',  // 接收时间
  flags: ['\\Seen']      // 邮件标记
}
```

## 常见邮箱服务配置

### Gmail
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password  # 需要生成应用专用密码
```

### QQ邮箱
```env
IMAP_HOST=imap.qq.com
IMAP_PORT=993
IMAP_USER=your-email@qq.com
IMAP_PASS=your-authorization-code  # 需要开启IMAP并生成授权码
```

### 163邮箱
```env
IMAP_HOST=imap.163.com
IMAP_PORT=993
IMAP_USER=your-email@163.com
IMAP_PASS=your-authorization-code  # 需要开启IMAP并生成授权码
```

### Outlook/Hotmail
```env
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_USER=your-email@outlook.com
IMAP_PASS=your-password
```

## 域名配置要求

要使用真实的IMAP轮询功能，您需要：

1. **拥有一个域名**（如 `tangtangs.cn`）
2. **配置邮件转发规则**（Catch-all）:
   - 将所有发送到 `*@tangtangs.cn` 的邮件转发到您的主邮箱
   - 在域名服务商的邮件管理中配置
3. **配置IMAP访问**:
   - 在您的主邮箱中开启IMAP服务
   - 生成应用专用密码（对于Gmail、QQ等邮箱）

## 工作流程

```
┌─────────────────┐
│ 1. 生成临时邮箱  │
│ test@domain.cn  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 发送邮件到    │
│ test@domain.cn  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 邮件转发到    │
│ 您的主邮箱       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. IMAP轮询     │
│ 查找未读邮件     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 解析并返回    │
│ 邮件内容         │
└─────────────────┘
```

## 故障排查

### 问题1: 连接IMAP失败

**症状**: `IMAP连接失败` 错误

**解决方案**:
1. 检查环境变量是否正确设置
2. 确认IMAP服务器地址和端口
3. 验证邮箱账号和密码/授权码
4. 确保开启了IMAP服务

### 问题2: 找不到邮件

**症状**: 轮询超时，未找到邮件

**解决方案**:
1. 确认域名邮件转发规则已生效
2. 检查邮件是否被当作垃圾邮件
3. 查看主邮箱是否真的收到了邮件
4. 增加重试次数和间隔时间

### 问题3: 重复获取邮件

**症状**: 每次都获取到相同的邮件

**解决方案**:
1. 确保 `markAsSeen: true`
2. 使用 `UNSEEN` 搜索条件
3. 手动标记邮件为已读

## 性能优化

1. **合理设置重试参数**: 
   - 测试环境: `times: 5, delay: 3000`
   - 生产环境: `times: 10, delay: 5000`

2. **使用连接池**: 对于高频访问，考虑实现连接池

3. **缓存邮件**: 将获取的邮件缓存到内存或数据库

4. **异步处理**: 使用队列异步处理邮件轮询

## API参考

### `fetchEmailWithRetry(targetEmail, options)`

轮询获取邮件（支持重试）

**参数**:
- `targetEmail` (string): 目标邮箱地址
- `options` (object): 配置选项
  - `config` (object): IMAP配置
  - `retryTimes` (number): 重试次数（默认10）
  - `retryDelay` (number): 重试间隔毫秒（默认5000）
  - `markAsSeen` (boolean): 是否标记已读（默认true）
  - `onRetry` (function): 重试回调函数

**返回**: Promise<Array> - 邮件数组

### `getEmailsByAddress(targetEmail, options)`

直接获取邮件（不重试）

**参数**:
- `targetEmail` (string): 目标邮箱地址
- `options` (object): 配置选项
  - `config` (object): IMAP配置

**返回**: Promise<Array> - 邮件数组

### `testConnection(config)`

测试IMAP连接

**参数**:
- `config` (object): IMAP配置（可选）

**返回**: Promise<object> - 连接状态

## 安全建议

1. **不要提交密码**: `.env` 和 `config.js` 已加入 `.gitignore`
2. **使用应用密码**: 不要使用主账号密码
3. **限制访问权限**: 仅授予IMAP读取权限
4. **定期更换密码**: 定期更新应用专用密码
5. **加密传输**: 始终使用TLS加密（port 993）

## 测试

运行测试脚本：

```bash
npm run test:poller
```

## 许可证

MIT License
