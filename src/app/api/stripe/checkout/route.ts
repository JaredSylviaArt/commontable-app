import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, title, price, imageUrl } = body;

    if (!listingId || !title || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create simple checkout session - buyer pays the listed price
    // The 3% fee will be charged to the seller later when they receive payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              images: imageUrl ? [imageUrl] : [],
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Simple one-time payment
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/listings/${listingId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/listings/${listingId}?canceled=true`,
      metadata: {
        listingId,
        type: 'simple_payment',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
