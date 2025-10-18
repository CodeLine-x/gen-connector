"use client";

import { useState, useCallback, useEffect } from "react";
import RealTimeVoiceRecorder from "./RealTimeVoiceRecorder";
import ImageGallery from "./ImageGallery";
import { SpeakerRole, identifySpeaker } from "@/lib/speakerIdentification";
import { getInitialPrompts, type RiteOfPassage } from "@/lib/promptTemplates";
import { createClient } from "@/lib/supabase/client";
import {
  conversationSessionManager,
  type ConversationTurn,
} from "@/lib/conversationSession";
import { v4 as uuidv4 } from "uuid";

interface SessionData {
  id: string;
  user_id: string;
  rite_of_passage: string;
  created_at: string;
  status: string;
  title?: string;
  summary?: string;
}

interface EnhancedConversationInterfaceProps {
  riteOfPassage: RiteOfPassage;
  sessionId: string;
  onSessionUpdate?: (sessionData: SessionData) => void;
}

export default function EnhancedConversationInterface({
  riteOfPassage,
  sessionId,
  onSessionUpdate,
}: EnhancedConversationInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentPrompts, setCurrentPrompts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] =
    useState<SpeakerRole>("young_adult");
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [sessionStats, setSessionStats] = useState({
    turnCount: 0,
    elderlyTurns: 0,
    youngAdultTurns: 0,
    totalDuration: 0,
    isActive: false,
  });

  const supabase = createClient();

  // Save conversation turn to local storage as backup
  const saveToLocalStorage = useCallback(
    (turn: ConversationTurn) => {
      try {
        const key = `conversation-${sessionId}`;
        const existingData = localStorage.getItem(key);
        const turns = existingData ? JSON.parse(existingData) : [];
        turns.push(turn);
        localStorage.setItem(key, JSON.stringify(turns));
        console.log("Saved conversation turn to local storage");
      } catch (error) {
        console.error("Error saving to local storage:", error);
      }
    },
    [sessionId]
  );

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log(
            "No authenticated user found in EnhancedConversationInterface"
          );
          setIsCheckingAuth(false);
          return;
        }

        console.log(
          "User authenticated in EnhancedConversationInterface:",
          user.id
        );
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error(
          "Auth check error in EnhancedConversationInterface:",
          error
        );
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // Initialize session and load existing data
  useEffect(() => {
    if (!isAuthenticated || isCheckingAuth) return;

    const initialPrompts = getInitialPrompts(riteOfPassage);
    setCurrentPrompts(initialPrompts);

    // Clear any existing session and start a fresh one
    conversationSessionManager.clearSession();
    setConversation([]); // Clear any existing conversation
    setCurrentSpeaker("young_adult"); // Reset to young adult starting
    setShowImageGallery(false); // Reset image gallery
    const newSessionId = conversationSessionManager.startSession();
    console.log("Started fresh conversation session:", newSessionId);

    // Load existing session data
    const initializeSession = async () => {
      console.log("Initializing session for:", sessionId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found in session initialization");
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error && error.code === "PGRST116") {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from("sessions")
          .insert({
            id: sessionId,
            user_id: user.id,
            rite_of_passage: riteOfPassage,
          })
          .select()
          .single();
        if (createError) {
          console.error("Error creating session:", createError);
        } else {
          onSessionUpdate?.(newSession);
        }
      } else if (data) {
        onSessionUpdate?.(data);
        // Load existing conversation turns
        const { data: turns, error: turnsError } = await supabase
          .from("conversations")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });
        if (turnsError) {
          console.error("Error loading conversation turns:", turnsError);
        } else {
          setConversation(turns as ConversationTurn[]);
          if (turns && turns.length > 0) {
            const lastTurn = turns[turns.length - 1];
            setCurrentSpeaker(
              lastTurn.speaker === "elderly" ? "young_adult" : "elderly"
            );
            if (lastTurn.speaker === "elderly") {
              await generateNewPrompts(turns as ConversationTurn[]);
              setShowImageGallery(true);
            }
          }
        }
      } else if (error) {
        console.error("Error fetching session:", error);
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist")
        ) {
          setDbError(
            "Database tables not set up. Please run database-schema.sql in Supabase SQL Editor."
          );
        } else {
          setDbError(`Database error: ${error.message || "Unknown error"}`);
          setOfflineMode(true);
        }
      }
    };
    initializeSession();
  }, [
    riteOfPassage,
    sessionId,
    supabase,
    onSessionUpdate,
    isAuthenticated,
    isCheckingAuth,
  ]);

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
          // Use fallback questions if API fails
          setCurrentPrompts([
            "Can you tell me more about that?",
            "What was that experience like for you?",
            "How did that make you feel?",
          ]);
        }
      } catch (error) {
        console.error("Error calling generate-prompt API:", error);
        // Use fallback questions if API call fails completely
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

  const handleTranscriptUpdate = useCallback(
    async (transcript: string, isFinal: boolean) => {
      setLiveTranscript(transcript);

      if (isFinal && transcript.trim()) {
        setIsTranscribing(true);

        try {
          const speaker = identifySpeaker(
            conversation.length > 0
              ? conversation[conversation.length - 1].speaker
              : null,
            transcript
          );

          // Add turn to session manager (without uploading audio yet)
          const newTurn = conversationSessionManager.addTurn(
            speaker,
            transcript
          );

          setConversation((prev) => [...prev, newTurn]);

          // Try to save turn to Supabase, but don't fail if it doesn't work
          if (!offlineMode) {
            try {
              const { error: insertError } = await supabase
                .from("conversations")
                .insert({
                  id: newTurn.id,
                  session_id: sessionId,
                  speaker: newTurn.speaker,
                  transcript: newTurn.transcript,
                  audio_url: null, // Will be uploaded at the end
                });

              if (insertError) {
                console.warn(
                  "Warning: Could not save conversation turn to database:",
                  insertError
                );
                setOfflineMode(true);
                // Save to local storage as backup
                saveToLocalStorage(newTurn);
              } else {
                console.log("Successfully saved conversation turn to database");
              }
            } catch (dbError) {
              console.warn(
                "Database error (continuing conversation):",
                dbError
              );
              setOfflineMode(true);
              // Save to local storage as backup
              saveToLocalStorage(newTurn);
            }
          } else {
            // Already in offline mode, save to local storage
            saveToLocalStorage(newTurn);
          }

          // Switch speaker for next turn
          setCurrentSpeaker((prev) =>
            prev === "elderly" ? "young_adult" : "elderly"
          );

          // Generate new prompts if elderly just spoke
          if (speaker === "elderly") {
            await generateNewPrompts([...conversation, newTurn]);
            setShowImageGallery(true);
          }
        } catch (error) {
          console.error("Error processing transcript:", error);
          // Show user-friendly error message
          alert("There was an issue processing your speech. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      }
    },
    [conversation, sessionId, supabase, generateNewPrompts]
  );

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    console.log("Recording started");
  }, []);

  const handleRecordingStop = useCallback(() => {
    setIsRecording(false);
    console.log("Recording stopped");
  }, []);

  const endConversation = useCallback(async () => {
    try {
      // End the session and upload all audio
      const sessionData = await conversationSessionManager.endSession();

      // Try to update session with audio URLs, but don't fail if it doesn't work
      try {
        const { error: updateError } = await supabase
          .from("sessions")
          .update({
            summary: `Conversation completed with ${sessionData.turns.length} turns`,
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

      console.log("Conversation ended:", sessionData);

      // Show success message with session info
      const duration = Math.floor(sessionData.totalDuration / 1000);
      const storageMode = offlineMode ? "Local Storage" : "Database";
      alert(
        `Conversation saved successfully!\n\nSession Stats:\n- ${
          sessionData.turns.length
        } turns\n- ${duration} seconds\n- Audio: ${
          sessionData.audioUrls.length > 0 ? "Uploaded" : "Not uploaded"
        }\n- Storage: ${storageMode}`
      );
    } catch (error) {
      console.error("Error ending conversation:", error);
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
              Loading conversation...
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
              Please log in to start a conversation.
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
        Journey
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
      </div>

      {/* Conversation Display */}
      <div className="flex-1 overflow-y-auto mb-6 p-2 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg custom-scrollbar">
        {conversation.length === 0 && !liveTranscript && (
          <p className="text-center text-gray-500 dark:text-gray-400 italic">
            Start the conversation by clicking "Start Recording".
          </p>
        )}

        {conversation.map((turn) => (
          <div
            key={turn.id}
            className={`mb-3 p-3 rounded-lg max-w-[80%] ${
              turn.speaker === "young_adult"
                ? "ml-auto bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : "mr-auto bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            }`}
          >
            <p className="font-semibold text-sm mb-1">
              {turn.speaker === "young_adult"
                ? "You (Grandchild)"
                : "Elderly (Grandparent)"}
              :
            </p>
            <p className="text-base">{turn.transcript}</p>
          </div>
        ))}

        {/* Live transcript display */}
        {liveTranscript && (
          <div
            className={`mb-3 p-3 rounded-lg max-w-[80%] ${
              currentSpeaker === "young_adult"
                ? "ml-auto bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : "mr-auto bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            } opacity-70`}
          >
            <p className="font-semibold text-sm mb-1">
              {currentSpeaker === "young_adult"
                ? "You (Grandchild)"
                : "Elderly (Grandparent)"}
              :
            </p>
            <p className="text-base">{liveTranscript}</p>
            <p className="text-xs italic mt-1">Speaking...</p>
          </div>
        )}
      </div>

      {/* Prompts Section */}
      {currentSpeaker === "young_adult" && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggested Questions for Grandchild:
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

      {/* Real-time Voice Recorder */}
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-md">
          <RealTimeVoiceRecorder
            onTranscriptUpdate={handleTranscriptUpdate}
            onRecordingStart={handleRecordingStart}
            onRecordingStop={handleRecordingStop}
            disabled={isTranscribing}
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
        {isTranscribing && (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <span className="animate-spin mr-2">⚙️</span> Processing...
          </div>
        )}
        {isGeneratingPrompts && (
          <div className="flex items-center text-purple-600 dark:text-purple-400">
            <span className="animate-pulse mr-2">✨</span> Generating Prompts...
          </div>
        )}
        {isRecording && (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <span className="animate-pulse mr-2">🎤</span> Recording...
          </div>
        )}
      </div>
    </div>
  );
}
