import React, { useState, useRef, useCallback, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Pen, Type, Upload, RotateCcw } from 'lucide-react';

/**
 * Modal for capturing signatures via draw, type, or upload
 * Returns signature as base64 PNG data URL
 */
export function SignatureModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const sigCanvasRef = useRef(null);
  const typedCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clear all inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setTypedName('');
      setUploadedImage(null);
      setHasDrawing(false);
      if (sigCanvasRef.current) {
        sigCanvasRef.current.clear();
      }
    }
  }, [isOpen]);

  // Check if Apply button should be enabled
  const canApply = () => {
    switch (activeTab) {
      case 'draw':
        return hasDrawing;
      case 'type':
        return typedName.trim().length > 0;
      case 'upload':
        return uploadedImage !== null;
      default:
        return false;
    }
  };

  // Convert typed name to signature image using canvas
  const renderTypedSignature = useCallback(() => {
    if (!typedCanvasRef.current || !typedName.trim()) return null;
    
    const canvas = typedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 100;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = 'italic 48px "Dancing Script", cursive, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
  }, [typedName]);

  const handleSave = () => {
    let signatureData = null;
    let signatureType = activeTab;

    switch (activeTab) {
      case 'draw':
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
          signatureData = sigCanvasRef.current.toDataURL('image/png');
        }
        break;
      case 'type':
        signatureData = renderTypedSignature();
        break;
      case 'upload':
        signatureData = uploadedImage;
        break;
    }

    if (signatureData) {
      onSave(signatureData, signatureType);
      onClose();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearDrawing = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setHasDrawing(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { key: 'draw', label: 'Draw', icon: Pen },
    { key: 'type', label: 'Type', icon: Type },
    { key: 'upload', label: 'Upload', icon: Upload },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Add Your Signature</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Draw Tab */}
          {activeTab === 'draw' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  canvasProps={{
                    width: 450,
                    height: 150,
                    className: 'w-full rounded-lg',
                    style: { touchAction: 'none' }
                  }}
                  backgroundColor="transparent"
                  penColor="black"
                  onEnd={() => setHasDrawing(true)}
                />
              </div>
              <button
                onClick={clearDrawing}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}

          {/* Type Tab */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Preview */}
              <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                {typedName ? (
                  <span 
                    className="text-4xl text-gray-800"
                    style={{ fontFamily: '"Dancing Script", cursive, serif', fontStyle: 'italic' }}
                  >
                    {typedName}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Preview will appear here</span>
                )}
              </div>
              
              {/* Hidden canvas for rendering */}
              <canvas ref={typedCanvasRef} className="hidden" />
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-32 mx-auto border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload PNG or JPG</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canApply()}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              canApply()
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
          >
            Apply Signature
          </button>
          </button>
        </div>
      </div>
    </div>
  );
}
