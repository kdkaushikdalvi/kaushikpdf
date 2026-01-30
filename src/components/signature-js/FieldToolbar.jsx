import React from 'react';
import { Plus, FileSignature, X } from 'lucide-react';

// Color palette for different pages
const pageColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
];

const getPageColor = (pageNumber) => {
  return pageColors[(pageNumber - 1) % pageColors.length];
};

/**
 * Toolbar for adding signature fields to the document
 */
export function FieldToolbar({ onAddField, currentPage, fieldCount, signatureFields, onRemoveField, onGoToPage }) {
  const currentPageColor = getPageColor(currentPage);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800">Signature Fields</h3>
        <span className="text-sm text-gray-500">
          {fieldCount} field{fieldCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Page indicator with circled number */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-sm text-gray-600">Page</span>
        <div className={`w-10 h-10 rounded-full border-2 ${currentPageColor.border} ${currentPageColor.bg} flex items-center justify-center shadow-sm`}>
          <span className={`text-base font-bold ${currentPageColor.text}`}>{currentPage}</span>
        </div>
      </div>

      <button
        onClick={() => onAddField(currentPage)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Field</span>
      </button>

      {/* Field list with page indicators */}
      {signatureFields && signatureFields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Placed Fields:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {signatureFields.map((field, index) => {
              const fieldColor = getPageColor(field.pageNumber);
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onGoToPage?.(field.pageNumber)}
                >
                  <div className="flex items-center gap-2">
                    <FileSignature className={`w-4 h-4 ${fieldColor.text}`} />
                    <span className="text-sm text-gray-700">Field {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 ${fieldColor.bg} ${fieldColor.text} rounded-full font-semibold border ${fieldColor.border}`}>
                      P{field.pageNumber}
                    </span>
                    {field.isSigned && (
                      <span className="text-xs text-green-600 font-bold">✓</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveField?.(field.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
