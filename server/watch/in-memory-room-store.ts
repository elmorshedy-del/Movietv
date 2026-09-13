import {
  cloneStoredWatchRoom,
  type StoredRoomUpdater,
  type StoredWatchRoom,
  type WatchRoomStore,
} from "./room-store";

/**
 * Single-process V1 adapter.
 *
 * updateRoom deliberately contains no await between read/updater/write, so one
 * updater application is atomic with respect to other JavaScript tasks in the
 * same Node process. The updater receives a clone and callers receive clones,
 * preventing mutation outside the store boundary.
 */
export class InMemoryWatchRoomStore implements WatchRoomStore {
  private readonly rooms = new Map<string, StoredWatchRoom>();
  private readonly processedCommands = new Map<string, Map<string, number>>();

  constructor(private readonly nowMs: () => number = Date.now) {}

  async createRoom(room: StoredWatchRoom): Promise<void> {
    if (this.rooms.has(room.roomId)) {
      throw new Error(`Room already exists: ${room.roomId}`);
    }

    this.rooms.set(room.roomId, cloneStoredWatchRoom(room));
  }

  async getRoom(roomId: string): Promise<StoredWatchRoom | null> {
    const room = this.rooms.get(roomId);
    return room ? cloneStoredWatchRoom(room) : null;
  }

  async updateRoom(
    roomId: string,
    updater: StoredRoomUpdater,
  ): Promise<StoredWatchRoom | null> {
    const current = this.rooms.get(roomId);
    if (!current) return null;

    const workingCopy = cloneStoredWatchRoom(current);
    const updated = updater(workingCopy);

    if (updated.roomId !== roomId) {
      throw new Error("Room updater cannot change roomId");
    }

    const stored = cloneStoredWatchRoom(updated);
    this.rooms.set(roomId, stored);
    return cloneStoredWatchRoom(stored);
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
    this.processedCommands.delete(roomId);
  }

  async hasProcessedCommand(roomId: string, cmdId: string): Promise<boolean> {
    const commands = this.processedCommands.get(roomId);
    if (!commands) return false;

    const expiresAtMs = commands.get(cmdId);
    if (expiresAtMs === undefined) return false;

    if (expiresAtMs <= this.nowMs()) {
      commands.delete(cmdId);
      if (commands.size === 0) this.processedCommands.delete(roomId);
      return false;
    }

    return true;
  }

  async markProcessedCommand(
    roomId: string,
    cmdId: string,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.rooms.has(roomId)) {
      throw new Error(`Cannot mark a command for missing room: ${roomId}`);
    }
    if (!cmdId.trim()) {
      throw new Error("cmdId is required");
    }
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new RangeError("ttlSeconds must be a positive finite number");
    }

    let commands = this.processedCommands.get(roomId);
    if (!commands) {
      commands = new Map<string, number>();
      this.processedCommands.set(roomId, commands);
    }

    commands.set(cmdId, this.nowMs() + ttlSeconds * 1000);
  }
}
