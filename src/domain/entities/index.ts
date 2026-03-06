// ──────────────────────────────────────────────
// DOMAIN ENTITIES  (pure TypeScript — no deps)
// ──────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  alt_names: string[];
  network: string | null;
  owners: string[];
  country: string;       // ISO 3166-1 alpha-2
  subdivision: string | null;
  city: string | null;
  broadcast_area: string[];
  languages: string[];
  categories: string[];
  is_nsfw: boolean;
  launched: string | null;
  closed: string | null;
  replaced_by: string | null;
  website: string | null;
  logo: string;
}

export interface Stream {
  channel: string | null;
  feed: string | null;
  title: string | null;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
  status: string | null;
  width: number | null;
  height: number | null;
  bitrate: number | null;
  frame_rate: number | null;
  added: string | null;
  updated: string | null;
  expires: string | null;
  is_closing: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Country {
  code: string;
  name: string;
  languages: string[];
  flag: string;
  map_url: string | null;
  dialcode: string | null;
}

export interface Language {
  code: string;
  name: string;
}

export interface Feed {
  channel: string;
  id: string;
  name: string;
  alt_names: string[];
  is_main: boolean;
  broadcast_area: string[];
  timezones: string[];
  languages: string[];
  format: string | null;
  video_format: Record<string, unknown>;
}

// Enriched view model combining Channel + Streams
export interface ChannelWithStreams extends Channel {
  streams: Stream[];
}
