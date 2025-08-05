
"use client"

import { useRef, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, DollarSign, Image as ImageIcon, Loader2, Wand2, X } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import Image from 'next/image'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createListingAction } from "@/app/actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  category: z.string({ required_error: "Please select a category." }),
  subCategory: z.string({ required_error: "Please select a sub-category." }),
  price: z.coerce.number().optional(),
  condition: z.string({ required_error: "Please select a condition." }),
  location: z.string().min(5, "A 5-digit ZIP code is required.").max(5, "A 5-digit ZIP code is required."),
  contactPreference: z.string({ required_error: "Please select a contact preference." }),
  image: z.any().refine(file => file instanceof File, "Image is required."),
  scheduledPickup: z.date().optional(),
  shareWindow: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
}).refine(data => {
    if (data.category === 'Sell') {
        return data.price !== undefined && data.price > 0;
    }
    return true;
}, {
    message: "A price greater than $0 is required for items being sold.",
    path: ["price"],
});

export function CreateListingForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      location: "",
    },
  })

  const selectedCategory = form.watch("category");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("image", null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to create a listing.",
        });
        return;
    }
    
    startTransition(async () => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (value) {
                 if (value instanceof Date) {
                    formData.append(key, value.toISOString());
                } else if (typeof value === 'object' && !(value instanceof File)) {
                    // Skip objects like shareWindow for now, or handle them specifically
                }
                 else {
                    formData.append(key, value as string | Blob);
                }
            }
        });
        
        const result = await createListingAction(user.uid, formData);

        if (result?.error) {
             toast({
                variant: "destructive",
                title: "Listing Creation Failed",
                description: result.error,
            });
        } else {
             toast({
                title: "Listing Created!",
                description: "Your listing has been successfully created.",
            });
            // Redirect based on whether it's a "Sell" item or not.
            if(values.category === 'Sell') {
                router.push('/listings/new/payouts');
            } else {
                router.push(`/listings/${result.listingId}`);
            }
        }
    });
  }

  return (
    <Card className="border-0 md:border shadow-none md:shadow-sm">
        <CardHeader>
            <CardTitle className="font-headline">Listing Details</CardTitle>
             <CardDescription>
                Provide the details for the resource you want to share.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Listing Image</FormLabel>
                            <FormControl>
                                <div 
                                    className="w-full aspect-video rounded-md border-2 border-dashed border-input flex items-center justify-center text-muted-foreground relative cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <>
                                            <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage();
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="mx-auto h-12 w-12" />
                                            <p className="mt-2 text-sm">Click to upload an image</p>
                                        </div>
                                    )}
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/gif"
                                        onChange={handleImageChange}
                                        disabled={isPending}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Gently Used Stage Lights" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Describe your item in detail, including its condition, quantity, and why you're sharing it."
                            className="min-h-[150px]"
                            {...field}
                            disabled={isPending}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Give">Give (Free)</SelectItem>
                                        <SelectItem value="Sell">Sell</SelectItem>
                                        <SelectItem value="Share">Share (Borrow)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="subCategory"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sub-Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a sub-category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Gear">Gear</SelectItem>
                                        <SelectItem value="Curriculum">Curriculum</SelectItem>
                                        <SelectItem value="Creative Assets">Creative Assets</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {selectedCategory === 'Sell' && (
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price</FormLabel>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        className="pl-8" 
                                        {...field} 
                                        onChange={event => field.onChange(+event.target.value)}
                                        value={field.value ?? ''}
                                        disabled={isPending}
                                    />
                                </FormControl>
                            </div>
                            <FormDescription>
                                A 3% service fee will be deducted from this price upon sale.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                
                <div className="grid md:grid-cols-2 gap-8">
                     <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condition</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a condition" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="New">New</SelectItem>
                                        <SelectItem value="Like New">Like New</SelectItem>
                                        <SelectItem value="Used">Used</SelectItem>
                                        <SelectItem value="For Parts">For Parts</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location (ZIP Code)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 90210" {...field} disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="contactPreference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Preference</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a preference" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Message">Message on CommonTable</SelectItem>
                                        <SelectItem value="Email">Email</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div />
                </div>
                

                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? 'Creating...' : 'Create Listing'}
                </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
