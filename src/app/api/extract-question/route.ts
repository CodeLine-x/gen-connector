// API Route to extract the first question from a transcript using OpenAI

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // Use OpenAI to extract the question
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts questions from transcripts. 
The transcript may contain audio events like (humming), (clears throat), (singing), etc., and multiple sentences.
Your task is to find and extract ONLY the first actual question being asked.
Return ONLY the question text, nothing else. If there are multiple questions, return only the first one.
If no question is found, return the most relevant statement.`,
        },
        {
          role: "user",
          content: `Extract the first question from this transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const question =
      completion.choices[0]?.message?.content?.trim() || transcript;

    return NextResponse.json({ question });
  } catch (error: unknown) {
    console.error("Error extracting question:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to extract question", details: errorMessage },
      { status: 500 }
    );
  }
}
