#!/usr/bin/env node

/**
 * Build Optimization Script for LVTranslator Vue.js Application
 * 
 * This script performs post-build optimizations including:
 * - Asset optimization
 * - Bundle analysis
 * - Performance validation
 * - Security header generation
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')

// Configuration
const config = {
  maxChunkSize: 500 * 1024, // 500KB
  maxAssetSize: 1024 * 1024, // 1MB
  compressionThreshold: 1024, // 1KB
  enableOptimization: process.env.NODE_ENV === 'production'
}

// Utility functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const calculateHash = (content) => {
  return createHash('sha256').update(content).digest('hex').substring(0, 8)
}

// Asset analysis functions
async function analyzeAssets() {
  console.log('🔍 Analyzing build assets...')
  
  const assets = []
  const warnings = []
  
  async function scanDirectory(dir, relativePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name)
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relPath)
      } else {
        const stats = await fs.stat(fullPath)
        const asset = {
          name: entry.name,
          path: relPath,
          size: stats.size,
          type: path.extname(entry.name).toLowerCase()
        }
        
        assets.push(asset)
        
        // Check for size warnings
        if (asset.type === '.js' && asset.size > config.maxChunkSize) {
          warnings.push(`Large JavaScript chunk: ${asset.path} (${formatBytes(asset.size)})`)
        }
        
        if (asset.size > config.maxAssetSize) {
          warnings.push(`Large asset: ${asset.path} (${formatBytes(asset.size)})`)
        }
      }
    }
  }
  
  await scanDirectory(distDir)
  
  // Generate analysis report
  const report = {
    totalAssets: assets.length,
    totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
    assetsByType: {},
    largestAssets: assets
      .sort((a, b) => b.size - a.size)
      .slice(0, 10),
    warnings
  }
  
  // Group by type
  assets.forEach(asset => {
    const type = asset.type || 'other'
    if (!report.assetsByType[type]) {
      report.assetsByType[type] = { count: 0, size: 0 }
    }
    report.assetsByType[type].count++
    report.assetsByType[type].size += asset.size
  })
  
  return report
}

// Performance validation
async function validatePerformance(report) {
  console.log('⚡ Validating performance metrics...')
  
  const metrics = {
    bundleSize: report.totalSize,
    jsSize: report.assetsByType['.js']?.size || 0,
    cssSize: report.assetsByType['.css']?.size || 0,
    imageSize: (report.assetsByType['.png']?.size || 0) + 
               (report.assetsByType['.jpg']?.size || 0) + 
               (report.assetsByType['.svg']?.size || 0),
    fontSize: (report.assetsByType['.woff']?.size || 0) + 
              (report.assetsByType['.woff2']?.size || 0)
  }
  
  const recommendations = []
  
  // Performance thresholds
  if (metrics.jsSize > 1024 * 1024) { // 1MB
    recommendations.push('Consider code splitting to reduce JavaScript bundle size')
  }
  
  if (metrics.cssSize > 200 * 1024) { // 200KB
    recommendations.push('Consider CSS optimization and unused CSS removal')
  }
  
  if (metrics.imageSize > 2 * 1024 * 1024) { // 2MB
    recommendations.push('Consider image optimization and WebP format')
  }
  
  return {
    metrics,
    recommendations,
    score: calculatePerformanceScore(metrics)
  }
}

function calculatePerformanceScore(metrics) {
  let score = 100
  
  // Deduct points for large bundles
  if (metrics.jsSize > 500 * 1024) score -= 10
  if (metrics.jsSize > 1024 * 1024) score -= 20
  
  if (metrics.cssSize > 100 * 1024) score -= 5
  if (metrics.cssSize > 200 * 1024) score -= 10
  
  if (metrics.bundleSize > 2 * 1024 * 1024) score -= 15
  if (metrics.bundleSize > 5 * 1024 * 1024) score -= 30
  
  return Math.max(0, score)
}

// Security optimization
async function generateSecurityHeaders() {
  console.log('🔒 Generating security headers...')
  
  const headers = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://generativelanguage.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://generativelanguage.googleapis.com",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
  
  // Write security headers file
  const headersFile = path.join(distDir, '_headers')
  const headersContent = Object.entries(headers)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n')
  
  await fs.writeFile(headersFile, `/*\n${headersContent}\n`)
  
  return headers
}

// Asset optimization
async function optimizeAssets() {
  if (!config.enableOptimization) {
    console.log('⏭️  Skipping asset optimization (not in production mode)')
    return
  }
  
  console.log('🎯 Optimizing assets...')
  
  // Add integrity hashes to critical assets
  const indexPath = path.join(distDir, 'index.html')
  let indexContent = await fs.readFile(indexPath, 'utf-8')
  
  // Find and add integrity attributes to script and link tags
  const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*>/g
  const linkRegex = /<link[^>]+href="([^"]+)"[^>]*rel="stylesheet"[^>]*>/g
  
  let match
  while ((match = scriptRegex.exec(indexContent)) !== null) {
    const scriptPath = path.join(distDir, match[1])
    try {
      const scriptContent = await fs.readFile(scriptPath)
      const hash = calculateHash(scriptContent)
      const integrity = `sha256-${Buffer.from(hash, 'hex').toString('base64')}`
      
      indexContent = indexContent.replace(
        match[0],
        match[0].replace('>', ` integrity="${integrity}" crossorigin="anonymous">`)
      )
    } catch (error) {
      console.warn(`Could not add integrity to ${match[1]}:`, error.message)
    }
  }
  
  await fs.writeFile(indexPath, indexContent)
}

// Generate build manifest
async function generateManifest(report, performance) {
  console.log('📋 Generating build manifest...')
  
  const manifest = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.VITE_APP_ENV || 'production',
    assets: {
      total: report.totalAssets,
      size: report.totalSize,
      sizeFormatted: formatBytes(report.totalSize),
      byType: Object.fromEntries(
        Object.entries(report.assetsByType).map(([type, data]) => [
          type,
          {
            count: data.count,
            size: data.size,
            sizeFormatted: formatBytes(data.size)
          }
        ])
      )
    },
    performance: {
      score: performance.score,
      metrics: Object.fromEntries(
        Object.entries(performance.metrics).map(([key, value]) => [
          key,
          {
            size: value,
            sizeFormatted: formatBytes(value)
          }
        ])
      ),
      recommendations: performance.recommendations
    },
    warnings: report.warnings
  }
  
  await fs.writeFile(
    path.join(distDir, 'build-manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  
  return manifest
}

// Main optimization function
async function optimize() {
  console.log('🚀 Starting build optimization...\n')
  
  try {
    // Check if dist directory exists
    await fs.access(distDir)
    
    // Run optimization steps
    const report = await analyzeAssets()
    const performance = await validatePerformance(report)
    const securityHeaders = await generateSecurityHeaders()
    await optimizeAssets()
    const manifest = await generateManifest(report, performance)
    
    // Print summary
    console.log('\n📊 Build Optimization Summary:')
    console.log('=====================================')
    console.log(`Total Assets: ${report.totalAssets}`)
    console.log(`Total Size: ${formatBytes(report.totalSize)}`)
    console.log(`Performance Score: ${performance.score}/100`)
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      report.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    if (performance.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      performance.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }
    
    console.log('\n✅ Build optimization completed successfully!')
    
    // Exit with error if performance score is too low
    if (performance.score < 70) {
      console.error('\n❌ Performance score is below threshold (70). Consider optimizing the build.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Build optimization failed:', error.message)
    process.exit(1)
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimize()
}

export { optimize, analyzeAssets, validatePerformance, generateSecurityHeaders }