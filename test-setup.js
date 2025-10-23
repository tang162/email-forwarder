#!/usr/bin/env node

/**
 * Setup Verification Script
 * 测试微服务架构是否正确配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证微服务架构设置...\n');

const checks = [];

// 1. 检查必要文件
const requiredFiles = [
  'start-microservices.js',
  'docker-compose.yml',
  'shared/config.js',
  'shared/storage.js',
  'microservices/api-gateway/index.js',
  'microservices/email-generator/index.js',
  'microservices/email-sender/index.js',
  'microservices/email-receiver/index.js',
  'microservices/config-service/index.js',
  'microservices/auth-service/index.js',
  'frontend/src/App.vue',
  'frontend/src/main.js',
  'frontend/package.json',
  'frontend/vite.config.js'
];

console.log('📁 检查必要文件...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  checks.push({ name: file, status: exists });
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

// 2. 检查依赖
console.log('\n📦 检查依赖安装...');
const rootDeps = fs.existsSync(path.join(__dirname, 'node_modules'));
const frontendDeps = fs.existsSync(path.join(__dirname, 'frontend/node_modules'));

checks.push({ name: 'Root dependencies', status: rootDeps });
checks.push({ name: 'Frontend dependencies', status: frontendDeps });

console.log(`  ${rootDeps ? '✓' : '✗'} 根目录依赖`);
console.log(`  ${frontendDeps ? '✓' : '✗'} 前端依赖`);

if (!rootDeps) {
  console.log('    ⚠️  请运行: npm install');
}
if (!frontendDeps) {
  console.log('    ⚠️  请运行: cd frontend && npm install');
}

// 3. 检查前端构建产物
console.log('\n🏗️  检查前端构建...');
const frontendBuild = fs.existsSync(path.join(__dirname, 'frontend/dist'));
checks.push({ name: 'Frontend build', status: frontendBuild });

console.log(`  ${frontendBuild ? '✓' : '⚠️ '} 前端构建产物`);
if (!frontendBuild) {
  console.log('    ℹ️  开发模式无需构建，生产模式请运行: npm run frontend:build');
}

// 4. 检查环境变量
console.log('\n⚙️  检查配置文件...');
const envExists = fs.existsSync(path.join(__dirname, '.env'));
checks.push({ name: 'Environment file', status: envExists });

console.log(`  ${envExists ? '✓' : '⚠️ '} .env 文件`);
if (!envExists) {
  console.log('    ℹ️  可选配置，请运行: cp .env.example .env');
}

// 5. 检查文档
console.log('\n📚 检查文档...');
const docs = [
  'README-MICROSERVICES.md',
  'MICROSERVICES.md',
  'QUICKSTART.md',
  'DEPLOYMENT.md'
];

docs.forEach(doc => {
  const exists = fs.existsSync(path.join(__dirname, doc));
  checks.push({ name: doc, status: exists });
  console.log(`  ${exists ? '✓' : '✗'} ${doc}`);
});

// 总结
console.log('\n' + '='.repeat(60));
const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.status).length;
const percentage = Math.round((passedChecks / totalChecks) * 100);

console.log(`\n📊 验证结果: ${passedChecks}/${totalChecks} 项检查通过 (${percentage}%)\n`);

if (percentage === 100) {
  console.log('✅ 所有检查通过！可以开始使用了。\n');
  console.log('🚀 快速开始:');
  console.log('   开发模式:');
  console.log('     终端1: npm run microservices:dev');
  console.log('     终端2: npm run frontend:dev');
  console.log('     访问: http://localhost:5173\n');
  console.log('   生产模式:');
  console.log('     1. npm run frontend:build');
  console.log('     2. npm run microservices');
  console.log('     访问: http://localhost:3000\n');
} else if (percentage >= 80) {
  console.log('⚠️  部分检查未通过，但可以继续。\n');
  console.log('建议修复以下问题:');
  checks.filter(c => !c.status).forEach(c => {
    console.log(`  - ${c.name}`);
  });
  console.log();
} else {
  console.log('❌ 检查未通过，请先修复问题。\n');
  console.log('未通过的检查:');
  checks.filter(c => !c.status).forEach(c => {
    console.log(`  - ${c.name}`);
  });
  console.log('\n请参考 QUICKSTART.md 了解详细步骤。\n');
  process.exit(1);
}

// 显示可用命令
console.log('📝 可用命令:');
console.log('   npm run microservices       - 启动微服务');
console.log('   npm run microservices:dev   - 启动微服务（热重载）');
console.log('   npm run frontend:dev        - 启动Vue开发服务器');
console.log('   npm run frontend:build      - 构建生产版本');
console.log('   npm run docker:up           - Docker启动');
console.log('   npm start                   - 启动原版单体应用');
console.log();

console.log('📖 文档:');
console.log('   QUICKSTART.md              - 5分钟快速开始');
console.log('   README-MICROSERVICES.md    - 完整功能说明');
console.log('   MICROSERVICES.md           - 架构详解');
console.log('   DEPLOYMENT.md              - 部署指南');
console.log();
