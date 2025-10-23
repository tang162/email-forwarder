const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('../../shared/config');
const storage = require('../../shared/storage');

const app = express();
const PORT = config.services.emailGenerator.port;

app.use(cors());
app.use(express.json());

app.post('/generate', (req, res) => {
  try {
    const emailId = uuidv4().replace(/-/g, '').substring(0, 10);
    const domain = storage.getDomain() || config.email.domain;
    const emailAddress = `${emailId}@${domain}`;

    const emailData = {
      email: emailAddress,
      created: new Date(),
      messages: []
    };

    storage.setEmail(emailId, emailData);

    res.json({
      success: true,
      emailId,
      emailAddress,
      created: emailData.created
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/email/:emailId', (req, res) => {
  try {
    const emailId = req.params.emailId;
    const emailData = storage.getEmail(emailId);

    if (!emailData) {
      return res.status(404).json({
        success: false,
        message: '邮箱不存在'
      });
    }

    res.json({
      success: true,
      data: emailData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/emails', (req, res) => {
  try {
    const emails = storage.getAllEmails();
    res.json({
      success: true,
      emails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-generator' });
});

app.listen(PORT, () => {
  console.log(`[Email Generator] Running on port ${PORT}`);
});

module.exports = app;
