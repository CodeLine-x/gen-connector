import RecordingProgressBar from "@/components/RecordingProgressBar";

interface MessageScreenProps {
  message: string;
  onBack?: () => void;
  showBackButton?: boolean;
  isLoading?: boolean;
  currentTime?: number;
  onWrapUp?: () => void;
  showProgressBar?: boolean;
}

export default function MessageScreen({
  message,
  onBack,
  showBackButton = true,
  isLoading = false,
  currentTime = 0,
  onWrapUp,
  showProgressBar = false,
}: MessageScreenProps) {
  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Back Button (conditional) */}
      {showBackButton && onBack && (
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={onBack}
            className="text-white p-2 hover:opacity-80 transition-opacity"
            aria-label="Go back"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 pb-6">
        {/* Centered Message */}
        <div className="flex-1 flex flex-col items-center justify-center px-2 gap-6">
          <p
            className="text-white text-center max-w-2xl"
            style={{
              fontFamily: "var(--font-mansalva)",
              fontSize: "clamp(28px, 6vw, 40px)",
              lineHeight: "1.4",
              letterSpacing: "0.01em",
            }}
          >
            {message}
          </p>

          {/* Loading Spinner (if isLoading) */}
          {isLoading && (
            <div className="flex items-center gap-2">
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
          )}
        </div>

        {/* Progress Bar (if showProgressBar and onWrapUp are provided) */}
        {showProgressBar && onWrapUp && (
          <div className="w-full flex-shrink-0">
            <RecordingProgressBar
              currentTime={currentTime}
              maxTime={300}
              onWrapUp={onWrapUp}
            />
          </div>
        )}
      </div>
    </div>
  );
}
