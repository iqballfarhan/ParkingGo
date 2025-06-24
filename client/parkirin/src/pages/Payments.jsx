import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TRANSACTIONS, GET_PAYMENT_METHODS } from '../graphql/queries';
import { ADD_PAYMENT_METHOD, DELETE_PAYMENT_METHOD, TOP_UP_WALLET } from '../graphql/mutations';
import { LoadingSpinner, Button, Modal, Input, Card, Badge } from '../components/common';
import { formatCurrency, formatDate, formatPaymentStatus } from '../utils/formatters';
import Swal from 'sweetalert2';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, methods, topup
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const { data: transactionsData, loading: transactionsLoading, refetch: refetchTransactions } = useQuery(GET_TRANSACTIONS, {
    variables: { limit: 50 }
  });

  const { data: methodsData, loading: methodsLoading, refetch: refetchMethods } = useQuery(GET_PAYMENT_METHODS);

  const [addPaymentMethod, { loading: addingMethod }] = useMutation(ADD_PAYMENT_METHOD, {
    onCompleted: () => {
      setShowAddMethodModal(false);
      refetchMethods();
    }
  });

  const [deletePaymentMethod] = useMutation(DELETE_PAYMENT_METHOD, {
    onCompleted: () => refetchMethods()
  });

  const [topUpWallet, { loading: toppingUp }] = useMutation(TOP_UP_WALLET, {
    onCompleted: () => {
      setShowTopUpModal(false);
      setTopUpAmount('');
      refetchTransactions();
    }
  });

  const handleAddPaymentMethod = (methodData) => {
    addPaymentMethod({ variables: { input: methodData } });
  };

  const handleDelete = async (paymentMethodId) => {
    const confirm = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Apakah Anda yakin ingin menghapus metode pembayaran ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    deletePaymentMethod({ variables: { paymentMethodId } });
  };

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (amount > 0) {
      topUpWallet({ variables: { input: { amount, payment_method: "QRIS" } } });
    }
  };

  const transactions = transactionsData?.getMyTransactionHistory || [];
  const paymentMethods = methodsData?.getPaymentMethods || [];
  const walletBalance = transactionsData?.me?.saldo || 0;

  const tabs = [
    { id: 'transactions', name: 'Transaction History', count: transactions.length },
    { id: 'methods', name: 'Payment Methods', count: paymentMethods.length },
    { id: 'topup', name: 'Top Up Wallet', count: null }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your payment methods and view transaction history</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="mb-6 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Wallet Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(walletBalance)}</p>
            </div>
            <div className="text-4xl">💳</div>
          </div>
          <div className="mt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowTopUpModal(true)}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Top Up Wallet
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <Badge className="ml-2" color={activeTab === tab.id ? 'primary' : 'gray'}>
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>

          {transactionsLoading ? (
            <LoadingSpinner size="large" text="Loading transactions..." />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction._id}>
                  <Card.Content className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {transaction.type === 'top_up' ? '⬆️' : 
                           transaction.type === 'payment' ? '💳' : 
                           transaction.type === 'refund' ? '↩️' : '📄'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{transaction.description}</h4>                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.created_at)} • {transaction.payment_method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'top_up' || transaction.type === 'refund' 
                            ? 'text-green-600' 
                            : 'text-gray-900'
                        }`}>
                          {transaction.type === 'top_up' || transaction.type === 'refund' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <Badge color={formatPaymentStatus(transaction.status).color} size="sm">
                          {formatPaymentStatus(transaction.status).text}
                        </Badge>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'methods' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
            <Button onClick={() => setShowAddMethodModal(true)}>
              Add Payment Method
            </Button>
          </div>

          {methodsLoading ? (
            <LoadingSpinner size="large" text="Loading payment methods..." />
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-500 mb-4">Add a payment method to start making transactions</p>
              <Button onClick={() => setShowAddMethodModal(true)}>
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id}>
                  <Card.Content className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {method.type === 'credit_card' ? '💳' :
                           method.type === 'debit_card' ? '💳' :
                           method.type === 'bank_transfer' ? '🏦' :
                           method.type === 'e_wallet' ? '📱' : '💳'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-500">
                            {method.type.replace('_', ' ').toUpperCase()}
                            {method.lastFour && ` •••• ${method.lastFour}`}
                          </p>
                          {method.isDefault && (
                            <Badge color="green" size="sm" className="mt-1">Default</Badge>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'topup' && (
        <div className="max-w-md mx-auto">
          <Card>
            <Card.Header>
              <Card.Title>Top Up Wallet</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance
                </label>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(walletBalance)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top Up Amount
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="10000"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum top up: Rp 10,000</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount.toString())}
                    className="p-2 text-sm border border-gray-300 rounded-md hover:border-primary-500 hover:bg-primary-50"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleTopUp}
                className="w-full"
                disabled={!topUpAmount || parseFloat(topUpAmount) < 10000 || toppingUp}
                loading={toppingUp}
              >
                Top Up Wallet
              </Button>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddMethodModal}
        onClose={() => setShowAddMethodModal(false)}
        title="Add Payment Method"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Choose your preferred payment method to add to your account.</p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { type: 'credit_card', name: 'Credit Card', icon: '💳' },
              { type: 'debit_card', name: 'Debit Card', icon: '💳' },
              { type: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
              { type: 'e_wallet', name: 'E-Wallet', icon: '📱' }
            ].map((method) => (
              <button
                key={method.type}
                onClick={() => handleAddPaymentMethod(method)}
                disabled={addingMethod}
                className="p-4 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 text-center"
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <p className="text-sm font-medium">{method.name}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Top Up Modal */}
      <Modal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        title="Top Up Wallet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Top Up
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              min="10000"
              step="1000"
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleTopUp}
              loading={toppingUp}
              disabled={!topUpAmount || parseFloat(topUpAmount) < 10000}
            >
              Top Up
            </Button>
            <Button variant="outline" onClick={() => setShowTopUpModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Payments;