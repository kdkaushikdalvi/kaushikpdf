import { useState, useCallback } from 'react';

/**
 * Custom hook to manage document signature state
 * Stores field positions as percentages for responsive placement
 */
export function useSignatureDocument() {
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload' | 'fields' | 'submission' | 'sign'
  const [document, setDocument] = useState(null);
  const [signatureFields, setSignatureFields] = useState([]);
  const [submissionType, setSubmissionType] = useState('sign-now');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [activeFieldId, setActiveFieldId] = useState(null);

  // Steps configuration for the wizard
  const steps = [
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

  const goToStep = useCallback((step) => {
    const targetIndex = steps.findIndex(s => s.key === step);
    if (targetIndex <= currentStepIndex) {
      setCurrentStep(step);
    }
  }, [currentStepIndex, steps]);

  // Document handlers
  const handleFileUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setDocument({
        file,
        name: file.name,
        numPages: 0,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const setNumPages = useCallback((numPages) => {
    setDocument(prev => prev ? { ...prev, numPages } : null);
  }, []);

  // Signature field handlers - positions stored as percentages
  const addSignatureField = useCallback((pageNumber) => {
    const newField = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageNumber,
      x: 50, // Center of page (percentage)
      y: 50,
      width: 25,
      height: 10,
      isSigned: false,
    };
    setSignatureFields(prev => [...prev, newField]);
    setActiveFieldId(newField.id);
    return newField.id;
  }, []);

  const updateSignatureField = useCallback((fieldId, updates) => {
    setSignatureFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  }, []);

  const removeSignatureField = useCallback((fieldId) => {
    setSignatureFields(prev => prev.filter(f => f.id !== fieldId));
    if (activeFieldId === fieldId) {
      setActiveFieldId(null);
    }
  }, [activeFieldId]);

  const signField = useCallback((fieldId, signatureData, signatureType) => {
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
    currentStep,
    currentStepIndex,
    steps,
    document,
    signatureFields,
    submissionType,
    recipientEmail,
    activeFieldId,
    canGoNext,
    goToNextStep,
    goToPrevStep,
    goToStep,
    handleFileUpload,
    setNumPages,
    addSignatureField,
    updateSignatureField,
    removeSignatureField,
    signField,
    setActiveFieldId,
    setSubmissionType,
    setRecipientEmail,
    reset,
  };
}
