import { createServer as createNodeHttpServer, type Server } from "node:http";
import type { Express } from "express";

/**
 * Creates the single Node HTTP transport shared by Express and realtime
 * services. Keeping ownership here lets later gates attach Socket.IO without
 * introducing a second public port.
 */
export function createHttpServer(app: Express): Server {
  return createNodeHttpServer(app);
}

/**
 * Closes ordinary HTTP traffic. Realtime layers that own upgraded sockets must
 * be closed first; Gate C's production shutdown does that explicitly.
 */
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
