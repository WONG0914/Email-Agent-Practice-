-- Wong's Agent - MySQL Database Setup
-- Complete database schema for email classification system

-- 创建数据库
CREATE DATABASE IF NOT EXISTS wongs_agent;
USE wongs_agent;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 邮件表
CREATE TABLE IF NOT EXISTS emails (
    id VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255),
    user_id INT,
    subject TEXT,
    sender VARCHAR(255),
    recipient VARCHAR(255),
    body TEXT,
    received_date DATETIME,
    is_promotional BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    label_applied VARCHAR(100),
    category VARCHAR(50),
    confidence_score FLOAT DEFAULT 0.0,
    processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_received_date (received_date),
    INDEX idx_category (category),
    INDEX idx_promotional (is_promotional)
);

-- 分类规则表
CREATE TABLE IF NOT EXISTS classification_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(100) UNIQUE,
    category VARCHAR(50) NOT NULL,
    confidence_score FLOAT DEFAULT 0.8,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- 标签表
CREATE TABLE IF NOT EXISTS labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 邮件标签关联表
CREATE TABLE IF NOT EXISTS email_labels (
    email_id VARCHAR(255),
    label_id INT,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (email_id, label_id),
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- 关键词统计表
CREATE TABLE IF NOT EXISTS keyword_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(100),
    category VARCHAR(50),
    match_count INT DEFAULT 0,
    last_matched TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword),
    INDEX idx_category (category)
);

-- 分类统计表
CREATE TABLE IF NOT EXISTS classification_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    total_emails INT DEFAULT 0,
    promotional_count INT DEFAULT 0,
    important_count INT DEFAULT 0,
    processed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- 插入默认分类规则
INSERT IGNORE INTO classification_rules (keyword, category, confidence_score) VALUES
('unsubscribe', 'promotional', 0.9),
('promotion', 'promotional', 0.8),
('sale', 'promotional', 0.8),
('discount', 'promotional', 0.8),
('offer', 'promotional', 0.7),
('deal', 'promotional', 0.7),
('limited time', 'promotional', 0.9),
('special offer', 'promotional', 0.9),
('coupon', 'promotional', 0.8),
('free shipping', 'promotional', 0.7),
('newsletter', 'promotional', 0.6),
('marketing', 'promotional', 0.8),
('advertisement', 'promotional', 0.9),
('sponsor', 'promotional', 0.7),
('black friday', 'promotional', 0.9),
('cyber monday', 'promotional', 0.9),
('clearance', 'promotional', 0.8),
('flash sale', 'promotional', 0.8),
('urgent', 'important', 0.9),
('important', 'important', 0.8),
('asap', 'important', 0.8),
('deadline', 'important', 0.9),
('meeting', 'important', 0.7),
('reminder', 'important', 0.6);

-- 插入默认标签
INSERT IGNORE INTO labels (name, color, description, is_system) VALUES
('Promotional', '#ff6b6b', 'Marketing and promotional emails', TRUE),
('Important', '#4ecdc4', 'High priority emails', TRUE),
('Social', '#45b7d1', 'Social media notifications', TRUE),
('Updates', '#96ceb4', 'App and service updates', TRUE),
('Finance', '#feca57', 'Financial and banking emails', TRUE),
('Shopping', '#ff9ff3', 'Shopping and e-commerce', TRUE);

-- 创建视图用于统计
CREATE OR REPLACE VIEW daily_classification_summary AS
SELECT 
    DATE(received_date) as date,
    COUNT(*) as total_emails,
    SUM(CASE WHEN is_promotional = 1 THEN 1 ELSE 0 END) as promotional_emails,
    SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) as important_emails,
    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_emails,
    AVG(confidence_score) as avg_confidence_score
FROM emails
GROUP BY DATE(received_date)
ORDER BY date DESC;

-- 创建存储过程用于更新统计
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS update_classification_stats(IN target_date DATE)
BEGIN
    INSERT INTO classification_stats (date, total_emails, promotional_count, important_count, processed_count)
    SELECT 
        target_date,
        COUNT(*),
        SUM(CASE WHEN is_promotional = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN label_applied IS NOT NULL THEN 1 ELSE 0 END)
    FROM emails
    WHERE DATE(received_date) = target_date
    ON DUPLICATE KEY UPDATE
        total_emails = VALUES(total_emails),
        promotional_count = VALUES(promotional_count),
        important_count = VALUES(important_count),
        processed_count = VALUES(processed_count);
END//
DELIMITER ;

-- 创建触发器用于自动更新关键词统计
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_keyword_stats
AFTER INSERT ON emails
FOR EACH ROW
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE keyword VARCHAR(100);
    DECLARE cur CURSOR FOR SELECT keyword FROM classification_rules WHERE category = 'promotional';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO keyword;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        IF LOWER(NEW.subject) LIKE CONCAT('%', keyword, '%') OR LOWER(NEW.body) LIKE CONCAT('%', keyword, '%') THEN
            INSERT INTO keyword_stats (keyword, category, match_count)
            VALUES (keyword, 'promotional', 1)
            ON DUPLICATE KEY UPDATE 
                match_count = match_count + 1,
                last_matched = CURRENT_TIMESTAMP;
        END IF;
    END LOOP;
    CLOSE cur;
END//
DELIMITER ;

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_emails_user_date ON emails(user_id, received_date);
CREATE INDEX IF NOT EXISTS idx_emails_category_date ON emails(category, received_date);
CREATE INDEX IF NOT EXISTS idx_emails_promotional ON emails(is_promotional, received_date);

-- 插入示例用户
INSERT IGNORE INTO users (email, name) VALUES
('demo@wongsagent.com', 'Demo User');

-- 显示创建结果
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created:' as info, 
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'wongs_agent') as table_count;

-- 显示默认规则
SELECT 'Default classification rules:' as info;
SELECT keyword, category, confidence_score FROM classification_rules LIMIT 10;
