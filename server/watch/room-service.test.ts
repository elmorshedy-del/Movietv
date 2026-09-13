import { describe, expect, it } from "vitest";
import type { WatchMovie } from "@shared/watch/media";
import { InMemoryWatchRoomStore } from "./in-memory-room-store";
import { RoomCapacityError, RoomService } from "./room-service";

function testMovie(): WatchMovie {
  return {
    id: "movie-1",
    title: "Test Movie",
    videoUrl: "https://media.example.test/movie.mp4",
    durationMs: 7_200_000,
    subtitles: [],
    fingerprint: {
      assetId: "asset-1",
      assetVersion: "v1",
      expectedDurationMs: 7_200_000,
    },
  };
}

function deterministicService(nowMs: () => number = () => 1_000) {
  const store = new InMemoryWatchRoomStore(nowMs);
  let participantCounter = 0;
  const service = new RoomService(store, {
    nowMs,
    roomIdFactory: () => "room-fixed",
    participantIdFactory: () => `participant-${++participantCounter}`,
  });

  return { store, service };
}

describe("RoomService", () => {
  it("creates a paused room fenced to the movie asset at initial roomEpoch and seq", async () => {
    const { service } = deterministicService();
    const room = await service.createRoom(testMovie());

    expect(room.roomId).toBe("room-fixed");
    expect(room.participants).toEqual([]);
    expect(room.timeline).toMatchObject({
      roomId: "room-fixed",
      roomEpoch: 1,
      seq: 1,
      movieId: "movie-1",
      assetId: "asset-1",
      assetVersion: "v1",
      isPlaying: false,
      mediaTimeSeconds: 0,
      playbackRate: 1,
      reason: "room-created",
    });
  });

  it("admits exactly two participant slots and rejects a third new client at capacity", async () => {
    const { service } = deterministicService();
    const room = await service.createRoom(testMovie());

    const first = await service.joinParticipant(room.roomId, {
      clientId: "client-a",
      displayName: "A",
    });
    const second = await service.joinParticipant(room.roomId, {
      clientId: "client-b",
      displayName: "B",
    });

    expect(first.participant.participantId).toBe("participant-1");
    expect(second.participant.participantId).toBe("participant-2");

    await expect(
      service.joinParticipant(room.roomId, {
        clientId: "client-c",
        displayName: "C",
      }),
    ).rejects.toBeInstanceOf(RoomCapacityError);
  });

  it("resolves reconnect identity before capacity and preserves participantId", async () => {
    let now = 1_000;
    const { service } = deterministicService(() => now);
    const room = await service.createRoom(testMovie());

    const first = await service.joinParticipant(room.roomId, {
      clientId: "client-a",
      displayName: "A",
    });
    await service.joinParticipant(room.roomId, {
      clientId: "client-b",
      displayName: "B",
    });

    now = 2_000;
    const reconnect = await service.joinParticipant(room.roomId, {
      clientId: "client-a",
      displayName: "A updated",
    });

    expect(reconnect.reconnected).toBe(true);
    expect(reconnect.participant.participantId).toBe(
      first.participant.participantId,
    );
    expect(reconnect.participant.displayName).toBe("A updated");
    expect(reconnect.participant.lastSeenAtMs).toBe(2_000);
    expect(reconnect.room.participants).toHaveLength(2);
  });

  it("marks a transport disconnect without freeing the logical participant slot", async () => {
    let now = 1_000;
    const { service } = deterministicService(() => now);
    const room = await service.createRoom(testMovie());
    const joined = await service.joinParticipant(room.roomId, {
      clientId: "client-a",
      displayName: "A",
    });

    now = 2_500;
    const disconnected = await service.setParticipantConnected(
      room.roomId,
      "client-a",
      false,
    );

    expect(disconnected.participants).toHaveLength(1);
    expect(disconnected.participants[0]).toMatchObject({
      participantId: joined.participant.participantId,
      clientId: "client-a",
      connected: false,
      playbackState: "disconnected",
      lastSeenAtMs: 2_500,
    });
  });

  it("explicit leave removes the logical slot so a new client can join", async () => {
    const { service } = deterministicService();
    const room = await service.createRoom(testMovie());
    await service.joinParticipant(room.roomId, {
      clientId: "client-a",
      displayName: "A",
    });
    await service.joinParticipant(room.roomId, {
      clientId: "client-b",
      displayName: "B",
    });

    const afterLeave = await service.removeParticipant(room.roomId, "client-a");
    expect(afterLeave.participants.map((p) => p.clientId)).toEqual(["client-b"]);

    const third = await service.joinParticipant(room.roomId, {
      clientId: "client-c",
      displayName: "C",
    });
    expect(third.room.participants.map((p) => p.clientId).sort()).toEqual([
      "client-b",
      "client-c",
    ]);
  });

  it("does not expose mutable stored room state to callers", async () => {
    const { service } = deterministicService();
    const created = await service.createRoom(testMovie());

    created.movie.title = "Mutated outside store";
    created.timeline.seq = 99;
    created.participants.push({
      participantId: "fake",
      clientId: "fake",
      displayName: "Fake",
      connected: true,
      userArmed: false,
      mediaReady: false,
      playbackState: "joining",
      lastSeenAtMs: 0,
    });

    const stored = await service.getRoom(created.roomId);
    expect(stored.movie.title).toBe("Test Movie");
    expect(stored.timeline.seq).toBe(1);
    expect(stored.participants).toEqual([]);
  });

  it("expires processed command ids after their TTL", async () => {
    let now = 1_000;
    const { store, service } = deterministicService(() => now);
    const room = await service.createRoom(testMovie());

    await store.markProcessedCommand(room.roomId, "cmd-1", 2);
    expect(await store.hasProcessedCommand(room.roomId, "cmd-1")).toBe(true);

    now = 3_000;
    expect(await store.hasProcessedCommand(room.roomId, "cmd-1")).toBe(false);
  });

  it("uses cryptographically-shaped default room and participant identifiers", async () => {
    const store = new InMemoryWatchRoomStore();
    const service = new RoomService(store);
    const room = await service.createRoom(testMovie());
    const joined = await service.joinParticipant(room.roomId, {
      clientId: "client-a",
      displayName: "A",
    });

    expect(room.roomId).toMatch(/^room_[A-Za-z0-9_-]{22}$/);
    expect(joined.participant.participantId).toMatch(
      /^participant_[A-Za-z0-9_-]{22}$/,
    );
  });
});
