'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Wallet, CreditCard, TrendingUp, Bitcoin, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { CryptoPaymentModal } from '@/components/CryptoPaymentModal';

export default function Balance() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [selectedAmount, setSelectedAmount] = useState('25');
  const [customAmount, setCustomAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadUserBalance();
    loadTransactions();

    // Check for payment status from URL params
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({
        title: 'Payment Successful',
        description: 'Your balance has been updated',
      });
      // Remove payment param from URL
      window.history.replaceState({}, '', '/dashboard/balance');
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your top-up was cancelled',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/dashboard/balance');
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

  const loadTransactions = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: transactionData, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading transactions:', error);
      } else {
        setTransactions(transactionData || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleTopUp = () => {
    const amount = parseFloat(selectedAmount === 'custom' ? customAmount : selectedAmount);

    if (!amount || amount <= 0) {
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
    const amount = parseFloat(selectedAmount === 'custom' ? customAmount : selectedAmount);
    setCurrentBalance(prev => prev + amount);
    toast({
      title: 'Balance Updated',
      description: `${amount} has been added to your balance`,
    });
    // Reload the actual balance from database
    loadUserBalance();
    loadTransactions();
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      deposit: { variant: 'default' as const, label: 'Deposit' },
      withdrawal: { variant: 'secondary' as const, label: 'Withdrawal' },
      refund: { variant: 'outline' as const, label: 'Refund' },
      payment: { variant: 'destructive' as const, label: 'Payment' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.deposit;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Balance & Billing</h1>
        <p className="text-muted-foreground">Manage your account balance and top-up</p>
         <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? '...' : `${currentBalance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>
      </div>

     

      <Card>
        <CardHeader>
          <CardTitle> Current Balance</CardTitle>
          <CardDescription>Add credits to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Select Amount</Label>
            <RadioGroup value={selectedAmount} onValueChange={setSelectedAmount}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['5', '25', '50', '100'].map((amount) => (
                  <div key={amount} className="relative">
                    <RadioGroupItem
                      value={amount}
                      id={`amount-${amount}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`amount-${amount}`}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-2xl font-bold">${amount}</span>
                    </Label>
                  </div>
                ))}
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="custom"
                  id="amount-custom"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="amount-custom"
                  className="flex items-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="mr-4">Custom Amount:</span>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount('custom');
                    }}
                    className="flex-1 text-foreground bg-background"
                    min="0.01"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">NowPayments</p>
                  <p className="text-sm text-muted-foreground">Pay with 150+ cryptocurrencies</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Pay with Crypto</Button>
            </div>
          </div>

          <Button onClick={handleTopUp} size="lg" className="w-full">
            Top Up ${selectedAmount === 'custom' ? customAmount || '0' : selectedAmount}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent balance changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              transactions.map((transaction, i) => (
                <div key={transaction.id || i} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{transaction.description || 'Transaction'}</p>
                      {getTransactionTypeBadge(transaction.type)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                      <span className="text-xs">
                        Balance: ${parseFloat(transaction.balance_before).toFixed(2)} → ${parseFloat(transaction.balance_after).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className={`font-semibold ${parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(transaction.amount) > 0 ? '+' : ''}${parseFloat(transaction.amount).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CryptoPaymentModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        amount={parseFloat(selectedAmount === 'custom' ? customAmount : selectedAmount)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
