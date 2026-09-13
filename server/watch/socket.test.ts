import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import type { Server as HttpServer } from "node:http";
import type { WatchMovie } from "@shared/watch/media";
import type {
  WatchClockAckPayload,
  WatchJoinedPayload,
  WatchSnapshotPayload,
} from "@shared/watch/events";
import { createHttpServer, closeHttpServer } from "../http-server";
import { InMemoryWatchRoomStore } from "./in-memory-room-store";
import { RoomService } from "./room-service";
import {
  attachWatchSocketServer,
  closeWatchSocketServer,
} from "./socket";

function testMovie(): WatchMovie {
  return {
    id: "movie-1",
    title: "Test Movie",
    videoUrl: "https://media.example.test/movie.mp4",
    durationMs: 120_000,
    subtitles: [],
    fingerprint: {
      assetId: "asset-1",
      assetVersion: "v1",
      expectedDurationMs: 120_000,
    },
  };
}

function onceEvent<T>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise<T>((resolve) => {
    socket.once(event, (payload: T) => resolve(payload));
  });
}

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 2_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for Watch Together socket state");
}

interface Harness {
  httpServer: HttpServer;
  roomService: RoomService;
  ioServer: ReturnType<typeof attachWatchSocketServer>;
  url: string;
}

const harnesses: Harness[] = [];
const clients: ClientSocket[] = [];

async function createHarness(clockNowMs: () => number = Date.now): Promise<Harness> {
  const httpServer = createHttpServer(express());
  const roomService = new RoomService(new InMemoryWatchRoomStore(), {
    roomIdFactory: () => "room-test",
    participantIdFactory: (() => {
      let sequence = 0;
      return () => `participant-${++sequence}`;
    })(),
  });
  const ioServer = attachWatchSocketServer(httpServer, roomService, clockNowMs);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });
  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected test HTTP server to listen on a TCP port");
  }

  const harness = {
    httpServer,
    roomService,
    ioServer,
    url: `http://127.0.0.1:${address.port}`,
  };
  harnesses.push(harness);
  return harness;
}

async function connectClient(url: string): Promise<ClientSocket> {
  const client = createClient(url, {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });
  clients.push(client);

  if (!client.connected) {
    await onceEvent(client, "connect");
  }
  return client;
}

async function join(
  client: ClientSocket,
  roomId: string,
  clientId: string,
  displayName: string,
): Promise<{ joined: WatchJoinedPayload; snapshot: WatchSnapshotPayload }> {
  const joinedPromise = onceEvent<WatchJoinedPayload>(client, "watch:joined");
  const snapshotPromise = onceEvent<WatchSnapshotPayload>(client, "watch:snapshot");
  client.emit("watch:join", { roomId, clientId, displayName });
  return {
    joined: await joinedPromise,
    snapshot: await snapshotPromise,
  };
}

afterEach(async () => {
  for (const client of clients.splice(0)) {
    client.disconnect();
  }
  for (const harness of harnesses.splice(0)) {
    await closeWatchSocketServer(harness.ioServer);
    await closeHttpServer(harness.httpServer);
  }
});

describe("Watch Together Socket.IO room lifecycle", () => {
  it("emits joined and the canonical watch:snapshot after watch:join", async () => {
    const harness = await createHarness();
    const room = await harness.roomService.createRoom(testMovie());
    const client = await connectClient(harness.url);

    const result = await join(client, room.roomId, "client-a", "A");

    expect(result.joined).toEqual({
      roomId: room.roomId,
      participantId: "participant-1",
    });
    expect(result.snapshot.roomId).toBe(room.roomId);
    expect(result.snapshot.timeline).toMatchObject({
      roomEpoch: 1,
      seq: 1,
      assetId: "asset-1",
      assetVersion: "v1",
    });
    expect(result.snapshot.participants[0]).toMatchObject({
      clientId: "client-a",
      participantId: "participant-1",
      connected: true,
    });
  });

  it("preserves participantId when a disconnected client reconnects to a full room", async () => {
    const harness = await createHarness();
    const room = await harness.roomService.createRoom(testMovie());
    const a = await connectClient(harness.url);
    const b = await connectClient(harness.url);

    const firstA = await join(a, room.roomId, "client-a", "A");
    await join(b, room.roomId, "client-b", "B");
    a.disconnect();

    await waitFor(async () => {
      const stored = await harness.roomService.getRoom(room.roomId);
      return stored.participants.find((p) => p.clientId === "client-a")?.connected === false;
    });

    const reconnect = await connectClient(harness.url);
    const rejoined = await join(reconnect, room.roomId, "client-a", "A again");

    expect(rejoined.joined.participantId).toBe(firstA.joined.participantId);
    expect(rejoined.snapshot.participants).toHaveLength(2);
    expect(
      rejoined.snapshot.participants.find((p) => p.clientId === "client-a"),
    ).toMatchObject({
      participantId: firstA.joined.participantId,
      connected: true,
    });
  });

  it("returns the latest snapshot on watch:state-request instead of event replay", async () => {
    const harness = await createHarness();
    const room = await harness.roomService.createRoom(testMovie());
    const client = await connectClient(harness.url);
    await join(client, room.roomId, "client-a", "A");

    const snapshotPromise = onceEvent<WatchSnapshotPayload>(client, "watch:snapshot");
    client.emit("watch:state-request", { roomId: room.roomId });
    const snapshot = await snapshotPromise;

    expect(snapshot.timeline.seq).toBe(1);
    expect(snapshot.participants).toHaveLength(1);
  });

  it("echoes watch:clock with receive/send timestamps and no async room work", async () => {
    let serverNow = 10_000;
    const harness = await createHarness(() => serverNow++);
    const client = await connectClient(harness.url);

    const ackPromise = onceEvent<WatchClockAckPayload>(client, "watch:clock-ack");
    client.emit("watch:clock", { t0ClientMs: 9_900 });
    const ack = await ackPromise;

    expect(ack).toEqual({
      t0ClientMs: 9_900,
      t1ServerReceiveMs: 10_000,
      t2ServerSendMs: 10_001,
    });
  });

  it("explicit leave removes the participant slot so a new client may join", async () => {
    const harness = await createHarness();
    const room = await harness.roomService.createRoom(testMovie());
    const a = await connectClient(harness.url);
    const b = await connectClient(harness.url);
    await join(a, room.roomId, "client-a", "A");
    await join(b, room.roomId, "client-b", "B");

    a.emit("watch:leave", { roomId: room.roomId, clientId: "client-a" });
    await waitFor(async () => {
      const stored = await harness.roomService.getRoom(room.roomId);
      return stored.participants.length === 1;
    });

    const c = await connectClient(harness.url);
    const joinedC = await join(c, room.roomId, "client-c", "C");
    expect(joinedC.snapshot.participants).toHaveLength(2);
  });

  it("keeps the shared HTTP server open when Socket.IO is closed", async () => {
    const harness = await createHarness();
    expect(harness.httpServer.listening).toBe(true);

    await closeWatchSocketServer(harness.ioServer);

    expect(harness.httpServer.listening).toBe(true);
    harnesses.splice(harnesses.indexOf(harness), 1);
    await closeHttpServer(harness.httpServer);
  });
});
