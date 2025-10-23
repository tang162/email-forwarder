const express = require('express');
const cors = require('cors');
const config = require('../../shared/config');
const emailService = require('../../services/emailService');

const app = express();
const PORT = config.services.emailSender.port;

app.use(cors());
app.use(express.json());

app.post('/send', async (req, res) => {
  try {
    const { toEmail, subject, content } = req.body;

    if (!toEmail || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const result = await emailService.sendTestEmail(toEmail, subject, content);
    
    res.json({
      success: true,
      message: '邮件发送成功',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '邮件发送失败',
      error: error.message
    });
  }
});

app.get('/verify', async (req, res) => {
  try {
    const status = await emailService.verifyConnection();
    res.json({
      success: true,
      connected: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-sender' });
});

app.listen(PORT, () => {
  console.log(`[Email Sender] Running on port ${PORT}`);
});

module.exports = app;
