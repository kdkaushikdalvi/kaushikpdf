import React, { useState } from 'react';
import { FileSignature, ArrowLeft, ArrowRight, Download, Send, RotateCcw } from 'lucide-react';
import { useSignatureDocument } from './useSignatureDocument';
import { usePdfExport } from './usePdfExport';
import { StepIndicator } from './StepIndicator';
import { FileUploadZone } from './FileUploadZone';
import { PDFViewer } from './PDFViewer';
import { FieldToolbar } from './FieldToolbar';
import { SubmissionOptions } from './SubmissionOptions';
import { SignatureModal } from './SignatureModal';
import { toast } from 'react-toastify';

/**
 * Main Document Signature Application
 * Wizard-based flow: Upload → Add Fields → Submission Options → Sign → Download
 */
export function DocumentSignatureApp() {
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
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingFieldId, setSigningFieldId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle field click during sign step
  const handleFieldClick = (fieldId) => {
    const field = signatureFields.find(f => f.id === fieldId);
    if (field && !field.isSigned && currentStep === 'sign') {
      setSigningFieldId(fieldId);
      setShowSignatureModal(true);
    }
  };

  // Apply signature to field
  const handleSignatureApply = (signatureData, signatureType) => {
    if (signingFieldId) {
      signField(signingFieldId, signatureData, signatureType);
      setSigningFieldId(null);
      toast.success('Signature applied!');
    }
  };

  // Export and download signed PDF
  const handleDownload = async () => {
    if (!document || !signatureFields.every(f => f.isSigned)) {
      toast.error('Please sign all fields first');
      return;
    }

    setIsExporting(true);
    try {
      await downloadSignedPdf(document, signatureFields);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle send to recipient (placeholder)
  const handleSendToRecipient = () => {
    toast.info('Send to recipient feature requires backend integration');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileSignature className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SignDoc</h1>
              <p className="text-sm text-gray-500">Document Signature App</p>
            </div>
          </div>

          {document && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <StepIndicator
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={goToStep}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Your Document
              </h2>
              <p className="text-gray-500">
                Start by uploading the PDF document you want to sign
              </p>
            </div>
            <FileUploadZone
              onFileSelect={handleFileUpload}
              currentFile={document?.file}
            />
          </div>
        )}

        {/* Fields Step */}
        {currentStep === 'fields' && document && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden h-[600px]">
              <PDFViewer
                document={document}
                signatureFields={signatureFields}
                activeFieldId={activeFieldId}
                onDocumentLoad={setNumPages}
                onFieldUpdate={updateSignatureField}
                onFieldRemove={removeSignatureField}
                onFieldSelect={setActiveFieldId}
                onPageChange={setCurrentPage}
                isEditable={true}
              />
            </div>
            <div>
              <FieldToolbar
                onAddField={addSignatureField}
                currentPage={currentPage}
                fieldCount={signatureFields.length}
              />
            </div>
          </div>
        )}

        {/* Submission Options Step */}
        {currentStep === 'submission' && (
          <div className="py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Signing Method
              </h2>
              <p className="text-gray-500">
                Sign now or send to someone else
              </p>
            </div>
            <SubmissionOptions
              submissionType={submissionType}
              onTypeChange={setSubmissionType}
              recipientEmail={recipientEmail}
              onEmailChange={setRecipientEmail}
            />
          </div>
        )}

        {/* Sign Step */}
        {currentStep === 'sign' && document && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Sign Your Document
              </h2>
              <p className="text-gray-500">
                Click on each signature field to add your signature
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                {signatureFields.filter(f => f.isSigned).length} of {signatureFields.length} signatures complete
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[600px]">
              <PDFViewer
                document={document}
                signatureFields={signatureFields}
                activeFieldId={null}
                onDocumentLoad={setNumPages}
                onFieldUpdate={updateSignatureField}
                onFieldRemove={removeSignatureField}
                onFieldSelect={() => {}}
                onFieldClick={handleFieldClick}
                isEditable={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      {document && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={goToPrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex gap-3">
              {currentStep === 'sign' && signatureFields.every(f => f.isSigned) && (
                <>
                  {submissionType === 'sign-now' ? (
                    <button
                      onClick={handleDownload}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Download Signed PDF'}
                    </button>
                  ) : (
                    <button
                      onClick={handleSendToRecipient}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send to Recipient
                    </button>
                  )}
                </>
              )}

              {currentStep !== 'sign' && (
                <button
                  onClick={goToNextStep}
                  disabled={!canGoNext()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setSigningFieldId(null);
        }}
        onSave={handleSignatureApply}
      />
    </div>
  );
}
