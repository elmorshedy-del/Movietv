import path from "node:path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files.
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

app.use(express.static(distPath));

// Express 5/path-to-regexp no longer accepts a bare "*" route. The named
// wildcard below includes the root path and keeps API misses as JSON instead
// of accidentally returning the SPA shell.
app.get("/{*splat}", (req, res) => {
  if (req.path.startsWith("/api/") || req.path === "/api" || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  return res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`MovieTV server running on port ${port}`);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
