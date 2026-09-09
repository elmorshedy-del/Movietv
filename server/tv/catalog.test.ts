import { describe, expect, it } from "vitest";
import { getChannelDefinition, type ChannelDefinition } from "./content";
import { rankChannelCandidates, type CatalogChannel } from "./catalog";

const row = (streamId: string, name: string, categoryName = "USA"): CatalogChannel => ({
  streamId,
  name,
  categoryName,
  icon: null,
});

describe("channel resolver", () => {
  it("does not substitute an excluded HBO subchannel", () => {
    const definition: ChannelDefinition = {
      id: "hbo",
      label: "HBO",
      aliases: ["HBO [US]", "HBO US"],
      exclude: ["signature", "family"],
    };
    const candidates = rankChannelCandidates(definition, [
      row("1", "HBO Signature [US]"),
      row("2", "HBO Family [US]"),
    ]);
    expect(candidates).toEqual([]);
  });

  it("prefers browser-friendly FHD H264 over HEVC 4K for the same channel", () => {
    const definition: ChannelDefinition = {
      id: "rotana-cinema-eg",
      label: "Rotana Cinema",
      aliases: ["Rotana Cinema EG"],
    };
    const candidates = rankChannelCandidates(definition, [
      row("4k", "Rotana Cinema EG 4K HEVC", "Egypt"),
      row("fhd", "Rotana Cinema EG FHD H264", "Egypt"),
      row("hd", "Rotana Cinema EG HD", "Egypt"),
    ]);
    expect(candidates[0]?.streamId).toBe("fhd");
    expect(candidates.map((candidate) => candidate.streamId)).toContain("4k");
  });

  it("uses exact aliases before broader contains matches", () => {
    const definition: ChannelDefinition = {
      id: "mbc-4",
      label: "MBC 4",
      aliases: ["MBC 4 FHD", "MBC 4"],
    };
    const candidates = rankChannelCandidates(definition, [
      row("exact", "MBC 4 FHD", "MBC"),
      row("contains", "VIP MBC 4 FHD", "MBC"),
    ]);
    expect(candidates[0]?.streamId).toBe("exact");
  });

  it("fails closed instead of turning DMC into DMC Drama", () => {
    const definition = getChannelDefinition("dmc");
    expect(definition).toBeDefined();
    const candidates = rankChannelCandidates(definition!, [row("drama", "DMC DRAMA [EG]", "Egypt")]);
    expect(candidates).toEqual([]);
  });

  it("fails closed instead of turning MBC Masr into MBC Masr 2", () => {
    const definition = getChannelDefinition("mbc-masr");
    expect(definition).toBeDefined();
    const candidates = rankChannelCandidates(definition!, [row("two", "MBC Masr 2 FHD", "MBC")]);
    expect(candidates).toEqual([]);
  });

  it("keeps Discovery subchannels separate from the base Discovery channel", () => {
    const definition = getChannelDefinition("discovery");
    expect(definition).toBeDefined();
    const candidates = rankChannelCandidates(definition!, [
      row("science", "Discovery Science [US]"),
      row("id", "Discovery ID [US]"),
      row("family", "Discovery Family [US]"),
    ]);
    expect(candidates).toEqual([]);
  });
});
