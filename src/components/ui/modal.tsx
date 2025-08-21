"use client";

import { useEffect } from "react";
import { X, AlertCircle, CheckCircle, Info, Shield } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  details?: string[];
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  }[];
}

const modalStyles = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle,
    iconColor: "text-green-600",
    titleColor: "text-green-900",
    messageColor: "text-green-700",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    messageColor: "text-red-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertCircle,
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    messageColor: "text-amber-800",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Info,
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    messageColor: "text-blue-700",
  },
};

export function Modal({
  isOpen,
  onClose,
  type,
  title,
  message,
  details,
  actions,
}: ModalProps) {
  const styles = modalStyles[type];
  const Icon = styles.icon;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="bg-opacity-50 absolute inset-0 bg-black backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md transform transition-all">
        <div
          className={`${styles.bg} ${styles.border} rounded-lg border p-6 shadow-xl`}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${styles.bg}`}>
                <Icon className={`h-6 w-6 ${styles.iconColor}`} />
              </div>
              <h2 className={`text-xl font-semibold ${styles.titleColor}`}>
                {title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className={`text-sm leading-relaxed ${styles.messageColor}`}>
              {message}
            </p>

            {details && details.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-900">
                  O que você pode fazer:
                </h3>
                <ul className="space-y-2">
                  {details.map((detail, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm text-gray-600"
                    >
                      <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            {actions ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))
            ) : (
              <Button onClick={onClose} className="flex-1">
                Entendi
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
