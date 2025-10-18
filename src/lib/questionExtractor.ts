// Question Extractor - Uses OpenAI to extract the first question from diarized transcript

interface Turn {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export async function extractFirstQuestion(
  conversationTurns: Turn[]
): Promise<string> {
  try {
    // Find all young_adult turns
    const youngAdultTurns = conversationTurns.filter(
      (turn) => turn.speaker === "young_adult"
    );

    if (youngAdultTurns.length === 0) {
      return "Tell me more about your experiences...";
    }

    // Get the first young_adult turn
    const firstTurn = youngAdultTurns[0];
    const transcript = firstTurn.text;

    // If the transcript is very short or has no question mark, use it directly
    if (transcript.length < 50 || !transcript.includes("?")) {
      return transcript.trim();
    }

    // Use OpenAI to extract the actual question from the transcript
    const response = await fetch("/api/extract-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      console.error(
        "Failed to extract question with OpenAI, using raw transcript"
      );
      return transcript.trim();
    }

    const { question } = await response.json();
    return question || transcript.trim();
  } catch (error) {
    console.error("Error extracting question:", error);
    return "Tell me more about your experiences...";
  }
}
