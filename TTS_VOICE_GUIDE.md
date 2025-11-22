# 🔊 Hướng Dẫn Sử Dụng TTS - Text-to-Speech

## ✅ ĐÃ CẢI THIỆN!

Tôi vừa nâng cấp TTS để **hỗ trợ tốt hơn cho Tiếng Việt và Tiếng Lào**!

---

## 🎯 Cách Hoạt Động

### 1. **Auto-detect Ngôn Ngữ**

TTS tự động phát hiện ngôn ngữ từ:

#### A. **Target Language Selector**
- Chọn ngôn ngữ đích (output language)
- TTS sẽ dùng giọng đọc tương ứng

#### B. **Text Patterns**
- **Tiếng Lào:** Phát hiện ký tự Lao (ກ-ໝ)
- **Tiếng Việt:** Phát hiện dấu (àáảãạ...)
- **Tiếng Anh:** Mặc định nếu không có dấu đặc biệt

---

## 🔍 Voice Matching Logic

```javascript
1. Exact match:    vi-VN → Vietnamese voice
2. Partial match:  vi    → Any vi-* voice
3. Name match:     "vietnamese" in voice name
4. Fallback:       First available voice
```

---

## 🎤 Available Voices (Tùy Theo Hệ Điều Hành)

### **Windows 10/11:**
- ✅ **English:** Multiple (US, UK, AU...)
- ✅ **Vietnamese:** Microsoft Huyen (nếu đã cài language pack)
- ⚠️ **Lao:** Thường không có sẵn

### **macOS:**
- ✅ **English:** Multiple voices
- ✅ **Vietnamese:** Có sẵn
- ✅ **Lao:** Có sẵn (macOS 11+)

### **Chrome OS:**
- ✅ **English:** Google voices
- ⚠️ **Vietnamese:** Limited
- ⚠️ **Lao:** Limited

---

## 🔧 Cách Cài Thêm Giọng Đọc

### **Windows:**

1. **Settings** → **Time & Language** → **Language**
2. Click **Add a language**
3. Tìm **Vietnamese** hoặc **Lao**
4. Click **Options** → Download **Text-to-speech**
5. Restart browser

### **macOS:**

1. **System Preferences** → **Accessibility** → **Spoken Content**
2. Click **System Voice** → **Customize...**
3. Tích chọn **Vietnamese** và **Lao**
4. Download và cài đặt

### **Chrome:**

1. **Settings** → **Accessibility** → **Text-to-Speech**
2. Try Chrome extensions: **Read Aloud**, **Natural Reader**

---

## 🧪 Cách Test

### 1. **Kiểm Tra Voices Có Sẵn:**

Mở **DevTools Console (F12)** và chạy:

```javascript
speechSynthesis.getVoices().forEach(voice => {
  console.log(`${voice.name} (${voice.lang})`);
});
```

**Kết quả mong đợi:**
```
Microsoft David (en-US)
Microsoft Zira (en-US)
Microsoft Huyen (vi-VN)     ← Vietnamese
Google UK English (en-GB)
...
```

### 2. **Test TTS với từng ngôn ngữ:**

#### Tiếng Việt:
```
Input:  "Xin chào"
Output: Giọng đọc tiếng Việt (nếu có)
```

#### Tiếng Lào:
```
Input:  "ສະບາຍດີ" (Sabaidee)
Output: Giọng đọc tiếng Lào (nếu có)
```

#### Tiếng Anh:
```
Input:  "Hello"
Output: Giọng đọc tiếng Anh
```

---

## 🐛 Troubleshooting

### **Vấn Đề 1: Chỉ đọc được tiếng Anh**

**Nguyên nhân:** Hệ thống không có giọng đọc tiếng Việt/Lào

**Giải pháp:**
1. Cài language pack (xem hướng dẫn trên)
2. Hoặc dùng extension **Read Aloud** (có nhiều giọng hơn)
3. Hoặc dùng online TTS services

### **Vấn Đề 2: Giọng đọc bị sai**

**Check console logs:**
```javascript
[TTS] Target language detected: vi
[TTS] Mapped to: vi-VN
[TTS] ✓ Found voice for vi-VN: Microsoft Huyen
```

Nếu thấy:
```javascript
[TTS] ⚠ No voice found for vi-VN, using default
```
→ Cần cài thêm language pack

### **Vấn Đề 3: Giọng đọc quá nhanh/chậm**

Điều chỉnh **Speed slider**:
- 0.5x: Chậm (tốt cho học ngôn ngữ)
- 1.0x: Bình thường
- 2.0x: Nhanh

---

## 💡 Tips

### **Để TTS đọc tốt hơn:**

1. **Chọn đúng ngôn ngữ đích** trước khi dịch
2. **Cài language packs** cho HĐH
3. **Sử dụng dấu câu** để TTS ngắt nghỉ đúng
4. **Điều chỉnh Speed/Pitch** phù hợp với từng ngôn ngữ

### **Best Settings cho từng ngôn ngữ:**

**Tiếng Việt:**
- Speed: 0.9x - 1.0x
- Pitch: 1.0

**Tiếng Lào:**
- Speed: 0.8x - 0.9x (Lào thường nói chậm hơn)
- Pitch: 1.0

**Tiếng Anh:**
- Speed: 1.0x - 1.2x
- Pitch: 1.0

---

## 📊 Current Status

```javascript
✅ TTS Service initialized
✅ Auto-detect language from target selector
✅ Auto-detect from text patterns
✅ Fallback to English if no voice found
✅ 26 voices loaded (tùy HĐH)
```

---

## 🔗 External TTS Services (Nếu không có voice local)

### **Alternative Options:**

1. **Google Cloud Text-to-Speech**
   - 300+ voices
   - 40+ languages
   - Requires API key

2. **Amazon Polly**
   - Neural voices
   - Vietnamese & Lao supported
   - Requires AWS account

3. **Browser Extensions:**
   - **Read Aloud** (Chrome)
   - **Natural Reader** (All browsers)
   - **Voice Dream Reader** (iOS)

---

## 🎯 Next Steps

**Sau khi refresh browser:**

1. Click ▶️ **Play** để test TTS
2. Check **Console** xem voice nào được chọn
3. Nếu không có Vietnamese/Lao voice → Cài language pack
4. Hoặc dùng browser extension

---

**Status:** ✅ TTS Enhanced for Multi-language Support!  
**Languages:** English ✅ | Vietnamese ⚠️* | Lao ⚠️*  
**Note:** *Requires language packs on Windows

