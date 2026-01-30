import React from "react";
import { Page } from "react-pdf";
import { useRef, useState } from "react";
import { useSignature } from "@/context/SignatureContext";
import { Rnd } from "react-rnd";
import SignatureCanvas from "react-signature-canvas";
import { X } from "lucide-react";

export default function PdfPage({ pageNumber }) {
  const containerRef = useRef(null);
  const signaturePadRef = useRef(null);
  const { blocks, setBlocks, currentStep, signatures, setSignatures } =
    useSignature();

  const [draft, setDraft] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);

  const pageBlocks = blocks.filter((b) => b.pageNumber === pageNumber);

  function getRelativePoint(e) {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  const handleSign = () => {
    if (signaturePadRef.current && activeBlockId) {
      if (signaturePadRef.current.isEmpty()) return;
      const dataUrl = signaturePadRef.current.toDataURL();
      setSignatures((prev) => ({ ...prev, [activeBlockId]: dataUrl }));
      setActiveBlockId(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-white ${currentStep === 2 ? "cursor-crosshair" : "cursor-default"}`}
      onMouseDown={(e) => {
        if (currentStep !== 2) return;
        if (e.target.closest(".react-draggable")) return;

        const p = getRelativePoint(e);
        setDraft({
          startX: p.x,
          startY: p.y,
          x: p.x,
          y: p.y,
          width: 0,
          height: 0,
        });
      }}
      onMouseMove={(e) => {
        if (!draft) return;
        const p = getRelativePoint(e);

        setDraft({
          ...draft,
          x: Math.min(p.x, draft.startX),
          y: Math.min(p.y, draft.startY),
          width: Math.abs(p.x - draft.startX),
          height: Math.abs(p.y - draft.startY),
        });
      }}
      onMouseUp={() => {
        if (!draft || draft.width < 20 || draft.height < 20) {
          setDraft(null);
          return;
        }

        setBlocks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            pageNumber,
            x: draft.x,
            y: draft.y,
            width: draft.width,
            height: draft.height,
          },
        ]);
        setDraft(null);
      }}
    >
      <Page
        pageNumber={pageNumber}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        className="max-w-full h-auto"
      />

      {/* Draft rectangle */}
      {draft && (
        <div
          className="absolute border-2 border-primary bg-primary/10 z-10"
          style={{
            left: draft.x,
            top: draft.y,
            width: draft.width,
            height: draft.height,
          }}
        />
      )}

      {/* Blocks */}
      {pageBlocks.map((block) => (
        <Rnd
          key={block.id}
          disableDragging={currentStep !== 2}
          enableResizing={currentStep === 2}
          bounds="parent"
          size={{ width: block.width, height: block.height }}
          position={{ x: block.x, y: block.y }}
          onDragStop={(e, d) => {
            setBlocks((prev) =>
              prev.map((b) =>
                b.id === block.id ? { ...b, x: d.x, y: d.y } : b
              )
            );
          }}
          onResizeStop={(e, dir, ref, delta, pos) => {
            setBlocks((prev) =>
              prev.map((b) =>
                b.id === block.id
                  ? {
                      ...b,
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      x: pos.x,
                      y: pos.y,
                    }
                  : b
              )
            );
          }}
          className={`group border-2 z-20 flex items-center justify-center overflow-hidden transition-all ${
            currentStep === 2
              ? "border-primary bg-primary/5 hover:bg-primary/10"
              : signatures[block.id]
                ? "border-transparent bg-transparent"
                : "border-muted-foreground border-dashed bg-muted hover:bg-muted/80 cursor-pointer"
          }`}
          onClick={() => {
            if (currentStep === 3) {
              setActiveBlockId(block.id);
            }
          }}
        >
          {currentStep === 2 && (
            <div className="absolute -top-3 -right-3 hidden group-hover:flex">
              <button
                onClick={() =>
                  setBlocks((prev) => prev.filter((b) => b.id !== block.id))
                }
                className="h-6 w-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {signatures[block.id] ? (
            <img
              src={signatures[block.id]}
              alt="Signature"
              className="w-full h-full object-contain pointer-events-none grayscale"
            />
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-40 select-none text-center px-2">
              {currentStep === 2 ? "Signature Area" : "Click to Sign"}
            </span>
          )}
        </Rnd>
      ))}

      {/* Signature Popup */}
      {activeBlockId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-card-foreground">Sign Document</h3>
              <button
                onClick={() => setActiveBlockId(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 rounded-xl border-2 border-border bg-muted overflow-hidden">
              <SignatureCanvas
                ref={signaturePadRef}
                penColor="black"
                canvasProps={{ className: "w-full h-48 cursor-crosshair bg-white" }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => signaturePadRef.current?.clear()}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Clear
              </button>
              <button
                onClick={handleSign}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Sign Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
