# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho việc mở rộng tính năng của LVTranslator với mục tiêu duy trì kiến trúc static web (HTML/CSS/JS) để deploy trên GitHub Pages. Tất cả các tính năng được thiết kế để hoạt động hoàn toàn ở client-side, không yêu cầu backend server, phù hợp với môi trường static hosting.

## Glossary

- **System**: LVTranslator Static Web Application
- **User**: Người dùng ứng dụng dịch thuật
- **TTS**: Text-to-Speech - Chuyển văn bản thành giọng nói
- **STT**: Speech-to-Text - Chuyển giọng nói thành văn bản
- **Web Speech API**: API trình duyệt cho TTS và STT
- **Translation Memory**: Bộ nhớ lưu trữ các cụm từ và câu đã dịch thường dùng
- **Glossary**: Từ điển thuật ngữ do người dùng tự định nghĩa
- **PWA**: Progressive Web App - Ứng dụng web có thể cài đặt như native app
- **Service Worker**: Script chạy nền để hỗ trợ offline và caching
- **localStorage**: Bộ nhớ cục bộ trình duyệt
- **Keyboard Shortcut**: Phím tắt để thực hiện thao tác nhanh
- **Theme**: Giao diện màu sắc của ứng dụng
- **Gesture**: Cử chỉ chạm trên thiết bị di động
- **SRT**: SubRip Subtitle file format
- **Batch Translation**: Dịch nhiều đoạn văn bản cùng lúc

## Requirements

### Requirement 1: Text-to-Speech (TTS) Integration

**User Story:** Là một User đang học tiếng Lào/Việt, tôi muốn nghe phát âm của văn bản đã dịch để cải thiện kỹ năng nghe và phát âm của mình.

#### Acceptance Criteria

1. WHEN User clicks TTS button, THE System SHALL play audio của translated text
2. THE System SHALL support TTS cho cả Vietnamese và Lao languages
3. THE System SHALL provide controls để pause, resume, và stop audio playback
4. THE System SHALL allow User điều chỉnh speech rate từ 0.5x đến 2.0x
5. THE System SHALL allow User điều chỉnh pitch và volume của voice
6. THE System SHALL display visual indicator khi đang phát audio
7. THE System SHALL highlight text đang được đọc theo thời gian thực
8. WHERE browser không support Web Speech API, THE System SHALL show appropriate error message
9. THE System SHALL remember User voice preferences trong localStorage
10. THE System SHALL provide option để chọn voice khác nhau nếu có sẵn

### Requirement 2: Speech-to-Text (STT) Integration

**User Story:** Là một User, tôi muốn nói trực tiếp vào microphone để dịch thay vì phải gõ văn bản, đặc biệt khi tôi không biết cách gõ tiếng Lào.

#### Acceptance Criteria

1. WHEN User clicks microphone button, THE System SHALL request microphone permission
2. THE System SHALL start recording và convert speech to text real-time
3. THE System SHALL support speech recognition cho Vietnamese và Lao languages
4. THE System SHALL display visual indicator khi đang recording
5. THE System SHALL allow User stop recording manually hoặc auto-stop sau 30 seconds silence
6. THE System SHALL insert recognized text vào input field
7. THE System SHALL provide option để User edit recognized text trước khi translate
8. WHERE browser không support Speech Recognition API, THE System SHALL disable STT feature
9. THE System SHALL handle recognition errors gracefully với clear error messages
10. THE System SHALL allow User chọn recognition language trước khi start recording

### Requirement 3: Enhanced Translation Memory

**User Story:** Là một User thường xuyên dịch các cụm từ giống nhau, tôi muốn lưu và tái sử dụng các translation thường dùng để tiết kiệm thời gian và API calls.

#### Acceptance Criteria

1. THE System SHALL allow User save specific translations vào Translation Memory
2. THE System SHALL provide quick insert functionality cho saved phrases
3. THE System SHALL organize Translation Memory theo categories do User định nghĩa
4. THE System SHALL allow User search trong Translation Memory
5. THE System SHALL suggest relevant phrases từ Memory khi User đang typing
6. THE System SHALL allow User edit và delete items trong Memory
7. THE System SHALL export Translation Memory sang JSON file
8. THE System SHALL import Translation Memory từ JSON file
9. THE System SHALL display usage count cho mỗi phrase trong Memory
10. THE System SHALL limit Translation Memory đến 500 items để tránh performance issues

### Requirement 4: Glossary/Dictionary Feature

**User Story:** Là một User làm việc với thuật ngữ chuyên ngành, tôi muốn tạo từ điển riêng để đảm bảo consistency trong translation.

#### Acceptance Criteria

