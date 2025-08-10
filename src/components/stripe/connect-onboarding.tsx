'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface ConnectOnboardingProps {
  userId: string;
  userEmail: string;
  stripeAccountId?: string;
  onboardingComplete?: boolean;
  onSuccess?: () => void;
}

export function ConnectOnboarding({
  userId,
  userEmail,
  stripeAccountId,
  onboardingComplete = false,
  onSuccess,
}: ConnectOnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState({
    chargesEnabled: false,
    payoutsEnabled: false,
    onboardingComplete,
  });

  const handleStartOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          refreshUrl: `${window.location.origin}/dashboard?tab=profile&refresh=true`,
          returnUrl: `${window.location.origin}/dashboard?tab=profile&setup=complete`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup payments');
      }

      // Save Stripe account ID to Firestore (create user doc if it doesn't exist)
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document with email and Stripe info
        await setDoc(userRef, {
          email: userEmail,
          stripeAccountId: data.accountId,
          stripeOnboardingComplete: false,
          createdAt: new Date(),
        });
      } else {
        // Update existing user document
        await updateDoc(userRef, {
          stripeAccountId: data.accountId,
          stripeOnboardingComplete: false,
        });
      }

      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAccountStatus = async () => {
    if (!stripeAccountId) return;

    setLoading(true);
    setError(null); // Clear any previous errors
    setSuccess(null); // Clear any previous success messages
    
    try {
      console.log('Checking account status for:', stripeAccountId);
      const response = await fetch(`/api/stripe/connect?accountId=${stripeAccountId}`);
      const data = await response.json();
      
      console.log('Status check response:', data);

      if (response.ok) {
        const newStatus = {
          chargesEnabled: data.chargesEnabled,
          payoutsEnabled: data.payoutsEnabled,
          onboardingComplete: data.onboardingComplete,
        };
        
        console.log('Updating account status:', newStatus);
        setAccountStatus(newStatus);

        // Set success message
        if (data.onboardingComplete) {
          setSuccess('Payment setup is complete! You can now receive payments.');
        } else {
          setSuccess('Status updated. Setup is still in progress.');
        }

        // Update Firestore if onboarding is complete
        if (data.onboardingComplete && !onboardingComplete) {
          console.log('Updating Firestore - onboarding complete');
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            stripeOnboardingComplete: true,
          });
        }

        if (data.onboardingComplete && onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || 'Failed to check account status');
      }
    } catch (err: any) {
      console.error('Status check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  console.log('ConnectOnboarding render:', {
    onboardingComplete,
    accountStatus,
    stripeAccountId,
    userId
  });

  if (onboardingComplete || accountStatus.onboardingComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Setup Complete
          </CardTitle>
          <CardDescription>
            You can now receive payments for your listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {accountStatus.chargesEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              Charges {accountStatus.chargesEnabled ? 'enabled' : 'pending'}
            </div>
            <div className="flex items-center gap-2">
              {accountStatus.payoutsEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              Payouts {accountStatus.payoutsEnabled ? 'enabled' : 'pending'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Setup Payments
        </CardTitle>
        <CardDescription>
          Set up your payment account to receive money from sales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {stripeAccountId && !onboardingComplete && !accountStatus.onboardingComplete && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment setup is in progress. Complete your onboarding to start receiving payments.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {!stripeAccountId ? (
            <Button 
              onClick={handleStartOnboarding} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Setup Payment Account'
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Only show these buttons if setup is not complete */}
              {!onboardingComplete && !accountStatus.onboardingComplete && (
                <>
                  <Button 
                    onClick={checkAccountStatus} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking status...
                      </>
                    ) : (
                      'Check Setup Status'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleStartOnboarding} 
                    disabled={loading}
                    className="w-full"
                  >
                    Continue Setup
                  </Button>
                </>
              )}
              
              {/* Show refresh button if setup appears complete but we want to double-check */}
              {(onboardingComplete || accountStatus.onboardingComplete) && (
                <Button 
                  onClick={checkAccountStatus} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Status'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Platform fee: 3% per transaction</p>
          <p>• Payments processed securely by Stripe</p>
          <p>• Automatic payouts to your bank account</p>
        </div>
      </CardContent>
    </Card>
  );
}

