
export const insuranceTypeOptions = [
  'Private Insurance',
  'Medicare',
  'Medicaid',
  'VA Benefits',
  'TRICARE',
  'CHAMPVA',
  'Self-Pay'
] as const;

export const relationshipOptions = [
  'Self',
  'Spouse',
  'Child',
  'Parent',
  'Guardian',
  'Other'
] as const;

export type InsuranceType = typeof insuranceTypeOptions[number];
export type RelationshipType = typeof relationshipOptions[number];
