"use client";

import React, { useEffect } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export default function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const variantClasses = {
    success: {
      container: "bg-success-50 border-success-500 dark:bg-success-500/15 dark:border-success-500/30",
      icon: "text-success-500",
      text: "text-success-800 dark:text-success-200",
    },
    error: {
      container: "bg-error-50 border-error-500 dark:bg-error-500/15 dark:border-error-500/30",
      icon: "text-error-500",
      text: "text-error-800 dark:text-error-200",
    },
    warning: {
      container: "bg-warning-50 border-warning-500 dark:bg-warning-500/15 dark:border-warning-500/30",
      icon: "text-warning-500",
      text: "text-warning-800 dark:text-warning-200",
    },
    info: {
      container: "bg-blue-light-50 border-blue-light-500 dark:bg-blue-light-500/15 dark:border-blue-light-500/30",
      icon: "text-blue-light-500",
      text: "text-blue-light-800 dark:text-blue-light-200",
    },
  };

  const icons = {
    success: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM13.7071 8.29289C14.0976 8.68342 14.0976 9.31658 13.7071 9.70711L9.70711 13.7071C9.31658 14.0976 8.68342 14.0976 8.29289 13.7071L6.29289 11.7071C5.90237 11.3166 5.90237 10.6834 6.29289 10.2929C6.68342 9.90237 7.31658 9.90237 7.70711 10.2929L9 11.5858L12.2929 8.29289C12.6834 7.90237 13.3166 7.90237 13.7071 8.29289Z" fill="currentColor" />
      </svg>
    ),
    error: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.58579 10L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071C7.68342 13.0976 8.31658 13.0976 8.70711 12.7071L10 11.4142L11.2929 12.7071C11.6834 13.0976 12.3166 13.0976 12.7071 12.7071C13.0976 12.3166 13.0976 11.6834 12.7071 11.2929L11.4142 10L12.7071 8.70711C13.0976 8.31658 13.0976 7.68342 12.7071 7.29289C12.3166 6.90237 11.6834 6.90237 11.2929 7.29289L10 8.58579L8.70711 7.29289Z" fill="currentColor" />
      </svg>
    ),
    warning: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM10 6C10.5523 6 11 6.44772 11 7V10C11 10.5523 10.5523 11 10 11C9.44772 11 9 10.5523 9 10V7C9 6.44772 9.44772 6 10 6ZM10 13C10.5523 13 11 13.4477 11 14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13Z" fill="currentColor" />
      </svg>
    ),
    info: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM10 6C10.5523 6 11 6.44772 11 7C11 7.55228 10.5523 8 10 8C9.44772 8 9 7.55228 9 7C9 6.44772 9.44772 6 10 6ZM10 9C10.5523 9 11 9.44772 11 10V13C11 13.5523 10.5523 14 10 14C9.44772 14 9 13.5523 9 13V10C9 9.44772 9.44772 9 10 9Z" fill="currentColor" />
      </svg>
    ),
  };

  const classes = variantClasses[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-[500px] ${classes.container}`}
      style={{
        animation: "slideIn 0.3s ease-out",
      }}
      role="alert"
    >
      <div className={`flex-shrink-0 ${classes.icon}`}>
        {icons[toast.type]}
      </div>
      <p className={`flex-1 text-sm font-medium ${classes.text}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 ${classes.icon} hover:opacity-70 transition-opacity`}
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
