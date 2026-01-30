import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PDFDocument, SignatureField } from '@/types/signature';
import { SignatureFieldOverlay } from './SignatureFieldOverlay';

// Configure PDF.js worker with specific version
export const PDF_WORKER_URL = "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js";
pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

interface PDFViewerProps {
  document: PDFDocument;
  signatureFields: SignatureField[];
  activeFieldId: string | null;
  onDocumentLoad: (numPages: number) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<SignatureField>) => void;
  onFieldRemove: (fieldId: string) => void;
  onFieldSelect: (fieldId: string | null) => void;
  onFieldClick?: (fieldId: string) => void;
  isEditable?: boolean;
}

export function PDFViewer({
  document,
  signatureFields,
  activeFieldId,
  onDocumentLoad,
  onFieldUpdate,
  onFieldRemove,
  onFieldSelect,
  onFieldClick,
  isEditable = true,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    if (!document?.dataUrl) return;

    setLoading(true);
    
    // Convert data URL to Uint8Array
    const base64 = document.dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    pdfjsLib.getDocument({ data: bytes }).promise.then((pdf) => {
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      onDocumentLoad(pdf.numPages);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load PDF:', error);
      setLoading(false);
    });
  }, [document?.dataUrl, onDocumentLoad]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    pdfDoc.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      setPageSize({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      page.render(renderContext);
    });
  }, [pdfDoc, currentPage, scale]);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(2, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));

  // Get fields for current page
  const currentPageFields = signatureFields.filter(f => f.pageNumber === currentPage);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-card border-b border-border rounded-t-xl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {currentPage} of {numPages || '...'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 2}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/50 p-6 scrollbar-thin"
        onClick={() => onFieldSelect(null)}
      >
        <div className="flex justify-center">
          <div className="relative pdf-page-shadow">
            {loading ? (
              <div className="flex items-center justify-center w-[600px] h-[800px] bg-card">
                <div className="animate-pulse text-muted-foreground">Loading PDF...</div>
              </div>
            ) : (
              <canvas ref={canvasRef} className="bg-white" />
            )}

            {/* Signature Fields Overlay */}
            {pageSize.width > 0 && currentPageFields.map(field => (
              <SignatureFieldOverlay
                key={field.id}
                field={field}
                pageSize={pageSize}
                scale={scale}
                isActive={field.id === activeFieldId}
                isEditable={isEditable}
                onUpdate={(updates) => onFieldUpdate(field.id, updates)}
                onRemove={() => onFieldRemove(field.id)}
                onSelect={() => onFieldSelect(field.id)}
                onClick={() => onFieldClick?.(field.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
