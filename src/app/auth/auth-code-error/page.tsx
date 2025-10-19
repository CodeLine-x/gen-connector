import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sorry, there was an issue with your authentication. This could be
            due to:
          </p>
          <ul className="text-left text-gray-600 dark:text-gray-400 mb-6 space-y-2">
            <li>• Network connectivity issues</li>
            <li>• Expired authentication session</li>
            <li>• Browser security settings</li>
          </ul>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
