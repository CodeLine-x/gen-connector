"use client";

import { useState, useEffect } from "react";

interface GeneratedImageDisplayProps {
  imageUrl: string;
  prompt?: string;
  segmentNumber: number;
}

export default function GeneratedImageDisplay({
  imageUrl,
  prompt,
  segmentNumber,
}: GeneratedImageDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  console.log(`🖼️ Rendering image for segment ${segmentNumber}:`, imageUrl);

  // Fallback timeout - if image doesn't load in 10 seconds, hide spinner
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (imageLoading) {
        console.warn(`⚠️ Image loading timeout for segment ${segmentNumber}`);
        setImageLoading(false);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [imageLoading, segmentNumber]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
      {imageLoading && !imageError && (
        <div className="flex items-center justify-center w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {imageError ? (
        <div className="w-full aspect-video bg-red-50 dark:bg-red-900/20 rounded-md flex flex-col items-center justify-center p-4">
          <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-2">
            ❌ Failed to load image
          </p>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 underline break-all hover:underline"
          >
            Open URL directly →
          </a>
        </div>
      ) : (
        <div className={`w-full ${imageLoading ? "hidden" : "block"}`}>
          {/* Using regular img tag for maximum compatibility with Vercel Blob URLs */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={prompt || "Generated memory image"}
            className="w-full h-auto rounded-md"
            crossOrigin="anonymous"
            onLoad={() => {
              console.log(`✅ Image loaded for segment ${segmentNumber}`);
              setImageLoading(false);

              // Show success popup
              if (typeof window !== "undefined") {
                const notification = document.createElement("div");
                notification.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #10b981;
                  color: white;
                  padding: 16px 24px;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                  z-index: 9999;
                  font-family: system-ui;
                  font-size: 14px;
                  font-weight: 500;
                  animation: slideIn 0.3s ease-out;
                `;
                notification.textContent = `✅ Image ${segmentNumber} loaded successfully!`;
                document.body.appendChild(notification);

                setTimeout(() => {
                  notification.style.animation = "slideOut 0.3s ease-in";
                  setTimeout(() => notification.remove(), 300);
                }, 3000);
              }
            }}
            onError={(e) => {
              console.error(
                `❌ Image failed to load for segment ${segmentNumber}:`,
                e
              );
              console.error(`Failed URL:`, imageUrl);
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </div>
      )}

      {prompt && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          {prompt}
        </p>
      )}

      {/* Debug info */}
      <details className="mt-2">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
          Debug Info
        </summary>
        <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all space-y-1">
          <div>
            <strong>URL:</strong>{" "}
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {imageUrl}
            </a>
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span
              className={
                imageLoading
                  ? "text-yellow-600"
                  : imageError
                  ? "text-red-600"
                  : "text-green-600"
              }
            >
              {imageLoading ? "Loading..." : imageError ? "Error" : "Loaded ✓"}
            </span>
          </div>
          <div>
            <strong>Segment:</strong> {segmentNumber}
          </div>
        </div>
      </details>
    </div>
  );
}
