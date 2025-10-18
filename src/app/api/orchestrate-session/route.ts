import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { GlobalContext } from "@/lib/aiHandlers/SessionAIOrchestrator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, context } = (await request.json()) as {
      sessionId: string;
      context: GlobalContext;
    };

    if (!sessionId || !context) {
      return NextResponse.json(
        { error: "Session ID and context are required" },
        { status: 400 }
      );
    }

    console.log(`🎬 Orchestrating session: ${sessionId}`);
    console.log(
      `Context: ${context.totalSegments} segments, ${context.totalTurns} turns`
    );

    // Build comprehensive prompt for AI
    const systemPrompt = `You are an AI orchestrator for intergenerational memory preservation.

Your task is to analyze an entire conversation between an elderly person and a young adult, then create an optimal action plan for:
1. Song searches (Spotify/YouTube)
2. Archive image searches (Singapore National Archives)
3. AI image generation (fal.ai FLUX Pro)

CONTEXT:
- Total segments: ${context.totalSegments}
- Total conversation turns: ${context.totalTurns}
- Identified themes: ${context.themes.join(", ")}

ELDERLY RESPONSES (Most important):
${context.elderlyTranscripts.slice(0, 10).join("\n")}

OPTIMIZATION RULES:
1. Maximum 3 song searches (pick the most meaningful ones)
2. Maximum 5 archive image searches (focus on Singapore locations/events)
3. Maximum 5 AI image generations (for personal memories without archive photos)
4. Avoid redundancy - if multiple segments mention the same thing, consolidate
5. Prioritize quality over quantity

ACTION PRIORITY:
1. Song search (if specific song/artist mentioned) - Priority 1
2. Archive image search (if Singapore location/event mentioned) - Priority 2
3. AI image generation (for personal/abstract memories) - Priority 3

Respond with a JSON object:
{
  "actionPlan": {
    "songs": [
      {
        "priority": 1,
        "keywords": { "artist": "...", "title": "...", "year": 1970 },
        "context": "...",
        "segmentNumbers": [1, 3]
      }
    ],
    "imageSearches": [
      {
        "priority": 1,
        "keywords": ["singapore", "chinatown", "1960s"],
        "location": "Chinatown",
        "timePeriod": "1960s",
        "context": "...",
        "segmentNumbers": [2, 4]
      }
    ],
    "imageGenerations": [
      {
        "priority": 1,
        "prompt": "...",
        "style": "nostalgic vintage photograph, 1960s Singapore, warm tones",
        "context": "...",
        "segmentNumbers": [5]
      }
    ],
    "totalCost": 0.50,
    "estimatedTime": 45
  },
  "reasoning": "..."
}`;

    // Call OpenAI for orchestration
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this conversation and create an optimal action plan.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();

    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let orchestrationResult;
    try {
      orchestrationResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", responseText);

      // Return fallback plan
      return NextResponse.json({
        actionPlan: {
          songs: [],
          imageSearches: [],
          imageGenerations: [
            {
              priority: 1,
              prompt: context.elderlyTranscripts[0] || "A nostalgic memory",
              style: "nostalgic vintage photograph, warm tones",
              context: "Fallback image generation",
              segmentNumbers: [1],
            },
          ],
          totalCost: 0.1,
          estimatedTime: 15,
        },
        reasoning: "Fallback plan (AI parsing failed)",
      });
    }

    console.log("✅ Orchestration complete");
    console.log(
      `Plan: ${orchestrationResult.actionPlan.songs?.length || 0} songs, ${
        orchestrationResult.actionPlan.imageSearches?.length || 0
      } searches, ${
        orchestrationResult.actionPlan.imageGenerations?.length || 0
      } generations`
    );

    return NextResponse.json(orchestrationResult);
  } catch (error: unknown) {
    console.error("Error in session orchestration:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to orchestrate session", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to orchestrate session" },
      { status: 500 }
    );
  }
}
