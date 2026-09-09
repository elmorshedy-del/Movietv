import { describe, expect, it } from "vitest";
import { CHANNELS, HOME_ROWS, SECTIONS } from "./content";

describe("TV content configuration", () => {
  const knownIds = new Set(Object.values(CHANNELS).map((channel) => channel.id));

  it("uses unique channel ids", () => {
    const ids = Object.values(CHANNELS).map((channel) => channel.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references defined channels from home rows", () => {
    const referenced = HOME_ROWS.flatMap((row) =>
      row.kind === "channels" ? row.channelIds : [],
    );
    expect(referenced.filter((id) => !knownIds.has(id))).toEqual([]);
  });

  it("only references defined channels from sections", () => {
    const referenced = Object.values(SECTIONS).flatMap((section) => section.channelIds);
    expect(referenced.filter((id) => !knownIds.has(id))).toEqual([]);
  });

  it("keeps home row ids unique", () => {
    const ids = HOME_ROWS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
