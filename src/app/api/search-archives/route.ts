import { NextRequest, NextResponse } from "next/server";
import { archiveService } from "@/lib/archiveService";

export async function POST(request: NextRequest) {
  try {
    const { conversationText, filters } = await request.json();

    if (!conversationText || typeof conversationText !== "string") {
      return NextResponse.json(
        { error: "Conversation text is required" },
        { status: 400 }
      );
    }

    // Get relevant images based on conversation
    const images = await archiveService.getRelevantImages(conversationText);

    // Extract context for additional metadata
    const context = archiveService.extractContext(conversationText);

    return NextResponse.json({
      images,
      context,
      searchQuery: archiveService.generateSearchQuery(context),
      totalResults: images.length,
    });
  } catch (error) {
    console.error("Archive search error:", error);
    return NextResponse.json(
      { error: "Failed to search archives" },
      { status: 500 }
    );
  }
}
