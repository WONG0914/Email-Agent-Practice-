// Inbox Zero 邮件管理工具主脚本

class EmailManager {
    constructor() {
        this.emails = this.loadEmails();
        this.currentFilter = 'inbox';
        this.selectedEmails = new Set();
        this.currentEmail = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderEmailList();
        this.updateInboxCount();
    }

    // 数据存储方法
    loadEmails() {
        const emails = localStorage.getItem('emails');
        if (emails) {
            return JSON.parse(emails);
        }
        
        // 初始化示例邮件
        const sampleEmails = [
            {
                id: '1',
                sender: 'team@getinboxzero.com',
                senderName: 'Inbox Zero Team',
                recipient: 'user@example.com',
                subject: '欢迎使用 Inbox Zero！',
                body: '您好！\n\n感谢您使用 Inbox Zero 邮件管理工具。我们致力于帮助您实现"收件箱零邮件"的目标。\n\n主要功能：\n• 智能邮件分类\n• 快速批量操作\n• 垃圾邮件过滤\n• 草稿自动保存\n\n祝您使用愉快！\n\nInbox Zero 团队',
                date: new Date(Date.now() - 3600000).toISOString(),
                folder: 'inbox',
                read: false,
                starred: false
            },
            {
                id: '2',
                sender: 'newsletter@techblog.com',
                senderName: 'Tech Newsletter',
                recipient: 'user@example.com',
                subject: '本周技术资讯 - AI 与前端开发',
                body: '亲爱的订阅者，\n\n本周为您精选以下内容：\n\n1. React 19 新特性详解\n2. TypeScript 5.0 最佳实践\n3. AI 辅助编程工具对比\n4. WebAssembly 在前端的应用\n\n点击阅读完整内容...',
                date: new Date(Date.now() - 7200000).toISOString(),
                folder: 'inbox',
                read: true,
                starred: true
            },
            {
                id: '3',
                sender: 'user@example.com',
                senderName: '我',
                recipient: 'colleague@company.com',
                subject: '项目进度更新',
                body: 'Hi,\n\n关于本周的项目进度：\n- 前端界面已完成 80%\n- API 接口对接进行中\n- 预计下周可以进入测试阶段\n\n有任何问题请随时联系我。\n\nBest regards',
                date: new Date(Date.now() - 86400000).toISOString(),
                folder: 'sent',
                read: true,
                starred: false
            },
            {
                id: '4',
                sender: 'user@example.com',
                senderName: '我',
                recipient: 'client@project.com',
                subject: 'Re: 合同细节讨论',
                body: '关于合同中的付款条款，我建议我们安排一次视频会议详细讨论。您看本周五下午 2 点是否方便？\n\n期待您的回复。',
                date: new Date(Date.now() - 172800000).toISOString(),
                folder: 'drafts',
                read: true,
                starred: false
            },
            {
                id: '5',
                sender: 'promo@spam.com',
                senderName: '垃圾邮件发送者',
                recipient: 'user@example.com',
                subject: '恭喜您中奖了！',
                body: '您获得了 100 万元大奖！请立即联系我们领取...',
                date: new Date(Date.now() - 259200000).toISOString(),
                folder: 'spam',
                read: false,
                starred: false
            }
        ];
        
        this.saveEmails(sampleEmails);
        return sampleEmails;
    }

    saveEmails() {
        localStorage.setItem('emails', JSON.stringify(this.emails));
    }

    // 邮件管理方法
    addEmail(email) {
        const newEmail = {
            id: Date.now().toString(),
            ...email,
            date: new Date().toISOString(),
            read: false,
            starred: false
        };
        this.emails.unshift(newEmail);
        this.saveEmails();
        this.renderEmailList();
        this.updateInboxCount();
        return newEmail;
    }

