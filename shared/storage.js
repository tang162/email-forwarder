class MemoryStorage {
  constructor() {
    this.emails = new Map();
    this.otps = new Map();
    this.config = {
      imap: null,
      polling: null,
      domain: null
    };
  }

  // Email operations
  setEmail(id, data) {
    this.emails.set(id, data);
  }

  getEmail(id) {
    return this.emails.get(id);
  }

  getAllEmails() {
    return Array.from(this.emails.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  deleteEmail(id) {
    this.emails.delete(id);
  }

  // OTP operations
  setOtp(emailId, otpData) {
    this.otps.set(emailId, otpData);
  }

  getOtp(emailId) {
    return this.otps.get(emailId);
  }

  deleteOtp(emailId) {
    this.otps.delete(emailId);
  }

  // Config operations
  setImapConfig(config) {
    this.config.imap = config;
  }

  getImapConfig() {
    return this.config.imap;
  }

  setPollingConfig(config) {
    this.config.polling = config;
  }

  getPollingConfig() {
    return this.config.polling;
  }

  setDomain(domain) {
    this.config.domain = domain;
  }

  getDomain() {
    return this.config.domain;
  }

  getConfig() {
    return this.config;
  }
}

const storage = new MemoryStorage();

module.exports = storage;
