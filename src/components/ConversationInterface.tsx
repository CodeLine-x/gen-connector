"use client";

import { useState, useCallback, useEffect } from "react";
import VoiceRecorder from "./VoiceRecorder";
import ImageGallery from "./ImageGallery";
import { SpeakerRole, identifySpeaker } from "@/lib/speakerIdentification";
import { getInitialPrompts, type RiteOfPassage } from "@/lib/promptTemplates";
import { createClient } from "@/lib/supabase/client";
import { uploadAudio } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

interface ConversationTurn {
  id: string;
  speaker: SpeakerRole;
  transcript: string;
  audioUrl?: string;
}

interface ConversationInterfaceProps {
  riteOfPassage: RiteOfPassage;
  sessionId: string;
  onSessionUpdate?: (sessionData: any) => void;
}

export default function ConversationInterface({
  riteOfPassage,
  sessionId,
  onSessionUpdate,
}: ConversationInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentPrompts, setCurrentPrompts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] =
    useState<SpeakerRole>("young_adult");
  const [showImageGallery, setShowImageGallery] = useState(false);

  const supabase = createClient();

  // Initialize with starter prompts
  useEffect(() => {
    const initialPrompts = getInitialPrompts(riteOfPassage);
    setCurrentPrompts(initialPrompts);
    // Create or load session
    const initializeSession = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error && error.code === "PGRST116") {
        // No session found, create a new one
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
          // Determine last speaker and generate prompts if needed
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
      }
    };
    initializeSession();
  }, [riteOfPassage, sessionId, supabase, onSessionUpdate]);

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
          setCurrentPrompts(data.prompts);
        } else {
          console.error("Failed to generate prompts:", data.error);
        }
      } catch (error) {
        console.error("Error calling generate-prompt API:", error);
      } finally {
        setIsGeneratingPrompts(false);
      }
    },
    [riteOfPassage]
  );

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);
      try {
        // 1. Upload audio to Supabase Storage
        const audioFileName = `${sessionId}/${uuidv4()}.webm`;
        const audioUrl = await uploadAudio(audioBlob, audioFileName);

        // 2. Transcribe audio
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const transcribeData = await transcribeResponse.json();

        if (transcribeResponse.ok) {
          const transcript = transcribeData.transcript;
          const speaker = identifySpeaker(
            conversation.length > 0
              ? conversation[conversation.length - 1].speaker
              : null,
            transcript
          );

          const newTurn: ConversationTurn = {
            id: uuidv4(),
            speaker,
            transcript,
            audioUrl,
          };

          setConversation((prev) => [...prev, newTurn]);

          // 3. Save turn to Supabase
          const { error: insertError } = await supabase
            .from("conversations")
            .insert({
              id: newTurn.id,
              session_id: sessionId,
              speaker_role: newTurn.speaker,
              transcript: newTurn.transcript,
              audio_url: newTurn.audioUrl,
            });

          if (insertError) {
            console.error("Error saving conversation turn:", insertError);
          }

          // Switch speaker for next turn
          setCurrentSpeaker((prev) =>
            prev === "elderly" ? "young_adult" : "elderly"
          );

          // Generate new prompts if elderly just spoke
          if (currentSpeaker === "elderly") {
            await generateNewPrompts([...conversation, newTurn]);
            // Show image gallery when elderly shares stories
            setShowImageGallery(true);
          }
        } else {
          console.error("Transcription failed:", transcribeData.error);
          alert("Transcription failed. Please try again.");
        }
      } catch (error) {
        console.error("Error processing recording:", error);
        alert("Failed to process recording. Please try again.");
      } finally {
        setIsTranscribing(false);
      }
    },
    [conversation, generateNewPrompts, sessionId, supabase, currentSpeaker]
  );

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

      {/* Conversation Display */}
      <div className="flex-1 overflow-y-auto mb-6 p-2 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg custom-scrollbar">
        {conversation.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 italic">
            Start the conversation by recording your voice.
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
                    // Optionally, you could automatically record this prompt or display it
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

      {/* Voice Recorder */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingStart={() => console.log("Recording started")}
            onRecordingStop={() => console.log("Recording stopped")}
            disabled={isTranscribing}
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center space-x-4 text-sm">
        {isTranscribing && (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <span className="animate-spin mr-2">⚙️</span> Transcribing...
          </div>
        )}
        {isGeneratingPrompts && (
          <div className="flex items-center text-purple-600 dark:text-purple-400">
            <span className="animate-pulse mr-2">✨</span> Generating Prompts...
          </div>
        )}
      </div>
    </div>
  );
}
