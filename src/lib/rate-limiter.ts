"use server";

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// Default rate limit configurations for different endpoints
export const RateLimitConfigs = {
  // Authentication endpoints - strict limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // API endpoints - moderate limits
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Public endpoints - generous limits
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute
  },
  // File upload endpoints - tight limits
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  // Message/chat endpoints - moderate limits
  MESSAGING: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 messages per minute
  },
};

class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  // Generate a unique key for the request
  private generateKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation based on IP and endpoint
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown';
    
    const pathname = req.nextUrl.pathname;
    return `${ip}:${pathname}`;
  }

  // Check if request should be rate limited
  isRateLimited(req: NextRequest): { limited: boolean; remaining: number; resetTime: number } {
    const key = this.generateKey(req);
    const now = Date.now();
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      this.cleanup();
    }

    let requestData = requestCounts.get(key);
    
    // Initialize or reset if window has expired
    if (!requestData || now > requestData.resetTime) {
      requestData = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    requestData.count++;
    requestCounts.set(key, requestData);

    const remaining = Math.max(0, this.config.maxRequests - requestData.count);
    const limited = requestData.count > this.config.maxRequests;

    return {
      limited,
      remaining,
      resetTime: requestData.resetTime,
    };
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(key);
      }
    }
  }

  // Create middleware function
  middleware() {
    return (req: NextRequest) => {
      const result = this.isRateLimited(req);
      
      if (result.limited) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      
      return response;
    };
  }
}

// Create rate limiter instances for different endpoint types
export const authRateLimiter = new RateLimiter(RateLimitConfigs.AUTH);
export const apiRateLimiter = new RateLimiter(RateLimitConfigs.API);
export const publicRateLimiter = new RateLimiter(RateLimitConfigs.PUBLIC);
export const uploadRateLimiter = new RateLimiter(RateLimitConfigs.UPLOAD);
export const messagingRateLimiter = new RateLimiter(RateLimitConfigs.MESSAGING);

// Utility function to apply rate limiting to API routes
export function withRateLimit(rateLimiter: RateLimiter, handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResult = rateLimiter.isRateLimited(req);
    
    if (rateLimitResult.limited) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Execute the original handler
    const response = await handler(req);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimiter.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
    
    return response;
  };
}

// Custom rate limiter for specific use cases
export function createCustomRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

// Rate limit by user ID for authenticated endpoints
export const createUserRateLimiter = (windowMs: number, maxRequests: number) => {
  return new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req: NextRequest) => {
      // Extract user ID from auth header or session
      const authHeader = req.headers.get('authorization');
      const userId = authHeader ? extractUserIdFromToken(authHeader) : 'anonymous';
      const pathname = req.nextUrl.pathname;
      return `user:${userId}:${pathname}`;
    },
  });
};

// Helper function to extract user ID from auth token
function extractUserIdFromToken(authHeader: string): string {
  try {
    // This would typically decode a JWT token
    // For Firebase auth, you'd verify the token here
    const token = authHeader.replace('Bearer ', '');
    // Implementation would depend on your auth system
    return 'user-id'; // Placeholder
  } catch (error) {
    return 'anonymous';
  }
}

export default RateLimiter;
