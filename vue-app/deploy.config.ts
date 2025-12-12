/**
 * Deployment Configuration for LVTranslator Vue.js Application
 * 
 * This file contains deployment-specific configurations for different
 * hosting platforms and environments.
 */

export interface DeploymentConfig {
  platform: string
  baseUrl: string
  buildCommand: string
  outputDir: string
  environmentVariables: Record<string, string>
  headers?: Record<string, string>
  redirects?: Array<{ from: string; to: string; status?: number }>
  caching?: {
    staticAssets: string
    htmlFiles: string
    apiResponses: string
  }
}

// Platform-specific deployment configurations
export const deploymentConfigs: Record<string, DeploymentConfig> = {
  // Vercel deployment configuration
  vercel: {
    platform: 'vercel',
    baseUrl: './',
    buildCommand: 'npm run build:prod',
    outputDir: 'dist',
    environmentVariables: {
      NODE_VERSION: '18',
      VITE_APP_ENV: 'production'
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block'
    },
    redirects: [
      { from: '/*', to: '/index.html', status: 200 }
    ],
    caching: {
      staticAssets: 'public, max-age=31536000, immutable',
      htmlFiles: 'no-cache, no-store, must-revalidate',
      apiResponses: 'public, max-age=3600'
    }
  },

  // Netlify deployment configuration
  netlify: {
    platform: 'netlify',
    baseUrl: './',
    buildCommand: 'npm run build:prod',
    outputDir: 'dist',
    environmentVariables: {
      NODE_VERSION: '18',
      VITE_APP_ENV: 'production'
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    redirects: [
      { from: '/*', to: '/index.html', status: 200 }
    ],
    caching: {
      staticAssets: 'public, max-age=31536000, immutable',
      htmlFiles: 'no-cache, no-store, must-revalidate',
      apiResponses: 'public, max-age=3600'
    }
  },

  // GitHub Pages deployment configuration
  'github-pages': {
    platform: 'github-pages',
    baseUrl: '/lvtranslator/', // Adjust based on repository name
    buildCommand: 'npm run build:prod',
    outputDir: 'dist',
    environmentVariables: {
      NODE_VERSION: '18',
      VITE_APP_ENV: 'production'
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    },
    redirects: [
      { from: '/*', to: '/index.html', status: 200 }
    ],
    caching: {
      staticAssets: 'public, max-age=31536000',
      htmlFiles: 'no-cache',
      apiResponses: 'public, max-age=3600'
    }
  },

  // Firebase Hosting deployment configuration
  firebase: {
    platform: 'firebase',
    baseUrl: './',
    buildCommand: 'npm run build:prod',
    outputDir: 'dist',
    environmentVariables: {
      NODE_VERSION: '18',
      VITE_APP_ENV: 'production'
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    redirects: [
      { from: '**', to: '/index.html' }
    ],
    caching: {
      staticAssets: 'max-age=31536000',
      htmlFiles: 'no-cache',
      apiResponses: 'max-age=3600'
    }
  },

  // AWS S3 + CloudFront deployment configuration
  aws: {
    platform: 'aws',
    baseUrl: './',
    buildCommand: 'npm run build:prod',
    outputDir: 'dist',
    environmentVariables: {
      NODE_VERSION: '18',
      VITE_APP_ENV: 'production'
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    },
    redirects: [
      { from: '/*', to: '/index.html', status: 200 }
    ],
    caching: {
      staticAssets: 'public, max-age=31536000, immutable',
      htmlFiles: 'no-cache, no-store, must-revalidate',
      apiResponses: 'public, max-age=3600'
    }
  }
}

// Generate platform-specific configuration files
export const configGenerators = {
  // Generate vercel.json
  vercel: (config: DeploymentConfig) => ({
    version: 2,
    builds: [
      {
        src: 'package.json',
        use: '@vercel/static-build',
        config: {
          distDir: config.outputDir
        }
      }
    ],
    routes: config.redirects?.map(redirect => ({
      src: redirect.from,
      dest: redirect.to,
      status: redirect.status
    })),
    headers: [
      {
        source: '/(.*)',
        headers: Object.entries(config.headers || {}).map(([key, value]) => ({
          key,
          value
        }))
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: config.caching?.staticAssets || 'public, max-age=31536000, immutable'
          }
        ]
      }
    ],
    env: config.environmentVariables
  }),

  // Generate netlify.toml
  netlify: (config: DeploymentConfig) => `
[build]
  publish = "${config.outputDir}"
  command = "${config.buildCommand}"

[build.environment]
${Object.entries(config.environmentVariables).map(([key, value]) => `  ${key} = "${value}"`).join('\n')}

${config.redirects?.map(redirect => `
[[redirects]]
  from = "${redirect.from}"
  to = "${redirect.to}"
  status = ${redirect.status || 200}
`).join('')}

[[headers]]
  for = "/*"
  [headers.values]
${Object.entries(config.headers || {}).map(([key, value]) => `    ${key} = "${value}"`).join('\n')}

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "${config.caching?.staticAssets || 'public, max-age=31536000, immutable'}"
  `,

  // Generate firebase.json
  firebase: (config: DeploymentConfig) => ({
    hosting: {
      public: config.outputDir,
      ignore: [
        'firebase.json',
        '**/.*',
        '**/node_modules/**'
      ],
      rewrites: config.redirects?.map(redirect => ({
        source: redirect.from,
        destination: redirect.to
      })),
      headers: [
        {
          source: '**/*.@(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2)',
          headers: [
            {
              key: 'Cache-Control',
              value: config.caching?.staticAssets || 'max-age=31536000'
            }
          ]
        },
        {
          source: '**/*.@(html|json)',
          headers: [
            {
              key: 'Cache-Control',
              value: config.caching?.htmlFiles || 'no-cache'
            }
          ]
        }
      ]
    }
  }),

  // Generate GitHub Actions workflow
  'github-actions': (config: DeploymentConfig) => `
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
        node-version: '${config.environmentVariables.NODE_VERSION || '18'}'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: ${config.buildCommand}
      env:
${Object.entries(config.environmentVariables).map(([key, value]) => `        ${key}: \${{ secrets.${key} || '${value}' }}`).join('\n')}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./${config.outputDir}
  `
}

