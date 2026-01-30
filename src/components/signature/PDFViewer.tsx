import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PDFDocument, SignatureField } from '@/types/signature';
import { SignatureFieldOverlay } from './SignatureFieldOverlay';

// Configure PDF.js worker - use cdnjs for proper CORS support
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onDocumentLoad(numPages);
  }, [onDocumentLoad]);

  const handlePageLoadSuccess = useCallback((page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height });
  }, []);

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
            <Document
              file={document.dataUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center w-[600px] h-[800px] bg-card">
                  <div className="animate-pulse text-muted-foreground">Loading PDF...</div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={handlePageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white"
              />
            </Document>

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
