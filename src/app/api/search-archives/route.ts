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

    // Extract context for additional metadata
    const context = archiveService.extractContext(conversationText);

    // Generate search query
    const searchQuery = archiveService.generateSearchQuery(context);

    // Get relevant images based on conversation with optional filters
    const images = await archiveService.searchArchives(searchQuery, filters);

    return NextResponse.json({
      images,
      context,
      searchQuery,
      totalResults: images.length,
      filters: filters || null,
    });
  } catch (error) {
    console.error("Archive search error:", error);
    return NextResponse.json(
      { error: "Failed to search archives" },
      { status: 500 }
    );
  }
}
