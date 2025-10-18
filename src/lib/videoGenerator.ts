export interface VideoSlide {
  imageUrl: string;
  title: string;
  caption: string;
  duration: number; // in seconds
  transition: "fade" | "slide" | "zoom";
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  totalDuration: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

class VideoGenerator {
  private defaultConfig: VideoConfig = {
    width: 1920,
    height: 1080,
    fps: 30,
    totalDuration: 60,
    backgroundColor: "#1a1a1a",
    textColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
  };

  /**
   * Generate a slideshow video from conversation data
   */
  async generateSlideshow(
    slides: VideoSlide[],
    audioBlob?: Blob,
    config: Partial<VideoConfig> = {}
  ): Promise<Blob> {
    const finalConfig = { ...this.defaultConfig, ...config };

    // Create canvas for video generation
    const canvas = document.createElement("canvas");
    canvas.width = finalConfig.width;
    canvas.height = finalConfig.height;
    const ctx = canvas.getContext("2d")!;

    // Create video stream
    const stream = canvas.captureStream(finalConfig.fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: "video/webm" });
        resolve(videoBlob);
      };

      mediaRecorder.start();
      this.renderSlideshow(ctx, slides, finalConfig)
        .then(() => {
          setTimeout(() => mediaRecorder.stop(), 1000);
        })
        .catch(reject);
    });
  }

  /**
   * Render slideshow frames
   */
  private async renderSlideshow(
    ctx: CanvasRenderingContext2D,
    slides: VideoSlide[],
    config: VideoConfig
  ): Promise<void> {
    const frameDuration = 1000 / config.fps; // milliseconds per frame
    let currentTime = 0;
    let currentSlideIndex = 0;
    let slideStartTime = 0;

    const renderFrame = async () => {
      // Clear canvas
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, config.width, config.height);

      if (currentSlideIndex < slides.length) {
        const slide = slides[currentSlideIndex];
        const slideProgress =
          (currentTime - slideStartTime) / (slide.duration * 1000);

        if (slideProgress >= 1) {
          // Move to next slide
          currentSlideIndex++;
          slideStartTime = currentTime;
          if (currentSlideIndex < slides.length) {
            await this.renderSlide(ctx, slides[currentSlideIndex], 0, config);
          }
        } else {
          // Render current slide with transition
          await this.renderSlide(ctx, slide, slideProgress, config);
        }
      }

      currentTime += frameDuration;

      if (
        currentSlideIndex < slides.length ||
        currentTime < config.totalDuration * 1000
      ) {
        requestAnimationFrame(renderFrame);
      }
    };

    // Start rendering
    if (slides.length > 0) {
      await this.renderSlide(ctx, slides[0], 0, config);
      requestAnimationFrame(renderFrame);
    }
  }

  /**
   * Render a single slide
   */
  private async renderSlide(
    ctx: CanvasRenderingContext2D,
    slide: VideoSlide,
    progress: number,
    config: VideoConfig
  ): Promise<void> {
    // Load and draw image
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = slide.imageUrl;
      });

      // Calculate image dimensions to fit canvas while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = config.width / config.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = config.width;
        drawHeight = config.width / imgAspect;
        drawX = 0;
        drawY = (config.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas
        drawHeight = config.height;
        drawWidth = config.height * imgAspect;
        drawX = (config.width - drawWidth) / 2;
        drawY = 0;
      }

      // Apply transition effect
      const alpha = this.getTransitionAlpha(progress, slide.transition);
      ctx.globalAlpha = alpha;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Draw title
      ctx.globalAlpha = 1;
      ctx.fillStyle = config.textColor;
      ctx.font = `bold ${config.width * 0.04}px ${config.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Add text shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(slide.title, config.width / 2, 50);

      // Draw caption
      ctx.font = `${config.width * 0.025}px ${config.fontFamily}`;
      ctx.fillText(slide.caption, config.width / 2, 120);

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } catch (error) {
      console.error("Error loading image:", error);

      // Draw placeholder
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, 0, config.width, config.height);

      ctx.fillStyle = config.textColor;
      ctx.font = `bold ${config.width * 0.04}px ${config.fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.title, config.width / 2, config.height / 2);
    }
  }

  /**
   * Calculate transition alpha based on progress
   */
  private getTransitionAlpha(progress: number, transition: string): number {
    switch (transition) {
      case "fade":
        return Math.sin(progress * Math.PI);
      case "slide":
        return progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2;
      case "zoom":
        return Math.sin(progress * Math.PI);
      default:
        return 1;
    }
  }

  /**
   * Create slides from conversation data
   */
  createSlidesFromConversation(
    conversation: Array<{
      speaker: string;
      transcript: string;
      timestamp: number;
    }>,
    images: Array<{ url: string; title: string; description: string }>
  ): VideoSlide[] {
    const slides: VideoSlide[] = [];

    // Create title slide
    slides.push({
      imageUrl: images[0]?.url || "",
      title: "Intergenerational Conversation",
      caption: "A journey through memories and stories",
      duration: 3,
      transition: "fade",
    });

    // Create slides for each significant elderly response
    const elderlyResponses = conversation.filter(
      (turn) => turn.speaker === "elderly"
    );

    elderlyResponses.forEach((response, index) => {
      if (response.transcript.length > 50) {
        // Only include substantial responses
        const image = images[index % images.length];
        slides.push({
          imageUrl: image?.url || "",
          title: `Memory ${index + 1}`,
          caption: this.truncateText(response.transcript, 100),
          duration: Math.max(3, Math.min(8, response.transcript.length / 50)), // 3-8 seconds based on length
          transition: index % 2 === 0 ? "fade" : "slide",
        });
      }
    });

    // Create closing slide
    slides.push({
      imageUrl: images[images.length - 1]?.url || "",
      title: "Thank You for Sharing",
      caption: "These memories will be treasured forever",
      duration: 3,
      transition: "fade",
    });

    return slides;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  /**
   * Generate video with audio overlay
   */
  async generateVideoWithAudio(
    slides: VideoSlide[],
    audioBlob: Blob,
    config: Partial<VideoConfig> = {}
  ): Promise<Blob> {
    // This is a simplified implementation
    // In a real implementation, you would use Web Audio API or a library like FFmpeg.js
    // to combine video and audio

    const videoBlob = await this.generateSlideshow(slides, audioBlob, config);

    // For now, return the video without audio overlay
    // In production, you'd implement proper audio/video merging
    return videoBlob;
  }
}

export const videoGenerator = new VideoGenerator();
