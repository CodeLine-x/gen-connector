"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request microphone permission on component mount
  useEffect(() => {
    requestMicrophonePermission();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      setHasPermission(true);
      streamRef.current = stream;
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setHasPermission(false);
    }
  };

  const startRecording = useCallback(async () => {
    if (!hasPermission) {
      await requestMicrophonePermission();
      if (!hasPermission) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        onRecordingComplete(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      onRecordingStart?.();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [hasPermission, onRecordingComplete, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      onRecordingStop?.();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, onRecordingStop]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (hasPermission === false) {
    return (
      <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <div className="text-red-600 dark:text-red-400 mb-2">
          🎤 Microphone access denied
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please allow microphone access to record conversations
        </p>
        <button
          onClick={requestMicrophonePermission}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="mb-4">
        <div className="text-4xl mb-2">
          {isRecording ? (isPaused ? "⏸️" : "🔴") : "🎤"}
        </div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isRecording
            ? isPaused
              ? "Recording Paused"
              : "Recording..."
            : "Ready to Record"}
        </div>
        {isRecording && (
          <div className="text-2xl font-mono text-blue-600 dark:text-blue-400">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || hasPermission === null}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Start Recording
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Resume
              </button>
            )}
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Stop
            </button>
          </>
        )}
      </div>

      {hasPermission === null && (
        <div className="mt-3 text-sm text-gray-500">
          Requesting microphone permission...
        </div>
      )}
    </div>
  );
}
