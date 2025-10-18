import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, lastActionType } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // System prompt for AI analysis
    const systemPrompt = `You are an AI assistant that analyzes elderly people's memories and stories to determine the best multimedia action.

Your task is to analyze the transcript and determine ONE of these actions:
1. "song_search" - If the elderly mentions:
   - Specific songs, artists, or music
   - Singing, dancing to music
   - Radio shows, concerts
   - Musical memories
   
2. "image_search" - If the elderly mentions:
   - Specific locations (Singapore streets, buildings, landmarks)
   - Historical events
   - Places they visited
   - Specific time periods or eras
   
3. "image_generation" - If the elderly mentions:
   - Personal experiences or scenes that are hard to find in archives
   - Abstract memories or feelings
   - Family gatherings or personal events
   - Descriptions of scenes that need to be visualized

4. "none" - If the transcript doesn't contain enough specific information

IMPORTANT RULES:
- Priority: song_search > image_search > image_generation
- If the last action was "${
      lastActionType || "none"
    }", try to choose a DIFFERENT action type if possible
- Avoid consecutive duplicate actions
- Only choose an action if there's clear evidence in the transcript

Respond with ONLY a JSON object:
{
  "actionType": "song_search" | "image_search" | "image_generation" | "none",
  "reasoning": "brief explanation",
  "keywords": {
    // For song_search: { "artist": "...", "title": "...", "year": ... }
    // For image_search: { "keywords": [...], "location": "...", "time_period": "..." }
    // For image_generation: { "description": "...", "keywords": [...] }
  }
}`;

    const userPrompt = `Transcript: "${transcript}"

Last action type: ${lastActionType || "none"}

Analyze the transcript and determine the best action.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();

    if (!responseText) {
      console.warn("Empty response from OpenAI");
      return NextResponse.json({
        actionType: "none",
        reasoning: "No analysis available",
        keywords: null,
      });
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.log("Raw response:", responseText);
      return NextResponse.json({
        actionType: "none",
        reasoning: "Analysis parsing failed",
        keywords: null,
      });
    }

    console.log("AI Analysis result:", analysis);

    return NextResponse.json({
      actionType: analysis.actionType || "none",
      reasoning: analysis.reasoning || "",
      keywords: analysis.keywords || null,
    });
  } catch (error: unknown) {
    console.error("Error in analyze-segment API:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to analyze segment", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze segment" },
      { status: 500 }
    );
  }
}
