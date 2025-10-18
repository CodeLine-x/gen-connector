import { put, list, del } from "@vercel/blob";

export interface StorageFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

class StorageService {
  /**
   * Upload audio file to Vercel Blob (via API route for client-side compatibility)
   */
  async uploadAudio(
    file: Blob,
    sessionId: string,
    filename?: string
  ): Promise<StorageFile> {
    const fileName = filename || `audio-${Date.now()}.webm`;
    const filePath = `audio-recordings/${sessionId}/${fileName}`;

    // Use API route for client-side uploads
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", filePath);
    formData.append("contentType", "audio/webm");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();

    return {
      name: fileName,
      url: data.url,
      size: file.size,
      type: "audio/webm",
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Upload generated image to Vercel Blob (via API route for client-side compatibility)
   */
  async uploadImage(
    imageUrl: string,
    sessionId: string,
    prompt: string
  ): Promise<StorageFile> {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    const imageBlob = await response.blob();

    const fileName = `image-${Date.now()}.png`;
    const filePath = `generated-images/${sessionId}/${fileName}`;

    // Use API route for client-side uploads
    const formData = new FormData();
    formData.append("file", imageBlob);
    formData.append("path", filePath);
    formData.append("contentType", "image/png");

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await uploadResponse.json();

    return {
      name: fileName,
      url: data.url,
      size: imageBlob.size,
      type: "image/png",
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Upload video file to Vercel Blob (via API route for client-side compatibility)
   */
  async uploadVideo(
    videoBlob: Blob,
    sessionId: string,
    filename?: string
  ): Promise<StorageFile> {
    const fileName = filename || `video-${Date.now()}.mp4`;
    const filePath = `generated-videos/${sessionId}/${fileName}`;

    // Use API route for client-side uploads
    const formData = new FormData();
    formData.append("file", videoBlob);
    formData.append("path", filePath);
    formData.append("contentType", "video/mp4");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();

    return {
      name: fileName,
      url: data.url,
      size: videoBlob.size,
      type: "video/mp4",
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all files for a session
   */
  async getSessionFiles(sessionId: string): Promise<{
    audio: StorageFile[];
    images: StorageFile[];
    videos: StorageFile[];
  }> {
    const [audioFiles, imageFiles, videoFiles] = await Promise.all([
      this.getFilesFromPrefix(`audio-recordings/${sessionId}`),
      this.getFilesFromPrefix(`generated-images/${sessionId}`),
      this.getFilesFromPrefix(`generated-videos/${sessionId}`),
    ]);

    return {
      audio: audioFiles,
      images: imageFiles,
      videos: videoFiles,
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(url: string): Promise<void> {
    await del(url);
  }

  /**
   * Get files from a specific prefix
   */
  private async getFilesFromPrefix(prefix: string): Promise<StorageFile[]> {
    try {
      const { blobs } = await list({ prefix });

      return blobs.map((blob) => ({
        name: blob.pathname.split("/").pop() || "",
        url: blob.url,
        size: blob.size,
        type: this.getContentType(blob.pathname),
        uploadedAt: blob.uploadedAt.toISOString(),
      }));
    } catch (error) {
      console.error(`Error listing files from ${prefix}:`, error);
      return [];
    }
  }

  /**
   * Get content type from file path
   */
  private getContentType(pathname: string): string {
    const ext = pathname.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "webm":
        return "audio/webm";
      case "mp3":
        return "audio/mp3";
      case "wav":
        return "audio/wav";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "webp":
        return "image/webp";
      case "mp4":
        return "video/mp4";
      default:
        return "application/octet-stream";
    }
  }
}

export const storageService = new StorageService();

// Standalone function for easy import (uses API route for client-side uploads)
export async function uploadAudio(
  audioBlob: Blob,
  path: string
): Promise<string> {
  try {
    // Use the API route for uploads (works on both client and server)
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("path", path);
    formData.append("contentType", "audio/webm");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw new Error("Failed to upload audio to storage.");
  }
}
