import React, { useState, useRef, useCallback } from 'react';
import { Move, Trash2 } from 'lucide-react';

/**
 * Draggable and resizable signature field overlay
 * Positions are stored as percentages for responsive placement
 */
export function SignatureFieldOverlay({
  field,
  pageSize,
  scale,
  isActive,
  isEditable,
  onUpdate,
  onRemove,
  onSelect,
  onClick,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const fieldRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, fieldX: 0, fieldY: 0 });

  // Convert percentage to pixels for display
  const pixelX = (field.x / 100) * pageSize.width - (field.width / 100 * pageSize.width) / 2;
  const pixelY = (field.y / 100) * pageSize.height - (field.height / 100 * pageSize.height) / 2;
  const pixelWidth = (field.width / 100) * pageSize.width;
  const pixelHeight = (field.height / 100) * pageSize.height;

  const handleMouseDown = useCallback((e) => {
    if (!isEditable) return;
    e.stopPropagation();
    onSelect();
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };
  }, [isEditable, onSelect, field.x, field.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;

    if (isDragging) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      // Convert pixel delta to percentage
      const percentDeltaX = (deltaX / pageSize.width) * 100;
      const percentDeltaY = (deltaY / pageSize.height) * 100;

      const newX = Math.max(0, Math.min(100, dragStartRef.current.fieldX + percentDeltaX));
      const newY = Math.max(0, Math.min(100, dragStartRef.current.fieldY + percentDeltaY));

      onUpdate({ x: newX, y: newY });
    }
  }, [isDragging, isResizing, pageSize, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Attach global mouse listeners for drag
  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isEditable && onClick) {
      onClick();
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      ref={fieldRef}
      className={`absolute border-2 rounded cursor-move transition-colors ${
        field.isSigned
          ? 'border-green-500 bg-green-50/50'
          : isActive
          ? 'border-blue-500 bg-blue-50/50'
          : 'border-dashed border-gray-400 bg-gray-50/50 hover:border-blue-400'
      }`}
      style={{
        left: pixelX,
        top: pixelY,
        width: pixelWidth,
        height: pixelHeight,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Signed signature display */}
      {field.isSigned && field.signatureData && (
        <img
          src={field.signatureData}
          alt="Signature"
          className="w-full h-full object-contain p-1"
          draggable={false}
        />
      )}

      {/* Unsigned field placeholder */}
      {!field.isSigned && (
        <div className="flex items-center justify-center h-full text-xs text-gray-500">
          {isEditable ? (
            <div className="flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>Drag to position</span>
            </div>
          ) : (
            <span>Click to sign</span>
          )}
        </div>
      )}

      {/* Controls for active editable field */}
      {isActive && isEditable && (
        <div className="absolute -top-8 left-0 flex gap-1">
          <button
            onClick={handleRemove}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
            title="Remove field"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Resize handles */}
      {isActive && isEditable && (
        <>
          <div
            className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
            }}
          />
        </>
      )}
    </div>
  );
}
