// Wong's Agent - Complete Email Management System
// Production-ready personal email assistant

class WongsAgent {
    constructor() {
        this.currentUser = null;
        this.emails = this.loadEmails();
        this.currentFolder = 'inbox';
        this.currentEmail = null;
        this.searchTerm = '';
        this.sortBy = 'date-desc';
        this.init();
    }

    init() {
        this.handleCacheClearing();
        this.bindEvents();
        this.checkAuthStatus();
        this.setupWelcomePage();
        this.startPeriodicSync();
    }

    handleCacheClearing() {
        // Check if user wants to clear cache on startup
        const clearCache = localStorage.getItem('wongsAgentClearCache');
        if (clearCache === 'true') {
            this.clearAllCache();
            localStorage.setItem('wongsAgentClearCache', 'false'); // Reset after clearing
            console.log('🧹 Cache cleared on startup');
        }
    }

    clearAllCache() {
        // Clear all application data
        const keysToKeep = ['wongsAgentClearCache']; // Keep settings preference
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // Reset application state
        this.currentUser = null;
        this.emails = [];
        this.currentFolder = 'inbox';
        this.currentEmail = null;
        this.searchTerm = '';
        this.sortBy = 'date-desc';
        
        // Reload sample data
        this.emails = this.loadEmails();
        
        this.showNotification('🧹 ALL DATA CLEARED', 'success');
    }

    // 认证系统
    checkAuthStatus() {
        const savedUser = localStorage.getItem('wongsAgentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showAuthPage();
        }
    }

    showAuthPage() {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('userEmail').textContent = this.currentUser.email;
        this.updateCounts();
        this.showWelcomePage();
    }

