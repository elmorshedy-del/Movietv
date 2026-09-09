import type {
  TvChannelSummary,
  TvChannelsResponse,
  TvHomeResponse,
  TvPlaybackResponse,
  TvSectionResponse,
} from "@shared/tv";
import { getChannelDefinition, HERO, HOME_ROWS, SECTIONS } from "./content";
import {
  fetchPlayback,
  loadCatalog,
  rankChannelCandidates,
  summarizeChannel,
  type CatalogChannel,
} from "./catalog";

function resolveSummary(id: string, catalog: CatalogChannel[]): TvChannelSummary | null {
  const definition = getChannelDefinition(id);
  if (!definition) return null;
  const candidate = rankChannelCandidates(definition, catalog)[0];
  return summarizeChannel(definition, candidate);
}

function resolveIds(ids: string[], catalog: CatalogChannel[]) {
  const channels: TvChannelSummary[] = [];
  const missing: string[] = [];

  for (const id of ids) {
    const summary = resolveSummary(id, catalog);
    if (!summary) {
      missing.push(id);
      continue;
    }
    if (!summary.available) {
      missing.push(id);
      continue;
    }
    channels.push(summary);
  }

  return { channels, missing };
}

export async function getHome(): Promise<TvHomeResponse> {
  const catalog = await loadCatalog();
  const missingChannels = new Set<string>();

  const rows = HOME_ROWS.map((row) => {
    if (row.kind === "categories") return row;
    const resolved = resolveIds(row.channelIds, catalog);
    resolved.missing.forEach((id) => missingChannels.add(id));
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      kind: "channels" as const,
      items: resolved.channels,
    };
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    hero: HERO,
    rows,
    missingChannels: [...missingChannels],
  };
}

export async function getSection(sectionId: string): Promise<TvSectionResponse | null> {
  const section = SECTIONS[sectionId];
  if (!section) return null;
  const catalog = await loadCatalog();
  const resolved = resolveIds(section.channelIds, catalog);
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    id: section.id,
    title: section.title,
    description: section.description,
    channels: resolved.channels,
    missingChannels: resolved.missing,
  };
}

export async function getChannels(ids: string[]): Promise<TvChannelsResponse> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, 50);
  if (!unique.length) return { ok: true, channels: [], missingChannels: [] };
  const catalog = await loadCatalog();
  const resolved = resolveIds(unique, catalog);
  return {
    ok: true,
    channels: resolved.channels,
    missingChannels: resolved.missing,
  };
}

export async function getChannelPlayback(
  channelId: string,
  requestedVariant = 0,
): Promise<TvPlaybackResponse | null> {
  const definition = getChannelDefinition(channelId);
  if (!definition) return null;

  const catalog = await loadCatalog();
  const candidates = rankChannelCandidates(definition, catalog);
  if (!candidates.length) {
    throw new Error(`${definition.label} is not available in the current catalog`);
  }

  const start = Math.max(0, Math.min(requestedVariant, candidates.length - 1));
  let lastError: unknown = null;

  // A provider can leave dead variants in its catalog. Walk forward through
  // same-channel candidates only; never substitute a neighboring channel.
  for (let index = start; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      const playback = await fetchPlayback(candidate.streamId);
      return {
        ok: true,
        channel: summarizeChannel(definition, candidate),
        streamId: candidate.streamId,
        playbackUrl: playback.playbackUrl,
        tsPlaybackUrl: playback.tsPlaybackUrl,
        variantIndex: index,
        variantCount: candidates.length,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No playable channel variant is available");
}
