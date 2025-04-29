
// Import the core types
import { 
  AppointmentType as CoreAppointmentType, 
  Appointment as CoreAppointment,
  BaseAppointment as CoreBaseAppointment,
  AppointmentWithLuxon as CoreAppointmentWithLuxon,
  AvailabilitySettings as CoreAvailabilitySettings,
  AvailabilitySlot as CoreAvailabilitySlot,
  WeeklyAvailability as CoreWeeklyAvailability,
  CalculatedAvailableSlot as CoreCalculatedAvailableSlot,
  AppointmentAvailabilitySlot as CoreAppointmentAvailabilitySlot
} from '@/packages/core/types/appointment';

// Re-export the core types
export type AppointmentType = CoreAppointmentType;
export type Appointment = CoreAppointment;
export type BaseAppointment = CoreBaseAppointment;
export type AppointmentWithLuxon = CoreAppointmentWithLuxon;
export type AvailabilitySettings = CoreAvailabilitySettings;
export type AvailabilitySlot = CoreAvailabilitySlot;
export type WeeklyAvailability = CoreWeeklyAvailability;
export type CalculatedAvailableSlot = CoreCalculatedAvailableSlot;
export type AppointmentAvailabilitySlot = CoreAppointmentAvailabilitySlot;
