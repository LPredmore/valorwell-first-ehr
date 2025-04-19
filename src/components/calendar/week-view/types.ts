
export interface TimeBlock {
  id?: string;
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  type?: 'block' | 'unblock';
}

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
}
