
// This is now the single source of truth for toast functionality
import { useToast as useToastHook, toast as toastFunction } from "sonner";

export const useToast = useToastHook;
export const toast = toastFunction;
