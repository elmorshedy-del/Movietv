import path from "node:path";
import { createServer } from "./index";
import * as express from "express";
import { closeHttpServer, createHttpServer } from "./http-server";

const app = createServer();
const httpServer = createHttpServer(app);
const port = process.env.PORT || 3000;

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
});

let shutdownStarted = false;

async function shutdown(signal: NodeJS.Signals) {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  console.log(`Received ${signal}, shutting down gracefully`);

  try {
    await closeHttpServer(httpServer);
    process.exitCode = 0;
  } catch (error) {
    console.error("Failed to shut down gracefully", error);
    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
