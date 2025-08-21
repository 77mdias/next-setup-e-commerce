"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Mail, Shield } from "lucide-react";
import { Button } from "./button";

interface NotificationProps {
  isVisible: boolean;
  onClose: () => void;
  type: "email_exists" | "oauth_error" | "general";
  title: string;
  message: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  }[];
}

const notificationStyles = {
  email_exists: {
    bg: "bg-amber-50 border-amber-200",
    icon: Mail,
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    messageColor: "text-amber-700",
  },
  oauth_error: {
    bg: "bg-red-50 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    messageColor: "text-red-700",
  },
  general: {
    bg: "bg-blue-50 border-blue-200",
    icon: Shield,
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    messageColor: "text-blue-700",
  },
};

export function Notification({
  isVisible,
  onClose,
  type,
  title,
  message,
  actions,
}: NotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const styles = notificationStyles[type];
  const Icon = styles.icon;

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Notification */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div
          className={`${styles.bg} ${styles.bg.replace("bg-", "border-")} rounded-lg border p-6 shadow-xl`}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${styles.bg}`}>
                <Icon className={`h-6 w-6 ${styles.iconColor}`} />
              </div>
              <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
                {title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
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
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            {actions ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={() => {
                    action.onClick();
                    handleClose();
                  }}
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))
            ) : (
              <Button onClick={handleClose} className="flex-1">
                Entendi
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para gerenciar notificações
export function useNotification() {
  const [notification, setNotification] = useState<Omit<
    NotificationProps,
    "isVisible" | "onClose"
  > | null>(null);

  const showNotification = (
    props: Omit<NotificationProps, "isVisible" | "onClose">,
  ) => {
    setNotification(props);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const NotificationContainer = () => (
    <>
      {notification && (
        <Notification
          {...notification}
          isVisible={!!notification}
          onClose={hideNotification}
        />
      )}
    </>
  );

  return { showNotification, hideNotification, NotificationContainer };
}