1. THE System SHALL allow User create custom glossary entries với source và target terms
2. THE System SHALL automatically highlight glossary terms trong input text
3. THE System SHALL show glossary translation khi User hover over highlighted terms
4. THE System SHALL allow User organize glossary theo categories (medical, legal, technical, etc.)
5. THE System SHALL provide search functionality trong glossary
6. THE System SHALL allow User add notes và context cho mỗi glossary entry
7. THE System SHALL export glossary sang CSV hoặc JSON format
8. THE System SHALL import glossary từ CSV hoặc JSON format
9. THE System SHALL suggest glossary terms khi translating
10. THE System SHALL allow User enable/disable glossary highlighting

### Requirement 5: Progressive Web App (PWA) Implementation

**User Story:** Là một User, tôi muốn cài đặt ứng dụng trên điện thoại và sử dụng offline để không phụ thuộc vào kết nối internet.

#### Acceptance Criteria

1. THE System SHALL provide manifest.json với proper PWA configuration
2. THE System SHALL implement Service Worker để cache static assets
3. THE System SHALL allow User install app trên mobile và desktop devices
4. THE System SHALL work offline với cached translations và basic features
5. THE System SHALL show offline indicator khi không có internet connection
6. THE System SHALL sync data khi connection được restore
7. THE System SHALL cache translation history và settings cho offline access
8. THE System SHALL provide app icon và splash screen
9. THE System SHALL meet PWA installability criteria (HTTPS, manifest, service worker)
10. THE System SHALL update Service Worker automatically khi có version mới

### Requirement 6: Keyboard Shortcuts

**User Story:** Là một power User, tôi muốn sử dụng phím tắt để thực hiện các thao tác thường xuyên nhanh hơn thay vì phải click chuột.

#### Acceptance Criteria

1. THE System SHALL support Ctrl+Enter (Cmd+Enter on Mac) để translate
2. THE System SHALL support Ctrl+K để clear all fields
3. THE System SHALL support Ctrl+H để toggle history panel
4. THE System SHALL support Ctrl+C để copy translation
5. THE System SHALL support Ctrl+S để save translation to Memory
6. THE System SHALL support Ctrl+/ để show keyboard shortcuts help
7. THE System SHALL support Esc để close modals và panels
8. THE System SHALL support Tab để navigate giữa input và output fields
9. THE System SHALL display keyboard shortcuts trong help modal
10. THE System SHALL allow User customize keyboard shortcuts trong settings

### Requirement 7: Theme Customization

**User Story:** Là một User, tôi muốn tùy chỉnh giao diện ứng dụng theo sở thích cá nhân để có trải nghiệm sử dụng thoải mái hơn.

#### Acceptance Criteria

1. THE System SHALL provide multiple color themes (Light, Dark, Blue, Purple, Green)
2. THE System SHALL allow User adjust font size từ 12px đến 24px
3. THE System SHALL allow User choose font family (System, Serif, Monospace)
4. THE System SHALL allow User adjust line height và letter spacing
5. THE System SHALL save theme preferences trong localStorage
6. THE System SHALL apply theme changes immediately without page reload
7. THE System SHALL provide theme preview trước khi apply
8. THE System SHALL support custom color picker cho advanced users
9. THE System SHALL export theme settings sang JSON file
10. THE System SHALL import theme settings từ JSON file

### Requirement 8: Enhanced Mobile UX

**User Story:** Là một mobile User, tôi muốn ứng dụng có trải nghiệm tốt trên điện thoại với các gesture và UI tối ưu cho màn hình nhỏ.

#### Acceptance Criteria

1. THE System SHALL support swipe left/right để switch giữa input và output panels
2. THE System SHALL support swipe down để close modals và panels
3. THE System SHALL support pull-to-refresh để reload app
4. THE System SHALL implement bottom sheet UI cho mobile modals
5. THE System SHALL optimize touch targets với minimum 44x44px size
6. THE System SHALL provide floating action button cho quick translate
7. THE System SHALL implement haptic feedback cho touch interactions
8. THE System SHALL optimize keyboard behavior trên mobile (auto-focus, auto-scroll)
9. THE System SHALL support landscape và portrait orientations
10. THE System SHALL reduce animations trên low-end devices

### Requirement 9: Export/Import Settings & Data

**User Story:** Là một User sử dụng nhiều thiết bị, tôi muốn backup và sync settings, history, và data giữa các thiết bị một cách thủ công.

#### Acceptance Criteria

1. THE System SHALL allow User export all data (history, memory, glossary, settings) sang single JSON file
2. THE System SHALL allow User import data từ JSON file
3. THE System SHALL validate imported data trước khi apply
4. THE System SHALL provide option để export selective data (chỉ history, chỉ settings, etc.)
5. THE System SHALL include timestamp và version info trong exported file
6. THE System SHALL handle import conflicts với option để merge hoặc replace
7. THE System SHALL provide backup reminder sau mỗi 7 days
8. THE System SHALL compress exported data để reduce file size
9. THE System SHALL allow User schedule automatic backups (download file)
10. THE System SHALL provide restore point trước khi import để rollback nếu cần

