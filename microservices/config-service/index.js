const express = require('express');
const cors = require('cors');
const config = require('../../shared/config');
const storage = require('../../shared/storage');
const imapPollerService = require('../../services/imapPollerService');

const app = express();
const PORT = config.services.configService.port;

app.use(cors());
app.use(express.json());

app.get('/config', (req, res) => {
  try {
    const manualImapConfig = storage.getImapConfig();
    const manualPollingConfig = storage.getPollingConfig();
    const manualDomain = storage.getDomain();

    const imapConfig = manualImapConfig || {
      host: config.imap.host,
      port: config.imap.port,
      user: config.imap.user,
      password: config.imap.pass
    };

    const pollingConfig = manualPollingConfig || {
      times: config.imap.retryTimes,
      delay: config.imap.retryDelay
    };

    res.json({
      success: true,
      config: {
        domain: manualDomain || config.email.domain,
        imap: {
          host: imapConfig.host,
          port: imapConfig.port,
          user: imapConfig.user,
          hasPassword: !!imapConfig.password,
          tls: true,
          source: manualImapConfig ? 'manual' : 'env'
        },
        smtp: {
          host: config.smtp.host,
          port: config.smtp.port,
          user: config.smtp.user
        },
        polling: {
          times: pollingConfig.times,
          delay: pollingConfig.delay,
          source: manualPollingConfig ? 'manual' : 'env'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/config', (req, res) => {
  try {
    const { imap, polling, domain } = req.body;

    if (!imap || !imap.host || !imap.port || !imap.user) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的IMAP配置信息'
      });
    }

    const newImapConfig = {
      host: imap.host,
      port: parseInt(imap.port, 10),
      user: imap.user
    };

    const existingConfig = storage.getImapConfig();
    if (imap.password) {
      newImapConfig.password = imap.password;
    } else if (existingConfig?.password) {
      newImapConfig.password = existingConfig.password;
    } else if (config.imap.pass) {
      newImapConfig.password = config.imap.pass;
    } else {
      return res.status(400).json({
        success: false,
        message: '请提供IMAP密码'
      });
    }

    storage.setImapConfig(newImapConfig);

    if (polling) {
      storage.setPollingConfig({
        times: parseInt(polling.times, 10) || 10,
        delay: parseInt(polling.delay, 10) || 5000
      });
    }

    if (domain) {
      storage.setDomain(domain);
    }

    res.json({
      success: true,
      message: '配置已保存'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/test-imap', async (req, res) => {
  try {
    const { host, port, user, password } = req.body;

    if (!host || !port || !user || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的IMAP配置信息'
      });
    }

    const testConfig = {
      imap: {
        host,
        port: parseInt(port, 10),
        user,
        password,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    const result = await imapPollerService.testConnection(testConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '连接测试失败: ' + error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'config-service' });
});

app.listen(PORT, () => {
  console.log(`[Config Service] Running on port ${PORT}`);
});

module.exports = app;
