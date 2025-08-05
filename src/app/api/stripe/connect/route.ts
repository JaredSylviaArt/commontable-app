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
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // TODO: You might want to check if a Stripe account already exists for this user in your database.
    // If it does, you can return a login link instead of creating a new account.
    // const existingStripeAccountId = ...

    const account = await stripe.accounts.create({
      type: 'express', // Use 'express' for marketplaces where you want Stripe to handle most of the complexity.
      // You can pre-fill information about the user if you have it.
      // email: user.email,
    });

    // TODO: Save the new `account.id` to your database, associated with your internal `userId`.
    // This is crucial for creating checkout sessions and payouts later.
    // await db.collection('users').doc(userId).update({ stripeAccountId: account.id });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${DOMAIN}/listings/new/payouts`, // URL to redirect to if the link expires
      return_url: `${DOMAIN}/dashboard`, // URL to redirect to after onboarding is complete
      type: 'account_onboarding',
    });

    // Return the one-time-use onboarding URL to the frontend.
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
