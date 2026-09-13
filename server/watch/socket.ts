import type { IncomingMessage, Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { z } from "zod";
import type {
  WatchClockAckPayload,
  WatchErrorPayload,
  WatchJoinedPayload,
  WatchParticipantsPayload,
  WatchSnapshotPayload,
} from "@shared/watch/events";
import {
  ParticipantNotFoundError,
  RoomCapacityError,
  RoomNotFoundError,
  type RoomService,
} from "./room-service";

interface ClientToServerEvents {
  "watch:join": (payload: unknown) => void;
  "watch:leave": (payload: unknown) => void;
  "watch:state-request": (payload: unknown) => void;
  "watch:clock": (payload: unknown) => void;
}

interface ServerToClientEvents {
  "watch:joined": (payload: WatchJoinedPayload) => void;
  "watch:snapshot": (payload: WatchSnapshotPayload) => void;
  "watch:participants": (payload: WatchParticipantsPayload) => void;
  "watch:clock-ack": (payload: WatchClockAckPayload) => void;
  "watch:error": (payload: WatchErrorPayload) => void;
}

interface SocketWatchBinding {
  roomId: string;
  clientId: string;
  participantId: string;
  socketId: string;
}

interface SocketData {
  watch?: SocketWatchBinding;
}

type WatchSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type WatchSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

const joinSchema = z.object({
  roomId: z.string().trim().min(1).max(200),
  clientId: z.string().trim().min(1).max(200),
  displayName: z.string().trim().min(1).max(100),
});

const leaveSchema = z.object({
  roomId: z.string().trim().min(1).max(200),
  clientId: z.string().trim().min(1).max(200),
});

const stateRequestSchema = z.object({
  roomId: z.string().trim().min(1).max(200),
});

const clockSchema = z.object({
  t0ClientMs: z.number().finite(),
});

function bindingKey(roomId: string, clientId: string): string {
  return `${roomId}\u0000${clientId}`;
}

function errorPayload(error: unknown): WatchErrorPayload {
  if (error instanceof RoomNotFoundError) {
    return { code: "ROOM_NOT_FOUND", message: error.message };
  }
  if (error instanceof RoomCapacityError) {
    return { code: "ROOM_FULL", message: error.message };
  }
  if (error instanceof ParticipantNotFoundError) {
    return { code: "PARTICIPANT_NOT_FOUND", message: error.message };
  }
  if (error instanceof z.ZodError) {
    return { code: "INVALID_PAYLOAD", message: "Invalid Watch Together payload" };
  }
  if (error instanceof Error) {
    return { code: "INVALID_REQUEST", message: error.message };
  }
  return { code: "INTERNAL_ERROR", message: "Unexpected Watch Together error" };
}

function emitError(socket: WatchSocket, error: unknown): void {
  socket.emit("watch:error", errorPayload(error));
}

function ensureCurrentBinding(
  socket: WatchSocket,
  activeBindings: Map<string, string>,
  roomId: string,
): SocketWatchBinding {
  const binding = socket.data.watch;
  if (!binding || binding.roomId !== roomId) {
    throw new Error("Socket has not joined this Watch Together room");
  }

  const currentSocketId = activeBindings.get(
    bindingKey(binding.roomId, binding.clientId),
  );
  if (currentSocketId !== socket.id) {
    throw new Error("This Watch Together socket session has been replaced");
  }

  return binding;
}

function isSameOriginRequest(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  const host = request.headers.host;
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function attachWatchSocketServer(
  httpServer: HttpServer,
  roomService: RoomService,
  nowMs: () => number = Date.now,
): WatchSocketServer {
  const activeBindings = new Map<string, string>();

  const io: WatchSocketServer = new Server(httpServer, {
    serveClient: false,
    allowRequest: (request, callback) => {
      callback(null, isSameOriginRequest(request));
    },
  });

  io.on("connection", (socket) => {
    socket.on("watch:join", (payload) => {
      void (async () => {
        try {
          const input = joinSchema.parse(payload);
          const current = socket.data.watch;
          if (
            current &&
            (current.roomId !== input.roomId || current.clientId !== input.clientId)
          ) {
            throw new Error("A socket cannot switch Watch Together identity after joining");
          }

          const result = await roomService.joinParticipant(input.roomId, {
            clientId: input.clientId,
            displayName: input.displayName,
          });

          if (!socket.connected) {
            await roomService.setParticipantConnected(input.roomId, input.clientId, false);
            return;
          }

          const key = bindingKey(input.roomId, input.clientId);
          const replacedSocketId = activeBindings.get(key);
          activeBindings.set(key, socket.id);

          socket.data.watch = {
            roomId: input.roomId,
            clientId: input.clientId,
            participantId: result.participant.participantId,
            socketId: socket.id,
          };
          await socket.join(input.roomId);

          if (replacedSocketId && replacedSocketId !== socket.id) {
            const replacedSocket = io.sockets.sockets.get(replacedSocketId);
            if (replacedSocket) {
              replacedSocket.emit("watch:error", {
                code: "SESSION_REPLACED",
                message: "This Watch Together session was replaced by a reconnect",
              });
              replacedSocket.disconnect(true);
            }
          }

          socket.emit("watch:joined", {
            roomId: input.roomId,
            participantId: result.participant.participantId,
          });
          socket.emit("watch:snapshot", await roomService.getSnapshot(input.roomId));
          io.to(input.roomId).emit("watch:participants", {
            roomId: input.roomId,
            participants: result.room.participants,
          });
        } catch (error) {
          emitError(socket, error);
        }
      })();
    });

    socket.on("watch:state-request", (payload) => {
      void (async () => {
        try {
          const input = stateRequestSchema.parse(payload);
          ensureCurrentBinding(socket, activeBindings, input.roomId);
          socket.emit("watch:snapshot", await roomService.getSnapshot(input.roomId));
        } catch (error) {
          emitError(socket, error);
        }
      })();
    });

    socket.on("watch:clock", (payload) => {
      const t1ServerReceiveMs = nowMs();
      try {
        const input = clockSchema.parse(payload);
        const t2ServerSendMs = nowMs();
        socket.emit("watch:clock-ack", {
          t0ClientMs: input.t0ClientMs,
          t1ServerReceiveMs,
          t2ServerSendMs,
        });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("watch:leave", (payload) => {
      void (async () => {
        try {
          const input = leaveSchema.parse(payload);
          const binding = ensureCurrentBinding(socket, activeBindings, input.roomId);
          if (binding.clientId !== input.clientId) {
            throw new Error("Leave clientId does not match this socket session");
          }

          const room = await roomService.removeParticipant(input.roomId, input.clientId);
          activeBindings.delete(bindingKey(input.roomId, input.clientId));
          socket.data.watch = undefined;
          await socket.leave(input.roomId);

          io.to(input.roomId).emit("watch:participants", {
            roomId: input.roomId,
            participants: room.participants,
          });
        } catch (error) {
          emitError(socket, error);
        }
      })();
    });

    socket.on("disconnect", () => {
      const binding = socket.data.watch;
      if (!binding) return;

      const key = bindingKey(binding.roomId, binding.clientId);
      if (activeBindings.get(key) !== socket.id) return;
      activeBindings.delete(key);

      void roomService
        .setParticipantConnected(binding.roomId, binding.clientId, false)
        .then((room) => {
          io.to(binding.roomId).emit("watch:participants", {
            roomId: binding.roomId,
            participants: room.participants,
          });
        })
        .catch(() => {
          // The transport is already gone; future joins reconcile from store truth.
        });
    });
  });

  return io;
}

export async function closeWatchSocketServer(io: WatchSocketServer): Promise<void> {
  io.disconnectSockets(true);
  io.engine.close();
  io.removeAllListeners();
}