// Deployment utilities
export const deploymentUtils = {
  // Validate deployment configuration
  validateConfig: (config: DeploymentConfig): boolean => {
    const required = ['platform', 'baseUrl', 'buildCommand', 'outputDir']
    return required.every(field => config[field as keyof DeploymentConfig])
  },

  // Generate environment-specific configuration
  generateEnvConfig: (platform: string, environment: string) => {
    const baseConfig = deploymentConfigs[platform]
    if (!baseConfig) {
      throw new Error(`Unknown platform: ${platform}`)
    }

    return {
      ...baseConfig,
      environmentVariables: {
        ...baseConfig.environmentVariables,
        VITE_APP_ENV: environment
      }
    }
  },

  // Generate security headers
  generateSecurityHeaders: (strict = false) => {
    const baseHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block'
    }

    if (strict) {
      return {
        ...baseHeaders,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://generativelanguage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
      }
    }

    return baseHeaders
  },

  // Generate cache configuration
  generateCacheConfig: (aggressive = false) => {
    if (aggressive) {
      return {
        staticAssets: 'public, max-age=31536000, immutable',
        htmlFiles: 'no-cache, no-store, must-revalidate',
        apiResponses: 'public, max-age=7200'
      }
    }

    return {
      staticAssets: 'public, max-age=86400',
      htmlFiles: 'no-cache',
      apiResponses: 'public, max-age=3600'
    }
  }
}

export default {
  deploymentConfigs,
  configGenerators,
  deploymentUtils
}