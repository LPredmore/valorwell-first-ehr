/**
 * @component Textarea
 * @description An enhanced textarea component with auto-resize functionality.
 * Automatically adjusts its height based on content, while maintaining all standard
 * textarea functionality and styling consistent with the design system.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @interface TextareaProps
 * @description Props for the Textarea component
 * @extends React.TextareaHTMLAttributes<HTMLTextAreaElement>
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * A textarea component that automatically resizes based on content.
 *
 * @example
 * // Basic usage
 * <Textarea placeholder="Enter your message" />
 *
 * @example
 * // With form control
 * <FormField
 *   control={form.control}
 *   name="message"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Message</FormLabel>
 *       <FormControl>
 *         <Textarea {...field} placeholder="Type your message here" />
 *       </FormControl>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    const setRefs = React.useCallback((element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    }, [ref]);

    const resizeTextarea = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      resizeTextarea();
      
      const handleInput = () => resizeTextarea();
      
      textarea.addEventListener('input', handleInput);
      
      return () => {
        textarea.removeEventListener('input', handleInput);
      };
    }, [resizeTextarea]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        ref={setRefs}
        {...props}
        onInput={e => {
          if (props.onInput) {
            props.onInput(e);
          }
        }}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
