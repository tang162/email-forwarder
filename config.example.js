// config.example.js
// IMAP轮询配置示例
// 请根据您的实际情况修改此文件，并重命名为 config.js

module.exports = {
  // IMAP 配置，用于连接您的"主邮箱"
  imap: {
    // 您的主邮箱账号（接收转发邮件的那个）
    user: 'your-main-email@qq.com', 
    
    // 您的主邮箱的 "授权码" 或 "应用专用密码"，不是登录密码！
    password: 'your_app_password_here', 
    
    // 您主邮箱的 IMAP 服务器地址
    // 示例: 'imap.qq.com', 'imap.gmail.com', 'imap.163.com'
    host: 'imap.qq.com', 
    
    // IMAP 服务器端口，一般是 993
    port: 993,
    
    // 是否使用 TLS 加密，必须是 true
    tls: true,
    
    // TLS/SSL 相关选项，通常保持默认
    tlsOptions: {
      rejectUnauthorized: false
    }
  },

  // 您要使用的无限邮箱域名
  domain: 'tangtangs.cn',

  // 轮询配置
  fetchRetry: {
    times: 10,      // 最多重试 10 次
    delay: 5000     // 每次重试间隔 5 秒（毫秒）
  }
};
