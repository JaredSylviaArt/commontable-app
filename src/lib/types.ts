
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

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: 'Give' | 'Sell' | 'Share';
  subCategory: 'Curriculum' | 'Creative Assets' | 'Gear' | 'Other';
  location: string; // ZIP code
  condition: 'New' | 'Like New' | 'Used' | 'For Parts';
  contactPreference: 'Message' | 'Email';
  imageUrl: string;
  price?: number;
  author: User; // This will be populated client-side
  authorId: string; // This is stored in Firestore
  createdAt: string | Timestamp; // Can be string for mock, Timestamp for Firestore
  scheduledPickup?: string;
  shareWindow?: {
    start: string;
    end: string;
  };
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
