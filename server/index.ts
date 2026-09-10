import "dotenv/config";
import express from "express";
import { handleDemo } from "./routes/demo";
import { tvRouter } from "./routes/tv";

export function createServer() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // MovieTV's frontend and API are intentionally same-origin. Do not enable
  // permissive CORS here: browser clients on unrelated sites should not be
  // able to read our TV API responses or mint playback responses cross-origin.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: true, limit: "256kb" }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.use("/api/tv", tvRouter);
  app.get("/api/demo", handleDemo);

  return app;
}
