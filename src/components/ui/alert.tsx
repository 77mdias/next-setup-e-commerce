"use client";

import { AlertCircle, X } from "lucide-react";
import { Button } from "./button";

interface AlertProps {
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  onClose?: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  }[];
}

const alertStyles = {
  error: {
    bg: "bg-red-900/20 border-red-500/30",
    icon: AlertCircle,
    iconColor: "text-red-400",
    titleColor: "text-red-200",
    messageColor: "text-red-300",
  },
  warning: {
    bg: "bg-yellow-900/20 border-yellow-500/30",
    icon: AlertCircle,
    iconColor: "text-yellow-400",
    titleColor: "text-yellow-200",
    messageColor: "text-yellow-300",
  },
  info: {
    bg: "bg-blue-900/20 border-blue-500/30",
    icon: AlertCircle,
    iconColor: "text-blue-400",
    titleColor: "text-blue-200",
    messageColor: "text-blue-300",
  },
  success: {
    bg: "bg-green-900/20 border-green-500/30",
    icon: AlertCircle,
    iconColor: "text-green-400",
    titleColor: "text-green-200",
    messageColor: "text-green-300",
  },
};

export function Alert({ type, title, message, onClose, actions }: AlertProps) {
  const styles = alertStyles[type];
  const Icon = styles.icon;

  return (
    <div className={`${styles.bg} mb-6 rounded-lg border p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.titleColor}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm ${styles.messageColor}`}>{message}</p>

          {actions && actions.length > 0 && (
            <div className="mt-3 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={action.onClick}
                  className={`text-xs ${
                    action.variant === "outline"
                      ? "border-gray-600 bg-transparent text-white hover:bg-gray-700"
                      : ""
                  }`}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
