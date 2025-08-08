import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const listingId = params.id;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Update the listing
    const listingRef = doc(db, 'listings', listingId);
    await updateDoc(listingRef, body);

    return NextResponse.json({ 
      success: true,
      message: 'Listing updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
