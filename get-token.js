// Wong's Agent - Gmail API Token Generator
// Run this script to get OAuth2 token for Gmail API

const { google } = require('googleapis');
const fs = require('fs').promises;
const readline = require('readline');

// 创建读取接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function getToken() {
    try {
        // 读取credentials.json
        const credentials = JSON.parse(await fs.readFile('credentials.json', 'utf8'));
        const { client_secret, client_id, redirect_uris } = credentials.installed;

        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        // 生成认证URL
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/gmail.modify',
                'https://www.googleapis.com/auth/gmail.labels'
            ],
        });

        console.log('🔐 Please visit this URL to authorize the application:');
        console.log(authUrl);
        console.log('\nAfter authorization, copy the code from the URL and paste it here:');

        rl.question('Enter the authorization code: ', async (code) => {
            try {
                const { tokens } = await oAuth2Client.getToken(code);
                await fs.writeFile('token.json', JSON.stringify(tokens, null, 2));
                console.log('✅ Token saved to token.json');
                console.log('You can now run: node gmail-auto-classifier.js');
            } catch (error) {
                console.error('Error retrieving access token:', error);
            } finally {
                rl.close();
            }
        });

    } catch (error) {
        console.error('Error:', error);
        rl.close();
    }
}

getToken();
