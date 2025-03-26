
// Re-export from the hooks directory for backward compatibility
import { useToast, toast } from "@/hooks/use-toast";

// Wrap the original toast function with a safer version that logs what's happening
const originalToast = toast;

const safeToast = (props: Parameters<typeof toast>[0]) => {
  console.log("[Toast] Toast called with:", JSON.stringify(props));
  return originalToast(props);
};

export { useToast, safeToast as toast };
