
"use server";

import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { revalidatePath } from "next/cache";

// Optional AI features - only import if available
let suggestCategory: any = null;
let SuggestCategoryInput: any = null;

try {
  const aiModule = require("@/ai/flows/suggest-category");
  suggestCategory = aiModule.suggestCategory;
  SuggestCategoryInput = aiModule.SuggestCategoryInput;
} catch (error) {
  console.log("AI features not available:", error);
}

export async function suggestCategoryAction(input: any) {
  try {
    if (!suggestCategory) {
      return { categories: [] };
    }
    const result = await suggestCategory(input);
    return result;
  } catch (error) {
    console.error(error);
    return { categories: [] };
  }
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
  // Quick validation, though client-side should handle most of this.
  if (!userId || !rawFormData.title || !rawFormData.image) {
      return { error: 'User ID, title, and image are required.' };
  }

  const imageFile = rawFormData.image as File;

  try {
      // 1. Create a new document reference in Firestore to get a unique ID
      const newListingRef = doc(collection(db, 'listings'));
      const listingId = newListingRef.id;
      
      // 2. Upload the image to Firebase Storage
      const imagePath = `listings/${userId}/${listingId}/${imageFile.name}`;
      const storageRef = ref(storage, imagePath);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

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
          authorId: userId, // We'll fetch author details on the client
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
