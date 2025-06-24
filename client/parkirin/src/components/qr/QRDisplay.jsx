import React from 'react';
import QRCode from 'qrcode.react';
import { DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';

const QRDisplay = ({ qrData, title, onClose, onCopy }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      if (onCopy) onCopy();
    } catch (error) {
      console.error('Failed to copy QR data:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <QRCode
              value={qrData}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* QR Data */}
          <div className="w-full">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={qrData}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Copy QR data"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600">
            <p>Scan this QR code at the parking location</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;
