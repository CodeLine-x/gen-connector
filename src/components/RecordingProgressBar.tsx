// Recording Progress Bar - Shows 0-300s timeline with 30s checkpoints

interface RecordingProgressBarProps {
  currentTime: number; // in seconds
  maxTime?: number; // default 300 seconds (5 minutes)
  onWrapUp: () => void;
}

export default function RecordingProgressBar({
  currentTime,
  maxTime = 300,
  onWrapUp,
}: RecordingProgressBarProps) {
  const progress = Math.min((currentTime / maxTime) * 100, 100);
  const segmentCount = Math.floor(maxTime / 30); // 10 segments for 300s

  // Create checkpoint markers at every 30 seconds
  const checkpoints = Array.from({ length: segmentCount }, (_, i) => ({
    position: (((i + 1) * 30) / maxTime) * 100,
    time: (i + 1) * 30,
    isPassed: currentTime >= (i + 1) * 30,
  }));

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-4xl px-6">
      {/* Time Display */}
      <div className="flex justify-between items-center mb-2">
        <span
          className="text-white text-sm"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(14px, 3vw, 18px)",
          }}
        >
          {formatTime(currentTime)}
        </span>
        <span
          className="text-white text-sm opacity-70"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(14px, 3vw, 18px)",
          }}
        >
          {formatTime(maxTime)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-visible mb-6">
        {/* Progress Fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
          }}
        />

        {/* Checkpoint Markers */}
        {checkpoints.map((checkpoint, index) => (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${checkpoint.position}%` }}
          >
            {/* Marker Line */}
            <div
              className={`w-0.5 h-5 ${
                checkpoint.isPassed ? "bg-orange-300" : "bg-gray-600"
              } transition-colors duration-300`}
            />
            {/* Segment Number Label (optional) */}
            <span
              className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500"
              style={{
                fontFamily: "var(--font-jersey)",
                fontSize: "10px",
              }}
            >
              {index + 1}
            </span>
          </div>
        ))}

        {/* Current Position Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-1000 ease-linear"
          style={{ left: `${progress}%` }}
        >
          <div className="w-4 h-4 bg-white rounded-full shadow-lg border-2 border-orange-500" />
        </div>
      </div>

      {/* Wrap Up Button */}
      <div className="flex justify-center">
        <button
          onClick={onWrapUp}
          className="px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border-2 border-orange-500 bg-black text-orange-500 hover:bg-orange-500 hover:text-black"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: "500",
          }}
        >
          Wrap Up
        </button>
      </div>
    </div>
  );
}
