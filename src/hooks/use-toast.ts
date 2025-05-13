
import { useState, useEffect, useCallback } from "react";
import { toast as sonnerToast } from "sonner";
import type { ToastProps } from "sonner";

export type ToastActionElement = React.ReactElement;

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

type State = {
  toasts: Toast[];
};

const TOAST_LIMIT = 10;
const TOAST_REMOVE_DELAY = 1000;

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const initialState: State = {
  toasts: [],
};

let count = 0;

function generateId() {
  return (++count).toString();
}

export function useToast() {
  const [state, setState] = useState<State>(initialState);

  const toast = useCallback(
    (props: Omit<Toast, "id">) => {
      const id = generateId();
      const newToast = { id, ...props };
      
      setState((state) => {
        const newToasts = [...state.toasts];
        if (newToasts.length >= TOAST_LIMIT) {
          newToasts.shift();
        }
        return { toasts: [...newToasts, newToast] };
      });

      // Also trigger sonner toast for actual display
      if (props.variant === "destructive") {
        sonnerToast.error(props.title, {
          description: props.description,
          id: id,
        });
      } else {
        sonnerToast(props.title, {
          description: props.description,
          id: id,
        });
      }

      return id;
    },
    []
  );

  const dismiss = useCallback((toastId: string) => {
    setState((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId),
    }));

    sonnerToast.dismiss(toastId);
  }, []);

  const update = useCallback((props: Omit<Toast, "id"> & { id: string }) => {
    const { id, ...rest } = props;

    setState((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...rest } : t)),
    }));

    sonnerToast(rest.title, {
      id,
      description: rest.description,
    });
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
    update,
  };
}

// Direct toast function for use outside of components
export const toast = (props: Omit<Toast, "id">) => {
  const id = generateId();
  
  if (props.variant === "destructive") {
    sonnerToast.error(props.title, {
      description: props.description,
      id,
    });
  } else {
    sonnerToast(props.title, {
      description: props.description,
      id,
    });
  }
  
  return id;
};
