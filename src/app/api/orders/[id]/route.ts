import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (!orderDoc.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const allowedUpdates = [
      'status',
      'trackingNumber',
      'notes',
      'shippingAddress',
      'deliveryMethod',
    ];

    const updates: any = {
      updatedAt: serverTimestamp(),
    };

    // Only allow specific fields to be updated
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    // Add status-specific timestamps
    if (body.status) {
      switch (body.status) {
        case 'shipped':
          updates.shippedAt = serverTimestamp();
          break;
        case 'delivered':
          updates.deliveredAt = serverTimestamp();
          break;
        case 'completed':
          updates.completedAt = serverTimestamp();
          break;
        case 'cancelled':
          updates.cancelledAt = serverTimestamp();
          break;
      }
    }

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, updates);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

