
/**
 * This component has been superseded by Sonner's <Toaster /> component.
 * The useToast() hook from @/hooks/use-toast.ts now utilizes Sonner for toast functionality.
 * All toast notifications should be displayed using Sonner's Toaster component in App.tsx.
 * 
 * This component is kept as a placeholder for compatibility but doesn't render anything.
 */

export function Toaster() {
  // The previous implementation used the toasts array from useToast()
  // which no longer exists as we've migrated to Sonner for toast notifications
  return null;
}
