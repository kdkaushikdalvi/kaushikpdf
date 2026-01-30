import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

/**
 * Drag-and-drop zone for PDF file upload
 */
export function FileUploadZone({ onFileSelect, currentFile }) {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  }, [onFileSelect]);

  if (currentFile) {
    return (
      <div className="flex items-center justify-center p-8 bg-green-50 border-2 border-green-200 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">{currentFile.name}</p>
            <p className="text-sm text-green-600">
              {(currentFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <label className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg cursor-pointer transition-colors">
            Change File
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
    >
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Upload className="w-10 h-10 text-gray-400" />
      </div>
      <p className="text-lg font-medium text-gray-700 mb-1">
        Drop your PDF here
      </p>
      <p className="text-sm text-gray-500 mb-4">
        or click to browse
      </p>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileInput}
        className="hidden"
      />
      <span className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
        Select PDF
      </span>
    </label>
  );
}
