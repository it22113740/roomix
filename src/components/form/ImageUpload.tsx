"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { TrashBinIcon } from "@/icons";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  label?: string;
}

export default function ImageUpload({
  images = [],
  onChange,
  maxImages = 5,
  folder = "hotel-booking",
  label = "Upload Images",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, index: number) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      return data.data.url;
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload image: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      const newImages: string[] = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        try {
          const url = await uploadImage(acceptedFiles[i], images.length + i);
          newImages.push(url);
        } catch (error) {
          // Error already handled in uploadImage
        }
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    },
    [images, maxImages, folder, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: maxImages - images.length,
    disabled: uploading || images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} ({images.length}/{maxImages})
      </label>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <Image
                  src={image}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-error-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <TrashBinIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-brand-400"
          } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploading
                ? "Uploading..."
                : isDragActive
                ? "Drop images here"
                : "Drag & drop images here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              PNG, JPG, WEBP (max {maxImages - images.length} more)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
