interface StartRecordingScreenProps {
  onStartRecording: () => void;
}

export default function StartRecordingScreen({
  onStartRecording,
}: StartRecordingScreenProps) {
  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* "Let's talk!" text */}
      <h1
        className="text-white text-center mb-12 md:mb-16"
        style={{
          fontFamily: "var(--font-mansalva)",
          fontSize: "clamp(40px, 10vw, 56px)",
          letterSpacing: "0.02em",
        }}
      >
        Let&apos;s talk!
      </h1>

      {/* Start recording button */}
      <button
        onClick={onStartRecording}
        className="px-12 py-4 md:px-16 md:py-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
          fontFamily: "var(--font-jersey)",
          fontSize: "clamp(28px, 6vw, 36px)",
          color: "#FFFFFF",
          fontWeight: "500",
        }}
      >
        Start recording
      </button>
    </div>
  );
}
