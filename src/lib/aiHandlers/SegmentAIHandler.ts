// =====================================================
// Segment AI Handler - Real-time per-segment processing
// =====================================================

import type { Turn } from "@/types/database-v2";

export interface QuickAnalysisResult {
  actionType: "song_search" | "image_search" | "image_generation" | "none";
  confidence: number;
  keywords: SongKeywords | ImageKeywords | null;
  reasoning: string;
  isPrelliminary: boolean; // Flag to indicate this is not final
}

export interface SongKeywords {
  artist?: string;
  title?: string;
  year?: number;
  lyrics?: string;
  genre?: string;
}

export interface ImageKeywords {
  description: string;
  keywords: string[];
  location?: string;
  time_period?: string;
  people?: string[];
}

export class SegmentAIHandler {
  /**
   * Quick analysis for immediate UI feedback
   * Uses lightweight model for speed
   */
  async quickProcess(
    segmentNumber: number,
    elderlyResponses: Turn[],
    lastActionType: string | null
  ): Promise<QuickAnalysisResult> {
    try {
      const transcript = elderlyResponses
        .map((turn) => turn.transcript)
        .join(" ");

      if (!transcript.trim()) {
        return {
          actionType: "none",
          confidence: 0,
          keywords: null,
          reasoning: "No elderly responses",
          isPrelliminary: true,
        };
      }

      console.log(
        `🔍 Quick analyzing segment ${segmentNumber} (${transcript.length} chars)`
      );

      // Call lightweight analysis API
      const response = await fetch("/api/analyze-segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          lastActionType,
          mode: "quick", // Flag for faster processing
        }),
      });

      if (!response.ok) {
        console.warn("Quick analysis failed, using fallback");
        return this.fallbackAnalysis(transcript);
      }

      const data = await response.json();

      return {
        actionType: data.actionType || "none",
        confidence: data.confidence || 0.5,
        keywords: data.keywords || null,
        reasoning: data.reasoning || "Quick analysis",
        isPrelliminary: true,
      };
    } catch (error) {
      console.error("Error in quick process:", error);
      return this.fallbackAnalysis("");
    }
  }

  /**
   * Fallback analysis when API fails
   */
  private fallbackAnalysis(transcript: string): QuickAnalysisResult {
    // Simple keyword matching
    const lowerTranscript = transcript.toLowerCase();

    // Check for song mentions
    if (
      lowerTranscript.includes("song") ||
      lowerTranscript.includes("music") ||
      lowerTranscript.includes("sing")
    ) {
      return {
        actionType: "song_search",
        confidence: 0.6,
        keywords: { description: "Music-related content", keywords: [] },
        reasoning: "Keyword-based fallback: song detected",
        isPrelliminary: true,
      };
    }

    // Check for location mentions
    if (
      lowerTranscript.includes("place") ||
      lowerTranscript.includes("street") ||
      lowerTranscript.includes("building")
    ) {
      return {
        actionType: "image_search",
        confidence: 0.6,
        keywords: { description: "Location mentioned", keywords: [] },
        reasoning: "Keyword-based fallback: location detected",
        isPrelliminary: true,
      };
    }

    // Default to image generation for any content
    if (transcript.length > 20) {
      return {
        actionType: "image_generation",
        confidence: 0.5,
        keywords: {
          description: transcript.substring(0, 100),
          keywords: [],
        },
        reasoning: "Keyword-based fallback: default to image generation",
        isPrelliminary: true,
      };
    }

    return {
      actionType: "none",
      confidence: 0,
      keywords: null,
      reasoning: "No significant content",
      isPrelliminary: true,
    };
  }

  /**
   * Extract elderly responses from turns
   */
  extractElderlyResponses(turns: Turn[]): Turn[] {
    return turns.filter((turn) => turn.speaker === "elderly");
  }
}

export const segmentAIHandler = new SegmentAIHandler();
