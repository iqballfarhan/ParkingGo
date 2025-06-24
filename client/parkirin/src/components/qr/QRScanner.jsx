import React, { useState, useRef } from 'react';
import { QrCodeIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';

const QRScanner = ({ isOpen, onClose, onScanSuccess, onScanError }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file upload for QR scanning
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setScanning(true);
      setError('');

      // Create image element to process the file
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data for QR scanning
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Note: In a real implementation, you would use a QR code scanning library
        // like jsQR or qr-scanner to decode the QR code from the image data
        // For now, we'll simulate the scanning process
        
        setTimeout(() => {
          // Simulate QR code detection
          const mockQRData = 'booking_123456789'; // This would be the actual scanned data
          onScanSuccess(mockQRData);
          setScanning(false);
        }, 1000);
      };

      img.onerror = () => {
        setError('Failed to process image');
        setScanning(false);
      };

      img.src = URL.createObjectURL(file);
    } catch (err) {
      setError('Failed to scan QR code');
      setScanning(false);
      if (onScanError) onScanError(err);
    }
  };

  // Manual QR code input
  const [manualInput, setManualInput] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
      setManualInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="space-y-6">
          {/* Camera/File Upload Section */}
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              
              {scanning ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Scanning QR code...</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload an image containing a QR code
                  </p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <CameraIcon className="w-5 h-5 mr-2" />
                    Choose Image
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Manual Input Section */}
          <div>
            <div className="text-center text-sm text-gray-500 mb-4">
              <span>Or enter QR code manually</span>
            </div>
            
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter QR code data"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!manualInput.trim() || scanning}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit QR Code
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
