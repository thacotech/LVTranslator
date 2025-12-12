# LVTranslator Deployment Guide

## Overview

This guide covers deployment options and configurations for the LVTranslator Vue.js application. The application is built as a Single Page Application (SPA) and can be deployed to various hosting platforms.

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Build output will be in the 'dist' directory
```

### Build Configuration

The application uses Vite for building. Key configuration files:

- `vite.config.ts` - Main build configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## Environment Configuration

### Environment Variables

Create environment files for different deployment environments:

#### `.env` (Default)
```env
# Application Configuration
VITE_APP_TITLE=LVTranslator
VITE_APP_VERSION=2.0.0
VITE_APP_DESCRIPTION=Vietnamese ↔ Lao Translator

# API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE_URL=https://generativelanguage.googleapis.com

# Feature Flags
VITE_ENABLE_TTS=true
VITE_ENABLE_STT=true
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_HISTORY=true

# Performance Settings
VITE_MAX_FILE_SIZE=10485760
VITE_MAX_HISTORY_ITEMS=50
VITE_TRANSLATION_CACHE_TTL=3600000

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=
VITE_ENABLE_ANALYTICS=false
```

#### `.env.production` (Production)
```env
# Production-specific settings
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_CONSOLE_LOGS=false

# Performance optimizations
VITE_ENABLE_COMPRESSION=true
VITE_ENABLE_CACHING=true
VITE_CACHE_MAX_AGE=31536000

# Security settings
VITE_ENABLE_CSP=true
VITE_ENABLE_HTTPS_ONLY=true
```

#### `.env.staging` (Staging)
```env
# Staging-specific settings
VITE_APP_ENV=staging
VITE_ENABLE_DEBUG=true
VITE_ENABLE_CONSOLE_LOGS=true

# Testing features
VITE_ENABLE_TEST_MODE=true
VITE_MOCK_API_RESPONSES=false
```

### Security Considerations

⚠️ **Important**: Never commit API keys or sensitive data to version control.

- Use environment variables for sensitive configuration
- Set up proper CORS policies
- Enable HTTPS in production
- Implement Content Security Policy (CSP)

## Deployment Platforms

### 1. Vercel (Recommended)

Vercel provides excellent support for Vue.js applications with automatic deployments.

#### Setup Steps

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project directory
   vercel
   ```

2. **Configuration** (`vercel.json`):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ],
     "env": {
       "VITE_GEMINI_API_KEY": "@gemini_api_key"
     },
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           }
         ]
       }
     ]
   }
   ```

3. **Environment Variables**:
   - Set environment variables in Vercel dashboard
   - Use Vercel secrets for sensitive data

### 2. Netlify

Netlify offers great static site hosting with continuous deployment.

#### Setup Steps

1. **Build Configuration** (`netlify.toml`):
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   
   [[headers]]
     for = "/assets/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

2. **Deploy**:
   - Connect GitHub repository to Netlify
   - Configure build settings
   - Set environment variables in Netlify dashboard

### 3. GitHub Pages

Free hosting option for open-source projects.

#### Setup Steps

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout
         uses: actions/checkout@v3
       
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           cache: 'npm'
       
       - name: Install dependencies
         run: npm ci
       
       - name: Build
         run: npm run build
         env:
           VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
       
       - name: Deploy to GitHub Pages
         uses: peaceiris/actions-gh-pages@v3
         if: github.ref == 'refs/heads/main'
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./dist
   ```

2. **Base URL Configuration**:
   ```typescript
   // vite.config.ts
   export default defineConfig({
     base: process.env.NODE_ENV === 'production' ? '/repository-name/' : '/',
     // ... other config
   })
   ```

### 4. Firebase Hosting

Google's hosting platform with excellent performance.

