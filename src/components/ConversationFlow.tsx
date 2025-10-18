"use client";

import { useState, useRef, useCallback } from "react";
import StartRecordingScreen from "./conversation-screens/StartRecordingScreen";
import TitleScreen from "./conversation-screens/TitleScreen";
import BeginningScreen from "./conversation-screens/BeginningScreen";
import MessageScreen from "./conversation-screens/MessageScreen";
import MediaCarouselScreen from "./conversation-screens/MediaCarouselScreen";
import VideoScreen from "./conversation-screens/VideoScreen";
import { RiteOfPassage } from "@/lib/promptTemplates";
import { RecordingManager } from "@/lib/recordingManager";
import { createClient } from "@/lib/supabase/client";
import { extractFirstQuestion } from "@/lib/questionExtractor";

// Screen types
type Screen =
  | "start-recording"
  | "title"
  | "beginning"
  | "message"
  | "carousel"
  | "video";

// Media item type
interface MediaItem {
  segmentNumber: number;
  imageUrl?: string;
  audioUrl?: string;
  caption?: string;
  type: "image" | "audio";
}

// Category display titles
const CATEGORY_TITLES: Record<RiteOfPassage, string> = {
  childhood: "Childhood",
  "school-life": "School Life",
  "work-life": "Work Life",
  relationships: "Relationships",
  hobbies: "Hobbies",
  community: "Community",
  // Legacy support
  "birth-childhood": "Birth & Childhood",
  "coming-of-age": "Coming of Age",
  marriage: "Marriage",
  death: "Death",
};

interface ConversationFlowProps {
  category: RiteOfPassage;
  sessionId: string;
}

