const Imap = require('imap');
const { simpleParser } = require('mailparser');

class ImapService {
    constructor() {
        this.imapConfig = {
            user: process.env.IMAP_USER || '',
            password: process.env.IMAP_PASS || '',
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: process.env.IMAP_PORT || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        };
    }

    async getEmailsByAddress(targetEmail) {
        return new Promise((resolve, reject) => {
            if (!this.imapConfig.user || !this.imapConfig.password) {
                return resolve([]);
            }

            const imap = new Imap(this.imapConfig);
            const messages = [];

            imap.once('ready', () => {
                imap.openBox('INBOX', true, (err, box) => {
                    if (err) {
                        console.error('打开邮箱失败:', err.message);
                        return resolve([]);
                    }

                    // 搜索发送给目标邮箱的邮件
                    imap.search([['TO', targetEmail]], (err, results) => {
                        if (err || !results || results.length === 0) {
                            imap.end();
                            return resolve([]);
                        }

                        const fetch = imap.fetch(results, { 
                            bodies: '',
                            struct: true,
                            envelope: true 
                        });

                        fetch.on('message', (msg, seqno) => {
                            let messageData = {};

                            msg.on('body', (stream, info) => {
                                let buffer = '';
                                stream.on('data', (chunk) => {
                                    buffer += chunk.toString('utf8');
                                });
                                
                                stream.once('end', async () => {
                                    try {
                                        const parsed = await simpleParser(buffer);
                                        messageData = {
                                            id: seqno,
                                            subject: parsed.subject || '无主题',
                                            from: parsed.from?.text || '未知发件人',
                                            to: parsed.to?.text || '',
                                            date: parsed.date || new Date(),
                                            text: parsed.text || '',
                                            html: parsed.html || '',
                                            receivedAt: new Date()
                                        };
                                    } catch (parseErr) {
                                        console.error('解析邮件失败:', parseErr.message);
                                        messageData = {
                                            id: seqno,
                                            subject: '解析失败',
                                            from: '未知',
                                            error: parseErr.message,
                                            receivedAt: new Date()
                                        };
                                    }
                                });
                            });

                            msg.once('attributes', (attrs) => {
                                messageData.uid = attrs.uid;
                                messageData.flags = attrs.flags;
                            });

                            msg.once('end', () => {
                                messages.push(messageData);
                            });
                        });

                        fetch.once('error', (err) => {
                            console.error('获取邮件失败:', err.message);
                            imap.end();
                            resolve([]);
                        });

                        fetch.once('end', () => {
                            imap.end();
                            // 按日期排序，最新的在前
                            messages.sort((a, b) => new Date(b.date) - new Date(a.date));
                            resolve(messages);
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('IMAP连接失败:', err.message);
                resolve([]);
            });

            imap.once('end', () => {
                console.log('IMAP连接已关闭');
            });

            imap.connect();
        });
    }

    // 测试IMAP连接
    async testConnection() {
        return new Promise((resolve) => {
            if (!this.imapConfig.user || !this.imapConfig.password) {
                return resolve({ success: false, message: 'IMAP配置不完整' });
            }

            const imap = new Imap(this.imapConfig);

            imap.once('ready', () => {
                imap.end();
                resolve({ success: true, message: 'IMAP连接成功' });
            });

            imap.once('error', (err) => {
                resolve({ success: false, message: `IMAP连接失败: ${err.message}` });
            });

            imap.connect();
        });
    }
}

module.exports = new ImapService();