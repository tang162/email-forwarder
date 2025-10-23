<template>
  <div class="inbox">
    <div class="card">
      <div class="inbox-header">
        <h2>📬 收件箱</h2>
        <button @click="goBack" class="btn btn-secondary">返回</button>
      </div>
      
      <div v-if="emailData" class="email-info-bar">
        <div class="email-address">
          <strong>{{ emailData.email }}</strong>
          <button @click="copyToClipboard(emailData.email)" class="btn-copy">复制</button>
        </div>
        <button @click="refreshInbox" class="btn" :disabled="loading">
          {{ loading ? '刷新中...' : '刷新收件箱' }}
        </button>
      </div>

      <div v-if="needsVerification" class="verification-section">
        <h3>🔒 需要验证码访问</h3>
        <p>请输入6位数字验证码以访问此邮箱</p>
        <div class="input-group">
          <input 
            v-model="otpInput" 
            type="text" 
            placeholder="输入验证码"
            maxlength="6"
            @keyup.enter="verifyOtp"
          />
          <button @click="verifyOtp" class="btn" :disabled="otpInput.length !== 6">
            验证
          </button>
        </div>
      </div>

      <div v-else-if="loading && messages.length === 0" class="loading">
        加载中...
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <p>📭 暂无邮件</p>
        <p style="color: #999; font-size: 0.9rem;">发送邮件到此地址后点击刷新按钮查看</p>
      </div>

      <div v-else class="message-list">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          class="message-item"
          @click="selectMessage(index)"
          :class="{ active: selectedIndex === index }"
        >
          <div class="message-header">
            <div class="message-from">
              <strong>{{ msg.from }}</strong>
            </div>
            <div class="message-date">{{ formatDate(msg.date) }}</div>
          </div>
          <div class="message-subject">{{ msg.subject }}</div>
          <div v-if="selectedIndex === index" class="message-body">
            <div v-if="msg.html" v-html="msg.html"></div>
            <div v-else class="text-content">{{ msg.text }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { emailApi } from '../services/api'

export default {
  name: 'Inbox',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const emailId = route.params.emailId
    
    const emailData = ref(null)
    const messages = ref([])
    const loading = ref(false)
    const message = ref(null)
    const selectedIndex = ref(null)
    const needsVerification = ref(false)
    const otpInput = ref('')

    const loadEmailData = async () => {
      try {
        const response = await emailApi.getEmail(emailId)
        if (response.data.success) {
          emailData.value = response.data.data
        }
      } catch (error) {
        console.error('加载邮箱信息失败:', error)
      }
    }

    const refreshInbox = async () => {
      loading.value = true
      message.value = null
      try {
        const response = await emailApi.getInbox(emailId)
        if (response.data.success) {
          messages.value = response.data.messages
          message.value = {
            type: 'success',
            text: `已刷新，共 ${messages.value.length} 封邮件`
          }
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          needsVerification.value = true
          message.value = {
            type: 'error',
            text: '需要验证码访问'
          }
        } else {
          message.value = {
            type: 'error',
            text: '刷新失败: ' + error.message
          }
        }
      } finally {
        loading.value = false
      }
    }

    const verifyOtp = async () => {
      try {
        const response = await emailApi.verifyOtp(emailId, otpInput.value)
        if (response.data.success) {
          needsVerification.value = false
          message.value = {
            type: 'success',
            text: '验证成功'
          }
          await refreshInbox()
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: error.response?.data?.message || '验证失败'
        }
      }
    }

    const selectMessage = (index) => {
      selectedIndex.value = selectedIndex.value === index ? null : index
    }

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        message.value = {
          type: 'success',
          text: '已复制到剪贴板'
        }
        setTimeout(() => {
          message.value = null
        }, 2000)
      } catch (error) {
        message.value = {
          type: 'error',
          text: '复制失败'
        }
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString('zh-CN')
    }

    const goBack = () => {
      router.push('/')
    }

    onMounted(async () => {
      await loadEmailData()
      await refreshInbox()
    })

    return {
      emailData,
      messages,
      loading,
      message,
      selectedIndex,
      needsVerification,
      otpInput,
      refreshInbox,
      verifyOtp,
      selectMessage,
      copyToClipboard,
      formatDate,
      goBack
    }
  }
}
</script>

<style scoped>
.inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.email-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.email-address {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.email-address strong {
  color: #333;
  font-size: 1.1rem;
}

.btn-copy {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-copy:hover {
  background: #5a6268;
}

.verification-section {
  text-align: center;
  padding: 2rem;
}

.verification-section h3 {
  color: #333;
  margin-bottom: 1rem;
}

.verification-section .input-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  max-width: 400px;
  margin: 1.5rem auto 0;
}

.verification-section input {
  flex: 1;
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state p:first-child {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-item {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.message-item:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.message-item.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-from strong {
  color: #333;
  font-size: 1.05rem;
}

.message-date {
  color: #999;
  font-size: 0.875rem;
}

.message-subject {
  color: #555;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.message-body {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.text-content {
  white-space: pre-wrap;
  color: #333;
  line-height: 1.6;
}
</style>
