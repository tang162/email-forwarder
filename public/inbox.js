class InboxPage {
    constructor() {
        this.emailId = null;
        this.emailData = null;
        this.isVerified = false;
        this.init();
    }

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.emailId = urlParams.get('emailId');

        if (!this.emailId) {
            alert('未找到邮箱ID，将返回首页');
            window.location.href = '/';
            return;
        }

        this.setupEventListeners();
        this.loadEmailData();
    }

    setupEventListeners() {
        const verifyBtn = document.getElementById('verifyOtpBtn');
        const requestBtn = document.getElementById('requestOtpBtn');
        const otpInput = document.getElementById('otpInput');

        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifyOtp());
        }

        if (requestBtn) {
            requestBtn.addEventListener('click', () => this.requestOtp());
        }

        if (otpInput) {
            otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyOtp();
                }
            });
        }
    }

    async loadEmailData() {
        try {
            const response = await fetch(`/api/email/${this.emailId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || '邮箱不存在');
            }

            this.emailData = result.data;
            document.getElementById('emailAddress').value = this.emailData.email;
            
            if (this.emailData.otp) {
                const otpStatus = document.getElementById('otpStatus');
                otpStatus.innerHTML = `<div class="alert alert-info"><i class="bi bi-info-circle"></i> 当前验证码: <strong>${this.emailData.otp}</strong></div>`;
            }
        } catch (error) {
            console.error('加载邮箱数据失败:', error);
            alert('加载邮箱数据失败: ' + error.message);
            window.location.href = '/';
        }
    }

    async requestOtp() {
        try {
            const response = await fetch(`/api/email/${this.emailId}/otp`, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                const otpStatus = document.getElementById('otpStatus');
                otpStatus.innerHTML = `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle"></i> 验证码已生成: <strong>${result.otp}</strong><br>
                        <small class="text-muted">有效期至: ${new Date(result.expiresAt).toLocaleString()}</small>
                    </div>
                `;
                document.getElementById('otpInput').value = result.otp;
                this.showToast('验证码已生成', 'success');
            } else {
                throw new Error(result.message || '获取验证码失败');
            }
        } catch (error) {
            console.error('获取验证码失败:', error);
            this.showToast('获取验证码失败: ' + error.message, 'error');
        }
    }

    async verifyOtp() {
        const otpInput = document.getElementById('otpInput');
        const otp = otpInput.value.trim();

        if (!otp) {
            this.showToast('请输入验证码', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/email/${this.emailId}/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp })
            });

            const result = await response.json();

            if (result.success) {
                this.isVerified = true;
                document.getElementById('otpCard').style.display = 'none';
                document.getElementById('inboxCard').style.display = 'block';
                this.showToast('验证成功！', 'success');
                await this.refreshInbox();
            } else {
                throw new Error(result.message || '验证失败');
            }
        } catch (error) {
            console.error('验证失败:', error);
            this.showToast('验证失败: ' + error.message, 'error');
        }
    }

    async refreshInbox() {
        if (!this.isVerified) {
            this.showToast('请先完成验证码验证', 'warning');
            return;
        }

        try {
            const messageList = document.getElementById('messageList');
            messageList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="mt-2">正在刷新邮件...</p>
                </div>
            `;

            const response = await fetch(`/api/inbox/${this.emailId}`);
            const result = await response.json();

            if (result.success) {
                this.emailData.messages = result.messages;
                this.renderMessages(result.messages);
                this.showToast('刷新成功', 'success');
            } else {
                throw new Error(result.message || '刷新失败');
            }
        } catch (error) {
            console.error('刷新收件箱失败:', error);
            this.showToast('刷新失败: ' + error.message, 'error');
            if (this.emailData && this.emailData.messages) {
                this.renderMessages(this.emailData.messages);
            }
        }
    }

    renderMessages(messages) {
        const messageList = document.getElementById('messageList');
        const messageCount = document.getElementById('messageCount');
        
        messageCount.textContent = `${messages.length} 封邮件`;

        if (messages.length === 0) {
            messageList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox" style="font-size: 4rem;"></i>
                    <p class="mt-3 fs-5">暂无邮件</p>
                    <button class="btn btn-primary mt-2" onclick="refreshInbox()">
                        <i class="bi bi-arrow-clockwise"></i> 刷新
                    </button>
                </div>
            `;
            return;
        }

        const messageCards = messages.map(msg => `
            <div class="message-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="flex-grow-1">
                            <h5 class="mb-1">${this.escapeHtml(msg.subject || '无主题')}</h5>
                            <div class="text-muted">
                                <small>
                                    <i class="bi bi-person"></i> ${this.escapeHtml(msg.from)}
                                    <span class="ms-3">
                                        <i class="bi bi-calendar"></i> ${new Date(msg.date).toLocaleString()}
                                    </span>
                                </small>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewEmailDetail(${this.escapeForAttr(JSON.stringify(msg))})">
                            <i class="bi bi-eye"></i> 查看详情
                        </button>
                    </div>
                    ${msg.text ? `<div class="mt-2 text-truncate">${this.escapeHtml(msg.text.substring(0, 150))}${msg.text.length > 150 ? '...' : ''}</div>` : ''}
                </div>
            </div>
        `).join('');

        messageList.innerHTML = messageCards;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeForAttr(text) {
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    showToast(message, type = 'info') {
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

function viewEmailDetail(message) {
    const modalBody = document.getElementById('emailDetails');
    modalBody.innerHTML = `
        <div class="mb-3">
            <strong>主题:</strong> ${message.subject || '无主题'}
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
            <div class="email-content">
                ${message.html || message.text || '无内容'}
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('emailModal'));
    modal.show();
}

function copyEmail() {
    const emailInput = document.getElementById('emailAddress');
    emailInput.select();
    document.execCommand('copy');
    
    if (window.inboxPage) {
        inboxPage.showToast('邮箱地址已复制到剪贴板!', 'success');
    }
}

function refreshInbox() {
    if (window.inboxPage) {
        window.inboxPage.refreshInbox();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.inboxPage = new InboxPage();
});
