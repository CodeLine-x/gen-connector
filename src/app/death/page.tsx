import Link from "next/link";

export default function Death() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Death
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Reflect on life&apos;s final chapter
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">🕊️</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            This section is under development. Check back soon for interactive
            content about life&apos;s final chapter.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/categories"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Back to Categories
            </Link>
            <Link
              href="/"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
