class MidtransService {
  constructor() {
    this.clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '';
    this.environment = import.meta.env.VITE_MIDTRANS_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
    this.isScriptLoaded = false;
  }

  // Load Midtrans Snap script
  async loadSnapScript() {
    if (this.isScriptLoaded || window.snap) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.environment === 'production' 
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.stg.midtrans.com/snap/snap.js';
      
      script.setAttribute('data-client-key', this.clientKey);
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Midtrans Snap script'));
      };

      document.head.appendChild(script);
    });
  }

  // Open Snap payment popup
  async openSnapPayment(snapToken, options = {}) {
    try {
      await this.loadSnapScript();
      
      if (!window.snap) {
        throw new Error('Midtrans Snap not loaded');
      }

      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          options.onSuccess?.(result);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          options.onPending?.(result);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          options.onError?.(result);
        },
        onClose: () => {
          console.log('Payment popup closed');
          options.onClose?.();
        },
      });
    } catch (error) {
      console.error('Failed to open Snap payment:', error);
      throw error;
    }
  }

  // Embed Snap payment in element
  async embedSnapPayment(snapToken, options) {
    try {
      await this.loadSnapScript();
      
      if (!window.snap) {
        throw new Error('Midtrans Snap not loaded');
      }

      window.snap.embed(snapToken, {
        embedId: options.embedId,
        onSuccess: (result) => {
          console.log('Payment success:', result);
          options.onSuccess?.(result);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          options.onPending?.(result);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          options.onError?.(result);
        },
        onClose: () => {
          console.log('Payment closed');
          options.onClose?.();
        },
      });
    } catch (error) {
      console.error('Failed to embed Snap payment:', error);
      throw error;
    }
  }

  // Helper method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Get payment methods
  getPaymentMethods() {
    return [
      {
        id: 'qris',
        name: 'QRIS',
        description: 'Bayar dengan scan QR Code',
        icon: '📱',
      },
      {
        id: 'virtual_account',
        name: 'Virtual Account',
        description: 'Transfer melalui ATM/Internet Banking',
        icon: '🏦',
      },
      {
        id: 'ewallet',
        name: 'E-Wallet',
        description: 'Gopay, Dana, OVO, ShopeePay',
        icon: '💳',
      },
      {
        id: 'credit_card',
        name: 'Kartu Kredit',
        description: 'Visa, Mastercard, JCB',
        icon: '💳',
      },
      {
        id: 'saldo',
        name: 'Saldo ParkirCepat',
        description: 'Bayar dengan saldo akun',
        icon: '💰',
      },
    ];
  }

  // Validate amount
  validateAmount(amount) {
    return amount >= 1000 && amount <= 500000000; // Min 1k, Max 500M
  }

  // Get minimum amount
  getMinimumAmount() {
    return 1000;
  }

  // Get maximum amount
  getMaximumAmount() {
    return 500000000;
  }
}

export const midtransService = new MidtransService(); 