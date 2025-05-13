
// src/hooks/use-toast.ts
import { useCallback } from "react";
import { toast as sonnerToast, type ToastT } from "sonner";

export type Toast = ToastT;

export function useToast() {
  const toast = useCallback(
    ({ title, description, ...props }: Toast) => {
      sonnerToast(title, {
        description,
        ...props,
      });
    },
    []
  );

  return { toast };
}

export { toast } from "sonner";
