// poller-config.js
// 使用config.js配置文件的IMAP轮询工具（参考版本）
const readline = require('readline');
const imapPollerService = require('./services/imapPollerService');
const fs = require('fs');
const path = require('path');

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
 * 加载配置文件
 * @returns {object|null} 配置对象或null
 */
function loadConfig() {
    const configPath = path.join(__dirname, 'config.js');
    
    if (!fs.existsSync(configPath)) {
        console.error('❌ 错误: 找不到 config.js 配置文件');
        console.error('请复制 config.example.js 为 config.js 并修改配置');
        console.error('命令: cp config.example.js config.js\n');
        return null;
    }
    
    try {
        const config = require('./config');
        
        // 验证配置
        if (!config.imap || !config.imap.user || !config.imap.password) {
            console.error('❌ 错误: config.js 中的IMAP配置不完整');
            console.error('请检查 config.imap.user 和 config.imap.password 是否已设置\n');
            return null;
        }
        
        return config;
    } catch (error) {
        console.error('❌ 错误: 加载 config.js 失败:', error.message);
        return null;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 无限邮箱 IMAP 轮询工具（配置文件版本）🚀\n');

    // 加载配置文件
    const config = loadConfig();
    if (!config) {
        process.exit(1);
    }

    // 显示配置信息
    console.log('📋 当前配置:');
    console.log(`   IMAP服务器: ${config.imap.host}:${config.imap.port}`);
    console.log(`   IMAP账号: ${config.imap.user}`);
    console.log(`   邮箱域名: ${config.domain}`);
    console.log(`   重试次数: ${config.fetchRetry.times}`);
    console.log(`   重试间隔: ${config.fetchRetry.delay}ms\n`);

    // 1. 生成邮箱地址
    const randomPrefix = generateRandomPrefix();
    const generatedEmail = `${randomPrefix}@${config.domain}`;
    
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

    try {
        const emails = await imapPollerService.fetchEmailWithRetry(generatedEmail, {
            config: config,
            retryTimes: config.fetchRetry.times,
            retryDelay: config.fetchRetry.delay,
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
            console.log('  - config.js 中的 IMAP 配置是否无误。');
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

module.exports = { main, generateRandomPrefix, loadConfig };
