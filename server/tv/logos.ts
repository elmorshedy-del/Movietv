/**
 * Curated channel artwork.
 *
 * The first URL is the preferred dark-background logo. Additional URLs are
 * fallbacks when a broadcaster/network has multiple commonly used assets.
 * Provider artwork from the IPTV catalog is appended at runtime in catalog.ts.
 *
 * Keep these URLs brand-only: never point them at stream hosts.
 */
const tvLogo = (country: string, file: string) =>
  `https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/${country}/${file}`;

const iptvTuner = (file: string) =>
  `https://raw.githubusercontent.com/IPTVtuner/TV-Logos/master/${file}`;

export const CHANNEL_LOGOS: Record<string, string[]> = {
  "hbo": [tvLogo("united-states", "hbo-us.png")],
  "hbo-signature": [tvLogo("united-states", "hbo-signature-us.png"), tvLogo("united-states", "hbo-us.png")],
  "showtime": [tvLogo("united-states", "showtime-us.png")],
  "showtime-women": [tvLogo("united-states", "showtime-women-us.png"), tvLogo("united-states", "showtime-us.png")],
  "starz-cinema": [tvLogo("united-states", "starz-cinema-us.png")],
  "starz-comedy": [tvLogo("united-states", "starz-comedy-us.png")],
  "osn-movies-premiere": [],
  "osn-yahala-aflam": [],
  "bein-movies-premiere": [],
  "sky-cinema-premiere": [tvLogo("united-kingdom", "sky-cinema-premiere-uk.png")],
  "netflix-arabic-1": [],
  "netflix-cinema": [],

  "rotana-cinema-eg": [],
  "rotana-classic": [],
  "art-aflam-1": [],
  "art-aflam-2": [],
  "art-cinema": [],
  "nile-cinema": [],
  "mbc-2": [iptvTuner("MBC2.ae.png")],
  "mbc-max": [iptvTuner("MBCMax.ae.png")],

  "abc-us": [tvLogo("united-states", "abc-us.png")],
  "nbc-us": [tvLogo("united-states", "nbc-us.png")],
  "cbs-us": [tvLogo("united-states", "cbs-us.png")],
  "e-entertainment": [tvLogo("united-states", "e-entertainment-us.png")],
  "bravo-us": [tvLogo("united-states", "bravo-us.png")],
  "lifetime-us": [tvLogo("united-states", "lifetime-us.png")],
  "amc-us": [tvLogo("united-states", "amc-us.png")],
  "fx-us": [tvLogo("united-states", "fx-us.png")],
  "fxx-us": [tvLogo("united-states", "fxx-us.png")],
  "tnt-us": [tvLogo("united-states", "tnt-us.png")],
  "usa-network": [tvLogo("united-states", "usa-network-us.png")],
  "freeform-us": [tvLogo("united-states", "freeform-us.png")],
  "hallmark-us": [tvLogo("united-states", "hallmark-channel-us.png")],
  "oxygen-us": [tvLogo("united-states", "oxygen-us.png")],

  "osn-woman": [],
  "tlc": [tvLogo("united-states", "tlc-us.png")],
  "fashion-tv": [],
  "hgtv": [tvLogo("united-states", "hgtv-us.png")],
  "food-network": [tvLogo("united-states", "food-network-us.png")],
  "fatafeat": [],
  "cbc-sofra": [],

  "bbc-earth": [tvLogo("united-kingdom", "bbc-earth-uk.png")],
  "discovery": [tvLogo("united-states", "discovery-channel-us.png")],
  "discovery-science": [tvLogo("united-states", "discovery-science-us.png")],
  "discovery-id": [tvLogo("united-states", "investigation-discovery-us.png")],
  "nat-geo-wild": [tvLogo("united-states", "nat-geo-wild-us.png")],
  "nat-geo": [tvLogo("united-states", "national-geographic-us.png")],
  "animal-planet": [tvLogo("united-states", "animal-planet-us.png")],
  "history": [tvLogo("united-states", "history-us.png")],
  "travel-channel": [tvLogo("united-states", "travel-channel-us.png")],

  "mbc-masr": ["https://i.imgur.com/EpMMzX0.png"],
  "mbc-masr-2": ["https://i.imgur.com/z8bf7zK.png"],
  "mbc-4": [iptvTuner("MBC4.ae.png"), iptvTuner("MBC4.sa.png")],
  "dmc": [],
  "dmc-drama": [],
  "on-e": [],
  "on-drama": [],
  "el-hiwar": [],
  "attessia": ["https://i.imgur.com/kmfRNVy.png"],
  "nessma": [],
  "hannibal": [],
  "tunisia-national-1": ["https://i.imgur.com/gNr2V14.png"],
};

export function getChannelLogoSources(id: string): string[] {
  return CHANNEL_LOGOS[id] || [];
}
