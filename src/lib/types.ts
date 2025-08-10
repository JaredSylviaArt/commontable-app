
import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  email: string;
  churchName?: string;
  photoURL?: string;
  location?: string;
  createdAt?: Timestamp;
  // Stripe integration fields
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
};

export type Category = 'Give' | 'Sell' | 'Share';

export type SubCategory = 
  | 'Curriculum' | 'Creative Assets' | 'Gear' | 'Furniture' 
  | 'Technology' | 'Instruments' | 'Books' | 'Supplies' | 'Other';

export type Condition = 'New' | 'Like New' | 'Used' | 'For Parts';

export type Tag = {
  id: string;
  name: string;
  color: string;
  category?: Category;
};

export type CustomAttribute = {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[]; // For select type
};

export type ListingStatus = 'active' | 'sold' | 'pending' | 'removed';

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: Category;
  subCategory: SubCategory;
  location: string; // ZIP code
  condition: Condition;
  contactPreference: 'Message' | 'Email';
  imageUrl: string; // Primary image for backward compatibility
  images?: string[]; // Array of all images including primary
  price?: number;
  author: User; // This will be populated client-side
  authorId: string; // This is stored in Firestore
  createdAt: string | Timestamp; // Can be string for mock, Timestamp for Firestore
  scheduledPickup?: string;
  shareWindow?: {
    start: string;
    end: string;
  };
  // New advanced categorization fields
  tags?: Tag[];
  customAttributes?: CustomAttribute[];
  keywords?: string[]; // For search optimization
  ageGroup?: 'Kids' | 'Youth' | 'Adults' | 'All Ages';
  deliveryOptions?: ('Pickup' | 'Local Delivery' | 'Shipping')[];
  featured?: boolean;
  popularity?: number; // For recommendation engine
  views?: number;
  bookmarks?: number;
  // Stripe integration fields
  status?: ListingStatus;
  soldAt?: Timestamp;
  paymentIntentId?: string;
  buyerId?: string;
  payoutAmount?: number;
  platformFee?: number;
  transferId?: string;
  stripeAccountId?: string; // Seller's Stripe Connect account
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
};

export type Conversation = {
  id:string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  participantIds: string[];
  participants: { [key: string]: Pick<User, 'name'> }; // Store less user data
  lastMessage: {
    text: string;
    timestamp: Timestamp;
  } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Review = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  rating: number; // 1-5
  comment: string;
  listingId?: string;
  listingTitle?: string;
  createdAt: Timestamp;
};

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type Transaction = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number; // Total amount paid by buyer
  platformFee: number; // 3% fee
  sellerPayout: number; // Amount to be paid to seller
  status: TransactionStatus;
  paymentIntentId: string;
  transferId?: string; // Stripe transfer ID for payout
  createdAt: Timestamp;
  completedAt?: Timestamp;
  refundedAt?: Timestamp;
  metadata?: {
    listingTitle: string;
    buyerEmail?: string;
    sellerEmail?: string;
  };
};

export type Order = {
  id: string;
  transactionId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  deliveryMethod: 'pickup' | 'local_delivery' | 'shipping';
  trackingNumber?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
