import { NextRequest, NextResponse } from "next/server";
import { createMem0Service, SearchParams } from "@/lib/mem0Service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, entityId, limit = 10 } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const mem0 = createMem0Service();

    // Search memories with optional entity filtering
    const searchParams: SearchParams = {
      query,
      limit,
    };

    // Only add metadata if entityId is provided
    if (entityId) {
      searchParams.metadata = { entity_id: entityId };
    }

    const results = await mem0.searchMemories(searchParams);

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
