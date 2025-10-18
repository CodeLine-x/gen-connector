import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Mobile-First Layout */}
      <div className="w-full max-w-md flex flex-col items-center justify-center space-y-6 md:max-w-2xl lg:max-w-4xl">
        {/* Welcome Text */}
        <h2
          className="text-center text-white"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "32px",
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
            fontSize: "48px",
            letterSpacing: "0.02em",
          }}
        >
          THRoWBACK
        </h1>

        {/* Nostalgic Image */}
        <div className="w-full aspect-[3/4] relative rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="/1.1 - Living Room placeholder.png"
            alt="Nostalgic living room with vintage TV and furniture"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Tagline */}
        <p
          className="text-center text-white px-4"
          style={{
            fontFamily: "var(--font-jersey)",
            fontSize: "24px",
            lineHeight: "1.4",
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
            className="px-12 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #FFA726 0%, #FF9800 50%, #FB8C00 100%)",
              fontFamily: "var(--font-jersey)",
              fontSize: "32px",
              color: "#000000",
              fontWeight: "500",
            }}
          >
            Play
          </button>
        </Link>
      </div>
    </main>
  );
}
