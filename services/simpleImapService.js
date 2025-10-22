// 简化版的邮件接收服务，避免复杂的IMAP配置问题
class SimpleImapService {
    constructor() {
        this.mockMessages = new Map(); // 存储模拟的邮件数据
    }

    // 模拟接收邮件的功能
    async getEmailsByAddress(targetEmail) {
        // 从内存中获取发送到该邮箱的邮件
        const messages = this.mockMessages.get(targetEmail) || [];
        return messages.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 添加邮件到模拟收件箱（当发送测试邮件时调用）
    addEmailToInbox(toEmail, fromEmail, subject, content) {
        const messages = this.mockMessages.get(toEmail) || [];
        
        const newMessage = {
            id: Date.now(),
            subject: subject,
            from: fromEmail,
            to: toEmail,
            date: new Date(),
            text: content,
            html: `<div style="font-family: Arial, sans-serif;">${content.replace(/\n/g, '<br>')}</div>`,
            receivedAt: new Date()
        };

        messages.unshift(newMessage); // 添加到开头
        this.mockMessages.set(toEmail, messages);
        
        return newMessage;
    }

    // 获取所有邮箱的邮件统计
    getEmailStats() {
        const stats = {};
        for (const [email, messages] of this.mockMessages.entries()) {
            stats[email] = messages.length;
        }
        return stats;
    }

    // 清理旧邮件（可选功能）
    cleanOldEmails(hours = 24) {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        for (const [email, messages] of this.mockMessages.entries()) {
            const filteredMessages = messages.filter(msg => 
                new Date(msg.receivedAt) > cutoffTime
            );
            
            if (filteredMessages.length !== messages.length) {
                this.mockMessages.set(email, filteredMessages);
            }
        }
    }

    // 测试连接（总是返回成功，因为这是模拟服务）
    async testConnection() {
        return { 
            success: true, 
            message: '模拟邮件服务已准备就绪' 
        };
    }
}

module.exports = new SimpleImapService();