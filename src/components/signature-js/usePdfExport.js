import { useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';

/**
 * Hook for exporting signed PDFs using pdf-lib
 * Converts percentage-based field positions to PDF coordinates
 */
export function usePdfExport() {
  
  const exportSignedPdf = useCallback(async (document, signatureFields) => {
    if (!document?.file) {
      throw new Error('No document to export');
    }

    // Load the original PDF
    const arrayBuffer = await document.file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    // Process each signature field
    for (const field of signatureFields) {
      if (!field.isSigned || !field.signatureData) continue;

      const page = pages[field.pageNumber - 1];
      if (!page) continue;

      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert percentage-based coordinates to PDF points
      // PDF coordinate system: origin at bottom-left
      const sigWidth = (field.width / 100) * pageWidth;
      const sigHeight = (field.height / 100) * pageHeight;
      const sigX = (field.x / 100) * pageWidth - sigWidth / 2;
      // Flip Y coordinate (percentage is from top, PDF is from bottom)
      const sigY = pageHeight - (field.y / 100) * pageHeight - sigHeight / 2;

      try {
        // Embed the signature image
        const signatureImageBytes = await fetch(field.signatureData).then(res => res.arrayBuffer());
        
        let signatureImage;
        if (field.signatureData.includes('image/png')) {
          signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        } else {
          signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
        }

        // Draw the signature on the page
        page.drawImage(signatureImage, {
          x: sigX,
          y: sigY,
          width: sigWidth,
          height: sigHeight,
        });
      } catch (error) {
        console.error('Failed to embed signature:', error);
      }
    }

    // Save and return the modified PDF
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }, []);

  const downloadSignedPdf = useCallback(async (document, signatureFields, filename) => {
    const pdfBlob = await exportSignedPdf(document, signatureFields);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename || `signed-${document.name}`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportSignedPdf]);

  return {
    exportSignedPdf,
    downloadSignedPdf,
  };
}