    deleteEmail(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.folder = 'trash';
            this.saveEmails();
            this.renderEmailList();
            this.updateInboxCount();
        }
    }

    markAsRead(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.read = true;
            this.saveEmails();
            this.renderEmailList();
            this.updateInboxCount();
        }
    }

    markAsUnread(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.read = false;
            this.saveEmails();
            this.renderEmailList();
            this.updateInboxCount();
        }
    }

    moveToFolder(emailIds, folder) {
        emailIds.forEach(id => {
            const email = this.emails.find(e => e.id === id);
            if (email) {
                email.folder = folder;
            }
        });
        this.saveEmails();
        this.renderEmailList();
        this.updateInboxCount();
        this.selectedEmails.clear();
        this.updateSelectAllCheckbox();
    }

    toggleStar(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.starred = !email.starred;
            this.saveEmails();
            this.renderEmailList();
        }
    }

    // 渲染方法
    renderEmailList() {
        const emailList = document.getElementById('emailList');
        const filteredEmails = this.getFilteredEmails();
        
        if (filteredEmails.length === 0) {
            emailList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无邮件</p>
                </div>
            `;
            return;
        }

        emailList.innerHTML = filteredEmails.map(email => this.renderEmailItem(email)).join('');
    }

    renderEmailItem(email) {
        const timeAgo = this.getTimeAgo(email.date);
        const isSelected = this.selectedEmails.has(email.id);
        const isUnread = !email.read && email.folder === 'inbox';
        
        return `
            <div class="email-item ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}" 
                 data-id="${email.id}" onclick="emailManager.selectEmail('${email.id}')">
                <input type="checkbox" class="email-checkbox" 
                       ${isSelected ? 'checked' : ''} 
                       onclick="event.stopPropagation(); emailManager.toggleSelectEmail('${email.id}')">
                <div class="email-content">
                    <div class="email-sender">${email.senderName || email.sender}</div>
                    <div class="email-subject">${email.subject}</div>
                    <div class="email-preview">${this.getEmailPreview(email.body)}</div>
                </div>
                <div class="email-meta">
                    ${email.starred ? '<i class="fas fa-star" style="color: #f59e0b;"></i>' : ''}
                    <span class="email-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    renderEmailDetail(email) {
        if (!email) {
            document.getElementById('emailDetail').innerHTML = `
                <div class="detail-placeholder">
                    <i class="fas fa-envelope-open"></i>
                    <p>选择一封邮件查看详情</p>
                </div>
            `;
            return;
        }

        const detailHtml = `
            <div class="email-detail-content">
                <div class="detail-header">
                    <h2 class="detail-subject">${email.subject}</h2>
                    <div class="detail-meta">
                        <div class="detail-sender">
                            <div class="sender-avatar">
                                ${(email.senderName || email.sender).charAt(0).toUpperCase()}
                            </div>
                            <div class="sender-info">
                                <div class="sender-name">${email.senderName || email.sender}</div>
                                <div class="sender-email">${email.sender}</div>
                            </div>
                        </div>
                        <div class="detail-actions">
                            <button class="action-btn" onclick="emailManager.toggleStar('${email.id}')" 
                                    title="${email.starred ? '取消星标' : '添加星标'}">
                                <i class="fas fa-star ${email.starred ? 'starred' : ''}"></i>
                            </button>
                            <button class="action-btn" onclick="emailManager.replyToEmail('${email.id}')" title="回复">
                                <i class="fas fa-reply"></i>
                            </button>
                            <button class="action-btn" onclick="emailManager.deleteEmail('${email.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="detail-body">
                    <p>${email.body.replace(/\n/g, '</p><p>')}</p>
                </div>
            </div>
        `;

        document.getElementById('emailDetail').innerHTML = detailHtml;
        
        // 标记为已读
        if (!email.read && email.folder === 'inbox') {
            this.markAsRead(email.id);
        }
    }

    // 过滤和排序方法
    getFilteredEmails() {
        let filtered = this.emails.filter(email => email.folder === this.currentFilter);
        
        // 搜索过滤
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(email => 
                email.subject.toLowerCase().includes(searchTerm) ||
                email.sender.toLowerCase().includes(searchTerm) ||
                email.body.toLowerCase().includes(searchTerm)
            );
        }
        
        // 排序
        const sortBy = document.getElementById('sortSelect').value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'sender':
                    return (a.senderName || a.sender).localeCompare(b.senderName || b.sender);
                case 'subject':
                    return a.subject.localeCompare(b.subject);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
        
        return filtered;
    }

    // 事件处理方法
    bindEvents() {
        // 导航过滤
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.renderEmailList();
                this.selectedEmails.clear();
                this.updateSelectAllCheckbox();
            });
        });

        // 搜索
        document.getElementById('searchInput').addEventListener('input', () => {
            this.renderEmailList();
        });

        // 排序
        document.getElementById('sortSelect').addEventListener('change', () => {
            this.renderEmailList();
        });

        // 全选
        document.getElementById('selectAll').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.email-checkbox');
            if (e.target.checked) {
                checkboxes.forEach(cb => {
                    this.selectedEmails.add(cb.closest('.email-item').dataset.id);
                    cb.checked = true;
                });
            } else {
                checkboxes.forEach(cb => {
                    this.selectedEmails.delete(cb.closest('.email-item').dataset.id);
                    cb.checked = false;
                });
            }
            this.renderEmailList();
        });

        // 写邮件表单
        document.getElementById('composeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendEmail();
        });
    }

    // 交互方法
    selectEmail(emailId) {
        this.currentEmail = this.emails.find(e => e.id === emailId);
        this.renderEmailDetail(this.currentEmail);
        
        // 在移动设备上显示详情
        if (window.innerWidth <= 1024) {
            document.querySelector('.email-container').style.display = 'none';
            document.getElementById('emailDetail').classList.add('show');
        }
    }

    toggleSelectEmail(emailId) {
        if (this.selectedEmails.has(emailId)) {
            this.selectedEmails.delete(emailId);
        } else {
            this.selectedEmails.add(emailId);
        }
        this.updateSelectAllCheckbox();
        this.renderEmailList();
    }

    updateSelectAllCheckbox() {
        const visibleEmails = this.getFilteredEmails();
        const selectAll = document.getElementById('selectAll');
        if (selectAll && visibleEmails.length > 0) {
            selectAll.checked = visibleEmails.every(e => this.selectedEmails.has(e.id));
        }
    }

    // 批量操作
    markAsRead() {
        if (this.selectedEmails.size === 0) {
            this.showNotification('请先选择邮件', 'warning');
            return;
        }
        this.selectedEmails.forEach(id => this.markAsRead(id));
        this.showNotification('已标记为已读', 'success');
    }

    markAsUnread() {
        if (this.selectedEmails.size === 0) {
            this.showNotification('请先选择邮件', 'warning');
            return;
        }
        this.selectedEmails.forEach(id => this.markAsUnread(id));
        this.showNotification('已标记为未读', 'success');
    }

    moveToSpam() {
        if (this.selectedEmails.size === 0) {
            this.showNotification('请先选择邮件', 'warning');
            return;
        }
        this.moveToFolder(Array.from(this.selectedEmails), 'spam');
        this.showNotification('已移至垃圾邮件', 'success');
    }

    deleteEmails() {
        if (this.selectedEmails.size === 0) {
            this.showNotification('请先选择邮件', 'warning');
            return;
        }
        this.moveToFolder(Array.from(this.selectedEmails), 'trash');
        this.showNotification('已移至回收站', 'success');
    }

    // 邮件操作
    sendEmail() {
        const email = {
            sender: 'user@example.com',
            senderName: '我',
            recipient: document.getElementById('composeTo').value,
            subject: document.getElementById('composeSubject').value,
            body: document.getElementById('composeBody').value,
            folder: 'sent'
        };
        
        this.addEmail(email);
        this.closeComposeModal();
        this.showNotification('邮件发送成功', 'success');
    }

    saveDraft() {
        const email = {
            sender: 'user@example.com',
            senderName: '我',
            recipient: document.getElementById('composeTo').value,
            subject: document.getElementById('composeSubject').value,
            body: document.getElementById('composeBody').value,
            folder: 'drafts'
        };
        
        this.addEmail(email);
        this.closeComposeModal();
        this.showNotification('草稿已保存', 'success');
    }

    replyToEmail(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            document.getElementById('composeTo').value = email.sender;
            document.getElementById('composeSubject').value = `Re: ${email.subject}`;
            document.getElementById('composeBody').value = `\n\n--- 原始邮件 ---\n${email.body}`;
            this.showComposeModal();
        }
    }

    // 工具方法
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        return date.toLocaleDateString('zh-CN');
    }

    getEmailPreview(body) {
        return body.substring(0, 50) + (body.length > 50 ? '...' : '');
    }

    updateInboxCount() {
        const unreadCount = this.emails.filter(e => e.folder === 'inbox' && !e.read).length;
        document.getElementById('inboxCount').textContent = unreadCount;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// 全局函数
function showComposeModal() {
    document.getElementById('composeModal').classList.add('show');
    document.getElementById('composeForm').reset();
}

function closeComposeModal() {
    document.getElementById('composeModal').classList.remove('show');
}

function markAsRead() {
    emailManager.markAsRead();
}

function markAsUnread() {
    emailManager.markAsUnread();
}

function moveToSpam() {
    emailManager.moveToSpam();
}

function deleteEmails() {
    emailManager.deleteEmails();
}

// 初始化应用
const emailManager = new EmailManager();

// 响应式处理
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        document.querySelector('.email-container').style.display = 'flex';
        document.getElementById('emailDetail').classList.remove('show');
    }
});
