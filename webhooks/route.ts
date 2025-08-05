import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// The webhook secret is used to verify that the request is coming from Stripe.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Fulfill the purchase.
      // e.g., mark the listing as "sold" in your database.
      // You can retrieve the listing ID from the session metadata if you added it during creation.
      console.log('✅ Payment was successful for session:', session.id);
      break;

    case 'account.updated':
        const account = event.data.object as Stripe.Account;
        // TODO: Handle account updates.
        // For example, check if `charges_enabled` and `payouts_enabled` are true
        // to confirm that the seller is fully onboarded.
        console.log('✅ Account was updated:', account.id);
        break;
        
    default:
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
