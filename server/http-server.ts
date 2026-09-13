import { createServer as createNodeHttpServer, type Server } from "node:http";
import type { Express } from "express";

/**
 * Creates the shared HTTP transport used by Express and, in the next Gate C
 * increment, the feature-flagged Socket.IO probe.
 */
export function createHttpServer(app: Express): Server {
  return createNodeHttpServer(app);
}

export async function closeHttpServer(server: Server): Promise<void> {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });

    server.closeIdleConnections();
  });
}
