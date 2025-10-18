"use client";

import { useState, useEffect } from "react";
import ConversationInterface from "@/components/ConversationInterface";
import AuthWrapper from "@/components/AuthWrapper";
import { v4 as uuidv4 } from "uuid";

export default function Marriage() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generate or retrieve session ID from localStorage
    const storedSessionId = localStorage.getItem("marriage-session");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      localStorage.setItem("marriage-session", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  if (!sessionId) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full">
          <ConversationInterface
            riteOfPassage="marriage"
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
