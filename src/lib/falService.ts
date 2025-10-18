/**
 * Fal.ai Service
 * Handles image and video generation using Fal.ai API
 */

import * as fal from "@fal-ai/serverless-client";

// Configure Fal.ai with API key
fal.config({
  credentials: process.env.FAL_KEY,
});

export interface ImageGenerationParams {
  prompt: string;
  imageSize?:
    | "square_hd"
    | "square"
    | "portrait_4_3"
    | "portrait_16_9"
    | "landscape_4_3"
    | "landscape_16_9";
  numInferenceSteps?: number;
  seed?: number;
  guidanceScale?: number;
  numImages?: number;
  enableSafetyChecker?: boolean;
}

export interface ImageGenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export interface VideoGenerationParams {
  prompt: string;
  duration?: number; // Duration in seconds (1-10, max for seedance/lite model)
  aspectRatio?: "16:9" | "9:16" | "1:1";
  seed?: number;
}

export interface VideoGenerationResult {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  seed: number;
  prompt: string;
}

/**
 * Generate an image using Fal.ai nano-banana model
 * Photorealistic, fast generation
 */
export async function generateImage(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  try {
    console.log("🎨 Generating image with Fal.ai nano-banana...");
    console.log("Prompt:", params.prompt);

    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: {
        prompt: params.prompt,
        image_size: params.imageSize || "landscape_16_9",
        num_inference_steps: params.numInferenceSteps || 4,
        seed: params.seed,
        guidance_scale: params.guidanceScale || 3.5,
        num_images: params.numImages || 1,
        enable_safety_checker: params.enableSafetyChecker ?? true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Image generation in progress...");
        }
      },
    });

    console.log("✅ Image generated successfully");
    console.log("Raw Fal.ai result:", JSON.stringify(result, null, 2));

    // Fal.ai returns the result directly, not wrapped in { data: ... }
    const imageResult = result as unknown as ImageGenerationResult;
    console.log("Extracted data:", JSON.stringify(imageResult, null, 2));

    return imageResult;
  } catch (error) {
    console.error("❌ Fal.ai image generation error:", error);
    throw new Error(
      `Failed to generate image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate a video using Fal.ai bytedance/seedance model
 * Text-to-video generation
 */
export async function generateVideo(
  params: VideoGenerationParams
): Promise<VideoGenerationResult> {
  try {
    console.log("🎬 Generating video with Fal.ai seedance...");
    console.log("Prompt:", params.prompt);

    const result = await fal.subscribe(
      "fal-ai/bytedance/seedance/v1/lite/text-to-video",
      {
        input: {
          prompt: params.prompt,
          duration: params.duration || 10, // 10 seconds default (max for lite model)
          aspect_ratio: params.aspectRatio || "16:9",
          seed: params.seed,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Video generation in progress...");
          }
        },
      }
    );

    console.log("✅ Video generated successfully");
    // Fal.ai returns the result directly, not wrapped in { data: ... }
    return result as unknown as VideoGenerationResult;
  } catch (error) {
    console.error("❌ Fal.ai video generation error:", error);
    throw new Error(
      `Failed to generate video: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate a placeholder image URL (for fallback)
 */
export function getPlaceholderImageUrl(
  text: string = "Image generation failed"
): string {
  // Using a placeholder service
  const encodedText = encodeURIComponent(text);
  return `https://via.placeholder.com/1920x1080/cccccc/666666?text=${encodedText}`;
}

/**
 * Retry wrapper for image generation
 */
export async function generateImageWithRetry(
  params: ImageGenerationParams,
  maxRetries: number = 1
): Promise<ImageGenerationResult | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
      }
      const result = await generateImage(params);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      // If it's a payload size error, return placeholder immediately
      if (
        lastError.message.includes("413") ||
        lastError.message.includes("payload")
      ) {
        console.log("⚠️ Payload too large, returning placeholder image");
        return {
          image: {
            url: getPlaceholderImageUrl(),
            content_type: "image/png",
            file_name: "placeholder.png",
            file_size: 0,
          },
          seed: 0,
        };
      }

      // Wait a bit before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.error("❌ All retry attempts failed");
  return null;
}

/**
 * Retry wrapper for video generation
 */
export async function generateVideoWithRetry(
  params: VideoGenerationParams,
  maxRetries: number = 1
): Promise<VideoGenerationResult | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
      }
      const result = await generateVideo(params);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      // If it's a payload size error, return null to trigger fallback
      if (
        lastError.message.includes("413") ||
        lastError.message.includes("payload")
      ) {
        console.log("⚠️ Payload too large for video generation");
        return null;
      }

      // Wait a bit before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.error("❌ All retry attempts failed");
  return null;
}
