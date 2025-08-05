
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export function PayoutForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handleStripeConnect() {
    setIsLoading(true);
    
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to connect a Stripe account.",
        });
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/stripe/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
        });

        const { url, error } = await response.json();

        if (error) {
            throw new Error(error);
        }
        
        // Redirect the user to the Stripe onboarding URL.
        if (url) {
            router.push(url);
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Stripe Connection Failed",
            description: error.message || "An unknown error occurred.",
        });
        setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto border-0 md:border shadow-none md:shadow-sm mt-4">
        <CardHeader>
            <CardTitle className="font-headline">Set Up Payouts with Stripe</CardTitle>
             <CardDescription>
                We use Stripe to make sure you get paid securely and reliably. Click the button below to set up your account—you'll be redirected to Stripe's secure website and then brought back here.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Button 
                onClick={handleStripeConnect} 
                className="bg-[#635BFF] text-white hover:bg-[#554cff]" 
                disabled={isLoading}
             >
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect with Stripe
            </Button>
        </CardContent>
    </Card>
  )
}
