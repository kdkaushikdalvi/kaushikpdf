import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, PenTool } from 'lucide-react';
import { SignatureFieldOverlay } from './SignatureFieldOverlay';

// Configure PDF.js worker with specific version
export const PDF_WORKER_URL = "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js";
pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

/**
 * PDF Viewer using pdfjs-dist directly
 * Renders PDF to canvas and overlays signature fields
 * Supports draw-to-place mode for creating signature fields
 */
export function PDFViewer({
  document,
  signatureFields,
  activeFieldId,
  onDocumentLoad,
  onFieldUpdate,
  onFieldRemove,
  onFieldSelect,
  onFieldClick,
  onPageChange,
  onAddField,
  isEditable = true,
}) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawRect, setDrawRect] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pageContainerRef = useRef(null);

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
      const context = canvas.getContext('2d');

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

  // Notify parent whenever currentPage changes
  useEffect(() => {
    console.log('[PDFViewer] Current page changed to:', currentPage);
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(2, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));

  // Get fields for current page
  const currentPageFields = signatureFields.filter(f => f.pageNumber === currentPage);

  // Drawing handlers
  const handleMouseDown = useCallback((e) => {
    if (!isDrawMode || !isEditable || !pageContainerRef.current) return;
    
    const rect = pageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setDrawRect({ x, y, width: 0, height: 0 });
  }, [isDrawMode, isEditable]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !drawStart || !pageContainerRef.current) return;
    
    const rect = pageContainerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, pageSize.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, pageSize.height));
    
    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);
    
    setDrawRect({ x, y, width, height });
  }, [isDrawing, drawStart, pageSize]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawRect || !onAddField) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawRect(null);
      return;
    }
    
    // Minimum size check (at least 50x30 pixels)
    if (drawRect.width >= 50 && drawRect.height >= 30) {
      // Convert to percentage-based coordinates
      // Calculate center position in percentages
      const centerX = ((drawRect.x + drawRect.width / 2) / pageSize.width) * 100;
      const centerY = ((drawRect.y + drawRect.height / 2) / pageSize.height) * 100;
      const widthPercent = (drawRect.width / pageSize.width) * 100;
      const heightPercent = (drawRect.height / pageSize.height) * 100;
      
      onAddField(currentPage, {
        x: centerX,
        y: centerY,
        width: widthPercent,
        height: heightPercent,
      });
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setDrawRect(null);
    setIsDrawMode(false);
  }, [isDrawing, drawRect, onAddField, pageSize, currentPage]);

  // Global mouse up listener
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDrawing, handleMouseUp]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 rounded-t-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {currentPage} of {numPages || '...'}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Draw mode toggle */}
          {isEditable && onAddField && (
            <button
              onClick={() => setIsDrawMode(!isDrawMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDrawMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Draw signature field"
            >
              <PenTool className="w-4 h-4" />
              <span className="text-sm font-medium">Draw Field</span>
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Draw mode hint */}
      {isDrawMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 text-center">
          <span className="text-sm text-blue-700 font-medium">
            ✏️ Draw rectangles where you want to place signatures.
          </span>
          <span className="text-xs text-blue-500 block mt-1">
            Click and drag to create a signature field
          </span>
        </div>
      )}

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-6"
        onClick={() => !isDrawMode && onFieldSelect(null)}
      >
        <div className="flex justify-center">
          <div 
            ref={pageContainerRef}
            className={`relative shadow-lg transition-all duration-200 ${
              isDrawMode 
                ? 'cursor-crosshair ring-2 ring-blue-400 ring-offset-2 hover:ring-blue-500' 
                : ''
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            {loading ? (
              <div className="flex items-center justify-center w-[600px] h-[800px] bg-white">
                <div className="text-gray-500">Loading PDF...</div>
              </div>
            ) : (
              <canvas ref={canvasRef} className="bg-white" />
            )}

            {/* Drawing rectangle preview */}
            {isDrawing && drawRect && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-100/30 pointer-events-none"
                style={{
                  left: drawRect.x,
                  top: drawRect.y,
                  width: drawRect.width,
                  height: drawRect.height,
                }}
              />
            )}

            {/* Signature Fields Overlay */}
            {pageSize.width > 0 && currentPageFields.map(field => (
              <SignatureFieldOverlay
                key={field.id}
                field={field}
                pageSize={pageSize}
                scale={scale}
                isActive={field.id === activeFieldId}
                isEditable={isEditable && !isDrawMode}
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
