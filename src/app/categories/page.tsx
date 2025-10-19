import Image from "next/image";
import Link from "next/link";

interface Category {
  title: string;
  image: string;
  href: string;
}

const categories: Category[] = [
  {
    title: "Childhood",
    image: "/1.4 - Childhood.png",
    href: "/conversation/childhood",
  },
  {
    title: "School Life",
    image: "/1.4 - School Life.png",
    href: "/conversation/school-life",
  },
  {
    title: "Work Life",
    image: "/1.4 - Work Life.png",
    href: "/conversation/work-life",
  },
  {
    title: "Relationships",
    image: "/1.4 - Relationships.png",
    href: "/conversation/relationships",
  },
  {
    title: "Hobbies",
    image: "/1.4 - Hobbies.png",
    href: "/conversation/hobbies",
  },
  {
    title: "Community",
    image: "/1.4 - Community.png",
    href: "/conversation/community",
  },
];

export default function Categories() {
  return (
    <main className="h-screen w-screen bg-black text-white flex items-center justify-center overflow-hidden">
      {/* Mobile-First Layout - Contained within viewport */}
      <div className="w-full h-full flex flex-col items-center justify-center py-4 px-4 md:py-6 md:px-8">
        {/* Header Title */}
        <h1
          className="text-center text-white mb-3 md:mb-4 flex-shrink-0"
          style={{
            fontFamily: "var(--font-mansalva)",
            fontSize: "clamp(20px, 5vw, 28px)",
            lineHeight: "1.2",
            letterSpacing: "0.01em",
          }}
        >
          Let&apos;s find a topic
          <br />
          to dig into!
        </h1>

        {/* Category Grid - Contained within remaining space */}
        <div className="w-full flex-shrink-0 flex items-center justify-center max-h-[calc(100vh-120px)]">
          <div className="w-full max-w-xl grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col aspect-square"
              >
                {/* Image Container - Takes most of the space */}
                <div className="relative w-full flex-1">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-contain p-3 md:p-4"
                  />
                </div>

                {/* Title - Fixed height at bottom */}
                <div
                  className="text-center text-black py-2 md:py-3 flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-mansalva)",
                    fontSize: "clamp(14px, 3vw, 18px)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {category.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
