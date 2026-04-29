const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://vinhomes-app.vercel.app/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("input[type=\"email\"]", "admin@vinhomes.app");
  await page.fill("input[type=\"password\"]", "admin123");
  await page.click("button[type=\"submit\"]");
  await page.waitForTimeout(3000);

  const result = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/orders?page=1&limit=20&day=today");
      return { status: res.status, text: await res.text().then(t => t.substring(0, 2000)) };
    } catch(e) { return { error: e.message }; }
  });

  console.log(JSON.stringify(result));
  await browser.close();
})();
