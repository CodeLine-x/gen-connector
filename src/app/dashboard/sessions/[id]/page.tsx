"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  speaker_role: string;
  transcript: string;
  audio_url?: string;
  timestamp: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    model?: string;
  };
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
  metadata?: {
    duration?: number;
    format?: string;
    resolution?: string;
    fps?: number;
  };
}

interface SessionData {
  session: {
    id: string;
    rite_of_passage: string;
    created_at: string;
    status: string;
    title?: string;
    summary?: string;
  };
  summary: string;
  themes: string[];
  keyQuotes: string[];
  emotionalTone: string;
  significance: string;
  images: GeneratedImage[];
  videos: GeneratedVideo[];
  conversationCount: number;
  elderlyResponses: number;
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Check authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Fetch session summary
        const summaryResponse = await fetch(
          `/api/sessions/${resolvedParams.id}/summary`
        );
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSessionData(summaryData);
        }

        // Fetch conversations
        const { data: conversationsData, error: conversationsError } =
          await supabase
            .from("conversations")
            .select("*")
            .eq("session_id", resolvedParams.id)
            .order("timestamp", { ascending: true });

        if (conversationsError) {
          console.error("Error fetching conversations:", conversationsError);
        } else {
          setConversations(conversationsData || []);
        }
      } catch (err) {
        console.error("Error fetching session data:", err);
        setError("Failed to load session data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [resolvedParams.id, router, supabase]);

  const getRiteOfPassageEmoji = (rite: string) => {
    switch (rite) {
      case "birth-childhood":
        return "👶";
      case "coming-of-age":
        return "🌱";
      case "marriage":
        return "💍";
      case "death":
        return "🕊️";
      default:
        return "📖";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error ||
              "This session doesn't exist or you don't have access to it."}
          </p>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Session Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-4xl">
              {getRiteOfPassageEmoji(
                sessionData.session?.rite_of_passage || "unknown"
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessionData.session?.title ||
                  sessionData.session?.rite_of_passage
                    ?.replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                  "Unknown Session"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {sessionData.session?.created_at
                  ? formatDate(sessionData.session.created_at)
                  : "Unknown date"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                Status:
              </span>
              <span className="ml-2 text-gray-900 dark:text-white capitalize">
                {sessionData.session?.status || "Unknown"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                Conversations:
              </span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {sessionData.conversationCount}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                Elderly Responses:
              </span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {sessionData.elderlyResponses}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                Images:
              </span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {sessionData.images.length}
              </span>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {sessionData.summary && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AI Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {sessionData.summary}
            </p>
          </div>
        )}

        {/* Themes and Quotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {sessionData.themes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {sessionData.themes.map((theme, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sessionData.keyQuotes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Memorable Quotes
              </h3>
              <div className="space-y-3">
                {sessionData.keyQuotes.map((quote, index) => (
                  <blockquote
                    key={index}
                    className="text-gray-700 dark:text-gray-300 italic border-l-4 border-blue-500 pl-4"
                  >
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversation History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Conversation History
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 rounded-lg ${
                  conversation.speaker_role === "elderly"
                    ? "bg-gray-100 dark:bg-gray-700"
                    : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm">
                    {conversation.speaker_role === "elderly"
                      ? "Elderly (Grandparent)"
                      : "Young Adult (Grandchild)"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(conversation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {conversation.transcript}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Generated Content */}
        {(sessionData.images.length > 0 || sessionData.videos.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generated Content
            </h3>

            {sessionData.images.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Images ({sessionData.images.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sessionData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image.url}
                        alt={`Generated image ${index + 1}`}
                        width={200}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sessionData.videos.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Videos ({sessionData.videos.length})
                </h4>
                <div className="space-y-4">
                  {sessionData.videos.map((video, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <video
                        src={video.url}
                        controls
                        className="w-full max-w-md rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
