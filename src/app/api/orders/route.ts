import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role'); // 'buyer' or 'seller'
    const status = searchParams.get('status');
    const limitCount = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let ordersQuery = query(collection(db, 'orders'));

    // Filter by user role
    if (role === 'buyer') {
      ordersQuery = query(ordersQuery, where('buyerId', '==', userId));
    } else if (role === 'seller') {
      ordersQuery = query(ordersQuery, where('sellerId', '==', userId));
    } else {
      // Return both buyer and seller orders
      const buyerQuery = query(
        collection(db, 'orders'),
        where('buyerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount / 2)
      );
      const sellerQuery = query(
        collection(db, 'orders'),
        where('sellerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount / 2)
      );

      const [buyerDocs, sellerDocs] = await Promise.all([
        getDocs(buyerQuery),
        getDocs(sellerQuery),
      ]);

      const orders = [
        ...buyerDocs.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'buyer' })),
        ...sellerDocs.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'seller' })),
      ];

      // Sort by createdAt descending
      orders.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      });

      return NextResponse.json({
        orders: orders.slice(0, limitCount),
        total: orders.length,
      });
    }

    // Add status filter if specified
    if (status) {
      ordersQuery = query(ordersQuery, where('status', '==', status));
    }

    // Add ordering and limit
    ordersQuery = query(ordersQuery, orderBy('createdAt', 'desc'), limit(limitCount));

    const orderDocs = await getDocs(ordersQuery);
    const orders = orderDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role: role || 'unknown',
    }));

    return NextResponse.json({
      orders,
      total: orders.length,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

