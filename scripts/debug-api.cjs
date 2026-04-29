const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://vinhomes-app.vercel.app/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("input[type=\"email\"]", "admin@vinhomes.app");
  await page.fill("input[type=\"password\"]", "admin123");
  await page.click("button[type=\"submit\"]");
  await page.waitForTimeout(3000);

  // Test 1: API without day parameter (old format)
  const r1 = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/orders?page=1&limit=5&day=all");
      return { status: res.status, text: await res.text().then(t => t.substring(0, 500)) };
    } catch(e) { return { error: e.message }; }
  });
  console.log("TEST 1 (day=all):", JSON.stringify(r1));

  // Test 2: Setup page
  const r2 = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/setup");
      return { status: res.status, text: await res.text().then(t => t.substring(0, 1000)) };
    } catch(e) { return { error: e.message }; }
  });
  console.log("TEST 2 (setup):", JSON.stringify(r2));

  // Test 3: Seed page (check if DB is connected)
  const r3 = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/seed");
      return { status: res.status, text: await res.text().then(t => t.substring(0, 1500)) };
    } catch(e) { return { error: e.message }; }
  });
  console.log("TEST 3 (seed):", JSON.stringify(r3));

  await browser.close();
})();
