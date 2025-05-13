
import { useState, useEffect, ReactNode } from "react";
import { toast as sonnerToast, type Toast as SonnerToast } from "sonner";

// Define our own Toast type that includes variant
export interface Toast {
  id?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

// Convert our toast options to Sonner options
const useToastImplementation = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const toast = (props: Toast) => {
    const { title, description, variant, action, duration, ...rest } = props;
    
    // Create a unique ID for this toast if none provided
    const id = props.id || Date.now().toString();
    const newToast = { id, title, description, variant, action, duration, ...rest };
    
    // Add to our internal toasts state
    setToasts((current) => [...current, newToast]);
    
    // Use Sonner toast directly - transform our variant to Sonner options
    let sonnerType: "default" | "success" | "error" | "warning" | "info" | undefined = undefined;
    
    // Map our variants to Sonner types
    if (variant === "destructive") sonnerType = "error";
    else if (variant === "success") sonnerType = "success";
    
    // Call Sonner toast
    sonnerToast(title || "", {
      id,
      description,
      duration,
      type: sonnerType,
      // Let buttons/actions render correctly
      // Note: Sonner may handle action differently, this is a basic implementation
      action: action ? { label: "Action", onClick: () => {} } : undefined,
      ...rest
    });
    
    return id;
  };
  
  const dismiss = (toastId?: string) => {
    if (toastId) {
      setToasts((current) =>
        current.filter((toast) => toast.id !== toastId)
      );
      sonnerToast.dismiss(toastId);
    }
  };

  return {
    toast,
    dismiss,
    toasts,
  };
};

// Create a single instance to be shared across the app
const useToast = () => useToastImplementation();

// For direct imports without the hook
const toastSingleton = useToastImplementation();
const toast = toastSingleton.toast;

export { useToast, toast, type Toast };
