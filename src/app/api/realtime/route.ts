import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response('User ID required', { status: 400 });
  }

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send connection established event
      sendEvent({
        type: 'NOTIFICATION',
        data: {
          id: `connect-${Date.now()}`,
          title: 'Connected',
          message: 'Real-time updates enabled',
          type: 'success'
        }
      });

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          sendEvent({
            type: 'HEARTBEAT',
            data: { timestamp: Date.now() }
          });
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000); // Every 30 seconds

      // Demo: Send sample events
      const demoEvents = setInterval(() => {
        try {
          // Simulate random events for demo
          const events = [
            {
              type: 'NEW_LISTING',
              data: {
                listing: {
                  id: `demo-${Date.now()}`,
                  title: 'Demo Listing Update',
                  price: Math.floor(Math.random() * 100) + 10
                },
                category: 'electronics'
              }
            },
            {
              type: 'NOTIFICATION',
              data: {
                id: `demo-${Date.now()}`,
                title: 'New Activity',
                message: 'Someone viewed your listing',
                type: 'info'
              }
            }
          ];
          
          const randomEvent = events[Math.floor(Math.random() * events.length)];
          sendEvent(randomEvent);
        } catch (error) {
          clearInterval(demoEvents);
        }
      }, 15000); // Every 15 seconds

      // Cleanup on connection close
      const cleanup = () => {
        clearInterval(heartbeat);
        clearInterval(demoEvents);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
      
      // Auto-cleanup after 10 minutes to prevent hanging connections
      setTimeout(cleanup, 10 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
