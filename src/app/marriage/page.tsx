import Link from "next/link";

export default function Marriage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            Marriage
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg lg:text-xl">
            Discover partnership and commitment
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 lg:p-12 text-center">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">
            💍
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
            This section is under development. Check back soon for interactive
            content about marriage and partnerships.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/categories"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-xl transition-colors duration-200 text-sm sm:text-base"
            >
              Back to Categories
            </Link>
            <Link
              href="/"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-xl transition-colors duration-200 text-sm sm:text-base"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
