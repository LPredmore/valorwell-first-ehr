
/**
 * Formats a client's full name from their first and last name properties
 * @param client Client object with first and last name properties
 * @returns Formatted client full name
 */
export const formatClientName = (client: any): string => {
  if (!client) return 'Unnamed Client';
  
  // Handle different property naming conventions used across the app
  const firstName = client.client_first_name || client.first_name || '';
  const lastName = client.client_last_name || client.last_name || '';
  
  if (!firstName && !lastName) return 'Unnamed Client';
  
  return `${firstName} ${lastName}`.trim();
};

/**
 * Gets a safe client name from an appointment object
 * @param appointment Appointment object which may contain client info
 * @returns Client name string or default value if not available
 */
export const getClientNameFromAppointment = (appointment: any): string => {
  // First check if clientName is directly available
  if (appointment?.clientName) return appointment.clientName;
  
  // Then check if we have a client object
  if (appointment?.client) {
    return formatClientName(appointment.client);
  }
  
  // Finally check for client ID
  if (appointment?.clientId || appointment?.client_id) {
    return `Client ${appointment.clientId || appointment.client_id}`;
  }
  
  return 'Unnamed Client';
};
