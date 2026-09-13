import type { TvCategoryCard, TvHeroContent } from "@shared/tv";
import { getChannelLogoSources } from "./logos";

/**
 * Editorial/product configuration lives here on purpose.
 *
 * Adding, removing, reordering, or swapping channels should normally require
 * edits only in this file. Provider stream ids are deliberately never stored
 * here because they are mutable; catalog.ts resolves the best live variant at
 * runtime from stable logical channel definitions.
 */
export interface ChannelDefinition {
  id: string;
  label: string;
  description?: string;
  aliases: string[];
  exclude?: string[];
  categoryHints?: string[];
  brandIcon?: string;
  logoSources?: string[];
}

export interface ChannelRowDefinition {
  id: string;
  title: string;
  subtitle?: string;
  kind: "channels";
  channelIds: string[];
}

export interface CategoryRowDefinition {
  id: string;
  title: string;
  subtitle?: string;
  kind: "categories";
  items: TvCategoryCard[];
}

export type HomeRowDefinition = ChannelRowDefinition | CategoryRowDefinition;

export interface SectionDefinition {
  id: string;
  title: string;
  description: string;
  channelIds: string[];
}

function channel(
  id: string,
  label: string,
  aliases: string[],
  options: Omit<ChannelDefinition, "id" | "label" | "aliases"> = {},
): ChannelDefinition {
  const curatedLogoSources = getChannelLogoSources(id);
  return {
    id,
    label,
    aliases,
    ...options,
    brandIcon: options.brandIcon || curatedLogoSources[0],
    logoSources: options.logoSources || curatedLogoSources,
  };
}

