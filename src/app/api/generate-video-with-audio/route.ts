import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const maxDuration = 300; // 5 minutes for video processing
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, images, songUrl, songTitle, category } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: images array required" },
        { status: 400 }
      );
    }

    console.log(
      `🎬 Generating video montage with ${images.length} images for session ${sessionId}`
    );

    if (songUrl) {
      console.log(`🎵 Including audio track: ${songTitle || "Unknown"}`);
    }

    // For now, we'll create metadata and return instructions
    // The actual video generation with audio mixing will be handled client-side
    // or by a dedicated video processing service

    const videoMetadata = {
      sessionId,
      images: images.map((img: string, index: number) => ({
        url: img,
        order: index,
        duration: 10 / images.length, // Distribute 10 seconds across all images
      })),
      audio: songUrl
        ? {
            url: songUrl,
            title: songTitle,
            startTime: 0,
            duration: 10,
          }
        : null,
      category,
      totalDuration: 10,
      aspectRatio: "16:9",
      generatedAt: new Date().toISOString(),
    };

    // Store metadata in Vercel Blob
    const metadataBlob = await put(
      `videos/${sessionId}/metadata.json`,
      JSON.stringify(videoMetadata, null, 2),
      {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      }
    );

    console.log("✅ Video metadata stored:", metadataBlob.url);

    // Return metadata URL and instructions for client-side rendering
    return NextResponse.json({
      success: true,
      metadataUrl: metadataBlob.url,
      videoMetadata,
      message:
        "Video metadata created. Client will render slideshow with audio.",
    });
  } catch (error: unknown) {
    console.error("❌ Video generation API error:", error);
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
