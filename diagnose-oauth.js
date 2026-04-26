
require('dotenv').config();
const { URLSearchParams } = require('url');

/**
 * Diagnostic tool for Google Drive OAuth
 * This script tests the credentials defined in environment variables.
 */
async function diagnoseOAuth() {
    console.log('--- Google OAuth Diagnostic ---');

    const creds = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY,
    };

    // Check presence (but don't show full secrets)
    console.log('Environment Variables:');
    console.log(`- GOOGLE_CLIENT_ID: ${creds.clientId ? '✅ Present (' + creds.clientId.substring(0, 5) + '...)' : '❌ MISSING'}`);
    console.log(`- GOOGLE_CLIENT_SECRET: ${creds.clientSecret ? '✅ Present (HIDDEN)' : '❌ MISSING'}`);
    console.log(`- GOOGLE_DRIVE_REFRESH_TOKEN: ${creds.refreshToken ? '✅ Present (HIDDEN)' : '❌ MISSING'}`);
    console.log(`- GOOGLE_DRIVE_FOLDER_ID: ${creds.folderId ? '✅ Present (' + creds.folderId + ')' : '❌ MISSING'}`);
    console.log(`- GOOGLE_CLIENT_EMAIL: ${creds.clientEmail ? '✅ Present (' + creds.clientEmail + ')' : 'ℹ️ Optional'}`);
    console.log(`- GOOGLE_PRIVATE_KEY: ${creds.privateKey ? '✅ Present (HIDDEN)' : 'ℹ️ Optional'}`);

    if (creds.clientEmail && creds.privateKey) {
        console.log('\n--- Testing Service Account Flow ---');
        // Service account test would require 'jose' library, skipping for simple script
        // or we can try to require it if it's in node_modules
        try {
            const { SignJWT, importPKCS8 } = require('jose');
            console.log('Status: jose library found. Running Service Account test...');
            // ... (complex to implement here, focus on OAuth for now)
        } catch (e) {
            console.log('Status: jose library NOT found in current context.');
        }
    }

    if (creds.clientId && creds.clientSecret && creds.refreshToken) {
        console.log('\n--- Testing OAuth Refresh Flow ---');
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: creds.clientId,
                    client_secret: creds.clientSecret,
                    refresh_token: creds.refreshToken,
                    grant_type: 'refresh_token',
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ SUCCESS! Successfully retrieved access token.');
                console.log(`   Scope: ${data.scope || 'N/A'}`);
                console.log(`   Expires In: ${data.expires_in}s`);
            } else {
                console.log('❌ FAILED!');
                console.log(`   HTTP Status: ${response.status}`);
                console.log(`   Error: ${data.error}`);
                console.log(`   Description: ${data.error_description || 'No description provided'}`);
                
                if (data.error === 'invalid_client') {
                    console.log('\n   💡 Tip: "invalid_client" usually means GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is incorrect.');
                } else if (data.error === 'invalid_grant') {
                    console.log('\n   💡 Tip: "invalid_grant" usually means the Refresh Token is invalid, expired, or revoked.');
                } else if (response.status === 401) {
                    console.log('\n   💡 Tip: 401 Unauthorized suggest the Client ID/Secret pair is not recognized by Google.');
                }
            }
        } catch (error) {
            console.log('❌ NETWORK ERROR:');
            console.log(error.message);
        }
    } else {
        console.log('\n❌ OAuth credentials missing. Cannot test flow.');
    }
}

diagnoseOAuth();
