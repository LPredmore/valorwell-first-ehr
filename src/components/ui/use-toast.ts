
import { toast } from "sonner";

// Creating our own hook to maintain API compatibility with both old Radix toast style and Sonner
const useToast = () => {
  return {
    toast: {
      // Convert legacy Radix toast style calls to Sonner format
      // This maintains backwards compatibility while transitioning to Sonner
      ...toast,
      // Handle old style with title/description to new Sonner format
      // Sonner uses the first argument as the message, and options come second
      error: (args: any) => {
        if (typeof args === 'string') {
          return toast.error(args);
        } else if (args && typeof args === 'object') {
          const { title, description, ...rest } = args;
          return toast.error(title || description, { ...rest, description: description || undefined });
        }
        return toast.error('An error occurred');
      },
      success: (args: any) => {
        if (typeof args === 'string') {
          return toast.success(args);
        } else if (args && typeof args === 'object') {
          const { title, description, ...rest } = args;
          return toast.success(title || description, { ...rest, description: description || undefined });
        }
        return toast.success('Success');
      },
      warning: (args: any) => {
        if (typeof args === 'string') {
          return toast(args, { style: { backgroundColor: 'var(--warning)', color: 'black' } });
        } else if (args && typeof args === 'object') {
          const { title, description, ...rest } = args;
          return toast(title || description, { 
            ...rest, 
            description: description || undefined,
            style: { backgroundColor: 'var(--warning)', color: 'black' }
          });
        }
        return toast('Warning', { style: { backgroundColor: 'var(--warning)', color: 'black' } });
      },
      info: (args: any) => {
        if (typeof args === 'string') {
          return toast.info(args);
        } else if (args && typeof args === 'object') {
          const { title, description, ...rest } = args;
          return toast.info(title || description, { ...rest, description: description || undefined });
        }
        return toast.info('Information');
      }
    }
  };
};

// Export both the hook and direct toast access
export { useToast, toast };
