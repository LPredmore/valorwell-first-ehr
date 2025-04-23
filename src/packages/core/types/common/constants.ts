
export const contactMethodOptions = [
  'Email',
  'Phone',
  'Text',
  'Any'
] as const;

export type ContactMethodType = typeof contactMethodOptions[number];

export const clientStatusOptions = [
  'New',
  'Active',
  'Inactive',
  'Waiting',
  'Discharged'
] as const;

export type ClientStatusType = typeof clientStatusOptions[number];

export const genderOptions = [
  'Male',
  'Female',
  'Non-binary',
  'Other',
  'Prefer not to say'
] as const;

export type GenderType = typeof genderOptions[number];

export const sessionTypeOptions = [
  'Initial Assessment',
  'Individual Therapy',
  'Group Therapy',
  'Family Therapy',
  'Couples Therapy',
  'Crisis Intervention',
  'Follow-up'
] as const;

export type SessionType = typeof sessionTypeOptions[number];
