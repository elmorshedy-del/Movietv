import { describe, expect, it } from "vitest";
import { CHANNELS, HOME_ROWS, SECTIONS, getChannelDefinition } from "./content";

describe("TV content configuration", () => {
  const definitions = Object.values(CHANNELS);
  const knownIds = new Set(definitions.map((channel) => channel.id));

  it("uses unique stable logical channel ids with usable aliases", () => {
    const ids = definitions.map((channel) => channel.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const channel of definitions) {
      expect(channel.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(channel.label.trim().length).toBeGreaterThan(0);
      expect(channel.aliases.length).toBeGreaterThan(0);
      expect(channel.aliases.every((alias) => alias.trim().length > 0)).toBe(true);
    }
  });

  it("only references defined non-duplicated channels from home rows", () => {
    for (const row of HOME_ROWS) {
      if (row.kind !== "channels") continue;
      expect(new Set(row.channelIds).size, row.id).toBe(row.channelIds.length);
      for (const id of row.channelIds) {
        expect(knownIds.has(id), `${row.id}: ${id}`).toBe(true);
        expect(getChannelDefinition(id), `${row.id}: ${id}`).toBeDefined();
      }
    }
  });

  it("only references defined non-duplicated channels from sections", () => {
    for (const section of Object.values(SECTIONS)) {
      expect(new Set(section.channelIds).size, section.id).toBe(section.channelIds.length);
      for (const id of section.channelIds) {
        expect(knownIds.has(id), `${section.id}: ${id}`).toBe(true);
      }
    }
  });

  it("keeps home row ids unique", () => {
    const ids = HOME_ROWS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds the all section from the union of curated sections", () => {
    const curated = Object.values(SECTIONS)
      .filter((section) => section.id !== "all")
      .flatMap((section) => section.channelIds);
    expect(new Set(SECTIONS.all.channelIds)).toEqual(new Set(curated));
  });
});
