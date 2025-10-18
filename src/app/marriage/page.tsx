import ConversationInterface from "@/components/ConversationInterface";

export default function Marriage() {
  // In a real app, you'd get the session ID from a user session or create a new one
  const sessionId = "marriage-session-123"; // Placeholder for now

  return (
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
  );
}
