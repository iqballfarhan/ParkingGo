import React, { useState } from 'react';
import { CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const PaymentMethodSelector = ({ onSelectMethod, selectedMethod }) => {
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, Mastercard, etc.',
      icon: CreditCardIcon,
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer via bank',
      icon: BanknotesIcon,
      available: true
    },
    {
      id: 'gopay',
      name: 'GoPay',
      description: 'Pay with GoPay wallet',
      icon: DevicePhoneMobileIcon,
      available: true
    },
    {
      id: 'ovo',
      name: 'OVO',
      description: 'Pay with OVO wallet',
      icon: DevicePhoneMobileIcon,
      available: true
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Select Payment Method</h3>
      
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            disabled={!method.available}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${
              !method.available
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center space-x-3">
              <method.icon className="w-6 h-6 text-gray-600" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              
              {selectedMethod === method.id && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              
              {!method.available && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
