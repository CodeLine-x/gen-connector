import { useEffect } from "react";
import Image from "next/image";

interface TitleScreenProps {
  categoryTitle: string;
  onComplete: () => void;
}

export default function TitleScreen({
  categoryTitle,
  onComplete,
}: TitleScreenProps) {
  useEffect(() => {
    // Auto-transition after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center overflow-y-auto p-6">
      {/* Category Title */}
      <h1
        className="text-white text-center mb-8 md:mb-12"
        style={{
          fontFamily: "var(--font-mansalva)",
          fontSize: "clamp(36px, 8vw, 48px)",
          letterSpacing: "0.02em",
        }}
      >
        {categoryTitle}
      </h1>

      {/* Chalk Illustration */}
      <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
        <Image
          src="/2.1 - Childhood.png"
          alt="Family illustration"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