### Requirement 10: Advanced File Support

**User Story:** Là một User làm việc với nhiều loại file, tôi muốn ứng dụng hỗ trợ thêm các định dạng file phổ biến và giữ nguyên formatting khi dịch.

#### Acceptance Criteria

1. THE System SHALL support .txt file upload và extraction
2. THE System SHALL support .srt (subtitle) file upload với preservation của timestamps
3. THE System SHALL support .csv file với batch translation cho multiple rows
4. THE System SHALL preserve formatting (line breaks, paragraphs) khi translate
5. THE System SHALL allow User download translated content trong original file format
6. THE System SHALL support drag-and-drop file upload
7. THE System SHALL show file preview trước khi translate
8. THE System SHALL handle large files với chunked processing (max 10MB)
9. THE System SHALL provide progress indicator cho file processing
10. THE System SHALL validate file content và show warnings cho unsupported characters

### Requirement 11: User-Provided API Key Management

**User Story:** Là một User muốn sử dụng API key riêng, tôi muốn nhập và quản lý API key của mình để có unlimited quota và bảo mật tốt hơn.

#### Acceptance Criteria

1. THE System SHALL provide option cho User nhập personal Gemini API key
2. THE System SHALL encrypt API key trước khi lưu vào localStorage
3. THE System SHALL validate API key bằng cách test với dummy request
4. THE System SHALL allow User switch giữa shared key và personal key
5. THE System SHALL show API usage statistics cho personal key
6. THE System SHALL provide instructions để User tạo API key từ Google AI Studio
7. THE System SHALL allow User delete API key khỏi localStorage
8. THE System SHALL NOT expose API key trong network requests (use in headers only)
9. WHERE User không nhập personal key, THE System SHALL use shared key với rate limiting
10. THE System SHALL warn User khi shared key approaching rate limit

### Requirement 12: Translation Quality Feedback

**User Story:** Là một User, tôi muốn đánh giá chất lượng bản dịch để giúp cải thiện ứng dụng và track các translation tốt/xấu.

#### Acceptance Criteria

1. THE System SHALL allow User rate translation với 1-5 stars
2. THE System SHALL allow User report translation errors với specific feedback
3. THE System SHALL allow User mark translation as "favorite" hoặc "poor quality"
4. THE System SHALL store ratings và feedback trong localStorage
5. THE System SHALL show average rating cho frequently used phrases
6. THE System SHALL allow User add notes về translation quality
7. THE System SHALL export feedback data sang JSON file
8. THE System SHALL provide statistics về translation quality over time
9. THE System SHALL suggest alternative translations cho low-rated results
10. THE System SHALL allow User compare multiple translations side-by-side

### Requirement 13: Batch Translation

**User Story:** Là một User cần dịch nhiều câu cùng lúc, tôi muốn upload danh sách văn bản và nhận kết quả dịch hàng loạt để tiết kiệm thời gian.

#### Acceptance Criteria

1. THE System SHALL allow User input multiple texts (separated by line breaks)
2. THE System SHALL translate all texts trong batch với progress indicator
3. THE System SHALL allow User upload CSV file với multiple texts
4. THE System SHALL process batch translations với rate limiting để tránh API errors
5. THE System SHALL show individual progress cho mỗi item trong batch
6. THE System SHALL allow User pause và resume batch translation
7. THE System SHALL export batch results sang CSV hoặc JSON format
8. THE System SHALL handle errors cho individual items without stopping entire batch
9. THE System SHALL provide summary statistics sau khi batch complete
10. THE System SHALL limit batch size đến 100 items để tránh performance issues

## Non-Functional Requirements

### Performance
- Page load time SHALL remain under 3 seconds
- TTS playback SHALL start within 500ms
- STT recognition SHALL process speech real-time với latency < 1 second
- File processing SHALL complete within 10 seconds cho 5MB file
- PWA installation SHALL complete within 5 seconds

### Usability
- All features SHALL be accessible via keyboard
- Mobile gestures SHALL feel natural và responsive
- Error messages SHALL be clear và actionable
- Help documentation SHALL be available offline

### Compatibility
- System SHALL work trên Chrome, Firefox, Safari, Edge (latest 2 versions)
- PWA SHALL be installable trên iOS, Android, Windows, macOS
- Features SHALL degrade gracefully trên unsupported browsers

### Storage
- Total localStorage usage SHALL NOT exceed 10MB
- System SHALL warn User khi storage approaching limit
- System SHALL provide cleanup tools cho old data

### Security
- API keys SHALL be encrypted trong localStorage
- User data SHALL NOT be sent to third-party services
- Exported files SHALL NOT contain sensitive information unless explicitly included
