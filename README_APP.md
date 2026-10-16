# Price Alerter 🛒🔔 - Native Android App & Web Backend

A smart shopping assistant and price alert app that tracks prices across Amazon, Flipkart, Myntra, and more.

---

## ✨ What's New & Included

### 1. 🎨 Modern App Logo & Visual Identity
- **Custom Adaptive Launcher Icon**: Sleek shopping bell with radiant sound waves and emerald price-drop discount shield ([`ic_launcher_foreground.xml`](file:///Users/lakkireddyvenkatamadhavareddy/Downloads/pricealerter/app/src/main/res/drawable/ic_launcher_foreground.xml), [`ic_launcher_background.xml`](file:///Users/lakkireddyvenkatamadhavareddy/Downloads/pricealerter/app/src/main/res/drawable/ic_launcher_background.xml)).
- **In-App Logo**: Vector badge for toolbar and dialogs ([`logo_price_alerter.xml`](file:///Users/lakkireddyvenkatamadhavareddy/Downloads/pricealerter/app/src/main/res/drawable/logo_price_alerter.xml)).

### 2. 📱 Premium Native Android Interface
- **Bottom Navigation Bar** with 4 core views:
  1. **📊 My Alerts (Dashboard)**:
     - Real-time stat bar: Total Tracked Items, Target Alerts Met, Online/Guest Status.
     - Modern cards with store badges (Amazon, Flipkart, Myntra), current price, target alert, and discount % pill.
     - One-tap "Open Store" button to view product directly.
     - Pull-to-refresh to fetch updated prices.
  2. **⚡ Track Price (Link Pasting)**:
     - **📋 Paste from Clipboard Button**: One tap extracts URLs from copied text.
     - **Instant Demo Product Chips**: Test with 1 click (`📱 iPhone 15`, `💻 MacBook Air`, `👟 Nike Shoes`).
     - **Quick Target Price Chips**: `-10%`, `-20%`, `-30%` or custom target price.
     - **🔔 Set Price Drop Alert**: Instant local notification and tracking activation.
  3. **🌐 Web Hub**:
     - Fast WebView for [`pricealerter.in`](https://pricealerter.in) or local server with pull-to-refresh and offline fallback.
  4. **⚙️ Settings & Account**:
     - Profile details with instant **⚡ 1-Click Demo Login** or Email Sign In / Register.
     - Server switcher: Cloud (`pricealerter.in`), Local Emulator (`10.0.2.2:8081`), or Custom LAN IP.
     - **🔔 Test Notification Button**: Fires a heads-up alert with sound and vibration to test notifications on your device.

### 3. 🔐 Solved Login & Signup
- **No More Blocked OTP Loops**: Signup directly activates user accounts and logs them in immediately.
- **⚡ 1-Click Demo Login**: Instantly log in as Demo User with sample pre-loaded trackers on both mobile and web.
- **Native Bottom Sheet Dialog** ([`AuthBottomSheetDialog.java`](file:///Users/lakkireddyvenkatamadhavareddy/Downloads/pricealerter/app/src/main/java/com/example/pricealerter/AuthBottomSheetDialog.java)): Sign in or create an account without leaving your screen.

### 4. 🔗 Share Target Integration
- In Amazon, Flipkart, Myntra, or Chrome, tap **Share ➔ Price Alerter** to automatically open the app, extract the link, and fetch the price!

---

## 🚀 How to Run

### Run Android App:
1. Open this project in **Android Studio**.
2. Click the green **Run (▶)** button on an Emulator or connected Android phone.
3. Pre-built APK:
   [`app/build/outputs/apk/debug/app-debug.apk`](file:///Users/lakkireddyvenkatamadhavareddy/Downloads/pricealerter/app/build/outputs/apk/debug/app-debug.apk)

### Run Web Backend:
```bash
./run_backend.sh
```
- Web App: [http://localhost:8081](http://localhost:8081)
- Demo Login: [http://localhost:8081/demo-login](http://localhost:8081/demo-login)
