import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationTurn {
  speaker: "elderly" | "young_adult";
  transcript: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory, riteOfPassage } = await request.json();

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: "Invalid conversation history" },
        { status: 400 }
      );
    }

    // Extract themes and keywords from elderly responses
    const elderlyResponses = conversationHistory
      .filter((turn: ConversationTurn) => turn.speaker === "elderly")
      .map((turn: ConversationTurn) => turn.transcript)
      .join(" ");

    // Create context-aware prompt for the young adult
    const systemPrompt = `You are an AI assistant helping a young adult conduct meaningful conversations with their elderly family member about ${riteOfPassage}. 

Based on what the elderly person has shared, generate 2-3 thoughtful follow-up questions that:
1. Show genuine interest in their experiences
2. Encourage deeper storytelling
3. Connect their past to the present
4. Are respectful and age-appropriate

Focus on themes like: family, traditions, challenges overcome, life lessons, historical context, personal growth.

Keep questions conversational and natural, not interview-like.`;

    const userPrompt = `The elderly person has shared: "${elderlyResponses}"

Generate 2-3 follow-up questions for the young adult to ask. Make them specific to what was just shared and encourage deeper conversation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more accessible model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const generatedText = completion.choices[0]?.message?.content || "";

    // Extract individual questions
    const questions = generatedText
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0 && line.includes("?"))
      .slice(0, 3); // Limit to 3 questions

    // Fallback questions if AI generation fails or returns empty
    const fallbackQuestions = [
      "Can you tell me more about that?",
      "What was that experience like for you?",
      "How did that make you feel?",
    ];

    const finalQuestions = questions.length > 0 ? questions : fallbackQuestions;

    return NextResponse.json({
      questions: finalQuestions,
      themes: extractThemes(elderlyResponses),
      originalResponse: generatedText,
    });
  } catch (error: unknown) {
    console.error("Prompt generation error:", error);

    // Handle specific OpenAI API errors
    if (error.code === "model_not_found") {
      return NextResponse.json(
        {
          error: "AI model not available. Please check your OpenAI API access.",
        },
        { status: 503 }
      );
    }

    if (error.code === "insufficient_quota") {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please check your billing." },
        { status: 402 }
      );
    }

    // Return fallback questions even if API fails
    const fallbackQuestions = [
      "Can you tell me more about that?",
      "What was that experience like for you?",
      "How did that make you feel?",
    ];

    return NextResponse.json({
      questions: fallbackQuestions,
      themes: [],
      originalResponse: "Fallback questions due to API error",
      error: "Using fallback questions due to API error",
    });
  }
}

function extractThemes(text: string): string[] {
  const commonThemes = [
    "family",
    "work",
    "education",
    "marriage",
    "children",
    "friendship",
    "traditions",
    "food",
    "music",
    "travel",
    "challenges",
    "happiness",
    "technology",
    "community",
    "religion",
    "politics",
    "war",
    "peace",
  ];

  const lowerText = text.toLowerCase();
  return commonThemes.filter((theme) => lowerText.includes(theme));
}
