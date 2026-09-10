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

function near(actual, expected, tolerance = 1) {
  return Math.abs(actual - expected) <= tolerance;
}

function assertMetric(name, actual, expected, tolerance = 1) {
  if (!near(actual, expected, tolerance)) {
    failures.push(`${name}: expected ${expected}±${tolerance}, got ${actual}`);
  }
}

async function measureDesktopStyle(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const style = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { fontFamily: s.fontFamily, fontSize: s.fontSize, lineHeight: s.lineHeight };
    };
    const channelCards = [...document.querySelectorAll("[data-tv-channel-card]")].slice(0, 2);
    const categoryCards = [...document.querySelectorAll("[data-tv-category-card]")].slice(0, 2);
    const cardRects = channelCards.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const categoryRects = categoryCards.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    return {
      header: rect("[data-tv-header]"),
      logo: rect("[data-tv-logo]"),
      logoStyle: style("[data-tv-logo]"),
      firstRow: rect('[data-tv-home-row="premium"]'),
      firstRowTitle: rect('[data-tv-home-row="premium"] h2'),
      firstRowTitleStyle: style('[data-tv-home-row="premium"] h2'),
      channelCards: cardRects,
      categoryCards: categoryRects,
      footer: rect("[data-tv-footer]"),
      footerScriptStyle: style("[data-tv-footer-script]"),
    };
  });
}

function validateDesktopStyle(metrics) {
  if (!metrics.header || !metrics.logo || !metrics.firstRow || !metrics.firstRowTitle) {
    failures.push("desktop: missing required visual calibration elements");
    return;
  }

  assertMetric("desktop header height", metrics.header.height, 62, 0.5);
  assertMetric("desktop logo left", metrics.logo.x, 28, 1);
  assertMetric("desktop first row left", metrics.firstRow.x, 0, 0.5);
  assertMetric("desktop first row title left", metrics.firstRowTitle.x, 28, 1);
  assertMetric("desktop first row title y", metrics.firstRowTitle.y, 469, 2);
  assertMetric("desktop first row title size", Number.parseFloat(metrics.firstRowTitleStyle?.fontSize || "0"), 22, 0.5);

  if (metrics.channelCards.length >= 2) {
    const [a, b] = metrics.channelCards;
    assertMetric("desktop channel card width", a.width, 186, 0.5);
    assertMetric("desktop channel card height", a.height, 132, 0.5);
    assertMetric("desktop channel card gap", b.x - (a.x + a.width), 10, 0.75);
  } else {
    failures.push("desktop: not enough channel cards for geometry calibration");
  }

  if (metrics.categoryCards.length >= 2) {
    const [a, b] = metrics.categoryCards;
    assertMetric("desktop category card width", a.width, 158, 0.5);
    assertMetric("desktop category card height", a.height, 172, 0.5);
    assertMetric("desktop category card gap", b.x - (a.x + a.width), 10, 0.75);
  } else {
    failures.push("desktop: not enough category cards for geometry calibration");
  }

  const logoFamily = metrics.logoStyle?.fontFamily || "";
  if (!/Allura|Sacramento/i.test(logoFamily)) {
    failures.push(`desktop logo font stack regressed: ${logoFamily || "missing"}`);
  }
  const footerFamily = metrics.footerScriptStyle?.fontFamily || "";
  if (!/Allura|Sacramento/i.test(footerFamily)) {
    failures.push(`desktop footer font stack regressed: ${footerFamily || "missing"}`);
  }
  assertMetric("desktop footer script size", Number.parseFloat(metrics.footerScriptStyle?.fontSize || "0"), 28, 0.5);
}

async function capture(name, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "dark",
    reducedMotion: "reduce",
  });

  // UI smoke owns rendering/navigation while Product CI owns provider playback.
  await context.addInitScript(() => {
    class HlsMock {
      static isSupported() { return true; }
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
    if (message.type() !== "error") return;
    const text = message.text();
    // Decorative editorial images/fonts have deterministic fallbacks and should
    // not turn an otherwise healthy product render red in CI.
    if (/Failed to load resource|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/i.test(text)) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator('[data-tv-home-row="premium"]').waitFor({ timeout: 30_000 });
  await page.locator('[data-tv-home-row="moods"]').waitFor({ timeout: 30_000 });
  await page.locator('[data-tv-home-row="arabic-favorites"]').waitFor({ timeout: 30_000 });
  await page.evaluate(() => document.fonts?.ready);

  const liveLinks = page.locator('a[href^="/watch/"]');
  const liveCount = await liveLinks.count();
  if (liveCount < 10) failures.push(`${name}: expected at least 10 rendered live cards, got ${liveCount}`);

  const styleMetrics = name === "desktop" ? await measureDesktopStyle(page) : null;
  if (styleMetrics) validateDesktopStyle(styleMetrics);

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
  return { name, viewport, liveCount, premiumCount, videoCount, styleMetrics, consoleErrors };
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
