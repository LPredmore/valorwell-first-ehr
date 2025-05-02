
import React, { createContext, useContext, useState } from "react";
import { toast, Toaster as ReactHotToaster } from "react-hot-toast";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastContextProps {
  toast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps>({
  toast: () => null,
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toastHandler = (message: string, type: ToastType) => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast(message, {
          icon: "⚠️",
          style: {
            borderRadius: "10px",
            background: "#FFF3CD",
            color: "#856404",
          },
        });
        break;
      case "info":
      default:
        toast(message, {
          icon: "ℹ️",
          style: {
            borderRadius: "10px",
            background: "#D1ECF1",
            color: "#0C5460",
          },
        });
        break;
    }
  };

  return (
    <ToastContext.Provider value={{ toast: toastHandler }}>
      {children}
      <ReactHotToaster position="top-right" />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
