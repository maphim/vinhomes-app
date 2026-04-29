const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://vinhomes-app.vercel.app/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("input[type=\"email\"]", "admin@vinhomes.app");
  await page.fill("input[type=\"password\"]", "admin123");
  await page.click("button[type=\"submit\"]");
  await page.waitForTimeout(3000);

  // Get full setup page
  const r = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/setup");
      return await res.text();
    } catch(e) { return e.message; }
  });
  console.log(r);
  
  await browser.close();
})();
