"use client";

import { useState, useEffect, use } from "react";
import ConversationFlow from "@/components/ConversationFlow";
import { v4 as uuidv4 } from "uuid";
import { RiteOfPassage } from "@/lib/promptTemplates";
import { createClient } from "@/lib/supabase/client";

interface ConversationPageProps {
  params: Promise<{ category: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params);
  const category = resolvedParams.category as RiteOfPassage;
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    // Always generate a new session ID for a fresh conversation
    const newSessionId = uuidv4();
    setSessionId(newSessionId);

    // Get or create user ID (authenticated or anonymous)
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Use authenticated user ID
        setUserId(user.id);
      } else {
        // Create/get anonymous user ID from localStorage
        let anonymousId = localStorage.getItem('anonymous_user_id');
        if (!anonymousId) {
          anonymousId = `anon_${uuidv4()}`;
          localStorage.setItem('anonymous_user_id', anonymousId);
        }
        setUserId(anonymousId);
      }
    };

    initializeUser();
  }, [category, supabase]);

  if (!sessionId || !userId) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  return <ConversationFlow category={category} sessionId={sessionId} userId={userId} />;
}
