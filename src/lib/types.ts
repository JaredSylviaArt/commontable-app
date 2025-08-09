
import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  email: string;
  churchName?: string;
  photoURL?: string;
  location?: string;
  createdAt?: Timestamp;
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
