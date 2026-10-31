// Screenshot helper: requires Playwright on the local machine.
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}), headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
  page.on('pageerror', e=>console.error('PAGE ERROR',e.message));
  for (const screen of ['people','person','attributes']) {
    await page.goto(`http://127.0.0.1:5173/demo?screen=${screen}`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>!!customElements.get('s-page'));
    await page.waitForTimeout(700);
    await page.screenshot({path:`docs/screenshots/${screen}.png`, fullPage:true});
    console.log(screen, await page.title(), await page.locator('s-page').count());
  }
  await browser.close();
})();
