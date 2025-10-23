<template>
  <div class="home">
    <div class="card">
      <h2>🎯 生成临时邮箱</h2>
      <p style="color: #666; margin-bottom: 1.5rem;">
        点击下方按钮生成一个临时邮箱地址，可用于接收验证码和邮件
      </p>
      <button @click="generateEmail" class="btn" :disabled="generating">
        {{ generating ? '生成中...' : '生成新邮箱' }}
      </button>
    </div>

    <div v-if="emails.length > 0" class="card">
      <h2>📬 我的邮箱列表</h2>
      <div class="email-list">
        <div v-for="email in emails" :key="email.id" class="email-item">
          <div class="email-info">
            <div class="email-address">
              <strong>{{ email.email }}</strong>
              <button @click="copyToClipboard(email.email)" class="btn-copy">复制</button>
            </div>
            <div class="email-meta">
              <span>创建时间: {{ formatDate(email.created) }}</span>
              <span v-if="email.otp" class="otp-badge">
                验证码: <strong>{{ email.otp }}</strong>
                <small>({{ getOtpStatus(email.otpExpiresAt) }})</small>
              </span>
            </div>
          </div>
          <div class="email-actions">
            <button @click="refreshOtp(email.id)" class="btn btn-secondary">
              刷新验证码
            </button>
            <button @click="goToInbox(email.id)" class="btn btn-success">
              查看收件箱
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📧 发送测试邮件</h2>
      <form @submit.prevent="sendTestEmail">
        <div class="input-group">
          <label>收件邮箱</label>
          <input 
            v-model="testEmail.to" 
            type="email" 
            placeholder="输入邮箱地址"
            required
          />
        </div>
        <div class="input-group">
          <label>邮件主题</label>
          <input 
            v-model="testEmail.subject" 
            type="text" 
            placeholder="输入邮件主题"
            required
          />
        </div>
        <div class="input-group">
          <label>邮件内容</label>
          <textarea 
            v-model="testEmail.content" 
            rows="4" 
            placeholder="输入邮件内容"
            required
          ></textarea>
        </div>
        <button type="submit" class="btn" :disabled="sending">
          {{ sending ? '发送中...' : '发送测试邮件' }}
        </button>
      </form>
    </div>

    <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { emailApi } from '../services/api'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const emails = ref([])
    const generating = ref(false)
    const sending = ref(false)
    const message = ref(null)
    const testEmail = ref({
      to: '',
      subject: '',
      content: ''
    })

    const loadEmails = async () => {
      try {
        const response = await emailApi.getAllEmails()
        emails.value = response.data.emails
      } catch (error) {
        console.error('加载邮箱列表失败:', error)
      }
    }

    const generateEmail = async () => {
      generating.value = true
      message.value = null
      try {
        const response = await emailApi.generateEmail()
        if (response.data.success) {
          message.value = {
            type: 'success',
            text: `邮箱生成成功: ${response.data.emailAddress}`
          }
          await loadEmails()
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: '生成邮箱失败: ' + error.message
        }
      } finally {
        generating.value = false
      }
    }

    const sendTestEmail = async () => {
      sending.value = true
      message.value = null
      try {
        const response = await emailApi.sendTestEmail({
          toEmail: testEmail.value.to,
          subject: testEmail.value.subject,
          content: testEmail.value.content
        })
        if (response.data.success) {
          message.value = {
            type: 'success',
            text: '邮件发送成功！'
          }
          testEmail.value = { to: '', subject: '', content: '' }
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: '邮件发送失败: ' + error.message
        }
      } finally {
        sending.value = false
      }
    }

    const refreshOtp = async (emailId) => {
      try {
        const response = await emailApi.generateOtp(emailId)
        if (response.data.success) {
          message.value = {
            type: 'success',
            text: '验证码已刷新'
          }
          await loadEmails()
        }
      } catch (error) {
        message.value = {
          type: 'error',
          text: '刷新验证码失败: ' + error.message
        }
      }
    }

    const goToInbox = (emailId) => {
      router.push(`/inbox/${emailId}`)
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

    const getOtpStatus = (expiresAt) => {
      if (!expiresAt) return '已过期'
      const remaining = Math.floor((expiresAt - Date.now()) / 1000)
      if (remaining <= 0) return '已过期'
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      return `${minutes}分${seconds}秒后过期`
    }

    onMounted(() => {
      loadEmails()
      setInterval(() => {
        if (emails.value.some(e => e.otp)) {
          loadEmails()
        }
      }, 1000)
    })

    return {
      emails,
      generating,
      sending,
      message,
      testEmail,
      generateEmail,
      sendTestEmail,
      refreshOtp,
      goToInbox,
      copyToClipboard,
      formatDate,
      getOtpStatus
    }
  }
}
</script>

<style scoped>
.email-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.email-item {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: border-color 0.3s;
}

.email-item:hover {
  border-color: #667eea;
}

.email-info {
  margin-bottom: 1rem;
}

.email-address {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.email-address strong {
  color: #333;
  font-size: 1.1rem;
}

.btn-copy {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-copy:hover {
  background: #5a6268;
}

.email-meta {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.otp-badge {
  background: #fff3cd;
  color: #856404;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #ffeeba;
}

.otp-badge strong {
  color: #d39e00;
  font-size: 1.1rem;
}

.email-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.email-actions .btn {
  flex: 1;
  min-width: 120px;
}
</style>
