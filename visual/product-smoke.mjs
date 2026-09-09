import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "visual", "product-output");
const BASE_URL = process.env.PRODUCT_URL || "http://127.0.0.1:4173/";

await fsp.mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--hide-scrollbars"] });
const failures = [];

async function capture(name, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "dark",
    reducedMotion: "reduce",
  });

  // UI smoke owns rendering and navigation, while Product CI owns provider
  // playback checks. Mock the browser-only player libraries here so this test
  // never depends on a third-party CDN or starts a real media stream.
  await context.addInitScript(() => {
    class HlsMock {
      static isSupported() {
        return true;
      }
      static Events = { ERROR: "error" };
      on() {}
      loadSource() {}
      attachMedia() {}
      destroy() {}
    }
    window.Hls = HlsMock;
    window.mpegts = {
      isSupported: () => false,
      getFeatureList: () => ({ mseH265Playback: false }),
    };
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByRole("heading", { name: "Premium Picks" }).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "For Your Mood" }).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "Arabic Favorites" }).waitFor({ timeout: 30_000 });

  const liveLinks = page.locator('a[href^="/watch/"]');
  const liveCount = await liveLinks.count();
  if (liveCount < 10) failures.push(`${name}: expected at least 10 rendered live cards, got ${liveCount}`);
  await page.screenshot({ path: path.join(OUTPUT, `${name}-home.png`), fullPage: true });

  await page.goto(new URL("/browse/premium", BASE_URL).toString(), { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Premium" }).waitFor({ timeout: 30_000 });
  const premiumCount = await page.locator('a[href^="/watch/"]').count();
  if (premiumCount < 5) failures.push(`${name}: premium browse resolved only ${premiumCount} channels`);
  await page.screenshot({ path: path.join(OUTPUT, `${name}-premium.png`), fullPage: true });

  await page.goto(new URL("/watch/hbo", BASE_URL).toString(), { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "HBO" }).waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: /favorites|saved/i }).waitFor({ timeout: 30_000 });
  const videoCount = await page.locator("video").count();
  if (videoCount !== 1) failures.push(`${name}: expected exactly one video player, got ${videoCount}`);
  await page.screenshot({ path: path.join(OUTPUT, `${name}-watch.png`), fullPage: true });

  if (consoleErrors.length) {
    failures.push(`${name}: console/page errors: ${consoleErrors.slice(0, 8).join(" | ")}`);
  }

  await context.close();
  return { name, viewport, liveCount, premiumCount, videoCount, consoleErrors };
}

try {
  const results = [];
  results.push(await capture("desktop", { width: 1223, height: 1000 }));
  results.push(await capture("mobile", { width: 390, height: 844 }));
  const report = { generatedAt: new Date().toISOString(), url: BASE_URL, results, failures };
  await fsp.writeFile(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
