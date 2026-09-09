import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const VISUAL_DIR = path.join(ROOT, "visual");
const OUTPUT_DIR = path.join(VISUAL_DIR, "output");
const URL = process.env.VISUAL_URL || "http://127.0.0.1:4173/";

const TARGET = { width: 1223, height: 1286 };
const COMPARE = { width: 305, height: 321 };

const REGION_BANDS = [
  { name: "header", y0: 0, y1: 16 },
  { name: "hero", y0: 16, y1: 116 },
  { name: "trending", y0: 116, y1: 161 },
  { name: "explore", y0: 161, y1: 220 },
  { name: "arabic", y0: 220, y1: 251 },
  { name: "continue", y0: 251, y1: 299 },
  { name: "footer", y0: 299, y1: 321 },
];

await fsp.mkdir(OUTPUT_DIR, { recursive: true });

const refB64 = (await fsp.readFile(path.join(VISUAL_DIR, "reference-305x321.jpg.b64"), "utf8")).trim();
const refJpg = path.join(OUTPUT_DIR, "reference-source.jpg");
await fsp.writeFile(refJpg, Buffer.from(refB64, "base64"));

const browser = await chromium.launch({
  headless: true,
  args: [
    "--hide-scrollbars",
    "--font-render-hinting=none",
    "--force-device-scale-factor=1",
  ],
});

try {
  const context = await browser.newContext({
    viewport: TARGET,
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "dark",
    reducedMotion: "reduce",
  });

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
      html, body { overflow: hidden !important; }
    `,
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(
      [...document.images].map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              }),
      ),
    );
  });
  await page.waitForTimeout(250);

  const currentFull = path.join(OUTPUT_DIR, "current-full.png");
  await page.screenshot({
    path: currentFull,
    clip: { x: 0, y: 0, width: TARGET.width, height: TARGET.height },
  });

  const compareContext = await browser.newContext({
    viewport: COMPARE,
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });

  async function rasterize(sourcePath, mime, outPath) {
    const p = await compareContext.newPage();
    const data = (await fsp.readFile(sourcePath)).toString("base64");
    await p.setContent(`<!doctype html><html><head><style>
      html,body{margin:0;width:${COMPARE.width}px;height:${COMPARE.height}px;overflow:hidden;background:#000}
      img{display:block;width:${COMPARE.width}px;height:${COMPARE.height}px;object-fit:fill}
    </style></head><body><img id="target" src="data:${mime};base64,${data}"></body></html>`);
    await p.waitForFunction(() => document.querySelector("#target")?.complete === true);
    await p.screenshot({ path: outPath, clip: { x: 0, y: 0, width: COMPARE.width, height: COMPARE.height } });
    await p.close();
  }

  const current = path.join(OUTPUT_DIR, "current.png");
  const reference = path.join(OUTPUT_DIR, "reference.png");
  await rasterize(currentFull, "image/png", current);
  await rasterize(refJpg, "image/jpeg", reference);
  await compareContext.close();

  const a = PNG.sync.read(fs.readFileSync(reference));
  const b = PNG.sync.read(fs.readFileSync(current));
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`Dimension mismatch: reference ${a.width}x${a.height}, current ${b.width}x${b.height}`);
  }

  const diff = new PNG({ width: a.width, height: a.height });
  const mismatchPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
    includeAA: true,
    alpha: 0.65,
    diffColor: [255, 0, 70],
    aaColor: [255, 210, 0],
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, "diff.png"), PNG.sync.write(diff));

  function meanAbsoluteRgbError(dataA, dataB, x0 = 0, y0 = 0, x1 = a.width, y1 = a.height) {
    let sum = 0;
    let count = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * a.width + x) * 4;
        sum += Math.abs(dataA[i] - dataB[i]);
        sum += Math.abs(dataA[i + 1] - dataB[i + 1]);
        sum += Math.abs(dataA[i + 2] - dataB[i + 2]);
        count += 3;
      }
    }
    return (sum / count / 255) * 100;
  }

  function structuralLumaError(dataA, dataB, x0 = 0, y0 = 0, x1 = a.width, y1 = a.height, block = 4) {
    let total = 0;
    let blocks = 0;
    for (let by = y0; by < y1; by += block) {
      for (let bx = x0; bx < x1; bx += block) {
        let la = 0;
        let lb = 0;
        let n = 0;
        const yy1 = Math.min(by + block, y1);
        const xx1 = Math.min(bx + block, x1);
        for (let y = by; y < yy1; y++) {
          for (let x = bx; x < xx1; x++) {
            const i = (y * a.width + x) * 4;
            la += 0.2126 * dataA[i] + 0.7152 * dataA[i + 1] + 0.0722 * dataA[i + 2];
            lb += 0.2126 * dataB[i] + 0.7152 * dataB[i + 1] + 0.0722 * dataB[i + 2];
            n++;
          }
        }
        total += Math.abs(la / n - lb / n);
        blocks++;
      }
    }
    return (total / blocks / 255) * 100;
  }

  function regionPixelMismatch(y0, y1) {
    const h = y1 - y0;
    const regionDiff = new PNG({ width: a.width, height: h });
    const stride = a.width * 4;
    const start = y0 * stride;
    const end = y1 * stride;
    const subA = a.data.subarray(start, end);
    const subB = b.data.subarray(start, end);
    const px = pixelmatch(subA, subB, regionDiff.data, a.width, h, {
      threshold: 0.1,
      includeAA: true,
    });
    return (px / (a.width * h)) * 100;
  }

  const totalPixels = a.width * a.height;
  const regions = Object.fromEntries(
    REGION_BANDS.map((r) => [
      r.name,
      {
        pixelMismatchPercent: Number(regionPixelMismatch(r.y0, r.y1).toFixed(3)),
        meanRgbErrorPercent: Number(meanAbsoluteRgbError(a.data, b.data, 0, r.y0, a.width, r.y1).toFixed(3)),
        structuralLumaErrorPercent: Number(structuralLumaError(a.data, b.data, 0, r.y0, a.width, r.y1).toFixed(3)),
      },
    ]),
  );

  const metrics = {
    generatedAt: new Date().toISOString(),
    url: URL,
    targetViewport: TARGET,
    comparisonSize: COMPARE,
    methodology: {
      browser: "Chromium via Playwright 1.55.0",
      deviceScaleFactor: 1,
      locale: "en-US",
      timezone: "UTC",
      reducedMotion: true,
      animationsDisabled: true,
      externalImagesWaited: true,
      pixelmatchThreshold: 0.1,
      structuralBlockSize: 4,
      note: "Full score includes photography differences. Structural luma score is a coarse block-average metric intended to be less sensitive to image-content mismatch.",
    },
    full: {
      mismatchPixels,
      totalPixels,
      pixelMismatchPercent: Number(((mismatchPixels / totalPixels) * 100).toFixed(3)),
      meanRgbErrorPercent: Number(meanAbsoluteRgbError(a.data, b.data).toFixed(3)),
      structuralLumaErrorPercent: Number(structuralLumaError(a.data, b.data).toFixed(3)),
    },
    regions,
  };

  await fsp.writeFile(path.join(OUTPUT_DIR, "metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
