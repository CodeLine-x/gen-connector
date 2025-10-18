import { NextRequest, NextResponse } from "next/server";
import { createMem0Service } from "@/lib/mem0Service";

export async function GET(request: NextRequest) {
  try {
    const mem0 = createMem0Service();

    // Test basic connectivity
    const project = await mem0.getProject();

    return NextResponse.json({
      success: true,
      message: "Mem0 connection successful!",
      project: project,
    });
  } catch (error: unknown) {
    console.error("❌ Mem0 test error:", error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, entityId } = body;

    const mem0 = createMem0Service();

    if (action === "add") {
      // Test adding a memory
      const memory = await mem0.addMemory({
        text: text || "Test memory from API",
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
        entityId: entityId || "test-entity",
      });

      return NextResponse.json({
        success: true,
        message: "Memory added successfully!",
        memory,
      });
    } else if (action === "search") {
      // Test searching memories
      const results = await mem0.searchMemories({
        query: text || "test",
        entityId: entityId || "test-entity",
        limit: 5,
      });

      return NextResponse.json({
        success: true,
        message: "Memory search successful!",
        results,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'add' or 'search'" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("❌ Mem0 test error:", error);
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
