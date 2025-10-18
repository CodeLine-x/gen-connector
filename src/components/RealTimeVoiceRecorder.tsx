"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface RealTimeVoiceRecorderProps {
  onTranscriptUpdate: (transcript: string, isFinal: boolean) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  language?: string;
}

export default function RealTimeVoiceRecorder({
  onTranscriptUpdate,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  language = "en-US",
}: RealTimeVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Web Speech API is supported
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
    } else {
      setError("Speech recognition is not supported in this browser");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (disabled || !isSupported) return;

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      // Handle recognition results
      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript + interimTranscript;
        setCurrentTranscript(fullTranscript);

        // Send interim results for real-time display
        onTranscriptUpdate(fullTranscript, false);

        // Send final results when speech ends
        if (finalTranscript) {
          onTranscriptUpdate(finalTranscript, true);
        }
      };

      // Handle recognition events
      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        onRecordingStart?.();
      };

      recognition.onend = () => {
        setIsRecording(false);
        onRecordingStop?.();
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        onRecordingStop?.();
      };

      recognition.onnomatch = () => {
        console.log("No speech was recognized");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start speech recognition");
    }
  }, [
    disabled,
    isSupported,
    language,
    onTranscriptUpdate,
    onRecordingStart,
    onRecordingStop,
  ]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      onRecordingStop?.();
    }
  }, [isRecording, onRecordingStop]);

  const clearTranscript = useCallback(() => {
    setCurrentTranscript("");
    onTranscriptUpdate("", true);
  }, [onTranscriptUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <div className="text-red-500 text-5xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Speech Recognition Not Supported
        </h3>
        <p className="text-red-600 dark:text-red-300 text-center">
          Your browser doesn't support speech recognition. Please use Chrome,
          Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Status Display */}
      <div className="text-center mb-4">
        <div
          className={`text-2xl font-bold mb-2 ${
            isRecording
              ? "text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {isRecording ? "🔴 Recording..." : "⭕ Ready"}
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      </div>

      {/* Current Transcript Display */}
      {currentTranscript && (
        <div className="w-full mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Live Transcript:
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            {currentTranscript}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>🎤</span>
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 flex items-center space-x-2"
          >
            <span>⏹️</span>
            <span>Stop Recording</span>
          </button>
        )}

        {currentTranscript && (
          <button
            onClick={clearTranscript}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 flex items-center space-x-2"
          >
            <span>🗑️</span>
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {isRecording ? (
          <p>Speak naturally. Your speech will be transcribed in real-time.</p>
        ) : (
          <p>Click "Start Recording" to begin seamless voice conversation.</p>
        )}
      </div>
    </div>
  );
}
