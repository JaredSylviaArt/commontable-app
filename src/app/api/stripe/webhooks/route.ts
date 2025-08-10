import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      case 'transfer.created':
        console.log('Transfer created:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('Payment completed for session:', session.id);
  
  if (!session.metadata?.listingId) {
    console.error('No listing ID in session metadata');
    return;
  }

  const { listingId, buyerId, sellerId, deliveryMethod } = session.metadata;

  // Update listing status
  const listingRef = doc(db, 'listings', listingId);
  await updateDoc(listingRef, {
    status: 'sold',
    soldAt: serverTimestamp(),
    paymentIntentId: session.payment_intent,
    buyerId: session.customer || buyerId,
  });

  // Update transaction status
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('paymentIntentId', '==', session.payment_intent)
  );
  const transactionDocs = await getDocs(transactionsQuery);
  
  if (!transactionDocs.empty) {
    const transactionDoc = transactionDocs.docs[0];
    await updateDoc(transactionDoc.ref, {
      status: 'completed',
      completedAt: serverTimestamp(),
      sessionId: session.id,
    });

    // Create order record
    const orderData = {
      transactionId: transactionDoc.id,
      listingId,
      buyerId: session.customer || buyerId,
      sellerId,
      status: 'paid',
      deliveryMethod: deliveryMethod || 'pickup',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'orders'), orderData);
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Additional processing if needed
  // The main handling is done in checkout.session.completed
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);
  
  // Update transaction status
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('paymentIntentId', '==', paymentIntent.id)
  );
  const transactionDocs = await getDocs(transactionsQuery);
  
  if (!transactionDocs.empty) {
    const transactionDoc = transactionDocs.docs[0];
    await updateDoc(transactionDoc.ref, {
      status: 'failed',
      failedAt: serverTimestamp(),
    });
  }
}

async function handleAccountUpdated(account: any) {
  console.log('Account updated:', account.id);
  
  const isOnboardingComplete = account.charges_enabled && account.payouts_enabled;
  
  // Find user with this Stripe account ID and update their status
  const usersQuery = query(
    collection(db, 'users'),
    where('stripeAccountId', '==', account.id)
  );
  const userDocs = await getDocs(usersQuery);
  
  if (!userDocs.empty) {
    const userDoc = userDocs.docs[0];
    await updateDoc(userDoc.ref, {
      stripeOnboardingComplete: isOnboardingComplete,
      stripeChargesEnabled: account.charges_enabled,
      stripePayoutsEnabled: account.payouts_enabled,
    });
  }
}
