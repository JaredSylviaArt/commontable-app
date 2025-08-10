import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, buyerId, deliveryMethod = 'pickup' } = body;

    if (!listingId || !buyerId) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId and buyerId' },
        { status: 400 }
      );
    }

    // Get listing details
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    if (!listingDoc.exists()) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const listing = listingDoc.data();
    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Listing is no longer available' },
        { status: 400 }
      );
    }

    if (!listing.price) {
      return NextResponse.json(
        { error: 'This listing is not for sale' },
        { status: 400 }
      );
    }

    // Get seller's Stripe account (required for Connect)
    const sellerDoc = await getDoc(doc(db, 'users', listing.authorId));
    if (!sellerDoc.exists() || !sellerDoc.data().stripeAccountId) {
      return NextResponse.json(
        { error: 'Seller has not set up payments yet' },
        { status: 400 }
      );
    }

    const sellerStripeAccountId = sellerDoc.data().stripeAccountId;
    const priceInCents = Math.round(listing.price * 100);
    const platformFeeInCents = Math.round(priceInCents * 0.03); // 3% fee

    // Create checkout session with Stripe Connect
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              images: listing.imageUrl ? [listing.imageUrl] : [],
              description: listing.description,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/listings/${listingId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/listings/${listingId}?canceled=true`,
      payment_intent_data: {
        application_fee_amount: platformFeeInCents,
        transfer_data: {
          destination: sellerStripeAccountId,
        },
        metadata: {
          listingId,
          buyerId,
          sellerId: listing.authorId,
          deliveryMethod,
        },
      },
      metadata: {
        listingId,
        buyerId,
        sellerId: listing.authorId,
        deliveryMethod,
        type: 'marketplace_payment',
      },
    });

    // Create pending transaction record
    const transactionData = {
      listingId,
      buyerId,
      sellerId: listing.authorId,
      amount: listing.price,
      platformFee: listing.price * 0.03,
      sellerPayout: listing.price * 0.97,
      status: 'pending',
      paymentIntentId: session.payment_intent,
      sessionId: session.id,
      createdAt: serverTimestamp(),
      metadata: {
        listingTitle: listing.title,
      },
    };

    await addDoc(collection(db, 'transactions'), transactionData);

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
