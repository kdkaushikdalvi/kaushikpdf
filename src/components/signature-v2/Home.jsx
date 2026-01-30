import React from "react";
import { useSignature } from "@/context/SignatureContext";
import { FilePicker } from "./FilePicker";
import PdfViewer from "./PdfViewer";
import { PDFDocument } from "pdf-lib";
import { PenTool, ArrowRight, Download, Check } from "lucide-react";

export default function Home() {
  const {
    pdfFile,
    setPdfFile,
    currentStep,
    setCurrentStep,
    blocks,
    signatures,
  } = useSignature();

  const handleFileSelect = (file) => {
    setPdfFile(file);
  };

  const handleFileClear = () => {
    setPdfFile(null);
  };

  const nextStep = () => {
    if (pdfFile) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const downloadSignedPdf = async () => {
    if (!pdfFile) return;

    const existingPdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    for (const block of blocks) {
      const signatureDataUrl = signatures[block.id];
      if (!signatureDataUrl) continue;

      const pageIndex = block.pageNumber - 1;
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Convert data URL to bytes
      const signatureImageBytes = await fetch(signatureDataUrl).then((res) =>
        res.arrayBuffer()
      );
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      // react-pdf and pdf-lib have different coordinate systems
      // react-pdf: (0,0) is top-left
      // pdf-lib: (0,0) is bottom-left

      // Simple heuristic for POC:
      const renderedWidth = 612; // Standard US Letter width in points (approx)
      const scale = width / renderedWidth;

      page.drawImage(signatureImage, {
        x: block.x * scale,
        y: height - (block.y + block.height) * scale,
        width: block.width * scale,
        height: block.height * scale,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signed_${pdfFile.name}`;
    link.click();
  };

  const allBlocksSigned =
    blocks.length > 0 && blocks.every((b) => signatures[b.id]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header / Stepper Navigation */}
      <nav className="border-b border-border bg-card px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PenTool className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">PDFSign</span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            {[
              { step: 1, label: "Upload" },
              { step: 2, label: "Prepare" },
              { step: 3, label: "Sign" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 ${currentStep >= s.step ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors ${
                      currentStep === s.step
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep > s.step
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                    }`}
                  >
                    {currentStep > s.step ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      s.step
                    )}
                  </span>
                  {s.label}
                </div>
                {i < 2 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>

          <div>
            {currentStep === 3 && (
              <button
                disabled={!allBlocksSigned}
                onClick={downloadSignedPdf}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  allBlocksSigned
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Download className="h-4 w-4" />
                Save & Download
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl p-6">
        {currentStep === 1 && (
          <div className="mx-auto mt-20 max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Sign your PDF
              </h1>
              <p className="mt-3 text-muted-foreground">
                Upload the document you want to sign. We support PDF files.
              </p>
            </div>
            <FilePicker
              selectedFile={pdfFile}
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
            />
            {pdfFile && (
              <button
                onClick={nextStep}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Continue to Prepare
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Prepare Document</h2>
                <p className="text-sm text-muted-foreground">
                  Draw rectangles where you want to place signatures.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  disabled={blocks.length === 0}
                  onClick={nextStep}
                  className={`rounded-lg px-6 py-2 text-sm font-bold transition-all ${
                    blocks.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Go to Sign
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-sm">
              <PdfViewer />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Sign Document</h2>
                <p className="text-sm text-muted-foreground">
                  Click on the areas you created to sign them.
                </p>
              </div>
              <button
                onClick={prevStep}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Back to Prepare
              </button>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-sm">
              <PdfViewer />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
