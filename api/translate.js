import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiter store (in-memory for serverless, consider Redis for production)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'); // 10 requests per minute

/**
 * Rate limiter middleware
 * @param {string} identifier - IP address or user identifier
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Get existing requests for this identifier
  let requests = rateLimitStore.get(identifier) || [];
  
  // Remove old requests outside the window
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  const allowed = requests.length < RATE_LIMIT_MAX_REQUESTS;
  
  if (allowed) {
    requests.push(now);
    rateLimitStore.set(identifier, requests);
  }

  const resetTime = requests.length > 0 ? requests[0] + RATE_LIMIT_WINDOW_MS : now + RATE_LIMIT_WINDOW_MS;
  
  return {
    allowed,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - requests.length - 1),
    resetTime
  };
}

/**
 * Validate translation request
 * @param {Object} body - Request body
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateRequest(body) {
  const { text, sourceLang, targetLang } = body;

  // Check required fields
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Invalid or missing text field' };
  }

  if (!sourceLang || !targetLang) {
    return { valid: false, error: 'Missing language parameters' };
  }

  // Validate language codes
  const validLangs = ['vi', 'lo', 'en'];
  if (!validLangs.includes(sourceLang) || !validLangs.includes(targetLang)) {
    return { valid: false, error: 'Invalid language code' };
  }

  // Validate text length (max 10,000 characters)
  if (text.length > 10000) {
    return { valid: false, error: 'Text exceeds maximum length of 10,000 characters' };
  }

  // Check for empty or whitespace-only text
  if (text.trim().length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  return { valid: true };
}

/**
 * Sanitize text input to prevent injection attacks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  // Remove potentially dangerous characters/patterns
  // This is a basic sanitization, more comprehensive sanitization should be done on client-side
  return text.trim();
}

/**
 * Call Google Gemini API for translation
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, sourceLang, targetLang) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Language names mapping
  const langNames = {
    'vi': 'Vietnamese',
    'lo': 'Lao',
    'en': 'English'
  };

  const prompt = `Translate the following text from ${langNames[sourceLang]} to ${langNames[targetLang]}. Provide ONLY the translation, without any explanations or additional text.\n\nText to translate: ${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();
    return translatedText.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Translation service error');
  }
}

/**
 * Main API handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    // Get client identifier (IP address)
    const identifier = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.socket.remoteAddress || 
                      'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(identifier);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimit.resetTime);

    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Validate request body
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: validation.error 
      });
    }

    // Sanitize input
    const sanitizedText = sanitizeText(req.body.text);
    const { sourceLang, targetLang } = req.body;

    // Perform translation
    const translatedText = await translateText(sanitizedText, sourceLang, targetLang);

    // Return success response
    return res.status(200).json({
      success: true,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Return appropriate error response
    const statusCode = error.message === 'GEMINI_API_KEY not configured' ? 503 : 500;
    
    return res.status(statusCode).json({ 
      error: 'Translation failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
    });
  }
}

