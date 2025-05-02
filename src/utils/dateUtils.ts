
/**
 * This file provides date utility functions for use in the DocumentationTab component
 * and other parts of the application.
 */

import { TimeZoneService } from './timezone';

/**
 * Format a date in a user-friendly way
 * @param date Date to format
 * @param format Format string
 */
export const formatDate = (date: Date | string, format: string = 'MMMM d, yyyy'): string => {
  return TimeZoneService.formatDate(date, format);
};

/**
 * Format a date and time 
 * @param date Date to format
 * @param format Format string
 */
export const formatDateTime = (date: Date | string, format: string = 'MMM d, yyyy h:mm a'): string => {
  return TimeZoneService.formatDateTime(date, format);
};

/**
 * Get the relative time from now (e.g. "2 days ago")
 * @param date Date to compare
 */
export const getRelativeTimeFromNow = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Check if a date is in the past
 * @param date Date to check
 */
export const isDateInPast = (date: Date | string): boolean => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate < now;
};

/**
 * Check if a date is in the future
 * @param date Date to check
 */
export const isDateInFuture = (date: Date | string): boolean => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate > now;
};

/**
 * Format a date based on how recent it is
 * @param date Date to format
 */
export const formatSmartDate = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return TimeZoneService.formatTime(targetDate, 'h:mm a');
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return TimeZoneService.formatDate(targetDate, 'EEEE');
  return TimeZoneService.formatDate(targetDate, 'MMM d, yyyy');
};
