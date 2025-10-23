require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./services/emailService');
const imapPollerService = require('./services/imapPollerService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 存储生成的邮箱地址（内存存储）
const generatedEmails = new Map();

// 存储手动配置的IMAP设置（内存存储）
let manualImapConfig = null;
let manualPollingConfig = null;
let manualEmailDomain = process.env.EMAIL_DOMAIN || 'tangtangs.cn';

// 存储OTP验证码（内存存储）
const otpStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;

const getEnvImapSettings = () => ({
    imap: {
        host: process.env.IMAP_HOST || '',
        port: parseInt(process.env.IMAP_PORT, 10) || 993,
        user: process.env.IMAP_USER || '',
        password: process.env.IMAP_PASS || '',
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    },
    fetchRetry: {
        times: parseInt(process.env.IMAP_RETRY_TIMES, 10) || 10,
        delay: parseInt(process.env.IMAP_RETRY_DELAY, 10) || 5000
    }
});

const getEffectiveImapSettings = () => {
    const envConfig = getEnvImapSettings();
    const effectiveConfig = {
        imap: { ...envConfig.imap },
        fetchRetry: { ...envConfig.fetchRetry }
    };

    if (manualImapConfig) {
        effectiveConfig.imap = {
            ...effectiveConfig.imap,
            ...manualImapConfig
        };
    }

    if (manualPollingConfig) {
        effectiveConfig.fetchRetry = {
            times: manualPollingConfig.times ?? effectiveConfig.fetchRetry.times,
            delay: manualPollingConfig.delay ?? effectiveConfig.fetchRetry.delay
        };
    }

    return effectiveConfig;
};

const getEffectiveDomain = () => manualEmailDomain || process.env.EMAIL_DOMAIN || 'tangtangs.cn';

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const createOtpForEmail = (emailId, emailAddress, emailData = null) => {
    const otp = generateOtpCode();
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(emailId, {
        otp,
        expiresAt,
        email: emailAddress
    });

    const data = emailData || generatedEmails.get(emailId);
    if (data) {
        data.otp = otp;
        data.otpExpiresAt = expiresAt;
        generatedEmails.set(emailId, data);
    }

    return { otp, expiresAt };
};

// 生成随机邮箱地址
app.post('/api/generate-email', (req, res) => {
    const emailId = uuidv4().replace(/-/g, '').substring(0, 10);
    const domain = getEffectiveDomain();
    const emailAddress = `${emailId}@${domain}`;

    // 存储邮箱信息
    const emailData = {
        email: emailAddress,
        created: new Date(),
        messages: []
    };
    generatedEmails.set(emailId, emailData);

    const { otp, expiresAt } = createOtpForEmail(emailId, emailAddress, emailData);

    res.json({
        success: true,
        emailId: emailId,
        emailAddress: emailAddress,
        otp,
        otpExpiresAt: expiresAt
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

        // 检查是否有手动配置或环境变量配置的IMAP
        const hasImapConfig = manualImapConfig || (process.env.IMAP_USER && process.env.IMAP_PASS);
        
        if (hasImapConfig) {
            try {
                // 如果有手动配置，使用手动配置
                if (manualImapConfig) {
                    const config = {
                        imap: {
                            ...manualImapConfig,
                            tls: true,
                            tlsOptions: { rejectUnauthorized: false }
                        }
                    };
                    
                    if (manualPollingConfig) {
                        config.fetchRetry = manualPollingConfig;
                    }
                    
                    messages = await imapPollerService.getEmails(emailData.email, {
                        config,
                        markAsSeen: true
                    });
                } else {
                    // 使用环境变量配置
                    messages = await imapPollerService.getEmails(emailData.email);
                }

            } catch (imapError) {
                console.warn('[App] IMAP获取失败:', imapError.message);
            }
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
    const imapConfig = manualImapConfig || {
        host: process.env.IMAP_HOST || '',
        port: parseInt(process.env.IMAP_PORT, 10) || 993,
        user: process.env.IMAP_USER || '',
        password: process.env.IMAP_PASS || ''
    };

    const pollingConfig = manualPollingConfig || {
        times: parseInt(process.env.IMAP_RETRY_TIMES, 10) || 10,
        delay: parseInt(process.env.IMAP_RETRY_DELAY, 10) || 5000
    };

    res.json({
        success: true,
        config: {
            domain: manualEmailDomain || process.env.EMAIL_DOMAIN || 'tangtangs.cn',
            imap: {
                host: imapConfig.host,
                port: imapConfig.port,
                user: imapConfig.user,
                hasPassword: !!imapConfig.password,
                tls: true,
                source: manualImapConfig ? 'manual' : 'env'
            },
            smtp: {
                host: process.env.SMTP_HOST || '',
                port: parseInt(process.env.SMTP_PORT, 10) || 587,
                user: process.env.SMTP_USER || ''
            },
            polling: {
                times: pollingConfig.times,
                delay: pollingConfig.delay,
                source: manualPollingConfig ? 'manual' : 'env'
            }
        }
    });
});

// 保存手动IMAP配置
app.post('/api/config', (req, res) => {
    const { imap, polling, domain } = req.body;

    if (!imap || !imap.host || !imap.port || !imap.user) {
        return res.status(400).json({
            success: false,
            message: '请提供完整的IMAP配置信息'
        });
    }

    const newImapConfig = {
        host: imap.host,
        port: parseInt(imap.port, 10),
        user: imap.user
    };

    if (imap.password) {
        newImapConfig.password = imap.password;
    } else if (manualImapConfig?.password) {
        newImapConfig.password = manualImapConfig.password;
    } else if (process.env.IMAP_PASS) {
        newImapConfig.password = process.env.IMAP_PASS;
    } else {
        return res.status(400).json({
            success: false,
            message: '请提供IMAP密码'
        });
    }

    manualImapConfig = newImapConfig;

    if (polling) {
        manualPollingConfig = {
            times: parseInt(polling.times, 10) || 10,
            delay: parseInt(polling.delay, 10) || 5000
        };
    }

    if (domain) {
        manualEmailDomain = domain;
    }

    res.json({
        success: true,
        message: 'IMAP配置已保存'
    });
});

// 获取当前OTP信息
app.get('/api/email/:emailId/otp', (req, res) => {
    const emailId = req.params.emailId;
    const storedOtpData = otpStore.get(emailId);

    if (!storedOtpData) {
        return res.status(404).json({
            success: false,
            message: '验证码不存在或已过期'
        });
    }

    res.json({
        success: true,
        otp: storedOtpData.otp,
        expiresAt: storedOtpData.expiresAt
    });
});

// 生成/刷新OTP验证码用于访问邮箱
app.post('/api/email/:emailId/otp', (req, res) => {
    const emailId = req.params.emailId;
    const emailData = generatedEmails.get(emailId);

    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: '邮箱不存在'
        });
    }

    const { otp, expiresAt } = createOtpForEmail(emailId, emailData.email, emailData);

    res.json({
        success: true,
        otp,
        expiresAt,
        message: '验证码已生成，有效期5分钟'
    });
});

// 验证OTP并返回邮箱访问链接
app.post('/api/email/:emailId/otp/verify', (req, res) => {
    const emailId = req.params.emailId;
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({
            success: false,
            message: '请提供验证码'
        });
    }

    const storedOtpData = otpStore.get(emailId);

    if (!storedOtpData) {
        return res.status(404).json({
            success: false,
            message: '验证码不存在或已过期'
        });
    }

    if (Date.now() > storedOtpData.expiresAt) {
        otpStore.delete(emailId);
        const emailData = generatedEmails.get(emailId);
        if (emailData) {
            emailData.otp = null;
            emailData.otpExpiresAt = null;
            generatedEmails.set(emailId, emailData);
        }
        return res.status(400).json({
            success: false,
            message: '验证码已过期'
        });
    }

    if (storedOtpData.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: '验证码错误'
        });
    }

    // 验证成功，删除验证码并清除存储
    otpStore.delete(emailId);
    const emailData = generatedEmails.get(emailId);
    if (emailData) {
        emailData.otp = null;
        emailData.otpExpiresAt = null;
        generatedEmails.set(emailId, emailData);
    }

    res.json({
        success: true,
        message: '验证成功',
        redirectUrl: `/inbox.html?emailId=${emailId}`
    });
});

