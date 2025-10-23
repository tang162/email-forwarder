# 部署指南

## 📦 部署方式

本项目支持多种部署方式，选择最适合你的方式。

## 方式一：单服务器部署

### 适用场景
- 小型应用
- 开发/测试环境
- 单机部署

### 步骤

#### 1. 准备环境
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 克隆项目
git clone <your-repo>
cd <project-folder>
```

#### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

#### 3. 配置环境
```bash
cp .env.example .env
# 编辑.env文件，配置SMTP和IMAP
nano .env
```

#### 4. 构建前端
```bash
npm run frontend:build
```

#### 5. 使用PM2启动（推荐）
```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'email-generator',
      script: './microservices/email-generator/index.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'email-sender',
      script: './microservices/email-sender/index.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'email-receiver',
      script: './microservices/email-receiver/index.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'config-service',
      script: './microservices/config-service/index.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'auth-service',
      script: './microservices/auth-service/index.js',
      instances: 1,
      autorestart: true
    },
    {
      name: 'api-gateway',
      script: './microservices/api-gateway/index.js',
      instances: 2,
      autorestart: true
    }
  ]
}
EOF

# 启动所有服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 6. 配置Nginx（可选）
```bash
# 安装Nginx
sudo apt-get install nginx

# 创建Nginx配置
sudo nano /etc/nginx/sites-available/email-catcher

# 添加以下内容：
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/email-catcher /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 方式二：Docker部署

### 适用场景
- 需要容器化
- 多环境部署
- 易于扩展

### 步骤

#### 1. 安装Docker和Docker Compose
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo apt-get install docker-compose-plugin
```

#### 2. 准备项目
```bash
# 克隆项目
git clone <your-repo>
cd <project-folder>

# 配置环境变量
cp .env.example .env
nano .env
```

#### 3. 构建前端
```bash
cd frontend
npm install
npm run build
cd ..
```

#### 4. 启动服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps
```

#### 5. 管理服务
```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看特定服务日志
docker-compose logs -f api-gateway

# 扩展服务
docker-compose up -d --scale email-receiver=3
```

## 方式三：Kubernetes部署

### 适用场景
- 大规模部署
- 需要自动扩展
- 高可用需求

### 步骤

#### 1. 创建命名空间
```bash
kubectl create namespace email-catcher
```

#### 2. 创建ConfigMap
```yaml
# config-map.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: email-catcher-config
  namespace: email-catcher
data:
  EMAIL_DOMAIN: "tangtangs.cn"
  API_GATEWAY_PORT: "3000"
  EMAIL_GENERATOR_PORT: "3001"
  EMAIL_SENDER_PORT: "3002"
  EMAIL_RECEIVER_PORT: "3003"
  CONFIG_SERVICE_PORT: "3004"
  AUTH_SERVICE_PORT: "3005"
```

#### 3. 创建Secret
```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: email-catcher-secret
  namespace: email-catcher
type: Opaque
stringData:
  SMTP_HOST: "smtp.gmail.com"
  SMTP_PORT: "587"
  SMTP_USER: "your-email@gmail.com"
  SMTP_PASS: "your-app-password"
  IMAP_HOST: "imap.gmail.com"
  IMAP_PORT: "993"
  IMAP_USER: "your-email@gmail.com"
  IMAP_PASS: "your-app-password"
```

#### 4. 创建Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: email-catcher
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: your-registry/email-catcher-gateway:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: email-catcher-config
        - secretRef:
            name: email-catcher-secret
---
# 类似地为其他服务创建Deployment
```

#### 5. 创建Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: email-catcher
spec:
  selector:
    app: api-gateway
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

#### 6. 部署
```bash
kubectl apply -f config-map.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## 方式四：云平台部署

### AWS

#### 使用ECS Fargate
```bash
# 1. 创建ECR仓库
aws ecr create-repository --repository-name email-catcher

# 2. 构建并推送镜像
aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>
docker build -f Dockerfile.gateway -t email-catcher-gateway .
docker tag email-catcher-gateway:latest <ecr-url>/email-catcher:gateway
docker push <ecr-url>/email-catcher:gateway

# 3. 创建ECS集群和任务定义
# 使用AWS Console或CloudFormation
```

### Google Cloud

#### 使用Cloud Run
```bash
# 1. 构建镜像
gcloud builds submit --tag gcr.io/[PROJECT_ID]/email-catcher

