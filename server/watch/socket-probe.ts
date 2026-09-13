import { createHash } from "node:crypto";
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";

export const WATCH_SOCKET_PROBE_ENV = "WATCH_TOGETHER_SOCKET_PROBE";
export const WATCH_SOCKET_PROBE_PAGE_PATH = "/__watch_probe";
export const WATCH_SOCKET_PROBE_WS_PATH = "/__watch_probe/socket";

const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const HEARTBEAT_INTERVAL_MS = 20_000;
const READY_MESSAGE = "watch-probe-ready";

type ProbeState = {
  sockets: Set<Duplex>;
  heartbeat: NodeJS.Timeout;
  onUpgrade: (request: IncomingMessage, socket: Duplex, head: Buffer) => void;
};

const probeStates = new WeakMap<HttpServer, ProbeState>();

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function encodeSmallServerFrame(opcode: number, payload = ""): Buffer {
  const body = Buffer.from(payload, "utf8");
  if (body.length > 125) {
    throw new Error("Watch socket probe only supports small control frames");
  }

  return Buffer.concat([
    Buffer.from([0x80 | (opcode & 0x0f), body.length]),
    body,
  ]);
}

function writeHttpError(socket: Duplex, status: number, reason: string): void {
  socket.end(
    `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
}

function handleClientFrame(socket: Duplex, chunk: Buffer): void {
  if (chunk.length === 0) return;

  const opcode = chunk[0] & 0x0f;
  if (opcode === 0x8) {
    // Browser clients send a masked close frame. The probe does not need its
    // payload; it only needs to complete the close handshake cleanly.
    socket.end(encodeSmallServerFrame(0x8));
  }
}

function acceptProbeUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
  sockets: Set<Duplex>,
): void {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname !== WATCH_SOCKET_PROBE_WS_PATH) {
    return;
  }

  const upgrade = firstHeader(request.headers.upgrade)?.toLowerCase();
  const connection = firstHeader(request.headers.connection)?.toLowerCase();
  const version = firstHeader(request.headers["sec-websocket-version"]);
  const key = firstHeader(request.headers["sec-websocket-key"]);

  if (
    request.method !== "GET" ||
    upgrade !== "websocket" ||
    !connection?.split(",").some((part) => part.trim() === "upgrade") ||
    version !== "13" ||
    !key
  ) {
    writeHttpError(socket, 400, "Bad Request");
    return;
  }

  const accept = createHash("sha1")
    .update(`${key}${WEBSOCKET_GUID}`)
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "\r\n",
    ].join("\r\n"),
  );

  sockets.add(socket);

  const remove = () => sockets.delete(socket);
  socket.once("close", remove);
  socket.once("end", remove);
  socket.once("error", remove);
  socket.on("data", (chunk: Buffer) => handleClientFrame(socket, chunk));

  socket.write(encodeSmallServerFrame(0x1, READY_MESSAGE));
  if (head.length > 0) {
    handleClientFrame(socket, head);
  }
}

export function isWatchSocketProbeEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[WATCH_SOCKET_PROBE_ENV] === "1";
}

/**
 * Deployment-only WebSocket probe. The permanent Watch Together room transport
 * remains Socket.IO; this tiny handshake exists only to prove Railway can keep
 * an upgraded connection alive before room/sync code is introduced.
 */
export function attachWatchSocketProbe(server: HttpServer): void {
  if (probeStates.has(server)) return;

  const sockets = new Set<Duplex>();
  const onUpgrade = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => acceptProbeUpgrade(request, socket, head, sockets);

  server.on("upgrade", onUpgrade);

  const heartbeat = setInterval(() => {
    const ping = encodeSmallServerFrame(0x9);
    for (const socket of sockets) {
      if (!socket.destroyed) {
        socket.write(ping);
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref();

  probeStates.set(server, { sockets, heartbeat, onUpgrade });
}

export async function closeWatchSocketProbe(server: HttpServer): Promise<void> {
  const state = probeStates.get(server);
  if (!state) return;

  probeStates.delete(server);
  clearInterval(state.heartbeat);
  server.off("upgrade", state.onUpgrade);

  for (const socket of state.sockets) {
    if (!socket.destroyed) {
      socket.destroy();
    }
  }
  state.sockets.clear();
}

export function watchSocketProbePageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MovieTV Watch Together transport probe</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #0b0b0f; color: #f5f5f7; }
    .ok { color: #69d58a; }
    .warn { color: #f3c969; }
    pre { white-space: pre-wrap; background: #17171d; padding: 1rem; border-radius: 12px; }
  </style>
</head>
<body>
  <h1>Watch Together transport probe</h1>
  <p id="status" class="warn">Connecting…</p>
  <pre id="log"></pre>
  <script>
    const statusEl = document.getElementById("status");
    const logEl = document.getElementById("log");
    let attempts = 0;
    let reconnectTimer;

    const log = (message) => {
      const stamp = new Date().toISOString();
      logEl.textContent = stamp + "  " + message + "\n" + logEl.textContent;
    };

    const connect = () => {
      clearTimeout(reconnectTimer);
      attempts += 1;
      statusEl.className = "warn";
      statusEl.textContent = "Connecting (attempt " + attempts + ")…";

      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(protocol + "//" + location.host + "${WATCH_SOCKET_PROBE_WS_PATH}");

      socket.addEventListener("open", () => log("socket open"));
      socket.addEventListener("message", (event) => {
        log("message: " + event.data);
        if (event.data === "${READY_MESSAGE}") {
          statusEl.className = "ok";
          statusEl.textContent = "Connected — leave this page open for the soak test.";
        }
      });
      socket.addEventListener("close", (event) => {
        statusEl.className = "warn";
        statusEl.textContent = "Disconnected; reconnecting…";
        log("socket closed: " + event.code);
        reconnectTimer = setTimeout(connect, 1000);
      });
      socket.addEventListener("error", () => log("socket error"));
    };

    document.addEventListener("visibilitychange", () => {
      log("visibility: " + document.visibilityState);
    });

    connect();
  </script>
</body>
</html>`;
}
