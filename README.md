# LVTranslator - Vue.js Edition

Ứng dụng dịch thuật Vietnamese ↔ Lao được xây dựng với Vue.js 3, TypeScript, và Ant Design Vue.

## 🚀 Tính năng chính

- **Dịch thuật hai chiều**: Vietnamese ↔ Lao với Google Gemini AI
- **Xử lý file**: Hỗ trợ DOCX, PDF, và hình ảnh
- **Đa ngôn ngữ**: Interface hỗ trợ Việt, Lào, và Tiếng Anh
- **Lịch sử dịch thuật**: Lưu trữ và quản lý lịch sử
- **Text-to-Speech & Speech-to-Text**: Hỗ trợ âm thanh
- **Dark/Light mode**: Chuyển đổi giao diện
- **Responsive design**: Tối ưu cho mọi thiết bị
- **PWA ready**: Có thể cài đặt như ứng dụng

## 🛠️ Công nghệ sử dụng

- **Vue.js 3** với Composition API
- **TypeScript** cho type safety
- **Ant Design Vue** cho UI components
- **Pinia** cho state management
- **Vue I18n** cho đa ngôn ngữ
- **Vite** cho build tool
- **Vitest** cho testing
- **Fast-check** cho property-based testing

## 📁 Cấu trúc dự án

```
vue-app/
├── src/
│   ├── components/          # Vue components
│   │   ├── common/         # Shared components
│   │   ├── file/           # File upload components
│   │   ├── history/        # History components
│   │   ├── layout/         # Layout components
│   │   └── translation/    # Translation components
│   ├── composables/        # Vue composables
│   ├── locales/           # i18n translation files
│   ├── router/            # Vue Router config
│   ├── services/          # Business logic services
│   ├── stores/            # Pinia stores
│   ├── styles/            # CSS styles
│   ├── test/              # Test files
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── views/             # Vue views/pages
├── public/                # Static assets
└── dist/                  # Build output
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Cài đặt dependencies
```bash
cd vue-app
npm install
```

### Chạy development server
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:3000`

### Build cho production
```bash
npm run build
```

### Chạy tests
```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests ở watch mode
npm run test:watch
```

### Kiểm tra TypeScript
```bash
npm run type-check
```

### Lint và format code
```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🔧 Cấu hình

### API Key
Cập nhật API key của Google Gemini trong file:
```typescript
// src/services/translationService.ts
const apiKey = 'YOUR_GEMINI_API_KEY_HERE'
```

### Environment Variables
Tạo file `.env.local` trong thư mục `vue-app/`:
```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_BASE_URL=/
```

## 📱 Tính năng nâng cao

### Property-Based Testing
Dự án sử dụng property-based testing với fast-check để đảm bảo tính đúng đắn:
- Translation functionality preservation
- Input validation consistency
- Caching behavior
- UI component behavior
- Accessibility compliance

### Performance Optimizations
- Lazy loading components
- Code splitting
- Bundle optimization
- Efficient reactivity
- Caching strategies

### Accessibility
- ARIA labels và descriptions
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast compliance

## 🌐 Đa ngôn ngữ

Ứng dụng hỗ trợ 3 ngôn ngữ interface:
- **Tiếng Việt** (vi)
- **ພາສາລາວ** (lo) 
- **English** (en)

Thêm ngôn ngữ mới bằng cách tạo file trong `src/locales/`

## 🧪 Testing

### Unit Tests
- Component testing với Vue Test Utils
- Service testing
- Store testing
- Utility function testing

### Property-Based Tests
- Translation service properties
- UI behavior properties
- Data validation properties
- Performance properties

### Integration Tests
- End-to-end workflows
- Cross-component communication
- API integration

## 📦 Deployment

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Vercel
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### GitHub Pages
```bash
npm run build
# Push dist/ folder to gh-pages branch
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Ant Design Vue](https://antdv.com/) - Enterprise UI components
- [Google Gemini](https://ai.google.dev/) - AI translation service
- [Vite](https://vitejs.dev/) - Next generation build tool
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

---

**Phiên bản Vue.js 3 - Hiện đại, nhanh chóng, và dễ bảo trì** 🚀