import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

/**
 * @typedef StatusType
 * @description Defines the available status types for the StatusBadge component
 */
export type StatusType =
  | 'success'
  | 'pending'
  | 'warning'
  | 'error'
  | 'info'
  | 'scheduled'
  | 'cancelled'
  | 'completed'
  | 'in-progress'
  | 'on-hold'
  | 'custom';

/**
 * @interface StatusConfig
 * @description Internal configuration for each status type
 */
interface StatusConfig {
  /**
   * Default label text to display
   */
  label: string;
  
  /**
   * Icon component to display
   */
  icon: LucideIcon;
  
  /**
   * CSS class names for styling
   */
  className: string;
}

const STATUS_CONFIG: Record<Exclude<StatusType, 'custom'>, StatusConfig> = {
  'success': {
    label: 'Success',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 hover:bg-green-100'
  },
  'pending': {
    label: 'Pending',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
  },
  'warning': {
    label: 'Warning',
    icon: AlertTriangle,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
  },
  'error': {
    label: 'Error',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 hover:bg-red-100'
  },
  'info': {
    label: 'Info',
    icon: HelpCircle,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  },
  'scheduled': {
    label: 'Scheduled',
    icon: Calendar,
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100'
  },
  'cancelled': {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 hover:bg-red-100'
  },
  'completed': {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 hover:bg-green-100'
  },
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
  },
  'on-hold': {
    label: 'On Hold',
    icon: AlertCircle,
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
  }
};

/**
 * @component StatusBadge
 * @description A component for displaying status indicators with consistent styling.
 * Provides visual indicators for different status types with appropriate colors and icons.
 *
 * @example
 * // Basic usage
 * <StatusBadge status="success" />
 *
 * @example
 * // With custom label
 * <StatusBadge status="pending" label="In Review" />
 *
 * @example
 * // Icon only variant
 * <StatusBadge status="error" iconOnly />
 */
export interface StatusBadgeProps {
  /**
   * The type of status to display
   */
  status: StatusType;
  
  /**
   * Optional custom label text
   * If not provided, uses the default label for the status type
   */
  label?: string;
  
  /**
   * Optional custom icon
   * If not provided, uses the default icon for the status type
   */
  icon?: React.ReactNode;
  
  /**
   * Additional CSS class names to apply
   */
  className?: string;
  
  /**
   * The visual style variant of the badge
   * @default "default"
   */
  variant?: 'default' | 'outline' | 'secondary';
  
  /**
   * The size of the badge
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg';
  
  /**
   * Whether to show only the icon without text
   * @default false
   */
  iconOnly?: boolean;
}

export function StatusBadge({
  status,
  label,
  icon,
  className = '',
  variant = 'default',
  size = 'default',
  iconOnly = false,
}: StatusBadgeProps) {
  // Get status configuration or use defaults for custom status
  const config = status !== 'custom' ? STATUS_CONFIG[status] : {
    label: label || 'Custom',
    icon: HelpCircle,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  };

  // Use provided label/icon or fallback to config
  const displayLabel = label || config.label;
  const IconComponent = config.icon;
  const displayIcon = icon || <IconComponent className={cn(
    size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
    iconOnly ? '' : 'mr-1'
  )} />;

  // Size classes
  const sizeClasses = {
    'sm': 'text-xs px-2 py-0.5',
    'default': 'text-sm px-2.5 py-0.5',
    'lg': 'text-base px-3 py-1'
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'flex items-center font-medium',
        className
      )}
    >
      {displayIcon}
      {!iconOnly && displayLabel}
    </Badge>
  );
}

/**
 * Convenience components for common status types.
 * These components provide a simpler API for specific status types.
 */

/**
 * @component SuccessBadge
 * @description A pre-configured StatusBadge with "success" status
 */
export function SuccessBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="success" {...props} />;
}

/**
 * @component PendingBadge
 * @description A pre-configured StatusBadge with "pending" status
 */
export function PendingBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="pending" {...props} />;
}

/**
 * @component WarningBadge
 * @description A pre-configured StatusBadge with "warning" status
 */
export function WarningBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="warning" {...props} />;
}

/**
 * @component ErrorBadge
 * @description A pre-configured StatusBadge with "error" status
 */
export function ErrorBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="error" {...props} />;
}

/**
 * @component InfoBadge
 * @description A pre-configured StatusBadge with "info" status
 */
export function InfoBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="info" {...props} />;
}

/**
 * @component ScheduledBadge
 * @description A pre-configured StatusBadge with "scheduled" status
 */
export function ScheduledBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="scheduled" {...props} />;
}

/**
 * @component CancelledBadge
 * @description A pre-configured StatusBadge with "cancelled" status
 */
export function CancelledBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="cancelled" {...props} />;
}

/**
 * @component CompletedBadge
 * @description A pre-configured StatusBadge with "completed" status
 */
export function CompletedBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="completed" {...props} />;
}

/**
 * @component InProgressBadge
 * @description A pre-configured StatusBadge with "in-progress" status
 */
export function InProgressBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="in-progress" {...props} />;
}

/**
 * @component OnHoldBadge
 * @description A pre-configured StatusBadge with "on-hold" status
 */
export function OnHoldBadge(props: Omit<StatusBadgeProps, 'status'>) {
  return <StatusBadge status="on-hold" {...props} />;
}