import { Router, type Response } from "express";
import type { TvApiError } from "@shared/tv";
import { getChannelPlayback, getChannels, getHome, getSection } from "../tv/service";

export const tvRouter = Router();

function sendError(res: Response, status: number, error: unknown) {
  const body: TvApiError = {
    ok: false,
    error: error instanceof Error ? error.message : String(error || "Unknown error"),
  };
  res.status(status).json(body);
}

tvRouter.get("/home", async (_req, res) => {
  try {
    const body = await getHome();
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    res.json(body);
  } catch (error) {
    sendError(res, 502, error);
  }
});

tvRouter.get("/section/:sectionId", async (req, res) => {
  try {
    const body = await getSection(String(req.params.sectionId || ""));
    if (!body) return sendError(res, 404, "Unknown TV section");
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    res.json(body);
  } catch (error) {
    sendError(res, 502, error);
  }
});

tvRouter.get("/channels", async (req, res) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const body = await getChannels(ids);
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    res.json(body);
  } catch (error) {
    sendError(res, 502, error);
  }
});

tvRouter.get("/channel/:channelId", async (req, res) => {
  try {
    const rawVariant = Number.parseInt(String(req.query.variant || "0"), 10);
    const variant = Number.isFinite(rawVariant) && rawVariant >= 0 ? rawVariant : 0;
    const body = await getChannelPlayback(String(req.params.channelId || ""), variant);
    if (!body) return sendError(res, 404, "Unknown TV channel");
    res.setHeader("Cache-Control", "no-store");
    res.json(body);
  } catch (error) {
    sendError(res, 502, error);
  }
});
