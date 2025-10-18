export type SpeakerRole = "elderly" | "young_adult";

export interface AudioFeatures {
  pitch: number;
  volume: number;
  duration: number;
  speakingRate: number;
}

export interface ConversationTurn {
  speaker: SpeakerRole;
  transcript: string;
  timestamp: number;
  audioFeatures?: AudioFeatures;
}

class SpeakerIdentifier {
  private conversationHistory: ConversationTurn[] = [];
  private lastSpeaker: SpeakerRole | null = null;
  private turnCount = 0;

  identifySpeaker(
    transcript: string,
    audioFeatures?: AudioFeatures,
    duration?: number
  ): SpeakerRole {
    // If this is the first turn, assume young adult starts the conversation
    if (this.conversationHistory.length === 0) {
      this.lastSpeaker = "young_adult";
      this.turnCount++;
      return "young_adult";
    }

    // Simple alternating pattern for now
    // In a real implementation, you'd use more sophisticated audio analysis
    const nextSpeaker: SpeakerRole =
      this.lastSpeaker === "elderly" ? "young_adult" : "elderly";

    // Apply some heuristics based on content and audio features
    const finalSpeaker = this.applyHeuristics(
      transcript,
      audioFeatures,
      nextSpeaker
    );

    this.lastSpeaker = finalSpeaker;
    this.turnCount++;

    return finalSpeaker;
  }

  private applyHeuristics(
    transcript: string,
    audioFeatures: AudioFeatures | undefined,
    defaultSpeaker: SpeakerRole
  ): SpeakerRole {
    // Heuristic 1: Question patterns (usually young adult asking)
    if (this.isQuestion(transcript)) {
      return "young_adult";
    }

    // Heuristic 2: Longer responses (usually elderly sharing stories)
    if (transcript.length > 200) {
      return "elderly";
    }

    // Heuristic 3: Audio features (if available)
    if (audioFeatures) {
      // Lower pitch and slower speaking rate might indicate elderly
      if (audioFeatures.pitch < 150 && audioFeatures.speakingRate < 3) {
        return "elderly";
      }

      // Higher pitch and faster speaking rate might indicate young adult
      if (audioFeatures.pitch > 200 && audioFeatures.speakingRate > 4) {
        return "young_adult";
      }
    }

    // Heuristic 4: Content analysis
    const elderlyKeywords = [
      "when I was young",
      "back then",
      "in my day",
      "remember when",
      "used to",
    ];
    const youngAdultKeywords = [
      "what was",
      "how did",
      "can you tell me",
      "I wonder",
      "what if",
    ];

    const lowerTranscript = transcript.toLowerCase();

    if (elderlyKeywords.some((keyword) => lowerTranscript.includes(keyword))) {
      return "elderly";
    }

    if (
      youngAdultKeywords.some((keyword) => lowerTranscript.includes(keyword))
    ) {
      return "young_adult";
    }

    return defaultSpeaker;
  }

  private isQuestion(transcript: string): boolean {
    const questionWords = [
      "what",
      "how",
      "when",
      "where",
      "why",
      "who",
      "can you",
      "could you",
      "would you",
    ];
    const lowerTranscript = transcript.toLowerCase();
    return (
      questionWords.some((word) => lowerTranscript.startsWith(word)) ||
      transcript.includes("?")
    );
  }

  addTurn(turn: ConversationTurn): void {
    this.conversationHistory.push(turn);
  }

  getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }

  getLastSpeaker(): SpeakerRole | null {
    return this.lastSpeaker;
  }

  reset(): void {
    this.conversationHistory = [];
    this.lastSpeaker = null;
    this.turnCount = 0;
  }
}

export const speakerIdentifier = new SpeakerIdentifier();
