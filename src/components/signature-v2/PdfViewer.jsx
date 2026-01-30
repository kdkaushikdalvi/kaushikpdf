import React from "react";
import { Document, pdfjs } from "react-pdf";
import { useState } from "react";
import { useSignature } from "@/context/SignatureContext";
import PdfPage from "./PdfPage";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer() {
  const { pdfFile } = useSignature();
  const [numPages, setNumPages] = useState(0);

  if (!pdfFile) return null;

  return (
    <div className="flex flex-col items-center bg-muted rounded-xl p-4 w-full overflow-auto max-h-[800px]">
      <Document
        file={pdfFile}
        onLoadSuccess={(doc) => setNumPages(doc.numPages)}
        className="flex flex-col gap-8"
        loading={
          <div className="flex items-center justify-center p-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          </div>
        }
      >
        {Array.from({ length: numPages }).map((_, i) => (
          <div key={i} className="shadow-2xl">
            <PdfPage pageNumber={i + 1} />
          </div>
        ))}
      </Document>
    </div>
  );
}
