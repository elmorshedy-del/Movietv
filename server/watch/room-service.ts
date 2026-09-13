import { randomBytes } from "node:crypto";
import type { WatchMovie } from "@shared/watch/media";
import {
  INITIAL_ROOM_EPOCH,
  INITIAL_TIMELINE_SEQ,
  NORMAL_PLAYBACK_RATE,
} from "@shared/watch/constants";
import type { WatchParticipant, WatchRoomSnapshot } from "@shared/watch/types";
import type { StoredWatchRoom, WatchRoomStore } from "./room-store";

const MAX_ROOM_PARTICIPANTS = 2;

export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Watch Together room not found: ${roomId}`);
    this.name = "RoomNotFoundError";
  }
}

export class RoomCapacityError extends Error {
  constructor(roomId: string) {
    super(`Watch Together room is full: ${roomId}`);
    this.name = "RoomCapacityError";
  }
}

export interface JoinParticipantInput {
  clientId: string;
  displayName: string;
}

export interface JoinParticipantResult {
  room: StoredWatchRoom;
  participant: WatchParticipant;
  reconnected: boolean;
}

interface RoomServiceOptions {
  nowMs?: () => number;
  roomIdFactory?: () => string;
  participantIdFactory?: () => string;
}

function secureId(prefix: string): string {
  return `${prefix}_${randomBytes(16).toString("base64url")}`;
}

function assertMovieContract(movie: WatchMovie): void {
  if (!movie.id.trim()) throw new Error("movie.id is required");
  if (!movie.videoUrl.trim()) throw new Error("movie.videoUrl is required");
  if (!movie.fingerprint.assetId.trim()) {
    throw new Error("movie.fingerprint.assetId is required");
  }
  if (!movie.fingerprint.assetVersion.trim()) {
    throw new Error("movie.fingerprint.assetVersion is required");
  }
  if (!Number.isFinite(movie.durationMs) || movie.durationMs <= 0) {
    throw new Error("movie.durationMs must be a positive finite number");
  }
  if (movie.durationMs !== movie.fingerprint.expectedDurationMs) {
    throw new Error(
      "movie.durationMs must equal fingerprint.expectedDurationMs",
    );
  }
}

function toSnapshot(room: StoredWatchRoom): WatchRoomSnapshot {
  return {
    roomId: room.roomId,
    mode: room.mode,
    movie: room.movie,
    timeline: room.timeline,
    participants: room.participants,
    createdAtMs: room.createdAtMs,
  };
}

export class RoomService {
  private readonly nowMs: () => number;
  private readonly roomIdFactory: () => string;
  private readonly participantIdFactory: () => string;

  constructor(
    private readonly store: WatchRoomStore,
    options: RoomServiceOptions = {},
  ) {
    this.nowMs = options.nowMs ?? Date.now;
    this.roomIdFactory = options.roomIdFactory ?? (() => secureId("room"));
    this.participantIdFactory =
      options.participantIdFactory ?? (() => secureId("participant"));
  }

  async createRoom(movie: WatchMovie): Promise<StoredWatchRoom> {
    assertMovieContract(movie);

    const roomId = this.roomIdFactory();
    const now = this.nowMs();
    const room: StoredWatchRoom = {
      roomId,
      mode: "couple",
      movie,
      timeline: {
        roomId,
        roomEpoch: INITIAL_ROOM_EPOCH,
        seq: INITIAL_TIMELINE_SEQ,
        movieId: movie.id,
        assetId: movie.fingerprint.assetId,
        assetVersion: movie.fingerprint.assetVersion,
        isPlaying: false,
        mediaTimeSeconds: 0,
        stampedAtServerMs: now,
        playbackRate: NORMAL_PLAYBACK_RATE,
        reason: "room-created",
      },
      participants: [],
      createdAtMs: now,
      updatedAtMs: now,
    };

    await this.store.createRoom(room);
    const created = await this.store.getRoom(roomId);
    if (!created) {
      throw new Error("Room store failed to return a newly-created room");
    }
    return created;
  }

  async getRoom(roomId: string): Promise<StoredWatchRoom> {
    const room = await this.store.getRoom(roomId);
    if (!room) throw new RoomNotFoundError(roomId);
    return room;
  }

  async getSnapshot(roomId: string): Promise<WatchRoomSnapshot> {
    return toSnapshot(await this.getRoom(roomId));
  }

  async joinParticipant(
    roomId: string,
    input: JoinParticipantInput,
  ): Promise<JoinParticipantResult> {
    const clientId = input.clientId.trim();
    const displayName = input.displayName.trim();

    if (!clientId) throw new Error("clientId is required");
    if (!displayName) throw new Error("displayName is required");

    const now = this.nowMs();
    let joinedParticipant: WatchParticipant | null = null;
    let reconnected = false;

    const updatedRoom = await this.store.updateRoom(roomId, (room) => {
      const existingIndex = room.participants.findIndex(
        (participant) => participant.clientId === clientId,
      );

      // Reconnect identity is resolved before capacity is checked. A full room
      // must still allow either existing clientId to refresh/rejoin its slot.
      if (existingIndex >= 0) {
        const existing = room.participants[existingIndex];
        if (!existing) {
          throw new Error("Participant index invariant failed");
        }

        const participant: WatchParticipant = {
          ...existing,
          displayName,
          connected: true,
          lastSeenAtMs: now,
        };

        const participants = [...room.participants];
        participants[existingIndex] = participant;
        joinedParticipant = { ...participant };
        reconnected = true;

        return {
          ...room,
          participants,
          updatedAtMs: now,
        };
      }

      if (room.participants.length >= MAX_ROOM_PARTICIPANTS) {
        throw new RoomCapacityError(roomId);
      }

      const participant: WatchParticipant = {
        participantId: this.participantIdFactory(),
        clientId,
        displayName,
        connected: true,
        userArmed: false,
        mediaReady: false,
        playbackState: "joining",
        lastSeenAtMs: now,
      };

      joinedParticipant = { ...participant };

      return {
        ...room,
        participants: [...room.participants, participant],
        updatedAtMs: now,
      };
    });

    if (!updatedRoom) throw new RoomNotFoundError(roomId);
    if (!joinedParticipant) {
      throw new Error("Room join completed without a participant result");
    }

    return {
      room: updatedRoom,
      participant: joinedParticipant,
      reconnected,
    };
  }
}
