// Wong's Agent - Gmail API Auto Classifier
// Node.js script for automatic promotional email classification

const { google } = require('googleapis');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

class GmailAutoClassifier {
    constructor() {
        this.gmail = null;
        this.db = null;
        this.promotionalKeywords = [
            'unsubscribe', 'promotion', 'sale', 'discount', 'offer', 'deal',
            'limited time', 'special offer', 'coupon', 'free shipping',
            'newsletter', 'marketing', 'advertisement', 'sponsor',
            'black friday', 'cyber monday', 'clearance', 'flash sale'
        ];
    }

    async initialize() {
        await this.setupDatabase();
        await this.authenticateGmail();
    }

    // 1. API认证流程
    async authenticateGmail() {
        const credentials = JSON.parse(await fs.readFile('credentials.json', 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        
        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        // 检查是否有token
        try {
            const token = JSON.parse(await fs.readFile('token.json', 'utf8'));
            oAuth2Client.setCredentials(token);
        } catch (error) {
            console.log('Please run: node get-token.js to authenticate');
            process.exit(1);
        }

        this.gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        console.log('✅ Gmail API authenticated successfully');
    }

    // 2. MySQL数据库设置
    async setupDatabase() {
        this.db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'password',
            database: 'wongs_agent'
        });

        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS emails (
                id VARCHAR(255) PRIMARY KEY,
                thread_id VARCHAR(255),
                subject TEXT,
                sender VARCHAR(255),
                recipient VARCHAR(255),
                body TEXT,
                received_date DATETIME,
                is_promotional BOOLEAN DEFAULT FALSE,
                label_applied VARCHAR(100),
                processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS classification_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                keyword VARCHAR(100) UNIQUE,
                category VARCHAR(50),
                confidence_score FLOAT,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 插入默认关键词规则
        for (const keyword of this.promotionalKeywords) {
            await this.db.execute(
                'INSERT IGNORE INTO classification_rules (keyword, category, confidence_score) VALUES (?, ?, ?)',
                [keyword, 'promotional', 0.8]
            );
        }

        console.log('✅ Database setup completed');
    }

    // 3. 关键词过滤逻辑
    async classifyEmail(emailData) {
        const { subject, body } = emailData;
        const text = `${subject} ${body}`.toLowerCase();
        
        let score = 0;
        const matchedKeywords = [];

        // 从数据库获取关键词规则
        const [rules] = await this.db.execute(
            'SELECT keyword, confidence_score FROM classification_rules WHERE category = ?',
            ['promotional']
        );

        for (const rule of rules) {
            if (text.includes(rule.keyword.toLowerCase())) {
                score += rule.confidence_score;
                matchedKeywords.push(rule.keyword);
            }
        }

        const isPromotional = score >= 1.0;
        
        return {
            isPromotional,
            confidence: Math.min(score, 1.0),
            matchedKeywords
        };
    }

    // 4. 打标签功能
    async applyLabel(messageId, labelName) {
        try {
            // 检查标签是否存在
            const labels = await this.gmail.users.labels.list({ userId: 'me' });
            let label = labels.data.labels.find(l => l.name === labelName);

            if (!label) {
                // 创建新标签
                const newLabel = await this.gmail.users.labels.create({
                    userId: 'me',
                    requestBody: {
                        name: labelName,
                        labelListVisibility: 'labelShow',
                        messageListVisibility: 'show'
                    }
                });
                label = newLabel.data;
            }

            // 应用标签
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    addLabelIds: [label.id]
                }
            });

            console.log(`✅ Applied label "${labelName}" to message ${messageId}`);
            return label.id;
        } catch (error) {
            console.error('Error applying label:', error);
            throw error;
        }
    }

    // 主处理流程
    async processInbox() {
        try {
            console.log('🔄 Starting email classification...');
            
            // 获取未读邮件
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 50
            });

            if (!response.data.messages) {
                console.log('📭 No unread messages found');
                return;
            }

            for (const message of response.data.messages) {
                await this.processMessage(message.id);
            }

            console.log('✅ Classification completed');
        } catch (error) {
            console.error('Error processing inbox:', error);
        }
    }

    async processMessage(messageId) {
        try {
            // 获取邮件详情
            const message = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId
            });

            const headers = message.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const sender = headers.find(h => h.name === 'From')?.value || '';
            const recipient = headers.find(h => h.name === 'To')?.value || '';

            // 获取邮件正文
            let body = '';
            if (message.data.payload.parts) {
                for (const part of message.data.payload.parts) {
                    if (part.body.data) {
                        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
                    }
                }
            } else if (message.data.payload.body.data) {
                body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
            }

            // 分类邮件
            const classification = await this.classifyEmail({ subject, body });

            if (classification.isPromotional) {
                // 应用促销标签
                const labelId = await this.applyLabel(messageId, 'Promotional');
                
                // 保存到数据库
                await this.db.execute(
                    `INSERT INTO emails (id, thread_id, subject, sender, recipient, body, 
                     received_date, is_promotional, label_applied) 
                     VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), ?, ?)`,
                    [
                        messageId,
                        message.data.threadId,
                        subject,
                        sender,
                        recipient,
                        body.substring(0, 1000), // 限制长度
                        Math.floor(message.data.internalDate / 1000),
                        true,
                        'Promotional'
                    ]
                );

                console.log(`📧 Classified "${subject.substring(0, 50)}..." as promotional`);
            }
        } catch (error) {
            console.error(`Error processing message ${messageId}:`, error);
        }
    }

    // 获取分类统计
    async getClassificationStats() {
        const [stats] = await this.db.execute(`
            SELECT 
                COUNT(*) as total_processed,
                SUM(CASE WHEN is_promotional = 1 THEN 1 ELSE 0 END) as promotional_count,
                DATE(received_date) as date
            FROM emails
            GROUP BY DATE(received_date)
            ORDER BY date DESC
            LIMIT 7
        `);
        return stats;
    }

    // 关闭连接
    async close() {
        if (this.db) {
            await this.db.end();
        }
    }
}

// 使用示例
async function main() {
    const classifier = new GmailAutoClassifier();
    
    try {
        await classifier.initialize();
        await classifier.processInbox();
        
        // 显示统计
        const stats = await classifier.getClassificationStats();
        console.log('📊 Classification Stats:', stats);
        
    } catch (error) {
        console.error('Main error:', error);
    } finally {
        await classifier.close();
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

module.exports = GmailAutoClassifier;
