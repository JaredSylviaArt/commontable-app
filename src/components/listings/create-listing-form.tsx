
"use client"

import { useRef, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, DollarSign, Image as ImageIcon, Loader2, Wand2, X, Upload } from "lucide-react"
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
  const [isDragOver, setIsDragOver] = useState(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
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
        try {
            // Add timeout to prevent indefinite hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), 30000)
            );

            // First, create the listing without the image to get the listing ID
            const listingData = {
                title: values.title,
                description: values.description,
                category: values.category,
                subCategory: values.subCategory,
                price: values.price,
                condition: values.condition,
                location: values.location,
                contactPreference: values.contactPreference,
                authorId: user.uid,
                imageUrl: null, // Will be updated after upload
                createdAt: new Date().toISOString(),
            };

            // Create the listing in Firestore first with timeout
            const response = await Promise.race([
                fetch('/api/listings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(listingData),
                }),
                timeoutPromise
            ]);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create listing');
            }

            const { listingId } = await response.json();

            // Now upload the image if it exists
            let imageUrl = null;
            if (values.image instanceof File) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', values.image);
                uploadFormData.append('userId', user.uid);
                uploadFormData.append('listingId', listingId);

                const uploadResponse = await Promise.race([
                    fetch('/api/upload', {
                        method: 'POST',
                        body: uploadFormData,
                    }),
                    timeoutPromise
                ]);

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.error || 'Failed to upload image');
                }

                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.imageUrl;

                // Update the listing with the image URL
                await Promise.race([
                    fetch(`/api/listings/${listingId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageUrl }),
                    }),
                    timeoutPromise
                ]);
            }

            toast({
                title: "Listing Created!",
                description: "Your listing has been successfully created.",
            });

            // Redirect based on whether it's a "Sell" item or not.
            if(values.category === 'Sell') {
                router.push('/listings/new/payouts');
            } else {
                router.push(`/listings/${listingId}`);
            }

        } catch (error) {
            console.error('Error creating listing:', error);
            let errorMessage = 'An unexpected error occurred.';
            
            if (error instanceof Error) {
                if (error.message.includes('Firestore API has not been used')) {
                    errorMessage = 'Firebase Firestore is not enabled. Please enable it in your Firebase console.';
                } else if (error.message.includes('timed out')) {
                    errorMessage = 'Request timed out. Please try again.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            toast({
                variant: "destructive",
                title: "Listing Creation Failed",
                description: errorMessage,
            });
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Listing Image</FormLabel>
                            <FormControl>
                                <div 
                                    className={cn(
                                        "w-full max-w-md aspect-square rounded-lg border-2 border-dashed border-input flex items-center justify-center text-muted-foreground relative cursor-pointer transition-all duration-200",
                                        isDragOver ? "border-primary bg-primary/5" : "hover:border-primary hover:bg-muted/50",
                                        imagePreview ? "border-solid" : ""
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {imagePreview ? (
                                        <>
                                            <Image 
                                                src={imagePreview} 
                                                alt="Selected preview" 
                                                fill 
                                                className="object-cover rounded-lg" 
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 z-10 shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage();
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="mx-auto h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-3">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium mb-1">Upload an image</p>
                                            <p className="text-xs text-muted-foreground">Click or drag to upload</p>
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
                            <FormDescription>
                                Upload a clear image of your item. JPG, PNG, or GIF up to 5MB.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid gap-6">
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
                                className="min-h-[120px]"
                                {...field}
                                disabled={isPending}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
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
                
                <div className="grid md:grid-cols-2 gap-6">
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

                <Button type="submit" className="w-full md:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? 'Creating...' : 'Create Listing'}
                </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
