import type { WatchMovie } from "./media";

export type WatchParticipantState =
  | "joining"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "disconnected";

/**
 * Logical room participant identity.
 *
 * participantId is room-scoped identity; clientId survives browser refreshes.
 * Socket identity is deliberately transport-level and does not belong here.
 */
export interface WatchParticipant {
  participantId: string;
  clientId: string;
  displayName: string;
  connected: boolean;
  userArmed: boolean;
  mediaReady: boolean;
  playbackState: WatchParticipantState;
  lastSeenAtMs: number;
}

export type TimelineReason =
  | "room-created"
  | "play"
  | "pause"
  | "seek"
  | "buffer-pause"
  | "resume"
  | "reconnect-repair";

/**
 * Canonical server-authored playback state.
 *
 * The asset identity is duplicated here intentionally so every timeline update
 * is fenced to the exact movie revision without trusting a mutable title/URL.
 */
export interface RoomTimeline {
  roomId: string;
  roomEpoch: number;
  seq: number;
  movieId: string;
  assetId: string;
  assetVersion: string;
  isPlaying: boolean;
  mediaTimeSeconds: number;
  stampedAtServerMs: number;
  playbackRate: number;
  reason: TimelineReason;
}

export interface WatchRoomSnapshot {
  roomId: string;
  mode: "couple";
  movie: WatchMovie;
  timeline: RoomTimeline;
  participants: WatchParticipant[];
  createdAtMs: number;
}

export interface MediaGenerationIdentity {
  movieId: string;
  assetId: string;
  assetVersion: string;
  roomEpoch: number;
}
