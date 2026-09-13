export interface WatchSubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface MediaFingerprint {
  assetId: string;
  assetVersion: string;
  expectedDurationMs: number;
  byteLength?: number;
  etag?: string;
}

/**
 * V1 movie playback contract.
 *
 * Watch Together deliberately starts with one progressive MP4 asset plus
 * local WebVTT subtitle tracks. Room/synchronization state must refer to the
 * immutable fingerprint rather than trusting a title or mutable URL.
 */
export interface WatchMovie {
  id: string;
  title: string;
  posterUrl?: string | null;
  videoUrl: string;
  durationMs: number;
  subtitles: WatchSubtitleTrack[];
  fingerprint: MediaFingerprint;
}
