
export interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  clientId?: string;
  clientName?: string;
  clinicianId?: string;
  clinicianName?: string;
  status?: 'confirmed' | 'pending' | 'cancelled';
  type?: string;
  color?: string;
  notes?: string;
}
