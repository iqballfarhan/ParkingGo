import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { TOP_UP_WALLET } from '../../graphql/mutations';
import { useLocation } from 'react-router-dom';

const GET_ME = gql`
  query Me {
    me {
      _id
      saldo
    }
  }
`;

const GET_PAYMENT_HISTORY = gql`
  query GetMyPaymentHistory {
    getMyPaymentHistory {
      _id
      amount
      payment_method
      status
      createdAt
    }
  }
`;

const Wallet = () => {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const { data: userData, loading: userLoading, refetch: refetchSaldo } = useQuery(GET_ME);
  const { data: historyData, loading: historyLoading } = useQuery(GET_PAYMENT_HISTORY);
  const [topUpSaldo] = useMutation(TOP_UP_WALLET);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Jika ada order_id dan transaction_status di query string, refetch saldo
    const params = new URLSearchParams(location.search);
    if (params.get('order_id') && params.get('transaction_status')) {
      refetchSaldo();
    }
  }, [location.search, refetchSaldo]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!topUpAmount || topUpAmount < 10000) return;

    try {
      const result = await topUpSaldo({
        variables: {
          input: {
            amount: parseInt(topUpAmount),
            payment_method: paymentMethod
          }
        }
      });

      if (result.data?.topUpSaldo?.payment_url) {
        window.open(result.data.topUpSaldo.payment_url, '_blank');
        setTopUpSuccess(true);
      }
    } catch (error) {
      console.error('Error during top up:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  if (userLoading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="w-full py-6 px-2 sm:px-4">
      <h1 className="text-2xl font-bold text-[#f16634] mb-8">My Wallet</h1>
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-[#f16634] to-[#f89b6c] rounded-xl p-6 text-white mb-8 shadow-md">
        <h2 className="text-lg font-medium mb-2">Current Balance</h2>
        <p className="text-3xl font-bold">{formatCurrency(userData?.me?.saldo || 0)}</p>
      </div>
      {/* Top Up Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-[#f16634] mb-4">Top Up Balance</h3>
        <form onSubmit={handleTopUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              min="10000"
              step="1000"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Minimum Rp 10,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634]"
            >
              <option value="QRIS">QRIS</option>
              <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
              <option value="EWALLET">E-Wallet</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#f16634] text-white rounded-lg hover:bg-[#d35400] transition"
          >
            Top Up
          </button>
        </form>
        {topUpSuccess && (
          <div className="mt-4">
            <button
              onClick={() => refetchSaldo()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Check Balance
            </button>
            <p className="text-xs text-gray-500 mt-2">
              After successful payment, click "Check Balance" to update your balance.
            </p>
          </div>
        )}
      </div>
      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-[#f16634] mb-4">Transaction History</h3>
        {historyLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f16634]"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {historyData?.getMyPaymentHistory?.length > 0 ? (
              historyData.getMyPaymentHistory.map((transaction) => (
                <div key={transaction._id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-[#f9fafb]">
                  <div>
                    <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    <p className="text-sm text-gray-600">{transaction.payment_method}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${
                    transaction.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800' 
                      : transaction.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No transaction history yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;