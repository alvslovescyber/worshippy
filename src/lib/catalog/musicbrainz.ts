import type { Candidate } from "@/lib/types";

interface MusicBrainzArtistCredit {
  name?: string;
  artist?: { name?: string };
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  score?: number; // 0-100
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface MusicBrainzRecordingSearchResponse {
  recordings?: MusicBrainzRecording[];
}

function pickArtistName(
  credits: MusicBrainzArtistCredit[] | undefined,
): string | undefined {
  if (!credits || credits.length === 0) return undefined;
  const first = credits[0];
  const name = first?.name ?? first?.artist?.name;
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : undefined;
}

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export async function searchMusicBrainzRecordings(
  query: string,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<Candidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const limit = Math.max(1, Math.min(opts?.limit ?? 12, 25));
  const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(
    q,
  )}&fmt=json&limit=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  if (!res.ok) return [];

  const data = (await res
    .json()
    .catch(() => null)) as MusicBrainzRecordingSearchResponse | null;
  const recs = Array.isArray(data?.recordings) ? data!.recordings : [];

  return recs
    .filter((r) => typeof r?.id === "string" && typeof r?.title === "string")
    .map((r) => {
      const score = typeof r.score === "number" ? clampScore(r.score / 100) : 0.5;
      return {
        id: `mb:${r.id}`,
        title: r.title,
        artist: pickArtistName(r["artist-credit"]),
        score,
      };
    });
}
