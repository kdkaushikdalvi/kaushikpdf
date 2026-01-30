import React, { useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";

export function FilePicker({ onFileSelect, onFileClear, selectedFile }) {
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file) => {
    if (file.type === "application/pdf") {
      onFileSelect(file);
      setError(null);
    } else {
      onFileClear();
      setError("Please select a valid PDF file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearFile = (e) => {
    e.stopPropagation();
    onFileClear();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
          selectedFile
            ? "border-foreground bg-muted"
            : "border-border bg-card hover:border-muted-foreground cursor-pointer"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border shadow-sm">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">
              Click to upload or drag and drop
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Only PDF files are allowed
            </p>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="truncate text-base font-semibold text-foreground max-w-[280px]">
              {selectedFile.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              onClick={clearFile}
              className="mt-6 text-sm font-bold text-destructive hover:text-destructive/80 transition-colors"
            >
              Remove file
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20">
          <p className="text-center text-sm font-semibold text-destructive">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
