
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useState } from "react"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
})

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await authService.signInWithEmail(values.email, values.password);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.error,
        });
      } else {
        toast({ title: "Success", description: "Logged in successfully." });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      const result = await authService.signInWithGoogle();
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: result.error,
        });
      } else {
        toast({ 
          title: "Success", 
          description: result.isNewUser ? "Account created successfully!" : "Logged in successfully." 
        });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message,
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading('facebook');
    try {
      const result = await authService.signInWithFacebook();
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Facebook Sign-In Failed",
          description: result.error,
        });
      } else {
        toast({ 
          title: "Success", 
          description: result.isNewUser ? "Account created successfully!" : "Logged in successfully." 
        });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Facebook Sign-In Failed",
        description: error.message,
      });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Social Login Buttons */}
      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={socialLoading !== null || isLoading}
          className="w-full"
        >
          {socialLoading === 'google' ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <FcGoogle className="w-4 h-4" />
          )}
          <span className="ml-2">Continue with Google</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleFacebookSignIn}
          disabled={socialLoading !== null || isLoading}
          className="w-full"
        >
          {socialLoading === 'facebook' ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          ) : (
            <FaFacebook className="w-4 h-4 text-blue-600" />
          )}
          <span className="ml-2">Continue with Facebook</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                    >
                        Forgot your password?
                    </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
      </Form>
      <p className="px-8 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </Link>
        .
      </p>
    </div>
  )
}
