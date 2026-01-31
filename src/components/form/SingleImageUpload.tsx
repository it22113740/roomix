"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { TrashBinIcon } from "@/icons";

interface SingleImageUploadProps {
  image?: string;
  onChange: (image: string | undefined) => void;
  folder?: string;
  label?: string;
  accept?: Record<string, string[]>;
}

export default function SingleImageUpload({
  image,
  onChange,
  folder = "hotel-booking",
  label = "Upload Image",
  accept = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
  },
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
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
      alert(`Failed to upload: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        const url = await uploadImage(acceptedFiles[0]);
        onChange(url);
      } catch (error) {
        // Error already handled in uploadImage
      }
    },
    [folder, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: uploading,
  });

  const removeImage = () => {
    onChange(undefined);
  };

  const isImage = image && /\.(jpg|jpeg|png|webp|gif)$/i.test(image);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Preview */}
      {image && (
        <div className="mb-4 relative">
          {isImage ? (
            <div className="relative group">
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <Image
                  src={image}
                  alt="Uploaded"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-error-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashBinIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document uploaded
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {image}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="bg-error-500 text-white rounded-full p-1.5"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      {!image && (
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
                ? "Drop file here"
                : "Drag & drop file here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Image or PDF
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
