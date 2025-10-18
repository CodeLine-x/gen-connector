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
      <div className="w-full h-full flex flex-col items-center py-6 px-6 md:py-8 md:px-12">
        {/* Header Title */}
        <h1
          className="text-center text-white mb-6 md:mb-8 flex-shrink-0"
          style={{
            fontFamily: "var(--font-mansalva)",
            fontSize: "clamp(24px, 6vw, 32px)",
            lineHeight: "1.2",
            letterSpacing: "0.01em",
          }}
        >
          Let&apos;s find a topic
          <br />
          to dig into!
        </h1>

        {/* Category Grid - Takes remaining space */}
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-2xl grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 auto-rows-fr">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative w-full aspect-square">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-contain p-4"
                  />
                </div>

                {/* Title */}
                <div
                  className="text-center text-black py-3 md:py-4 flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-mansalva)",
                    fontSize: "clamp(16px, 3.5vw, 20px)",
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
