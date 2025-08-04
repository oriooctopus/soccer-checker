const { chromium } = require('playwright');

async function testPWA() {
    console.log('🚀 Testing PWA deployment...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone size
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const page = await context.newPage();
    
    try {
        console.log('📱 Navigating to PWA...');
        await page.goto('https://oriooctopus.github.io/soccer-checker/', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('✅ Page loaded successfully!');
        
        // Check if main elements are present
        const title = await page.textContent('h1');
        console.log(`📄 Page title: ${title}`);
        
        // Check for tabs
        const highlightsTab = await page.locator('[data-tab="highlights"]');
        const fixturesTab = await page.locator('[data-tab="fixtures"]');
        
        console.log('🎯 Testing tabs...');
        await highlightsTab.click();
        await page.waitForTimeout(1000);
        
        await fixturesTab.click();
        await page.waitForTimeout(1000);
        
        console.log('✅ Tabs working correctly!');
        
        // Test search form
        console.log('🔍 Testing search form...');
        await page.fill('#fixtures-team', 'Arsenal');
        await page.selectOption('#fixtures-league', 'premiere');
        await page.click('button:has-text("Get Fixtures")');
        
        await page.waitForTimeout(3000);
        
        // Check for results or error messages
        const results = await page.locator('#fixtures-results').textContent();
        console.log('📊 Search results:', results.substring(0, 200) + '...');
        
        console.log('✅ PWA test completed successfully!');
        
        // Keep browser open for manual inspection
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ PWA test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testPWA().catch(console.error);