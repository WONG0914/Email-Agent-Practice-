# Wong's Agent - Complete Email Management System
## 🎯 Your Personal Email Assistant

A comprehensive, production-ready email management system with retro aesthetics and modern functionality.

### 🚀 Quick Start

#### Option 1: Fresh Start (Clears Cache)
```javascript
// Add this to browser console or create a bookmark:
localStorage.setItem('wongsAgentClearCache', 'true');
window.location.reload();
```

#### Option 2: Normal Start (Keeps Data)
```bash
# Simply open in browser
open index.html
```

### 🎮 Features

#### ✅ Frontend Features
- **Complete Email Management**: Inbox, Sent, Drafts, Spam, Archive, Trash
- **Smart Views**: Today, Important, All emails
- **AI Summaries**: Automatic email content summarization
- **Real-time Search**: Instant filtering across all fields
- **Priority System**: Urgent/High/Normal/Low/Spam classification
- **Keyboard Shortcuts**: Ctrl+N (new), Ctrl+R (reply), etc.
- **Mobile Responsive**: Works on all screen sizes
- **Retro Design**: 2000s CRT monitor aesthetic

#### ✅ Backend Features
- **Gmail API Integration**: Full OAuth2 support
- **Smart Classification**: 20+ keywords for promotional detection
- **Auto Labeling**: Automatic "Promotional" labels
- **MySQL Database**: Persistent storage and analytics
- **Real-time Processing**: Background email classification

### 🧹 Cache Management

#### Automatic Cache Clearing
The system now supports automatic cache clearing on startup:

1. **Enable Cache Clearing**:
   ```javascript
   // Run this in browser console
   localStorage.setItem('wongsAgentClearCache', 'true');
   ```

2. **Reload the page** - All data will be cleared and fresh sample emails loaded

3. **Disable Cache Clearing**:
   ```javascript
   localStorage.setItem('wongsAgentClearCache', 'false');
   ```

#### Manual Cache Clearing
- **Clear All Data**: Use the settings panel → "Clear All Data" button
- **Reset to Factory**: Enable cache clearing and reload

### 📊 Database Schema
```sql
-- Core tables
- users: User accounts and settings
- emails: Email metadata and classification
- classification_rules: Keyword-based rules
- keyword_stats: Performance analytics
```

### 🔍 Smart Classification Keywords
```javascript
// High-confidence promotional keywords
const keywords = {
    'unsubscribe': 0.9,
    'promotion': 0.8,
    'sale': 0.8,
    'discount': 0.8,
    'limited time': 0.9,
    'special offer': 0.9,
    'coupon': 0.8,
    'newsletter': 0.6,
    'marketing': 0.8
};
```

### 🎨 Customization

#### Theme Options
- **Retro**: Classic green terminal aesthetic
- **Modern**: Clean, minimal design

#### Settings Panel
Access via sidebar → Settings to customize:
- AI email summaries
- Daily digest
- Promotional filtering
- Theme selection

### 📱 Usage Guide

#### Basic Navigation
- **Inbox**: Main email view
- **Today**: Today's emails only
- **Sent**: Outgoing messages
- **Drafts**: Unfinished messages
- **Important**: Starred messages
- **Spam**: Filtered promotional emails
- **Archive**: Archived messages
- **Trash**: Deleted messages

#### Keyboard Shortcuts
- `Ctrl+N`: New email
- `Ctrl+R`: Reply to current email
- `Backspace`: Delete current email
- `Esc`: Close modals

### 🛠️ Development

#### File Structure
```
wongs-agent/
├── index.html              # Main interface
├── styles.css              # Retro styling
├── script.js               # Frontend logic
├── gmail-auto-classifier.js # Backend API
├── get-token.js            # OAuth2 auth
├── database-setup.sql      # MySQL schema
├── package.json            # Dependencies
└── README.md               # This file
```

#### Cache Management Options

1. **Fresh Start Every Time**:
   ```javascript
   // Enable once
   localStorage.setItem('wongsAgentClearCache', 'true');
   // Now every reload will clear cache
   ```

2. **Keep Data Between Sessions**:
   ```javascript
   // Disable cache clearing
   localStorage.setItem('wongsAgentClearCache', 'false');
   ```

3. **One-time Clear**:
   ```javascript
   // Clear now and reset
   emailManager.clearAllCache();
   ```

### 🔄 Production Deployment

#### Frontend
```bash
# Static hosting - ready for Netlify, Vercel, GitHub Pages
# Simply upload all files
```

#### Backend
```bash
npm install
mysql -u root -p < database-setup.sql
npm run auth
npm start
```

### 🆘 Troubleshooting

#### Cache Issues
- **Data not clearing**: Check `localStorage.getItem('wongsAgentClearCache')`
- **Want fresh data**: Set cache clearing to true and reload
- **Lost settings**: Settings are preserved during cache clearing

#### Common Commands
```javascript
// Check current cache setting
console.log('Cache clearing:', localStorage.getItem('wongsAgentClearCache'));

// Force clear cache
emailManager.clearAllCache();

// Reset to factory defaults
localStorage.setItem('wongsAgentClearCache', 'true');
window.location.reload();
```

### 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify cache clearing settings
3. Ensure all dependencies are installed
4. Check Gmail API quotas

---

**Wong's Agent** - Your intelligent email companion with flexible cache management!
