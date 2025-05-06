
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to get the text height based on content
 * @param text The text content to measure
 * @param width The width constraint
 * @param fontSize Font size in pixels
 * @param lineHeight Line height multiplier
 * @returns Height in pixels
 */
export function getTextHeight(text: string, width: number, fontSize = 14, lineHeight = 1.5): number {
  if (!text || !width) return fontSize * lineHeight;
  
  // Create a hidden div to measure text
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.visibility = 'hidden';
  element.style.width = `${width}px`;
  element.style.fontSize = `${fontSize}px`;
  element.style.lineHeight = String(lineHeight);
  element.style.whiteSpace = 'pre-wrap';
  element.textContent = text;
  
  document.body.appendChild(element);
  const height = element.offsetHeight;
  document.body.removeChild(element);
  
  return Math.max(height, fontSize * lineHeight);
}

/**
 * Adds data attributes to an element for PDF generation
 * @param props Original props
 * @param value The value to display in PDF
 * @returns Enhanced props with data attributes
 */
export function withPdfAttributes(props: any, value: string): any {
  return {
    ...props,
    'data-pdf-value': value,
  };
}
