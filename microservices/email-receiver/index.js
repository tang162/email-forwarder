const express = require('express');
const cors = require('cors');
const config = require('../../shared/config');
const storage = require('../../shared/storage');
const imapPollerService = require('../../services/imapPollerService');

const app = express();
const PORT = config.services.emailReceiver.port;

app.use(cors());
app.use(express.json());

app.get('/inbox/:emailId', async (req, res) => {
  try {
    const emailId = req.params.emailId;
    const emailData = storage.getEmail(emailId);

    if (!emailData) {
      return res.status(404).json({
        success: false,
        message: '邮箱不存在'
      });
    }

    let messages = [];
    const manualImapConfig = storage.getImapConfig();
    const manualPollingConfig = storage.getPollingConfig();
    
    const hasImapConfig = manualImapConfig || (config.imap.user && config.imap.pass);

    if (hasImapConfig) {
      try {
        if (manualImapConfig) {
          const imapConfig = {
            imap: {
              ...manualImapConfig,
              tls: true,
              tlsOptions: { rejectUnauthorized: false }
            }
          };

          if (manualPollingConfig) {
            imapConfig.fetchRetry = manualPollingConfig;
          }

          messages = await imapPollerService.getEmails(emailData.email, {
            config: imapConfig,
            markAsSeen: true
          });
        } else {
          messages = await imapPollerService.getEmails(emailData.email);
        }
      } catch (imapError) {
        console.warn('[Email Receiver] IMAP获取失败:', imapError.message);
      }
    }

    emailData.messages = messages;
    storage.setEmail(emailId, emailData);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取邮件失败',
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-receiver' });
});

app.listen(PORT, () => {
  console.log(`[Email Receiver] Running on port ${PORT}`);
});

module.exports = app;
