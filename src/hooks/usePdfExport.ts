import { useCallback } from 'react';
import { PDFDocument as PDFLibDocument, rgb } from 'pdf-lib';
import type { PDFDocument, SignatureField } from '@/types/signature';

// Custom hook to handle PDF export with embedded signatures
export function usePdfExport() {
  
  const embedSignatures = useCallback(async (
    document: PDFDocument,
    signatureFields: SignatureField[]
  ): Promise<Uint8Array> => {
    // Load the original PDF
    const existingPdfBytes = await document.file.arrayBuffer();
    const pdfDoc = await PDFLibDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    // Process each signature field
    for (const field of signatureFields) {
      if (!field.isSigned || !field.signatureData) continue;

      const page = pages[field.pageNumber - 1];
      if (!page) continue;

      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert percentage positions to actual coordinates
      // Note: PDF coordinates start from bottom-left, but we store from top-left
      const x = (field.x / 100) * pageWidth;
      const y = pageHeight - ((field.y / 100) * pageHeight) - ((field.height / 100) * pageHeight);
      const width = (field.width / 100) * pageWidth;
      const height = (field.height / 100) * pageHeight;

      try {
        // Handle both data URLs and base64 strings
        let imageData = field.signatureData;
        
        // Extract base64 data from data URL if present
        if (imageData.startsWith('data:')) {
          imageData = imageData.split(',')[1];
        }

        // Determine image type and embed
        const signatureBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        
        // Try to embed as PNG first, then as JPEG
        let embeddedImage;
        try {
          embeddedImage = await pdfDoc.embedPng(signatureBytes);
        } catch {
          try {
            embeddedImage = await pdfDoc.embedJpg(signatureBytes);
          } catch {
            // If image embedding fails, draw a placeholder rectangle
            page.drawRectangle({
              x,
              y,
              width,
              height,
              borderColor: rgb(0.4, 0.4, 0.8),
              borderWidth: 1,
            });
            continue;
          }
        }

        // Draw the signature image
        page.drawImage(embeddedImage, {
          x,
          y,
          width,
          height,
        });
      } catch (error) {
        console.error('Error embedding signature:', error);
      }
    }

    // Save and return the modified PDF
    return await pdfDoc.save();
  }, []);

  const downloadSignedPdf = useCallback(async (
    document: PDFDocument,
    signatureFields: SignatureField[]
  ) => {
    try {
      const pdfBytes = await embedSignatures(document, signatureFields);
      
      // Create blob and download - slice to ensure ArrayBuffer compatibility
      const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `signed_${document.name}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading signed PDF:', error);
      return false;
    }
  }, [embedSignatures]);

  return {
    embedSignatures,
    downloadSignedPdf,
  };
}
