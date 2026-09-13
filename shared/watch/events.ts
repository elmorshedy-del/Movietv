import type {
  RoomTimeline,
  WatchParticipant,
  WatchRoomSnapshot,
} from "./types";

export const WATCH_EVENTS = {
  join: "watch:join",
  leave: "watch:leave",
  userArmed: "watch:user-armed",
  mediaReady: "watch:media-ready",
  intent: "watch:intent",
  buffering: "watch:buffering",
  clock: "watch:clock",
  stateRequest: "watch:state-request",
  joined: "watch:joined",
  snapshot: "watch:snapshot",
  participants: "watch:participants",
  timeline: "watch:timeline",
  clockAck: "watch:clock-ack",
  error: "watch:error",
} as const;

export interface WatchJoinPayload {
  roomId: string;
  clientId: string;
  displayName: string;
}

export interface WatchLeavePayload {
  roomId: string;
  clientId: string;
}

export interface WatchUserArmedPayload {
  roomId: string;
  userArmed: boolean;
}

export interface WatchMediaReadyPayload {
  roomId: string;
  mediaReady: boolean;
}

interface PlaybackIntentBase {
  cmdId: string;
  roomId: string;
  movieId: string;
  assetId: string;
  assetVersion: string;
  roomEpoch: number;
  observedSeq: number;
}

export interface PlayIntent extends PlaybackIntentBase {
  type: "play";
  targetSeconds?: never;
}

export interface PauseIntent extends PlaybackIntentBase {
  type: "pause";
  targetSeconds?: never;
}

export interface SeekIntent extends PlaybackIntentBase {
  type: "seek";
  targetSeconds: number;
}

export type PlaybackIntent = PlayIntent | PauseIntent | SeekIntent;

export interface WatchBufferingPayload {
  roomId: string;
  buffering: boolean;
  currentTimeSeconds: number;
  bufferAheadSeconds: number;
  playbackState:
    | "loading"
    | "ready"
    | "playing"
    | "paused"
    | "buffering";
}

export interface WatchClockPayload {
  t0ClientMs: number;
}

export interface WatchClockAckPayload {
  t0ClientMs: number;
  t1ServerReceiveMs: number;
  t2ServerSendMs: number;
}

export interface WatchStateRequestPayload {
  roomId: string;
}

export interface WatchJoinedPayload {
  roomId: string;
  participantId: string;
}

export interface WatchParticipantsPayload {
  roomId: string;
  participants: WatchParticipant[];
}

export type WatchTimelinePayload = RoomTimeline;
export type WatchSnapshotPayload = WatchRoomSnapshot;

export interface WatchErrorPayload {
  code: string;
  message: string;
}