export const CHANNELS: Record<string, ChannelDefinition> = {
  hbo: channel("hbo", "HBO", ["HBO [US]", "HBO US"], {
    exclude: ["signature", "family", "latino", "zone"],
  }),
  hboSignature: channel("hbo-signature", "HBO Signature", ["HBO Signature [US]", "HBO Signature"]),
  showtime: channel("showtime", "Showtime", ["Showtime HD [US]", "Showtime [US]"], {
    exclude: ["women", "extreme", "family", "next"],
  }),
  showtimeWomen: channel("showtime-women", "Showtime Women", ["Showtime Women [US]", "Showtime Women"]),
  starzCinema: channel("starz-cinema", "STARZ Cinema", ["Starz Cinema FHD [US]", "Starz Cinema [US]", "Starz Cinema"]),
  starzComedy: channel("starz-comedy", "STARZ Comedy", ["Starz Comedy FHD [US]", "Starz Comedy [US]", "Starz Comedy"]),
  osnPremiere: channel("osn-movies-premiere", "OSN Movies Premiere", ["OSN Movies Premiere FHD", "OSN Movies Premiere"]),
  osnYahala: channel("osn-yahala-aflam", "OSN YaHala Aflam", ["OSN YaHala Aflam FHD", "OSN YaHala Aflam"]),
  beinMovies: channel("bein-movies-premiere", "beIN Movies Premiere", ["beIN_Movies_Premiere", "beIN Movies Premiere"]),
  skyCinema: channel("sky-cinema-premiere", "Sky Cinema Premiere", ["Sky Cinema Premiere [UK]", "Sky Cinema Premiere"]),
  netflixArabic: channel("netflix-arabic-1", "Netflix Arabic", ["NETFLIX ARABIC 1", "Netflix Arabic 1"]),
  netflixCinema: channel("netflix-cinema", "Netflix Cinema", ["NETFLIX Cinema", "Netflix Cinema"]),

  rotanaCinema: channel("rotana-cinema-eg", "Rotana Cinema", ["Rotana Cinema EG 4K", "Rotana Cinema EG HD", "Rotana Cinema EG"]),
  rotanaClassic: channel("rotana-classic", "Rotana Classic", ["Rotana Classic 4K", "Rotana Classic HD", "Rotana Classic"]),
  artAflam1: channel("art-aflam-1", "ART Aflam 1", ["ART Aflam 1"]),
  artAflam2: channel("art-aflam-2", "ART Aflam 2", ["ART Aflam 2"]),
  artCinema: channel("art-cinema", "ART Cinema", ["ART Cinema"]),
  nileCinema: channel("nile-cinema", "Nile Cinema", ["Nile Cinema [EG]", "Nile Cinema"]),
  mbc2: channel("mbc-2", "MBC 2", ["MBC 2 FHD", "MBC 2HD", "MBC 2"]),
  mbcMax: channel("mbc-max", "MBC Max", ["MBC Max FHD", "MBC Max HD", "MBC Max"]),

  abc: channel("abc-us", "ABC", ["ABC [US]", "ABC HD [US]"]),
  nbc: channel("nbc-us", "NBC", ["NBC [US]", "NBC HD [US]"]),
  cbs: channel("cbs-us", "CBS", ["CBS [US]", "CBS HD [US]"]),
  eEntertainment: channel("e-entertainment", "E!", ["E! Entertainment [US]", "[Vip]OSN_E!_FHD", "OSN_E!_SD"]),
  bravo: channel("bravo-us", "Bravo", ["Bravo HD [US]", "Bravo [US]"]),
  lifetime: channel("lifetime-us", "Lifetime", ["Lifetime [US]", "Lifetime HD [US]"]),
  amc: channel("amc-us", "AMC", ["AMC HD [US]", "AMC [US]"]),
  fx: channel("fx-us", "FX", ["FX TV [US]", "FX HD [US]", "FX [US]"]),
  fxx: channel("fxx-us", "FXX", ["FXX HD [US]", "FXX [US]"]),
  tnt: channel("tnt-us", "TNT", ["TNT HD [US]", "TNT [US]"]),
  usaNetwork: channel("usa-network", "USA Network", ["USA Network HD [US]", "USA Network [US]"]),
  freeform: channel("freeform-us", "Freeform", ["Freeform [US]", "Freeform HD [US]"]),
  hallmark: channel("hallmark-us", "Hallmark Channel", ["Hallmark [US]", "Hallmark Channel [US]"]),
  oxygen: channel("oxygen-us", "Oxygen", ["Oxygen [US]", "Oxygen HD [US]"]),

  osnWoman: channel("osn-woman", "OSN Woman", ["[Vip]OSN Woman HD", "OSN Woman HD", "OSN Woman"]),
  tlc: channel("tlc", "TLC", ["[Vip]OSN_TLC_FHD", "[Vip]OSN_TLC_HD", "TLC [US]", "TLC [UK]"]),
  fashionTv: channel("fashion-tv", "Fashion TV", ["Fashion TV HD", "Fashion TV"]),
  hgtv: channel("hgtv", "HGTV", ["HGTV HD", "HGTV |UK|", "HGTV [US]"]),
  foodNetwork: channel("food-network", "Food Network", ["Food Network [US]", "Food Network [UK]", "Food Network"]),
  fatafeat: channel("fatafeat", "Fatafeat", ["beIN FataFeat", "FataFeat"]),
  cbcSofra: channel("cbc-sofra", "CBC Sofra", ["CBC Sofra [EG]", "CBC Sofra"]),

  bbcEarth: channel("bbc-earth", "BBC Earth", ["beIN_BBC Earth HD", "BBC Earth HD", "BBC Earth"]),
  discovery: channel(
    "discovery",
    "Discovery",
    ["[Vip]OSN_Discovery_FHD", "[Vip]OSN_Discovery_Channel_HD", "DiscoveryHD", "Discovery [US]"],
    { exclude: ["discovery science", "discovery id", "discovery family"] },
  ),
  discoveryScience: channel("discovery-science", "Discovery Science", ["[Vip]Osn_Discovery_Science_HD", "Discovery Science [US]"]),
  discoveryId: channel("discovery-id", "Investigation Discovery", ["[Vip]OSN_Discovery ID_FHD", "Discovery ID [US]", "Investigation Discovery [US]"]),
  natGeoWild: channel("nat-geo-wild", "Nat Geo Wild", ["[Vip]OSN_Nat Geo Wild_FHD", "Nat Geo Wild [US]"]),
  natGeo: channel(
    "nat-geo",
    "National Geographic",
    ["Nat Geo [US]", "National Geo AD [AR]", "Nat. Geo. AD"],
    { exclude: ["nat geo wild", "national geo wild", "national geographic wild"] },
  ),
  animalPlanet: channel("animal-planet", "Animal Planet", ["Animal Planet [US]", "Animal Planet |UK|"]),
  history: channel("history", "History", ["[Vip]OSN_History_FHD", "[Vip]Osn_History_HD", "History [US]"]),
  travel: channel("travel-channel", "Travel Channel", ["Travel Channel [UK]", "Travel Channel [US]", "Travel Channel"]),

  mbcMasr: channel("mbc-masr", "MBC Masr", ["MBC Masr FHD", "MBC Masr HD", "MBC Masr"], {
    exclude: ["mbc masr 2"],
  }),
  mbcMasr2: channel("mbc-masr-2", "MBC Masr 2", ["MBC Masr 2 FHD", "MBC Masr 2 HD", "MBC Masr 2"]),
  mbc4: channel("mbc-4", "MBC 4", ["MBC 4 FHD", "MBC 4HD", "MBC 4 HEVC", "MBC 4"]),
  dmc: channel("dmc", "DMC", ["DMC [EG]", "DMC"], { exclude: ["dmc drama"] }),
  dmcDrama: channel("dmc-drama", "DMC Drama", ["DMC DRAMA [EG]", "DMC DRAMA"]),
  onE: channel("on-e", "ON", ["ON E [EG]", "ON E"], { exclude: ["on drama"] }),
  onDrama: channel("on-drama", "ON Drama", ["ON DRAMA[EG]", "ON DRAMA [EG]", "ON DRAMA"]),
  elHiwar: channel("el-hiwar", "El Hiwar El Tounsi", ["El Hiwar El Tounsi [TN]", "El Hiwar El Tounsi"]),
  attessia: channel("attessia", "Attessia", ["Attessia TV [TN]", "Attessia TV"]),
  nessma: channel("nessma", "Nessma", ["Nessma [TN]", "Nessma"]),
  hannibal: channel("hannibal", "Hannibal", ["HANNIBAL [TN]", "Hannibal [TN]", "HANNIBAL"]),
  tunis1: channel("tunisia-national-1", "El Watania 1", ["Tunisia National 1 [TN]", "Tunisia National 1", "El Watania 1", "Watania 1"]),
};

