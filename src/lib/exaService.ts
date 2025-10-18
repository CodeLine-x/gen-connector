// Exa.ai Service - Semantic web search for songs and artists

interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  text?: string;
}

interface SongSearchResult {
  found: boolean;
  songTitle?: string;
  artistName?: string;
  year?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  description?: string;
}

class ExaService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EXA_API_KEY || "";
  }

  /**
   * Search for a song using Exa.ai's semantic search
   */
  async searchSong(query: string): Promise<SongSearchResult> {
    if (!this.apiKey) {
      console.error("Exa.ai API key not configured");
      return { found: false };
    }

    try {
      console.log(`🔍 Searching Exa.ai for: "${query}"`);

      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          query: `${query} official music song`,
          numResults: 10,
          useAutoprompt: true,
          contents: {
            text: true,
          },
          // Prioritize Spotify (more reliable) over YouTube
          includeDomains: [
            "spotify.com",
            "youtube.com",
            "music.youtube.com",
            "open.spotify.com",
          ],
        }),
      });

      if (!response.ok) {
        console.error("Exa.ai API error:", response.status);
        return { found: false };
      }

      const data = await response.json();
      console.log(`✅ Exa.ai found ${data.results?.length || 0} results`);

      // Prioritize Spotify results (more reliable than YouTube)
      if (data.results && data.results.length > 0) {
        const results = data.results as ExaSearchResult[];

        // Try multiple candidates and verify they're accessible
        const spotifyResults = results.filter((r) => r.url.includes("spotify"));
        const youtubeResults = results.filter((r) => r.url.includes("youtube"));

        // First, try Spotify results (preferred, always playable)
        for (const result of spotifyResults) {
          const isValid = await this.verifyMusicUrl(result.url);
          if (isValid) {
            const songInfo = this.parseSongInfo(result.title);
            console.log(`✅ Valid Spotify track found: ${songInfo.songTitle}`);

            return {
              found: true,
              songTitle: songInfo.songTitle,
              artistName: songInfo.artistName,
              spotifyUrl: result.url,
              description: result.text?.substring(0, 200),
              ...songInfo,
            };
          }
        }

        // If no valid Spotify, try YouTube results
        for (const result of youtubeResults) {
          const isValid = await this.verifyYouTubeVideo(result.url);
          if (isValid) {
            const songInfo = this.parseSongInfo(result.title);
            console.log(`✅ Valid YouTube video found: ${songInfo.songTitle}`);

            return {
              found: true,
              songTitle: songInfo.songTitle,
              artistName: songInfo.artistName,
              youtubeUrl: result.url,
              description: result.text?.substring(0, 200),
              ...songInfo,
            };
          }
        }

        console.log("❌ No valid playable music found after verification");
      }

      return { found: false };
    } catch (error) {
      console.error("Error searching Exa.ai:", error);
      return { found: false };
    }
  }

  /**
   * Verify if a Spotify URL is accessible
   */
  private async verifyMusicUrl(url: string): Promise<boolean> {
    try {
      // For Spotify, check if the URL is accessible (always assume playable if reachable)
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch {
      console.log(`❌ Spotify URL not accessible: ${url}`);
      return false;
    }
  }

  /**
   * Verify if a YouTube video is available and embeddable
   */
  private async verifyYouTubeVideo(url: string): Promise<boolean> {
    try {
      const videoId = this.extractYouTubeId(url);
      if (!videoId) return false;

      // Use YouTube oEmbed API to check if video is embeddable
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

      const response = await fetch(oEmbedUrl, {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        // If we get valid data back, the video is available and embeddable
        return !!data.title;
      }

      return false;
    } catch {
      console.log(`❌ YouTube video not accessible or not embeddable: ${url}`);
      return false;
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeId(url: string): string {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  }

  /**
   * Parse song title and artist from result title
   */
  private parseSongInfo(title: string): {
    songTitle?: string;
    artistName?: string;
    year?: string;
  } {
    // Common patterns:
    // "Artist - Song Title (Official Video)"
    // "Song Title by Artist"
    // "Artist: Song Title"

    let songTitle: string | undefined;
    let artistName: string | undefined;
    let year: string | undefined;

    // Remove common suffixes
    let cleanTitle = title
      .replace(/\(Official.*?\)/gi, "")
      .replace(/\(Music Video\)/gi, "")
      .replace(/\(Audio\)/gi, "")
      .replace(/\[.*?\]/g, "")
      .trim();

    // Extract year if present
    const yearMatch = cleanTitle.match(/\(?(19\d{2}|20\d{2})\)?/);
    if (yearMatch) {
      year = yearMatch[1];
      cleanTitle = cleanTitle.replace(yearMatch[0], "").trim();
    }

    // Pattern: "Artist - Song"
    if (cleanTitle.includes(" - ")) {
      const parts = cleanTitle.split(" - ");
      artistName = parts[0].trim();
      songTitle = parts[1].trim();
    }
    // Pattern: "Song by Artist"
    else if (cleanTitle.toLowerCase().includes(" by ")) {
      const parts = cleanTitle.split(/\s+by\s+/i);
      songTitle = parts[0].trim();
      artistName = parts[1].trim();
    }
    // Pattern: "Artist: Song"
    else if (cleanTitle.includes(":")) {
      const parts = cleanTitle.split(":");
      artistName = parts[0].trim();
      songTitle = parts[1].trim();
    } else {
      songTitle = cleanTitle;
    }

    return { songTitle, artistName, year };
  }

  /**
   * Extract keywords for music search from transcript
   * Only search for music when there's clear, specific music context
   */
  extractMusicKeywords(transcript: string): string | null {
    // Much more conservative patterns - only search when explicitly mentioned
    const patterns = [
      // Explicit song mentions with quotes
      /(?:song|music)\s+["']([^"'\n]+)["']/gi,
      // Artist names with "by" or "from"
      /["']([^"'\n]+)["']\s+(?:by|from)\s+([^,.\n]+)/gi,
      // Specific music genres or eras
      /(?:rock|jazz|blues|classical|pop|country|folk|disco|reggae|hip hop|rap)\s+(?:music|song)/gi,
      // Specific instruments
      /(?:piano|guitar|violin|drums|saxophone|trumpet)\s+(?:song|music|piece)/gi,
    ];

    for (const pattern of patterns) {
      const matches = transcript.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          // Avoid very short matches
          const keyword = match[1].trim();
          // Additional validation: must contain letters and be meaningful
          if (/[a-zA-Z]/.test(keyword) && keyword.length > 3) {
            return keyword;
          }
        }
      }
    }

    return null;
  }
}

export const exaService = new ExaService();
export type { SongSearchResult };
