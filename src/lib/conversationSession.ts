import { uploadAudio } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export interface ConversationTurn {
  id: string;
  speaker: "elderly" | "young_adult";
  transcript: string;
  audioBlob?: Blob; // Store audio blob temporarily
  timestamp: number;
}

export interface ConversationSession {
  id: string;
  turns: ConversationTurn[];
  isActive: boolean;
  startTime: number;
  endTime?: number;
}

class ConversationSessionManager {
  private currentSession: ConversationSession | null = null;
  private audioChunks: Blob[] = [];

  /**
   * Start a new conversation session
   */
  startSession(): string {
    const sessionId = uuidv4();
    this.currentSession = {
      id: sessionId,
      turns: [],
      isActive: true,
      startTime: Date.now(),
    };
    this.audioChunks = [];
    return sessionId;
  }

  /**
   * Add a turn to the current session (without uploading audio yet)
   */
  addTurn(
    speaker: "elderly" | "young_adult",
    transcript: string,
    audioBlob?: Blob
  ): ConversationTurn {
    if (!this.currentSession) {
      throw new Error("No active session. Call startSession() first.");
    }

    const turn: ConversationTurn = {
      id: uuidv4(),
      speaker,
      transcript,
      audioBlob,
      timestamp: Date.now(),
    };

    this.currentSession.turns.push(turn);

    // Store audio blob temporarily
    if (audioBlob) {
      this.audioChunks.push(audioBlob);
    }

    return turn;
  }

  /**
   * End the current session and upload all audio
   */
  async endSession(): Promise<{
    sessionId: string;
    turns: ConversationTurn[];
    totalDuration: number;
    audioUrls: string[];
  }> {
    if (!this.currentSession) {
      throw new Error("No active session to end.");
    }

    this.currentSession.isActive = false;
    this.currentSession.endTime = Date.now();

    const totalDuration =
      this.currentSession.endTime - this.currentSession.startTime;
    const audioUrls: string[] = [];

    // Upload all audio chunks as a single session audio file
    if (this.audioChunks.length > 0) {
      try {
        // Combine all audio chunks into one blob
        const combinedAudioBlob = new Blob(this.audioChunks, {
          type: "audio/webm",
        });

        // Upload the combined audio
        const audioUrl = await uploadAudio(
          combinedAudioBlob,
          `conversation-sessions/${this.currentSession.id}/full-conversation.webm`
        );

        audioUrls.push(audioUrl);
      } catch (error) {
        console.error("Error uploading session audio:", error);
      }
    }

    const result = {
      sessionId: this.currentSession.id,
      turns: [...this.currentSession.turns],
      totalDuration,
      audioUrls,
    };

    // Clear the session
    this.currentSession = null;
    this.audioChunks = [];

    return result;
  }

  /**
   * Get the current session
   */
  getCurrentSession(): ConversationSession | null {
    return this.currentSession;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    turnCount: number;
    elderlyTurns: number;
    youngAdultTurns: number;
    totalDuration: number;
    isActive: boolean;
  } {
    if (!this.currentSession) {
      return {
        turnCount: 0,
        elderlyTurns: 0,
        youngAdultTurns: 0,
        totalDuration: 0,
        isActive: false,
      };
    }

    const elderlyTurns = this.currentSession.turns.filter(
      (turn) => turn.speaker === "elderly"
    ).length;
    const youngAdultTurns = this.currentSession.turns.filter(
      (turn) => turn.speaker === "young_adult"
    ).length;

    const currentTime = this.currentSession.isActive
      ? Date.now()
      : this.currentSession.endTime || Date.now();
    const totalDuration = currentTime - this.currentSession.startTime;

    return {
      turnCount: this.currentSession.turns.length,
      elderlyTurns,
      youngAdultTurns,
      totalDuration,
      isActive: this.currentSession.isActive,
    };
  }

  /**
   * Clear the current session (without uploading)
   */
  clearSession(): void {
    this.currentSession = null;
    this.audioChunks = [];
  }
}

export const conversationSessionManager = new ConversationSessionManager();
