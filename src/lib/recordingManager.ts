// Recording Manager - Handles continuous audio recording in 30-second segments
// Each segment is processed in parallel while the next one records

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private segmentTimer: NodeJS.Timeout | null = null;
  private totalTimer: NodeJS.Timeout | null = null;
  private currentSegment: number = 0;
  private isActive: boolean = false;
  private onSegmentComplete: (segmentNumber: number, audioBlob: Blob) => void =
    () => {};
  private onSessionComplete: () => void = () => {};

  constructor(
    onSegmentComplete: (segmentNumber: number, audioBlob: Blob) => void,
    onSessionComplete: () => void
  ) {
    this.onSegmentComplete = onSegmentComplete;
    this.onSessionComplete = onSessionComplete;
  }

  async startRecording(): Promise<void> {
    try {
      console.log("🎤 Initializing recording manager...");

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isActive = true;

      // Start first segment immediately
      this.startNextSegment();

      // Set 5-minute total timer
      this.totalTimer = setTimeout(() => {
        console.log("⏱️ 5-minute limit reached");
        this.stopRecording();
      }, 5 * 60 * 1000); // 5 minutes
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }

  private startNextSegment(): void {
    if (!this.stream || !this.isActive) {
      console.log("❌ Cannot start segment: stream inactive");
      return;
    }

    if (this.currentSegment >= 10) {
      console.log("🛑 Max segments reached (10)");
      this.stopRecording();
      return;
    }

    this.currentSegment++;
    console.log(`🔴 Recording segment ${this.currentSegment}...`);

    // Reset chunks for this segment
    this.audioChunks = [];

    // Create new MediaRecorder for this segment
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: "audio/webm",
    });

    // Handle data available event
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Handle stop event
    this.mediaRecorder.onstop = () => {
      if (!this.isActive) {
        console.log("⏹️ Recording stopped, not starting next segment");
        return;
      }

      const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
      const segmentNum = this.currentSegment;

      console.log(
        `✅ Segment ${segmentNum} recorded (${audioBlob.size} bytes)`
      );

      // Fire callback asynchronously (don't wait for processing)
      setTimeout(() => {
        this.onSegmentComplete(segmentNum, audioBlob);
      }, 0);

      // IMMEDIATELY start next segment (parallel processing)
      if (this.isActive && this.currentSegment < 10) {
        console.log("🔄 Starting next segment immediately...");
        this.startNextSegment();
      } else if (this.currentSegment >= 10) {
        console.log("🏁 All segments complete");
        this.stopRecording();
      }
    };

    // Start recording
    this.mediaRecorder.start();

    // Stop after 30 seconds
    this.segmentTimer = setTimeout(() => {
      if (this.mediaRecorder?.state === "recording") {
        console.log(`⏸️ Stopping segment ${this.currentSegment} after 30s`);
        this.mediaRecorder.stop();
      }
    }, 30 * 1000); // 30 seconds
  }

  stopRecording(): void {
    console.log("🛑 Stopping recording manager...");
    this.isActive = false;

    // Clear timers
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.totalTimer) {
      clearTimeout(this.totalTimer);
      this.totalTimer = null;
    }

    // Stop recording
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }

    // Stop stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Callback for session completion
    this.onSessionComplete();
  }

  getCurrentSegment(): number {
    return this.currentSegment;
  }

  isRecording(): boolean {
    return this.isActive && this.mediaRecorder?.state === "recording";
  }
}
