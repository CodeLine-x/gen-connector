import Link from "next/link";

export default function Categories() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Path
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Select a category to explore
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Birth and Childhood */}
          <Link
            href="/birth-childhood"
            className="block bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Birth and Childhood
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Explore early life experiences and formative years
                </p>
              </div>
              <div className="text-2xl">👶</div>
            </div>
          </Link>

          {/* Coming of Age - with recommended badge */}
          <Link
            href="/coming-of-age"
            className="block bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 p-6 md:p-8 relative"
          >
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Recommended
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Coming of Age
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Navigate the transition to adulthood
                </p>
              </div>
              <div className="text-2xl">🌱</div>
            </div>
          </Link>

          {/* Marriage */}
          <Link
            href="/marriage"
            className="block bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Marriage
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Discover partnership and commitment
                </p>
              </div>
              <div className="text-2xl">💍</div>
            </div>
          </Link>

          {/* Death */}
          <Link
            href="/death"
            className="block bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Death
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Reflect on life's final chapter
                </p>
              </div>
              <div className="text-2xl">🕊️</div>
            </div>
          </Link>
        </div>

        {/* Back button */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
