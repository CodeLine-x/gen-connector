// =====================================================
// Session AI Orchestrator - End-of-session batch processing
// Analyzes entire conversation with full context
// =====================================================

import { createClient } from "@/lib/supabase/client";
import type { Segment, Turn } from "@/types/database-v2";

export interface GlobalContext {
  sessionId: string;
  totalSegments: number;
  totalTurns: number;
  elderlyTranscripts: string[];
  youngAdultTranscripts: string[];
  timelineEvents: TimelineEvent[];
  themes: string[];
}

export interface TimelineEvent {
  segmentNumber: number;
  timestamp: number;
  speaker: "elderly" | "young_adult";
  content: string;
}

export interface OptimizedActionPlan {
  songs: SongAction[];
  imageSearches: ImageSearchAction[];
  imageGenerations: ImageGenerationAction[];
  totalCost: number;
  estimatedTime: number;
}

export interface SongAction {
  priority: number;
  keywords: {
    artist?: string;
    title?: string;
    year?: number;
  };
  context: string;
  segmentNumbers: number[];
}

export interface ImageSearchAction {
  priority: number;
  keywords: string[];
  location?: string;
  timePeriod?: string;
  context: string;
  segmentNumbers: number[];
}

export interface ImageGenerationAction {
  priority: number;
  prompt: string;
  style: string;
  context: string;
  segmentNumbers: number[];
}

export interface ArtifactMetadata {
  [key: string]: unknown;
}

export interface ExecutionResults {
  songs: Array<{ url: string; metadata: ArtifactMetadata }>;
  archiveImages: Array<{ url: string; metadata: ArtifactMetadata }>;
  generatedImages: Array<{ url: string; metadata: ArtifactMetadata }>;
  videoUrl?: string;
}

export class SessionAIOrchestrator {
  private supabase = createClient();

  /**
   * Main entry point for end-of-session processing
   */
  async finalProcess(sessionId: string): Promise<ExecutionResults> {
    console.log(`🎬 Starting final AI processing for session: ${sessionId}`);

    try {
      // 1. Load all segments and turns
      const allSegments = await this.loadAllSegments(sessionId);
      console.log(`Loaded ${allSegments.length} segments`);

      // 2. Build rich global context
      const globalContext = this.buildRichContext(allSegments);
      console.log(
        `Built context: ${globalContext.themes.length} themes identified`
      );

      // 3. Plan optimal actions with AI
      const actionPlan = await this.planOptimalActions(
        sessionId,
        globalContext
      );
      console.log(
        `Action plan: ${actionPlan.songs.length} songs, ${actionPlan.imageSearches.length} image searches, ${actionPlan.imageGenerations.length} generations`
      );

      // 4. Execute actions in parallel
      const results = await this.executeActionPlan(sessionId, actionPlan);
      console.log(
        `Execution complete: ${
          results.songs.length +
          results.archiveImages.length +
          results.generatedImages.length
        } total artifacts`
      );

      // 5. Store results in database
      await this.storeResults(sessionId, results);

      return results;
    } catch (error) {
      console.error("Error in final AI processing:", error);
      throw error;
    }
  }

  /**
   * Load all segments with their turns from the database
   */
  private async loadAllSegments(
    sessionId: string
  ): Promise<(Segment & { turns: Turn[] })[]> {
    const { data: segments, error: segmentError } = await this.supabase
      .from("segments")
      .select("*")
      .eq("session_id", sessionId)
      .order("segment_number", { ascending: true });

    if (segmentError) {
      throw new Error(`Failed to load segments: ${segmentError.message}`);
    }

    // Load turns for each segment
    const segmentsWithTurns = await Promise.all(
      (segments || []).map(async (segment) => {
        const { data: turns, error: turnError } = await this.supabase
          .from("turns")
          .select("*")
          .eq("segment_id", segment.id)
          .order("turn_number", { ascending: true });

        if (turnError) {
          console.warn(`Failed to load turns for segment ${segment.id}`);
          return { ...segment, turns: [] };
        }

        return { ...segment, turns: turns || [] };
      })
    );

    return segmentsWithTurns;
  }

  /**
   * Build rich context from all segments
   */
  private buildRichContext(
    segments: (Segment & { turns: Turn[] })[]
  ): GlobalContext {
    const elderlyTranscripts: string[] = [];
    const youngAdultTranscripts: string[] = [];
    const timelineEvents: TimelineEvent[] = [];

    segments.forEach((segment) => {
      segment.turns.forEach((turn) => {
        if (turn.speaker === "elderly") {
          elderlyTranscripts.push(turn.transcript);
        } else {
          youngAdultTranscripts.push(turn.transcript);
        }

        timelineEvents.push({
          segmentNumber: segment.segment_number,
          timestamp: turn.start_time_seconds,
          speaker: turn.speaker,
          content: turn.transcript,
        });
      });
    });

    // Extract themes from elderly transcripts
    const themes = this.extractThemes(elderlyTranscripts);

    return {
      sessionId: segments[0]?.session_id || "",
      totalSegments: segments.length,
      totalTurns: timelineEvents.length,
      elderlyTranscripts,
      youngAdultTranscripts,
      timelineEvents,
      themes,
    };
  }

