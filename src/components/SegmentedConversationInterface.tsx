"use client";

import { useState, useCallback, useRef } from "react";
import SpeakerAwareVoiceRecorder from "./SpeakerAwareVoiceRecorder";
import ImageGallery from "./ImageGallery";
import { getInitialPrompts, type RiteOfPassage } from "@/lib/promptTemplates";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface ConversationTurn {
  speaker: "elderly" | "young_adult";
  transcript: string;
  timestamp: number;
  confidence: number;
}

interface ConversationSegment {
  id: string;
  turns: ConversationTurn[];
  audioUrl?: string;
  startTime: number;
  endTime: number;
}

interface SegmentedConversationInterfaceProps {
  riteOfPassage: RiteOfPassage;
  sessionId: string;
  onSessionUpdate?: (sessionData: any) => void;
}

export default function SegmentedConversationInterface({
  riteOfPassage,
  sessionId,
  onSessionUpdate,
}: SegmentedConversationInterfaceProps) {
  const [segments, setSegments] = useState<ConversationSegment[]>([]);
  const [currentSegment, setCurrentSegment] =
    useState<ConversationSegment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPrompts, setCurrentPrompts] = useState<string[]>(
    getInitialPrompts(riteOfPassage)
  );
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const supabase = createClient();
  const recorderRef = useRef<any>(null);

  // Check authentication
  useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No authenticated user found");
        setIsCheckingAuth(false);
        return;
      }

      console.log("User authenticated:", user.id);
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsCheckingAuth(false);
    }
  }, [supabase])();

  const startNewSegment = useCallback(() => {
    const newSegment: ConversationSegment = {
      id: uuidv4(),
      turns: [],
      startTime: Date.now(),
      endTime: 0,
    };
    setCurrentSegment(newSegment);
    setIsRecording(true);
  }, []);

  const handleSegmentComplete = useCallback(
    async (conversationTurns: ConversationTurn[]) => {
      if (!currentSegment) return;

      setIsProcessing(true);
      setIsRecording(false);

      try {
        // Update current segment with turns
        const completedSegment: ConversationSegment = {
          ...currentSegment,
          turns: conversationTurns,
          endTime: Date.now(),
        };

        // Save segment to database
        if (isAuthenticated) {
          const { error: insertError } = await supabase
            .from("conversations")
            .insert(
              conversationTurns.map((turn) => ({
                id: uuidv4(),
                session_id: sessionId,
                speaker: turn.speaker,
                transcript: turn.transcript,
                audio_url: null,
                created_at: new Date().toISOString(),
              }))
            );

          if (insertError) {
            console.error("Error saving segment to database:", insertError);
          } else {
            console.log("✅ Segment saved to database");
          }
        }

        // Add to segments list
        setSegments((prev) => [...prev, completedSegment]);
        setCurrentSegment(null);

        // Generate new prompts based on all conversation history
        await generateNewPrompts([
          ...segments.flatMap((s) => s.turns),
          ...conversationTurns,
        ]);

        // Show image gallery if elderly spoke
        const elderlyTurns = conversationTurns.filter(
          (t) => t.speaker === "elderly"
        );
        if (elderlyTurns.length > 0) {
          setShowImageGallery(true);
        }

        console.log(
          `✅ Segment ${completedSegment.id} completed with ${conversationTurns.length} turns`
        );
      } catch (error) {
        console.error("Error processing segment:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentSegment, segments, sessionId, supabase, isAuthenticated]
  );

  const generateNewPrompts = useCallback(
    async (allTurns: ConversationTurn[]) => {
      try {
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
        if (response.ok) {
          setCurrentPrompts(data.questions || []);
        } else {
          console.error("Failed to generate prompts:", data.error);
        }
      } catch (error) {
        console.error("Error calling generate-prompt API:", error);
      }
    },
    [riteOfPassage]
  );

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
      // Combine all segments
      const allTurns = segments.flatMap((s) => s.turns);
      const elderlyTranscripts = allTurns
        .filter((t) => t.speaker === "elderly")
        .map((t) => t.transcript)
        .join(" ");

      // Generate video (placeholder for now)
      console.log("🎬 Generating video with all segments...");
      console.log("Total segments:", segments.length);
      console.log("Total turns:", allTurns.length);
      console.log("Elderly content:", elderlyTranscripts);

      // TODO: Implement actual video generation
      alert(
        `Session ended successfully!\n\n${segments.length} segments processed.\nVideo generation will be implemented next.`
      );

      // Update session in database
      if (isAuthenticated) {
        const { error: updateError } = await supabase
          .from("sessions")
          .update({
            summary: `Session completed with ${segments.length} segments and ${allTurns.length} total turns`,
            video_url: null, // Will be updated after video generation
          })
          .eq("id", sessionId);

        if (updateError) {
          console.error("Error updating session:", updateError);
        }
      }
    } catch (error) {
      console.error("Error ending session:", error);
      alert("Error ending session. Please try again.");
    }
  }, [segments, sessionId, supabase, isAuthenticated]);

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
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}{" "}
        Journey
      </h1>

      {/* Session Stats */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>📊 Segments: {segments.length}</span>
          <span>
            💬 Total Turns:{" "}
            {segments.reduce((sum, s) => sum + s.turns.length, 0)}
          </span>
          <span>
            👵 Elderly:{" "}
            {segments.reduce(
              (sum, s) => s.turns.filter((t) => t.speaker === "elderly").length,
              0
            )}
          </span>
          <span>
            👦 Young Adult:{" "}
            {segments.reduce(
              (sum, s) =>
                s.turns.filter((t) => t.speaker === "young_adult").length,
              0
            )}
          </span>
        </div>
      </div>

      {/* Segments List */}
      {segments.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Recorded Segments:
          </h3>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Segment {index + 1}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {segment.turns.length} turns •{" "}
                    {Math.floor((segment.endTime - segment.startTime) / 1000)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {!isRecording && !isProcessing && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggested Questions:
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

      {/* Recording Interface */}
      <div className="flex-1 flex flex-col justify-center items-center mb-6">
        {!isRecording && !isProcessing ? (
          <button
            onClick={startNewSegment}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200 text-lg"
          >
            🎤 Start New Segment
          </button>
        ) : isProcessing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Processing segment...
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <SpeakerAwareVoiceRecorder
              ref={recorderRef}
              onConversationComplete={handleSegmentComplete}
              onRecordingStart={() => console.log("Recording started")}
              onRecordingStop={() => console.log("Recording stopped")}
              disabled={false}
            />
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {showImageGallery && segments.length > 0 && (
        <ImageGallery
          conversationText={segments
            .flatMap((s) => s.turns)
            .filter((turn) => turn.speaker === "elderly")
            .map((turn) => turn.transcript)
            .join(" ")}
          sessionId={sessionId}
        />
      )}

      {/* End Session Button */}
      {segments.length > 0 && !isRecording && !isProcessing && (
        <div className="flex justify-center mt-6">
          <button
            onClick={endSessionAndGenerateVideo}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            🎬 End Session & Generate Video
          </button>
        </div>
      )}
    </div>
  );
}
