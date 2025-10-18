// API Route to search for songs using Exa.ai

import { NextRequest, NextResponse } from "next/server";
import { exaService } from "@/lib/exaService";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { turns } = await request.json();

    if (!turns || !Array.isArray(turns)) {
      return NextResponse.json(
        { error: "Invalid request: turns array required" },
        { status: 400 }
      );
    }

    // Step 1: Use OpenAI to analyze if the conversation mentions music
    const transcript = turns
      .map((t) => `${t.speaker}: ${t.transcript}`)
      .join("\n");

    console.log("🎵 Analyzing transcript for music mentions...");

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a music detection assistant. Analyze the conversation and determine if SPECIFIC songs, artists, or music are mentioned.

ONLY return music information if the conversation EXPLICITLY mentions:
- Specific song titles in quotes: "Yesterday", "Bohemian Rhapsody"
- Specific artist names: "by The Beatles", "from Elvis Presley"
- Specific music genres: "jazz music", "rock songs"
- Specific musical instruments: "piano piece", "guitar song"

DO NOT return music info for:
- General mentions of "music" or "songs" without specifics
- Emotional states or memories without musical context
- Vague references like "we listened to music"
- Non-musical activities or topics

Be EXTREMELY conservative. If unsure, return { "hasMusicMention": false }.

Return a JSON object with:
{
  "hasMusicMention": true/false,
  "searchQuery": "artist - song title" (only if very specific),
  "confidence": 0-1
}`,
        },
        {
          role: "user",
          content: `Analyze this conversation for SPECIFIC music mentions:\n\n${transcript}`,
        },
      ],
      temperature: 0.1, // Much lower temperature for consistency
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(
      analysisResponse.choices[0]?.message?.content || "{}"
    );

    console.log("Analysis result:", analysis);

    if (!analysis.hasMusicMention || analysis.confidence < 0.8) {
      return NextResponse.json({
        found: false,
        reason: "No specific music mentioned in conversation",
      });
    }

    // Step 2: Search for the song using Exa.ai
    const searchResult = await exaService.searchSong(analysis.searchQuery);

    if (!searchResult.found) {
      return NextResponse.json({
        found: false,
        reason: "Song not found",
        searchQuery: analysis.searchQuery,
      });
    }

    console.log(
      "✅ Song found:",
      searchResult.songTitle,
      "by",
      searchResult.artistName
    );

    return NextResponse.json({
      ...searchResult,
      searchQuery: analysis.searchQuery,
      confidence: analysis.confidence,
    });
  } catch (error: unknown) {
    console.error("❌ Song search error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        found: false,
        error: "Failed to search for song",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
