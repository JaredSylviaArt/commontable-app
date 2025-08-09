import { loadStripe } from '@stripe/stripe-js';

export const getStripeClient = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};
