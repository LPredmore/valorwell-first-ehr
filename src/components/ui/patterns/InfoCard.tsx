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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LucideIcon } from 'lucide-react';

/**
 * @interface InfoCardAction
 * @description Defines the structure for an action button in the InfoCard component
 */
export interface InfoCardAction {
  /**
   * The text to display on the button
   */
  label: string;
  
  /**
   * Function to call when the button is clicked
   */
  onClick: () => void;
  
  /**
   * The visual style variant of the button
   * @default "outline"
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  /**
   * Optional Lucide icon to display alongside the label
   */
  icon?: LucideIcon;
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether the action is destructive (will use destructive variant)
   * @default false
   */
  destructive?: boolean;
}

/**
 * @component InfoCard
 * @description A component for displaying information cards with consistent styling.
 * Provides a structured way to present information with optional actions and status indicators.
 *
 * @example
 * // Basic usage
 * <InfoCard title="User Profile">
 *   <p>User information content here</p>
 * </InfoCard>
 *
 * @example
 * // With icon, actions and status
 * <InfoCard
 *   title="John Doe"
 *   description="Client Information"
 *   icon={User}
 *   actions={[
 *     {
 *       label: 'Edit',
 *       icon: Edit,
 *       onClick: handleEdit,
 *     },
 *     {
 *       label: 'Delete',
 *       icon: Trash,
 *       onClick: handleDelete,
 *       destructive: true,
 *     },
 *   ]}
 *   status={<StatusBadge status="active" />}
 * >
 *   <InfoCardItem label="Email" value="john.doe@example.com" />
 *   <InfoCardItem label="Phone" value="(123) 456-7890" />
 * </InfoCard>
 */
export interface InfoCardProps {
  /**
   * Card title displayed in the header
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
   * Card content to display
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
   * Array of action buttons to display in the footer
   */
  actions?: InfoCardAction[];
  
  /**
   * Optional status indicator to display in the header
   */
  status?: React.ReactNode;
  
  /**
   * Function to call when the card is clicked
   * Only applies when interactive is true
   */
  onClick?: () => void;
  
  /**
   * Whether the card is interactive (clickable)
   * @default false
   */
  interactive?: boolean;
  
  /**
   * Whether to show a border around the card
   * @default true
   */
  bordered?: boolean;
  
  /**
   * Whether to show a shadow effect on the card
   * @default false
   */
  elevated?: boolean;
}

export function InfoCard({
  title,
  description,
  icon: Icon,
  children,
  footer,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
  actions = [],
  status,
  onClick,
  interactive = false,
  bordered = true,
  elevated = false,
}: InfoCardProps) {
  const cardClasses = cn(
    bordered ? 'border' : 'border-0',
    elevated ? 'shadow-md' : '',
    interactive && onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : '',
    className
  );

  const handleCardClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  return (
    <Card className={cardClasses} onClick={handleCardClick}>
      <CardHeader className={cn('flex flex-row items-center justify-between space-y-0 pb-2', headerClassName)}>
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {status && <div>{status}</div>}
      </CardHeader>
      <CardContent className={cn('pt-2', contentClassName)}>
        {children}
      </CardContent>
      {(footer || actions.length > 0) && (
        <>
          <Separator />
          <CardFooter className={cn('flex justify-between pt-4', footerClassName)}>
            {footer || <div />}
            {actions.length > 0 && (
              <div className="flex space-x-2">
                {actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={`action-${index}`}
                      variant={action.destructive ? 'destructive' : action.variant || 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when clicking action
                        action.onClick();
                      }}
                      disabled={action.disabled}
                    >
                      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

/**
 * @component InfoCardGroup
 * @description A component for displaying multiple InfoCard components in a responsive grid layout.
 *
 * @example
 * <InfoCardGroup columns={2} gap="md">
 *   <InfoCard title="Card 1">Content 1</InfoCard>
 *   <InfoCard title="Card 2">Content 2</InfoCard>
 *   <InfoCard title="Card 3">Content 3</InfoCard>
 *   <InfoCard title="Card 4">Content 4</InfoCard>
 * </InfoCardGroup>
 */
export interface InfoCardGroupProps {
  /**
   * InfoCard components to display in the grid
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class names to apply to the grid container
   */
  className?: string;
  
  /**
   * Number of columns to display in the grid
   * Responsive breakpoints are applied automatically
   * @default 1
   */
  columns?: 1 | 2 | 3 | 4;
  
  /**
   * Size of the gap between grid items
   * @default "md"
   */
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

export function InfoCardGroup({
  children,
  className = '',
  columns = 1,
  gap = 'md',
}: InfoCardGroupProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * @component InfoCardItem
 * @description A component for displaying a labeled piece of information within an InfoCard.
 * Provides consistent formatting for key-value pairs of information.
 *
 * @example
 * <InfoCardItem
 *   label="Email"
 *   value="john.doe@example.com"
 *   icon={Mail}
 * />
 */
export interface InfoCardItemProps {
  /**
   * Label text to display above the value
   */
  label: string;
  
  /**
   * Value to display
   * Can be a string or a React node for complex content
   */
  value: React.ReactNode;
  
  /**
   * Optional Lucide icon to display next to the item
   */
  icon?: LucideIcon;
  
  /**
   * Additional CSS class names to apply
   */
  className?: string;
}

export function InfoCardItem({
  label,
  value,
  icon: Icon,
  className = '',
}: InfoCardItemProps) {
  return (
    <div className={cn('flex items-start space-x-2 py-1', className)}>
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}