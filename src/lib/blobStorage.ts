/**
 * Blob Storage Service
 * Downloads remote files (from Fal.ai) and uploads them to Vercel Blob for permanent storage
 */

/**
 * Download a file from a URL and upload it to Vercel Blob
 */
export async function downloadAndUploadToBlob(
  sourceUrl: string,
  filename: string,
  contentType: string = "image/png"
): Promise<string> {
  try {
    console.log(`📥 Downloading file from: ${sourceUrl}`);

    // Download the file from the source URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BlobStorage/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();

    // Check file size (max 25MB for Vercel functions)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (blob.size > maxSize) {
      throw new Error(
        `File too large: ${blob.size} bytes (max ${maxSize} bytes)`
      );
    }

    console.log(`✅ Downloaded ${blob.size} bytes`);

    // Upload to Vercel Blob via our API route
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("path", filename); // Add the path parameter
    formData.append("contentType", contentType); // Add content type

    // Determine the upload URL (client vs server)
    const uploadUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/upload`
          : "http://localhost:3000/api/upload"
        : "/api/upload";

    console.log(`📤 Uploading to Vercel Blob: ${filename}`);

    // Add timeout to upload process
    const uploadController = new AbortController();
    const uploadTimeoutId = setTimeout(() => uploadController.abort(), 60000); // 60 second timeout

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      signal: uploadController.signal,
    });

    clearTimeout(uploadTimeoutId);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log(`✅ Uploaded to Vercel Blob: ${uploadData.url}`);

    return uploadData.url;
  } catch (error) {
    console.error("❌ Error downloading and uploading to blob:", error);
    throw error;
  }
}

/**
 * Upload an image to Vercel Blob (from Fal.ai URL)
 */
export async function uploadImageToBlob(
  falImageUrl: string,
  sessionId: string,
  segmentNumber: number
): Promise<string> {
  const filename = `session-${sessionId}/segment-${segmentNumber}-image-${Date.now()}.png`;
  return downloadAndUploadToBlob(falImageUrl, filename, "image/png");
}

/**
 * Upload a video to Vercel Blob (from Fal.ai URL)
 */
export async function uploadVideoToBlob(
  falVideoUrl: string,
  sessionId: string
): Promise<string> {
  const filename = `session-${sessionId}/video-${Date.now()}.mp4`;
  return downloadAndUploadToBlob(falVideoUrl, filename, "video/mp4");
}