    // 用户管理
    login(email, password) {
        const users = JSON.parse(localStorage.getItem('wongsAgentUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('wongsAgentUser', JSON.stringify(user));
            this.showMainApp();
            this.showNotification('🚀 WELCOME BACK TO WONG\'S AGENT', 'success');
            return true;
        }
        this.showNotification('❌ INVALID CREDENTIALS', 'error');
        return false;
    }

    register(name, email, password) {
        const users = JSON.parse(localStorage.getItem('wongsAgentUsers') || '[]');
        
        if (users.find(u => u.email === email)) {
            this.showNotification('❌ EMAIL ALREADY EXISTS', 'error');
            return false;
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString(),
            settings: {
                autoSummary: true,
                dailyDigest: true,
                promotionalFilter: true,
                theme: 'retro'
            }
        };

        users.push(newUser);
        localStorage.setItem('wongsAgentUsers', JSON.stringify(users));
        this.currentUser = newUser;
        localStorage.setItem('wongsAgentUser', JSON.stringify(newUser));
        this.showMainApp();
        this.showNotification('✅ WELCOME TO WONG\'S AGENT', 'success');
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('wongsAgentUser');
        this.showAuthPage();
        this.showNotification('👋 LOGGED OUT', 'success');
    }

    // 邮件数据管理
    loadEmails() {
        const emails = localStorage.getItem('wongsAgentEmails');
        if (emails) {
            return JSON.parse(emails);
        }

        // 真实邮件数据示例
        const sampleEmails = [
            {
                id: '1',
                sender: 'amazon@amazon.com',
                senderName: 'Amazon',
                recipient: this.currentUser?.email || 'user@wongsagent.com',
                subject: '📦 Your Amazon order has shipped!',
                body: 'Your order #123-4567890-1234567 has been shipped!\n\nItems:\n- Retro Gaming Keyboard - $89.99\n- Mechanical Mouse - $45.99\n\nTracking: 1Z999AA10123456784\n\nEstimated delivery: Tomorrow',
                date: new Date().toISOString(),
                folder: 'inbox',
                read: false,
                priority: 'high',
                category: 'shopping',
                summary: 'Amazon order shipped with tracking info',
                attachments: ['tracking.pdf']
            },
            {
                id: '2',
                sender: 'digest@wongsagent.com',
                senderName: 'Wong\'s Agent Digest',
                recipient: this.currentUser?.email || 'user@wongsagent.com',
                subject: '📊 Daily Email Summary - Your Inbox Overview',
                body: 'DAILY EMAIL SUMMARY\n==================\n\n📧 NEW EMAILS: 12\n🎯 PROMOTIONAL: 8 (auto-filtered)\n⚡ IMPORTANT: 3\n📈 SOCIAL: 1\n\nTOP PRIORITIES:\n1. Amazon order confirmation\n2. Bank security alert\n3. Meeting reminder at 2 PM\n\nAI SUMMARY:\nYour inbox received 12 new emails. 8 promotional emails were automatically filtered. 3 important emails require your attention.\n\nGenerated by Wong\'s Agent AI Engine v3.0',
                date: new Date(Date.now() - 3600000).toISOString(),
                folder: 'inbox',
                read: false,
                priority: 'high',
                category: 'digest',
                summary: 'Daily inbox summary with 12 new emails'
            },
            {
                id: '3',
                sender: 'security@chase.com',
                senderName: 'Chase Security',
                recipient: this.currentUser?.email || 'user@wongsagent.com',
                subject: '🔒 Security Alert: Unusual Login Attempt',
                body: 'We detected an unusual login attempt to your Chase account.\n\nTime: 2:34 AM EST\nLocation: Unknown Device\nAction: Login blocked for security\n\nIf this wasn\'t you, please secure your account immediately.\n\nChase Security Team',
                date: new Date(Date.now() - 7200000).toISOString(),
                folder: 'inbox',
                read: false,
                priority: 'urgent',
                category: 'security',
                summary: 'Security alert for unusual login attempt'
            },
            {
                id: '4',
                sender: 'newsletter@techcrunch.com',
                senderName: 'TechCrunch Newsletter',
                recipient: this.currentUser?.email || 'user@wongsagent.com',
                subject: '🚀 Daily Tech Roundup: AI Breakthroughs',
                body: 'TECHCRUNCH DAILY\n================\n\n🤖 OpenAI announces GPT-5\n📱 Apple Vision Pro 2 rumors\n💻 New MacBook Pro M3 review\n🎮 Steam Deck OLED announced\n\nRead more at techcrunch.com',
                date: new Date(Date.now() - 86400000).toISOString(),
                folder: 'inbox',
                read: true,
                priority: 'low',
                category: 'newsletter',
                summary: 'Tech news digest with AI and hardware updates'
            },
            {
                id: '5',
                sender: this.currentUser?.email || 'user@wongsagent.com',
                senderName: 'Me',
                recipient: 'team@company.com',
                subject: 'Re: Project Phoenix Status Update',
                body: 'Team,\n\nGreat progress on Project Phoenix! Here\'s the update:\n\n✅ Backend API completed\n✅ Frontend components 80% done\n🔄 Testing phase starting Monday\n📅 Launch target: End of month\n\nLet\'s sync up at 3 PM today to discuss final details.\n\nBest,\nWong',
                date: new Date(Date.now() - 172800000).toISOString(),
                folder: 'sent',
                read: true,
                priority: 'normal',
                category: 'work',
                summary: 'Project Phoenix status update sent to team'
            },
            {
                id: '6',
                sender: this.currentUser?.email || 'user@wongsagent.com',
                senderName: 'Me',
                recipient: 'client@startup.com',
                subject: 'Proposal: AI Integration Services',
                body: 'Hi Sarah,\n\nFollowing up on our call about AI integration. Here\'s my proposal:\n\n🎯 Services:\n- Custom AI model training\n- API integration\n- Performance optimization\n- Monthly maintenance\n\n💰 Investment: $15,000\n📅 Timeline: 6 weeks\n\nLet me know if you\'d like to discuss this further.\n\nBest regards,\nWong',
                date: new Date(Date.now() - 259200000).toISOString(),
                folder: 'drafts',
                read: true,
                priority: 'high',
                category: 'business',
                summary: 'AI services proposal draft'
            },
            {
                id: '7',
                sender: 'promo@bestbuy.com',
                senderName: 'Best Buy Promotions',
                recipient: this.currentUser?.email || 'user@wongsagent.com',
                subject: '🛒 FLASH SALE: 50% OFF Gaming Gear!',
                body: '🔥 FLASH SALE ALERT! 🔥\n\n50% OFF all gaming accessories!\n\n🎮 Gaming Keyboards - From $49.99\n🖱️ Gaming Mice - From $29.99\n🎧 Headsets - From $39.99\n\nLimited time only! Use code: FLASH50\n\nUnsubscribe: bestbuy.com/unsubscribe',
                date: new Date(Date.now() - 345600000).toISOString(),
                folder: 'spam',
                read: false,
                priority: 'spam',
                category: 'promotional',
                summary: 'Best Buy flash sale - promotional email'
            }
        ];

        localStorage.setItem('wongsAgentEmails', JSON.stringify(sampleEmails));
        return sampleEmails;
    }

    saveEmails() {
        localStorage.setItem('wongsAgentEmails', JSON.stringify(this.emails));
    }

    // 智能邮件摘要
    generateEmailSummary(email) {
        const maxLength = 100;
        let summary = email.body.substring(0, maxLength);
        if (email.body.length > maxLength) summary += '...';
        
        // 提取关键信息
        const keyInfo = [];
        if (email.body.includes('order')) keyInfo.push('📦 Order');
        if (email.body.includes('meeting')) keyInfo.push('📅 Meeting');
        if (email.body.includes('security')) keyInfo.push('🔒 Security');
        if (email.body.includes('deadline')) keyInfo.push('⏰ Deadline');
        
        return keyInfo.length > 0 ? keyInfo.join(' • ') : summary;
    }

    // 邮件操作增强
    addEmail(email) {
        const newEmail = {
            id: Date.now().toString(),
            ...email,
            date: new Date().toISOString(),
            read: false,
            summary: this.generateEmailSummary(email),
            attachments: email.attachments || []
        };
        this.emails.unshift(newEmail);
        this.saveEmails();
        this.renderEmailList();
        this.updateCounts();
        return newEmail;
    }

    moveToFolder(emailId, folder) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.folder = folder;
            email.movedDate = new Date().toISOString();
            this.saveEmails();
            this.renderEmailList();
            this.updateCounts();
            this.showNotification(`📁 Moved to ${folder.toUpperCase()}`, 'success');
        }
    }

    deleteEmail(emailId) {
        const emailIndex = this.emails.findIndex(e => e.id === emailId);
        if (emailIndex !== -1) {
            const email = this.emails[emailIndex];
            this.emails.splice(emailIndex, 1);
            this.saveEmails();
            this.renderEmailList();
            this.updateCounts();
            this.showNotification('🗑️ EMAIL DELETED', 'success');
            
            // 如果当前查看的是被删除的邮件，返回列表
            if (this.currentEmail && this.currentEmail.id === emailId) {
                this.backToList();
            }
        }
    }

    markAsRead(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.read = true;
            email.readDate = new Date().toISOString();
            this.saveEmails();
            this.renderEmailList();
            this.updateCounts();
        }
    }

    markAsImportant(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            email.isImportant = !email.isImportant;
            this.saveEmails();
            this.renderEmailList();
            this.updateCounts();
            this.showNotification(email.isImportant ? '⭐ MARKED IMPORTANT' : '⭐ UNMARKED', 'success');
        }
    }

    // 搜索和过滤
    searchEmails(term) {
        this.searchTerm = term.toLowerCase();
        this.renderEmailList();
    }

    sortEmails(criteria) {
        this.sortBy = criteria;
        this.renderEmailList();
    }

    // 渲染方法增强
    setupWelcomePage() {
        document.getElementById('welcomePage').style.display = 'block';
        document.getElementById('emailListSection').style.display = 'none';
        document.getElementById('emailDetailSection').style.display = 'none';
        
        // 显示个性化欢迎信息
        if (this.currentUser) {
            document.querySelector('#welcomePage h1').textContent = 
                `Welcome back, ${this.currentUser.name || 'Agent'}!`;
        }
    }

    showInbox() {
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('emailListSection').style.display = 'block';
        document.getElementById('emailDetailSection').style.display = 'none';
        this.currentFolder = 'inbox';
        this.renderEmailList();
    }

    renderEmailList() {
        const emailList = document.getElementById('emailList');
        let filteredEmails = this.emails.filter(e => e.folder === this.currentFolder);

        // 搜索过滤
        if (this.searchTerm) {
            filteredEmails = filteredEmails.filter(e => 
                e.subject.toLowerCase().includes(this.searchTerm) ||
                e.sender.toLowerCase().includes(this.searchTerm) ||
                e.body.toLowerCase().includes(this.searchTerm)
            );
        }

        // 排序
        filteredEmails.sort((a, b) => {
            switch (this.sortBy) {
                case 'date-desc': return new Date(b.date) - new Date(a.date);
                case 'date-asc': return new Date(a.date) - new Date(b.date);
                case 'sender': return (a.senderName || a.sender).localeCompare(b.senderName || b.sender);
                case 'subject': return a.subject.localeCompare(b.subject);
                case 'priority': return this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
                default: return new Date(b.date) - new Date(a.date);
            }
        });

        if (filteredEmails.length === 0) {
            emailList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>NO MESSAGES</h3>
                    <p>Your ${this.currentFolder} folder is empty${this.searchTerm ? ' for search: "' + this.searchTerm + '"' : ''}</p>
                    ${this.currentFolder === 'inbox' ? '<button onclick="emailManager.showCompose()" class="empty-action-btn">COMPOSE EMAIL</button>' : ''}
                </div>
            `;
            return;
        }

        emailList.innerHTML = filteredEmails.map(email => this.renderEmailItem(email)).join('');
    }

    getPriorityValue(priority) {
        const values = { urgent: 4, high: 3, normal: 2, low: 1, spam: 0 };
        return values[priority] || 2;
    }

    renderEmailItem(email) {
        const timeAgo = this.getTimeAgo(email.date);
        const isUnread = !email.read && email.folder === 'inbox';
        const priorityClass = email.priority || 'normal';
        
        return `
            <div class="email-item ${isUnread ? 'unread' : ''} priority-${priorityClass}" 
                 onclick="emailManager.selectEmail('${email.id}')">
                <div class="email-avatar">
                    <i class="fas fa-${this.getCategoryIcon(email.category)}"></i>
                </div>
                <div class="email-content">
                    <div class="email-header">
                        <div class="email-sender">${email.senderName || email.sender}</div>
                        <div class="email-time">${timeAgo}</div>
                    </div>
                    <div class="email-subject">${email.subject}</div>
                    <div class="email-preview">${email.summary || this.getEmailPreview(email.body)}</div>
                    ${email.attachments && email.attachments.length > 0 ? '<div class="email-attachments"><i class="fas fa-paperclip"></i></div>' : ''}
                </div>
                ${email.isImportant ? '<div class="email-important"><i class="fas fa-star"></i></div>' : ''}
            </div>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            shopping: 'shopping-cart',
            security: 'shield-alt',
            newsletter: 'newspaper',
            work: 'briefcase',
            business: 'handshake',
            promotional: 'tag',
            digest: 'chart-bar',
            social: 'users',
            finance: 'credit-card'
        };
        return icons[category] || 'envelope';
    }

    renderEmailDetail(email) {
        if (!email) return;

        document.getElementById('emailListSection').style.display = 'none';
        document.getElementById('emailDetailSection').style.display = 'block';
        
        const detailHtml = `
            <div class="detail-header">
                <button class="back-btn" onclick="emailManager.backToList()">
                    <i class="fas fa-arrow-left"></i>
                    BACK
                </button>
                <div class="detail-actions">
                    <button class="action-btn" onclick="emailManager.replyEmail()" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="action-btn" onclick="emailManager.forwardEmail()" title="Forward">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="action-btn" onclick="emailManager.markAsImportant('${email.id}')" title="${email.isImportant ? 'Unmark' : 'Mark'} Important">
                        <i class="fas fa-star${email.isImportant ? '' : '-o'}"></i>
                    </button>
                    <button class="action-btn" onclick="emailManager.moveToFolder('${email.id}', 'archive')" title="Archive">
                        <i class="fas fa-archive"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="emailManager.deleteEmail('${email.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="email-detail-content">
                <div class="detail-subject">${email.subject}</div>
                <div class="detail-meta">
                    <div>
                        <strong>FROM:</strong> ${email.senderName || email.sender}<br>
                        <strong>TO:</strong> ${email.recipient}<br>
                        <strong>DATE:</strong> ${new Date(email.date).toLocaleString()}<br>
                        ${email.category ? `<strong>CATEGORY:</strong> ${email.category.toUpperCase()}` : ''}
                    </div>
                </div>
                ${email.summary ? `<div class="email-summary"><strong>AI SUMMARY:</strong> ${email.summary}</div>` : ''}
                <div class="detail-body">${email.body}</div>
                ${email.attachments && email.attachments.length > 0 ? `
                    <div class="detail-attachments">
                        <h4>ATTACHMENTS</h4>
                        ${email.attachments.map(att => `<div class="attachment"><i class="fas fa-file"></i> ${att}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('emailDetail').innerHTML = detailHtml;
        
        // 标记为已读
        if (!email.read && email.folder === 'inbox') {
            this.markAsRead(email.id);
        }
    }

    // 写邮件功能增强
    showCompose(originalEmail = null) {
        document.getElementById('composeModal').classList.add('show');
        document.getElementById('composeForm').reset();
        
        if (originalEmail) {
            document.getElementById('composeTo').value = originalEmail.sender;
            document.getElementById('composeSubject').value = `Re: ${originalEmail.subject}`;
            document.getElementById('composeBody').value = `\n\n--- Original Message ---\nFrom: ${originalEmail.senderName || originalEmail.sender}\nSubject: ${originalEmail.subject}\nDate: ${new Date(originalEmail.date).toLocaleString()}\n\n${originalEmail.body}`;
        }
    }

    forwardEmail() {
        if (this.currentEmail) {
            document.getElementById('composeTo').value = '';
            document.getElementById('composeSubject').value = `Fwd: ${this.currentEmail.subject}`;
            document.getElementById('composeBody').value = `\n\n--- Forwarded Message ---\nFrom: ${this.currentEmail.senderName || this.currentEmail.sender}\nSubject: ${this.currentEmail.subject}\nDate: ${new Date(this.currentEmail.date).toLocaleString()}\n\n${this.currentEmail.body}`;
            this.showCompose();
        }
    }

    closeCompose() {
        document.getElementById('composeModal').classList.remove('show');
    }

    // 设置页面
    showSettings() {
        // Remove existing modal if any
        const existingModal = document.querySelector('.settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const settingsModal = document.createElement('div');
        settingsModal.className = 'modal show settings-modal';
        settingsModal.innerHTML = `
            <div class="modal-content retro-modal">
                <div class="modal-header">
                    <h2>⚙️ WONG'S AGENT SETTINGS</h2>
                    <button class="close-btn" onclick="emailManager.closeSettings()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <h3>📊 EMAIL SUMMARY</h3>
                        <label>
                            <input type="checkbox" ${this.currentUser?.settings?.autoSummary ? 'checked' : ''} 
                                   onchange="emailManager.updateSetting('autoSummary', this.checked)">
                            Enable AI email summaries
                        </label>
                        <label>
                            <input type="checkbox" ${this.currentUser?.settings?.dailyDigest ? 'checked' : ''} 
                                   onchange="emailManager.updateSetting('dailyDigest', this.checked)">
                            Send daily digest
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>🔍 FILTERING</h3>
                        <label>
                            <input type="checkbox" ${this.currentUser?.settings?.promotionalFilter ? 'checked' : ''} 
                                   onchange="emailManager.updateSetting('promotionalFilter', this.checked)">
                            Auto-filter promotional emails
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3>🎨 APPEARANCE</h3>
                        <label>
                            Theme: 
                            <select onchange="emailManager.updateSetting('theme', this.value)">
                                <option value="retro" ${this.currentUser?.settings?.theme === 'retro' ? 'selected' : ''}>Retro</option>
                                <option value="modern" ${this.currentUser?.settings?.theme === 'modern' ? 'selected' : ''}>Modern</option>
                            </select>
                        </label>
                    </div>
                    <div class="settings-actions">
                        <button class="retro-btn" onclick="emailManager.closeSettings()">
                            <span>CLOSE</span>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add click outside to close
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                emailManager.closeSettings();
            }
        });
        
        document.body.appendChild(settingsModal);
    }

    closeSettings() {
        const modal = document.querySelector('.settings-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    updateSetting(key, value) {
        if (this.currentUser) {
            this.currentUser.settings[key] = value;
            const users = JSON.parse(localStorage.getItem('wongsAgentUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = this.currentUser;
                localStorage.setItem('wongsAgentUsers', JSON.stringify(users));
                localStorage.setItem('wongsAgentUser', JSON.stringify(this.currentUser));
            }
            this.showNotification('✅ SETTINGS UPDATED', 'success');
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

        if (diffMins < 1) return 'NOW';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    }

    getEmailPreview(body) {
        return body.substring(0, 100) + (body.length > 100 ? '...' : '');
    }

    updateCounts() {
        const inboxCount = this.emails.filter(e => e.folder === 'inbox' && !e.read).length;
        const totalCount = this.emails.length;
        const importantCount = this.emails.filter(e => e.isImportant).length;
        const todayCount = this.emails.filter(e => {
            const today = new Date().toDateString();
            return new Date(e.date).toDateString() === today;
        }).length;

        document.getElementById('inboxCount').textContent = inboxCount;
        document.getElementById('totalCount').textContent = totalCount;
        
        // 更新今日邮件计数
        const todayElement = document.querySelector('[data-folder="today"] .count');
        if (todayElement) todayElement.textContent = todayCount;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hide');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                notification.classList.remove('hide');
            }, 300);
        }, 4000);
    }

    // 模拟实时同步
    startPeriodicSync() {
        setInterval(() => {
            this.simulateNewEmails();
        }, 30000); // 每30秒检查新邮件
    }

    simulateNewEmails() {
        const hasNew = Math.random() > 0.8;
        if (hasNew) {
            const newEmails = [
                {
                    sender: 'notifications@github.com',
                    senderName: 'GitHub',
                    subject: '✅ PR merged: Feature branch',
                    body: 'Your pull request has been successfully merged!',
                    folder: 'inbox',
                    priority: 'normal',
                    category: 'work'
                },
                {
                    sender: 'alerts@bank.com',
                    senderName: 'Bank Alerts',
                    subject: '💳 Transaction: $45.99 at Amazon',
                    body: 'Transaction approved for $45.99 at Amazon.com',
                    folder: 'inbox',
                    priority: 'normal',
                    category: 'finance'
                }
            ];
            
            const randomEmail = newEmails[Math.floor(Math.random() * newEmails.length)];
            this.addEmail(randomEmail);
            this.showNotification('📧 NEW EMAIL ARRIVED', 'info');
        }
    }

    // 事件绑定增强
    bindEvents() {
        // 认证表单
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.login(email, password);
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirm').value;
            
            if (password !== confirm) {
                this.showNotification('❌ PASSWORDS DO NOT MATCH', 'error');
                return;
            }
            
            this.register(name, email, password);
        });

        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                e.target.classList.add('active');
                const formId = e.target.getAttribute('data-tab') + 'Form';
                document.getElementById(formId).classList.add('active');
            });
        });

        // 导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.hasAttribute('data-folder')) {
                    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    this.currentFolder = e.target.getAttribute('data-folder');
                    document.getElementById('currentFolderTitle').textContent = 
                        this.currentFolder === 'today' ? 'TODAY' : this.currentFolder.toUpperCase();
                    this.showInbox();
                }
            });
        });

        // 搜索和排序
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchEmails(e.target.value);
        });

        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortEmails(e.target.value);
        });

        // 写邮件
        document.getElementById('composeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = {
                sender: this.currentUser.email,
                senderName: this.currentUser.name,
                recipient: document.getElementById('composeTo').value,
                subject: document.getElementById('composeSubject').value,
                body: document.getElementById('composeBody').value,
                folder: 'sent',
                category: 'sent'
            };
            
            this.addEmail(email);
            this.closeCompose();
            this.showNotification('✅ MESSAGE SENT', 'success');
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        this.showCompose();
                        break;
                    case 'r':
                        e.preventDefault();
                        if (this.currentEmail) this.replyEmail();
                        break;
                    case 'Backspace':
                        e.preventDefault();
                        if (this.currentEmail) this.deleteEmail(this.currentEmail.id);
                        break;
                }
            }
        });
    }

    // 导航方法
    selectEmail(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (email) {
            this.currentEmail = email;
            this.renderEmailDetail(email);
        }
    }

    backToList() {
        document.getElementById('emailListSection').style.display = 'block';
        document.getElementById('emailDetailSection').style.display = 'none';
        this.currentEmail = null;
    }

    showToday() {
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('emailListSection').style.display = 'block';
        document.getElementById('emailDetailSection').style.display = 'none';
        this.currentFolder = 'today';
        document.getElementById('currentFolderTitle').textContent = 'TODAY';
        
        // 过滤今日邮件
        const today = new Date().toDateString();
        const emailList = document.getElementById('emailList');
        const todayEmails = this.emails.filter(e => 
            new Date(e.date).toDateString() === today
        );
        
        if (todayEmails.length === 0) {
            emailList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <h3>NO EMAILS TODAY</h3>
                    <p>Enjoy your clean inbox!</p>
                </div>
            `;
            return;
        }
        
        emailList.innerHTML = todayEmails.map(email => this.renderEmailItem(email)).join('');
    }
}

// 全局函数
function logout() {
    emailManager.logout();
}

function showInbox() {
    emailManager.showInbox();
}

function showToday() {
    emailManager.showToday();
}

function backToList() {
    emailManager.backToList();
}

function showCompose() {
    emailManager.showCompose();
}

function closeCompose() {
    emailManager.closeCompose();
}

function replyEmail() {
    emailManager.replyEmail();
}

function forwardEmail() {
    emailManager.forwardEmail();
}

function deleteEmail(emailId = null) {
    if (emailId) {
        emailManager.deleteEmail(emailId);
    } else if (emailManager.currentEmail) {
        emailManager.deleteEmail(emailManager.currentEmail.id);
    }
}

function saveDraft() {
    emailManager.saveDraft();
}

function showSettings() {
    emailManager.showSettings();
}

// 初始化应用
const emailManager = new WongsAgent();
