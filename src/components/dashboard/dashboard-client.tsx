
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ListingGrid from "../listings/listing-grid"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "../ui/skeleton"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"

import { mockListings } from "@/lib/mock-data"
import type { Listing } from "@/lib/types"
import { ConnectOnboarding } from "@/components/stripe/connect-onboarding"

const profileFormSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  churchName: z.string().optional(),
})

export function DashboardClient({ activeTab }: { activeTab?: string }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [stripeData, setStripeData] = useState<{
    stripeAccountId?: string;
    stripeOnboardingComplete?: boolean;
  }>({});
  const router = useRouter();

  // Fetch user's Stripe data from Firestore
  const fetchStripeData = async () => {
    if (!user?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setStripeData({
          stripeAccountId: userData.stripeAccountId,
          stripeOnboardingComplete: userData.stripeOnboardingComplete,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchStripeData();
  }, [user?.uid]);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      fullName: user?.displayName || "",
      // Note: churchName is not stored in auth, would need Firestore.
      // This is a placeholder for now.
      churchName: "", 
    },
  });

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateProfile(user, { displayName: values.fullName });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const handleTabChange = (value: string) => {
    router.push(`/dashboard?tab=${value}`);
  };


  const myListings = mockListings.filter(listing => listing.author.id === 'user-1'); // Mock of "my" listings

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Skeleton className="aspect-[4/3]" />
                        <Skeleton className="aspect-[4/3]" />
                        <Skeleton className="aspect-[4/3]" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!user) {
    // This should be handled by redirects higher up, but as a fallback:
    return <p>Please log in to view your dashboard.</p>
  }

  return (
    <Tabs value={activeTab || "my-listings"} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="my-listings">My Listings</TabsTrigger>

        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="my-listings" className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Your Active Listings</CardTitle>
                <CardDescription>Manage the resources you are currently offering.</CardDescription>
            </CardHeader>
            <CardContent>
                <ListingGrid listings={myListings} />
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile" className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Profile Information</CardTitle>
                <CardDescription>Update your personal and church details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isUpdating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="churchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Church / Organization</FormLabel>
                        <FormControl>
                           <Input {...field} disabled={isUpdating} placeholder="Your church or organization" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-2">
                      <FormLabel>Email</FormLabel>
                      <Input type="email" defaultValue={user.email || ""} disabled />
                  </div>
                  <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
        </Card>

        {/* Payment Setup Section */}
        <ConnectOnboarding 
          userId={user.uid}
          userEmail={user.email || ''}
          stripeAccountId={stripeData.stripeAccountId}
          onboardingComplete={stripeData.stripeOnboardingComplete || false}
          onSuccess={() => {
            // Refresh stripe data when onboarding is complete
            fetchStripeData();
          }}
        />
      </TabsContent>
    </Tabs>
  )
}
