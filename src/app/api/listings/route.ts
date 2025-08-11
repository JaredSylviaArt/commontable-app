import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import InputSanitizer from '@/lib/sanitization';
import { rbacService, Permission } from '@/lib/rbac';
import { withRateLimit, apiRateLimiter } from '@/lib/rate-limiter';

async function createListingHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract user ID from auth header (you'd implement proper auth verification)
    const authHeader = request.headers.get('authorization');
    const userId = body.authorId; // In real implementation, extract from verified JWT
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user permissions
    const userRole = await rbacService.getUserRole(userId);
    if (!rbacService.hasPermission(userRole, Permission.CREATE_LISTING)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Sanitize input data
    const sanitizedData = InputSanitizer.sanitizeListing(body);
    
    // Validate content
    const titleValidation = InputSanitizer.validateContent(sanitizedData.title, 'text');
    const descriptionValidation = InputSanitizer.validateContent(sanitizedData.description, 'rich');
    
    if (!titleValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid title', details: titleValidation.errors },
        { status: 400 }
      );
    }
    
    if (!descriptionValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid description', details: descriptionValidation.errors },
        { status: 400 }
      );
    }
    
    // Create the listing document with sanitized data
    const listingData = {
      title: titleValidation.sanitized,
      description: descriptionValidation.sanitized,
      category: sanitizedData.category,
      subCategory: sanitizedData.subCategory,
      condition: sanitizedData.condition,
      location: sanitizedData.location,
      price: sanitizedData.price,
      contactPreference: sanitizedData.contactPreference,
      imageUrl: body.imageUrl || '', // URLs should be validated separately
      images: body.images || [], // URLs should be validated separately
      authorId: userId,
      createdAt: serverTimestamp(),
      status: 'active',
    };

    const docRef = await addDoc(collection(db, 'listings'), listingData);
    
    return NextResponse.json({ 
      id: docRef.id,
      message: 'Listing created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the handler
export const POST = withRateLimit(apiRateLimiter, createListingHandler);