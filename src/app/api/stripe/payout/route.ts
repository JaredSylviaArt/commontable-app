import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, sellerId, paymentIntentId } = body;

    if (!listingId || !sellerId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the listing to find the price
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    if (!listingDoc.exists()) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const listingData = listingDoc.data();
    const salePrice = listingData.price;
    const platformFee = salePrice * 0.03; // 3% fee
    const sellerPayout = salePrice - platformFee;

    // Create a transfer to the seller (minus the 3% fee)
    const transfer = await stripe.transfers.create({
      amount: Math.round(sellerPayout * 100), // Convert to cents
      currency: 'usd',
      destination: sellerId, // This would be the seller's Stripe account ID
      source_transaction: paymentIntentId,
      description: `Payout for listing: ${listingData.title}`,
      metadata: {
        listingId,
        platformFee: platformFee.toString(),
        sellerPayout: sellerPayout.toString(),
      },
    });

    // Update the listing to mark it as sold and paid out
    await updateDoc(doc(db, 'listings', listingId), {
      status: 'sold',
      soldAt: new Date(),
      payoutAmount: sellerPayout,
      platformFee: platformFee,
      transferId: transfer.id,
    });

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      sellerPayout,
      platformFee,
    });

  } catch (error: any) {
    console.error('Payout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
