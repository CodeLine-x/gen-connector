"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ArchiveImage } from "@/lib/archiveService";

interface ImageGalleryProps {
  conversationText: string;
  sessionId: string;
  onImageSelect?: (image: ArchiveImage) => void;
}

export default function ImageGallery({
  conversationText,
  sessionId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onImageSelect,
}: ImageGalleryProps) {
  const [images, setImages] = useState<ArchiveImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ArchiveImage | null>(null);

  const searchImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search-archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationText }),
      });

      if (!response.ok) {
        throw new Error("Failed to search archives");
      }

      const { images: searchResults } = await response.json();
      setImages(searchResults);
    } catch (err) {
      console.error("Error searching images:", err);
      setError("Failed to load historical images");
    } finally {
      setIsLoading(false);
    }
  }, [conversationText]);

  useEffect(() => {
    if (conversationText.trim()) {
      searchImages();
    }
  }, [conversationText, searchImages]);

  const handleImageClick = (image: ArchiveImage) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          📸 Historical Images
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600 dark:text-gray-400">
            Searching for relevant historical images...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          📸 Historical Images
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={searchImages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          📸 Historical Images
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🖼️</div>
          <p className="text-gray-600 dark:text-gray-400">
            No relevant historical images found for this conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        📸 Historical Images ({images.length})
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group cursor-pointer"
            onClick={() => handleImageClick(image)}
          >
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <Image
                src={image.url}
                alt={image.title}
                width={200}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback for broken images
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                          <rect width="200" height="200" fill="#f3f4f6"/>
                          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="12">
                            Historical Image
                          </text>
                        </svg>
                      `)}`;
                }}
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white text-black px-2 py-1 rounded text-xs font-semibold">
                  View Details
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedImage.title}
                </h4>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedImage.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedImage.date && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">
                        Date:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedImage.date}
                      </span>
                    </div>
                  )}
                  {selectedImage.location && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">
                        Location:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedImage.location}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    Source:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedImage.source}
                  </span>
                </div>

                {selectedImage.metadata?.tags && (
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedImage.metadata.tags.map(
                        (tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
