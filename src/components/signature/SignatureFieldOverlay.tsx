import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SignatureField } from '@/types/signature';

interface SignatureFieldOverlayProps {
  field: SignatureField;
  pageSize: { width: number; height: number };
  scale: number;
  isActive: boolean;
  isEditable: boolean;
  onUpdate: (updates: Partial<SignatureField>) => void;
  onRemove: () => void;
  onSelect: () => void;
  onClick?: () => void;
}

// Draggable and resizable signature field overlay on PDF
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
}: SignatureFieldOverlayProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, fieldX: 0, fieldY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Calculate pixel positions from percentages
  const pixelX = (field.x / 100) * pageSize.width * scale;
  const pixelY = (field.y / 100) * pageSize.height * scale;
  const pixelWidth = (field.width / 100) * pageSize.width * scale;
  const pixelHeight = (field.height / 100) * pageSize.height * scale;

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    };
  }, [isEditable, field.x, field.y, onSelect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: field.width,
      height: field.height,
    };
  }, [isEditable, field.width, field.height]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - dragStart.current.x) / (pageSize.width * scale) * 100;
        const deltaY = (e.clientY - dragStart.current.y) / (pageSize.height * scale) * 100;
        
        const newX = Math.max(0, Math.min(100 - field.width, dragStart.current.fieldX + deltaX));
        const newY = Math.max(0, Math.min(100 - field.height, dragStart.current.fieldY + deltaY));
        
        onUpdate({ x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = (e.clientX - resizeStart.current.x) / (pageSize.width * scale) * 100;
        const deltaY = (e.clientY - resizeStart.current.y) / (pageSize.height * scale) * 100;
        
        const newWidth = Math.max(10, Math.min(100 - field.x, resizeStart.current.width + deltaX));
        const newHeight = Math.max(5, Math.min(100 - field.y, resizeStart.current.height + deltaY));
        
        onUpdate({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, field, pageSize, scale, onUpdate]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && !isResizing && onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={fieldRef}
      className={cn(
        "absolute signature-field flex items-center justify-center",
        isActive && "active",
        (isDragging || isResizing) && "cursor-grabbing",
        !isDragging && !isResizing && isEditable && "cursor-grab"
      )}
      style={{
        left: pixelX,
        top: pixelY,
        width: pixelWidth,
        height: pixelHeight,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Field content */}
      {field.isSigned && field.signatureData ? (
        <img
          src={field.signatureData}
          alt="Signature"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      ) : (
        <span className="text-xs font-medium text-primary uppercase tracking-wide select-none">
          Signature
        </span>
      )}

      {/* Remove button (only when active and editable) */}
      {isActive && isEditable && !field.isSigned && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Resize handle (only when active and editable) */}
      {isActive && isEditable && !field.isSigned && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize hover:scale-110 transition-transform"
        />
      )}
    </div>
  );
}
