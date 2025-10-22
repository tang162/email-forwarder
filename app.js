const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./services/emailService');
const simpleImapService = require('./services/simpleImapService');
const imapPollerService = require('./services/imapPollerService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 存储生成的邮箱地址（内存存储）
const generatedEmails = new Map();

// 生成随机邮箱地址
app.post('/api/generate-email', (req, res) => {
    const emailId = uuidv4().replace(/-/g, '').substring(0, 10);
    const emailAddress = `${emailId}@tangtangs.cn`;
    
    // 存储邮箱信息
    generatedEmails.set(emailId, {
        email: emailAddress,
        created: new Date(),
        messages: []
    });
    
    res.json({
        success: true,
        emailId: emailId,
        emailAddress: emailAddress
    });
});

// 获取邮箱信息
app.get('/api/email/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    const emailData = generatedEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: '邮箱不存在'
        });
    }
    
    res.json({
        success: true,
        data: emailData
    });
});

// 测试发送邮件
app.post('/api/send-test-email', async (req, res) => {
    const { toEmail, subject, content } = req.body;
    
    if (!toEmail || !subject || !content) {
        return res.status(400).json({
            success: false,
            message: '缺少必要参数'
        });
    }
    
    try {
        const result = await emailService.sendTestEmail(toEmail, subject, content);
        res.json({
            success: true,
            message: '邮件发送成功',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '邮件发送失败',
            error: error.message
        });
    }
});

// 获取邮箱收件箱
app.get('/api/inbox/:emailId', async (req, res) => {
    const emailId = req.params.emailId;
    const emailData = generatedEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: '邮箱不存在'
        });
    }
    
    try {
        let messages = [];
        
        // 如果配置了IMAP，尝试使用IMAP poller获取真实邮件
        if (process.env.IMAP_USER && process.env.IMAP_PASS) {
            try {
                messages = await imapPollerService.getEmailsByAddress(emailData.email);
            } catch (imapError) {
                console.warn('[App] IMAP获取失败，回退到模拟服务:', imapError.message);
                // 如果IMAP失败，回退到简化IMAP服务
                messages = await simpleImapService.getEmailsByAddress(emailData.email);
            }
        } else {
            // 未配置IMAP，使用简化IMAP服务（模拟）
            messages = await simpleImapService.getEmailsByAddress(emailData.email);
        }
        
        // 更新存储的邮件
        emailData.messages = messages;
        generatedEmails.set(emailId, emailData);
        
        res.json({
            success: true,
            messages: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取邮件失败',
            error: error.message
        });
    }
});

// 轮询获取邮件（支持重试）
app.post('/api/inbox/:emailId/poll', async (req, res) => {
    const emailId = req.params.emailId;
    const emailData = generatedEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: '邮箱不存在'
        });
    }
    
    // 从请求体获取配置参数
    const { retryTimes, retryDelay, markAsSeen } = req.body;
    
    try {
        const messages = await imapPollerService.fetchEmailWithRetry(emailData.email, {
            retryTimes: retryTimes,
            retryDelay: retryDelay,
            markAsSeen: markAsSeen,
            onRetry: (attempt, total, delay) => {
                console.log(`[API Poll] 邮箱 ${emailData.email} 第 ${attempt}/${total} 次尝试`);
            }
        });
        
        // 更新存储的邮件
        emailData.messages = messages;
        generatedEmails.set(emailId, emailData);
        
        res.json({
            success: true,
            messages: messages,
            polled: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '轮询邮件失败',
            error: error.message
        });
    }
});

// 获取所有生成的邮箱
app.get('/api/emails', (req, res) => {
    const emails = Array.from(generatedEmails.entries()).map(([id, data]) => ({
        id: id,
        ...data
    }));
    
    res.json({
        success: true,
        emails: emails
    });
});

// 配置页面
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        config: {
            domain: 'tangtangs.cn',
            imapHost: process.env.IMAP_HOST || '',
            imapPort: process.env.IMAP_PORT || 993,
            imapUser: process.env.IMAP_USER || '',
            smtpHost: process.env.SMTP_HOST || '',
            smtpPort: process.env.SMTP_PORT || 587,
            smtpUser: process.env.SMTP_USER || ''
        }
    });
});

// 获取系统状态
app.get('/api/status', async (req, res) => {
    try {
        const smtpStatus = await emailService.verifyConnection();
        const simpleImapStatus = await simpleImapService.testConnection();
        const emailStats = simpleImapService.getEmailStats();
        
        // 测试IMAP poller连接
        let imapPollerStatus = { success: false, message: '未配置' };
        if (process.env.IMAP_USER && process.env.IMAP_PASS) {
            imapPollerStatus = await imapPollerService.testConnection();
        }
        
        res.json({
            success: true,
            status: {
                smtp: smtpStatus,
                imap: simpleImapStatus.success,
                imapPoller: imapPollerStatus.success,
                imapPollerMessage: imapPollerStatus.message,
                totalEmails: Object.keys(emailStats).length,
                totalMessages: Object.values(emailStats).reduce((sum, count) => sum + count, 0),
                emailStats: emailStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取系统状态失败',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`无限邮箱接码工具启动成功，端口: ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
});