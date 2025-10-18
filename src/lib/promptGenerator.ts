/**
 * OpenAI Prompt Generator
 * Generates clean, descriptive prompts for image and video generation
 * from conversation segments
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationTurn {
  speaker: string;
  transcript: string;
  timestamp?: number;
}

export interface PromptGenerationResult {
  imagePrompt: string;
  videoPrompt: string;
  keywords: string[];
  era?: string; // e.g., "1960s", "1980s"
  location?: string; // e.g., "Singapore", "Malaysia"
}

/**
 * Generate image/video prompts from a conversation segment
 * Uses GPT-3.5-turbo for cost-effective prompt generation
 */
export async function generatePromptFromSegment(
  turns: ConversationTurn[],
  riteOfPassage?: string
): Promise<PromptGenerationResult> {
  try {
    console.log("🤖 Generating prompts with GPT-3.5-turbo...");

    // Extract elderly responses (they contain the memories)
    const elderlyResponses = turns
      .filter((turn) => turn.speaker === "elderly")
      .map((turn) => turn.transcript)
      .join(" ");

    // Build context
    const context = riteOfPassage
      ? `This is a ${riteOfPassage.replace(/-/g, " ")} conversation. `
      : "";

    const systemPrompt = `You are an expert at creating vivid, photorealistic image and video prompts from personal memories and stories.

Your task is to:
1. Extract the KEY VISUAL ELEMENTS from the conversation
2. Create a photorealistic image prompt (1-2 sentences, specific and descriptive)
3. Create a video prompt (1-2 sentences, with motion/action)
4. Extract keywords (max 5)
5. Identify time period/era if mentioned
6. Identify location if mentioned

Style requirements:
- Photorealistic, documentary-style
- Focus on specific details (clothing, environment, emotions)
- Avoid abstract concepts
- Include lighting and atmosphere
- For Southeast Asian context, include relevant cultural elements

Return ONLY a valid JSON object with this exact structure:
{
  "imagePrompt": "string",
  "videoPrompt": "string",
  "keywords": ["keyword1", "keyword2", ...],
  "era": "string or null",
  "location": "string or null"
}`;

    const userPrompt = `${context}
    
Elderly person's memory:
"${elderlyResponses}"

Generate photorealistic prompts for this memory. Focus on visual details, emotions, and atmosphere.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content) as PromptGenerationResult;

    console.log("✅ Prompts generated successfully");
    console.log("Image prompt:", result.imagePrompt);
    console.log("Video prompt:", result.videoPrompt);

    return result;
  } catch (error) {
    console.error("❌ Prompt generation error:", error);

    // Fallback: create basic prompts from text
    const elderlyText = turns
      .filter((turn) => turn.speaker === "elderly")
      .map((turn) => turn.transcript)
      .join(" ")
      .slice(0, 200); // First 200 chars

    return {
      imagePrompt: `A photorealistic documentary-style image depicting: ${elderlyText}. Warm lighting, nostalgic atmosphere, Southeast Asian setting.`,
      videoPrompt: `A cinematic video scene showing: ${elderlyText}. Gentle camera movement, warm tones, emotional atmosphere.`,
      keywords: ["memory", "story", "nostalgia", "documentary"],
      era: undefined,
      location: undefined,
    };
  }
}

/**
 * Generate a comprehensive video prompt from multiple segments
 * Used for end-of-session video generation
 */
export async function generateVideoPromptFromSession(
  allTurns: ConversationTurn[],
  riteOfPassage?: string,
  memories: any[] = []
): Promise<PromptGenerationResult> {
  try {
    console.log("🎬 Generating session video prompt with GPT-3.5-turbo...");

    // Extract all elderly responses
    const elderlyResponses = allTurns
      .filter((turn) => turn.speaker === "elderly")
      .map((turn) => turn.transcript)
      .join(" ");

    const context = riteOfPassage
      ? `This is a complete ${riteOfPassage.replace(/-/g, " ")} conversation. `
      : "";

    const systemPrompt = `You are an expert at creating compelling video prompts that capture the essence of personal stories and memories.

Your task is to:
1. Synthesize the OVERALL NARRATIVE and emotional arc
2. Create a cinematic video prompt (2-3 sentences, with movement and emotion)
3. Suggest a visual style that fits the story
4. Extract key themes and keywords
5. Identify the primary time period and location

The video should feel like a documentary or memory reel - nostalgic, emotional, and authentic.

Return ONLY a valid JSON object with this exact structure:
{
  "imagePrompt": "string (for thumbnail)",
  "videoPrompt": "string (detailed, cinematic)",
  "keywords": ["keyword1", "keyword2", ...],
  "era": "string or null",
  "location": "string or null"
}`;

    // Include memories for richer context
    const memoryContext =
      memories.length > 0
        ? `\n\nPrevious memories and context:\n${memories
            .map((m) => `- ${m.text}`)
            .join("\n")}`
        : "";

    const userPrompt = `${context}
    
Complete conversation memories:
"${elderlyResponses.slice(0, 1500)}" ${
      elderlyResponses.length > 1500 ? "..." : ""
    }${memoryContext}

Generate a cinematic video prompt that captures the essence and emotional journey of this conversation, incorporating the broader context and previous memories.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content) as PromptGenerationResult;

    console.log("✅ Session video prompt generated successfully");
    console.log("Video prompt:", result.videoPrompt);

    return result;
  } catch (error) {
    console.error("❌ Session video prompt generation error:", error);

    // Fallback
    const summary = allTurns
      .filter((turn) => turn.speaker === "elderly")
      .map((turn) => turn.transcript)
      .join(" ")
      .slice(0, 300);

    return {
      imagePrompt: `A nostalgic documentary-style montage representing: ${summary}`,
      videoPrompt: `A cinematic memory reel showing the journey and emotions of: ${summary}. Gentle transitions, warm nostalgic tones, emotional storytelling.`,
      keywords: [
        "life story",
        "memories",
        "documentary",
        "nostalgia",
        "journey",
      ],
      era: undefined,
      location: undefined,
    };
  }
}
