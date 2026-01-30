import { useState, useCallback } from 'react';
import type { PDFDocument, SignatureField, WizardStep, SubmissionType } from '@/types/signature';

// Custom hook to manage document signature state
export function useSignatureDocument() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('sign-now');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Steps configuration for the wizard
  const steps: { key: WizardStep; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'fields', label: 'Fields' },
    { key: 'submission', label: 'Submission' },
    { key: 'sign', label: 'Sign' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  // Navigation helpers
  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        return document !== null;
      case 'fields':
        return signatureFields.length > 0;
      case 'submission':
        return submissionType === 'sign-now' || (submissionType === 'send-email' && recipientEmail.includes('@'));
      case 'sign':
        return signatureFields.every(f => f.isSigned);
      default:
        return false;
    }
  }, [currentStep, document, signatureFields, submissionType, recipientEmail]);

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  }, [currentStepIndex, steps]);

  const goToPrevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  }, [currentStepIndex, steps]);

  const goToStep = useCallback((step: WizardStep) => {
    const targetIndex = steps.findIndex(s => s.key === step);
    // Only allow going to completed or current steps
    if (targetIndex <= currentStepIndex) {
      setCurrentStep(step);
    }
  }, [currentStepIndex, steps]);

  // Document handlers
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setDocument({
        file,
        name: file.name,
        numPages: 0, // Will be set when PDF loads
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const setNumPages = useCallback((numPages: number) => {
    setDocument(prev => prev ? { ...prev, numPages } : null);
  }, []);

  // Signature field handlers
  const addSignatureField = useCallback((pageNumber: number) => {
    const newField: SignatureField = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageNumber,
      x: 50, // Center of page
      y: 50,
      width: 25,
      height: 10,
      isSigned: false,
    };
    setSignatureFields(prev => [...prev, newField]);
    setActiveFieldId(newField.id);
    return newField.id;
  }, []);

  const updateSignatureField = useCallback((fieldId: string, updates: Partial<SignatureField>) => {
    setSignatureFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  }, []);

  const removeSignatureField = useCallback((fieldId: string) => {
    setSignatureFields(prev => prev.filter(f => f.id !== fieldId));
    if (activeFieldId === fieldId) {
      setActiveFieldId(null);
    }
  }, [activeFieldId]);

  const signField = useCallback((fieldId: string, signatureData: string, signatureType: 'draw' | 'type' | 'upload') => {
    setSignatureFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, signatureData, signatureType, isSigned: true }
          : field
      )
    );
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setCurrentStep('upload');
    setDocument(null);
    setSignatureFields([]);
    setSubmissionType('sign-now');
    setRecipientEmail('');
    setActiveFieldId(null);
  }, []);

  return {
    // State
    currentStep,
    currentStepIndex,
    steps,
    document,
    signatureFields,
    submissionType,
    recipientEmail,
    activeFieldId,

    // Navigation
    canGoNext,
    goToNextStep,
    goToPrevStep,
    goToStep,

    // Document
    handleFileUpload,
    setNumPages,

    // Fields
    addSignatureField,
    updateSignatureField,
    removeSignatureField,
    signField,
    setActiveFieldId,

    // Submission
    setSubmissionType,
    setRecipientEmail,

    // Reset
    reset,
  };
}
