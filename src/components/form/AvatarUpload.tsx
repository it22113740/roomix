"use client";
import React, { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import Button from "../ui/button/Button";
import Label from "./Label";
import Image from "next/image";
import { CloseIcon } from "@/icons";
import ProgressBar from "@/components/ui/ProgressBar";

interface AvatarUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert to blob and then to data URL for circular crop
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }, "image/png");
  });
};

const getRoundedCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = Math.min(sourceCanvas.width, sourceCanvas.height);

  canvas.width = size;
  canvas.height = size;

  if (!ctx) {
    return canvas;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    sourceCanvas,
    (sourceCanvas.width - size) / 2,
    (sourceCanvas.height - size) / 2,
    size,
    size,
    0,
    0,
    size,
    size
  );

  // Create circular mask
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
};

const getCroppedImgCircle = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  // Draw the cropped image centered
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  // Create circular mask
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Convert to blob and then to data URL
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }, "image/png");
  });
};

export default function AvatarUpload({
  label = "Avatar",
  value,
  onChange,
  folder = "users/avatars",
}: AvatarUploadProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const croppedImageUrl = await getCroppedImgCircle(
        imageSrc,
        croppedAreaPixels
      );

      // Convert data URL to blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "avatar.png", { type: "image/png" });

      // Upload to Cloudinary with progress tracking
      await new Promise<void>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const uploadData = JSON.parse(xhr.responseText);
              if (uploadData.success) {
                setUploadProgress(100);
                onChange(uploadData.data.url);
                setShowCropModal(false);
                setImageSrc("");
                resolve();
              } else {
                reject(new Error(uploadData.error || "Failed to upload avatar"));
              }
            } catch (error: any) {
              reject(new Error(error.message || "Failed to parse response"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was aborted"));
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error("Error cropping/uploading image:", error);
      alert(`Failed to process image: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-4">
        {value ? (
          <div className="relative">
            <div className="relative w-20 h-20 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700">
              <Image
                src={value}
                alt="Avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 p-1 bg-error-500 rounded-full text-white hover:bg-error-600"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {value ? "Change Avatar" : "Upload Avatar"}
          </label>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white/90">
              Crop Avatar
            </h3>
            <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zoom: {zoom.toFixed(2)}
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            {uploading && (
              <div className="mt-4">
                <ProgressBar
                  progress={uploadProgress}
                  label="Uploading avatar..."
                />
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCropModal(false);
                  setImageSrc("");
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCropComplete}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Save Avatar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
