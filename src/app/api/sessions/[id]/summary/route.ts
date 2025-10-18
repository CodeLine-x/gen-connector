import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createClient();

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get conversation data
    const { data: conversations, error: conversationsError } = await supabase
      .from("conversations")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (conversationsError) {
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // Get generated content
    const { data: generatedContent, error: contentError } = await supabase
      .from("generated_content")
      .select("*")
      .eq("session_id", sessionId);

    if (contentError) {
      return NextResponse.json(
        { error: "Failed to fetch generated content" },
        { status: 500 }
      );
    }

    // Generate summary using AI
    const conversationText = conversations
      .filter((conv) => conv.speaker_role === "elderly")
      .map((conv) => conv.transcript)
      .join(" ");

    if (!conversationText.trim()) {
      return NextResponse.json({
        summary: "No conversation data available",
        themes: [],
        keyQuotes: [],
        images:
          generatedContent?.filter((c) => c.content_type === "image") || [],
        videos:
          generatedContent?.filter((c) => c.content_type === "video") || [],
      });
    }

    const summaryPrompt = `Analyze this intergenerational conversation about ${session.rite_of_passage} and create a comprehensive summary:

Conversation: "${conversationText}"

Please provide:
1. A 2-3 paragraph summary of the key stories and memories shared
2. The main themes and topics discussed
3. 3-5 memorable quotes that capture the essence of the conversation
4. The emotional tone and significance of the stories

Format your response as JSON with these fields:
{
  "summary": "detailed summary text",
  "themes": ["theme1", "theme2", "theme3"],
  "keyQuotes": ["quote1", "quote2", "quote3"],
  "emotionalTone": "description of the emotional tone",
  "significance": "why these stories matter"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more accessible model
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing intergenerational conversations and extracting meaningful insights from personal stories.",
        },
        { role: "user", content: summaryPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "";

    let summaryData;
    try {
      summaryData = JSON.parse(aiResponse);
    } catch {
      // Fallback if JSON parsing fails
      summaryData = {
        summary: aiResponse,
        themes: [],
        keyQuotes: [],
        emotionalTone: "warm and nostalgic",
        significance: "These stories preserve important family memories",
      };
    }

    // Update session with summary
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        summary: summaryData.summary,
        status: "completed",
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
    }

    return NextResponse.json({
      session: {
        id: session.id,
        rite_of_passage: session.rite_of_passage,
        created_at: session.created_at,
        status: session.status,
      },
      summary: summaryData.summary,
      themes: summaryData.themes || [],
      keyQuotes: summaryData.keyQuotes || [],
      emotionalTone: summaryData.emotionalTone || "warm and nostalgic",
      significance:
        summaryData.significance ||
        "These stories preserve important family memories",
      images: generatedContent?.filter((c) => c.content_type === "image") || [],
      videos: generatedContent?.filter((c) => c.content_type === "video") || [],
      conversationCount: conversations.length,
      elderlyResponses: conversations.filter(
        (c) => c.speaker_role === "elderly"
      ).length,
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
