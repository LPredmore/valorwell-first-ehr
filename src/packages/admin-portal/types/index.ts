
import { AppRole } from '@/packages/core/types';

export interface AdminUser {
  id: string;
  email: string;
  role: AppRole;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface PracticeSettings {
  practiceName: string;
  npi: string;
  taxId: string;
  taxonomyCode: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface AdminSettings {
  id: string;
  practiceInfo: PracticeSettings;
  updatedAt: string;
}
