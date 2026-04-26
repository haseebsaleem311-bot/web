
require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

/**
 * Helper to generate a Google Drive Refresh Token
 * Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in your .env or shell.
 */
async function generateToken() {
    console.log('--- Google Refresh Token Generator ---');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your environment.');
        console.log('   Tip: You can run: $env:GOOGLE_CLIENT_ID="your_id"; $env:GOOGLE_CLIENT_SECRET="your_secret"; node generate-token.js');
        process.exit(1);
    }

    // Note: The redirect URI must be one registered in your Google Cloud Console.
    // http://localhost:3000 is common for dev, or you can use "postmessage"
    const redirectUri = 'https://developers.google.com/oauthplayground'; 
    
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
        prompt: 'consent' // This is required to get a refresh_token every time
    });

    console.log('\n1. Authorize this app by visiting this url:');
    console.log('\x1b[36m%s\x1b[0m', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('\n2. After authorizing, you will be redirected to a URL. \n   Paste the "code" parameter from that URL here: ', (code) => {
        rl.close();
        
        // If the user pasted the whole URL, extract the code
        let finalCode = code;
        if (code.includes('code=')) {
            const url = new URL(code);
            finalCode = url.searchParams.get('code');
        }

        oAuth2Client.getToken(finalCode, (err, token) => {
            if (err) {
                console.error('❌ Error retrieving access token:', err.message);
                return;
            }
            
            console.log('\n✅ Success!');
            console.log('\nYour Refresh Token is:');
            console.log('\x1b[32m%s\x1b[0m', token.refresh_token);
            console.log('\nUpdate your GOOGLE_DRIVE_REFRESH_TOKEN variable with this value.');
            
            if (!token.refresh_token) {
                console.log('\n⚠️  WARNING: No refresh token returned. This happens if you already authorized');
                console.log('   the app previously without revoking access. Try visiting:');
                console.log('   https://myaccount.google.com/permissions');
                console.log('   and remove your app\'s access, then run this script again.');
            }
        });
    });
}

generateToken();
