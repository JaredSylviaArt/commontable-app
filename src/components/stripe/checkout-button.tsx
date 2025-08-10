"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getStripeClient } from '@/lib/stripe-client';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  listingId: string;
  title: string;
  price: number;
  imageUrl?: string;
  disabled?: boolean;
  buyerId: string;
  deliveryMethod?: 'pickup' | 'local_delivery' | 'shipping';
}

export function CheckoutButton({ 
  listingId, 
  title, 
  price, 
  imageUrl, 
  disabled = false,
  buyerId,
  deliveryMethod = 'pickup'
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          buyerId,
          deliveryMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await getStripeClient();
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error.message || 'Something went wrong with checkout',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy Now - ${price.toFixed(2)}
        </>
      )}
    </Button>
  );
}
