
"use server";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, setDoc, query, where, getDocs, updateDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function suggestCategoryAction(input: any) {
  // AI features disabled for deployment
  return { categories: [] };
}

export async function sendMessageAction(
  conversationId: string,
  text: string,
  senderId: string
) {
  if (!conversationId || !text || !senderId) {
    console.error("Missing required fields:", { conversationId, text: !!text, senderId });
    return { error: "Missing required fields." };
  }
  
  try {
    console.log("Server: Adding message to conversation:", conversationId);
    const messagesCol = collection(db, "conversations", conversationId, "messages");
    const docRef = await addDoc(messagesCol, {
      text: text,
      senderId: senderId,
      timestamp: serverTimestamp(),
    });
    console.log("Server: Message added with ID:", docRef.id);
    
    // Update conversation's lastMessage and updatedAt
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text: text,
        senderId: senderId,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });

    // TODO: Send notification to other participants
    // This would integrate with a service like SendGrid, Resend, or Firebase Functions
    console.log("TODO: Send notification for new message");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error sending message:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      conversationId,
      senderId
    });
    return { error: error.message };
  }
}

export async function createConversationAction(
  currentUserId: string,
  sellerId: string,
  listingId: string,
  listingTitle: string,
  listingImageUrl: string
) {
  if (!currentUserId || !sellerId || !listingId) {
    return { error: "Missing required fields." };
  }

  if (currentUserId === sellerId) {
    return { error: "Cannot start conversation with yourself." };
  }

  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, "conversations");
    const existingQuery = query(
      conversationsRef,
      where("listingId", "==", listingId),
      where("participantIds", "array-contains", currentUserId)
    );
    
    const existingConversations = await getDocs(existingQuery);
    
    // Check if any existing conversation has both participants
    for (const doc of existingConversations.docs) {
      const data = doc.data();
      if (data.participantIds.includes(sellerId)) {
        return { success: true, conversationId: doc.id };
      }
    }

    // Create new conversation
    const newConversation = {
      listingId,
      listingTitle,
      listingImageUrl,
      participantIds: [currentUserId, sellerId],
      lastMessage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    console.log("Created new conversation:", docRef.id);
    
    return { success: true, conversationId: docRef.id };
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return { error: error.message };
  }
}

export async function createUserProfileAction(
  userId: string,
  name: string,
  email: string,
  churchName?: string
) {
  if (!userId || !name || !email) {
    return { error: "Missing required fields." };
  }

  try {
    // Check if user profile already exists
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      // Create new user profile
      await setDoc(doc(db, "users", userId), {
        name,
        email,
        churchName: churchName || "",
        createdAt: serverTimestamp(),
      });
      console.log("Created user profile for:", userId);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user profile:", error);
    return { error: error.message };
  }
}

export async function createListingAction(userId: string, formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  
  // Quick validation
  if (!userId || !rawFormData.title) {
      return { error: 'User ID and title are required.' };
  }

  try {
      // 1. Create a new document reference in Firestore to get a unique ID
      const newListingRef = doc(collection(db, 'listings'));
      const listingId = newListingRef.id;
      
      // 2. Handle image upload through API route if image exists
      let imageUrl = null;
      if (rawFormData.image && rawFormData.image instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', rawFormData.image);
        uploadFormData.append('userId', userId);
        uploadFormData.append('listingId', listingId);
        
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upload`, {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          return { error: errorData.error || 'Failed to upload image' };
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      }

      // 3. Create the listing data object
      const listingData = {
          title: rawFormData.title as string,
          description: rawFormData.description as string,
          category: rawFormData.category as string,
          subCategory: rawFormData.subCategory as string,
          price: rawFormData.price ? parseFloat(rawFormData.price as string) : null,
          condition: rawFormData.condition as string,
          location: rawFormData.location as string,
          contactPreference: rawFormData.contactPreference as string,
          authorId: userId,
          imageUrl: imageUrl,
          createdAt: serverTimestamp(),
      };

      // 4. Save the listing data to Firestore
      await setDoc(newListingRef, listingData);
      
      // 5. Revalidate path to show the new listing
      revalidatePath('/');
      revalidatePath('/dashboard');

      return { success: true, listingId };

  } catch (error: any) {
      console.error('Error creating listing:', error);
      return { error: error.message };
  }
}