  /**
   * Extract key themes from transcripts
   */
  private extractThemes(transcripts: string[]): string[] {
    const combined = transcripts.join(" ").toLowerCase();
    const themes: string[] = [];

    // Simple keyword-based theme detection
    if (combined.includes("war") || combined.includes("soldier")) {
      themes.push("wartime");
    }
    if (combined.includes("school") || combined.includes("teacher")) {
      themes.push("education");
    }
    if (combined.includes("family") || combined.includes("parents")) {
      themes.push("family");
    }
    if (combined.includes("music") || combined.includes("song")) {
      themes.push("music");
    }
    if (combined.includes("food") || combined.includes("eat")) {
      themes.push("food");
    }

    return themes;
  }

  /**
   * Plan optimal actions using AI
   */
  private async planOptimalActions(
    sessionId: string,
    context: GlobalContext
  ): Promise<OptimizedActionPlan> {
    try {
      console.log("🤖 Calling AI to plan optimal actions...");

      const response = await fetch("/api/orchestrate-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          context,
        }),
      });

      if (!response.ok) {
        console.warn("AI orchestration failed, using fallback plan");
        return this.fallbackActionPlan(context);
      }

      const data = await response.json();
      return data.actionPlan;
    } catch (error) {
      console.error("Error planning actions:", error);
      return this.fallbackActionPlan(context);
    }
  }

  /**
   * Fallback action plan if AI fails
   */
  private fallbackActionPlan(context: GlobalContext): OptimizedActionPlan {
    return {
      songs: [],
      imageSearches:
        context.themes.includes("wartime") ||
        context.themes.includes("education")
          ? [
              {
                priority: 1,
                keywords: ["singapore", "1960s", "historical"],
                location: "Singapore",
                timePeriod: "1960s-1980s",
                context: "Historical imagery",
                segmentNumbers: [1, 2, 3],
              },
            ]
          : [],
      imageGenerations: [
        {
          priority: 1,
          prompt: context.elderlyTranscripts.slice(0, 3).join(" "),
          style: "nostalgic, vintage photograph",
          context: "General memory visualization",
          segmentNumbers: [1, 2, 3],
        },
      ],
      totalCost: 0.15,
      estimatedTime: 30,
    };
  }

  /**
   * Execute the action plan in parallel
   */
  private async executeActionPlan(
    sessionId: string,
    plan: OptimizedActionPlan
  ): Promise<ExecutionResults> {
    console.log("⚡ Executing action plan in parallel...");

    const [songs, archiveImages, generatedImages] = await Promise.all([
      this.executeSongSearches(plan.songs),
      this.executeImageSearches(plan.imageSearches),
      this.generateImages(plan.imageGenerations),
    ]);

    return {
      songs,
      archiveImages,
      generatedImages,
    };
  }

  /**
   * Execute song searches
   */
  private async executeSongSearches(
    songActions: SongAction[]
  ): Promise<Array<{ url: string; metadata: ArtifactMetadata }>> {
    // Placeholder - will implement Spotify/YouTube integration
    console.log(`🎵 Executing ${songActions.length} song searches...`);
    return [];
  }

  /**
   * Execute archive image searches
   */
  private async executeImageSearches(
    imageActions: ImageSearchAction[]
  ): Promise<Array<{ url: string; metadata: ArtifactMetadata }>> {
    console.log(
      `🖼️ Executing ${imageActions.length} archive image searches...`
    );

    const results = await Promise.all(
      imageActions.map(async (action) => {
        try {
          const response = await fetch("/api/search-archives", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              keywords: action.keywords,
              location: action.location,
              timePeriod: action.timePeriod,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          return data.images?.[0] || null;
        } catch (error) {
          console.error("Archive search error:", error);
          return null;
        }
      })
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Generate images using fal.ai
   */
  private async generateImages(
    imageActions: ImageGenerationAction[]
  ): Promise<Array<{ url: string; metadata: ArtifactMetadata }>> {
    console.log(`🎨 Generating ${imageActions.length} images...`);

    const results = await Promise.all(
      imageActions.map(async (action) => {
        try {
          const response = await fetch("/api/generate-image-fal", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: action.prompt,
              style: action.style,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          return {
            url: data.url,
            metadata: {
              prompt: action.prompt,
              style: action.style,
              model: "fal-ai/flux-pro",
            },
          };
        } catch (error) {
          console.error("Image generation error:", error);
          return null;
        }
      })
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Store results in database
   */
  private async storeResults(
    sessionId: string,
    results: ExecutionResults
  ): Promise<void> {
    console.log("💾 Storing results in database...");

    const allContent = [
      ...results.songs.map((s) => ({
        session_id: sessionId,
        content_type: "song" as const,
        url: s.url,
        metadata: s.metadata,
      })),
      ...results.archiveImages.map((i) => ({
        session_id: sessionId,
        content_type: "image" as const,
        url: i.url,
        metadata: i.metadata,
      })),
      ...results.generatedImages.map((i) => ({
        session_id: sessionId,
        content_type: "image" as const,
        url: i.url,
        metadata: i.metadata,
      })),
    ];

    if (allContent.length > 0) {
      const { error } = await this.supabase
        .from("generated_content")
        .insert(allContent);

      if (error) {
        console.error("Error storing results:", error);
      } else {
        console.log(`✅ Stored ${allContent.length} artifacts in database`);
      }
    }
  }
}

export const sessionAIOrchestrator = new SessionAIOrchestrator();
