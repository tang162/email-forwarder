const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Email Generator', path: './microservices/email-generator/index.js' },
  { name: 'Email Sender', path: './microservices/email-sender/index.js' },
  { name: 'Email Receiver', path: './microservices/email-receiver/index.js' },
  { name: 'Config Service', path: './microservices/config-service/index.js' },
  { name: 'Auth Service', path: './microservices/auth-service/index.js' },
  { name: 'API Gateway', path: './microservices/api-gateway/index.js' }
];

const processes = [];

console.log('🚀 Starting microservices...\n');

services.forEach(service => {
  const proc = spawn('node', [service.path], {
    stdio: 'inherit',
    cwd: __dirname
  });

  proc.on('error', (error) => {
    console.error(`❌ [${service.name}] Error:`, error);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.log(`❌ [${service.name}] Exited with code ${code}`);
    }
  });

  processes.push(proc);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...');
  processes.forEach(proc => proc.kill());
  process.exit();
});

process.on('SIGTERM', () => {
  processes.forEach(proc => proc.kill());
  process.exit();
});

console.log(`\n✅ All services started!`);
console.log(`\n📝 Access the application at: http://localhost:3000`);
console.log(`\n💡 Press Ctrl+C to stop all services\n`);
