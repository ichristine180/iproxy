'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { CryptoPaymentModal } from '@/components/CryptoPaymentModal';
import { Bitcoin } from 'lucide-react';

export default function DepositPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('10');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserBalance();

    // Check for payment status from URL params
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({
        title: 'Payment Successful',
        description: 'Your balance has been updated',
      });
      // Remove payment param from URL
      window.history.replaceState({}, '', '/dashboard/deposit');
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your deposit was cancelled',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/dashboard/deposit');
    }
  }, [searchParams, toast]);

  const loadUserBalance = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();

      if (data.success && data.wallet) {
        setCurrentBalance(data.wallet.balance);
      } else {
        console.error('Error loading balance:', data.error);
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = () => {
    const depositAmount = parseFloat(amount);

    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setShowCryptoModal(true);
  };

  const handlePaymentSuccess = () => {
    const depositAmount = parseFloat(amount);
    setCurrentBalance(prev => prev + depositAmount);
    toast({
      title: 'Balance Updated',
      description: `$${depositAmount} has been added to your balance`,
    });
    // Reload the actual balance from database
    loadUserBalance();
  };

  return (
    <div className="bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-white rounded-full" />
              </div>
              <h1 className="text-3xl font-bold text-white">Crypto</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Bitcoin Icon */}
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Bitcoin className="w-6 h-6 text-white" />
              </div>

              {/* Ethereum Icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                </svg>
              </div>

              {/* Tether Icon */}
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">₮</span>
              </div>

              {/* Plus Button */}
              <button className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center transition-colors">
                <span className="text-white text-2xl">+</span>
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-8 p-4 border border-blue-500/30 bg-blue-500/10 rounded-xl">
            <p className="text-blue-400 text-center text-lg">
              No refund will be available for cryptocurrency payments
            </p>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Deposit Amount */}
            <div>
              <label className="block text-white text-xl font-medium mb-3">
                Deposit amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-6 py-4 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-2xl placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                placeholder="10"
                min="0.01"
                step="0.01"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-white text-xl font-medium mb-3">
                Currency
              </label>
              <div className="w-full px-6 py-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-400 text-2xl flex items-center">
                USD
              </div>
            </div>
          </div>

          {/* Safe & Secure Badge */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-neutral-400 text-lg">Safe & secure checkout</span>
           
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={isLoading}
            className="w-full py-5 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-400))]/10 text-white text-2xl font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pay
          </button>
        </div>
      </div>

      <CryptoPaymentModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        amount={parseFloat(amount)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
