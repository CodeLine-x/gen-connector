"use client";

import { useState, useCallback, useEffect } from "react";
import SpeakerAwareVoiceRecorder from "./SpeakerAwareVoiceRecorder";
import ImageGallery from "./ImageGallery";
import { getInitialPrompts, type RiteOfPassage } from "@/lib/promptTemplates";
import { createClient } from "@/lib/supabase/client";
import { conversationSessionManager } from "@/lib/conversationSession";
import { v4 as uuidv4 } from "uuid";

interface ConversationTurn {
  speaker: "elderly" | "young_adult";
  transcript: string;
  timestamp: number;
  confidence: number;
}

interface DiarizedConversationInterfaceProps {
  riteOfPassage: RiteOfPassage;
  sessionId: string;
  onSessionUpdate?: (sessionData: any) => void;
}

export default function DiarizedConversationInterface({
  riteOfPassage,
  sessionId,
  onSessionUpdate,
}: DiarizedConversationInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentPrompts, setCurrentPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    turnCount: 0,
    elderlyTurns: 0,
    youngAdultTurns: 0,
    totalDuration: 0,
    isActive: false,
  });

  const supabase = createClient();

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log(
            "No authenticated user found in DiarizedConversationInterface"
          );
          setIsCheckingAuth(false);
          return;
        }

        console.log(
          "User authenticated in DiarizedConversationInterface:",
          user.id
        );
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error(
          "Auth check error in DiarizedConversationInterface:",
          error
        );
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // Initialize session
  useEffect(() => {
    if (!isAuthenticated || isCheckingAuth) return;

    const initialPrompts = getInitialPrompts(riteOfPassage);
    setCurrentPrompts(initialPrompts);

    // Clear any existing session and start a fresh one
    conversationSessionManager.clearSession();
    setConversation([]);
    setShowImageGallery(false);
    const newSessionId = conversationSessionManager.startSession();
    console.log("Started fresh diarized conversation session:", newSessionId);
  }, [riteOfPassage, isAuthenticated, isCheckingAuth]);

  // Update session stats
  useEffect(() => {
    const updateStats = () => {
      const stats = conversationSessionManager.getSessionStats();
      setSessionStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [conversation]);

  const generateNewPrompts = useCallback(
    async (currentConversation: ConversationTurn[]) => {
      setIsGeneratingPrompts(true);
      try {
        const response = await fetch("/api/generate-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationHistory: currentConversation.map((turn) => ({
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
          setCurrentPrompts([
            "Can you tell me more about that?",
            "What was that experience like for you?",
            "How did that make you feel?",
          ]);
        }
      } catch (error) {
        console.error("Error calling generate-prompt API:", error);
        setCurrentPrompts([
          "Can you tell me more about that?",
          "What was that experience like for you?",
          "How did that make you feel?",
        ]);
      } finally {
        setIsGeneratingPrompts(false);
      }
    },
    [riteOfPassage]
  );

  const handleConversationComplete = useCallback(
    async (conversationTurns: ConversationTurn[]) => {
      try {
        console.log("Received diarized conversation:", conversationTurns);

        // Add all turns to the conversation
        setConversation(conversationTurns);

        // Add turns to session manager
        conversationTurns.forEach((turn) => {
          conversationSessionManager.addTurn(turn.speaker, turn.transcript);
        });

        // Save to database if not in offline mode
        if (!offlineMode) {
          try {
            const { error: insertError } = await supabase
              .from("conversations")
              .insert(
                conversationTurns.map((turn) => ({
                  id: uuidv4(),
                  session_id: sessionId,
                  speaker: turn.speaker,
                  transcript: turn.transcript,
                  audio_url: null,
                }))
              );

            if (insertError) {
              console.warn(
                "Warning: Could not save conversation turns to database:",
                insertError
              );
              setOfflineMode(true);
            } else {
              console.log("Successfully saved conversation turns to database");
            }
          } catch (dbError) {
            console.warn("Database error (continuing conversation):", dbError);
            setOfflineMode(true);
          }
        }

        // Generate prompts based on elderly responses
        const elderlyTurns = conversationTurns.filter(
          (turn) => turn.speaker === "elderly"
        );
        if (elderlyTurns.length > 0) {
          await generateNewPrompts(conversationTurns);
          setShowImageGallery(true);
        }

        console.log("Conversation processing completed successfully");
      } catch (error) {
        console.error("Error processing diarized conversation:", error);
        alert(
          "There was an issue processing the conversation. Please try again."
        );
      }
    },
    [sessionId, supabase, offlineMode, generateNewPrompts]
  );

  const endConversation = useCallback(async () => {
    try {
      // End the session and upload all audio
      const sessionData = await conversationSessionManager.endSession();

      // Try to update session with audio URLs, but don't fail if it doesn't work
      if (!offlineMode) {
        try {
          const { error: updateError } = await supabase
            .from("sessions")
            .update({
              summary: `Diarized conversation completed with ${sessionData.turns.length} turns`,
              video_url: sessionData.audioUrls[0] || null,
            })
            .eq("id", sessionId);

          if (updateError) {
            console.warn(
              "Warning: Could not update session in database:",
              updateError
            );
          } else {
            console.log("Successfully updated session in database");
          }
        } catch (dbError) {
          console.warn("Database error when updating session:", dbError);
        }
      }

      console.log("Diarized conversation ended:", sessionData);

      // Show success message with session info
      const duration = Math.floor(sessionData.totalDuration / 1000);
      const storageMode = offlineMode ? "Local Storage" : "Database";
      alert(
        `Diarized conversation saved successfully!\n\nSession Stats:\n- ${
          sessionData.turns.length
        } turns\n- ${duration} seconds\n- Audio: ${
          sessionData.audioUrls.length > 0 ? "Uploaded" : "Not uploaded"
        }\n- Storage: ${storageMode}\n- Speaker Analysis: Completed`
      );
    } catch (error) {
      console.error("Error ending diarized conversation:", error);
      alert(
        "Error saving conversation. The conversation data is still available locally, but may not be saved to the database."
      );
    }
  }, [sessionId, supabase, offlineMode]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading diarized conversation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to start a diarized conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show database error if present (but allow offline mode)
  if (dbError && !offlineMode) {
    return (
      <div className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Database Setup Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{dbError}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setOfflineMode(true);
                  setDbError(null);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Continue in Offline Mode
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Refresh Page
              </button>
            </div>
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
        Journey (Speaker-Aware)
      </h1>

      {/* Session Stats */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>Turns: {sessionStats.turnCount}</span>
          <span>Elderly: {sessionStats.elderlyTurns}</span>
          <span>Young Adult: {sessionStats.youngAdultTurns}</span>
          <span>
            Duration: {Math.floor(sessionStats.totalDuration / 1000)}s
          </span>
        </div>
        {offlineMode && (
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            ⚠️ Offline mode - conversation will be saved locally
          </div>
        )}
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          🎯 Speaker diarization enabled - automatically identifies speakers
        </div>
      </div>

      {/* Conversation Display */}
      <div className="flex-1 overflow-y-auto mb-6 p-2 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg custom-scrollbar">
        {conversation.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 italic">
            Start the conversation by clicking "Start Recording". Both speakers
            can talk naturally.
          </p>
        )}

        {conversation.map((turn, index) => (
          <div
            key={index}
            className={`mb-3 p-3 rounded-lg max-w-[80%] ${
              turn.speaker === "young_adult"
                ? "ml-auto bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : "mr-auto bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            }`}
          >
            <p className="font-semibold text-sm mb-1">
              {turn.speaker === "young_adult" ? "Young Adult" : "Elderly"}:
              <span className="text-xs text-gray-500 ml-2">
                (Confidence: {Math.round(turn.confidence * 100)}%)
              </span>
            </p>
            <p className="text-base">{turn.transcript}</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor(turn.timestamp)}s
            </p>
          </div>
        ))}
      </div>

      {/* Prompts Section */}
      {conversation.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggested Follow-up Questions:
          </h3>
          {isGeneratingPrompts ? (
            <p className="text-gray-600 dark:text-gray-400 italic">
              Generating new prompts...
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-left p-3 rounded-lg transition-colors duration-200 text-sm"
                  onClick={() => {
                    console.log("Selected prompt:", prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Gallery */}
      {showImageGallery && conversation.length > 0 && (
        <ImageGallery
          conversationText={conversation
            .filter((turn) => turn.speaker === "elderly")
            .map((turn) => turn.transcript)
            .join(" ")}
          sessionId={sessionId}
        />
      )}

      {/* Speaker-Aware Voice Recorder */}
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-md">
          <SpeakerAwareVoiceRecorder
            onConversationComplete={handleConversationComplete}
            onRecordingStart={() => console.log("Recording started")}
            onRecordingStop={() => console.log("Recording stopped")}
            disabled={isGeneratingPrompts}
          />
        </div>
      </div>

      {/* End Conversation Button */}
      {conversation.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={endConversation}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            End Conversation & Save
          </button>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex justify-center space-x-4 text-sm">
        {isGeneratingPrompts && (
          <div className="flex items-center text-purple-600 dark:text-purple-400">
            <span className="animate-pulse mr-2">✨</span> Generating Prompts...
          </div>
        )}
      </div>
    </div>
  );
}
