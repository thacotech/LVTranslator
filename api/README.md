# LVTranslator Backend API

## Overview

This directory contains Vercel Serverless Functions that serve as a secure backend proxy for the LVTranslator application. The backend handles API key protection, rate limiting, input validation, and sanitization.

## Endpoints

### POST /api/translate

Translates text from one language to another using Google Gemini API.

**Request Body:**
```json
{
  "text": "Text to translate",
  "sourceLang": "vi",
  "targetLang": "lo"
}
```

**Supported Languages:**
- `vi` - Vietnamese
- `lo` - Lao
- `en` - English

**Response (Success):**
```json
{
  "success": true,
  "translatedText": "Translated text",
  "sourceLang": "vi",
  "targetLang": "lo",
  "timestamp": 1234567890
}
```

**Response (Error):**
```json
{
  "error": "Error type",
  "message": "Error description"
}
```

**Rate Limiting:**
- 10 requests per minute per IP address
- Headers include: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- HTTP 429 when limit exceeded

**Validation Rules:**
- Text is required and must be non-empty
- Maximum text length: 10,000 characters
- Source and target languages must be valid codes
- Languages cannot be the same

### GET /api/health

Health check endpoint to verify API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "apiKeyConfigured": true,
  "version": "2.0.0"
}
```

## Security Features

### 1. API Key Protection
- API key is stored securely in environment variables
- Never exposed to client-side code
- All API calls are proxied through the backend

### 2. Rate Limiting
- In-memory rate limiting per IP address
- Configurable limits via environment variables
- Automatic cleanup of old request records

### 3. Input Validation
- Strict validation of all request parameters
- Character limits to prevent abuse
- Language code validation

### 4. Input Sanitization
- Basic text sanitization to remove dangerous characters
- Trimming and normalization of input

### 5. CORS Configuration
- Controlled CORS headers
- Supports preflight OPTIONS requests

## Environment Variables

Create a `.env` file or configure in Vercel dashboard:

```env
# Required
GEMINI_API_KEY=your_google_gemini_api_key_here

# Optional (with defaults)
RATE_LIMIT_WINDOW_MS=60000          # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS=10          # Max requests per window
NODE_ENV=production                  # development or production
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Configure environment variables in Vercel dashboard or using CLI:
```bash
vercel env add GEMINI_API_KEY
```

3. Deploy:
```bash
vercel --prod
```

### Environment Setup

1. Get Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Add to Vercel project:
   - Go to Project Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your key
   - Add other optional variables if needed

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your API key:
```env
GEMINI_API_KEY=your_api_key_here
```

3. Run Vercel dev server:
```bash
vercel dev
```

4. Test the API:
```bash
# Health check
curl http://localhost:3000/api/health

# Translation test
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","sourceLang":"en","targetLang":"vi"}'
```

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input parameters |
| 405 | Method Not Allowed - Wrong HTTP method |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - API key not configured |

### Error Response Format

All errors follow this format:
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "retryAfter": 30  // Only for 429 errors
}
```

## Monitoring

### Logs

View logs in Vercel dashboard:
- Real-time logs during requests
- Error tracking and stack traces
- Performance metrics

### Metrics to Monitor

1. **Request Volume**: Total requests per time period
2. **Error Rate**: Percentage of failed requests
3. **Rate Limit Hits**: How often users hit rate limits
4. **Response Time**: Average API response time
5. **API Cost**: Google Gemini API usage and costs

## Security Best Practices

1. ✅ Never commit `.env` file to git
2. ✅ Rotate API keys regularly
3. ✅ Monitor for suspicious activity
4. ✅ Keep dependencies updated
5. ✅ Use HTTPS only in production
6. ✅ Implement additional authentication if needed
7. ✅ Log security events

## Scaling Considerations

For high-traffic scenarios, consider:

1. **Redis for Rate Limiting**: Replace in-memory store with Redis for distributed rate limiting
2. **Caching**: Implement Redis/Memcached for translation caching
3. **Load Balancing**: Vercel handles this automatically
4. **Database**: Store translation history and analytics
5. **CDN**: Serve static assets via CDN (Vercel includes this)

## Testing

Test the API endpoints:

```bash
# Run tests (when implemented)
npm test

# Test coverage
npm run test:coverage
```

## Support

For issues or questions:
- Check Vercel logs for errors
- Verify environment variables are set
- Ensure API key is valid and has sufficient quota
- Check rate limiting if getting 429 errors

