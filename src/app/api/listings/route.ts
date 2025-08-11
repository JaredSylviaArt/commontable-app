import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.authorId) {
      return NextResponse.json(
        { error: 'Title and authorId are required' },
        { status: 400 }
      );
    }

    // Create the listing data (simplified for build compatibility)
    const listingData = {
      title: body.title,
      description: body.description || '',
      category: body.category || '',
      subCategory: body.subCategory || '',
      price: body.price || null,
      condition: body.condition || '',
      location: body.location || '',
      contactPreference: body.contactPreference || '',
      authorId: body.authorId,
      imageUrl: body.imageUrl || null,
      createdAt: serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'listings'), listingData);

    return NextResponse.json({ 
      listingId: docRef.id,
      success: true 
    });

  } catch (error: any) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}