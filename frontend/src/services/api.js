import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const emailApi = {
  generateEmail() {
    return api.post('/generate-email')
  },
  
  getEmail(emailId) {
    return api.get(`/email/${emailId}`)
  },
  
  getAllEmails() {
    return api.get('/emails')
  },
  
  getInbox(emailId) {
    return api.get(`/inbox/${emailId}`)
  },
  
  sendTestEmail(data) {
    return api.post('/send-test-email', data)
  },
  
  generateOtp(emailId) {
    return api.post(`/email/${emailId}/otp`)
  },
  
  verifyOtp(emailId, otp) {
    return api.post(`/email/${emailId}/otp/verify`, { otp })
  },
  
  getOtp(emailId) {
    return api.get(`/email/${emailId}/otp`)
  }
}

export const configApi = {
  getConfig() {
    return api.get('/config')
  },
  
  saveConfig(config) {
    return api.post('/config', config)
  },
  
  testImap(config) {
    return api.post('/test-imap', config)
  }
}

export const statusApi = {
  getStatus() {
    return api.get('/status')
  }
}

export default api
