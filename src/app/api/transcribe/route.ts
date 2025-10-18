import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert audio to the format expected by Whisper
    const audioBuffer = await audioFile.arrayBuffer();

    // Create a File object with the correct MIME type for Whisper
    const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
    const audioFileForWhisper = new File([audioBlob], "audio.webm", {
      type: "audio/webm",
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForWhisper,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    return NextResponse.json({
      transcript: transcription.text,
      segments:
        transcription.segments?.map((segment) => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
        })) || [],
      language: transcription.language,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
