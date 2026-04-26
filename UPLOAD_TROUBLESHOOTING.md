# Fixing Google API Upload Error 404

## Quick Diagnosis Checklist

### ❌ If you see "Google API Upload Error: 404"

Check these in order (most common first):

#### 1. **Verify All Required Fields Sent** 
```javascript
// Check browser console logs - should show these values:
// ✓ code: "CS301"
// ✓ title: "Midterm Exam"  
// ✓ type: "Midterm Files"
// ✓ file: File object with size > 0
```

#### 2. **Check Environment Variables on Vercel**
1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Verify these exist:
   - `GOOGLE_DRIVE_FOLDER_ID` = `1GuXRTz8idMNHV99IhTtUDaxEMlGGInTJ`
   - `GOOGLE_CLIENT_ID` = populated
   - `GOOGLE_CLIENT_SECRET` = populated
   - `GOOGLE_DRIVE_REFRESH_TOKEN` = populated
   - `SUPABASE_URL` = `https://jzqwwypguvbffifyormg.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = populated

#### 3. **Test the API Health Check**
Open browser console and run:
```javascript
fetch('/api/upload')
  .then(r => r.json())
  .then(d => console.log(d))
```

Should return:
```
{
  "status": "ok",
  "message": "Upload API is working",
  "timestamp": "2026-03-08T22:30:00.000Z"
}
```

If 404→ API route not deployed, redeploy with `git push`

#### 4. **Check Vercel Function Logs**
1. Go to Vercel Dashboard
2. Recent Deployment → Logs
3. Look for messages starting with `[UPLOAD-`
4. Should show progression:
   - `[UPLOAD-xxxx] Request received`
   - `[UPLOAD-xxxx] Parsed FormData`
   - `[UPLOAD-xxxx] Buffer created`
   - `[UPLOAD-xxxx] Starting Google Drive upload`
   - `[UPLOAD-xxxx] ✅ Drive upload successful`
   - `[UPLOAD-xxxx] Saving to Supabase`
   - `[UPLOAD-xxxx] ✅ COMPLETE`

#### 5. **If Google Drive Error**
Check the error message in logs:
- `Google OAuth Error` → Refresh token expired or invalid
- `Google API Error (401)` → Access token problem
- `Google API Error (403)` → Folder not shared with service account
- `Google API Error (404)` → Folder ID wrong or deleted

## What the Upload API Returns

### Success (200)
```json
{
  "success": true,
  "message": "Upload successful",
  "fileId": "1abc23def456...",
  "requestId": "a1b2c3d4",
  "duration": 2345
}
```

### Error (400)
```json
{
  "success": false,
  "error": "Missing required fields: code, title",
  "requestId": "a1b2c3d4"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Google Drive upload failed: reason here",
  "requestId": "a1b2c3d4",
  "duration": 5000
}
```

## Root Causes & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | API route not deployed | `git push` to redeploy |
| Missing fields: code | Code field not sent | Edit file code before upload |
| Missing fields: title | Title field not sent | File title not entered |
| Missing fields: type | Category not selected | Select category from dropdown |
| Missing fields: file | File object invalid | Check file size > 0 |
| Google OAuth Error | Refresh token expired | Generate new token in Google Console |
| Google API Error (403) | No folder access | Share folder with service account |
| Google API Error (404) | Folder doesn't exist | Use correct folder ID |

## How Environment Variables Work

- **Local** (`npm run dev`): Uses `.env.local` file
- **Vercel** (Production): Uses Environment Variables in dashboard

### Setting Up Vercel Env Vars

```bash
# Option 1: Vercel Dashboard (easier)
1. Go to Vercel Dashboard
2. Select project
3. Settings → Environment Variables
4. Add each variable

# Option 2: Vercel CLI
vercel env add GOOGLE_DRIVE_FOLDER_ID
# Enter: 1GuXRTz8idMNHV99IhTtUDaxEMlGGInTJ
```

## Testing Improvements

The upload API now provides:

✅ **Health Check** - GET `/api/upload` returns status
✅ **Request Tracking** - Each upload has unique ID in logs
✅ **Detailed Validation** - Shows which fields are missing
✅ **Error Context** - Includes HTTP status and error details
✅ **Response Timing** - Duration in milliseconds

## Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Go to upload page
# http://localhost:3000/upload

# 3. Open DevTools Console (F12)

# 4. Try uploading a file
# Watch for [UPLOAD-xxxx] messages in terminal

# 5. Check response in Network tab
# POST /api/upload should show requestId
```

## If Still Getting 404

1. **Check if it's the endpoint** (404 on `/api/upload`)
   - Verify file exists: `app/api/upload/route.ts`
   - Check it exports `POST` function
   - Redeploy: `git push` then wait for Vercel build

2. **Check if it's Google Drive** (404 from Google API)
   - Run test: Create file with this content:
     ```javascript
     // Test Google Drive connection
     const id = "1GuXRTz8idMNHV99IhTtUDaxEMlGGInTJ";
     // Verify folder exists in Google Drive web UI
     // URL: drive.google.com/drive/folders/[the ID]
     ```
   - If folder missing, create new folder and update GOOGLE_DRIVE_FOLDER_ID

## Contact Support

If you still see 404 after checking all above:
1. Share the exact error from browser console
2. Share the [UPLOAD-xxxx] log messages from Vercel
3. Share which of the 5 checks above are passing/failing

---

**Last Update**: March 8, 2026  
**Upload API Version**: Improved with request tracking and detailed error messages
