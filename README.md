# Price Alerter 🛒🔔 - AI Smart Price Drop Tracker & Product Comparison

[![Android CI](https://img.shields.io/badge/Android-APK%20Ready-3DDC84?logo=android&logoColor=white)](app/build/outputs/apk/debug/app-debug.apk)
[![Web Platform](https://img.shields.io/badge/Web-PWA%20Ready-6366F1?logo=googlechrome&logoColor=white)](web_backend/templates/index.html)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An end-to-end, cross-platform e-commerce price monitoring platform and shopping assistant designed for mobile (Android & iOS) and desktop (Mac, PC, Laptops). It tracks prices 24/7 across Amazon, Flipkart, Myntra, Ajio, Meesho, Apple, and 100+ stores, alerting users the instant target price drops occur.

---

## 🌟 Key Features

### 1. 📈 Stock-Market Style Live Price Graph (Main Dashboard)
- **Target Price Baseline**: Dashed horizontal baseline marks your target alert price.
- **Dynamic Savings & Hike Zones**:
  - 🟢 **Green Curve & Fill**: When the current price drops below your target threshold (**Savings Zone**).
  - 🔴 **Red Curve & Fill**: When current store price rises above target threshold (**Price Hike**).
- Interactive point tooltips, trend labels, and percentage drop callouts.

### 2. 🤖 AI Product Comparison Engine
- Paste two product links from any supported e-commerce site (Amazon, Flipkart, etc.).
- Evaluates and rates products across 5 distinct segments:
  1. **💰 Pricing & Value for Money**: Upfront savings, value scores out of 10.
  2. **⭐ Customer Reviews & Sentiment**: Verified buyer ratings, review volumes, positive sentiment percentage.
  3. **🛡️ Certifications & Build Quality**: BIS India, CE, RoHS, and official brand warranty verification.
  4. **⚠️ Buyer Concerns & Drawbacks**: Real user drawbacks (heating, battery drain, charger in-box status).
  5. **🏆 AI Verdict & Winner Recommendation**: Clear winner badge with direct "Buy Now" links to both stores.
- Quick 1-Click Comparison Demo chips:
  - 📱 *iPhone 15 vs Samsung Galaxy S24*
  - 💻 *MacBook Air M2 vs Dell XPS 13*
  - 🎧 *Sony WH-1000XM5 vs Bose QC Ultra*

### 3. 🔐 Multi-Channel Auth & Verification
- Prompts immediately on first launch.
- Supports **Email-based OTP** and **SMS Phone-based OTP** verification.
- ⚡ **1-Click Instant Demo Login**: Immediately explore full tracking and features with pre-seeded demo items.
- Works smoothly with no blocking loops or SMTP timeouts.

### 4. 👤 Customer Profile & Total Money Saved (Settings)
- Displays full Customer Profile: Name, Email + Verified badge, Phone + SMS badge, and Member Tier (**Gold Saver**).
- **Total Money Saved Card**: Live dynamic tally of total rupees saved across all price alerts that reached their target.

### 5. 🏷️ Enhanced Alert Cards
- **Product Image Thumbnail**: Instant visual confirmation of tracked items.
- **E-Commerce Store Logo**: Amazon, Flipkart, Myntra, Ajio, Meesho, Croma, Apple.
- **Clickable Product Links**: One-click jump directly to the live store page.
- Target Price vs Current Price comparison with discount percentage pills.
- One-tap "Simulate Drop" button to test the celebration theme and instant notifications!

---

## 📱 Cross-Platform Architecture

```
pricealerter/
├── app/                        # Native Android Application (Java & Material 3)
│   ├── src/main/java/com/example/pricealerter/
│   │   ├── MainActivity.java           # 4-Tab Hub (Alerts, Track, AI Compare, Settings)
│   │   ├── StockPriceChartView.java    # Custom Red/Green Live Stock Canvas Chart
│   │   ├── AiProductComparator.java    # 5-Segment AI Product Comparison Engine
│   │   ├── AuthBottomSheetDialog.java # Email OTP & Phone SMS Verification
│   │   ├── TrackerAdapter.java         # Cards with Image, Store Logo, Clickable Link
│   │   ├── CelebrationDialog.java      # Celebration modal with confetti
│   │   └── LivePriceScraper.java       # Direct on-device parsing fallback
│   └── src/main/res/                   # Vectors, store logos, layouts
├── web_backend/                # Web Dashboard, REST API & PWA
│   ├── app.py                  # Flask API (/get-price, /api/ai-compare, /api/signup, /api/trackers)
│   ├── templates/index.html    # Full Web Dashboard (matches native app)
│   ├── static/script.js        # Web stock canvas, AI comparator, alert cards
│   ├── static/style.css        # Responsive styling (Mobile, Tablet, Desktop)
│   └── verify_all_endpoints.py # Integration test suite (21/21 passing)
└── README.md
```

---

## 🚀 Quick Start Guide

### Running the Web Platform
```bash
# 1. Install dependencies
pip install -r web_backend/requirements.txt

# 2. Start the web server
./run_backend.sh
# Server active at: http://localhost:8081
```

### Running the Integration Test Suite
```bash
python3 web_backend/verify_all_endpoints.py
# 21 of 21 tests passed (100%)
```

### Building the Android App
```bash
./gradlew assembleDebug
# Generated APK: app/build/outputs/apk/debug/app-debug.apk
```

---

## 📄 License
MIT License. Built for smart shoppers worldwide.
