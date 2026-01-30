import { PenLine, Type, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldToolbarProps {
  onAddSignature: () => void;
  onAddText?: () => void;
  onAddDate?: () => void;
}

// Toolbar for adding fields to the PDF
export function FieldToolbar({ onAddSignature, onAddText, onAddDate }: FieldToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-card border-b border-border">
      <Button
        variant="secondary"
        size="sm"
        onClick={onAddSignature}
        className="flex items-center gap-2"
      >
        <PenLine className="w-4 h-4" />
        + signature
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddText}
        disabled
        className="flex items-center gap-2"
      >
        <Type className="w-4 h-4" />
        + text
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddDate}
        disabled
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        + date
      </Button>
    </div>
  );
}
