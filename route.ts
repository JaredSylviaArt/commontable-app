import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Stripe secret key is not set in environment variables.');
}

// Initialize Stripe, but only if the key is available.
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// This is the domain of your application.
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://commontable.app';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured. Missing API secret key.' }, { status: 500 });
  }
  try {
    const { listing } = await req.json();

    if (!listing || !listing.price || !listing.id) {
        return NextResponse.json({ error: 'Missing listing information.' }, { status: 400 });
    }

    // TODO: In a real app, you would fetch the seller's Stripe Connect account ID
    // from your database based on the listing's author ID.
    const sellerStripeAccountId = 'acct_...'; // Placeholder

    if (!sellerStripeAccountId) {
        return NextResponse.json({ error: 'Seller has not connected a Stripe account.' }, { status: 400 });
    }

    // Prices in Stripe are in cents, so we multiply by 100.
    const priceInCents = Math.round(listing.price * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              images: [listing.imageUrl],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${DOMAIN}/listings/${listing.id}?payment_success=true`,
      cancel_url: `${DOMAIN}/listings/${listing.id}?payment_canceled=true`,
      payment_intent_data: {
        // The application_fee_amount is the 3% service fee that your platform takes.
        application_fee_amount: Math.round(priceInCents * 0.03),
        // The transfer_data.destination is the seller's Stripe account that will receive the funds.
        transfer_data: {
          destination: sellerStripeAccountId,
        },
      },
    });

    return NextResponse.json({ id: session.id });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
