import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { closeHttpServer, createHttpServer } from "../http-server";

describe("Watch Together HTTP transport", () => {
  const servers = new Set<ReturnType<typeof createHttpServer>>();

  afterEach(async () => {
    await Promise.all([...servers].map((server) => closeHttpServer(server)));
    servers.clear();
  });

  it("serves Express over the shared Node HTTP server", async () => {
    const app = express();
    app.get("/health", (_request, response) => {
      response.json({ ok: true });
    });

    const server = createHttpServer(app);
    servers.add(server);
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );

    const address = server.address();
    expect(address).not.toBeNull();
    expect(typeof address).not.toBe("string");
    if (address === null || typeof address === "string") {
      throw new Error("Expected the HTTP server to listen on a TCP port");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("closes cleanly before or after listening", async () => {
    const server = createHttpServer(express());
    await expect(closeHttpServer(server)).resolves.toBeUndefined();

    servers.add(server);
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    await expect(closeHttpServer(server)).resolves.toBeUndefined();
    expect(server.listening).toBe(false);
  });
});
