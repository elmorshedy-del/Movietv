import path from "node:path";
import * as express from "express";
import { createServer } from "./index";
import { closeHttpServer, createHttpServer } from "./http-server";
import {
  attachWatchSocketProbe,
  closeWatchSocketProbe,
  isWatchSocketProbeEnabled,
  WATCH_SOCKET_PROBE_PAGE_PATH,
  watchSocketProbePageHtml,
} from "./watch/socket-probe";

const app = createServer();
const probeEnabled = isWatchSocketProbeEnabled();
const port = Number(process.env.PORT ?? 3000);

if (probeEnabled) {
  app.get(WATCH_SOCKET_PROBE_PAGE_PATH, (_req, res) => {
    res.type("html").send(watchSocketProbePageHtml());
  });
}

const httpServer = createHttpServer(app);
if (probeEnabled) {
  attachWatchSocketProbe(httpServer);
}

// In production, serve the built SPA files.
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

app.use(express.static(distPath));

// Express 5/path-to-regexp no longer accepts a bare "*" route. The named
// wildcard below includes the root path and keeps API misses as JSON instead
// of accidentally returning the SPA shell.
app.get("/{*splat}", (req, res) => {
  if (
    req.path.startsWith("/api/") ||
    req.path === "/api" ||
    req.path.startsWith("/health")
  ) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  return res.sendFile(path.join(distPath, "index.html"));
});

httpServer.listen(port, () => {
  console.log(`MovieTV server running on port ${port}`);
  if (probeEnabled) {
    console.log(`Watch Together transport probe enabled at ${WATCH_SOCKET_PROBE_PAGE_PATH}`);
  }
});

let shutdownStarted = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shutdownStarted) return;
  shutdownStarted = true;

  console.log(`Received ${signal}, shutting down gracefully`);

  try {
    // Upgraded WebSocket connections are not ordinary idle HTTP connections;
    // close the realtime layer first so HTTP shutdown cannot hang on them.
    await closeWatchSocketProbe(httpServer);
    await closeHttpServer(httpServer);
    process.exitCode = 0;
  } catch (error) {
    console.error("Failed to shut down gracefully", error);
    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
