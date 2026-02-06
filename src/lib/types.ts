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

export interface SongSection {
  label: "Verse 1" | "Verse 2" | "Verse 3" | "Verse 4" | "Chorus" | "Pre-Chorus" | "Bridge" | "Tag" | "Outro" | "Intro" | "Other";
  lines: string[];
}

export interface NormalizedSong {
  title: string;
  artist?: string;
  sections: SongSection[];
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
}

export interface GenerateRequest {
  songs: NormalizedSong[];
  settings: GenerateSettings;
}
