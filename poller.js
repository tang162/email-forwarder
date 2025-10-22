const readline = require('readline');
const imapPollerService = require('./services/imapPollerService');

// 创建一个接口来等待用户按 Enter
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 生成一个随机的邮箱前缀
 * @returns {string} 随机字符串
 */
function generateRandomPrefix() {
    return 'test-' + Math.random().toString(36).substring(2, 12);
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 无限邮箱 IMAP 轮询工具 🚀\n');

    // 检查配置
    const config = imapPollerService.getConfig();
    if (!process.env.IMAP_USER || !process.env.IMAP_PASS) {
        console.error('❌ 错误: 缺少IMAP配置');
        console.error('请设置以下环境变量:');
        console.error('  - IMAP_USER: IMAP邮箱账号');
        console.error('  - IMAP_PASS: IMAP邮箱密码/授权码');
        console.error('  - IMAP_HOST: IMAP服务器地址（可选，默认: imap.gmail.com）');
        console.error('  - IMAP_PORT: IMAP服务器端口（可选，默认: 993）');
        console.error('  - IMAP_RETRY_TIMES: 重试次数（可选，默认: 10）');
        console.error('  - IMAP_RETRY_DELAY: 重试间隔毫秒数（可选，默认: 5000）\n');
        console.error('示例:');
        console.error('  export IMAP_USER="your-email@gmail.com"');
        console.error('  export IMAP_PASS="your-app-password"');
        console.error('  node poller.js\n');
        process.exit(1);
    }

    // 1. 生成邮箱地址
    const domain = process.env.EMAIL_DOMAIN || 'tangtangs.cn';
    const randomPrefix = generateRandomPrefix();
    const generatedEmail = `${randomPrefix}@${domain}`;
    
    console.log('--------------------------------------------------');
    console.log('步骤 1: 已为您生成一个临时邮箱地址:');
    console.log(`\n    📬  ${generatedEmail}\n`);
    console.log('--------------------------------------------------');

    // 2. 等待用户发送邮件
    await new Promise(resolve => {
        rl.question('步骤 2: 请向以上地址发送一封测试邮件。\n        发送完成后，请按【Enter】键继续...\n', resolve);
    });
    rl.close();

    // 3. 开始获取邮件
    console.log('\n🔍 开始在您的主邮箱中查找邮件...');
    
    const retryTimes = config.fetchRetry.times;
    const retryDelay = config.fetchRetry.delay;

    try {
        const emails = await imapPollerService.fetchEmailWithRetry(generatedEmail, {
            retryTimes: retryTimes,
            retryDelay: retryDelay,
            markAsSeen: true,
            onRetry: (attempt, total, delay) => {
                console.log(`第 ${attempt}/${total} 次尝试: 未找到邮件，将在 ${delay / 1000} 秒后重试...`);
            }
        });

        // 4. 显示结果
        console.log('--------------------------------------------------');
        if (emails.length > 0) {
            console.log(`✅ 成功找到 ${emails.length} 封邮件！\n`);
            
            emails.forEach((email, index) => {
                console.log(`步骤 3: 邮件 ${index + 1} 内容如下:\n`);
                console.log(`发件人: ${email.from}`);
                console.log(`主  题: ${email.subject}`);
                console.log(`日  期: ${new Date(email.date).toLocaleString()}`);
                console.log('\n--- 邮件正文 (纯文本) ---\n');
                console.log(email.text || '（无纯文本内容）');
                console.log('\n---------------------------\n');
            });
        } else {
            console.log('步骤 3: 抱歉，在规定时间内未能接收到邮件。');
            console.log('请检查:');
            console.log('  - 您的域名 Catch-all 转发规则是否设置正确并已生效。');
            console.log('  - 环境变量中的 IMAP 配置是否无误。');
            console.log('  - 邮件是否被主邮箱当成垃圾邮件拦截了。');
        }
        console.log('--------------------------------------------------');
        console.log('工具运行结束。');

    } catch (error) {
        console.error('--------------------------------------------------');
        console.error('❌ 获取邮件时发生错误:', error.message);
        console.error('请检查您的 IMAP 配置和网络连接。');
        console.error('--------------------------------------------------');
        process.exit(1);
    }
}

// 启动程序
if (require.main === module) {
    main().catch(error => {
        console.error('程序异常退出:', error);
        process.exit(1);
    });
}

module.exports = { main, generateRandomPrefix };
