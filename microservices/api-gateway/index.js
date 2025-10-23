const express = require('express');
const cors = require('cors');
const axios = require('axios');
const config = require('../../shared/config');
const storage = require('../../shared/storage');

const app = express();
const PORT = config.services.apiGateway.port;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend/dist'));

const serviceUrl = (serviceName) => {
  const service = config.services[serviceName];
  return `http://${service.host}:${service.port}`;
};

const forwardRequest = async (service, path, method = 'get', data = null) => {
  const url = `${serviceUrl(service)}${path}`;
  try {
    const response = await axios({ method, url, data });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: error.message };
  }
};

app.post('/api/generate-email', async (req, res) => {
  try {
    const result = await forwardRequest('emailGenerator', '/generate', 'post');
    
    if (result.success) {
      const otpResult = await forwardRequest('authService', `/otp/generate/${result.emailId}`, 'post');
      result.otp = otpResult.otp;
      result.otpExpiresAt = otpResult.expiresAt;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/email/:emailId', async (req, res) => {
  try {
    const result = await forwardRequest('emailGenerator', `/email/${req.params.emailId}`);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/emails', async (req, res) => {
  try {
    const result = await forwardRequest('emailGenerator', '/emails');
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/send-test-email', async (req, res) => {
  try {
    const result = await forwardRequest('emailSender', '/send', 'post', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/inbox/:emailId', async (req, res) => {
  try {
    const result = await forwardRequest('emailReceiver', `/inbox/${req.params.emailId}`);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.post('/api/email/:emailId/otp', async (req, res) => {
  try {
    const result = await forwardRequest('authService', `/otp/generate/${req.params.emailId}`, 'post');
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/email/:emailId/otp', async (req, res) => {
  try {
    const result = await forwardRequest('authService', `/otp/${req.params.emailId}`);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.post('/api/email/:emailId/otp/verify', async (req, res) => {
  try {
    const result = await forwardRequest('authService', `/otp/verify/${req.params.emailId}`, 'post', req.body);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const result = await forwardRequest('configService', '/config');
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const result = await forwardRequest('configService', '/config', 'post', req.body);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.post('/api/test-imap', async (req, res) => {
  try {
    const result = await forwardRequest('configService', '/test-imap', 'post', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const smtpStatus = await forwardRequest('emailSender', '/verify');
    
    let imapStatus = { connected: false };
    const manualImapConfig = storage.getImapConfig();
    const hasImapConfig = manualImapConfig || (config.imap.user && config.imap.pass);
    
    if (hasImapConfig) {
      try {
        const testConfig = manualImapConfig || {
          host: config.imap.host,
          port: config.imap.port,
          user: config.imap.user,
          password: config.imap.pass
        };
        
        imapStatus = await forwardRequest('configService', '/test-imap', 'post', testConfig);
      } catch (error) {
        console.warn('[API Gateway] IMAP status check failed');
      }
    }

    const emails = await forwardRequest('emailGenerator', '/emails');
    
    let totalMessages = 0;
    if (emails.success && emails.emails) {
      emails.emails.forEach(email => {
        totalMessages += email.messages?.length || 0;
      });
    }

    res.json({
      success: true,
      status: {
        smtp: smtpStatus.connected || false,
        imap: imapStatus.success || false,
        totalEmails: emails.emails?.length || 0,
        totalMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取状态失败'
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const services = ['emailGenerator', 'emailSender', 'emailReceiver', 'configService', 'authService'];
    const health = {};
    
    for (const service of services) {
      try {
        await forwardRequest(service, '/health');
        health[service] = 'ok';
      } catch (error) {
        health[service] = 'error';
      }
    }
    
    res.json({
      success: true,
      services: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'frontend/dist' });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
  console.log(`Frontend will be served from: frontend/dist`);
});

module.exports = app;
