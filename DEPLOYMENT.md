# Deployment Guide

This guide covers deploying LVTranslator v2.0 to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Google Gemini API key
- ✅ Git repository set up
- ✅ Node.js 18+ installed locally
- ✅ Project built and tested

## 🚀 Vercel Deployment (Recommended)

Vercel provides the best experience for this application with built-in serverless functions support.

### Initial Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   vercel link
   ```

### Configure Environment Variables

#### Via Vercel Dashboard
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   ```
   GEMINI_API_KEY=your_api_key_here
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   NODE_ENV=production
   ```

#### Via CLI
```bash
vercel env add GEMINI_API_KEY
# Enter your API key when prompted

vercel env add RATE_LIMIT_WINDOW_MS
# Enter 60000

vercel env add RATE_LIMIT_MAX_REQUESTS
# Enter 10
```

### Deploy

#### Development Preview
```bash
vercel
```

#### Production Deployment
```bash
vercel --prod
```

### Continuous Deployment

Connect your Git repository to Vercel for automatic deployments:

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your repository
4. Configure environment variables
5. Deploy!

Every push to `main` will automatically deploy to production.

## 🔧 Netlify Deployment

### Setup

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize**
   ```bash
   netlify init
   ```

### Configure

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "npm run dev"
  port = 3000

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline';"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

### Adapt Functions

Convert Vercel functions to Netlify format:

```javascript
// netlify/functions/translate.js
exports.handler = async (event, context) => {
  // Your function code
};
```

### Deploy

```bash
netlify deploy --prod
```

## ☁️ AWS Deployment

### Using AWS Amplify

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Project**
   ```bash
   amplify init
   ```

3. **Add API**
   ```bash
   amplify add api
   # Select REST API
   # Configure endpoints
   ```

4. **Deploy**
   ```bash
   amplify push
   ```

### Using AWS Lambda + API Gateway

1. Package functions for Lambda
2. Create Lambda functions in AWS Console
3. Set up API Gateway
4. Configure environment variables in Lambda
5. Deploy frontend to S3 + CloudFront

## 🐳 Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build and Run

```bash
# Build image
docker build -t lvtranslator:latest .

# Run container
docker run -d \
  -p 80:80 \
  -e GEMINI_API_KEY=your_key \
  --name lvtranslator \
  lvtranslator:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

## 🌐 Custom Server Deployment

### Using Node.js

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Create Server**
   ```javascript
   // server.js
   const express = require('express');
   const app = express();
   
   app.use(express.static('dist'));
   app.use('/api', require('./api'));
   
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. **Run with PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js
   pm2 save
   pm2 startup
   ```

### Using Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/lvtranslator/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security Headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

## 🔒 Security Checklist

Before deploying to production:

- [ ] API key stored in environment variables (not in code)
- [ ] HTTPS enabled (required for Web Crypto API)
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated and scanned for vulnerabilities
- [ ] CORS properly configured
- [ ] File upload limits enforced
- [ ] Logging configured (but not logging sensitive data)

## 📊 Post-Deployment

### Monitoring

Set up monitoring for:
- API response times
- Error rates
- Rate limit hits
- Storage usage
- Cache hit rates

### Testing

After deployment, test:
- Translation functionality
- File upload (PDF, DOCX, images)
- History saving/loading
- API rate limiting
- Error handling
- Mobile responsiveness

### Performance

Use tools like:
- Google Lighthouse
- WebPageTest
- Vercel Analytics
- Sentry for error tracking

## 🆘 Troubleshooting

### Common Issues

**API Key Not Working**
- Verify environment variable is set correctly
- Check API key is valid in Google AI Studio
- Ensure HTTPS is enabled

**Rate Limiting Too Strict**
- Adjust `RATE_LIMIT_MAX_REQUESTS` in environment
- Consider implementing user authentication for higher limits

**Files Not Processing**
- Check file size limits
- Verify Web Workers are supported
- Check browser console for errors

**Build Failures**
- Clear node_modules and reinstall
- Check Node.js version (18+ required)
- Verify all dependencies are installed

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## 💡 Tips

1. **Use Environment Variables**: Never hardcode secrets
2. **Enable Caching**: Use CDN and browser caching
3. **Monitor Usage**: Track API calls to avoid surprises
4. **Regular Updates**: Keep dependencies up to date
5. **Backup Data**: Export user data regularly if needed

