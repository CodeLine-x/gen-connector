import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

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

    console.log(`Uploading file to: ${path} (${file.size} bytes)`);

    const blob = await put(path, file, {
      access: "public",
      contentType: contentType || file.type,
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
