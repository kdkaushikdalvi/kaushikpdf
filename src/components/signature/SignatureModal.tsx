import { useState, useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Type, Pencil, Upload, X, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SignatureType } from '@/types/signature';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string, signatureType: SignatureType) => void;
}

type TabType = 'draw' | 'type' | 'upload';

// Modal for capturing signatures via draw, type, or upload
export function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [typedName, setTypedName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'draw', label: 'Draw', icon: <Pencil className="w-4 h-4" /> },
    { key: 'type', label: 'Type', icon: <Type className="w-4 h-4" /> },
    { key: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
  ];

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const generateTypedSignature = useCallback((): string => {
    // Create a canvas to render the typed signature
    const canvas = window.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Set canvas size
    canvas.width = 400;
    canvas.height = 150;

    // Clear and make transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the signature text
    ctx.font = 'italic 48px "Dancing Script", cursive';
    ctx.fillStyle = '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  }, [typedName]);

  const handleSave = () => {
    let signatureData = '';

    switch (activeTab) {
      case 'draw':
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
          signatureData = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
        }
        break;
      case 'type':
        if (typedName.trim()) {
          signatureData = generateTypedSignature();
        }
        break;
      case 'upload':
        if (uploadedImage) {
          signatureData = uploadedImage;
        }
        break;
    }

    if (signatureData) {
      onSave(signatureData, activeTab);
      handleClose();
    }
  };

  const handleClose = () => {
    setTypedName('');
    setUploadedImage(null);
    sigCanvasRef.current?.clear();
    onClose();
  };

  const canSave = () => {
    switch (activeTab) {
      case 'draw':
        return sigCanvasRef.current && !sigCanvasRef.current.isEmpty();
      case 'type':
        return typedName.trim().length > 0;
      case 'upload':
        return uploadedImage !== null;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Your Signature</DialogTitle>
        </DialogHeader>

        {/* Tab buttons */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {/* Draw tab */}
          {activeTab === 'draw' && (
            <div className="animate-fade-in">
              <div className="signature-canvas-container border border-border relative">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  canvasProps={{
                    className: 'w-full h-[200px]',
                    style: { width: '100%', height: '200px' },
                  }}
                  backgroundColor="transparent"
                  penColor="#1a1a2e"
                />
                <button
                  onClick={clearSignature}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  title="Clear"
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Draw your signature above
              </p>
            </div>
          )}

          {/* Type tab */}
          {activeTab === 'type' && (
            <div className="space-y-4 animate-fade-in">
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your name"
                className="text-lg"
                autoFocus
              />
              {typedName && (
                <div className="p-6 bg-card border border-border rounded-xl text-center">
                  <span className="text-4xl font-signature text-foreground">
                    {typedName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upload tab */}
          {activeTab === 'upload' && (
            <div className="animate-fade-in">
              {uploadedImage ? (
                <div className="relative">
                  <div className="p-4 bg-card border border-border rounded-xl">
                    <img
                      src={uploadedImage}
                      alt="Uploaded signature"
                      className="max-h-[150px] mx-auto object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="drop-zone p-8 cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Click to upload signature image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG, transparent background recommended
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave()} className="flex-1">
            Apply Signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
