"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ImprovedSegmentedConversation from "@/components/ImprovedSegmentedConversation";
import AuthWrapper from "@/components/AuthWrapper";
import { v4 as uuidv4 } from "uuid";
import { RiteOfPassage } from "@/lib/promptTemplates";

// Category metadata for styling and display
const CATEGORY_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    colorTheme: {
      gradient: string;
      button: string;
      buttonHover: string;
      banner: string;
      bannerBorder: string;
      bannerText: string;
      spinner: string;
    };
  }
> = {
  childhood: {
    title: "Childhood",
    description: "Share memories from your early years and upbringing",
    colorTheme: {
      gradient: "from-pink-50 to-rose-100 dark:from-gray-900 dark:to-gray-800",
      button: "bg-pink-600 hover:bg-pink-700",
      buttonHover: "hover:bg-pink-700",
      banner: "bg-pink-50 dark:bg-pink-900/20",
      bannerBorder: "border-pink-200 dark:border-pink-800",
      bannerText: "text-pink-700 dark:text-pink-300",
      spinner: "border-pink-600",
    },
  },
  "school-life": {
    title: "School Life",
    description: "Share your educational experiences and school memories",
    colorTheme: {
      gradient:
        "from-yellow-50 to-amber-100 dark:from-gray-900 dark:to-gray-800",
      button: "bg-yellow-600 hover:bg-yellow-700",
      buttonHover: "hover:bg-yellow-700",
      banner: "bg-yellow-50 dark:bg-yellow-900/20",
      bannerBorder: "border-yellow-200 dark:border-yellow-800",
      bannerText: "text-yellow-700 dark:text-yellow-300",
      spinner: "border-yellow-600",
    },
  },
  "work-life": {
    title: "Work Life",
    description: "Share your career journey and professional experiences",
    colorTheme: {
      gradient: "from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800",
      button: "bg-blue-600 hover:bg-blue-700",
      buttonHover: "hover:bg-blue-700",
      banner: "bg-blue-50 dark:bg-blue-900/20",
      bannerBorder: "border-blue-200 dark:border-blue-800",
      bannerText: "text-blue-700 dark:text-blue-300",
      spinner: "border-blue-600",
    },
  },
  relationships: {
    title: "Relationships",
    description: "Share stories about friendships, family, and loved ones",
    colorTheme: {
      gradient:
        "from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800",
      button: "bg-purple-600 hover:bg-purple-700",
      buttonHover: "hover:bg-purple-700",
      banner: "bg-purple-50 dark:bg-purple-900/20",
      bannerBorder: "border-purple-200 dark:border-purple-800",
      bannerText: "text-purple-700 dark:text-purple-300",
      spinner: "border-purple-600",
    },
  },
  hobbies: {
    title: "Hobbies",
    description: "Share your passions and favorite pastimes",
    colorTheme: {
      gradient: "from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800",
      button: "bg-orange-600 hover:bg-orange-700",
      buttonHover: "hover:bg-orange-700",
      banner: "bg-orange-50 dark:bg-orange-900/20",
      bannerBorder: "border-orange-200 dark:border-orange-800",
      bannerText: "text-orange-700 dark:text-orange-300",
      spinner: "border-orange-600",
    },
  },
  community: {
    title: "Community",
    description: "Share your experiences with neighbors and community",
    colorTheme: {
      gradient:
        "from-teal-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800",
      button: "bg-teal-600 hover:bg-teal-700",
      buttonHover: "hover:bg-teal-700",
      banner: "bg-teal-50 dark:bg-teal-900/20",
      bannerBorder: "border-teal-200 dark:border-teal-800",
      bannerText: "text-teal-700 dark:text-teal-300",
      spinner: "border-teal-600",
    },
  },
};

interface ConversationPageProps {
  params: Promise<{ category: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params);
  const category = resolvedParams.category as RiteOfPassage;
  const [sessionId, setSessionId] = useState<string>("");

  // Get category config or fallback to default
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["childhood"]; // Fallback to childhood if category not found

  useEffect(() => {
    // Always generate a new session ID for a fresh conversation
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
  }, [category]); // Regenerate if category changes

  if (!sessionId) {
    return (
      <AuthWrapper>
        <div
          className={`min-h-screen bg-gradient-to-br ${config.colorTheme.gradient} flex items-center justify-center`}
        >
          <div className="text-center">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-b-2 ${config.colorTheme.spinner} mx-auto mb-4`}
            ></div>
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
      <div
        className={`min-h-screen bg-gradient-to-br ${config.colorTheme.gradient} p-4`}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
              {config.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg lg:text-xl mb-4">
              {config.description}
            </p>
            <div
              className={`${config.colorTheme.banner} border ${config.colorTheme.bannerBorder} rounded-lg p-3 mb-4`}
            >
              <p className={`text-sm ${config.colorTheme.bannerText} mb-2`}>
                ✨ <strong>Fresh Conversation</strong> - Each visit starts a new
                conversation session
              </p>
              <button
                onClick={() => window.location.reload()}
                className={`${config.colorTheme.button} text-white text-xs font-semibold py-1 px-3 rounded-lg transition-colors duration-200`}
              >
                🔄 Start Completely Fresh
              </button>
            </div>
          </div>

          {/* Conversation Interface */}
          <ImprovedSegmentedConversation
            riteOfPassage={category}
            sessionId={sessionId}
          />

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8">
            <Link
              href="/categories"
              className={`${config.colorTheme.button} text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-xl transition-colors duration-200 text-sm sm:text-base`}
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
