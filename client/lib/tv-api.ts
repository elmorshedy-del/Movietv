import type {
  TvChannelsResponse,
  TvHomeResponse,
  TvPlaybackResponse,
  TvSectionResponse,
} from "@shared/tv";

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || `Request failed with HTTP ${response.status}`);
  }
  return body as T;
}

export function fetchHome(signal?: AbortSignal) {
  return getJson<TvHomeResponse>("/api/tv/home", signal);
}

export function fetchSection(sectionId: string, signal?: AbortSignal) {
  return getJson<TvSectionResponse>(`/api/tv/section/${encodeURIComponent(sectionId)}`, signal);
}

export function fetchChannels(ids: string[], signal?: AbortSignal) {
  const params = new URLSearchParams({ ids: ids.join(",") });
  return getJson<TvChannelsResponse>(`/api/tv/channels?${params}`, signal);
}

export function fetchPlayback(channelId: string, variant = 0, signal?: AbortSignal) {
  const params = new URLSearchParams({ variant: String(variant) });
  return getJson<TvPlaybackResponse>(
    `/api/tv/channel/${encodeURIComponent(channelId)}?${params}`,
    signal,
  );
}
