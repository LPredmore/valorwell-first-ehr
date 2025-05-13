
/**
 * This file simply re-exports the useToast hook from @/hooks/use-toast.ts
 * All toast functionality is now handled by Sonner instead of Radix UI.
 */

// Simply import from the hooks folder where the implementation lives
import { useToast, toast } from "@/hooks/use-toast";
import type { Toast } from "@/hooks/use-toast";

export { useToast, toast, type Toast };
