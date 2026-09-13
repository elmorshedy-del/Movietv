export type TvChannelQuality = "4k" | "fhd" | "hd" | "sd" | "unknown";
export type TvChannelCodec = "h264" | "h265" | "unknown";

export interface TvChannelSummary {
  id: string;
  label: string;
  description?: string;
  providerName?: string;
  categoryName?: string | null;
  icon?: string | null;
  brandIcon?: string | null;
  logoSources?: string[];
  available: boolean;
  quality: TvChannelQuality;
  codec: TvChannelCodec;
}

export type TvCategoryIcon =
  | "movie"
  | "talk"
  | "fashion"
  | "food"
  | "discover"
  | "arabic";

export interface TvCategoryCard {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: TvCategoryIcon;
  image?: string;
}

export interface TvHeroContent {
  greeting: string;
  headline: string;
  copy: string;
  sideLinks: Array<{ label: string; to: string }>;
}

export interface TvChannelRow {
  id: string;
  title: string;
  subtitle?: string;
  kind: "channels";
  items: TvChannelSummary[];
}

export interface TvCategoryRow {
  id: string;
  title: string;
  subtitle?: string;
  kind: "categories";
  items: TvCategoryCard[];
}

export type TvHomeRow = TvChannelRow | TvCategoryRow;

export interface TvHomeResponse {
  ok: true;
  generatedAt: string;
  hero: TvHeroContent;
  rows: TvHomeRow[];
  missingChannels: string[];
}

export interface TvSectionResponse {
  ok: true;
  generatedAt: string;
  id: string;
  title: string;
  description: string;
  channels: TvChannelSummary[];
  missingChannels: string[];
}

export interface TvChannelsResponse {
  ok: true;
  channels: TvChannelSummary[];
  missingChannels: string[];
}

export interface TvPlaybackResponse {
  ok: true;
  channel: TvChannelSummary;
  streamId: string;
  playbackUrl: string | null;
  tsPlaybackUrl: string | null;
  variantIndex: number;
  variantCount: number;
}

export interface TvApiError {
  ok: false;
  error: string;
}
