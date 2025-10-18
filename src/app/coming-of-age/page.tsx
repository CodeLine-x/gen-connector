"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ConversationInterface from "@/components/ConversationInterface";
import AuthWrapper from "@/components/AuthWrapper";
import { v4 as uuidv4 } from "uuid";

export default function ComingOfAge() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate or retrieve session ID from localStorage
    const storedSessionId = localStorage.getItem("coming-of-age-session");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      localStorage.setItem("coming-of-age-session", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  if (!sessionId) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading session...
            </p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
              Coming of Age
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg lg:text-xl">
              Navigate the transition to adulthood through conversation
            </p>
          </div>

          {/* Conversation Interface */}
          <ConversationInterface
            riteOfPassage="coming-of-age"
            sessionId={sessionId}
          />

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8">
            <Link
              href="/categories"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-xl transition-colors duration-200 text-sm sm:text-base"
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
    </AuthWrapper>
  );
}
