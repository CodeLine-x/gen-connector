import { useState } from "react";
import Image from "next/image";

interface AudioScreenProps {
  categoryTitle: string;
  segmentNumber: number;
  totalSegments: number;
  songTitle?: string;
  artistName?: string;
  albumCoverUrl?: string;
  audioUrl?: string;
}

export default function AudioScreen({
  categoryTitle,
  segmentNumber,
  totalSegments,
  songTitle = "甜蜜蜜",
  artistName = "TERESA TENG",
  albumCoverUrl = "/2.5 - Teresa Teng.png",
  audioUrl,
}: AudioScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Integrate actual audio playback
    console.log(audioUrl ? `Playing: ${audioUrl}` : "No audio URL provided");
  };

  // Generate progress dots
  const renderProgressDots = () => {
    const dots = [];
    for (let i = 0; i < totalSegments; i++) {
      const isActive = i === segmentNumber - 1;
      const isPast = i < segmentNumber - 1;
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all ${
            isActive
              ? "bg-orange-500 w-6"
              : isPast
              ? "bg-gray-600"
              : "bg-gray-700"
          }`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden p-6">
      {/* Top Progress Indicator */}
      <div className="flex items-center justify-start gap-3 mb-8">
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

      {/* Main Content - Album Cover and Info */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Album Cover */}
        <div className="relative w-full max-w-sm aspect-square mb-8 rounded-lg overflow-hidden shadow-2xl">
          <Image
            src={albumCoverUrl}
            alt={`${songTitle} - ${artistName}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Song Title (Chinese) */}
        <h2
          className="text-white text-center mb-2"
          style={{
            fontFamily: "var(--font-mansalva)",
            fontSize: "clamp(32px, 7vw, 48px)",
            letterSpacing: "0.02em",
          }}
        >
          {songTitle}
        </h2>

        {/* Artist Name (English) */}
        <p
          className="text-white text-center mb-8"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(20px, 4vw, 28px)",
            letterSpacing: "0.05em",
          }}
        >
          {artistName}
        </p>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            // Pause icon
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="white"
              className="md:w-10 md:h-10"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="white"
              className="md:w-10 md:h-10 ml-1"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
