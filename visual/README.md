# Deterministic homepage visual matching

This folder turns the supplied homepage concept image into a repeatable visual-regression target.

## Target

- Original reference viewport: **1223 × 1286**
- Comparison raster: **305 × 321** (quarter-resolution, preserving the original aspect ratio closely)
- Browser: fixed Chromium installed by Playwright 1.55.0
- Device pixel ratio: 1
- Locale: en-US
- Timezone: UTC
- Reduced motion enabled
- CSS animations/transitions disabled during capture
- Fonts and images are awaited before capture

The committed reference is stored as `reference-305x321.jpg.b64` so GitHub can keep the exact target bytes as text. The comparison script decodes it at runtime.

## Outputs

A run produces `visual/output/` with:

- `current-full.png` — exact 1223 × 1286 browser capture
- `current.png` — deterministic 305 × 321 comparison raster
- `reference.png` — browser-normalized reference raster
- `diff.png` — pixel-level difference map
- `metrics.json` — full-page and per-region error metrics

`metrics.json` reports three complementary measures:

1. **Pixel mismatch %** — strict full visual mismatch using Pixelmatch.
2. **Mean RGB error %** — average absolute color difference.
3. **Structural luma error %** — coarse 4×4 block luminance difference. This is deliberately less sensitive to the fact that the concept image contains artwork/photography that is not available as original source assets.

It also breaks the score into header, hero, trending, explore, Arabic channels, continue-watching, and footer bands so subsequent CSS changes can target the worst region instead of relying on visual guessing.

## GitHub Actions

`.github/workflows/visual-match.yml` runs automatically after relevant pushes to `main`, and can also be launched manually with **Run workflow**.

Each run uploads a `movietv-visual-match` artifact containing the screenshots, diff, and metrics. Those artifacts are the source of truth for iterative matching.
