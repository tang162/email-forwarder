const axios = require('axios');

// 简单的演示脚本来测试API功能
async function demoEmailCatcher() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🚀 开始演示无限邮箱接码工具...\n');

    try {
        // 1. 生成新邮箱
        console.log('1️⃣  生成新邮箱...');
        const genResponse = await axios.post(`${baseUrl}/api/generate-email`);
        const { emailId, emailAddress } = genResponse.data;
        console.log(`   ✅ 生成成功: ${emailAddress}`);
        console.log(`   📧 邮箱ID: ${emailId}\n`);

        // 2. 发送测试邮件
        console.log('2️⃣  发送测试邮件...');
        const emailData = {
            toEmail: emailAddress,
            subject: '这是一封测试邮件',
            content: `Hello! 这是发送到 ${emailAddress} 的测试邮件内容。\n\n发送时间: ${new Date().toLocaleString()}\n\n这是一个演示如何接收邮件的例子。`
        };

        const sendResponse = await axios.post(`${baseUrl}/api/send-test-email`, emailData);
        console.log(`   ✅ 发送成功: ${sendResponse.data.message}`);
        console.log(`   📬 消息ID: ${sendResponse.data.result?.messageId || 'demo-message'}\n`);

        // 3. 等待一秒然后检查收件箱
        console.log('3️⃣  检查收件箱...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const inboxResponse = await axios.get(`${baseUrl}/api/inbox/${emailId}`);
        const messages = inboxResponse.data.messages;
        
        console.log(`   📨 收到 ${messages.length} 封邮件`);
        
        if (messages.length > 0) {
            const message = messages[0];
            console.log(`   📧 最新邮件:`);
            console.log(`      主题: ${message.subject}`);
            console.log(`      发件人: ${message.from}`);
            console.log(`      时间: ${new Date(message.date).toLocaleString()}`);
            console.log(`      内容: ${message.text.substring(0, 100)}${message.text.length > 100 ? '...' : ''}\n`);
        }

        // 4. 生成更多邮箱进行测试
        console.log('4️⃣  生成更多邮箱进行测试...');
        
        for (let i = 1; i <= 3; i++) {
            const response = await axios.post(`${baseUrl}/api/generate-email`);
            console.log(`   📧 邮箱 ${i}: ${response.data.emailAddress}`);
        }
        console.log();

        // 5. 获取所有邮箱列表
        console.log('5️⃣  获取所有邮箱列表...');
        const allEmailsResponse = await axios.get(`${baseUrl}/api/emails`);
        const allEmails = allEmailsResponse.data.emails;
        
        console.log(`   📬 共有 ${allEmails.length} 个临时邮箱:`);
        allEmails.forEach((email, index) => {
            console.log(`      ${index + 1}. ${email.email} (${email.messages.length} 封邮件)`);
        });
        console.log();

        // 6. 获取系统状态
        console.log('6️⃣  获取系统状态...');
        const statusResponse = await axios.get(`${baseUrl}/api/status`);
        const status = statusResponse.data.status;
        
        console.log(`   📊 系统状态:`);
        console.log(`      SMTP连接: ${status.smtp ? '✅ 正常' : '❌ 异常'}`);
        console.log(`      IMAP服务: ${status.imap ? '✅ 正常' : '❌ 异常'}`);
        console.log(`      总邮箱数: ${status.totalEmails}`);
        console.log(`      总邮件数: ${status.totalMessages}\n`);

        console.log('🎉 演示完成！');
        console.log('💡 提示: 打开浏览器访问 http://localhost:3000 查看Web界面');
        
    } catch (error) {
        console.error('❌ 演示失败:', error.message);
        if (error.response) {
            console.error('   响应错误:', error.response.data);
        }
    }
}

// 检查服务是否运行
async function checkServer() {
    try {
        await axios.get('http://localhost:3000/api/config');
        return true;
    } catch (error) {
        return false;
    }
}

// 主函数
async function main() {
    const isRunning = await checkServer();
    
    if (!isRunning) {
        console.log('⚠️  服务器未运行，请先启动应用:');
        console.log('   npm start');
        console.log('   或者: node app.js\n');
        return;
    }
    
    await demoEmailCatcher();
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { demoEmailCatcher, checkServer };