const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

/**
 * IMAP Poller Service - 支持轮询重试的邮件获取服务
 * 基于 imap-simple 库实现，支持配置化的重试机制
 */
class ImapPollerService {
    constructor() {
        this.defaultConfig = {
            imap: {
                user: process.env.IMAP_USER || '',
                password: process.env.IMAP_PASS || '',
                host: process.env.IMAP_HOST || 'imap.gmail.com',
                port: parseInt(process.env.IMAP_PORT) || 993,
                tls: true,
                tlsOptions: {
                    rejectUnauthorized: false
                }
            },
            fetchRetry: {
                times: parseInt(process.env.IMAP_RETRY_TIMES) || 10,
                delay: parseInt(process.env.IMAP_RETRY_DELAY) || 5000
            }
        };
    }

    /**
     * 使用轮询方式获取邮件（支持重试）
     * @param {string} targetEmail - 要查找的目标邮箱地址
     * @param {object} options - 可选配置
     * @param {object} options.config - IMAP配置（覆盖默认配置）
     * @param {number} options.retryTimes - 重试次数
     * @param {number} options.retryDelay - 重试间隔（毫秒）
     * @param {boolean} options.markAsSeen - 是否标记为已读（默认true）
     * @param {function} options.onRetry - 重试回调函数
     * @returns {Promise<Array>} - 解析后的邮件对象数组
     */
    async fetchEmailWithRetry(targetEmail, options = {}) {
        const config = options.config || this.defaultConfig;
        const retryTimes = options.retryTimes || config.fetchRetry.times;
        const retryDelay = options.retryDelay || config.fetchRetry.delay;
        const markAsSeen = options.markAsSeen !== undefined ? options.markAsSeen : true;
        const onRetry = options.onRetry || (() => {});

        // 检查IMAP配置
        if (!config.imap.user || !config.imap.password) {
            throw new Error('IMAP配置不完整，请设置 IMAP_USER 和 IMAP_PASS 环境变量');
        }

        for (let i = 0; i < retryTimes; i++) {
            try {
                // 尝试连接并搜索邮件
                const connection = await imaps.connect(config);
                await connection.openBox('INBOX');

                // 搜索条件：发送到指定邮箱，并且是"未读"的邮件
                const searchCriteria = [['TO', targetEmail], ['UNSEEN']];
                const fetchOptions = {
                    bodies: [''],
                    markSeen: markAsSeen
                };

                const messages = await connection.search(searchCriteria, fetchOptions);

                if (messages.length > 0) {
                    // 找到邮件了！解析所有邮件
                    const parsedMessages = [];
                    
                    for (const message of messages) {
                        const all = message.parts.find(part => part.which === '');
                        const rawEmail = all.body;
                        const parsedEmail = await simpleParser(rawEmail);
                        
                        parsedMessages.push({
                            id: message.attributes.uid,
                            uid: message.attributes.uid,
                            subject: parsedEmail.subject || '无主题',
                            from: parsedEmail.from?.text || '未知发件人',
                            to: parsedEmail.to?.text || '',
                            date: parsedEmail.date || new Date(),
                            text: parsedEmail.text || '',
                            html: parsedEmail.html || parsedEmail.textAsHtml || '',
                            receivedAt: new Date(),
                            flags: message.attributes.flags
                        });
                    }

                    connection.end();
                    return parsedMessages;
                }

                // 未找到邮件，关闭连接，准备下一次重试
                connection.end();
                
                // 调用重试回调
                onRetry(i + 1, retryTimes, retryDelay);
                
                // 如果不是最后一次尝试，等待后重试
                if (i < retryTimes - 1) {
                    await this.delay(retryDelay);
                }

            } catch (error) {
                console.error(`[ImapPoller] 连接或获取邮件时出错 (尝试 ${i + 1}/${retryTimes}):`, error.message);
                
                // 如果是最后一次尝试，抛出错误
                if (i === retryTimes - 1) {
                    throw new Error(`IMAP获取邮件失败: ${error.message}`);
                }
                
                // 否则等待后重试
                await this.delay(retryDelay);
            }
        }

        // 所有重试结束后仍未找到
        return [];
    }

    /**
     * 获取指定邮箱地址的所有邮件（不重试，只查一次）
     * @param {string} targetEmail - 目标邮箱地址
     * @param {object} options - 可选配置
     * @returns {Promise<Array>} - 邮件数组
     */
    async getEmailsByAddress(targetEmail, options = {}) {
        const config = options.config || this.defaultConfig;

        if (!config.imap.user || !config.imap.password) {
            console.warn('[ImapPoller] IMAP配置不完整，返回空数组');
            return [];
        }

        try {
            const connection = await imaps.connect(config);
            await connection.openBox('INBOX');

            // 搜索发送到目标邮箱的所有邮件
            const searchCriteria = [['TO', targetEmail]];
            const fetchOptions = { bodies: [''] };

            const messages = await connection.search(searchCriteria, fetchOptions);
            const parsedMessages = [];

            for (const message of messages) {
                const all = message.parts.find(part => part.which === '');
                const rawEmail = all.body;
                const parsedEmail = await simpleParser(rawEmail);

                parsedMessages.push({
                    id: message.attributes.uid,
                    uid: message.attributes.uid,
                    subject: parsedEmail.subject || '无主题',
                    from: parsedEmail.from?.text || '未知发件人',
                    to: parsedEmail.to?.text || '',
                    date: parsedEmail.date || new Date(),
                    text: parsedEmail.text || '',
                    html: parsedEmail.html || parsedEmail.textAsHtml || '',
                    receivedAt: new Date(),
                    flags: message.attributes.flags
                });
            }

            connection.end();
            return parsedMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

        } catch (error) {
            console.error('[ImapPoller] 获取邮件失败:', error.message);
            return [];
        }
    }

    /**
     * 测试IMAP连接
     * @param {object} config - 可选的IMAP配置
     * @returns {Promise<object>} - 连接状态
     */
    async testConnection(config = null) {
        const imapConfig = config || this.defaultConfig;

        if (!imapConfig.imap.user || !imapConfig.imap.password) {
            return {
                success: false,
                message: 'IMAP配置不完整'
            };
        }

        try {
            const connection = await imaps.connect(imapConfig);
            connection.end();
            return {
                success: true,
                message: 'IMAP连接成功'
            };
        } catch (error) {
            return {
                success: false,
                message: `IMAP连接失败: ${error.message}`
            };
        }
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取当前配置
     * @returns {object} - 配置对象
     */
    getConfig() {
        return {
            ...this.defaultConfig,
            imap: {
                ...this.defaultConfig.imap,
                password: '***' // 隐藏密码
            }
        };
    }
}

module.exports = new ImapPollerService();