# 2. 部署
gcloud run deploy email-catcher \
  --image gcr.io/[PROJECT_ID]/email-catcher \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure

#### 使用Azure Container Instances
```bash
# 1. 创建资源组
az group create --name email-catcher-rg --location eastus

# 2. 创建容器实例
az container create \
  --resource-group email-catcher-rg \
  --name email-catcher \
  --image <your-registry>/email-catcher:latest \
  --dns-name-label email-catcher \
  --ports 3000
```

## 生产环境建议

### 1. 使用外部存储
当前使用内存存储，生产环境建议使用：

```javascript
// 使用Redis
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// 替换storage.js的实现
module.exports = {
  setEmail: async (id, data) => {
    await redis.set(`email:${id}`, JSON.stringify(data));
  },
  getEmail: async (id) => {
    const data = await redis.get(`email:${id}`);
    return data ? JSON.parse(data) : null;
  }
  // ... 其他方法
};
```

### 2. 添加负载均衡
```nginx
upstream api_gateway {
    least_conn;
    server 10.0.1.1:3000 weight=3;
    server 10.0.1.2:3000 weight=2;
    server 10.0.1.3:3000 weight=1;
}

server {
    listen 80;
    location / {
        proxy_pass http://api_gateway;
        proxy_next_upstream error timeout invalid_header http_500;
    }
}
```

### 3. 配置HTTPS
```bash
# 使用Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. 监控和日志

#### 使用Prometheus + Grafana
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

#### 集中式日志（ELK Stack）
```yaml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### 5. 自动扩展

#### Kubernetes HPA
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 6. 备份策略
```bash
#!/bin/bash
# backup.sh

# 备份Redis数据
redis-cli --rdb /backup/redis-$(date +%Y%m%d).rdb

# 备份配置
tar -czf /backup/config-$(date +%Y%m%d).tar.gz /app/.env

# 清理旧备份（保留7天）
find /backup -name "*.rdb" -mtime +7 -delete
find /backup -name "*.tar.gz" -mtime +7 -delete
```

### 7. 安全加固

```bash
# 1. 使用防火墙
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# 2. 配置fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban

# 3. 定期更新
sudo apt-get update && sudo apt-get upgrade -y
```

## 性能优化

### 1. 启用缓存
```javascript
// 在API Gateway添加缓存
const cache = new Map();
app.get('/api/emails', async (req, res) => {
  const cached = cache.get('emails');
  if (cached && Date.now() - cached.time < 5000) {
    return res.json(cached.data);
  }
  const result = await forwardRequest('emailGenerator', '/emails');
  cache.set('emails', { data: result, time: Date.now() });
  res.json(result);
});
```

### 2. 数据库连接池
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 3. 压缩响应
```javascript
const compression = require('compression');
app.use(compression());
```

## 故障排除

### 服务无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 查看PM2日志
pm2 logs

# 查看Docker日志
docker-compose logs -f
```

### 性能问题
```bash
# 检查CPU和内存
top
htop

# 检查网络
netstat -an | grep ESTABLISHED | wc -l

# 检查磁盘IO
iostat -x 1
```

### 内存泄漏
```bash
# 使用heapdump分析
npm install heapdump
node --expose-gc app.js

# 或使用clinic
npm install -g clinic
clinic doctor -- node app.js
```

## 回滚策略

### PM2回滚
```bash
# 查看历史版本
pm2 list
pm2 describe <app-name>

# 回滚到上一个版本
pm2 reload ecosystem.config.js --update-env
```

### Docker回滚
```bash
# 使用之前的镜像
docker-compose down
docker-compose up -d --force-recreate
```

### Kubernetes回滚
```bash
# 查看版本历史
kubectl rollout history deployment/api-gateway

# 回滚到上一个版本
kubectl rollout undo deployment/api-gateway

# 回滚到指定版本
kubectl rollout undo deployment/api-gateway --to-revision=2
```

## 维护检查清单

### 日常
- [ ] 查看错误日志
- [ ] 检查服务健康状态
- [ ] 监控CPU/内存使用

### 每周
- [ ] 检查磁盘空间
- [ ] 审查安全日志
- [ ] 更新依赖包

### 每月
- [ ] 系统更新
- [ ] 备份验证
- [ ] 性能评估
- [ ] 安全审计

## 联系支持

如有部署问题，请提交Issue或联系技术支持。
