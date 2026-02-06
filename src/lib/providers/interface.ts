import { Candidate, RawLyrics } from "../types";

export interface LyricsProvider {
  searchSongs(query: string): Promise<Candidate[]>;
  getLyrics(songId: string): Promise<RawLyrics>;
}