export const HERO: TvHeroContent = {
  greeting: "Good evening,",
  headline: "Beautiful",
  copy: "Movies, American TV, fashion, food, documentaries, Egypt and Tunisia — all in one place I made for you.",
  sideLinks: [
    { label: "Premium", to: "/browse/premium" },
    { label: "Movies", to: "/browse/movies" },
    { label: "US TV", to: "/browse/us-tv" },
    { label: "Talk & Daytime", to: "/browse/us-tv" },
    { label: "Style & Reality", to: "/browse/style-reality" },
    { label: "Cooking & Home", to: "/browse/food-home" },
    { label: "Documentaries", to: "/browse/discover" },
    { label: "Egypt + Tunisia", to: "/browse/arabic" },
  ],
};

const MOODS: TvCategoryCard[] = [
  { id: "talk", title: "American Talk & Daytime", description: "Talk shows, daytime TV and familiar American entertainment.", to: "/browse/us-tv", icon: "talk" },
  { id: "fashion", title: "Style, Fashion & Reality", description: "Fashion, makeovers, reality and lifestyle channels.", to: "/browse/style-reality", icon: "fashion" },
  { id: "food", title: "Cooking & Home", description: "Recipes, food shows, interiors and home inspiration.", to: "/browse/food-home", icon: "food" },
  { id: "discover", title: "Documentaries & True Stories", description: "Nature, science, history, travel and true crime.", to: "/browse/discover", icon: "discover" },
  { id: "movie-night", title: "Movie Night", description: "HBO, OSN, Rotana, ART and more when you want a film.", to: "/browse/movies", icon: "movie" },
  { id: "arabic", title: "Egypt & Tunisia Live", description: "Egyptian and Tunisian entertainment, drama and everyday TV.", to: "/browse/arabic", icon: "arabic" },
];

