import Image from "next/image";
import { getInitialPrompts, RiteOfPassage } from "@/lib/promptTemplates";
import RecordingProgressBar from "@/components/RecordingProgressBar";

interface BeginningScreenProps {
  category: RiteOfPassage;
  onBack: () => void;
  currentTime: number; // Current recording time in seconds
  onWrapUp: () => void; // Handler for wrap up button
}

export default function BeginningScreen({
  category,
  onBack,
  currentTime,
  onWrapUp,
}: BeginningScreenProps) {
  // Get category-specific prompts
  const prompts = getInitialPrompts(category);

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Back Button */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between pt-20 px-6 pb-6">
        {/* Top Section: Title & Prompts */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* Title */}
          <h1
            className="text-white text-center mb-6 max-w-lg"
            style={{
              fontFamily: "var(--font-mansalva)",
              fontSize: "clamp(24px, 5vw, 32px)",
              lineHeight: "1.3",
              letterSpacing: "0.01em",
            }}
          >
            What would you like to know about Ah Ma?
          </h1>

          {/* Question Prompts (Pills) */}
          <div className="w-full max-w-xl flex flex-col gap-3 mb-6">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className="bg-white rounded-full px-5 py-3 text-center shadow-lg"
              >
                <p
                  className="text-black"
                  style={{
                    fontFamily: "var(--font-mansalva)",
                    fontSize: "clamp(14px, 3vw, 18px)",
                    lineHeight: "1.3",
                    letterSpacing: "0.01em",
                  }}
                >
                  {prompt}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Text */}
          <p
            className="text-white text-center mb-4"
            style={{
              fontFamily: "var(--font-mansalva)",
              fontSize: "clamp(20px, 4.5vw, 26px)",
              letterSpacing: "0.01em",
            }}
          >
            Ask your question
            <br />
            out loud!
          </p>

          {/* Character Illustration */}
          <div className="relative w-20 h-20 md:w-24 md:h-24">
            <Image
              src="/2.2 - Ask a question.png"
              alt="Ask a question character"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Bottom Section: Progress Bar */}
        <div className="w-full flex-shrink-0">
          <RecordingProgressBar
            currentTime={currentTime}
            maxTime={300}
            onWrapUp={onWrapUp}
          />
        </div>
      </div>
    </div>
  );
}
