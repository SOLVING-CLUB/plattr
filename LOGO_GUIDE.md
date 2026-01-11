# 📱 App Logo & Notification Icon Guide

## 🎯 Best Formats

### **App Logo (Launcher Icon)**
- **Format**: PNG (24-bit with transparency)
- **Why**: Best quality, supports transparency, universal compatibility
- **Alternative**: SVG → Converted to PNG at multiple sizes (Android/iOS require PNG)

### **Notification Icon**
- **Android**: **Vector Drawable (XML)** or **White PNG** (transparent background)
- **iOS**: Uses app icon automatically (PNG)
- **Why**: Android notifications show icons in white/transparent only (system tints them)

---

## 📐 Required Sizes

### **Android App Icon** (in `android/app/src/main/res/mipmap-*/`)

| Density | Folder | Size | Purpose |
|---------|--------|------|---------|
| MDPI | `mipmap-mdpi` | 48×48px | Low density |
| HDPI | `mipmap-hdpi` | 72×72px | Medium density |
| XHDPI | `mipmap-xhdpi` | 96×96px | High density |
| XXHDPI | `mipmap-xxhdpi` | 144×144px | Extra high density |
| XXXHDPI | `mipmap-xxxhdpi` | 192×192px | Extra extra high density |

**Also needed:**
- `ic_launcher_foreground.png` - Same sizes (foreground layer for adaptive icons)
- `ic_launcher_round.png` - Same sizes (for round icon style)

### **Android Notification Icon**
- **Format**: Vector XML (recommended) or PNG
- **Size**: 24×24dp (scales automatically)
- **Color**: **WHITE ONLY** (Android tints it)
- **Background**: Transparent
- **Location**: `android/app/src/main/res/drawable/ic_notification.xml`

### **iOS App Icon** (in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`)

| Size | Filename | Purpose |
|------|----------|---------|
| 1024×1024px | `AppIcon-512@2x.png` | App Store & general use |

**Note**: iOS automatically generates all sizes from the 1024×1024px icon.

---

## 🎨 Design Guidelines

### **App Logo**
- ✅ Use your brand logo/icon
- ✅ Keep it simple (details get lost at small sizes)
- ✅ Ensure it works on light AND dark backgrounds
- ✅ Test at 48×48px to ensure readability

### **Notification Icon**
- ✅ **MUST be white/transparent** (Android requirement)
- ✅ Simple silhouette/shape (no text, no colors)
- ✅ High contrast for visibility
- ✅ 24×24dp viewport (Android vector)

---

## 📁 Where to Place Files

### **Android**
```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48×48)
│   ├── ic_launcher_round.png (48×48)
│   └── ic_launcher_foreground.png (48×48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72×72)
│   ├── ic_launcher_round.png (72×72)
│   └── ic_launcher_foreground.png (72×72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96×96)
│   ├── ic_launcher_round.png (96×96)
│   └── ic_launcher_foreground.png (96×96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144×144)
│   ├── ic_launcher_round.png (144×144)
│   └── ic_launcher_foreground.png (144×144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png (192×192)
│   ├── ic_launcher_round.png (192×192)
│   └── ic_launcher_foreground.png (192×192)
└── drawable/
    └── ic_notification.xml (vector, white icon)
```

### **iOS**
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
└── AppIcon-512@2x.png (1024×1024px)
```

---

## 🛠️ Tools to Generate Icons

### **Online Tools** (Recommended)
1. **Android Asset Studio** (by Google)
   - https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
   - Upload 1024×1024px PNG → Generates all Android sizes

2. **App Icon Generator**
   - https://www.appicon.co/
   - Upload 1024×1024px → Generates Android + iOS

3. **Icon Kitchen** (by Google)
   - https://icon.kitchen/
   - Generates adaptive icons with foreground/background

### **Command Line**
```bash
# Using ImageMagick (if installed)
# Generate all Android sizes from 1024×1024 source
convert source.png -resize 48x48 mipmap-mdpi/ic_launcher.png
convert source.png -resize 72x72 mipmap-hdpi/ic_launcher.png
convert source.png -resize 96x96 mipmap-xhdpi/ic_launcher.png
convert source.png -resize 144x144 mipmap-xxhdpi/ic_launcher.png
convert source.png -resize 192x192 mipmap-xxxhdpi/ic_launcher.png
```

---

## ✅ Quick Checklist

- [ ] Create 1024×1024px PNG logo (source file)
- [ ] Generate all Android sizes (48px to 192px)
- [ ] Generate iOS icon (1024×1024px)
- [ ] Create white notification icon (vector XML or PNG)
- [ ] Test icons at smallest size (48×48px)
- [ ] Update AndroidManifest.xml if needed
- [ ] Rebuild app and test

---

## 📝 Current Setup

**Android Notification Icon**: ✅ Already configured (`ic_notification.xml`)
**Android App Icon**: ✅ Using `@mipmap/ic_launcher` (needs your logo)
**iOS App Icon**: ✅ Needs 1024×1024px PNG

---

## 🚀 Next Steps

1. **Prepare your logo**:
   - Export as 1024×1024px PNG (transparent background recommended)
   - Ensure it's square and centered

2. **Generate icons**:
   - Use Android Asset Studio or App Icon Generator
   - Upload your 1024×1024px logo
   - Download generated icons

3. **Replace files**:
   - Copy generated Android icons to `android/app/src/main/res/mipmap-*/`
   - Copy iOS icon to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

4. **Update notification icon** (if needed):
   - Create white version of your logo
   - Convert to vector XML or white PNG
   - Replace `android/app/src/main/res/drawable/ic_notification.xml`

5. **Rebuild**:
   ```bash
   npm run build
   npx cap sync android ios
   ```
