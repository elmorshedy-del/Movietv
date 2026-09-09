const FAVORITES_KEY = "movietv.favorites.v1";
const RECENT_KEY = "movietv.recent.v1";
export const TV_PREFERENCES_EVENT = "movietv:preferences";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) return [];
    return value.map(String).filter(Boolean);
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
  window.dispatchEvent(new Event(TV_PREFERENCES_EVENT));
}

export function getFavoriteChannelIds() {
  return readList(FAVORITES_KEY);
}

export function isFavoriteChannel(channelId: string) {
  return getFavoriteChannelIds().includes(channelId);
}

export function toggleFavoriteChannel(channelId: string) {
  const current = getFavoriteChannelIds();
  const next = current.includes(channelId)
    ? current.filter((id) => id !== channelId)
    : [channelId, ...current].slice(0, 50);
  writeList(FAVORITES_KEY, next);
  return next.includes(channelId);
}

export function getRecentChannelIds() {
  return readList(RECENT_KEY);
}

export function recordRecentChannel(channelId: string) {
  const next = [channelId, ...getRecentChannelIds().filter((id) => id !== channelId)].slice(0, 12);
  writeList(RECENT_KEY, next);
}
