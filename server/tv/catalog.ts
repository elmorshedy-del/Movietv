import type { TvChannelCodec, TvChannelQuality, TvChannelSummary } from "@shared/tv";
import type { ChannelDefinition } from "./content";

export interface CatalogChannel {
  streamId: string;
  name: string;
  categoryName: string | null;
  icon: string | null;
}

export interface ResolvedCandidate extends CatalogChannel {
  score: number;
  quality: TvChannelQuality;
  codec: TvChannelCodec;
}

interface CatalogCache {
  freshUntil: number;
  staleUntil: number;
  rows: CatalogChannel[];
}

let cache: CatalogCache | null = null;
let inFlight: Promise<CatalogChannel[]> | null = null;

const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;

function upstreamOrigin() {
  const raw = process.env.IPTV_UPSTREAM_ORIGIN || "https://korazero.com";
  const url = new URL(raw);
  return url.origin;
}

function normalize(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\[\](){}/_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectQuality(value: string): TvChannelQuality {
  const text = normalize(value);
  if (/\b4\s*k\b/.test(text)) return "4k";
  if (/\bfhd\b|\b1080\b/.test(text)) return "fhd";
  if (/\bhd\b|\b720\b/.test(text)) return "hd";
  if (/\bsd\b|\b576\b|\b480\b/.test(text)) return "sd";
  return "unknown";
}

export function detectCodec(value: string): TvChannelCodec {
  const text = normalize(value);
  if (/\bhevc\b|\bh\s*265\b/.test(text)) return "h265";
  if (/\bh\s*264\b|\bavc\b/.test(text)) return "h264";
  return "unknown";
}

function qualityScore(quality: TvChannelQuality, codec: TvChannelCodec) {
  // Prefer browser-friendly 1080p/HD H.264 over HEVC/4K. The player can still
  // request lower-ranked variants if the first candidate fails.
  const qualityRank: Record<TvChannelQuality, number> = {
    fhd: 80,
    hd: 70,
    sd: 50,
    unknown: 45,
    "4k": 35,
  };
  const codecRank = codec === "h264" ? 15 : codec === "h265" ? -5 : 0;
  return qualityRank[quality] + codecRank;
}

function aliasScore(name: string, alias: string) {
  if (!alias) return 0;
  if (name === alias) return 1000;
  if (name.startsWith(`${alias} `) || name.endsWith(` ${alias}`)) return 820;
  if (alias.length >= 4 && name.includes(alias)) return 620;
  return 0;
}

export function rankChannelCandidates(
  definition: ChannelDefinition,
  rows: CatalogChannel[],
): ResolvedCandidate[] {
  const aliases = definition.aliases.map(normalize).filter(Boolean);
  const excludes = (definition.exclude || []).map(normalize).filter(Boolean);
  const categoryHints = (definition.categoryHints || []).map(normalize).filter(Boolean);

  return rows
    .map((row) => {
      const name = normalize(row.name);
      const category = normalize(row.categoryName);
      if (!name) return null;
      if (excludes.some((token) => token && name.includes(token))) return null;

      const base = aliases.reduce((best, alias) => Math.max(best, aliasScore(name, alias)), 0);
      if (!base) return null;

      const quality = detectQuality(row.name);
      const codec = detectCodec(row.name);
      const categoryBonus = categoryHints.some((hint) => category.includes(hint)) ? 30 : 0;
      const backupPenalty = /\bbackup\b|\bbk\b|\btest\b|\balt\b/.test(name) ? 120 : 0;

      return {
        ...row,
        quality,
        codec,
        score: base + categoryBonus + qualityScore(quality, codec) - backupPenalty,
      } satisfies ResolvedCandidate;
    })
    .filter((row): row is ResolvedCandidate => Boolean(row))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function asCatalogRows(payload: unknown): CatalogChannel[] {
  const streams =
    payload && typeof payload === "object" && Array.isArray((payload as { streams?: unknown[] }).streams)
      ? (payload as { streams: unknown[] }).streams
      : [];

  return streams
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const streamId = String(row.streamId || "").trim();
      const name = String(row.name || "").trim();
      if (!streamId || !name) return null;
      return {
        streamId,
        name,
        categoryName: row.categoryName ? String(row.categoryName) : null,
        icon: row.icon ? String(row.icon) : null,
      } satisfies CatalogChannel;
    })
    .filter((row): row is CatalogChannel => Boolean(row));
}

async function fetchJson(url: string, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || (body && typeof body === "object" && (body as { ok?: boolean }).ok === false)) {
      const message = body && typeof body === "object" ? (body as { error?: unknown }).error : null;
      throw new Error(String(message || `Upstream HTTP ${response.status}`));
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadCatalog(): Promise<CatalogChannel[]> {
  const now = Date.now();
  if (cache && cache.freshUntil > now) return cache.rows;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const payload = await fetchJson(`${upstreamOrigin()}/api/iptv-lab/catalog`);
      const rows = asCatalogRows(payload);
      if (!rows.length) throw new Error("IPTV catalog returned no channels");
      const created = Date.now();
      cache = {
        rows,
        freshUntil: created + FRESH_MS,
        staleUntil: created + STALE_MS,
      };
      return rows;
    } catch (error) {
      if (cache && cache.staleUntil > Date.now()) return cache.rows;
      throw error;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function summarizeChannel(
  definition: ChannelDefinition,
  candidate?: ResolvedCandidate,
): TvChannelSummary {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    providerName: candidate?.name,
    categoryName: candidate?.categoryName ?? null,
    icon: candidate?.icon ?? null,
    available: Boolean(candidate),
    quality: candidate?.quality ?? "unknown",
    codec: candidate?.codec ?? "unknown",
  };
}

export async function fetchPlayback(streamId: string) {
  const url = new URL(`${upstreamOrigin()}/api/iptv-lab/live`);
  url.searchParams.set("stream", streamId);
  url.searchParams.set("limit", "1");
  const payload = await fetchJson(url.toString());
  const portals =
    payload && typeof payload === "object" && Array.isArray((payload as { portals?: unknown[] }).portals)
      ? (payload as { portals: unknown[] }).portals
      : [];

  for (const portal of portals) {
    if (!portal || typeof portal !== "object") continue;
    const streams = Array.isArray((portal as { streams?: unknown[] }).streams)
      ? (portal as { streams: unknown[] }).streams
      : [];
    const row = streams[0];
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const playbackUrl = record.playbackUrl ? new URL(String(record.playbackUrl), upstreamOrigin()).toString() : null;
    const tsPlaybackUrl = record.tsPlaybackUrl ? new URL(String(record.tsPlaybackUrl), upstreamOrigin()).toString() : null;
    if (playbackUrl || tsPlaybackUrl) return { playbackUrl, tsPlaybackUrl };
  }

  throw new Error("No playback URL returned for this channel variant");
}

export function clearCatalogCacheForTests() {
  cache = null;
  inFlight = null;
}
