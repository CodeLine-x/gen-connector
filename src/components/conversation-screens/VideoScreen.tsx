import Link from "next/link";

export interface MediaItem {
  segmentNumber: number;
  imageUrl?: string;
  audioUrl?: string;
  caption?: string;
  type: "image" | "audio";
}

export interface VideoScreenProps {
  categoryTitle: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  onShare?: () => void;
  onSave?: () => void;
  onStartAgain?: () => void;
  mediaItems?: MediaItem[];
  hasAudio?: boolean;
}

export default function VideoScreen({
  categoryTitle,
  videoUrl,
  thumbnailUrl = "/2.4 - Historical image.png",
  onShare,
  onSave,
  onStartAgain,
  mediaItems = [],
  hasAudio = false,
}: VideoScreenProps) {
  // Get the song URL if available for audio overlay
  const songItem = mediaItems.find(
    (item) => item.type === "audio" && item.audioUrl
  );
  const songUrl = songItem?.audioUrl;

  // Extract YouTube/Spotify ID for embed
  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&loop=1&playlist=${videoId}`
        : null;
    }

    if (url.includes("spotify.com")) {
      const regExp = /track\/([a-zA-Z0-9]+)/;
      const match = url.match(regExp);
      const trackId = match ? match[1] : null;
      return trackId ? `https://open.spotify.com/embed/track/${trackId}` : null;
    }

    return null;
  };

  const audioEmbedUrl = getEmbedUrl(songUrl);
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

      {/* Video Player with Optional Audio Overlay */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 gap-4">
        {/* AI-Generated Video */}
        <div className="relative w-full max-w-2xl aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
          {videoUrl ? (
            // AI-Generated Video
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
            // Placeholder thumbnail
            <div
              className="w-full h-full bg-cover bg-center relative"
              style={{
                backgroundImage: `url(${thumbnailUrl})`,
                filter: "sepia(0.3) contrast(0.9) grayscale(0.5)",
              }}
            >
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

        {/* Audio Player (if audio was found) */}
        {hasAudio && audioEmbedUrl && (
          <div className="w-full max-w-2xl">
            <div className="relative w-full h-20 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={audioEmbedUrl}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: "8px" }}
              />
            </div>
            {songItem?.caption && (
              <p
                className="text-center text-white/70 mt-2"
                style={{
                  fontFamily: "var(--font-mansalva)",
                  fontSize: "14px",
                }}
              >
                🎵 {songItem.caption}
              </p>
            )}
          </div>
        )}
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
