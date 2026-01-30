import React from 'react';
import { Plus, FileSignature } from 'lucide-react';

/**
 * Toolbar for adding signature fields to the document
 */
export function FieldToolbar({ onAddField, currentPage, fieldCount }) {
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
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-50 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-600">{currentPage}</span>
        </div>
      </div>

      <button
        onClick={() => onAddField(currentPage)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Field</span>
      </button>

      {fieldCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-sm text-green-600">
            <FileSignature className="w-4 h-4" />
            <span>Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