export default function ConversationFlow({
  category,
  sessionId,
}: ConversationFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("start-recording");
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]); // All generated media
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState<number>(0); // Current recording time in seconds
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);

  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedSegmentsRef = useRef<number[]>([]); // Track which segments have been processed
  const supabase = createClient();

  // Handler for starting recording
  const handleStartRecording = () => {
    console.log("Starting recording...");
    setCurrentScreen("title");
    // TODO: Initialize recording logic
  };

  // Process each 30-second segment
  const processSegment = useCallback(
    async (segmentNumber: number, audioBlob: Blob) => {
      console.log(`📍 Processing segment ${segmentNumber}...`);

      // Mark this segment as processed
      processedSegmentsRef.current.push(segmentNumber);
      console.log(
        `✅ Processed segments so far: ${processedSegmentsRef.current.join(
          ", "
        )}`
      );

      try {
        // Step 1: Upload audio to storage
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user");
          return;
        }

        // Upload audio file
        const audioFormData = new FormData();
        audioFormData.append(
          "file",
          audioBlob,
          `segment-${segmentNumber}.webm`
        );
        audioFormData.append(
          "path",
          `session-${sessionId}/segment-${segmentNumber}.webm`
        );
        audioFormData.append("contentType", "audio/webm");

        const audioUploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: audioFormData,
        });

        if (!audioUploadResponse.ok) {
          throw new Error("Failed to upload audio");
        }

        const { url: audioUrl } = await audioUploadResponse.json();
        console.log("Audio uploaded:", audioUrl);

        // Step 2: Diarize the audio (send the blob directly)
        const diarizeFormData = new FormData();
        diarizeFormData.append(
          "audio",
          audioBlob,
          `segment-${segmentNumber}.webm`
        );
        diarizeFormData.append("sessionId", sessionId);
        diarizeFormData.append("segmentNumber", segmentNumber.toString());

        const diarizeResponse = await fetch("/api/diarize-speakers", {
          method: "POST",
          body: diarizeFormData,
        });

        if (!diarizeResponse.ok) {
          throw new Error("Failed to diarize audio");
        }

        const { conversationTurns } = await diarizeResponse.json();
        console.log("Diarization complete:", conversationTurns);

        // Step 3: Show message screen only for the first segment
        if (segmentNumber === 1) {
          const extractedQuestion = await extractFirstQuestion(
            conversationTurns
          );
          console.log("Extracted question:", extractedQuestion);
          setCurrentMessage(extractedQuestion);
          setCurrentScreen("message");
        }

        // Step 4: Generate image for this segment
        const imageResponse = await fetch("/api/fal/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            segmentNumber,
            turns: conversationTurns,
          }),
        });

        if (imageResponse.ok) {
          const { imageUrl } = await imageResponse.json();
          console.log(`✅ Image ${segmentNumber} generated:`, imageUrl);

          // Add to media items array
          setMediaItems((prev) => [
            ...prev,
            {
              segmentNumber,
              imageUrl,
              type: "image",
            },
          ]);

          // Transition to carousel screen (or stay on it if already there)
          setCurrentScreen("carousel");
        } else {
          console.error(
            `❌ Image generation failed for segment ${segmentNumber}`
          );
          // If first segment fails, go back to beginning
          if (segmentNumber === 1) {
            setTimeout(() => {
              setCurrentScreen("beginning");
            }, 2000);
          }
          // For subsequent segments, just keep showing the carousel with existing media
        }
      } catch (error) {
        console.error("Error processing segment:", error);
      }
    },
    [sessionId, supabase]
  );

  // Handle session completion (5 minutes or early stop)
  const handleSessionComplete = useCallback(async () => {
    console.log("🎬 Session complete, generating video...");
    console.log(
      `📊 Total segments processed: ${processedSegmentsRef.current.length}`
    );

    // Stop the recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Show generating video state on carousel
    setIsGeneratingVideo(true);
    setCurrentScreen("carousel"); // Stay on carousel while generating

    try {
      // Fetch all segment data from database for video generation
      const { data: segments, error: segmentsError } = await supabase
        .from("segments")
        .select(
          `
          *,
          turns (*)
        `
        )
        .eq("session_id", sessionId)
        .order("segment_number");

      if (segmentsError) {
        console.error("Error fetching segments:", segmentsError);
      }

      console.log(
        `📥 Fetched ${segments?.length || 0} segments for video generation`
      );

      // Flatten all turns from all segments
      const allTurns =
        segments?.flatMap((segment) => segment.turns || []) || [];
      console.log(`📝 Total turns across all segments: ${allTurns.length}`);

      // Generate video from all turns
      const videoResponse = await fetch("/api/fal/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          turns: allTurns,
          riteOfPassage: category,
        }),
      });

      if (videoResponse.ok) {
        const { videoUrl } = await videoResponse.json();
        console.log("Video generated:", videoUrl);
        setGeneratedVideoUrl(videoUrl);

        // Update session status to completed
        const { error: updateError } = await supabase
          .from("sessions")
          .update({ status: "completed" })
          .eq("id", sessionId);

        if (updateError) {
          console.error("Error updating session status:", updateError);
        }

        setCurrentScreen("video");
      } else {
        console.error("Video generation failed");
      }
    } catch (error) {
      console.error("Error generating video:", error);
    }
  }, [sessionId, supabase, category]);

  // Handler for title screen completion
  const handleTitleComplete = async () => {
    console.log("Title screen complete, transitioning to beginning...");
    setCurrentScreen("beginning");

    // Create session in database
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          id: sessionId,
          user_id: user.id,
          rite_of_passage: category,
          status: "active",
        })
        .select();

      if (sessionError) {
        console.error("Error creating session:", {
          message: sessionError.message,
          details: sessionError.details,
          hint: sessionError.hint,
          code: sessionError.code,
        });
        alert(`Failed to create session: ${sessionError.message}`);
        return;
      }

      console.log("Session created successfully:", sessionData);
    } catch (error) {
      console.error("Error initializing session:", error);
    }

    // Start recording time tracker (updates every second)
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Initialize recording manager
    recordingManagerRef.current = new RecordingManager(
      processSegment,
      handleSessionComplete
    );

    // Start recording
    recordingManagerRef.current.startRecording().catch((error) => {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check permissions.");
    });
  };

  // Handler for wrap up button (early stop)
  const handleWrapUp = () => {
    console.log("User clicked wrap up, stopping recording...");

    // Stop the recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop recording manager
    if (recordingManagerRef.current) {
      recordingManagerRef.current.stopRecording();
    }
  };

  // Handler for back button from beginning screen
  const handleBackToStart = () => {
    console.log("Going back to start screen...");

    // Clean up timers and recording
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingManagerRef.current) {
      recordingManagerRef.current.stopRecording();
      recordingManagerRef.current = null;
    }

    // Reset states
    setRecordingTime(0);
    setMediaItems([]); // Clear media items
    setIsGeneratingVideo(false);
    processedSegmentsRef.current = []; // Clear processed segments
    setCurrentScreen("start-recording");
  };

  // Render current screen
  const renderScreen = () => {
    const categoryTitle = CATEGORY_TITLES[category] || "Conversation";

    switch (currentScreen) {
      case "start-recording":
        return <StartRecordingScreen onStartRecording={handleStartRecording} />;

      case "title":
        return (
          <TitleScreen
            categoryTitle={categoryTitle}
            onComplete={handleTitleComplete}
          />
        );

      case "beginning":
        return (
          <BeginningScreen
            category={category}
            onBack={handleBackToStart}
            currentTime={recordingTime}
            onWrapUp={handleWrapUp}
          />
        );

      case "message":
        return (
          <MessageScreen
            message={currentMessage}
            onBack={
              currentMessage.includes("GENERATING")
                ? undefined
                : handleBackToStart
            }
            showBackButton={!currentMessage.includes("GENERATING")}
            isLoading={currentMessage.includes("GENERATING")}
            currentTime={recordingTime}
            onWrapUp={handleWrapUp}
            showProgressBar={!currentMessage.includes("GENERATING")}
          />
        );

      case "carousel":
        return (
          <MediaCarouselScreen
            categoryTitle={categoryTitle}
            mediaItems={mediaItems}
            currentTime={recordingTime}
            onWrapUp={isGeneratingVideo ? undefined : handleWrapUp}
            isGeneratingVideo={isGeneratingVideo}
          />
        );

      case "video":
        return (
          <VideoScreen
            categoryTitle={categoryTitle}
            videoUrl={generatedVideoUrl}
          />
        );

      default:
        return <StartRecordingScreen onStartRecording={handleStartRecording} />;
    }
  };

  return <>{renderScreen()}</>;
}