// 测试IMAP连接
app.post('/api/test-imap', async (req, res) => {
    const { host, port, user, password } = req.body;

    if (!host || !port || !user || !password) {
        return res.status(400).json({
            success: false,
            message: '请提供完整的IMAP配置信息'
        });
    }

    try {
        const testConfig = {
            imap: {
                host,
                port: parseInt(port, 10),
                user,
                password,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            }
        };

        const result = await imapPollerService.testConnection(testConfig);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '连接测试失败: ' + error.message
        });
    }
});

// 获取系统状态
app.get('/api/status', async (req, res) => {
    const totalEmails = generatedEmails.size;
    let totalMessages = 0;
    
    generatedEmails.forEach(email => {
        totalMessages += email.messages.length;
    });

    // 测试SMTP连接
    const smtpStatus = await emailService.verifyConnection();
    
    // 测试IMAP连接
    let imapStatus = false;
    const imapConfig = manualImapConfig || {
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT,
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS
    };
    
    if (imapConfig.user && imapConfig.password) {
        const result = await imapPollerService.testConnection({
            imap: {
                ...imapConfig,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            }
        });
        imapStatus = result.success;
    }

    res.json({
        success: true,
        status: {
            smtp: smtpStatus,
            imap: imapStatus,
            totalEmails,
            totalMessages,
            manualConfigEnabled: !!manualImapConfig,
            emailDomain: manualEmailDomain
        }
    });
});

app.listen(PORT, () => {
    console.log(`无限邮箱接码工具启动成功，端口: ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
});