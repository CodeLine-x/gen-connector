import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md lg:max-w-lg xl:max-w-xl w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Welcome
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl">
            Ready to begin your journey?
          </p>
          <Link
            href="/categories"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 lg:py-5 lg:px-10 rounded-xl text-base sm:text-lg lg:text-xl transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            Begin
          </Link>
        </div>
      </div>
    </div>
  );
}
