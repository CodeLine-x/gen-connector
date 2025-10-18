import { uploadAudio } from "@/lib/storage";

export interface SpeakerSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface DiarizationResult {
  segments: SpeakerSegment[];
  speakers: string[];
  totalDuration: number;
}

class SpeakerDiarizationService {
  private elevenLabsApiKey: string;

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || "";
  }

  /**
   * Analyze audio for speaker diarization using ElevenLabs
   */
  async analyzeSpeakers(audioBlob: Blob): Promise<DiarizationResult> {
    if (!this.elevenLabsApiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    try {
      console.log(
        "Calling ElevenLabs API with key:",
        this.elevenLabsApiKey?.substring(0, 10) + "..."
      );

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model_id", "scribe_v1");
      formData.append("language_code", "eng");
      formData.append("diarize", "true");

      // Call ElevenLabs Speech-to-Text API for speaker diarization
      // Using Scribe v1 model for accurate transcription and speaker diarization
      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: {
            "xi-api-key": this.elevenLabsApiKey,
            // Don't set Content-Type - let the browser set it with boundary for multipart/form-data
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error response:", errorText);
        throw new Error(
          `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("ElevenLabs API response:", result);
      return this.processDiarizationResult(result);
    } catch (error) {
      console.error("Speaker diarization error:", error);
      throw new Error("Failed to analyze speakers");
    }
  }

  /**
   * Process ElevenLabs diarization result
   * ElevenLabs returns words array with individual words and spacing
   * We need to compile these into readable segments grouped by speaker
   */
  private processDiarizationResult(result: any): DiarizationResult {
    const segments: SpeakerSegment[] = [];
    const speakers = new Set<string>();

    // Check for 'words' array (ElevenLabs actual response format)
    const wordsArray = result.words || result.tokens;

    if (!wordsArray || !Array.isArray(wordsArray)) {
      console.warn("No words/tokens array found in result:", result);
      return {
        segments: [],
        speakers: [],
        totalDuration: 0,
      };
    }

    console.log(
      `Processing ${wordsArray.length} words from ElevenLabs response`
    );

    // Group consecutive words by speaker to form readable segments
    let currentSpeaker: string | null = null;
    let currentText = "";
    let currentStartTime = 0;
    let currentEndTime = 0;
    let currentConfidence = 0;
    let wordCount = 0;

    wordsArray.forEach((token: any, index: number) => {
      const speakerId = token.speaker_id || "unknown";
      speakers.add(speakerId);

      // Skip spacing tokens for compilation, but use them to track timing
      if (token.type === "spacing") {
        if (currentText) {
          currentText += token.text; // Preserve spaces in text
        }
        return;
      }

      // If speaker changes, save the current segment
      if (currentSpeaker && currentSpeaker !== speakerId) {
        if (currentText.trim()) {
          segments.push({
            speaker: currentSpeaker,
            text: currentText.trim(),
            startTime: currentStartTime,
            endTime: currentEndTime,
            confidence: wordCount > 0 ? currentConfidence / wordCount : 0.5,
          });
          console.log(
            `Segment created: ${currentSpeaker} - "${currentText.trim()}"`
          );
        }

        // Reset for new speaker
        currentSpeaker = speakerId;
        currentText = token.text;
        currentStartTime = token.start || 0;
        currentEndTime = token.end || 0;
        currentConfidence = token.logprob || 0;
        wordCount = 1;
      } else {
        // Continue building current segment
        if (!currentSpeaker) {
          currentSpeaker = speakerId;
          currentStartTime = token.start || 0;
        }
        currentText += token.text;
        currentEndTime = token.end || 0;
        currentConfidence += token.logprob || 0;
        wordCount++;
      }

      // Handle last word - push final segment
      if (index === wordsArray.length - 1 && currentText.trim()) {
        segments.push({
          speaker: currentSpeaker!,
          text: currentText.trim(),
          startTime: currentStartTime,
          endTime: currentEndTime,
          confidence: wordCount > 0 ? currentConfidence / wordCount : 0.5,
        });
        console.log(
          `Final segment created: ${currentSpeaker} - "${currentText.trim()}"`
        );
      }
    });

    console.log(
      `✅ Processed ${segments.length} segments from ${wordsArray.length} words`
    );
    console.log(`Identified speakers:`, Array.from(speakers));

    return {
      segments,
      speakers: Array.from(speakers),
      totalDuration: wordsArray[wordsArray.length - 1]?.end || 0,
    };
  }

  /**
   * Identify speaker roles based on voice characteristics
   */
  identifySpeakerRoles(diarizationResult: DiarizationResult): {
    elderly: string[];
    youngAdult: string[];
  } {
    const { segments, speakers } = diarizationResult;

    // Analyze voice characteristics for each speaker
    const speakerAnalysis = speakers.map((speakerId) => {
      const speakerSegments = segments.filter((s) => s.speaker === speakerId);

      // Calculate average characteristics
      const avgConfidence =
        speakerSegments.reduce((sum, s) => sum + s.confidence, 0) /
        speakerSegments.length;
      const totalDuration = speakerSegments.reduce(
        (sum, s) => sum + (s.endTime - s.startTime),
        0
      );
      const avgSegmentLength =
        speakerSegments.length > 0 ? totalDuration / speakerSegments.length : 0;

      return {
        speakerId,
        avgConfidence,
        totalDuration,
        avgSegmentLength,
        segmentCount: speakerSegments.length,
      };
    });

    // Sort by characteristics to identify elderly vs young adult
    // Elderly typically: longer segments, more confident speech, more content
    // Young adult typically: shorter segments, questions, less confident
    const sortedByDuration = speakerAnalysis.sort(
      (a, b) => b.totalDuration - a.totalDuration
    );
    const sortedByConfidence = speakerAnalysis.sort(
      (a, b) => b.avgConfidence - a.avgConfidence
    );
    const sortedBySegmentLength = speakerAnalysis.sort(
      (a, b) => b.avgSegmentLength - a.avgSegmentLength
    );

    // Heuristic: Speaker with longest total duration and longest segments is likely elderly
    const elderlySpeaker = sortedByDuration[0]?.speakerId;
    const youngAdultSpeaker = speakers.find((s) => s !== elderlySpeaker);

    return {
      elderly: elderlySpeaker ? [elderlySpeaker] : [],
      youngAdult: youngAdultSpeaker ? [youngAdultSpeaker] : [],
    };
  }

  /**
   * Convert diarization result to conversation turns
   */
  convertToConversationTurns(
    diarizationResult: DiarizationResult,
    speakerRoles: {
      elderly: string[];
      youngAdult: string[];
    }
  ): Array<{
    speaker: "elderly" | "young_adult";
    transcript: string;
    timestamp: number;
    confidence: number;
  }> {
    const { segments } = diarizationResult;
    const { elderly, youngAdult } = speakerRoles;

    return segments.map((segment) => {
      let speakerRole: "elderly" | "young_adult";

      if (elderly.includes(segment.speaker)) {
        speakerRole = "elderly";
      } else if (youngAdult.includes(segment.speaker)) {
        speakerRole = "young_adult";
      } else {
        // Default to young adult if uncertain
        speakerRole = "young_adult";
      }

      return {
        speaker: speakerRole,
        transcript: segment.text,
        timestamp: segment.startTime,
        confidence: segment.confidence,
      };
    });
  }
}

export const speakerDiarizationService = new SpeakerDiarizationService();
