import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { LucideIcon } from 'lucide-react';

/**
 * @interface ActionItem
 * @description Defines the structure for an action button in the ActionBar component
 */
export interface ActionItem {
  /**
   * The text to display on the button
   */
  label: string;
  
  /**
   * Optional Lucide icon to display alongside the label
   */
  icon?: LucideIcon;
  
  /**
   * Function to call when the button is clicked
   */
  onClick: () => void;
  
  /**
   * The visual style variant of the button
   * @default "outline"
   */
  variant?: ButtonProps['variant'];
  
  /**
   * The size of the button
   * @default "default"
   */
  size?: ButtonProps['size'];
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Additional CSS class names to apply to the button
   */
  className?: string;
  
  /**
   * Whether the action is destructive (will use destructive variant)
   * @default false
   */
  destructive?: boolean;
  
  /**
   * Optional tooltip text to display on hover
   */
  tooltip?: string;
}

/**
 * @component ActionBar
 * @description A component for displaying action buttons in a consistent layout.
 * Can be positioned at the top, bottom, left, or right of a container.
 *
 * @example
 * // Basic usage
 * <ActionBar
 *   actions={[
 *     {
 *       label: 'Save',
 *       onClick: handleSave,
 *     },
 *     {
 *       label: 'Cancel',
 *       onClick: handleCancel,
 *     },
 *   ]}
 * />
 *
 * @example
 * // With icons and custom positioning
 * <ActionBar
 *   actions={[
 *     {
 *       label: 'Save',
 *       icon: Save,
 *       onClick: handleSave,
 *       variant: 'default',
 *     },
 *     {
 *       label: 'Delete',
 *       icon: Trash,
 *       onClick: handleDelete,
 *       destructive: true,
 *     },
 *   ]}
 *   position="bottom"
 *   alignment="end"
 *   separated
 * />
 */
export interface ActionBarProps {
  /**
   * Array of action items to display as buttons
   */
  actions: ActionItem[];
  
  /**
   * Position of the action bar relative to its container
   * @default "bottom"
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Additional CSS class names to apply to the container
   */
  className?: string;
  
  /**
   * Whether to show separators between actions
   * @default false
   */
  separated?: boolean;
  
  /**
   * Whether buttons should take full width
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Alignment of the actions within the container
   * @default "end"
   */
  alignment?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  
  /**
   * Whether to adjust layout on small screens
   * @default true
   */
  responsive?: boolean;
  
  /**
   * Whether to wrap actions to multiple lines
   * @default false
   */
  wrapActions?: boolean;
  
  /**
   * Whether the action bar should stick to its position
   * @default false
   */
  sticky?: boolean;
}

export function ActionBar({
  actions,
  position = 'bottom',
  className = '',
  separated = false,
  fullWidth = false,
  alignment = 'end',
  responsive = true,
  wrapActions = false,
  sticky = false,
}: ActionBarProps) {
  // Skip rendering if no actions
  if (!actions || actions.length === 0) {
    return null;
  }

  // Determine container direction based on position
  const isVertical = position === 'left' || position === 'right';
  
  // Determine flex direction
  const flexDirection = {
    top: 'flex-col',
    bottom: 'flex-col',
    left: 'flex-row',
    right: 'flex-row-reverse',
  }[position];

  // Determine alignment class
  const alignmentClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }[alignment];

  // Determine position classes
  const positionClasses = {
    top: 'border-b',
    bottom: 'border-t',
    left: 'border-r',
    right: 'border-l',
  }[position];

  return (
    <div
      className={cn(
        'flex',
        isVertical ? 'flex-col' : 'flex-row',
        alignmentClass,
        positionClasses,
        'bg-background p-4',
        sticky && 'sticky',
        sticky && position === 'top' && 'top-0',
        sticky && position === 'bottom' && 'bottom-0',
        sticky && position === 'left' && 'left-0 h-full',
        sticky && position === 'right' && 'right-0 h-full',
        responsive && 'flex-wrap sm:flex-nowrap',
        wrapActions && 'flex-wrap',
        className
      )}
    >
      {actions.map((action, index) => {
        const { 
          label, 
          icon: Icon, 
          onClick, 
          variant = 'outline', 
          size = 'default',
          disabled = false,
          className = '',
          destructive = false,
          tooltip
        } = action;

        const buttonElement = (
          <Button
            key={`action-${index}`}
            variant={destructive ? 'destructive' : variant}
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              fullWidth && 'w-full',
              isVertical && 'w-full',
              className
            )}
            title={tooltip}
          >
            {Icon && <Icon className={cn('h-4 w-4', label && 'mr-2')} />}
            {label}
          </Button>
        );

        if (separated && index < actions.length - 1) {
          return (
            <React.Fragment key={`action-container-${index}`}>
              {buttonElement}
              <Separator 
                className={cn(
                  isVertical ? 'my-2' : 'mx-2',
                  isVertical ? 'h-[1px] w-full' : 'h-full w-[1px]'
                )} 
              />
            </React.Fragment>
          );
        }

        return buttonElement;
      })}
    </div>
  );
}

export interface ActionGroupProps {
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  sticky?: boolean;
}

export function ActionGroup({
  children,
  className = '',
  position = 'bottom',
  sticky = false,
}: ActionGroupProps) {
  // Determine position classes
  const positionClasses = {
    top: 'border-b',
    bottom: 'border-t',
    left: 'border-r',
    right: 'border-l',
  }[position];

  return (
    <div
      className={cn(
        'flex flex-row items-center justify-end gap-2 bg-background p-4',
        positionClasses,
        sticky && 'sticky',
        sticky && position === 'top' && 'top-0',
        sticky && position === 'bottom' && 'bottom-0',
        sticky && position === 'left' && 'left-0 h-full',
        sticky && position === 'right' && 'right-0 h-full',
        className
      )}
    >
      {children}
    </div>
  );
}