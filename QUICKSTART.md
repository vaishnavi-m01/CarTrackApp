# Quick Start Guide

## Getting Started with CarTrack Pro

### Step 1: Install Node.js
Download and install Node.js from https://nodejs.org/ (v14 or higher)

### Step 2: Install Expo CLI
Open terminal and run:
```bash
npm install -g expo-cli
```

### Step 3: Navigate to Project
```bash
cd CarTrackApp
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Start the App
```bash
npm start
```

### Step 6: Run on Device

**Option A: Use Expo Go App (Recommended for beginners)**
1. Download "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal
3. App will load on your device

**Option B: Use Emulator**
- For iOS: Press 'i' in terminal (requires Mac with Xcode)
- For Android: Press 'a' in terminal (requires Android Studio)

## Troubleshooting

### Issue: npm install fails
**Solution**: Try using yarn instead:
```bash
npm install -g yarn
yarn install
```

### Issue: Metro bundler issues
**Solution**: Clear cache:
```bash
expo start -c
```

### Issue: Module not found errors
**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

## Project Features

✅ 9 Complete Screens
✅ Bottom Tab Navigation
✅ Vehicle Management
✅ Expense Tracking
✅ Vehicle Comparison
✅ Loan/EMI Calculator
✅ News Feed
✅ User Profile
✅ Beautiful UI with Gradients

## Next Steps

1. Customize colors in `src/constants/theme.js`
2. Add your own vehicle data
3. Integrate with a backend API
4. Add real news feed
5. Implement authentication

## Need Help?

Check README.md for detailed documentation.

Happy Coding! 🚀
