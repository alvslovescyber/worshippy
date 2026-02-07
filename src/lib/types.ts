// ─── Core domain types ───

export interface Candidate {
  id: string;
  title: string;
  artist?: string;
  score: number; // 0–1 relevance
}

export interface RawLyrics {
  songId: string;
  title: string;
  artist?: string;
  raw: string; // full lyrics text with section headers
}

export type SongSectionLabel =
  | `Verse ${number}`
  | "Chorus"
  | "Pre-Chorus"
  | "Bridge"
  | "Tag"
  | "Outro"
  | "Intro"
  | "Other";

export interface SongSection {
  label: SongSectionLabel;
  lines: string[];
}

export interface NormalizedSong {
  title: string;
  artist?: string;
  sections: SongSection[];
  source?: "demo" | "manual" | "provider";
}

export interface SlideContent {
  type: "cover" | "title" | "lyrics";
  title?: string;
  artist?: string;
  sectionLabel?: string;
  lines?: string[];
  date?: string;
}

// ─── App state types ───

export type SongStatus =
  | { phase: "searching" }
  | { phase: "candidates"; candidates: Candidate[] }
  | { phase: "resolved"; song: NormalizedSong }
  | { phase: "manual" } // user will paste lyrics
  | { phase: "error"; message: string };

export interface SongEntry {
  id: string;
  query: string;
  artist?: string;
  status: SongStatus;
}

export interface GenerateSettings {
  linesPerSlide: 2 | 3 | 4;
  showSectionLabels: boolean;
  theme: "dark" | "light";
  backgroundImage?: string; // base64 data URL
}

export const DEFAULT_SETTINGS: GenerateSettings = {
  linesPerSlide: 3,
  showSectionLabels: false,
  theme: "dark",
};

// ─── API payloads ───

export interface ParseTitlesResponse {
  titles: string[];
}

export interface SearchResponse {
  query: string;
  candidates: Candidate[];
  topMatch?: NormalizedSong | null;
}

export interface GenerateRequest {
  songs: NormalizedSong[];
  settings: GenerateSettings;
}
