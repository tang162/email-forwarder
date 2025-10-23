<template>
  <div class="status">
    <div class="card">
      <h2>📊 系统状态</h2>
      
      <div v-if="loading" class="loading">加载中...</div>
      
      <div v-else-if="status" class="status-grid">
        <div class="status-item">
          <div class="status-icon" :class="status.smtp ? 'status-ok' : 'status-error'">
            {{ status.smtp ? '✓' : '✗' }}
          </div>
          <div class="status-info">
            <h3>SMTP服务</h3>
            <p>{{ status.smtp ? '连接正常' : '连接失败' }}</p>
          </div>
        </div>

        <div class="status-item">
          <div class="status-icon" :class="status.imap ? 'status-ok' : 'status-error'">
            {{ status.imap ? '✓' : '✗' }}
          </div>
          <div class="status-info">
            <h3>IMAP服务</h3>
            <p>{{ status.imap ? '连接正常' : '连接失败' }}</p>
          </div>
        </div>

        <div class="status-item">
          <div class="status-icon status-info-icon">📧</div>
          <div class="status-info">
            <h3>邮箱总数</h3>
            <p class="status-number">{{ status.totalEmails }}</p>
          </div>
        </div>

        <div class="status-item">
          <div class="status-icon status-info-icon">📬</div>
          <div class="status-info">
            <h3>邮件总数</h3>
            <p class="status-number">{{ status.totalMessages }}</p>
          </div>
        </div>
      </div>

      <button @click="refreshStatus" class="btn" style="margin-top: 2rem;" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新状态' }}
      </button>
    </div>

    <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { statusApi } from '../services/api'

export default {
  name: 'Status',
  setup() {
    const status = ref(null)
    const loading = ref(false)
    const message = ref(null)

    const loadStatus = async () => {
      loading.value = true
      message.value = null
      try {
        const response = await statusApi.getStatus()
        if (response.data.success) {
          status.value = response.data.status
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: '加载状态失败: ' + error.message
        }
      } finally {
        loading.value = false
      }
    }

    const refreshStatus = () => {
      loadStatus()
    }

    onMounted(() => {
      loadStatus()
    })

    return {
      status,
      loading,
      message,
      refreshStatus
    }
  }
}
</script>

<style scoped>
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.status-ok {
  background: #d4edda;
  color: #28a745;
}

.status-error {
  background: #f8d7da;
  color: #dc3545;
}

.status-info-icon {
  background: #d1ecf1;
  font-size: 1.5rem;
}

.status-info h3 {
  color: #333;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.status-info p {
  color: #666;
  font-size: 0.9rem;
}

.status-number {
  font-size: 2rem !important;
  font-weight: bold;
  color: #667eea !important;
}
</style>
