const express = require('express');
const cors = require('cors');
const config = require('../../shared/config');
const storage = require('../../shared/storage');

const app = express();
const PORT = config.services.authService.port;

app.use(cors());
app.use(express.json());

const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/otp/generate/:emailId', (req, res) => {
  try {
    const emailId = req.params.emailId;
    const emailData = storage.getEmail(emailId);

    if (!emailData) {
      return res.status(404).json({
        success: false,
        message: '邮箱不存在'
      });
    }

    const otp = generateOtpCode();
    const expiresAt = Date.now() + config.otp.ttl;

    const otpData = {
      otp,
      expiresAt,
      email: emailData.email
    };

    storage.setOtp(emailId, otpData);

    emailData.otp = otp;
    emailData.otpExpiresAt = expiresAt;
    storage.setEmail(emailId, emailData);

    res.json({
      success: true,
      otp,
      expiresAt,
      message: '验证码已生成，有效期5分钟'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/otp/:emailId', (req, res) => {
  try {
    const emailId = req.params.emailId;
    const otpData = storage.getOtp(emailId);

    if (!otpData) {
      return res.status(404).json({
        success: false,
        message: '验证码不存在或已过期'
      });
    }

    res.json({
      success: true,
      otp: otpData.otp,
      expiresAt: otpData.expiresAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/otp/verify/:emailId', (req, res) => {
  try {
    const emailId = req.params.emailId;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: '请提供验证码'
      });
    }

    const otpData = storage.getOtp(emailId);

    if (!otpData) {
      return res.status(404).json({
        success: false,
        message: '验证码不存在或已过期'
      });
    }

    if (Date.now() > otpData.expiresAt) {
      storage.deleteOtp(emailId);
      const emailData = storage.getEmail(emailId);
      if (emailData) {
        emailData.otp = null;
        emailData.otpExpiresAt = null;
        storage.setEmail(emailId, emailData);
      }
      return res.status(400).json({
        success: false,
        message: '验证码已过期'
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: '验证码错误'
      });
    }

    storage.deleteOtp(emailId);
    const emailData = storage.getEmail(emailId);
    if (emailData) {
      emailData.otp = null;
      emailData.otpExpiresAt = null;
      storage.setEmail(emailId, emailData);
    }

    res.json({
      success: true,
      message: '验证成功',
      redirectUrl: `/inbox.html?emailId=${emailId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.listen(PORT, () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
});

module.exports = app;
