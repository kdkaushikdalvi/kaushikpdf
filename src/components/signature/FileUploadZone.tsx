import { useState, useCallback, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PDFDocument } from '@/types/signature';

interface FileUploadZoneProps {
  document: PDFDocument | null;
  onFileUpload: (file: File) => void;
}

// Drag and drop file upload zone for PDF files
export function FileUploadZone({ document, onFileUpload }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === 'application/pdf');

    if (pdfFile) {
      onFileUpload(pdfFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (document) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-fade-in">
        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{document.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(document.file.size / 1024 / 1024).toFixed(2)} MB
                {document.numPages > 0 && ` • ${document.numPages} page${document.numPages > 1 ? 's' : ''}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowseClick}
            >
              Change
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "drop-zone p-12 text-center",
          isDragging && "active"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors duration-300",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-foreground">
              Drag and drop files here
            </p>
            <p className="text-muted-foreground mt-1">or</p>
          </div>

          <Button onClick={handleBrowseClick} className="mt-2">
            Browse Files
          </Button>

          <p className="text-sm text-muted-foreground">
            Only PDF files are supported
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
