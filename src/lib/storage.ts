import { createClient } from "@/lib/supabase/client";

export interface StorageFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

class StorageService {
  private supabase = createClient();

  /**
   * Upload audio file to Supabase Storage
   */
  async uploadAudio(
    file: Blob,
    sessionId: string,
    filename?: string
  ): Promise<StorageFile> {
    const fileName = filename || `audio-${Date.now()}.webm`;
    const filePath = `audio-recordings/${sessionId}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from("audio-recordings")
      .upload(filePath, file, {
        contentType: "audio/webm",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from("audio-recordings")
      .getPublicUrl(filePath);

    return {
      name: fileName,
      url: urlData.publicUrl,
      size: file.size,
      type: "audio/webm",
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Upload generated image to Supabase Storage
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

    const { data, error } = await this.supabase.storage
      .from("generated-images")
      .upload(filePath, imageBlob, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from("generated-images")
      .getPublicUrl(filePath);

    return {
      name: fileName,
      url: urlData.publicUrl,
      size: imageBlob.size,
      type: "image/png",
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Upload video file to Supabase Storage
   */
  async uploadVideo(
    videoBlob: Blob,
    sessionId: string,
    filename?: string
  ): Promise<StorageFile> {
    const fileName = filename || `video-${Date.now()}.mp4`;
    const filePath = `generated-videos/${sessionId}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from("generated-videos")
      .upload(filePath, videoBlob, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload video: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from("generated-videos")
      .getPublicUrl(filePath);

    return {
      name: fileName,
      url: urlData.publicUrl,
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
      this.getFilesFromBucket("audio-recordings", sessionId),
      this.getFilesFromBucket("generated-images", sessionId),
      this.getFilesFromBucket("generated-videos", sessionId),
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
  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get files from a specific bucket and session
   */
  private async getFilesFromBucket(
    bucket: string,
    sessionId: string
  ): Promise<StorageFile[]> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(sessionId);

    if (error) {
      console.error(`Error listing files from ${bucket}:`, error);
      return [];
    }

    return data.map((file) => ({
      name: file.name,
      url: "", // Will be populated with public URL if needed
      size: file.metadata?.size || 0,
      type: file.metadata?.mimetype || "unknown",
      uploadedAt: file.created_at,
    }));
  }

  /**
   * Create storage buckets if they don't exist
   */
  async initializeBuckets(): Promise<void> {
    const buckets = [
      "audio-recordings",
      "generated-images",
      "generated-videos",
      "archive-images",
    ];

    for (const bucket of buckets) {
      const { data, error } = await this.supabase.storage.getBucket(bucket);

      if (error && error.message.includes("not found")) {
        // Create bucket if it doesn't exist
        const { error: createError } = await this.supabase.storage.createBucket(
          bucket,
          {
            public: true,
            allowedMimeTypes:
              bucket === "audio-recordings"
                ? ["audio/webm", "audio/mp3", "audio/wav"]
                : bucket === "generated-images" || bucket === "archive-images"
                ? ["image/png", "image/jpeg", "image/webp"]
                : ["video/mp4", "video/webm"],
            fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          }
        );

        if (createError) {
          console.error(`Failed to create bucket ${bucket}:`, createError);
        }
      }
    }
  }
}

export const storageService = new StorageService();

// Standalone function for easy import
export async function uploadAudio(
  audioBlob: Blob,
  path: string
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("audio-recordings") // You'll need to create this bucket in Supabase
    .upload(path, audioBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "audio/webm",
    });

  if (error) {
    console.error("Error uploading audio:", error);
    throw new Error("Failed to upload audio to storage.");
  }

  const { data: publicUrlData } = supabase.storage
    .from("audio-recordings")
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}
