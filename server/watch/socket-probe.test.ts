import type { Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { closeHttpServer, createHttpServer } from "../http-server";
import {
  attachWatchSocketProbe,
  closeWatchSocketProbe,
  isWatchSocketProbeEnabled,
  WATCH_SOCKET_PROBE_WS_PATH,
} from "./socket-probe";

const servers = new Set<Server>();

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected probe server to listen on a TCP port");
  }

  return address.port;
}

async function connectProbe(url: string): Promise<WebSocket> {
  const socket = new WebSocket(url);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out waiting for watch-probe-ready")),
      3_000,
    );

    const cleanup = () => clearTimeout(timeout);

    socket.addEventListener(
      "message",
      (event) => {
        if (String(event.data) === "watch-probe-ready") {
          cleanup();
          resolve();
        }
      },
      { once: true },
    );
    socket.addEventListener(
      "error",
      () => {
        cleanup();
        reject(new Error("WebSocket probe connection failed"));
      },
      { once: true },
    );
  });

  return socket;
}

async function closeClient(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) return;

  await new Promise<void>((resolve) => {
    socket.addEventListener("close", () => resolve(), { once: true });
    socket.close();
  });
}

afterEach(async () => {
  await Promise.all(
    [...servers].map(async (server) => {
      await closeWatchSocketProbe(server);
      await closeHttpServer(server);
    }),
  );
  servers.clear();
});

describe("Watch Together deployment WebSocket probe", () => {
  it("is disabled unless the explicit environment flag is set", () => {
    expect(isWatchSocketProbeEnabled({})).toBe(false);
    expect(
      isWatchSocketProbeEnabled({ WATCH_TOGETHER_SOCKET_PROBE: "1" }),
    ).toBe(true);
  });

  it("accepts a connection and reconnects on the same shared HTTP server", async () => {
    const server = createHttpServer(express());
    servers.add(server);
    attachWatchSocketProbe(server);

    const port = await listen(server);
    const url = `ws://127.0.0.1:${port}${WATCH_SOCKET_PROBE_WS_PATH}`;

    const first = await connectProbe(url);
    await closeClient(first);

    const reconnect = await connectProbe(url);
    expect(reconnect.readyState).toBe(WebSocket.OPEN);
    await closeClient(reconnect);
  });

  it("closes upgraded probe sockets before the HTTP transport", async () => {
    const server = createHttpServer(express());
    servers.add(server);
    attachWatchSocketProbe(server);

    const port = await listen(server);
    const socket = await connectProbe(
      `ws://127.0.0.1:${port}${WATCH_SOCKET_PROBE_WS_PATH}`,
    );

    const closed = new Promise<void>((resolve) => {
      socket.addEventListener("close", () => resolve(), { once: true });
    });

    await closeWatchSocketProbe(server);
    await closed;
    await closeHttpServer(server);

    expect(server.listening).toBe(false);
  });
});
