import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSignatureDocument } from '@/hooks/useSignatureDocument';
import { usePdfExport } from '@/hooks/usePdfExport';
import { LandingHero } from '@/components/signature/LandingHero';
import { StepIndicator } from '@/components/signature/StepIndicator';
import { FileUploadZone } from '@/components/signature/FileUploadZone';
import { PDFViewer } from '@/components/signature/PDFViewer';
import { FieldToolbar } from '@/components/signature/FieldToolbar';
import { SubmissionOptions } from '@/components/signature/SubmissionOptions';
import { SignatureModal } from '@/components/signature/SignatureModal';
import type { SignatureType } from '@/types/signature';
import { toast } from '@/hooks/use-toast';

// Main document signature application
export default function DocumentSignatureApp() {
  const [showWizard, setShowWizard] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
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
  } = useSignatureDocument();

  const { downloadSignedPdf } = usePdfExport();

  // Handle opening signature modal for a field
  const handleFieldClick = (fieldId: string) => {
    const field = signatureFields.find(f => f.id === fieldId);
    if (field && !field.isSigned && currentStep === 'sign') {
      setSigningFieldId(fieldId);
      setSignatureModalOpen(true);
    }
  };

  // Handle signature save
  const handleSignatureSave = (signatureData: string, signatureType: SignatureType) => {
    if (signingFieldId) {
      signField(signingFieldId, signatureData, signatureType);
      setSigningFieldId(null);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!document) return;
    
    setIsDownloading(true);
    const success = await downloadSignedPdf(document, signatureFields);
    setIsDownloading(false);

    if (success) {
      toast({
        title: 'Success!',
        description: 'Your signed PDF has been downloaded.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to download the signed PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle going back to landing
  const handleBack = () => {
    if (currentStepIndex === 0) {
      reset();
      setShowWizard(false);
    } else {
      goToPrevStep();
    }
  };

  // Landing page
  if (!showWizard) {
    return <LandingHero onGetStarted={() => setShowWizard(true)} />;
  }

  // Check if all fields are signed
  const allFieldsSigned = signatureFields.length > 0 && signatureFields.every(f => f.isSigned);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with navigation */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <StepIndicator
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={goToStep}
          />

          {currentStep === 'sign' && allFieldsSigned ? (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <>Downloading...</>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goToNextStep}
              disabled={!canGoNext()}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <FileUploadZone
              document={document}
              onFileUpload={handleFileUpload}
            />
          </div>
        )}

        {/* Step 2: Fields - Add signature fields */}
        {currentStep === 'fields' && document && (
          <div className="flex-1 flex flex-col">
            <FieldToolbar
              onAddSignature={() => addSignatureField(1)}
            />
            <div className="flex-1">
              <PDFViewer
                document={document}
                signatureFields={signatureFields}
                activeFieldId={activeFieldId}
                onDocumentLoad={setNumPages}
                onFieldUpdate={updateSignatureField}
                onFieldRemove={removeSignatureField}
                onFieldSelect={setActiveFieldId}
                isEditable={true}
              />
            </div>
          </div>
        )}

        {/* Step 3: Submission type */}
        {currentStep === 'submission' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <SubmissionOptions
              submissionType={submissionType}
              recipientEmail={recipientEmail}
              onSubmissionTypeChange={setSubmissionType}
              onRecipientEmailChange={setRecipientEmail}
            />
          </div>
        )}

        {/* Step 4: Sign */}
        {currentStep === 'sign' && document && (
          <div className="flex-1 flex flex-col">
            {/* Status bar */}
            <div className="p-4 bg-secondary border-b border-border">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {allFieldsSigned ? (
                    <>
                      <Check className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        All signatures complete!
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Click on each signature field to add your signature
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {signatureFields.filter(f => f.isSigned).length} of {signatureFields.length} signed
                </span>
              </div>
            </div>

            <div className="flex-1">
              <PDFViewer
                document={document}
                signatureFields={signatureFields}
                activeFieldId={activeFieldId}
                onDocumentLoad={setNumPages}
                onFieldUpdate={updateSignatureField}
                onFieldRemove={removeSignatureField}
                onFieldSelect={setActiveFieldId}
                onFieldClick={handleFieldClick}
                isEditable={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setSigningFieldId(null);
        }}
        onSave={handleSignatureSave}
      />
    </div>
  );
}
