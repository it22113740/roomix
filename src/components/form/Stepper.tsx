"use client";
import React from "react";

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function Stepper({
  currentStep,
  totalSteps,
  stepLabels,
}: StepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isLast = stepNumber === totalSteps;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "bg-brand-500 border-brand-500 text-white"
                      : isActive
                      ? "border-brand-500 bg-white text-brand-500 dark:bg-gray-900 dark:text-brand-400"
                      : "border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="font-semibold">{stepNumber}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-gray-800 dark:text-white/90"
                        : isCompleted
                        ? "text-gray-600 dark:text-gray-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted
                      ? "bg-brand-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
