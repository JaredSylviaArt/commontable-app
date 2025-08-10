import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, refreshUrl, returnUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: body.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?tab=profile&refresh=true`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?tab=profile&setup=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (error: any) {
    console.error('Stripe Connect setup error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.retrieve(accountId);
    
    const isOnboardingComplete = account.charges_enabled && account.payouts_enabled;

    return NextResponse.json({
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      onboardingComplete: isOnboardingComplete,
      requirementsCurrentlyDue: account.requirements?.currently_due || [],
    });
  } catch (error: any) {
    console.error('Stripe account status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

