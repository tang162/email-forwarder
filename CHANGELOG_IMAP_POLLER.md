# IMAP Poller 功能更新日志

## 功能概述

本次更新为无限邮箱接码工具添加了完整的 IMAP 轮询功能，支持从真实邮箱中轮询获取邮件，并提供可配置的重试机制。

## 新增文件

### 核心服务
- `services/imapPollerService.js` - IMAP轮询服务核心实现
  - 基于 `imap-simple` 库
  - 支持配置化重试机制
  - 支持标记邮件为已读
  - 完善的错误处理

### 命令行工具
- `poller.js` - 基于环境变量的命令行轮询工具
  - 使用环境变量配置
  - 交互式界面
  - 实时显示轮询进度

- `poller-config.js` - 基于配置文件的命令行轮询工具
  - 使用 config.js 配置文件
  - 完全兼容参考实现
  - 更灵活的配置方式

### 配置文件
- `config.example.js` - IMAP配置示例文件
  - 参考实现的配置格式
  - 包含详细的中文注释

### 测试文件
- `test-poller.js` - IMAP轮询功能测试脚本
  - 基本功能测试
  - 不依赖真实IMAP配置
  - 快速验证服务可用性

### 文档
- `IMAP_POLLER.md` - IMAP轮询功能详细文档
  - 完整的功能说明
  - 配置指南
  - 使用示例
  - 故障排查
  
- `QUICK_START.md` - 快速开始指南
  - 5分钟上手指南
  - 常见场景示例
  - 常见问题解答

- `CHANGELOG_IMAP_POLLER.md` - 本文件，更新日志

## 修改文件

### 后端服务
- `app.js`
  - 引入 imapPollerService
  - 更新 `/api/inbox/:emailId` 端点，支持自动使用IMAP轮询
  - 新增 `/api/inbox/:emailId/poll` 端点，支持轮询重试
  - 更新 `/api/status` 端点，包含IMAP轮询器状态

### 配置文件
- `.env.example`
  - 新增 IMAP 轮询配置项
  - 新增邮箱域名配置项

- `.gitignore`
  - 新增 config.js 到忽略列表（保护敏感信息）

### 依赖管理
- `package.json`
  - 新增 imap-simple 依赖
  - 新增 npm 脚本：
    - `npm run poller` - 运行环境变量版轮询工具
    - `npm run poller:config` - 运行配置文件版轮询工具
    - `npm run test:poller` - 运行测试

- `package-lock.json`
  - 自动更新依赖锁定文件

### 文档
- `README.md`
  - 更新功能特点列表
  - 新增命令行模式说明
  - 新增环境变量配置说明
  - 新增 API 端点文档
  - 更新技术栈说明
  - 添加快速开始指南链接

- `USAGE.md`
  - 新增 IMAP轮询工具使用说明
  - 更新工作原理说明（双模式）
  - 更新环境变量配置说明

## 技术实现细节

### IMAP轮询服务 (imapPollerService.js)

**核心功能**:
1. `fetchEmailWithRetry()` - 支持重试的邮件获取
   - 可配置重试次数和间隔
   - 搜索未读邮件（UNSEEN）
   - 自动标记为已读
   - 重试回调支持

2. `getEmailsByAddress()` - 直接获取邮件（不重试）
   - 一次性获取所有匹配邮件
   - 按日期排序

3. `testConnection()` - 测试IMAP连接
   - 快速验证配置
   - 返回详细状态信息

**配置支持**:
- 环境变量配置（推荐Web服务使用）
- 自定义配置对象（推荐CLI工具使用）
- 配置文件支持（config.js）

**错误处理**:
- 连接失败自动重试
- 详细的错误日志
- 优雅的降级处理

### API端点更新

**GET `/api/inbox/:emailId`**:
- 自动检测IMAP配置
- 如果配置了IMAP，使用IMAP轮询器
- 如果IMAP失败，回退到模拟服务
- 向后兼容，不影响现有功能

**POST `/api/inbox/:emailId/poll`** (新增):
- 专门的轮询端点
- 支持自定义重试参数
- 请求体参数：
  - `retryTimes`: 重试次数
  - `retryDelay`: 重试间隔
  - `markAsSeen`: 是否标记已读

**GET `/api/status`**:
- 新增 IMAP 轮询器状态
- 显示配置状态和连接状态

### 命令行工具

**poller.js**:
- 使用环境变量配置
- 简洁的交互式界面
- 实时显示轮询进度
- 错误提示友好

**poller-config.js**:
- 使用 config.js 配置文件
- 完全兼容参考实现
- 显示当前配置信息
- 支持自定义域名

## 使用场景

### 1. Web服务模式
```bash
# 配置环境变量
export IMAP_USER="your-email@gmail.com"
export IMAP_PASS="your-app-password"

# 启动服务
npm start

# 访问 http://localhost:3000
# API会自动使用IMAP轮询
```

### 2. 命令行工具模式
```bash
# 方式1: 使用环境变量
export IMAP_USER="your-email@gmail.com"
export IMAP_PASS="your-app-password"
npm run poller

# 方式2: 使用配置文件
cp config.example.js config.js
# 编辑 config.js
npm run poller:config
```

### 3. 代码集成模式
```javascript
const imapPollerService = require('./services/imapPollerService');

const emails = await imapPollerService.fetchEmailWithRetry(
  'test@tangtangs.cn',
  { retryTimes: 10, retryDelay: 5000 }
);
```

## 配置示例

### 环境变量 (.env)
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
IMAP_RETRY_TIMES=10
IMAP_RETRY_DELAY=5000
EMAIL_DOMAIN=tangtangs.cn
```

### 配置文件 (config.js)
```javascript
module.exports = {
  imap: {
    user: 'your-email@qq.com',
    password: 'your-app-password',
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

## 向后兼容性

- ✅ **完全兼容**: 所有现有功能保持不变
- ✅ **可选功能**: IMAP轮询是可选的，不配置也能正常使用
- ✅ **自动回退**: IMAP失败时自动回退到模拟服务
- ✅ **API兼容**: 现有API端点行为不变，只是增强了功能

## 测试验证

运行测试验证功能：
```bash
# 测试IMAP轮询服务
npm run test:poller

# 测试Web服务
npm start

# 测试命令行工具
npm run poller
```

## 安全考虑

1. **敏感信息保护**:
   - `.env` 和 `config.js` 已加入 `.gitignore`
   - 配置获取时密码字段自动隐藏

2. **应用专用密码**:
   - 文档中强调使用应用密码
   - 提供各邮箱服务商的配置指南

3. **TLS加密**:
   - 默认启用TLS（端口993）
   - 强制加密传输

## 文档完整性

本次更新提供了完整的文档：
- ✅ 快速开始指南 (QUICK_START.md)
- ✅ 详细功能文档 (IMAP_POLLER.md)
- ✅ 使用指南 (USAGE.md)
- ✅ 主文档更新 (README.md)
- ✅ 配置示例 (config.example.js, .env.example)
- ✅ 更新日志 (本文件)

## 依赖更新

新增依赖包：
- `imap-simple@^5.1.0` - IMAP轮询核心库

## 测试状态

- ✅ 语法检查通过
- ✅ 服务启动测试通过
- ✅ 基本功能测试通过
- ✅ 模拟模式兼容性验证通过

## 下一步计划（可选）

可能的未来增强：
1. WebSocket实时通知
2. 数据持久化存储
3. 邮件附件支持
4. 更多邮箱服务商预设配置
5. 邮件过滤和搜索功能

## 贡献者

本次功能由AI助手基于用户提供的参考实现完成。

## 许可证

MIT License
