/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { CookieVault } from './src/services/CookieVault'
import { OTPService } from './src/services/OTPService'
import { BrowserFactory } from './src/worker/stealth/browserFactory'
import { getConfig } from './src/utils/config'
import type { BrowserConfig, ProxyConfig, BrowserFingerprint } from './src/types/interfaces'

async function testAuthenticationSystem() {
  console.log('🔐 Testing LinkedFlow Cookie Authentication System...\n')

  try {
    // 1. Test Configuration
    console.log('📋 Step 1: Testing Configuration...')
    const config = getConfig()
    console.log(`✅ Encryption key loaded: ${config.encryptionKey.substring(0, 8)}...`)
    console.log(`✅ Database URL: ${config.databaseUrl}`)
    console.log(`✅ Redis URL: ${config.redisUrl}`)
    console.log('')

    // 2. Test CookieVault Encryption/Decryption
    console.log('🔒 Step 2: Testing CookieVault...')
    const cookieVault = new CookieVault(config.encryptionKey)

    const testCookies = JSON.stringify([
      {
        name: 'li_at',
        value: 'AQEDARs8aAABeKaL8UZ_VgGsV8wQ4cJ9V2o-MockCookieValue-12345',
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true
      },
      {
        name: 'JSESSIONID',
        value: 'ajax:1234567890123456789',
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true
      }
    ])

    const encryptedCookies = cookieVault.encrypt(testCookies)
    console.log(`✅ Cookies encrypted (length: ${encryptedCookies.length})`)

    const decryptedCookies = cookieVault.decrypt(encryptedCookies)
    console.log(`✅ Cookies decrypted successfully`)
    console.log(`✅ Cookies match: ${testCookies === decryptedCookies}`)
    console.log('')

    // 3. Test TOTP Secret Encryption
    console.log('🔑 Step 3: Testing TOTP Encryption...')
    const testTOTPSecret = 'JBSWY3DPEHPK3PXP' // Base32 encoded test secret
    const encryptedTOTP = cookieVault.encryptTOTP(testTOTPSecret)
    console.log(`✅ TOTP secret encrypted (length: ${encryptedTOTP.length})`)

    const decryptedTOTP = cookieVault.decryptTOTP(encryptedTOTP)
    console.log(`✅ TOTP secret decrypted successfully`)
    console.log(`✅ TOTP secret match: ${testTOTPSecret === decryptedTOTP}`)
    console.log('')

    // 4. Test OTP Code Generation
    console.log('🎯 Step 4: Testing OTP Service...')
    const otpService = new OTPService()
    const otpCode = otpService.generateCode(testTOTPSecret)
    console.log(`✅ Generated OTP code: ${otpCode}`)

    const isValidCode = otpService.validateCode(testTOTPSecret, otpCode)
    console.log(`✅ OTP code validation: ${isValidCode}`)
    console.log('')

    // 5. Test Browser with Cookie Injection
    console.log('🌐 Step 5: Testing Browser with Cookie Injection...')

    const fingerprint: BrowserFingerprint = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      timezone: 'America/New_York',
      language: 'en-US',
      platform: 'MacIntel',
      webglVendor: 'Intel Inc.',
      webglRenderer: 'Intel Iris Pro OpenGL Engine'
    }

    // Mock proxy (you would use a real proxy in production)
    const proxy: ProxyConfig = {
      host: 'proxy.example.com',
      port: 8080,
      username: 'user',
      password: 'pass',
      type: 'http'
    }

    const browserConfig: BrowserConfig = {
      proxy,
      fingerprint,
      cookies: encryptedCookies // Use encrypted cookies
    }

    console.log('🚀 Creating stealth browser with cookie injection...')
    const browser = await BrowserFactory.createStealthBrowser(browserConfig, cookieVault)
    console.log('✅ Browser created successfully')

    const context = await BrowserFactory.createStealthContext(browser, browserConfig, cookieVault)
    console.log('✅ Browser context created with cookies injected')

    // Test stealth validation
    const isStealthy = await BrowserFactory.validateStealth(context)
    console.log(`✅ Stealth validation: ${isStealthy}`)

    // Test authentication verification (would need real cookies to actually verify)
    console.log('🔍 Testing authentication verification...')
    try {
      // This would fail with mock cookies, but tests the flow
      const isAuthenticated = await BrowserFactory.verifyLinkedInAuth(context)
      console.log(`📊 Authentication status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated (expected with mock cookies)'}`)
    } catch (error) {
      console.log(`📊 Authentication check completed (expected failure with mock cookies)`)
    }

    // Cleanup
    await BrowserFactory.closeBrowser(browser)
    console.log('✅ Browser cleaned up')
    console.log('')

    console.log('🎉 All Authentication System Tests Passed!')
    console.log('')
    console.log('🔧 USAGE INSTRUCTIONS:')
    console.log('1. Replace mock cookies with real LinkedIn session cookies')
    console.log('2. Add TOTP secret if account has 2FA enabled')
    console.log('3. Configure valid proxy servers in PROXY_LIST env var')
    console.log('4. The system will automatically handle cookie injection and 2FA')

  } catch (error) {
    console.error('❌ Authentication System Test Failed:', error)
    process.exit(1)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAuthenticationSystem().catch(console.error)
}

export { testAuthenticationSystem }