export const HOME_ROWS: HomeRowDefinition[] = [
  {
    id: "premium",
    title: "Movies & Premium TV",
    subtitle: "The movie and entertainment channels worth opening first.",
    kind: "channels",
    channelIds: ["hbo", "showtime", "starz-cinema", "osn-movies-premiere", "netflix-arabic-1", "bein-movies-premiere", "sky-cinema-premiere"],
  },
  {
    id: "moods",
    title: "What Do You Feel Like Watching?",
    subtitle: "Browse by the kind of thing you actually want to watch.",
    kind: "categories",
    items: MOODS,
  },
  {
    id: "arabic-favorites",
    title: "Egypt, Tunisia & Arabic TV",
    subtitle: "Entertainment, movies, drama and everyday channels from the region.",
    kind: "channels",
    channelIds: ["rotana-cinema-eg", "mbc-masr", "mbc-4", "dmc", "el-hiwar", "attessia", "cbc-sofra"],
  },
];

const SECTION_LIST: SectionDefinition[] = [
  {
    id: "premium",
    title: "Premium",
    description: "Premium movie and entertainment channels, curated down to the ones worth opening.",
    channelIds: ["hbo", "hbo-signature", "showtime", "showtime-women", "starz-cinema", "starz-comedy", "osn-movies-premiere", "osn-yahala-aflam", "bein-movies-premiere", "sky-cinema-premiere", "netflix-arabic-1", "netflix-cinema"],
  },
  {
    id: "movies",
    title: "Movies",
    description: "Premium, American and Arabic movie channels in one place.",
    channelIds: ["hbo", "showtime", "starz-cinema", "osn-movies-premiere", "osn-yahala-aflam", "bein-movies-premiere", "sky-cinema-premiere", "netflix-cinema", "rotana-cinema-eg", "rotana-classic", "art-aflam-1", "art-aflam-2", "art-cinema", "nile-cinema", "mbc-2", "mbc-max"],
  },
  {
    id: "us-tv",
    title: "American TV & Daytime",
    description: "Talk, daytime, entertainment and familiar American networks.",
    channelIds: ["abc-us", "nbc-us", "e-entertainment", "amc-us", "fx-us", "fxx-us", "usa-network", "freeform-us", "oxygen-us"],
  },
  {
    id: "style-reality",
    title: "Style, Fashion & Reality",
    description: "Fashion, reality, makeovers and lifestyle viewing without the cooking channels mixed in.",
    channelIds: ["osn-woman", "tlc", "e-entertainment", "fashion-tv", "oxygen-us"],
  },
  {
    id: "food-home",
    title: "Cooking & Home",
    description: "Food, recipes, interiors and home inspiration in one focused section.",
    channelIds: ["hgtv", "food-network", "fatafeat", "cbc-sofra"],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    description: "The full lifestyle shelf: style, reality, food and home.",
    channelIds: ["osn-woman", "tlc", "e-entertainment", "fashion-tv", "oxygen-us", "hgtv", "food-network", "fatafeat", "cbc-sofra"],
  },
  {
    id: "discover",
    title: "Documentaries & True Stories",
    description: "Nature, science, travel, history and true crime.",
    channelIds: ["bbc-earth", "discovery", "discovery-science", "discovery-id", "nat-geo-wild", "nat-geo", "animal-planet", "history", "travel-channel"],
  },
  {
    id: "arabic",
    title: "Egypt, Tunisia & Arabic TV",
    description: "Egyptian, Tunisian and Arabic entertainment, drama and movie channels — the personal part of the service.",
    channelIds: ["rotana-cinema-eg", "rotana-classic", "art-aflam-1", "art-aflam-2", "art-cinema", "nile-cinema", "mbc-2", "mbc-max", "mbc-masr", "mbc-masr-2", "mbc-4", "dmc", "dmc-drama", "on-e", "on-drama", "el-hiwar", "attessia", "nessma", "hannibal", "tunisia-national-1", "cbc-sofra"],
  },
];

const allIds = [...new Set(SECTION_LIST.flatMap((section) => section.channelIds))];

export const SECTIONS: Record<string, SectionDefinition> = Object.fromEntries(
  [
    ...SECTION_LIST,
    {
      id: "all",
      title: "All Curated Channels",
      description: "Everything included in her version of the service — without the IPTV catalog clutter.",
      channelIds: allIds,
    },
  ].map((section) => [section.id, section]),
);

export function getChannelDefinition(id: string): ChannelDefinition | undefined {
  return Object.values(CHANNELS).find((entry) => entry.id === id);
}
