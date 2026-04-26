# Google API Upload Error 404 - Diagnostic Report

## Summary
The "Google API Upload Error: 404" can occur for several reasons. I've tested and verified the Google Drive connection locally, and it works perfectly. Here are the most likely causes and solutions:

## Diagnostic Test Results
✅ **Google Drive Folder**: Accessible (Status 200)
✅ **Google Drive Upload**: Working (Status 200)  
✅ **Credentials**: Valid and properly configured
✅ **Folder ID**: Correct (1GuXRTz8idMNHV99IhTtUDaxEMlGGInTJ)

## Possible Causes of 404 Error

### 1. **Missing Required Fields (Most Common)**
The upload fails if any of these are missing:
- `code` - Course code (e.g., CS101, ACC311)
- `title` - File title/name
- `type` - Category (e.g., "Midterm Files", "Final Term Files")
- `file` - The actual file

**Solution**: Ensure the upload form sends all fields:
```javascript
const formData = new FormData();
formData.append('code', 'CS301');      // ✓ Required
formData.append('title', 'Midterm');   // ✓ Required
formData.append('type', 'Midterm Files'); // ✓ Required
formData.append('file', fileObject);   // ✓ Required
```

### 2. **API Route Not Registered (on Vercel)**
Sometimes the `/api/upload` route isn't properly deployed.

**Solution**: 
- Check that `app/api/upload/route.ts` exists
- Verify the file exports `POST` function
- Redeploy to Vercel: `git push`

### 3. **Invalid File Object**
Empty files or corrupted file objects cause issues.

**Solution**:
```javascript
if (!file || file.size === 0) {
    console.error('Invalid file');
    return;
}
```

### 4. **Google Refresh Token Expired**
The refresh token in `.env.local` might be invalid.

**Solution**:
If you see "Google OAuth Error" messages:
1. Generate a new refresh token:
   - Go to Google Cloud Console
   - Create a new OAuth 2.0 credentials (Desktop app)
   - Update GOOGLE_CLIENT_ID and CLIENT_SECRET
   - Run the auth flow to get a new refresh token

### 5. **Vercel Environment Variables Not Set**
The `.env.local` file is local-only and won't work on Vercel.

**Solution**:
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all these:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_DRIVE_REFRESH_TOKEN
   - GOOGLE_DRIVE_FOLDER_ID
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

## How to Debug

### Step 1: Check Browser Console
Open DevTools → Console and look for errors with the upload request

### Step 2: Test the API Endpoint
```bash
# Test if API is accessible
curl https://yoursite.vercel.app/api/upload

# Should return: {"status":"ok","message":"Upload API is working",...}
```

### Step 3: Check Vercel Logs
```
Vercel Dashboard → Your Project → Deployments → Recent deployment → Logs
```

Look for `[UPLOAD-xxx]` messages showing:
- ✅ Request received
- ✅ FormData parsed
- ✅ Buffer created
- ✅ Drive upload
- ✅ Complete

### Step 4: Test Upload Locally
Run locally first if possible:
```bash
npm run dev
# Visit http://localhost:3000/upload
# Try uploading a file
# Check terminal for [UPLOAD-xxx] logs
```

## Improved Error Handling (Already Applied)

I've enhanced the upload system with:

1. **Detailed Request ID Tracking** - Each upload gets a unique ID for tracing
2. **Better Error Messages** - Shows exactly what's missing
3. **GET Health Check** - Test if `/api/upload` is working: `GET /api/upload`
4. **Response Code Logging** - Shows the actual HTTP status and error details
5. **Validation Details** - Lists which fields are missing

## Expected Success Response
```json
{
  "success": true,
  "message": "Upload successful",
  "fileId": "1abc23def456...",
  "requestId": "a1b2c3d4e5",
  "duration": 2345
}
```

## Expected Error Response
```json
{
  "success": false,
  "error": "Missing required fields: code, title",
  "requestId": "a1b2c3d4e5"
}
```

## Next Steps

1. **Check your current error message** - Does it show missing fields, network error, or 404?
2. **Verify environment variables** - Use the test endpoints to confirm
3. **Check Vercel logs** - If deployed, look at the actual error
4. **Test locally** - Run `npm run dev` and test the upload locally

Run the diagnostic tests created: `node diagnose-404.js`

This will show you exactly where the problem is.
