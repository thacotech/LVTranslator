# LVTranslator Vue.js Application

A modern Vue.js 3 application for Vietnamese ↔ Lao translation with Ant Design Vue components and comprehensive i18n support.

## 🚀 Features

- **Vue 3 + TypeScript**: Modern Vue.js with full TypeScript support
- **Ant Design Vue**: Enterprise-class UI components with custom theming
- **Vue i18n**: Internationalization support for Vietnamese, Lao, and English
- **Pinia**: State management for translation and settings
- **Vite**: Fast build tool with HMR and optimized bundling
- **ESLint + Prettier**: Code quality and formatting
- **Vitest**: Unit testing framework
- **Property-Based Testing**: Using fast-check for comprehensive testing

## 📁 Project Structure

```
src/
├── components/          # Vue components
│   ├── common/         # Reusable UI components
│   ├── file/           # File upload components
│   ├── history/        # Translation history components
│   ├── layout/         # Layout components
│   └── translation/    # Translation form components
├── locales/            # i18n translation files
├── router/             # Vue Router configuration
├── services/           # Business logic services
├── stores/             # Pinia stores
├── styles/             # Global CSS and design system
├── test/               # Test utilities and setup
├── types/              # TypeScript type definitions
└── views/              # Page components
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 🎨 Design System

The application uses a comprehensive design system with:

- **CSS Custom Properties**: For theming and consistency
- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Mobile-first approach
- **Lao Font Support**: Special typography for Lao language
- **Ant Design Customization**: Branded component styling

## 🌐 Internationalization

Supports three languages:
- **English** (en): Default interface language
- **Vietnamese** (vi): Full Vietnamese interface
- **Lao** (lo): Complete Lao interface with proper typography

## 🧪 Testing

- **Unit Tests**: Component and service testing with Vitest
- **Property-Based Tests**: Comprehensive testing with fast-check
- **Test Coverage**: Configured for comprehensive coverage reporting

## 📦 Build Configuration

- **Code Splitting**: Optimized chunks for better performance
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Source Maps**: Development and production source maps

## 🔧 Configuration Files

- `vite.config.ts`: Build tool configuration
- `tsconfig.json`: TypeScript configuration
- `.eslintrc.cjs`: ESLint rules and settings
- `.prettierrc.json`: Code formatting rules
- `vitest.config.ts`: Test configuration

## 🚀 Deployment

The application is configured for deployment with:
- Static file generation
- Environment variable support
- Production optimizations
- CDN-ready assets

## 📝 Development Guidelines

1. **Component Structure**: Follow Vue 3 Composition API patterns
2. **TypeScript**: Use strict typing for all components and services
3. **Testing**: Write both unit tests and property-based tests
4. **Accessibility**: Ensure WCAG compliance
5. **Performance**: Optimize for Core Web Vitals

## 🤝 Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure accessibility compliance
5. Test in all supported languages