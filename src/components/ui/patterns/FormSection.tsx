import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * @component FormSection
 * @description A component for creating consistent form sections with optional collapsible functionality.
 * Provides a structured way to organize form fields with a title, description, and optional footer.
 *
 * @example
 * // Basic usage
 * <FormSection title="Personal Information">
 *   <Input label="First Name" />
 *   <Input label="Last Name" />
 * </FormSection>
 *
 * @example
 * // With icon and collapsible functionality
 * <FormSection
 *   title="Personal Information"
 *   description="Enter your personal details"
 *   icon={User}
 *   collapsible
 *   required
 * >
 *   <FormGroup>
 *     <FormRow>
 *       <Input label="First Name" />
 *       <Input label="Last Name" />
 *     </FormRow>
 *   </FormGroup>
 * </FormSection>
 */
export interface FormSectionProps {
  /**
   * Section title displayed in the header
   */
  title: string;
  
  /**
   * Optional description text displayed below the title
   */
  description?: string;
  
  /**
   * Optional Lucide icon to display next to the title
   */
  icon?: LucideIcon;
  
  /**
   * Form content to display within the section
   */
  children: React.ReactNode;
  
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  
  /**
   * Additional CSS class names to apply to the container
   */
  className?: string;
  
  /**
   * Additional CSS class names to apply to the header
   */
  headerClassName?: string;
  
  /**
   * Additional CSS class names to apply to the content area
   */
  contentClassName?: string;
  
  /**
   * Additional CSS class names to apply to the footer
   */
  footerClassName?: string;
  
  /**
   * Whether the section can be collapsed
   * @default false
   */
  collapsible?: boolean;
  
  /**
   * Whether the section is collapsed by default
   * Only applies when collapsible is true
   * @default false
   */
  defaultCollapsed?: boolean;
  
  /**
   * Whether the section is required
   * Displays a red asterisk next to the title when true
   * @default false
   */
  required?: boolean;
  
  /**
   * Whether the section is disabled
   * Applies the disabled attribute to all form elements within
   * @default false
   */
  disabled?: boolean;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  footer,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  disabled = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <Card className={cn('mb-6', className, disabled && 'opacity-70')}>
      <CardHeader 
        className={cn(
          headerClassName,
          collapsible && 'cursor-pointer hover:bg-muted/50'
        )}
        onClick={toggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <div>
              <CardTitle className="text-lg">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
              </CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
          </div>
          {collapsible && (
            <div className="text-muted-foreground">
              {isCollapsed ? '▼' : '▲'}
            </div>
          )}
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <>
          <CardContent className={cn('pt-0', contentClassName)}>
            <fieldset disabled={disabled}>
              {children}
            </fieldset>
          </CardContent>
          
          {footer && (
            <CardFooter className={cn(footerClassName)}>
              {footer}
            </CardFooter>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * @component FormRow
 * @description A component for creating a responsive row of form fields.
 * Displays fields in a single column on mobile and two columns on larger screens.
 *
 * @example
 * <FormRow>
 *   <Input label="First Name" />
 *   <Input label="Last Name" />
 * </FormRow>
 */
export interface FormRowProps {
  /**
   * Form fields to display in the row
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names to apply to the row
   */
  className?: string;
}

export function FormRow({ children, className = '' }: FormRowProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4 mb-4', className)}>
      {children}
    </div>
  );
}

/**
 * @component FormGroup
 * @description A component for grouping related form fields with an optional title.
 * Provides consistent spacing and organization for form sections.
 *
 * @example
 * <FormGroup title="Contact Information" icon={Phone}>
 *   <Input label="Email" />
 *   <Input label="Phone" />
 * </FormGroup>
 */
export interface FormGroupProps {
  /**
   * Form fields to display in the group
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names to apply to the group
   */
  className?: string;
  
  /**
   * Optional title for the group
   */
  title?: string;
  
  /**
   * Optional Lucide icon to display next to the title
   */
  icon?: LucideIcon;
}

export function FormGroup({ children, className = '', title, icon: Icon }: FormGroupProps) {
  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {title && (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}