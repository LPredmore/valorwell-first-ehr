
/**
 * Document Types
 * 
 * This file contains types related to documents and document generation.
 */

// Define the document categories
export enum DocumentCategory {
  Assessment = 'assessment',
  Treatment = 'treatment',
  LegalConsent = 'legal_consent',
  ClientHistory = 'client_history',
  Other = 'other'
}

// Define a document template
export interface DocumentTemplate {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  template: any;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Document info for storing in the database
export interface DocumentInfo {
  clientId: string;
  documentType: string;
  documentDate: Date;
  documentTitle: string;
  createdBy?: string;
}
