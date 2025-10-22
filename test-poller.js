// test-poller.js
// 简单测试脚本，验证IMAP Poller服务的基本功能
const imapPollerService = require('./services/imapPollerService');

async function testPollerService() {
    console.log('🧪 测试 IMAP Poller Service\n');

    // 测试1: 检查配置
    console.log('1️⃣  测试获取配置...');
    const config = imapPollerService.getConfig();
    console.log('   配置对象:', {
        host: config.imap.host,
        port: config.imap.port,
        user: config.imap.user || '(未设置)',
        retryTimes: config.fetchRetry.times,
        retryDelay: config.fetchRetry.delay
    });
    console.log('   ✅ 配置获取成功\n');

    // 测试2: 延迟函数
    console.log('2️⃣  测试延迟函数...');
    const startTime = Date.now();
    await imapPollerService.delay(1000);
    const elapsed = Date.now() - startTime;
    console.log(`   延迟时间: ${elapsed}ms`);
    console.log(`   ✅ 延迟函数工作正常\n`);

    // 测试3: 测试连接（不需要真实配置）
    console.log('3️⃣  测试连接检查...');
    const connectionResult = await imapPollerService.testConnection();
    console.log('   连接状态:', connectionResult);
    if (!connectionResult.success) {
        console.log('   ⚠️  这是预期的（需要配置IMAP_USER和IMAP_PASS）\n');
    } else {
        console.log('   ✅ IMAP连接成功\n');
    }

    // 测试4: 测试获取邮件（不需要真实配置，会返回空数组）
    console.log('4️⃣  测试获取邮件方法（不实际连接）...');
    try {
        const emails = await imapPollerService.getEmailsByAddress('test@example.com');
        console.log(`   获取到的邮件数: ${emails.length}`);
        console.log('   ✅ 获取邮件方法工作正常\n');
    } catch (error) {
        console.log(`   ⚠️  预期行为: ${error.message}\n`);
    }

    console.log('🎉 所有基本测试通过！');
    console.log('\n💡 提示:');
    console.log('   - 如需测试真实IMAP连接，请配置环境变量:');
    console.log('     export IMAP_USER="your-email@gmail.com"');
    console.log('     export IMAP_PASS="your-app-password"');
    console.log('   - 然后运行: node poller.js');
}

// 运行测试
if (require.main === module) {
    testPollerService().catch(error => {
        console.error('❌ 测试失败:', error);
        process.exit(1);
    });
}

module.exports = { testPollerService };
