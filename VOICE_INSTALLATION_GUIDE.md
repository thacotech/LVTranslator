# 🔊 Hướng Dẫn Cài Voice Tiếng Việt & Tiếng Lào

## ⚠️ Vấn Đề Hiện Tại

Google TTS **KHÔNG có sẵn** giọng đọc cho:
- ❌ Tiếng Việt (vi-VN)
- ❌ Tiếng Lào (lo-LA)

Bạn cần cài **thủ công** từ Windows hoặc dùng giải pháp khác.

---

## ✅ GIẢI PHÁP 1: Cài Windows Language Pack

### **Bước 1: Mở Settings**

```
Windows 11: Settings → Time & language → Language & region
Windows 10: Settings → Time & Language → Language
```

### **Bước 2: Thêm ngôn ngữ**

1. Click **"Add a language"**
2. Tìm **"Vietnamese"** (Tiếng Việt)
3. Click **"Next"** → Tích chọn:
   - ✅ **Text-to-speech** (QUAN TRỌNG!)
   - ✅ Speech recognition (tùy chọn)
   - ✅ Language pack (tùy chọn)
4. Click **"Install"**

### **Bước 3: Đợi download**

- Download size: ~50-100MB
- Thời gian: 5-10 phút (tùy internet)

### **Bước 4: Restart Browser**

```
1. Đóng tất cả tab browser
2. Mở lại
3. Vào app translator
4. Reload page
```

### **Bước 5: Kiểm tra**

Mở Console (F12) và chạy:

```javascript
speechSynthesis.getVoices().forEach(v => console.log(v.name, v.lang));
```

**Kết quả mong đợi:**
```
Microsoft Huyen (vi-VN)  ← Tiếng Việt mới cài
Google US English (en-US)
...
```

---

## ✅ GIẢI PHÁP 2: Dùng Browser Extension (EASIER!)

### **Không muốn cài language pack? Dùng extension!**

### **🔥 RECOMMENDED: Read Aloud**

#### **Chrome/Edge:**

1. Vào **Chrome Web Store**:
   ```
   https://chrome.google.com/webstore/detail/read-aloud-a-text-to-spee/hdhinadidafjejdhmfkjgnolgimiaplp
   ```

2. Click **"Add to Chrome"**

3. **Read Aloud** có nhiều voices hơn:
   - ✅ Vietnamese (multiple voices)
   - ✅ Lao (có thể có, cần check)
   - ✅ 300+ ngôn ngữ khác

#### **Cách dùng với LVTranslator:**

1. Dịch văn bản
2. Bôi đen (select) văn bản output
3. Right-click → **Read Aloud**
4. Hoặc dùng shortcut extension

### **Alternative Extensions:**

1. **Natural Reader**
   - Premium voices
   - Support Vietnamese
   
2. **SpeakIt!**
   - Lightweight
   - Multiple voices

3. **Voice Dream Reader** (Mobile)
   - iOS/Android
   - Best Vietnamese voices

---

## ✅ GIẢI PHÁP 3: Online TTS Services (FREE)

### **Google Cloud Text-to-Speech (FREE Tier)**

#### **Setup:**

1. Tạo tài khoản Google Cloud (free)
2. Enable Text-to-Speech API
3. Get API key (free 1 million chars/month)
4. Paste vào app (click 🔑 API Key button)

#### **Advantages:**
- ✅ 300+ voices
- ✅ Vietnamese: 8 voices (WaveNet quality)
- ✅ Lao: Available!
- ✅ Neural voices (giọng tự nhiên hơn)

---

## ✅ GIẢI PHÁP 4: Azure Cognitive Services

### **Microsoft Azure TTS (FREE Tier)**

1. Tạo tài khoản Azure (free)
2. Create Speech Service
3. Get API key
4. Support Vietnamese very well!

**FREE Tier:**
- 500,000 chars/month free
- High-quality voices

---

## 🔧 Troubleshooting

### **Sau khi cài Windows language pack, vẫn không có voice?**

#### **Check 1: Restart máy**
```
Settings → Power → Restart
```

#### **Check 2: Verify installation**
```
Settings → Time & language → Language & region
→ Click Vietnamese → Options
→ Check "Text-to-speech" = "Installed"
```

#### **Check 3: Check Windows Speech Settings**
```
Settings → Accessibility → Narrator
→ Choose a voice → Should see "Microsoft Huyen"
```

#### **Check 4: Clear browser cache**
```
Chrome: Settings → Privacy → Clear browsing data
→ Tích "Cached images and files"
→ Clear data
→ Restart browser
```

---

## 📊 Comparison Table

| Solution | Vietnamese | Lao | Quality | Free | Setup Time |
|----------|-----------|-----|---------|------|------------|
| **Windows Pack** | ✅ | ⚠️ Limited | Good | ✅ | 10 min |
| **Browser Extension** | ✅ | ⚠️ Varies | Good | ✅ | 2 min |
| **Google Cloud TTS** | ✅ 8 voices | ✅ Yes | Excellent | ✅ 1M chars | 15 min |
| **Azure TTS** | ✅ Multiple | ✅ Yes | Excellent | ✅ 500K | 15 min |

**Recommendation:**
- **Quick & Easy:** Browser Extension (Read Aloud)
- **Best Quality:** Google Cloud TTS API
- **Offline:** Windows Language Pack

---

## 🎯 Quick Start (FASTEST)

### **Muốn test ngay trong 2 phút:**

1. **Install "Read Aloud" extension:**
   - Chrome: https://chrome.google.com/webstore/detail/hdhinadidafjejdhmfkjgnolgimiaplp
   - Edge: https://microsoftedge.microsoft.com/addons/detail/read-aloud

2. **Sử dụng:**
   - Dịch văn bản
   - Bôi đen output
   - Click icon extension
   - Chọn Vietnamese voice
   - Play!

---

## 💡 Tips

### **Để có giọng đọc tốt nhất:**

1. **Windows Language Pack:**
   - Good quality
   - Offline (không cần internet)
   - Free forever

2. **Google Cloud TTS:**
   - Best quality (WaveNet/Neural)
   - Natural sounding
   - Free 1M chars/month = ~100,000 từ

3. **Browser Extensions:**
   - Easy to use
   - No setup
   - Multiple voice options

---

## 🔗 Useful Links

**Windows Language Packs:**
- https://support.microsoft.com/en-us/windows/language-packs-for-windows

**Read Aloud Extension:**
- https://readaloud.app/

**Google Cloud TTS:**
- https://cloud.google.com/text-to-speech

**Azure TTS:**
- https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/

**Test Voices Online:**
- https://ttstool.com/ (Test multiple TTS engines)
- https://www.naturalreaders.com/online/ (Natural Reader online)

---

## 📋 Summary

**Current Issue:**
- ❌ No Vietnamese/Lao voices in browser

**Solutions (Pick one):**
1. ✅ Install Windows Language Pack (10 min, permanent)
2. ✅ Install Browser Extension (2 min, easy)
3. ✅ Use Google Cloud TTS API (15 min, best quality)

**Next Steps:**
1. Choose a solution
2. Follow guide above
3. Test in app
4. Enjoy Vietnamese & Lao TTS!

---

**Status:** Waiting for voice installation  
**Recommendation:** Try "Read Aloud" extension first (fastest) 🚀

