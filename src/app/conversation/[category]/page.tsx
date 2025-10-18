"use client";

import { useState, useEffect, use } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import ConversationFlow from "@/components/ConversationFlow";
import { v4 as uuidv4 } from "uuid";
import { RiteOfPassage } from "@/lib/promptTemplates";

interface ConversationPageProps {
  params: Promise<{ category: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params);
  const category = resolvedParams.category as RiteOfPassage;
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Always generate a new session ID for a fresh conversation
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
  }, [category]);

  if (!sessionId) {
    return (
      <AuthWrapper>
        <div className="h-screen w-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading session...</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <ConversationFlow category={category} sessionId={sessionId} />
    </AuthWrapper>
  );
}
