

# Deployment Checklist for LVTranslator v2.0

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Test coverage > 80% (`npm run test:coverage`)
- [ ] No linter errors
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in production build

### ✅ Security
- [ ] API key stored in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] No sensitive data in code
- [ ] CSP headers configured in `vercel.json`
- [ ] Rate limiting enabled
- [ ] Input sanitization tested
- [ ] File upload validation working
- [ ] HTTPS enforced

### ✅ Performance
- [ ] Page load time < 2s
- [ ] Translation response < 3s
- [ ] File processing working in Web Worker
- [ ] Cache hit rate > 30%
- [ ] Storage optimization enabled
- [ ] Lazy loading configured
- [ ] Bundle size optimized

### ✅ Documentation
- [ ] README.md updated
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guide available
- [ ] User guide updated

## 🚀 Deployment Steps

### Step 1: Prepare Environment

```bash
# 1. Clone repository (if needed)
git clone https://github.com/yourusername/LVTranslator.git
cd LVTranslator

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build for production
npm run build

# 5. Test production build
npm run preview
```

### Step 2: Setup Vercel Account

1. Create Vercel account at https://vercel.com
2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

### Step 3: Configure Environment Variables

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project (or create new)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Production, Preview, Development |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Production |
| `RATE_LIMIT_MAX_REQUESTS` | 10 | Production |
| `NODE_ENV` | production | Production |

#### Option B: Via CLI
```bash
vercel env add GEMINI_API_KEY
# Enter your API key when prompted

vercel env add RATE_LIMIT_WINDOW_MS
# Enter: 60000

vercel env add RATE_LIMIT_MAX_REQUESTS
# Enter: 10

vercel env add NODE_ENV
# Enter: production
```

### Step 4: Deploy to Vercel

#### First Deployment
```bash
# Link to Vercel project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Subsequent Deployments
```bash
# Deploy directly to production
vercel --prod
```

### Step 5: Verify Deployment

After deployment, verify:

1. **Health Check**
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "apiKeyConfigured": true,
  "version": "2.0.0"
}
```

2. **Translation Test**
```bash
curl -X POST https://your-app.vercel.app/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Xin chào","sourceLang":"vi","targetLang":"lo"}'
```

3. **Frontend Check**
- Open https://your-app.vercel.app
- Test translation
- Test file upload
- Test history
- Check mobile responsiveness
- Test dark mode

### Step 6: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

## 📊 Post-Deployment Monitoring

### Immediate Checks (First 24 hours)

#### Performance Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app

# curl-format.txt content:
time_namelookup:  %{time_namelookup}s\n
time_connect:  %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer:  %{time_pretransfer}s\n
time_redirect:  %{time_redirect}s\n
time_starttransfer:  %{time_starttransfer}s\n
time_total:  %{time_total}s\n
```

#### Error Monitoring
- [ ] Check Vercel deployment logs
- [ ] Monitor function errors
- [ ] Check rate limit hits
- [ ] Monitor API quota usage

#### User Testing
- [ ] Test from different devices
- [ ] Test from different locations
- [ ] Test with slow network (throttling)
- [ ] Test all features end-to-end

### Ongoing Monitoring (Weekly)

#### Performance Metrics
- [ ] Page load time trends
- [ ] API response time trends
- [ ] Cache hit rate
- [ ] Storage usage
- [ ] Memory usage

#### Security Checks
- [ ] Review error logs for attack patterns
- [ ] Check rate limit effectiveness
- [ ] Verify CSP headers
- [ ] Review file upload attempts

#### Usage Analytics
- [ ] Number of translations
- [ ] Most used language pairs
- [ ] File upload statistics
- [ ] User retention

## 🔧 Monitoring Setup

### Vercel Built-in Monitoring

Vercel provides:
- Real-time logs
- Function duration
- Error tracking
- Bandwidth usage

Access: https://vercel.com/your-username/your-project/logs

### Google Analytics (Optional)

Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking with Sentry (Optional)

1. Sign up at https://sentry.io
2. Create project
3. Install Sentry SDK:
```bash
npm install @sentry/browser
```

4. Initialize in `src/main.js`:
```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV
});
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (https://uptimerobot.com) - Free
- **Pingdom** (https://www.pingdom.com)
- **StatusCake** (https://www.statuscake.com)

Configure:
- Check every 5 minutes
- Alert on downtime
- Monitor response time

## 🚨 Troubleshooting

### Common Issues

#### 1. API Key Not Working
**Symptoms:** 503 errors from `/api/translate`

**Solution:**
```bash
# Verify environment variable is set
vercel env ls

# If missing, add it
vercel env add GEMINI_API_KEY

# Redeploy
vercel --prod
```

#### 2. Rate Limiting Too Strict
**Symptoms:** Users getting 429 errors

**Solution:**
```bash
# Increase rate limit
vercel env add RATE_LIMIT_MAX_REQUESTS
# Enter a higher value (e.g., 20)

# Redeploy
vercel --prod
```

#### 3. Slow Performance
**Symptoms:** Page load > 3s

**Solution:**
- Check Vercel Analytics for slow functions
- Verify CDN is working
- Check if lazy loading is enabled
- Review bundle size

#### 4. Build Failures
**Symptoms:** Deployment fails during build

**Solution:**
```bash
# Test build locally
npm run build

# Check for errors
# Fix any build errors
# Commit and redeploy
```

## 📈 Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| Page Load Time | < 2s | Lighthouse, Vercel Analytics |
| Time to Interactive | < 3s | Lighthouse |
| Translation Response | < 3s | Custom logging |
| API Error Rate | < 1% | Vercel logs |
| Cache Hit Rate | > 30% | Built-in monitor |
| Uptime | > 99.9% | UptimeRobot |

## 🎯 Success Criteria

Deployment is successful when:

- [x] All health checks pass
- [x] Zero critical errors in first hour
- [x] Page load time < 2s
- [x] Translation working correctly
- [x] File upload working
- [x] History persisting
- [x] Mobile responsive
- [x] Dark mode working
- [x] No console errors
- [x] HTTPS enforced

## 📝 Post-Deployment Tasks

### Day 1
- [ ] Monitor error logs continuously
- [ ] Test all features thoroughly
- [ ] Verify mobile functionality
- [ ] Check analytics setup

### Week 1
- [ ] Review performance metrics
- [ ] Check API usage and costs
- [ ] Gather user feedback
- [ ] Fix any reported issues

### Month 1
- [ ] Analyze usage patterns
- [ ] Optimize based on real data
- [ ] Update documentation
- [ ] Plan next improvements

## 🆘 Emergency Rollback

If critical issues occur:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or promote specific deployment
vercel promote [deployment-url] --prod
```

## 📞 Support Contacts

- **Vercel Support:** support@vercel.com
- **Google Gemini API:** https://ai.google.dev/support
- **Project Issues:** [GitHub Issues URL]

---

## ✅ Final Checklist Before Going Live

- [ ] All environment variables set
- [ ] Tests passing (195+ tests)
- [ ] Build successful
- [ ] Health endpoint responding
- [ ] Translation working
- [ ] File upload working
- [ ] Mobile tested
- [ ] Performance acceptable
- [ ] Security headers verified
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Team notified

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Vercel URL:** _______________  
**Custom Domain:** _______________  

🎉 **Ready to deploy!** Good luck!

