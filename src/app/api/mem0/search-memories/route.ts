import { NextRequest, NextResponse } from "next/server";
import { createMem0Service } from "@/lib/mem0Service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, entityId, limit = 10 } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const mem0 = createMem0Service();

    // Search memories with optional entity filtering
    const results = await mem0.searchMemories({
      query,
      metadata: entityId ? { entity_id: entityId } : undefined,
      limit,
    });

    console.log(`🔍 Found ${results.total} memories for query: "${query}"`);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: unknown) {
    console.error("❌ Mem0 search error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
