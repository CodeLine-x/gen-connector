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
  userId: string;
}

export default function ConversationFlow({
  category,
  sessionId,
  userId,
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

        // Step 4: Store conversation memory in Mem0
        try {
          const memoryResponse = await fetch("/api/mem0/add-memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `Segment ${segmentNumber} conversation: ${conversationTurns
                .map(
                  (t: { speaker: string; transcript: string }) =>
                    `${t.speaker}: ${t.transcript}`
                )
                .join(" ")
                .slice(0, 1000)}`, // Limit to 1000 chars to avoid payload size issues
              metadata: {
                sessionId,
                segmentNumber,
                category,
                timestamp: new Date().toISOString(),
              },
              entityId: sessionId,
            }),
          });

          if (memoryResponse.ok) {
            console.log(`🧠 Memory stored for segment ${segmentNumber}`);
          }
        } catch (error) {
          console.error("Error storing memory:", error);
        }

        // Step 5: Check for song mentions first (priority over images)
        const songSearchResponse = await fetch("/api/search-song", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turns: conversationTurns,
          }),
        });

        let songFound = false;

        if (songSearchResponse.ok) {
          const songResult = await songSearchResponse.json();

          if (songResult.found) {
            console.log(
              `🎵 Song found for segment ${segmentNumber}:`,
              songResult.songTitle
            );

            // Store music preference memory
            try {
              await fetch("/api/mem0/add-memory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: `Music preference discovered: ${
                    songResult.songTitle
                  } by ${songResult.artistName || "Unknown artist"}`,
                  metadata: {
                    sessionId,
                    category: "music_preferences",
                    artist: songResult.artistName,
                    song: songResult.songTitle,
                    era: songResult.era,
                    confidence: songResult.confidence,
                  },
                  entityId: sessionId,
                }),
              });
              console.log(`🧠 Music preference memory stored`);
            } catch (error) {
              console.error("Error storing music memory:", error);
            }

            // Add song to media items
            setMediaItems((prev) => [
              ...prev,
              {
                segmentNumber,
                audioUrl: songResult.youtubeUrl || songResult.spotifyUrl,
                caption: `${songResult.songTitle || "Song"} ${
                  songResult.artistName ? `by ${songResult.artistName}` : ""
                }`,
                type: "audio",
              },
            ]);

            songFound = true;
            setCurrentScreen("carousel");
          }
        }

        // Step 5: If no song found, generate image instead
        if (!songFound) {
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
        }
      } catch (error) {
        console.error("Error processing segment:", error);
      }
    },
    [sessionId, supabase, category]
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

      // Find any songs from the media items
      const foundSongs = mediaItems.filter(
        (item) => item.type === "audio" && item.audioUrl
      );
      const selectedSongUrl =
        foundSongs.length > 0 ? foundSongs[0].audioUrl : undefined;

      if (selectedSongUrl) {
        console.log(
          `🎵 Using song from segment for video: ${foundSongs[0].caption}`
        );
      }

      // Load memories to enhance video generation
      let userMemories = [];
      try {
        const memoriesResponse = await fetch("/api/mem0/search-memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `family history and preferences for ${category}`,
            entityId: sessionId,
            limit: 3, // Reduced from 10 to 3 to prevent payload size issues
          }),
        });

        if (memoriesResponse.ok) {
          const { results } = await memoriesResponse.json();
          // Limit memories to prevent payload size issues
          userMemories = (results.memories || [])
            .slice(0, 5)
            .map((memory: { text: string; [key: string]: unknown }) => ({
              ...memory,
              text: memory.text.slice(0, 500), // Limit memory text to 500 chars
            }));
          console.log(
            `🧠 Using ${userMemories.length} memories for video generation`
          );
        }
      } catch (error) {
        console.error("Error loading memories for video:", error);
      }

      // Generate video from all turns with memories
      const videoResponse = await fetch("/api/fal/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          turns: allTurns,
          riteOfPassage: category,
          songUrl: selectedSongUrl, // Include found song if available
          memories: userMemories, // Include user memories for richer context
        }),
      });

      if (videoResponse.ok) {
        const videoData = await videoResponse.json();

        // Always use AI-generated video
        console.log("Video generated:", videoData.videoUrl);
        setGeneratedVideoUrl(videoData.videoUrl);

        // Update session status to completed
        const { data: updateData, error: updateError } = await supabase
          .from("sessions")
          .update({
            status: "completed",
            has_audio: selectedSongUrl ? true : false, // Mark if audio was available
          })
          .eq("id", sessionId)
          .select();

        if (updateError) {
          console.error("Error updating session status:", {
            error: updateError,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code,
          });
        } else {
          console.log("Session status updated successfully:", updateData);
        }

        setCurrentScreen("video");
      } else {
        console.error("Video generation failed");
      }
    } catch (error) {
      console.error("Error generating video:", error);
    }
  }, [sessionId, supabase, category, mediaItems]);

  // Handler for title screen completion
  const handleTitleComplete = async () => {
    console.log("Title screen complete, transitioning to beginning...");

    // Load user memories for personalized experience
    try {
      const memoriesResponse = await fetch("/api/mem0/search-memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `previous ${category} conversations and preferences`,
          entityId: sessionId,
          limit: 3, // Reduced from 5 to 3 to prevent payload size issues
        }),
      });

      if (memoriesResponse.ok) {
        const { results } = await memoriesResponse.json();
        console.log(`🧠 Loaded ${results.total} memories for personalization`);

        // Store memories for later use in video generation
        if (results.memories && results.memories.length > 0) {
          console.log(
            "📝 User memories:",
            results.memories.map((m: { text: string }) => m.text)
          );
        }
      }
    } catch (error) {
      console.error("Error loading memories:", error);
    }

    setCurrentScreen("beginning");

    // Create session in database
    try {
      // Use the userId passed as prop (authenticated or anonymous)
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          id: sessionId,
          user_id: userId,
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
            onStartAgain={handleBackToStart}
            mediaItems={mediaItems} // Pass media items for audio overlay
            hasAudio={mediaItems.some((item) => item.type === "audio")} // Check if we have audio
          />
        );

      default:
        return <StartRecordingScreen onStartRecording={handleStartRecording} />;
    }
  };

  return <>{renderScreen()}</>;
}
