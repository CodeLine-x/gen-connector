import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    return NextResponse.json({
      success: true,
      environment: {
        assemblyApiKey: assemblyApiKey ? "✅ Set" : "❌ Not set",
        openaiApiKey: openaiApiKey ? "✅ Set" : "❌ Not set",
        supabaseUrl: supabaseUrl ? "✅ Set" : "❌ Not set",
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Environment test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test environment",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
