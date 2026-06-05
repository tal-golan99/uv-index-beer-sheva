import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT  = decodeURIComponent(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const PAGES = [
  { route: "/",              slug: "home"       },
  { route: "/landing",       slug: "landing"    },
  { route: "/register",      slug: "register"   },
  { route: "/onboarding",    slug: "onboarding" },
  { route: "/account",       slug: "account"    },
  { route: "/stats",         slug: "stats"      },
  { route: "/groups",        slug: "groups"     },
  { route: "/more",          slug: "more"       },
];

const VIEWPORTS = [
  { width: 390,  height: 844,  label: "mobile"  },
  { width: 1440, height: 900,  label: "desktop" },
];

const browser = await chromium.launch({ headless: true });

for (const { route, slug } of PAGES) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    // Force night-mode regardless of time of day
    await page.evaluate(() => {
      document.body.classList.add("night-mode");
      document.body.classList.remove("pool-time");
    });
    await page.waitForTimeout(600); // let transitions settle
    const filename = `${OUT}${slug}-${vp.label}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`ok ${slug} ${vp.label}`);
    await page.close();
  }
}

await browser.close();
console.log("done");
