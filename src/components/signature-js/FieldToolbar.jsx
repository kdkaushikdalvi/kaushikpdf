import React from 'react';
import { Plus, FileSignature } from 'lucide-react';

/**
 * Toolbar for adding signature fields to the document
 */
export function FieldToolbar({ onAddField, currentPage, fieldCount }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">Signature Fields</h3>
        <span className="text-sm text-gray-500">
          {fieldCount} field{fieldCount !== 1 ? 's' : ''} added
        </span>
      </div>

      <button
        onClick={() => onAddField(currentPage)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Signature Field</span>
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Click to add a field, then drag to position it on the document
      </p>

      {fieldCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <FileSignature className="w-4 h-4" />
            <span>Fields ready for signing</span>
          </div>
        </div>
      )}
    </div>
  );
}
