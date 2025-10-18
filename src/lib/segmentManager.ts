// =====================================================
// Segment Manager - Handles 30-second segment logic
// =====================================================

import { createClient } from "@/lib/supabase/client";
import type {
  Session,
  Segment,
  Turn,
  Action,
  SegmentInsert,
  TurnInsert,
  ActionInsert,
  ElderlyResponse,
} from "@/types/database-v2";

export class SegmentManager {
  private sessionId: string;
  private currentSegmentNumber: number = 0;
  private segmentStartTime: number = 0;
  private recordingStartTime: number = 0;
  private lastActionType: string | null = null;
  private supabase = createClient();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Initialize a new recording session
   */
  async startRecording(): Promise<void> {
    this.recordingStartTime = Date.now();
    this.segmentStartTime = 0;
    this.currentSegmentNumber = 0;
    this.lastActionType = null;

    console.log(`📹 Recording started for session: ${this.sessionId}`);
  }

  /**
   * Create a new segment (called every 30 seconds or on manual stop)
   */
  async createSegment(
    audioBlob: Blob,
    actualDuration: number
  ): Promise<Segment> {
    this.currentSegmentNumber += 1;

    const segment: SegmentInsert = {
      session_id: this.sessionId,
      segment_number: this.currentSegmentNumber,
      start_time_seconds: this.segmentStartTime,
      end_time_seconds: this.segmentStartTime + actualDuration,
      duration_seconds: actualDuration,
      transcription_status: "pending",
      ai_action_status: "pending",
    };

    console.log(
      `📦 Creating segment ${this.currentSegmentNumber} (${
        this.segmentStartTime
      }s - ${this.segmentStartTime + actualDuration}s)`
    );

    const { data, error } = await this.supabase
      .from("segments")
      .insert(segment)
      .select()
      .single();

    if (error) {
      console.error("Error creating segment:", error);
      throw new Error("Failed to create segment");
    }

    // Update segment start time for next segment
    this.segmentStartTime += actualDuration;

    return data as Segment;
  }

  /**
   * Save turns (conversation exchanges) for a segment
   */
  async saveTurns(
    segmentId: string,
    turns: Array<{
      speaker: "elderly" | "young_adult";
      transcript: string;
      startTime: number;
      endTime: number;
      confidence: number;
      speakerId?: string;
    }>
  ): Promise<Turn[]> {
    const turnInserts: TurnInsert[] = turns.map((turn, index) => ({
      segment_id: segmentId,
      session_id: this.sessionId,
      speaker: turn.speaker,
      speaker_id: turn.speakerId || null,
      transcript: turn.transcript,
      start_time_seconds: turn.startTime,
      end_time_seconds: turn.endTime,
      confidence: turn.confidence,
      turn_number: index + 1,
    }));

    console.log(
      `💬 Saving ${turnInserts.length} turns for segment ${segmentId}`
    );

    const { data, error } = await this.supabase
      .from("turns")
      .insert(turnInserts)
      .select();

    if (error) {
      console.error("Error saving turns:", error);
      throw new Error("Failed to save turns");
    }

    return data as Turn[];
  }

  /**
   * Extract elderly responses from turns
   */
  extractElderlyResponses(turns: Turn[]): ElderlyResponse[] {
    return turns
      .filter((turn) => turn.speaker === "elderly")
      .map((turn) => ({
        segment_number: this.currentSegmentNumber,
        transcript: turn.transcript,
        confidence: turn.confidence,
        timestamp: turn.start_time_seconds,
      }));
  }

