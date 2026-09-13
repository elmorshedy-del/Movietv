import type { WatchMovie } from "@shared/watch/media";
import type { RoomTimeline, WatchParticipant } from "@shared/watch/types";

export interface StoredWatchRoom {
  roomId: string;
  mode: "couple";
  movie: WatchMovie;
  timeline: RoomTimeline;
  participants: WatchParticipant[];
  createdAtMs: number;
  updatedAtMs: number;
}

export type StoredRoomUpdater = (room: StoredWatchRoom) => StoredWatchRoom;

/**
 * Persistence seam for active Watch Together rooms.
 *
 * V1 uses a single-process in-memory implementation. Later Redis/other durable
 * adapters must preserve these semantics rather than leaking persistence into
 * the room domain service.
 */
export interface WatchRoomStore {
  createRoom(room: StoredWatchRoom): Promise<void>;
  getRoom(roomId: string): Promise<StoredWatchRoom | null>;
  updateRoom(
    roomId: string,
    updater: StoredRoomUpdater,
  ): Promise<StoredWatchRoom | null>;
  deleteRoom(roomId: string): Promise<void>;
  hasProcessedCommand(roomId: string, cmdId: string): Promise<boolean>;
  markProcessedCommand(
    roomId: string,
    cmdId: string,
    ttlSeconds: number,
  ): Promise<void>;
}

export function cloneStoredWatchRoom(room: StoredWatchRoom): StoredWatchRoom {
  return {
    ...room,
    movie: {
      ...room.movie,
      subtitles: room.movie.subtitles.map((track) => ({ ...track })),
      fingerprint: { ...room.movie.fingerprint },
    },
    timeline: { ...room.timeline },
    participants: room.participants.map((participant) => ({ ...participant })),
  };
}
