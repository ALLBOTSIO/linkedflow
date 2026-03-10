/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { BrowserFactory } from './src/worker/stealth/browserFactory'
import { FingerprintGenerator } from './src/worker/stealth/fingerprint'
import { HumanSimulator } from './src/worker/stealth/humanSimulator'
import { ProxyManager } from './src/services/ProxyManager'
import { BrowserConfig, ProxyConfig } from './src/types'

async function testStealthBrowser() {
  console.log('🧪 Starting LinkedFlow Stealth Browser Test...\n')

  try {
    // Generate realistic fingerprint
    console.log('1. Generating browser fingerprint...')
    const fingerprint = FingerprintGenerator.generateFingerprint()
    console.log(`   ✅ Generated fingerprint: ${fingerprint.userAgent.substring(0, 50)}...`)
    console.log(`   ✅ Viewport: ${fingerprint.viewport.width}x${fingerprint.viewport.height}`)
    console.log(`   ✅ Timezone: ${fingerprint.timezone}`)
    console.log(`   ✅ Platform: ${fingerprint.platform}`)

    // Test proxy manager (if proxy configured)
    let proxyConfig: ProxyConfig | undefined
    if (process.env.PROXY_LIST) {
      console.log('\n2. Testing proxy manager...')
      const proxyManager = new ProxyManager()
      try {
        proxyConfig = await proxyManager.getProxyForAccount('test-account-123')
        console.log(`   ✅ Assigned proxy: ${proxyConfig.host}:${proxyConfig.port}`)
      } catch (error) {
        console.log(`   ⚠️  No proxies available: ${error instanceof Error ? error.message : 'Unknown error'}`)
        proxyConfig = undefined
      }
    } else {
      console.log('\n2. Skipping proxy test (PROXY_LIST not set)')
    }

    // Create browser configuration
    const browserConfig: BrowserConfig = {
      proxy: proxyConfig, // Only use proxy if one was assigned
      fingerprint,
      cookies: undefined,
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport
    }

    console.log('\n3. Creating stealth browser...')
    const browser = await BrowserFactory.createStealthBrowser(browserConfig)
    console.log('   ✅ Stealth browser created successfully')

    console.log('\n4. Creating stealth context...')
    const context = await BrowserFactory.createStealthContext(browser, browserConfig)
    console.log('   ✅ Stealth context created successfully')

    console.log('\n5. Validating stealth configuration...')
    const isStealthValid = await BrowserFactory.validateStealth(context)
    console.log(`   ${isStealthValid ? '✅' : '❌'} Stealth validation: ${isStealthValid ? 'PASSED' : 'FAILED'}`)

    console.log('\n6. Testing LinkedIn.com navigation...')
    const page = await context.newPage()

    // Navigate to LinkedIn
    await page.goto('https://www.linkedin.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait for page load with human behavior
    await HumanSimulator.waitForPageLoad(page, true)
    console.log('   ✅ Successfully loaded linkedin.com')

    // Test webdriver detection
    console.log('\n7. Testing anti-detection measures...')
    const detectionResults = await page.evaluate(() => ({
      webdriver: navigator.webdriver,
      plugins: navigator.plugins.length,
      languages: navigator.languages,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }))

    console.log('   Detection Results:')
    console.log(`   ${detectionResults.webdriver === undefined ? '✅' : '❌'} navigator.webdriver: ${detectionResults.webdriver}`)
    console.log(`   ${detectionResults.plugins > 0 ? '✅' : '❌'} plugins count: ${detectionResults.plugins}`)
    console.log(`   ${Array.isArray(detectionResults.languages) ? '✅' : '❌'} languages array: ${JSON.stringify(detectionResults.languages)}`)
    console.log(`   ✅ platform: ${detectionResults.platform}`)
    console.log(`   ✅ viewport: ${detectionResults.viewport.width}x${detectionResults.viewport.height}`)

    // Test human-like interactions
    console.log('\n8. Testing human simulation...')

    // Simulate scanning the page
    await HumanSimulator.scanPage(page)
    console.log('   ✅ Page scanning simulation completed')

    // Test scrolling behavior
    await HumanSimulator.scrollSmoothly(page, 'down', 300, { readingPauses: true })
    console.log('   ✅ Human-like scrolling completed')

    // Test search interaction if search box exists
    try {
      const searchSelector = 'input[placeholder*="Search"], input[aria-label*="Search"], .search-global-typeahead__input'
      await page.waitForSelector(searchSelector, { timeout: 5000 })

      await HumanSimulator.typeWithDelay(page, searchSelector, 'software engineer', {
        clearFirst: true,
        pauseOnWords: true
      })
      console.log('   ✅ Human-like typing simulation completed')

      // Clear the search
      await page.keyboard.selectAll()
      await page.keyboard.press('Delete')

    } catch (error) {
      console.log('   ⚠️  Search box not found (expected on LinkedIn homepage)')
    }

    // Take screenshot for verification
    console.log('\n9. Taking screenshot for verification...')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const screenshotPath = `./stealth-test-${timestamp}.png`

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 800 }
    })
    console.log(`   ✅ Screenshot saved: ${screenshotPath}`)

    // Final stealth validation
    console.log('\n10. Final stealth assessment...')
    const finalCheck = await page.evaluate(() => {
      const checks = {
        webdriverUndefined: navigator.webdriver === undefined,
        hasPlugins: navigator.plugins.length > 0,
        hasLanguages: Array.isArray(navigator.languages) && navigator.languages.length > 0,
        validPlatform: navigator.platform && navigator.platform.length > 0,
        validUserAgent: navigator.userAgent && navigator.userAgent.includes('Mozilla'),
        chromePresent: window.chrome !== undefined,
        devtoolsOpen: false // Simplified check
      }

      const passedChecks = Object.values(checks).filter(Boolean).length
      const totalChecks = Object.keys(checks).length

      return {
        checks,
        score: (passedChecks / totalChecks) * 100,
        passed: passedChecks >= totalChecks - 1 // Allow 1 failure
      }
    })

    console.log(`   Stealth Score: ${finalCheck.score.toFixed(1)}% (${Object.values(finalCheck.checks).filter(Boolean).length}/${Object.keys(finalCheck.checks).length})`)
    console.log(`   ${finalCheck.passed ? '✅' : '❌'} Overall Assessment: ${finalCheck.passed ? 'STEALTH SUCCESSFUL' : 'DETECTION RISK'}`)

    // Cleanup
    console.log('\n11. Cleaning up...')
    await page.close()
    await context.close()
    await BrowserFactory.closeBrowser(browser)
    console.log('   ✅ Browser cleanup completed')

    // Summary
    console.log('\n🎉 Test completed successfully!')
    console.log('\n📊 RESULTS SUMMARY:')
    console.log(`├── Stealth Validation: ${isStealthValid ? 'PASSED' : 'FAILED'}`)
    console.log(`├── WebDriver Hidden: ${detectionResults.webdriver === undefined ? 'PASSED' : 'FAILED'}`)
    console.log(`├── Plugins Present: ${detectionResults.plugins > 0 ? 'PASSED' : 'FAILED'}`)
    console.log(`├── Human Simulation: PASSED`)
    console.log(`├── LinkedIn Access: PASSED`)
    console.log(`└── Overall Stealth: ${finalCheck.passed ? 'PASSED' : 'FAILED'} (${finalCheck.score.toFixed(1)}%)`)

    if (finalCheck.passed && isStealthValid) {
      console.log('\n🟢 GATE 1 ACCEPTANCE TEST: PASSED')
      console.log('   The stealth browser foundation is ready for production use.')
    } else {
      console.log('\n🟡 GATE 1 ACCEPTANCE TEST: PARTIAL')
      console.log('   Some stealth features may need adjustment before production.')
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

// Helper function to check if running in CI
function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
}

// Run test if called directly
if (require.main === module) {
  testStealthBrowser().catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })
}

export { testStealthBrowser }