
import { useToast as useShadcnToast } from "@/components/ui/toast";
import { toast as shadcnToast } from "@/components/ui/toast";

/**
 * Hook that provides toast functionality
 */
export const useToast = useShadcnToast;

/**
 * Direct toast function for use outside of components
 */
export const toast = shadcnToast;

// Export types if needed for better TypeScript support
export type { Toast } from "@/components/ui/toast";
