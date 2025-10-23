<template>
  <div class="config">
    <div class="card">
      <h2>⚙️ IMAP配置</h2>
      <p style="color: #666; margin-bottom: 1.5rem;">
        配置IMAP设置以接收真实邮件
      </p>
      
      <form @submit.prevent="saveConfig">
        <div class="input-group">
          <label>IMAP服务器地址</label>
          <input 
            v-model="config.imap.host" 
            type="text" 
            placeholder="例如: imap.gmail.com"
            required
          />
        </div>

        <div class="input-group">
          <label>IMAP端口</label>
          <input 
            v-model.number="config.imap.port" 
            type="number" 
            placeholder="通常为 993"
            required
          />
        </div>

        <div class="input-group">
          <label>IMAP用户名</label>
          <input 
            v-model="config.imap.user" 
            type="email" 
            placeholder="your-email@gmail.com"
            required
          />
        </div>

        <div class="input-group">
          <label>IMAP密码</label>
          <input 
            v-model="config.imap.password" 
            type="password" 
            placeholder="应用专用密码"
          />
          <small style="color: #999;">留空则使用现有密码</small>
        </div>

        <div class="button-group">
          <button type="button" @click="testConnection" class="btn btn-secondary" :disabled="testing">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button type="submit" class="btn" :disabled="saving">
            {{ saving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>🔄 轮询配置</h2>
      <p style="color: #666; margin-bottom: 1.5rem;">
        配置邮件获取重试机制
      </p>

      <div class="input-group">
        <label>重试次数</label>
        <input 
          v-model.number="config.polling.times" 
          type="number" 
          min="1"
          max="50"
        />
      </div>

      <div class="input-group">
        <label>重试间隔（毫秒）</label>
        <input 
          v-model.number="config.polling.delay" 
          type="number" 
          min="1000"
          step="1000"
        />
      </div>
    </div>

    <div class="card">
      <h2>🌐 域名配置</h2>
      <p style="color: #666; margin-bottom: 1.5rem;">
        设置临时邮箱的域名
      </p>

      <div class="input-group">
        <label>邮箱域名</label>
        <input 
          v-model="config.domain" 
          type="text" 
          placeholder="tangtangs.cn"
        />
      </div>
    </div>

    <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
      {{ message.text }}
    </div>

    <div v-if="currentConfig" class="card config-info">
      <h3>📋 当前配置信息</h3>
      <div class="config-details">
        <div class="config-item">
          <strong>IMAP服务器:</strong> {{ currentConfig.imap.host }}:{{ currentConfig.imap.port }}
        </div>
        <div class="config-item">
          <strong>IMAP用户:</strong> {{ currentConfig.imap.user }}
        </div>
        <div class="config-item">
          <strong>配置来源:</strong> 
          <span :class="currentConfig.imap.source === 'manual' ? 'badge-manual' : 'badge-env'">
            {{ currentConfig.imap.source === 'manual' ? '手动配置' : '环境变量' }}
          </span>
        </div>
        <div class="config-item">
          <strong>轮询次数:</strong> {{ currentConfig.polling.times }}
        </div>
        <div class="config-item">
          <strong>轮询间隔:</strong> {{ currentConfig.polling.delay }}ms
        </div>
        <div class="config-item">
          <strong>邮箱域名:</strong> {{ currentConfig.domain }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { configApi } from '../services/api'

export default {
  name: 'Config',
  setup() {
    const config = ref({
      imap: {
        host: '',
        port: 993,
        user: '',
        password: ''
      },
      polling: {
        times: 10,
        delay: 5000
      },
      domain: 'tangtangs.cn'
    })

    const currentConfig = ref(null)
    const message = ref(null)
    const testing = ref(false)
    const saving = ref(false)

    const loadConfig = async () => {
      try {
        const response = await configApi.getConfig()
        if (response.data.success) {
          currentConfig.value = response.data.config
          config.value.imap.host = response.data.config.imap.host
          config.value.imap.port = response.data.config.imap.port
          config.value.imap.user = response.data.config.imap.user
          config.value.polling.times = response.data.config.polling.times
          config.value.polling.delay = response.data.config.polling.delay
          config.value.domain = response.data.config.domain
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }

    const testConnection = async () => {
      testing.value = true
      message.value = null
      try {
        const response = await configApi.testImap({
          host: config.value.imap.host,
          port: config.value.imap.port,
          user: config.value.imap.user,
          password: config.value.imap.password || undefined
        })
        if (response.data.success) {
          message.value = {
            type: 'success',
            text: '连接测试成功！'
          }
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: '连接测试失败: ' + (error.response?.data?.message || error.message)
        }
      } finally {
        testing.value = false
      }
    }

    const saveConfig = async () => {
      saving.value = true
      message.value = null
      try {
        const payload = {
          imap: {
            host: config.value.imap.host,
            port: config.value.imap.port,
            user: config.value.imap.user
          },
          polling: config.value.polling,
          domain: config.value.domain
        }

        if (config.value.imap.password) {
          payload.imap.password = config.value.imap.password
        }

        const response = await configApi.saveConfig(payload)
        if (response.data.success) {
          message.value = {
            type: 'success',
            text: '配置保存成功！'
          }
          await loadConfig()
          config.value.imap.password = ''
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: '保存配置失败: ' + (error.response?.data?.message || error.message)
        }
      } finally {
        saving.value = false
      }
    }

    onMounted(() => {
      loadConfig()
    })

    return {
      config,
      currentConfig,
      message,
      testing,
      saving,
      testConnection,
      saveConfig
    }
  }
}
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.button-group .btn {
  flex: 1;
}

.config-info {
  background: #f8f9fa;
}

.config-info h3 {
  color: #333;
  margin-bottom: 1rem;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-item {
  display: flex;
  gap: 0.5rem;
  color: #555;
}

.config-item strong {
  color: #333;
  min-width: 120px;
}

.badge-manual {
  background: #28a745;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.badge-env {
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>
