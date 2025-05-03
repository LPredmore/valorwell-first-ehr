
/**
 * Formats a phone number to (XXX) XXX-XXXX format
 */
export const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber) {
    return '';
  }

  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  } else {
    // If not a standard 10-digit number, return the original but cleaned
    return cleaned;
  }
};

export default formatPhoneNumber;
