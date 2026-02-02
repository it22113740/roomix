"use client";

import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  className?: string;
}

export default function ProgressBar({
  progress,
  label,
  className = "",
}: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-brand-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
