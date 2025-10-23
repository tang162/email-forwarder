class EmailCatcher {
    constructor() {
        this.currentEmails = new Map();
        this.otpModalElement = document.getElementById('otpModal');
        this.otpModal = this.otpModalElement ? new bootstrap.Modal(this.otpModalElement) : null;
        this.otpEmailElement = document.getElementById('otpEmail');
        this.otpCodeElement = document.getElementById('otpCode');
        this.otpCountdownElement = document.getElementById('otpCountdown');
        this.otpTimer = null;
        this.currentOtpEmailId = null;
        this.currentOtpEmailAddress = '';
        this.initEventListeners();
        if (this.otpModalElement) {
            this.otpModalElement.addEventListener('hidden.bs.modal', () => {
                this.currentOtpEmailId = null;
                this.currentOtpEmailAddress = '';
                if (this.otpTimer) {
                    clearInterval(this.otpTimer);
                    this.otpTimer = null;
                }
                if (this.otpCodeElement) {
                    this.otpCodeElement.textContent = '--';
                }
                if (this.otpCountdownElement) {
                    this.otpCountdownElement.textContent = '';
                }
            });
        }
        this.loadExistingEmails();
    }

    initEventListeners() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generateEmail());
        document.getElementById('sendTestBtn').addEventListener('click', () => this.sendTestEmail());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadExistingEmails());
    }

    async generateEmail() {
        try {
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('emailAddress').value = result.emailAddress;
                document.getElementById('generatedEmail').style.display = 'block';
                document.getElementById('toEmail').value = result.emailAddress;
                
                this.showToast('邮箱生成成功!', 'success');
                await this.loadExistingEmails();

                const otpData = {
                    otp: result.otp,
                    expiresAt: result.otpExpiresAt,
                    success: true
                };

                if (this.otpModal) {
                    this.displayOtpModal(result.emailId, result.emailAddress, otpData);
                } else {
                    this.showOtpWithPrompt(result.emailAddress, otpData);
                }
            } else {
                this.showToast('生成邮箱失败!', 'error');
            }
        } catch (error) {
            console.error('生成邮箱失败:', error);
            this.showToast('生成邮箱失败: ' + error.message, 'error');
        }
    }

    async sendTestEmail() {
        const toEmail = document.getElementById('toEmail').value;
        const subject = document.getElementById('emailSubject').value;
        const content = document.getElementById('emailContent').value;

        if (!toEmail || !subject || !content) {
            this.showToast('请填写完整的邮件信息!', 'warning');
            return;
        }

        const sendBtn = document.getElementById('sendTestBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 发送中...';

        try {
            const response = await fetch('/api/send-test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toEmail: toEmail,
                    subject: subject,
                    content: content
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('邮件发送成功!', 'success');
                // 清空表单
                document.getElementById('emailSubject').value = '';
                document.getElementById('emailContent').value = '';
            } else {
                this.showToast('发送失败: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('发送邮件失败:', error);
            this.showToast('发送失败: ' + error.message, 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="bi bi-send"></i> 发送测试邮件';
        }
    }

    async loadExistingEmails() {
        try {
            const response = await fetch('/api/emails');
            const result = await response.json();

            if (result.success) {
                this.currentEmails.clear();
                result.emails.forEach(email => {
                    this.currentEmails.set(email.id, email);
                });
                this.renderEmailList(result.emails);
            }
        } catch (error) {
            console.error('加载邮箱列表失败:', error);
        }
    }

    renderEmailList(emails) {
        const listContainer = document.getElementById('emailList');

        if (emails.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-2">暂无生成的邮箱</p>
                </div>
            `;
            return;
        }

        const emailCards = emails.map(email => {
            const otpDisplay = email.otp && email.otpExpiresAt && Date.now() < email.otpExpiresAt
                ? `<div class="mt-2">
                    <span class="badge bg-success me-1">验证码</span>
                    <code class="fs-5 text-primary">${email.otp}</code>
                    <small class="text-muted ms-2">
                        过期时间: ${new Date(email.otpExpiresAt).toLocaleTimeString()}
                    </small>
                   </div>`
                : '';
            
            return `
            <div class="email-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <strong>${email.email}</strong>
                        <small class="text-muted ms-2">
                            创建时间: ${new Date(email.created).toLocaleString()}
                        </small>
                        ${otpDisplay}
                    </div>
                    <div class="d-flex gap-2 flex-wrap justify-content-end">
                        <span class="badge bg-secondary align-self-start">${email.messages.length} 封邮件</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="emailCatcher.showOtp('${email.id}')">
                            <i class="bi bi-key"></i> 获取验证码
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="emailCatcher.checkInbox('${email.id}')">
                            <i class="bi bi-arrow-clockwise"></i> 检查收件箱
                        </button>
                        <button class="btn btn-sm btn-success" onclick="emailCatcher.openInbox('${email.id}')">
                            <i class="bi bi-box-arrow-in-right"></i> 前往邮箱
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="messages-${email.id}">
                        ${this.renderMessages(email.messages)}
                    </div>
                </div>
            </div>
        `;
        }).join('');

        listContainer.innerHTML = emailCards;
    }

    async showOtp(emailId, forceNew = false) {
        try {
            let email = this.currentEmails.get(emailId);
            if (!email) {
                await this.loadExistingEmails();
                email = this.currentEmails.get(emailId);
                if (!email) {
                    this.showToast('邮箱不存在', 'error');
                    return;
                }
            }

            const otpData = await this.fetchOtp(emailId, forceNew);
            if (!otpData) {
                throw new Error('无法获取验证码');
            }

            if (this.otpModal) {
                this.displayOtpModal(emailId, email.email, otpData);
            } else {
                this.showOtpWithPrompt(email.email, otpData);
            }
        } catch (error) {
            console.error('获取验证码失败:', error);
            this.showToast('获取验证码失败: ' + error.message, 'error');
        }
    }

    async fetchOtp(emailId, forceNew = false) {
        if (!forceNew) {
            const response = await fetch(`/api/email/${emailId}/otp`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return data;
                }
            }
        }

        const generateResponse = await fetch(`/api/email/${emailId}/otp`, { method: 'POST' });
        const generated = await generateResponse.json();
        if (generated.success) {
            await this.loadExistingEmails();
            return generated;
        }
        return null;
    }

    displayOtpModal(emailId, emailAddress, otpData) {
        this.currentOtpEmailId = emailId;
        this.currentOtpEmailAddress = emailAddress;

        if (this.otpEmailElement) {
            this.otpEmailElement.textContent = emailAddress;
        }
        if (this.otpCodeElement) {
            this.otpCodeElement.textContent = otpData.otp;
        }

        this.startOtpCountdown(otpData.expiresAt);
        this.otpModal.show();
    }

    startOtpCountdown(expiresAt) {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
        }

        const updateCountdown = () => {
            const now = Date.now();
            const remaining = expiresAt - now;

            if (remaining <= 0) {
                if (this.otpCountdownElement) {
                    this.otpCountdownElement.innerHTML = '<span class="text-danger">验证码已过期</span>';
                }
                if (this.otpTimer) {
                    clearInterval(this.otpTimer);
                    this.otpTimer = null;
                }
                return;
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            if (this.otpCountdownElement) {
                this.otpCountdownElement.textContent = `有效期剩余: ${minutes}分${seconds.toString().padStart(2, '0')}秒`;
            }
        };

        updateCountdown();
        this.otpTimer = setInterval(updateCountdown, 1000);
    }

    showOtpWithPrompt(emailAddress, otpData) {
        alert(`邮箱: ${emailAddress}\n验证码: ${otpData.otp}\n有效期至: ${new Date(otpData.expiresAt).toLocaleString()}`);
    }

    async refreshOtp() {
        if (!this.currentOtpEmailId) {
            this.showToast('请先获取验证码', 'warning');
            return;
        }

        await this.showOtp(this.currentOtpEmailId, true);
    }

    copyOtp() {
        if (!this.otpCodeElement) {
            return;
        }

        const otp = this.otpCodeElement.textContent;
        if (!otp || otp === '--') {
            this.showToast('暂无可复制的验证码', 'warning');
            return;
        }

        navigator.clipboard.writeText(otp).then(() => {
            this.showToast('验证码已复制到剪贴板', 'success');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = otp;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('验证码已复制到剪贴板', 'success');
        });
    }

    openInbox(emailId) {
        const targetId = emailId || this.currentOtpEmailId;
        if (!targetId) {
            this.showToast('请先选择邮箱', 'warning');
            return;
        }

        if (this.otpModal) {
            this.otpModal.hide();
        }

        window.location.href = `/inbox.html?emailId=${targetId}`;
    }

    renderMessages(messages) {
        if (messages.length === 0) {
            return '<div class="text-muted">暂无邮件</div>';
        }

        return messages.map(msg => `
            <div class="message-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${msg.subject}</h6>
                        <small class="text-muted">
                            来自: ${msg.from} | 时间: ${new Date(msg.date).toLocaleString()}
                        </small>
                        <p class="mb-1 mt-2">${msg.text ? msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : '') : '无内容'}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-info ms-2" onclick="emailCatcher.viewEmailDetail(${JSON.stringify(msg).replace(/"/g, '&quot;')})">
                        <i class="bi bi-eye"></i> 查看
                    </button>
                </div>
            </div>
        `).join('');
    }

    async checkInbox(emailId) {
        try {
            const response = await fetch(`/api/inbox/${emailId}`);
            const result = await response.json();

            if (result.success) {
                document.getElementById(`messages-${emailId}`).innerHTML = this.renderMessages(result.messages);
                this.showToast('收件箱更新成功!', 'success');
            } else {
                this.showToast('更新失败: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('检查收件箱失败:', error);
            this.showToast('检查收件箱失败: ' + error.message, 'error');
        }
    }

    viewEmailDetail(message) {
        const modalBody = document.getElementById('emailDetails');
        modalBody.innerHTML = `
            <div class="mb-3">
                <strong>主题:</strong> ${message.subject}
            </div>
            <div class="mb-3">
                <strong>发件人:</strong> ${message.from}
            </div>
            <div class="mb-3">
                <strong>收件人:</strong> ${message.to}
            </div>
            <div class="mb-3">
                <strong>时间:</strong> ${new Date(message.date).toLocaleString()}
            </div>
            <div class="mb-3">
                <strong>内容:</strong>
                <div class="border rounded p-3 mt-2" style="background-color: #f8f9fa;">
                    ${message.html || message.text || '无内容'}
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('emailModal'));
        modal.show();
    }

    showToast(message, type = 'info') {
        // 创建toast元素
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // 自动清理
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }
}

// 复制邮箱地址功能
function copyEmail() {
    const emailInput = document.getElementById('emailAddress');
    emailInput.select();
    document.execCommand('copy');
    
    if (window.emailCatcher) {
        emailCatcher.showToast('邮箱地址已复制到剪贴板!', 'success');
    }
}

// 初始化应用
const emailCatcher = new EmailCatcher();