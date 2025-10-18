import Image from "next/image";
import RecordingProgressBar from "@/components/RecordingProgressBar";

interface ImageScreenProps {
  categoryTitle: string;
  segmentNumber: number;
  totalSegments: number;
  imageUrl?: string;
  imageCaption?: string;
  imageDescription?: string;
  currentTime?: number;
  onWrapUp?: () => void;
}

export default function ImageScreen({
  categoryTitle,
  segmentNumber,
  totalSegments,
  imageUrl = "/2.4 - Historical image.png",
  imageCaption,
  imageDescription,
  currentTime = 0,
  onWrapUp,
}: ImageScreenProps) {
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
      <div className="flex items-center justify-start gap-3 mb-6">
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

      {/* Main Content - Image and Info */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        {/* Generated/Found Image */}
        <div className="relative w-full max-w-xl aspect-square mb-4 rounded-lg overflow-hidden shadow-2xl">
          <Image
            src={imageUrl}
            alt={imageDescription || "Generated memory image"}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Image Caption (if provided) */}
        {imageCaption && (
          <h2
            className="text-white text-center mb-2"
            style={{
              fontFamily: "var(--font-mansalva)",
              fontSize: "clamp(20px, 4vw, 28px)",
              letterSpacing: "0.02em",
            }}
          >
            {imageCaption}
          </h2>
        )}

        {/* Image Description (if provided) */}
        {imageDescription && (
          <p
            className="text-gray-300 text-center max-w-xl px-4 mb-4"
            style={{
              fontFamily: "var(--font-jersey)",
              fontSize: "clamp(14px, 3vw, 18px)",
              lineHeight: "1.5",
              letterSpacing: "0.01em",
            }}
          >
            {imageDescription}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {onWrapUp && (
        <div className="w-full flex-shrink-0">
          <RecordingProgressBar
            currentTime={currentTime}
            maxTime={300}
            onWrapUp={onWrapUp}
          />
        </div>
      )}
    </div>
  );
}
