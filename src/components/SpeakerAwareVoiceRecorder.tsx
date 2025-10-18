"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface SpeakerAwareVoiceRecorderProps {
  onConversationComplete: (
    conversationTurns: Array<{
      speaker: "elderly" | "young_adult";
      transcript: string;
      timestamp: number;
      confidence: number;
    }>
  ) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
}

export default function SpeakerAwareVoiceRecorder({
  onConversationComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
}: SpeakerAwareVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define processCompleteConversation first so it can be used in startRecording
  const processCompleteConversation = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "conversation.webm");

        const response = await fetch("/api/diarize-speakers", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Speaker diarization completed:", data);
          onConversationComplete(data.conversationTurns);
        } else {
          throw new Error(data.error || "Failed to analyze speakers");
        }
      } catch (err) {
        console.error("Error processing conversation:", err);
        setError("Failed to analyze speakers. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [onConversationComplete]
  );

  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm; codecs=opus",
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm; codecs=opus",
        });

        // Process the complete conversation for speaker diarization
        await processCompleteConversation(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      onRecordingStart?.();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Please allow microphone access to record.");
    }
  }, [disabled, onRecordingStart, processCompleteConversation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(intervalRef.current!);
      setIsRecording(false);
      onRecordingStop?.();
    }
  }, [isRecording, onRecordingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Status Display */}
      <div className="text-center mb-4">
        <div
          className={`text-2xl font-bold mb-2 ${
            isRecording
              ? "text-red-600 dark:text-red-400"
              : isProcessing
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {isProcessing
            ? "🔍 Analyzing Speakers..."
            : isRecording
            ? "🔴 Recording Conversation..."
            : "⭕ Ready to Record"}
        </div>

        {isRecording && (
          <div className="text-lg font-mono text-gray-600 dark:text-gray-400">
            {formatTime(recordingTime)}
          </div>
        )}

        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      </div>

      {/* Instructions */}
      <div className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {isRecording ? (
          <p>
            Recording complete conversation. Both speakers can talk naturally.
          </p>
        ) : isProcessing ? (
          <p>Analyzing who said what based on voice characteristics...</p>
        ) : (
          <p>
            Click &quot;Start Recording&quot; to begin a complete conversation
            session.
          </p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        {!isRecording && !isProcessing ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>🎤</span>
            <span>Start Recording</span>
          </button>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 flex items-center space-x-2"
          >
            <span>⏹️</span>
            <span>Stop & Analyze</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Features Info */}
      <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>
          ✨ Automatically identifies speakers based on voice characteristics
        </p>
        <p>🎯 Distinguishes between elderly and young adult voices</p>
        <p>📝 Generates complete conversation transcript with speaker labels</p>
      </div>
    </div>
  );
}
