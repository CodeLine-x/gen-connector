import { NextRequest, NextResponse } from "next/server";
import { createMem0Service } from "@/lib/mem0Service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, metadata, entityId } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const mem0 = createMem0Service();

    // Add memory with entity ID and metadata
    const memory = await mem0.addMemory({
      text,
      metadata: {
        ...metadata,
        entity_id: entityId,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("✅ Memory added:", memory.id);

    return NextResponse.json({
      success: true,
      memory,
    });
  } catch (error: unknown) {
    console.error("❌ Mem0 API error:", error);
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
