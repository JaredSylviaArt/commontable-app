
"use server";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
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
    return { error: "Missing required fields." };
  }
  try {
    const messagesCol = collection(db, "conversations", conversationId, "messages");
    await addDoc(messagesCol, {
      text: text,
      senderId: senderId,
      timestamp: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error sending message:", error);
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