  /**
   * Determine AI action based on elderly responses
   * Priority: song_search > image_search > image_generation
   * Avoid consecutive duplicate actions
   */
  async determineAndCreateAction(
    segmentId: string,
    elderlyResponses: ElderlyResponse[]
  ): Promise<Action | null> {
    if (elderlyResponses.length === 0) {
      console.log("⚠️ No elderly responses, skipping AI action");
      return null;
    }

    const combinedTranscript = elderlyResponses
      .map((r) => r.transcript)
      .join(" ");

    console.log(`🤖 Analyzing elderly responses for segment ${segmentId}...`);

    // Call AI to analyze and determine action
    const actionType = await this.analyzeForActionType(
      combinedTranscript,
      this.lastActionType
    );

    if (!actionType || actionType === "none") {
      console.log("ℹ️ No action needed for this segment");
      return null;
    }

    // Create action record
    const priority = this.getActionPriority(actionType);
    const actionInsert: ActionInsert = {
      segment_id: segmentId,
      session_id: this.sessionId,
      action_type: actionType,
      priority,
      status: "pending",
    };

    const { data, error } = await this.supabase
      .from("actions")
      .insert(actionInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating action:", error);
      throw new Error("Failed to create action");
    }

    // Update last action type
    this.lastActionType = actionType;

    console.log(`✅ Action created: ${actionType} (priority: ${priority})`);

    return data as Action;
  }

  /**
   * Call AI API to analyze transcript and determine action type
   */
  private async analyzeForActionType(
    transcript: string,
    lastActionType: string | null
  ): Promise<"song_search" | "image_search" | "image_generation" | "none"> {
    try {
      const response = await fetch("/api/analyze-segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          lastActionType,
        }),
      });

      if (!response.ok) {
        console.error("AI analysis failed:", response.statusText);
        return "none";
      }

      const data = await response.json();
      return data.actionType || "none";
    } catch (error) {
      console.error("Error calling AI analysis API:", error);
      return "none";
    }
  }

  /**
   * Get priority number for action type
   */
  private getActionPriority(
    actionType: "song_search" | "image_search" | "image_generation"
  ): number {
    switch (actionType) {
      case "song_search":
        return 1;
      case "image_search":
        return 2;
      case "image_generation":
        return 3;
      default:
        return 99;
    }
  }

  /**
   * Update segment with audio URL after upload
   */
  async updateSegmentAudioUrl(
    segmentId: string,
    audioUrl: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("segments")
      .update({ audio_url: audioUrl })
      .eq("id", segmentId);

    if (error) {
      console.error("Error updating segment audio URL:", error);
      throw new Error("Failed to update segment audio URL");
    }

    console.log(`🎵 Audio URL updated for segment ${segmentId}`);
  }

  /**
   * Update segment transcription status
   */
  async updateSegmentTranscriptionStatus(
    segmentId: string,
    status: "pending" | "processing" | "completed" | "failed"
  ): Promise<void> {
    const { error } = await this.supabase
      .from("segments")
      .update({
        transcription_status: status,
        processed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", segmentId);

    if (error) {
      console.error("Error updating transcription status:", error);
      throw new Error("Failed to update transcription status");
    }
  }

  /**
   * Update segment AI summary
   */
  async updateSegmentSummary(
    segmentId: string,
    summary: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("segments")
      .update({ ai_summary: summary })
      .eq("id", segmentId);

    if (error) {
      console.error("Error updating segment summary:", error);
      throw new Error("Failed to update segment summary");
    }
  }

  /**
   * Finalize session (called when recording ends)
   */
  async finalizeSession(): Promise<void> {
    const totalDuration = (Date.now() - this.recordingStartTime) / 1000; // seconds

    const { error } = await this.supabase
      .from("sessions")
      .update({
        status: "completed",
        total_duration_seconds: Math.floor(totalDuration),
        total_segments: this.currentSegmentNumber,
        completed_at: new Date().toISOString(),
      })
      .eq("id", this.sessionId);

    if (error) {
      console.error("Error finalizing session:", error);
      throw new Error("Failed to finalize session");
    }

    console.log(
      `✅ Session finalized: ${
        this.currentSegmentNumber
      } segments, ${Math.floor(totalDuration)}s total`
    );
  }

  /**
   * Get current segment number
   */
  getCurrentSegmentNumber(): number {
    return this.currentSegmentNumber;
  }

  /**
   * Get total recording duration
   */
  getTotalDuration(): number {
    return this.segmentStartTime;
  }

  /**
   * Check if maximum segments reached (10 segments = 5 minutes)
   */
  hasReachedMaxSegments(): boolean {
    return this.currentSegmentNumber >= 10;
  }
}
