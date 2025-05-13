
import { useToast as useToastOld } from "@/components/ui/use-toast"

// Define the correct Toast type to include variant
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

// Re-export the hook with adjusted types
export const useToast = () => {
  return useToastOld();
};

// Export a wrapped toast function that handles the proper types
export const toast = (props: Partial<Toast>) => {
  // This function is imported by components to toast with variant support
  const { title, description, action, variant, ...rest } = props;
  
  // Create the standard toast payload without variant
  // @ts-ignore - we're handling the type mismatch here deliberately
  return useToastOld().toast({
    title,
    description,
    action,
    variant,
    ...rest
  });
};
