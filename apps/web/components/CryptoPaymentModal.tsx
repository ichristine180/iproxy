'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { nowPayments } from '@/lib/nowpayments';
import { createClient } from '@/lib/supabase/client';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess?: () => void;
}

export function CryptoPaymentModal({
  isOpen,
  onClose,
  amount,
  onSuccess,
}: CryptoPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('btc');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [currencies, setCurrencies] = useState<string[]>(['btc', 'eth', 'usdt', 'usdc']);
  const [allCurrencies, setAllCurrencies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
      getCurrentUser();
      setSearchQuery('');
    }
  }, [isOpen]);

  const getCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const availableCurrencies = await nowPayments.getAvailableCurrencies();
      setAllCurrencies(availableCurrencies);

      // Show popular currencies by default
      const popularCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'doge', 'ltc', 'ada', 'matic'];
      const filtered = availableCurrencies.filter(c => popularCurrencies.includes(c));
      if (filtered.length > 0) {
        setCurrencies(filtered);
      } else {
        // Fallback to first 10 currencies if popular ones not found
        setCurrencies(availableCurrencies.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
      // Set fallback currencies if API fails
      const fallbackCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'doge', 'ltc'];
      setAllCurrencies(fallbackCurrencies);
      setCurrencies(fallbackCurrencies);
    }
  };

  const getCurrencyName = (code: string) => {
    const names: Record<string, string> = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      usdt: 'Tether (USDT)',
      usdc: 'USD Coin',
      bnb: 'Binance Coin',
      xrp: 'Ripple',
      doge: 'Dogecoin',
      ltc: 'Litecoin',
      ada: 'Cardano',
      matic: 'Polygon',
    };
    return names[code] || code.toUpperCase();
  };

  const filteredCurrencies = searchQuery
    ? allCurrencies.filter(currency =>
        currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCurrencyName(currency).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currencies;

  // Auto-expand to all currencies when user starts searching
  const displayCurrencies = searchQuery ? filteredCurrencies : currencies;


  // Webhook will handle creating payment record, no need to create it here

  const handleCreatePayment = async () => {
    // If payment already exists, redirect to it
    if (paymentData?.invoice_url) {
      console.log('Reusing existing payment:', paymentData.invoice_url);
      window.location.href = paymentData.invoice_url;
      return;
    }

    console.log('Creating new payment - no existing payment data');

    setLoading(true);
    try {
      const orderId = `topup-${Date.now()}-${userId}`;

      const payment = await nowPayments.createInvoice({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: selectedCurrency,
        order_id: orderId,
        order_description: `Balance top-up: $${amount}`,
      });

      console.log('📋 Invoice creation response:', payment);

      setPaymentData(payment);

      // Redirect to payment page
      if (payment.invoice_url) {
        window.location.href = payment.invoice_url;
      } else {
        toast({
          title: 'Error',
          description: 'Payment URL not available',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Cryptocurrency</DialogTitle>
          <DialogDescription>
            Top up $${amount} using cryptocurrency
          </DialogDescription>
        </DialogHeader>

        {(
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Cryptocurrency</Label>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cryptocurrencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Currency Selection */}
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {displayCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.toUpperCase()}</span>
                        <span className="text-muted-foreground">{getCurrencyName(currency)}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {displayCurrencies.length === 0 && searchQuery && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No cryptocurrencies found
                    </div>
                  )}
                </SelectContent>
              </Select>

              {searchQuery && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {displayCurrencies.length} of {allCurrencies.length} currencies
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {!searchQuery && allCurrencies.length > currencies.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrencies(allCurrencies)}
                  className="w-full text-xs"
                >
                  Show All {allCurrencies.length} Currencies
                </Button>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">You will pay</p>
              <p className="text-2xl font-bold">${amount} USD</p>
              <p className="text-sm text-muted-foreground mt-1">
                in {getCurrencyName(selectedCurrency)}
              </p>
            </div>

            <Button
              onClick={handleCreatePayment}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}