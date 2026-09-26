# ECO CHALLENGE v2.1 — CROSS-PLATFORM MOBILE EXPORT GUIDE (IOS & ANDROID)

This documentation provides the complete, production-ready Capacitor setup, platform-specific build instructions, and security permissions to export **Eco Challenge v2.1** into native **iOS (IPA)** and **Android (APK/AAB)** applications.

---

## 1. CAPACITOR CROSS-PLATFORM INITIALIZATION & PLUGINS

### A. Install Core Dependencies
Run the following in the project root:

```bash
# 1. Install Capacitor CLI and Core runtime
npm install @capacitor/core @capacitor/cli

# 2. Initialize Capacitor project
# For Vite/React (standard in this repo):
npx cap init "Eco Challenge" com.ecochallenge.app --web-dir dist

# (If using Next.js static output 'out', use --web-dir out)
```

### B. Add Native Platforms (iOS & Android)
```bash
# Install platform runtimes
npm install @capacitor/android @capacitor/ios

# Scaffold native platform folders
npx cap add android
npx cap add ios
```

### C. Install Native Hardware Plugins
Essential plugins for camera proofs (Karin AI verification), voice notes, arcade haptics, and device storage:
```bash
npm install @capacitor/camera @capacitor/device @capacitor/filesystem @capacitor/haptics
```

---

## 2. CONFIGURATION FILES

### `capacitor.config.ts` (Already in root)
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecochallenge.app',
  appName: 'Eco Challenge',
  webDir: 'dist', // or 'out' for Next.js static export
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
  },
  plugins: {
    Camera: {
      saveToGallery: false,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#062316',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#062316',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
};

export default config;
```

### `next.config.js` (For Static Next.js Export)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    NEXT_PUBLIC_APP_VERSION: 'v2.1',
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
```

---

## 3. ANDROID BUILD & APK / AAB WORKFLOW

### Step 1: Build & Sync
```bash
# Build the production bundle
npm run build

# Sync assets and plugins to android project
npx cap sync android

# Open project in Android Studio
npx cap open android
```

### Step 2: Configure Android Permissions in `android/app/src/main/AndroidManifest.xml`
Ensure the following permissions and features are present inside `<manifest>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network & Internet Access for Supabase & Gemini AI -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera Evidence Proofs for Karin Quests -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Squad Voice Notes & Audio Recording -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- File Storage Access -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>
</manifest>
```

### Step 3: Compile APK / AAB in Android Studio
1. In Android Studio, wait for Gradle sync to complete.
2. For testing APK: Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Locate the output at `android/app/build/outputs/apk/debug/app-debug.apk`.
3. For Google Play Release (AAB):
   - Navigate to **Build > Generate Signed Bundle / APK**.
   - Select **Android App Bundle (.aab)**.
   - Choose or create your production Keystore file (`eco-release-key.jks`).
   - Select `release` variant and build the signed bundle.

---

## 4. IOS BUILD & IPA EXPORT WORKFLOW (MACOS REQUIRED)

### Step 1: Build & Sync
```bash
# Build web assets
npm run build

# Sync assets and native plugins to iOS project
npx cap sync ios

# Open project in Xcode
npx cap open ios
```

### Step 2: Configure Privacy Descriptions in `ios/App/App/Info.plist`
Apple requires explicit privacy usage strings. Open `ios/App/App/Info.plist` and add:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Details -->
    <key>CFBundleDisplayName</key>
    <string>Eco Challenge</string>
    <key>CFBundleIdentifier</key>
    <string>com.ecochallenge.app</string>
    <key>CFBundleShortVersionString</key>
    <string>2.1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>

    <!-- Camera Permission (Karin AI Quest Verification) -->
    <key>NSCameraUsageDescription</key>
    <string>Eco Challenge needs camera access so you can photograph your eco-actions and submit verification proofs to Karin AI.</string>

    <!-- Photo Library Permission (Feed & Avatar Uploads) -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Eco Challenge needs photo library access so you can choose images for community feed posts and quest evidence.</string>
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Eco Challenge saves your challenge badges and achievement cards to your photo library.</string>

    <!-- Microphone Permission (Squad Voice Notes) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Eco Challenge needs microphone access to record and send voice messages in Squad chats.</string>

    <!-- UI Configuration -->
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleLightContent</string>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
</dict>
</plist>
```

### Step 3: Configure Signing & Archive in Xcode
1. In Xcode, select the **App** target in the left sidebar.
2. Go to **Signing & Capabilities**:
   - Check **Automatically manage signing**.
   - Select your **Apple Developer Team**.
   - Verify the Bundle Identifier: `com.ecochallenge.app`.
3. Connect a physical iPhone or select an iOS Simulator (e.g., iPhone 15 Pro).
4. Press `Cmd + R` to run and test on device.
5. For App Store / TestFlight distribution:
   - Select **Any iOS Device (arm64)** from the device target dropdown.
   - Click **Product > Archive**.
   - When the Xcode Organizer opens, click **Distribute App > App Store Connect** to upload directly to TestFlight and the App Store.

---

## 5. SUMMARY OF TERMINAL COMMANDS CHEAT SHEET

| Task | Command |
|---|---|
| Initialize Capacitor | `npx cap init "Eco Challenge" com.ecochallenge.app --web-dir dist` |
| Add Android | `npm i @capacitor/android && npx cap add android` |
| Add iOS | `npm i @capacitor/ios && npx cap add ios` |
| Install Plugins | `npm i @capacitor/camera @capacitor/device @capacitor/filesystem` |
| Rebuild & Sync | `npm run build && npx cap sync` |
| Open Android Studio | `npx cap open android` |
| Open Xcode | `npx cap open ios` |
| Run directly on Android | `npx cap run android` |
| Run directly on iOS | `npx cap run ios` |
