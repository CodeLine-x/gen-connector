import Link from "next/link";

interface VideoScreenProps {
  categoryTitle: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  onShare?: () => void;
  onSave?: () => void;
  onStartAgain?: () => void;
}

export default function VideoScreen({
  categoryTitle,
  videoUrl,
  thumbnailUrl = "/2.4 - Historical image.png",
  onShare,
  onSave,
  onStartAgain,
}: VideoScreenProps) {
  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else if (videoUrl) {
      // Native share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${categoryTitle} Memory Montage`,
            text: "Check out this memory montage!",
            url: videoUrl,
          });
        } catch (error) {
          console.log("Share cancelled or failed:", error);
        }
      } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(videoUrl);
        alert("Video link copied to clipboard!");
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else if (videoUrl) {
      // Trigger download
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${categoryTitle}-memory-montage.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStartAgain = () => {
    if (onStartAgain) {
      onStartAgain();
    } else {
      // Default: reload page
      window.location.reload();
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden p-6">
      {/* Title */}
      <div className="text-center mb-6">
        <h1
          className="text-white tracking-wider"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(20px, 4vw, 28px)",
            letterSpacing: "0.05em",
          }}
        >
          AH MA&apos;s
          <br />
          {categoryTitle.toUpperCase()}
        </h1>
      </div>

      {/* Video Player / Thumbnail */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <div className="relative w-full max-w-2xl aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={thumbnailUrl}
              controls
              className="w-full h-full object-cover"
              style={{
                filter: "sepia(0.3) contrast(0.9)",
                boxShadow: "inset 0 0 100px rgba(0,0,0,0.5)",
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            // Placeholder thumbnail with vintage effect
            <div
              className="w-full h-full bg-cover bg-center relative"
              style={{
                backgroundImage: `url(${thumbnailUrl})`,
                filter: "sepia(0.3) contrast(0.9) grayscale(0.5)",
              }}
            >
              {/* Vignette overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(20px, 4vw, 28px)",
            color: "#FFFFFF",
            fontWeight: "500",
          }}
        >
          Share
        </button>

        {/* Save to Device Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(20px, 4vw, 28px)",
            color: "#FFFFFF",
            fontWeight: "500",
          }}
        >
          Save to device
        </button>

        {/* Start Again Button */}
        <Link href="/categories" className="w-full">
          <button
            onClick={handleStartAgain}
            className="w-full py-4 rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              borderColor: "#FF9800",
              background: "transparent",
              fontFamily: "var(--font-jersey)",
              fontSize: "clamp(20px, 4vw, 28px)",
              color: "#FFFFFF",
              fontWeight: "500",
            }}
          >
            Start again
          </button>
        </Link>
      </div>
    </div>
  );
}
