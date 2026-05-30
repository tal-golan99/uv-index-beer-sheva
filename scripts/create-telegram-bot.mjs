import { chromium } from "playwright";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA = "C:\\Users\\talgo\\AppData\\Local\\Google\\Chrome\\User Data";

const browser = await chromium.launchPersistentContext(USER_DATA, {
  executablePath: CHROME_PATH,
  headless: false,
  args: ["--no-sandbox"],
  viewport: { width: 1280, height: 800 },
});

const page = await browser.newPage();

console.log("Navigating to Telegram Web...");
await page.goto("https://web.telegram.org/k/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
await page.screenshot({ path: "scripts/step1-loaded.png" });
console.log("Screenshot saved: step1-loaded.png");

// Search for BotFather
console.log("Searching for BotFather...");
const searchBtn = page.locator('[data-testid="search"], .search, input[type="text"]').first();
await page.keyboard.press("Escape"); // close any open panel
await page.waitForTimeout(1000);

// Try clicking the search icon
try {
  await page.locator(".input-search input, #column-left input[type=text]").first().click();
} catch {
  await page.locator("button.btn-icon.tgico-search, .sidebar-header .btn-icon").first().click();
  await page.waitForTimeout(500);
  await page.locator("input").first().click();
}

await page.waitForTimeout(500);
await page.keyboard.type("BotFather", { delay: 80 });
await page.waitForTimeout(2000);
await page.screenshot({ path: "scripts/step2-search.png" });
console.log("Screenshot: step2-search.png");

// Click the BotFather result
await page.locator(".chatlist-chat, .list-item").filter({ hasText: "BotFather" }).first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: "scripts/step3-botfather.png" });
console.log("Screenshot: step3-botfather.png");

// Type /newbot
console.log("Sending /newbot...");
await page.locator(".input-message-input, [contenteditable=true]").last().click();
await page.keyboard.type("/newbot");
await page.keyboard.press("Enter");
await page.waitForTimeout(3000);
await page.screenshot({ path: "scripts/step4-newbot.png" });
console.log("Screenshot: step4-newbot.png");

// Type bot name
console.log("Typing bot name...");
await page.locator(".input-message-input, [contenteditable=true]").last().click();
await page.keyboard.type("Beer Sheva UV Bot");
await page.keyboard.press("Enter");
await page.waitForTimeout(3000);
await page.screenshot({ path: "scripts/step5-name.png" });
console.log("Screenshot: step5-name.png");

// Type bot username
console.log("Typing bot username...");
await page.locator(".input-message-input, [contenteditable=true]").last().click();
await page.keyboard.type("beershevauv_bot");
await page.keyboard.press("Enter");
await page.waitForTimeout(5000);
await page.screenshot({ path: "scripts/step6-username.png" });
console.log("Screenshot: step6-username.png - check if username was accepted or try another");

// Get the last few messages to find the token
const messages = await page.locator(".message.spoilers-container, .message").all();
console.log(`Found ${messages.length} messages`);
const lastMessages = messages.slice(-5);
for (const msg of lastMessages) {
  const text = await msg.textContent().catch(() => "");
  if (text) console.log("MSG:", text.trim().substring(0, 200));
}

await page.screenshot({ path: "scripts/step7-final.png" });
console.log("Done. Check scripts/step7-final.png for the token.");
console.log("Keeping browser open — press Ctrl+C when done.");
await page.waitForTimeout(60000);
await browser.close();
