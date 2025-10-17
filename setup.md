# Setup Guide - DagangCerdas

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Setup

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `dagangcerdas-[your-name]`
4. Disable Google Analytics (optional)
5. Click "Create project"

#### B. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

#### C. Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location (closest to your users)
5. Click "Done"

#### D. Setup Security Rules
1. In Firestore, go to "Rules" tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /sales/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

#### E. Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) 
4. Register app name: `dagangcerdas`
5. Copy the config object

#### F. Setup Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Test the Application
1. Open http://localhost:5173
2. Click "Daftar sekarang"
3. Create a test account
4. Add some products
5. Test the cashier system

## 📱 PWA Installation

### Test PWA Features
1. Open Chrome DevTools
2. Go to "Application" tab
3. Check "Service Workers"
4. Test "Add to Home Screen"

### Install on Mobile
1. Open the app in mobile browser
2. Look for "Add to Home Screen" prompt
3. Install like a native app

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Environment Variables in Vercel
Add these in your Vercel project settings:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 🔧 Troubleshooting

### Common Issues

#### Firebase Connection Error
- Check if all environment variables are set
- Verify Firebase project is active
- Check browser console for detailed errors

#### Authentication Not Working
- Ensure Email/Password is enabled in Firebase Auth
- Check if domain is authorized in Firebase Auth settings

#### Firestore Permission Denied
- Verify security rules are published
- Check if user is authenticated
- Ensure userId field matches authenticated user

#### PWA Not Installing
- Check if app is served over HTTPS
- Verify manifest.json is accessible
- Check service worker registration

### Debug Mode
Add this to see Firebase config:
```javascript
console.log('Firebase Config:', firebaseConfig);
```

## 📊 Sample Data

### Test Products
```javascript
// Add these products for testing
[
  {
    nama: "Indomie Goreng",
    harga: 3500,
    stok: 50,
    kategori: "Makanan",
    batchSize: 40,
    satuan: "pcs"
  },
  {
    nama: "Aqua 600ml",
    harga: 3000,
    stok: 24,
    kategori: "Minuman",
    batchSize: 24,
    satuan: "botol"
  },
  {
    nama: "Beras Premium",
    harga: 15000,
    stok: 10,
    kategori: "Sembako",
    batchSize: 1,
    satuan: "kg"
  }
]
```

## 🎯 Next Steps

1. **Customize Branding**: Update colors in `tailwind.config.js`
2. **Add More Features**: Extend with customer management, reports
3. **Optimize Performance**: Add image optimization, lazy loading
4. **Analytics**: Integrate Google Analytics or Vercel Analytics
5. **Backup**: Setup automated Firestore backups

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at browser console errors
3. Check Firebase console for errors
4. Create an issue on GitHub

Happy coding! 🚀
