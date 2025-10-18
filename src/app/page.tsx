import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-black text-white flex items-center justify-center overflow-y-auto">
      {/* Mobile-First Layout - Contained within viewport */}
      <div className="w-full h-full flex flex-col items-center justify-between py-4 px-6 md:py-8 md:px-12">
        {/* Top Section: Welcome + Title */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {/* Welcome Text */}
          <h2
            className="text-center text-white"
            style={{
              fontFamily: "var(--font-jersey)",
              fontSize: "clamp(20px, 5vw, 32px)",
              letterSpacing: "0.02em",
            }}
          >
            Welcome to
          </h2>

          {/* THROWBACK Title */}
          <h1
            className="text-center text-white leading-tight"
            style={{
              fontFamily: "var(--font-mansalva)",
              fontSize: "clamp(32px, 8vw, 48px)",
              letterSpacing: "0.02em",
            }}
          >
            THRoWBACK
          </h1>
        </div>

        {/* Middle Section: Nostalgic Image */}
        <div className="w-full max-w-sm flex-1 flex items-center justify-center py-4 md:max-w-md lg:max-w-lg">
          <div className="w-full h-full max-h-[50vh] relative rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/1.1 - Living Room placeholder.png"
              alt="Nostalgic living room with vintage TV and furniture"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Bottom Section: Tagline + Button */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          {/* Tagline */}
          <p
            className="text-center text-white"
            style={{
              fontFamily: "var(--font-jersey)",
              fontSize: "clamp(18px, 4vw, 24px)",
              lineHeight: "1.3",
              letterSpacing: "0.01em",
            }}
          >
            Connect across generations,
            <br />
            one story at a time.
          </p>

          {/* Play Button */}
          <Link href="/categories">
            <button
              className="px-10 py-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg md:px-12 md:py-4"
              style={{
                background:
                  "linear-gradient(135deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
                fontFamily: "var(--font-jersey)",
                fontSize: "clamp(24px, 6vw, 32px)",
                color: "#000000",
                fontWeight: "500",
              }}
            >
              Play
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
