
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string into a human-readable format
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g. "January 1, 2023")
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return format(date, "MMMM d, yyyy");
}
