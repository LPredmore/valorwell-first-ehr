
export const relationshipOptions = [
  'Self',
  'Parent',
  'Guardian',
  'Spouse',
  'Partner',
  'Sibling',
  'Friend',
  'Other'
] as const;

export const insuranceTypeOptions = [
  'Primary',
  'Secondary',
  'Tertiary',
  'None'
] as const;

export type RelationshipType = typeof relationshipOptions[number];
export type InsuranceType = typeof insuranceTypeOptions[number];