#### Setup Steps

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase** (`firebase.json`):
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**/*.@(js|css)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "max-age=31536000"
             }
           ]
         }
       ]
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

### 5. AWS S3 + CloudFront

Enterprise-grade hosting with global CDN.

#### Setup Steps

1. **S3 Bucket Configuration**:
   - Create S3 bucket with static website hosting
   - Enable public read access
   - Configure index document as `index.html`
   - Set error document as `index.html` (for SPA routing)

2. **CloudFront Distribution**:
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom error pages (404 → 200 → /index.html)
   - Enable compression
   - Set appropriate cache behaviors

3. **Deployment Script** (`deploy-aws.sh`):
   ```bash
   #!/bin/bash
   
   # Build the application
   npm run build
   
   # Sync to S3
   aws s3 sync dist/ s3://your-bucket-name --delete
   
   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

## Performance Optimization

### Build Optimizations

1. **Vite Configuration** (`vite.config.ts`):
   ```typescript
   export default defineConfig({
     build: {
       target: 'esnext',
       minify: 'terser',
       terserOptions: {
         compress: {
           drop_console: true,
           drop_debugger: true,
         },
       },
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['vue', 'vue-router', 'pinia'],
             antd: ['ant-design-vue'],
             utils: ['lodash-es', 'dayjs'],
           },
         },
       },
       chunkSizeWarningLimit: 1000,
     },
   })
   ```

2. **Asset Optimization**:
   - Enable gzip/brotli compression
   - Optimize images and fonts
   - Use appropriate cache headers
   - Implement lazy loading for components

### CDN Configuration

1. **Static Assets**:
   ```typescript
   // Use CDN for static assets in production
   const assetsCDN = process.env.NODE_ENV === 'production' 
     ? 'https://cdn.example.com' 
     : ''
   ```

2. **Cache Headers**:
   ```
   # Static assets (1 year)
   Cache-Control: public, max-age=31536000, immutable
   
   # HTML files (no cache)
   Cache-Control: no-cache, no-store, must-revalidate
   
   # API responses (1 hour)
   Cache-Control: public, max-age=3600
   ```

## Monitoring and Analytics

### Performance Monitoring

1. **Web Vitals**:
   ```typescript
   // Add to main.ts
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
   
   getCLS(console.log)
   getFID(console.log)
   getFCP(console.log)
   getLCP(console.log)
   getTTFB(console.log)
   ```

2. **Error Tracking**:
   ```typescript
   // Global error handler
   window.addEventListener('error', (event) => {
     // Send error to monitoring service
     console.error('Global error:', event.error)
   })
   
   window.addEventListener('unhandledrejection', (event) => {
     // Send promise rejection to monitoring service
     console.error('Unhandled promise rejection:', event.reason)
   })
   ```

### Analytics Integration

1. **Google Analytics 4**:
   ```typescript
   // Install: npm install gtag
   import { gtag } from 'gtag'
   
   // Initialize in main.ts
   gtag('config', 'GA_MEASUREMENT_ID', {
     page_title: 'LVTranslator',
     page_location: window.location.href,
   })
   ```

2. **Custom Events**:
   ```typescript
   // Track translation events
   gtag('event', 'translation', {
     event_category: 'engagement',
     event_label: `${sourceLanguage}-${targetLanguage}`,
     value: textLength,
   })
   ```

## Security Configuration

### Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://generativelanguage.googleapis.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://generativelanguage.googleapis.com;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

### HTTPS Configuration

1. **Force HTTPS**:
   ```javascript
   // Add to main.ts for production
   if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
     location.replace(`https:${location.href.substring(location.protocol.length)}`)
   }
   ```

2. **HSTS Headers**:
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```

## Troubleshooting Deployment Issues

### Common Issues

1. **Routing Issues (404 on refresh)**:
   - Ensure SPA fallback is configured
   - All routes should serve `index.html`
   - Check server configuration for history mode

2. **Environment Variables Not Working**:
   - Verify variable names start with `VITE_`
   - Check if variables are set in deployment platform
   - Ensure no typos in variable names

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors
   - Ensure sufficient memory for build process

4. **Performance Issues**:
   - Enable compression (gzip/brotli)
   - Configure proper cache headers
   - Optimize bundle size
   - Use CDN for static assets

### Debug Steps

1. **Local Testing**:
   ```bash
   # Test production build locally
   npm run build
   npm run preview
   ```

2. **Check Build Output**:
   ```bash
   # Analyze bundle size
   npm run build -- --analyze
   
   # Check for build warnings
   npm run build 2>&1 | grep -i warning
   ```

3. **Network Analysis**:
   - Use browser DevTools Network tab
   - Check for failed requests
   - Verify correct MIME types
   - Monitor loading times

## Maintenance

### Regular Tasks

1. **Dependency Updates**:
   ```bash
   # Check for updates
   npm outdated
   
   # Update dependencies
   npm update
   
   # Update major versions carefully
   npm install package@latest
   ```

2. **Security Audits**:
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Fix automatically
   npm audit fix
   ```

3. **Performance Monitoring**:
   - Monitor Core Web Vitals
   - Check bundle size growth
   - Review error rates
   - Monitor API response times

### Backup and Recovery

1. **Configuration Backup**:
   - Keep environment variables documented
   - Backup deployment configurations
   - Document custom server settings

2. **Rollback Strategy**:
   - Keep previous build artifacts
   - Use deployment platform rollback features
   - Test rollback procedures regularly

## Conclusion

This deployment guide covers the most common deployment scenarios for the LVTranslator Vue.js application. Choose the platform that best fits your needs, considering factors like:

- **Cost**: GitHub Pages (free) vs. premium platforms
- **Performance**: CDN availability and global distribution
- **Features**: CI/CD integration, environment management
- **Scalability**: Traffic handling and resource limits
- **Security**: SSL certificates, security headers, compliance

For production deployments, always:
- Use HTTPS
- Implement proper security headers
- Monitor performance and errors
- Keep dependencies updated
- Have a rollback strategy

Happy deploying! 🚀