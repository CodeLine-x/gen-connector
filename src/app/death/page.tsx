"use client";

import { useState, useEffect } from "react";
import ConversationInterface from "@/components/ConversationInterface";
import AuthWrapper from "@/components/AuthWrapper";
import { v4 as uuidv4 } from "uuid";

export default function Death() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Always generate a new session ID for a fresh conversation
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
  }, []);

  if (!sessionId) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
          <ConversationInterface
            riteOfPassage="death"
            sessionId={sessionId}
            onSessionUpdate={(sessionData) =>
              console.log("Session updated:", sessionData)
            }
          />
        </div>
      </div>
    </AuthWrapper>
  );
}
