const imaps = require('imap-simple')
const { simpleParser } = require('mailparser')
const lodash = require('lodash')

/**
 * IMAP Poller Service - 智能邮箱兼容版 (v2.1.0)
 * 自动识别邮箱类型（Gmail / Outlook / QQ / 企业邮箱）
 * 支持 HEADER / X-GM-RAW 搜索，确保 TO 匹配可靠
 */
class ImapPollerService {
    constructor() {
        this.defaultConfig = {
            imap: {
                user: process.env.IMAP_USER || '',
                password: process.env.IMAP_PASS || '',
                host: process.env.IMAP_HOST || 'imap.gmail.com',
                port: parseInt(process.env.IMAP_PORT, 10) || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            },
            fetchRetry: {
                times: parseInt(process.env.IMAP_RETRY_TIMES, 10) || 10,
                delay: parseInt(process.env.IMAP_RETRY_DELAY, 10) || 5000
            }
        }
    }

    /**
     * 使用轮询方式获取邮件（支持重试）
     */
    async fetchEmailWithRetry(searchCriteria, options = {}) {
        const config = lodash.merge({}, this.defaultConfig, options.config)
        const retryTimes = options.retryTimes ?? config.fetchRetry.times
        const retryDelay = options.retryDelay ?? config.fetchRetry.delay
        const onRetry = options.onRetry || (() => { })

        if (!config.imap.user || !config.imap.password) {
            throw new Error('IMAP配置不完整，请设置 IMAP_USER 和 IMAP_PASS')
        }

        for (let i = 0; i < retryTimes; i++) {
            try {
                const messages = await this._fetchAndParseEmails(searchCriteria, {
                    ...options,
                    config
                })
                if (messages.length > 0) return messages

                onRetry(i + 1, retryTimes, retryDelay)
                if (i < retryTimes - 1) await this.delay(retryDelay)
            } catch (err) {
                console.error(`[ImapPoller] 第 ${i + 1}/${retryTimes} 次尝试失败:`, err.message)
                if (i === retryTimes - 1)
                    throw new Error(`IMAP获取失败 (${retryTimes} 次): ${err.message}`)
                onRetry(i + 1, retryTimes, retryDelay)
                await this.delay(retryDelay)
            }
        }
        console.log(`[ImapPoller] ${retryTimes} 次尝试后仍未找到邮件`)
        return []
    }

    /**
     * 获取满足条件的所有邮件（自动兼容邮箱类型）
     */
    async getEmails(email) {
        try {
            const searchCriteria = [['TO', email], ['UNSEEN']];
            const options = {
                markAsSeen: true,
                targetEmail: email  // 传递 targetEmail 参数
            }
            const emails = await this._fetchAndParseEmails(searchCriteria, options)
            return emails
        } catch (error) {
            console.error('[ImapPoller] 获取邮件失败:', error.message)
            return []
        }
    }

    /**
     * 🌐 [私有] 自动识别邮箱类型并智能选择搜索方式
     */
    async _fetchAndParseEmails(searchCriteria, options = {}) {
        const config = lodash.merge({}, this.defaultConfig, options.config)
        const markAsSeen = options.markAsSeen !== undefined ? options.markAsSeen : true
        const targetEmail = options.targetEmail
        const lowerTarget = targetEmail?.toLowerCase()

        if (!config.imap.user || !config.imap.password) {
            throw new Error('IMAP配置不完整')
        }

        const host = (config.imap.host || '').toLowerCase()
        let connection

        try {
            connection = await imaps.connect(config)
            await connection.openBox('INBOX')

            let finalCriteria = searchCriteria

            // ✅ 智能邮箱判断
            if (targetEmail) {
                if (host.includes('gmail')) {
                    // Gmail 用 X-GM-RAW
                    finalCriteria = [['X-GM-RAW', `to:${targetEmail} is:unread`]]
                } else {
                    // 其他邮箱用 HEADER 搜索更稳定
                    console.log(targetEmail);

                    finalCriteria = [['HEADER', 'TO', targetEmail], ['UNSEEN']]
                }
            }


            // 修复：获取完整邮件内容，让 simpleParser 处理所有内容
            const fetchOptions = {
                bodies: [''],
                struct: true,
            };

            const messages = await connection.search(finalCriteria, fetchOptions);
            console.log(`找到 ${messages.length} 条消息`);

            if (messages.length === 0) return []

            // 🔍 解析邮件内容
            const parsed = await Promise.all(
                messages.map(async msg => {
                    // 获取完整邮件内容 (bodies: [''] 表示完整邮件)
                    const all = msg.parts.find(part => part.which === '');
                    const rawEmail = all ? all.body : '';

                    const parsedEmail = await simpleParser(rawEmail);

                    return {
                        id: msg.attributes.uid,
                        subject: parsedEmail.subject || '无主题',
                        from: parsedEmail.from?.text || '未知发件人',
                        to: parsedEmail.to?.text || '',
                        date: parsedEmail.date || new Date(),
                        text: parsedEmail.text || '',
                        html: parsedEmail.html || parsedEmail.textAsHtml || '',
                        flags: msg.attributes.flags || [],
                        receivedAt: new Date()
                    }
                })
            )

            // ✅ 二次过滤 (防止 HEADER 搜索匹配不精确)
            const filtered = lowerTarget
                ? parsed.filter(m => m.to?.toLowerCase().includes(lowerTarget))
                : parsed


            // ✅ 如果启用 markAsSeen，则标记所有已匹配邮件为已读
            if (markAsSeen && messages.length > 0) {
                const uids = messages.map(m => m.attributes.uid)
                try {
                    await connection.addFlags(uids, '\\Seen')
                    console.log(`[ImapPoller] 已标记 ${uids.length} 封邮件为已读`)
                } catch (err) {
                    console.warn('[ImapPoller] 标记已读失败:', err.message)
                }
            }


            // 按日期降序排列
            return filtered.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
        } finally {
            if (connection && connection.state !== 'disconnected') connection.end()
        }
    }

    async testConnection(config = null) {
        const imapConfig = lodash.merge({}, this.defaultConfig, config)
        if (!imapConfig.imap.user || !imapConfig.imap.password)
            return { success: false, message: 'IMAP配置不完整' }

        let connection
        try {
            connection = await imaps.connect(imapConfig)
            return { success: true, message: 'IMAP连接成功' }
        } catch (err) {
            return { success: false, message: `IMAP连接失败: ${err.message}` }
        } finally {
            if (connection) connection.end()
        }
    }

    delay(ms) {
        return new Promise(res => setTimeout(res, ms))
    }

    getConfig() {
        const copy = lodash.cloneDeep(this.defaultConfig)
        copy.imap.password = '***'
        return copy
    }
}

module.exports = new ImapPollerService()  