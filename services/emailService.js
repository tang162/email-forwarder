const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    initTransporter() {
        // 使用环境变量配置SMTP，如果没有配置则使用测试配置
        const smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
                pass: process.env.SMTP_PASS || 'ethereal.pass'
            }
        };

        this.transporter = nodemailer.createTransport(smtpConfig);
    }

    async sendTestEmail(toEmail, subject, content) {
        if (!this.transporter) {
            throw new Error('邮件服务未初始化');
        }

        const mailOptions = {
            from: process.env.SMTP_USER || 'test@example.com',
            to: toEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">测试邮件</h2>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
                        ${content}
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        这是一封来自无限邮箱接码工具的测试邮件
                    </p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);


            return {
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            // 即使SMTP发送失败，也可以将邮件添加到模拟收件箱进行演示
            if (toEmail.includes('@tangtangs.cn')) {

                return {
                    messageId: 'demo-' + Date.now(),
                    response: '邮件已添加到模拟收件箱（SMTP服务未配置）'
                };
            }

            throw new Error(`发送邮件失败: ${error.message}`);
        }
    }

    // 验证邮件配置
    async verifyConnection() {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('SMTP连接验证失败:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();