class EmailCatcher {
    constructor() {
        this.currentEmails = new Map();
        this.initEventListeners();
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
                this.loadExistingEmails();
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

        const emailCards = emails.map(email => `
            <div class="email-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${email.email}</strong>
                        <small class="text-muted ms-2">
                            创建时间: ${new Date(email.created).toLocaleString()}
                        </small>
                    </div>
                    <div>
                        <span class="badge bg-secondary me-2">${email.messages.length} 封邮件</span>
                        <button class="btn btn-sm btn-primary" onclick="emailCatcher.checkInbox('${email.id}')">
                            <i class="bi bi-arrow-clockwise"></i> 检查收件箱
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="messages-${email.id}">
                        ${this.renderMessages(email.messages)}
                    </div>
                </div>
            </div>
        `).join('');

        listContainer.innerHTML = emailCards;
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