# LVTranslator Static Web - Deployment Guide

## 🚀 GitHub Pages Deployment

### Prerequisites
- GitHub account
- Git installed
- Repository created

### Step 1: Prepare Project

```bash
# Clone repository
git clone https://github.com/yourusername/LVTranslator.git
cd LVTranslator

# Install dependencies
npm install

# Build for production (if using Vite)
npm run build
```

### Step 2: Configure GitHub Pages

1. Go to repository **Settings**
2. Navigate to **Pages** section
3. Under **Source**, select:
   - Branch: `main` or `gh-pages`
   - Folder: `/ (root)` or `/docs`
4. Click **Save**

### Step 3: Update Configuration

**Update `manifest.json`:**
```json
{
  "start_url": "/LVTranslator/",
  "scope": "/LVTranslator/"
}
```

**Update `service-worker.js`:**
```javascript
const CACHE_NAME = 'lvtranslator-v1';
const BASE_PATH = '/LVTranslator';
```

### Step 4: Deploy

**Option A: Direct Push**
```bash
git add .
git commit -m "Deploy static web enhancements"
git push origin main
```

**Option B: GitHub Actions (Recommended)**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Step 5: Verify Deployment

1. Visit `https://yourusername.github.io/LVTranslator/`
2. Check PWA installability
3. Test offline functionality
4. Verify all features work

---

## 🔧 Custom Domain (Optional)

### Setup Custom Domain

1. **Add CNAME file:**
```bash
echo "translator.yourdomain.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

2. **Configure DNS:**
   - Add CNAME record: `translator` → `yourusername.github.io`
   - Or A records pointing to GitHub IPs

3. **Enable HTTPS:**
   - GitHub automatically provisions SSL
   - Wait 24 hours for propagation

---

## 📱 PWA Configuration

### Ensure PWA Requirements

✅ **HTTPS** - GitHub Pages provides HTTPS  
✅ **Service Worker** - `public/service-worker.js`  
✅ **Manifest** - `public/manifest.json`  
✅ **Icons** - `public/icons/` (all sizes)  
✅ **Offline Page** - `public/offline.html`

### Test PWA

Use Chrome DevTools:
1. Open **Application** tab
2. Check **Manifest** section
3. Verify **Service Workers** registered
4. Test **Offline** mode
5. Try **Add to Home Screen**

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] Translation works
- [ ] TTS plays audio
- [ ] STT records voice
- [ ] Translation Memory saves/loads
- [ ] Glossary highlights terms
- [ ] Keyboard shortcuts work
- [ ] PWA installs
- [ ] Offline mode works
- [ ] File upload works (txt, csv, srt)
- [ ] Export/Import works

### Browser Testing

- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] iOS Safari
- [ ] Android Chrome

### Mobile Testing

- [ ] Touch gestures work
- [ ] Pull-to-refresh works
- [ ] Bottom sheets work
- [ ] FAB button works
- [ ] Swipe navigation works
- [ ] Keyboard behavior correct

### Performance Testing

- [ ] Page load < 3s
- [ ] TTS latency < 500ms
- [ ] STT latency < 1s
- [ ] Smooth animations
- [ ] No memory leaks

---

## 🐛 Troubleshooting

### Service Worker Not Registering

**Problem:** Service worker fails to register

**Solution:**
```javascript
// Check console for errors
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('SW registered:', reg))
    .catch(err => console.error('SW failed:', err));
}
```

### PWA Not Installable

**Problem:** Install prompt doesn't show

**Solutions:**
1. Ensure HTTPS enabled
2. Check manifest.json is valid
3. Verify service worker active
4. Clear browser cache
5. Check browser console for errors

### Paths Not Working

**Problem:** 404 errors on GitHub Pages

**Solution:**
```javascript
// Use relative paths
const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
const assetPath = `${basePath}/assets/`;
```

### Offline Not Working

**Problem:** App doesn't work offline

**Solution:**
1. Check service worker caching strategy
2. Verify assets in cache
3. Test with DevTools offline mode
4. Check network tab for failed requests

---

## 📊 Monitoring

### Analytics Setup (Optional)

**Google Analytics:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Error Tracking

**Console Logging:**
```javascript
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});
```

---

## 🔄 Updates & Maintenance

### Deploying Updates

1. Make changes
2. Test locally
3. Update version in manifest.json
4. Commit and push
5. GitHub Pages auto-deploys
6. Service worker auto-updates

### Cache Busting

**Update service worker version:**
```javascript
const CACHE_NAME = 'lvtranslator-v2'; // Increment version
```

### Database Migrations

**Handle localStorage changes:**
```javascript
const version = localStorage.getItem('app_version');
if (version !== '2.0.0') {
  // Migrate data
  migrateData();
  localStorage.setItem('app_version', '2.0.0');
}
```

---

## 📝 Post-Deployment

### Documentation

- [ ] Update README with deployment URL
- [ ] Add installation instructions
- [ ] Document known issues
- [ ] Create user guide

### Marketing

- [ ] Add to web app directories
- [ ] Share on social media
- [ ] Submit to search engines
- [ ] Create demo video

---

## 🎯 Performance Optimization

### Lighthouse Score Targets

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: ✅ Installable

### Optimization Tips

1. **Minify assets**
2. **Compress images**
3. **Enable Gzip**
4. **Lazy load non-critical resources**
5. **Use CDN for libraries**

---

**Deployment Checklist Complete!** ✅

Ready to deploy: `https://yourusername.github.io/LVTranslator/`

