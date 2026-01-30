// Types for the document signature application

export type SignatureType = 'draw' | 'type' | 'upload';

export interface SignatureField {
  id: string;
  pageNumber: number;
  // Position as percentage of page dimensions (0-100)
  x: number;
  y: number;
  // Size as percentage of page dimensions
  width: number;
  height: number;
  // Signature data once signed
  signatureData?: string;
  signatureType?: SignatureType;
  isSigned: boolean;
}

export interface PDFDocument {
  file: File;
  name: string;
  numPages: number;
  dataUrl: string;
}

export type WizardStep = 'upload' | 'fields' | 'submission' | 'sign';

export interface SignatureModalState {
  isOpen: boolean;
  fieldId: string | null;
}

export type SubmissionType = 'sign-now' | 'send-email';
