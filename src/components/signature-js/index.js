/**
 * Document Signature Components
 * 
 * Usage:
 * import { DocumentSignatureApp } from './components/signature-js';
 * 
 * Required dependencies (add to package.json):
 * - pdf-lib: "^1.17.1" (for embedding signatures into PDFs)
 * 
 * Existing dependencies used:
 * - pdfjs-dist: "^2.16.105" (PDF rendering)
 * - react-signature-canvas: "^1.0.6" (drawing signatures)
 * - lucide-react: "^0.542.0" (icons)
 * - react-toastify: "^11.0.2" (notifications)
 */

export { DocumentSignatureApp } from './DocumentSignatureApp';
export { PDFViewer } from './PDFViewer';
export { SignatureModal } from './SignatureModal';
export { SignatureFieldOverlay } from './SignatureFieldOverlay';
export { FileUploadZone } from './FileUploadZone';
export { StepIndicator } from './StepIndicator';
export { SubmissionOptions } from './SubmissionOptions';
export { FieldToolbar } from './FieldToolbar';
export { useSignatureDocument } from './useSignatureDocument';
export { usePdfExport } from './usePdfExport';
