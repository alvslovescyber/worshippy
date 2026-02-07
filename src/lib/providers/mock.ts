import type { Candidate, RawLyrics } from "../types";
import type { LyricsProvider } from "./interface";
import { getDemoLyrics, searchDemoCatalog } from "./demoIndex";

// Note: This app currently ships with a mock provider for local development.
// Replace `getProvider()` with a real provider when you're ready.

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class MockProvider implements LyricsProvider {
  async searchSongs(query: string): Promise<Candidate[]> {
    await delay(300);
    return searchDemoCatalog(query, { minScore: 0.18, limit: 80 });
  }

  async getLyrics(songId: string): Promise<RawLyrics> {
    await delay(200);
    return getDemoLyrics(songId);
  }
}

export function getProvider(): LyricsProvider {
  return new MockProvider();
}
