# Firebase Setup Instructions for Soccer Slang Dictionary

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Enter project name: `soccer-slang-dictionary` (or any name you prefer)
4. Click "Continue"
5. Disable Google Analytics (optional, not needed for this project)
6. Click "Create Project"

## Step 2: Enable Realtime Database

1. In the Firebase Console, click on "Build" in the left sidebar
2. Click "Realtime Database"
3. Click "Create Database"
4. Select location: Choose the closest to your users (e.g., `us-central1`)
5. **Start in TEST MODE** (for now, we'll secure it later)
6. Click "Enable"

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app name: `Soccer Slang Web App`
6. Click "Register app"
7. **COPY the Firebase configuration code** - it will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Update soccer_slang.html with Your Firebase Config

1. Open `soccer_slang.html`
2. Find the comment `<!-- REPLACE WITH YOUR FIREBASE CONFIG -->`
3. Replace the placeholder config with YOUR actual Firebase config from Step 3

```javascript
// Replace this:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// With YOUR actual config
```

## Step 5: Set Up Database Security Rules (Important!)

1. In Firebase Console, go to "Realtime Database"
2. Click on the "Rules" tab
3. Replace the rules with this:

```json
{
  "rules": {
    ".read": true,
    "pendingSubmissions": {
      ".write": true
    },
    "approvedSubmissions": {
      ".write": "auth != null || root.child('adminKey').val() === 'YOUR_SECRET_ADMIN_KEY_HERE'"
    },
    "rejectedSubmissions": {
      ".write": "auth != null || root.child('adminKey').val() === 'YOUR_SECRET_ADMIN_KEY_HERE'"
    }
  }
}
```

**Note:** For better security, you should:
- Replace `YOUR_SECRET_ADMIN_KEY_HERE` with a strong password
- Eventually implement Firebase Authentication for admin access

4. Click "Publish"

## Step 6: Test the Website

1. Open your website in a browser
2. Try submitting a new slang term
3. Open the website on a different device or browser
4. You should see the same data synchronized!

## Step 7: Admin Access

To access the admin panel:
1. Add `?admin=true` to your URL
   Example: `http://localhost:8000/soccer_slang.html?admin=true`
2. You can approve/reject submissions
3. All changes will be visible to all users in real-time!

## Troubleshooting

### Data not syncing?
- Check browser console for errors (F12 → Console tab)
- Verify your Firebase config is correct
- Check if Realtime Database is created and enabled

### Can't write to database?
- Check Database Rules are set correctly
- Make sure you're in TEST MODE or have proper rules

### Still having issues?
- Check Firebase Console → Realtime Database → Data tab to see if data is being written
- Look at the "Usage" tab to see if requests are going through

## Cost

Firebase Realtime Database free tier includes:
- 1 GB storage
- 10 GB/month data transfer
- 100 simultaneous connections

This is more than enough for a small to medium-sized website!

