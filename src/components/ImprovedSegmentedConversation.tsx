"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getInitialPrompts, type RiteOfPassage } from "@/lib/promptTemplates";
import { createClient } from "@/lib/supabase/client";
import { SegmentManager } from "@/lib/segmentManager";
import { uploadAudio } from "@/lib/storage";
import type { Segment, Turn } from "@/types/database-v2";

interface UISegment extends Segment {
  turns: Turn[];
  isProcessing: boolean;
}

interface ImprovedSegmentedConversationProps {
  riteOfPassage: RiteOfPassage;
  sessionId: string;
}

export default function ImprovedSegmentedConversation({
  riteOfPassage,
  sessionId,
}: ImprovedSegmentedConversationProps) {
  const [segments, setSegments] = useState<UISegment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPrompts, setCurrentPrompts] = useState<string[]>(
    getInitialPrompts(riteOfPassage)
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  const MAX_RECORDING_TIME = 300; // 5 minutes in seconds

  const supabase = createClient();
  const segmentManagerRef = useRef<SegmentManager | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No authenticated user");
          setIsCheckingAuth(false);
          return;
        }

        setIsAuthenticated(true);

        // Initialize session in database
        const { error: sessionError } = await supabase.from("sessions").upsert({
          id: sessionId,
          user_id: user.id,
          rite_of_passage: riteOfPassage.replace(/-/g, "_") as
            | "birth_and_childhood"
            | "coming_of_age"
            | "marriage"
            | "death",
          status: "active",
        });

        if (sessionError) {
          console.error("Error creating session:", sessionError);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [supabase, sessionId, riteOfPassage]);

  // Process segment (30-second snapshot)
  const processSegment = useCallback(
    async (audioBlob: Blob, actualDuration: number) => {
      if (!segmentManagerRef.current) return;

      try {
        console.log(`📦 Processing segment (${actualDuration.toFixed(1)}s)...`);

        // Create segment in database
        const segment = await segmentManagerRef.current.createSegment(
          audioBlob,
          actualDuration
        );

        // Add to UI with processing state
        const uiSegment: UISegment = {
          ...segment,
          turns: [],
          isProcessing: true,
        };
        setSegments((prev) => [...prev, uiSegment]);

        // Update segment status
        await segmentManagerRef.current.updateSegmentTranscriptionStatus(
          segment.id,
          "processing"
        );

        // Upload audio in background
        const audioUrl = await uploadAudio(
          audioBlob,
          `sessions/${sessionId}/segment-${segment.segment_number}.webm`
        );
        await segmentManagerRef.current.updateSegmentAudioUrl(
          segment.id,
          audioUrl
        );

        // Diarize audio via API route (ElevenLabs key is server-side only)
        const diarizeFormData = new FormData();
        diarizeFormData.append("audio", audioBlob, "segment.webm");

        const diarizeResponse = await fetch("/api/diarize-speakers", {
          method: "POST",
          body: diarizeFormData,
        });

        if (!diarizeResponse.ok) {
          const errorData = await diarizeResponse.json();
          throw new Error(errorData.details || "Diarization failed");
        }

        const diarizeData = await diarizeResponse.json();
        const conversationTurns = diarizeData.conversationTurns || [];

        // Save turns to database
        const turns = await segmentManagerRef.current.saveTurns(
          segment.id,
          conversationTurns.map((turn) => ({
            speaker: turn.speaker,
            transcript: turn.transcript,
            startTime: turn.timestamp,
            endTime: turn.timestamp + 1, // Estimate
            confidence: turn.confidence,
            speakerId: turn.speaker === "elderly" ? "speaker_0" : "speaker_1",
          }))
        );

        // Update UI with turns
        setSegments((prev) =>
          prev.map((seg) =>
            seg.id === segment.id ? { ...seg, turns, isProcessing: false } : seg
          )
        );

        // Update segment status
        await segmentManagerRef.current.updateSegmentTranscriptionStatus(
          segment.id,
          "completed"
        );

        // Extract elderly responses
        const elderlyResponses =
          segmentManagerRef.current.extractElderlyResponses(turns);

        // Determine AI action
        if (elderlyResponses.length > 0) {
          await segmentManagerRef.current.determineAndCreateAction(
            segment.id,
            elderlyResponses
          );
        }

        // Generate new prompts
        await generateNewPrompts();

        console.log(
          `✅ Segment ${segment.segment_number} processed successfully`
        );
      } catch (error) {
        console.error("Error processing segment:", error);
      }
    },
    [sessionId, generateNewPrompts]
  );

  // Take 30-second snapshot
  const takeSnapshot = useCallback(() => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "recording"
    ) {
      return;
    }

    console.log("📸 Taking 30-second snapshot...");

    // Stop current recorder to get the data
    mediaRecorderRef.current.stop();

    // The onstop handler will process the segment and restart recording
  }, []);

  // Start recording with 30-second auto-snapshots
  const startRecording = useCallback(async () => {
    try {
      // Initialize segment manager
      segmentManagerRef.current = new SegmentManager(sessionId);
      await segmentManagerRef.current.startRecording();

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      recordingStartTimeRef.current = Date.now();
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      const startNewRecorder = () => {
        if (!streamRef.current) return;

        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: "audio/webm; codecs=opus",
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm; codecs=opus",
          });

          const actualDuration =
            (Date.now() - recordingStartTimeRef.current) / 1000;

          // Process this segment
          await processSegment(audioBlob, actualDuration);

          // Reset for next segment
          audioChunksRef.current = [];
          recordingStartTimeRef.current = Date.now();

          // Check if we should continue recording (use ref to avoid stale closure)
          if (
            isRecordingRef.current &&
            segmentManagerRef.current &&
            !segmentManagerRef.current.hasReachedMaxSegments()
          ) {
            console.log("🔄 Starting next segment recorder...");
            // Start new recorder for next segment
            startNewRecorder();
          } else {
            console.log("⏹️ Stopping recording completely");
            // Stop completely
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        console.log(`🎬 MediaRecorder started`);
      };

      // Start first recorder
      startNewRecorder();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer for UI with auto-stop at 5 minutes
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;

          // Auto-stop at 5 minutes (300 seconds)
          if (newTime >= MAX_RECORDING_TIME) {
            console.log("⏰ Max recording time reached (5 minutes)");
            stopRecording();
            setShowCompletionPopup(true);
          }

          return newTime;
        });
      }, 1000);

      // Start 30-second snapshot timer
      snapshotIntervalRef.current = setInterval(() => {
        takeSnapshot();
      }, 30000); // 30 seconds

      console.log("🎙️ Recording started with 30-second auto-snapshots");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Please allow microphone access to record.");
    }
  }, [sessionId, processSegment, takeSnapshot, stopRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      // Set ref to false to prevent new recorder from starting
      isRecordingRef.current = false;

      // Clear intervals
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }

      // Stop recorder (will trigger onstop which processes the final segment)
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);

      console.log("⏹️ Recording stopped by user");
    }
  }, []);

  // Generate new prompts
  const generateNewPrompts = useCallback(async () => {
    try {
      const allTurns = segments.flatMap((seg) => seg.turns);

      if (allTurns.length === 0) return;

      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationHistory: allTurns.map((turn) => ({
            speaker: turn.speaker,
            transcript: turn.transcript,
          })),
          riteOfPassage: riteOfPassage,
        }),
      });

      const data = await response.json();
      if (response.ok && data.questions) {
        setCurrentPrompts(data.questions);
      }
    } catch (error) {
      console.error("Error generating prompts:", error);
    }
  }, [segments, riteOfPassage]);

  // End session and generate video
  const endSessionAndGenerateVideo = useCallback(async () => {
    if (segments.length === 0) {
      alert("No segments to process. Please record at least one segment.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to end this session and generate a video?\n\nYou have ${
        segments.length
      } segment(s) with ${segments.reduce(
        (sum, s) => sum + s.turns.length,
        0
      )} total conversations.`
    );

    if (!confirmed) return;

    try {
      if (segmentManagerRef.current) {
        await segmentManagerRef.current.finalizeSession();
      }

      alert(
        `Session ended successfully!\n\n${segments.length} segments processed.\nVideo generation will be implemented next.`
      );
    } catch (error) {
      console.error("Error ending session:", error);
      alert("Error ending session. Please try again.");
    }
  }, [segments]);

  // Calculate stats
  const totalTurns = segments.reduce((sum, s) => sum + s.turns.length, 0);
  const elderlyTurns = segments.reduce(
    (sum, s) => sum + s.turns.filter((t) => t.speaker === "elderly").length,
    0
  );
  const youngAdultTurns = segments.reduce(
    (sum, s) => sum + s.turns.filter((t) => t.speaker === "young_adult").length,
    0
  );

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to start a conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
        {riteOfPassage
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}{" "}
        Journey
      </h1>

      {/* Session Stats */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex justify-between text-sm flex-wrap gap-2">
          <span>📊 Segments: {segments.length}/10</span>
          <span>💬 Total Turns: {totalTurns}</span>
          <span>👵 Elderly: {elderlyTurns}</span>
          <span>👦 Young Adult: {youngAdultTurns}</span>
          {isRecording && (
            <span className="font-semibold text-red-600">
              ⏱️ {Math.floor(recordingTime / 60)}:
              {(recordingTime % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {/* Auto-Snapshot Info */}
      {isRecording && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            🔄 <strong>Auto-snapshot active</strong> - Recording will
            automatically save every 30 seconds
          </p>
        </div>
      )}

      {/* Segments List */}
      {segments.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Recorded Segments:
          </h3>
          <div className="space-y-4">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Segment {segment.segment_number}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {segment.turns.length} turns •{" "}
                    {segment.duration_seconds.toFixed(1)}s
                  </span>
                </div>
                {segment.isProcessing ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      Analyzing conversation...
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {segment.turns.map((turn) => (
                      <div
                        key={turn.id}
                        className={`text-sm ${
                          turn.speaker === "young_adult"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        <span className="font-semibold">
                          {turn.speaker === "young_adult"
                            ? "Grandchild"
                            : "Grandparent"}
                          :
                        </span>{" "}
                        {turn.transcript}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {!isRecording && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggested Follow-up Questions:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentPrompts.map((prompt, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-left p-3 rounded-lg text-sm"
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar (shown during recording) */}
      {isRecording && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500 dark:border-blue-400">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recording Progress
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {Math.floor(recordingTime / 60)}:
              {(recordingTime % 60).toString().padStart(2, "0")} / 5:00
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Filled Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-linear"
              style={{
                width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%`,
              }}
            />

            {/* 30-second checkpoint markers */}
            {[30, 60, 90, 120, 150, 180, 210, 240, 270].map((checkpoint) => (
              <div
                key={checkpoint}
                className="absolute top-0 h-full w-0.5 bg-white dark:bg-gray-900"
                style={{ left: `${(checkpoint / MAX_RECORDING_TIME) * 100}%` }}
              >
                <div className="absolute -top-6 -left-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {checkpoint}s
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            <div
              className="absolute top-0 h-full w-1 bg-yellow-400 shadow-lg"
              style={{ left: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
            />
          </div>

          {/* Segment indicators */}
          <div className="mt-3 flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>0s (Start)</span>
            <span>150s (Halfway)</span>
            <span>300s (Max)</span>
          </div>
        </div>
      )}

      {/* Recording Control */}
      <div className="flex justify-center mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={segments.length >= 10}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200 text-lg shadow-lg"
          >
            {segments.length >= 10
              ? "🚫 Max Segments Reached"
              : "🎤 Start Recording"}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200 text-lg shadow-lg animate-pulse"
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      {/* End Session Button */}
      {segments.length > 0 && !isRecording && (
        <div className="flex justify-center mt-6">
          <button
            onClick={endSessionAndGenerateVideo}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            🎬 End Session & Generate Video
          </button>
        </div>
      )}

      {/* Completion Popup Modal */}
      {showCompletionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[fadeIn_0.3s_ease-in-out]">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg
                  className="h-10 w-10 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Recording Completed! 🎉
              </h3>

              {/* Message */}
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your 5-minute conversation has been successfully recorded and
                processed.
              </p>

              {/* Stats */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Segments
                    </div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {segments.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Total Turns
                    </div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {segments.reduce((sum, s) => sum + s.turns.length, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Duration
                    </div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      5:00
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Status
                    </div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      ✓ Done
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowCompletionPopup(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Review Segments
                </button>
                <button
                  onClick={() => {
                    setShowCompletionPopup(false);
                    endSessionAndGenerateVideo();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  🎬 Generate Video Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
