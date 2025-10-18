import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error("Environment test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test environment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
