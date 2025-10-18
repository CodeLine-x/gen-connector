import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Note: For App Router, body size limits are handled by Vercel's function configuration
// The maxDuration and dynamic exports below are the correct way to configure this route

// Route segment config for App Router
export const maxDuration = 60; // Max 60 seconds for upload
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not configured!");
      return NextResponse.json(
        {
          error:
            "Storage not configured. Please set BLOB_READ_WRITE_TOKEN in .env.local",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    const contentType = formData.get("contentType") as string;

    if (!file || !path) {
      return NextResponse.json(
        { error: "File and path are required" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Vercel functions)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
        },
        { status: 413 }
      );
    }

    // Validate file type
    if (!file.type || file.type === "application/octet-stream") {
      console.warn(
        `Unknown file type: ${file.type}, using provided contentType: ${contentType}`
      );
    }

    console.log(`Uploading file to: ${path} (${file.size} bytes)`);

    const blob = await put(path, file, {
      access: "public",
      contentType: contentType || file.type || "application/octet-stream",
      addRandomSuffix: true, // Prevents conflicts if same filename uploaded
    });

    console.log(`✅ File uploaded successfully: ${blob.url}`);

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    // More detailed error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
