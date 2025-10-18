// Media Carousel Screen - Displays all generated images/audio with navigation

import Image from "next/image";
import { useState, useEffect } from "react";
import RecordingProgressBar from "@/components/RecordingProgressBar";

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}

// Helper function to extract Spotify track ID
function extractSpotifyId(url: string): string {
  const regExp = /track\/([a-zA-Z0-9]+)/;
  const match = url.match(regExp);
  return match ? match[1] : "";
}

interface MediaItem {
  segmentNumber: number;
  imageUrl?: string;
  audioUrl?: string;
  caption?: string;
  type: "image" | "audio";
}

interface MediaCarouselScreenProps {
  categoryTitle: string;
  mediaItems: MediaItem[];
  currentTime?: number;
  onWrapUp?: () => void;
  isGeneratingVideo?: boolean;
}

export default function MediaCarouselScreen({
  categoryTitle,
  mediaItems,
  currentTime = 0,
  onWrapUp,
  isGeneratingVideo = false,
}: MediaCarouselScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(mediaItems.length - 1); // Start with latest

  // Automatically show the latest image when a new one is added
  useEffect(() => {
    if (mediaItems.length > 0) {
      setCurrentIndex(mediaItems.length - 1);
    }
  }, [mediaItems.length]); // Only trigger when length changes (new image added)

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < mediaItems.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
  };

  const currentMedia = mediaItems[currentIndex];

  // Generate progress dots
  const renderProgressDots = () => {
    return mediaItems.map((_, index) => (
      <button
        key={index}
        onClick={() => setCurrentIndex(index)}
        className={`w-3 h-3 rounded-full transition-all ${
          index === currentIndex
            ? "bg-orange-500 w-6"
            : index < currentIndex
            ? "bg-gray-600"
            : "bg-gray-700"
        }`}
        aria-label={`Go to segment ${index + 1}`}
      />
    ));
  };

  return (
    <div
      className="h-screen w-screen bg-black flex flex-col overflow-y-auto p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Progress Indicator */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <span
          className="text-white font-bold tracking-wider"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(14px, 3vw, 18px)",
          }}
        >
          {categoryTitle.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">{renderProgressDots()}</div>
      </div>

      {/* Main Content - Media and Navigation */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`absolute left-4 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            canGoPrevious
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-gray-800/20 text-gray-600 cursor-not-allowed"
          }`}
          aria-label="Previous media"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Media Display */}
        <div className="flex flex-col items-center justify-center max-w-4xl w-full px-16">
          {currentMedia?.type === "image" && currentMedia.imageUrl && (
            <>
              <div className="relative w-full aspect-square max-w-2xl mb-4 rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={currentMedia.imageUrl}
                  alt={
                    currentMedia.caption ||
                    `Segment ${currentMedia.segmentNumber}`
                  }
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {currentMedia.caption && (
                <p
                  className="text-gray-300 text-center max-w-xl px-4"
                  style={{
                    fontFamily: "var(--font-jersey)",
                    fontSize: "clamp(14px, 3vw, 18px)",
                    lineHeight: "1.5",
                  }}
                >
                  {currentMedia.caption}
                </p>
              )}
            </>
          )}

          {currentMedia?.type === "audio" && currentMedia.audioUrl && (
            <div className="flex flex-col items-center w-full max-w-2xl">
              {currentMedia.audioUrl.includes("youtube.com") ||
              currentMedia.audioUrl.includes("youtu.be") ? (
                // YouTube embed (verified as playable)
                <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(
                      currentMedia.audioUrl
                    )}?autoplay=0`}
                    title={currentMedia.caption || "Music Video"}
                    frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0"
                  />
                </div>
              ) : currentMedia.audioUrl.includes("spotify.com") ? (
                // Spotify embed
                <div className="relative w-full h-80 mb-4 rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    style={{ borderRadius: "12px" }}
                    src={`https://open.spotify.com/embed/track/${extractSpotifyId(
                      currentMedia.audioUrl
                    )}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              ) : (
                // Fallback: Music icon + link
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
                    </svg>
                  </div>
                  <a
                    href={currentMedia.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium"
                  >
                    🎵 Listen on External Site
                  </a>
                </div>
              )}

              {currentMedia.caption && (
                <p
                  className="text-white text-center mt-4"
                  style={{
                    fontFamily: "var(--font-mansalva)",
                    fontSize: "clamp(20px, 4vw, 28px)",
                  }}
                >
                  {currentMedia.caption}
                </p>
              )}
            </div>
          )}

          {/* Segment Counter */}
          <div className="mt-6">
            <p
              className="text-white/70 text-center"
              style={{
                fontFamily: "var(--font-jersey)",
                fontSize: "clamp(16px, 3.5vw, 20px)",
              }}
            >
              Segment {currentIndex + 1} of {mediaItems.length}
            </p>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`absolute right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            canGoNext
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-gray-800/20 text-gray-600 cursor-not-allowed"
          }`}
          aria-label="Next media"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Progress Bar (if not generating video) */}
      {!isGeneratingVideo && onWrapUp && (
        <div className="w-full flex-shrink-0">
          <RecordingProgressBar
            currentTime={currentTime}
            maxTime={300}
            onWrapUp={onWrapUp}
          />
        </div>
      )}

      {/* Generating Video Message */}
      {isGeneratingVideo && (
        <div className="w-full flex-shrink-0 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
          <p
            className="text-white"
            style={{
              fontFamily: "var(--font-mansalva)",
              fontSize: "clamp(20px, 4vw, 28px)",
            }}
          >
            Generating your memory montage...
          </p>
        </div>
      )}
    </div>
  );
}
