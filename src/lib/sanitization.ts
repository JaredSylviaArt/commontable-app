import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM for server-side usage
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Sanitization configurations for different content types
const SanitizationConfigs = {
  // Basic text content (titles, names, etc.)
  BASIC_TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // Rich text content (descriptions, posts, etc.)
  RICH_TEXT: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ],
    ALLOWED_ATTR: {
      '*': ['class']
    },
    KEEP_CONTENT: true,
  },
  
  // Comments/messages (more restrictive)
  COMMENT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // URLs (very restrictive)
  URL: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false,
  }
};

class InputSanitizer {
  /**
   * Sanitize basic text content (removes all HTML)
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return purify.sanitize(input, {
      ...SanitizationConfigs.BASIC_TEXT,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    });
  }

  /**
   * Sanitize rich text content (allows safe HTML tags)
   */
  static sanitizeRichText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return purify.sanitize(input, {
      ...SanitizationConfigs.RICH_TEXT,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    });
  }

  /**
   * Sanitize comment/message content
   */
  static sanitizeComment(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return purify.sanitize(input, {
      ...SanitizationConfigs.COMMENT,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    });
  }

  /**
   * Sanitize and validate URLs
   */
  static sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML
    let sanitized = purify.sanitize(input, SanitizationConfigs.URL);
    
    // Validate URL format
    try {
      const url = new URL(sanitized);
      // Only allow http and https protocols
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.toString();
      }
    } catch (error) {
      // Invalid URL
    }
    
    return '';
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML
    let sanitized = purify.sanitize(input, SanitizationConfigs.BASIC_TEXT);
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(sanitized)) {
      return sanitized.toLowerCase().trim();
    }
    
    return '';
  }

  /**
   * Sanitize phone numbers
   */
  static sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML
    let sanitized = purify.sanitize(input, SanitizationConfigs.BASIC_TEXT);
    
    // Remove non-digit characters except +, -, (, ), and spaces
    sanitized = sanitized.replace(/[^\d+\-\(\)\s]/g, '');
    
    return sanitized.trim();
  }

  /**
   * Sanitize file names
   */
  static sanitizeFileName(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML
    let sanitized = purify.sanitize(input, SanitizationConfigs.BASIC_TEXT);
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }
    
    return sanitized.trim();
  }

  /**
   * Sanitize search queries
   */
  static sanitizeSearchQuery(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML
    let sanitized = purify.sanitize(input, SanitizationConfigs.BASIC_TEXT);
    
    // Remove potential SQL injection patterns
    sanitized = sanitized.replace(/['"`;\\]/g, '');
    
    // Limit length
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }
    
    return sanitized.trim();
  }

  /**
   * Sanitize listing data
   */
  static sanitizeListing(data: any): any {
    if (!data || typeof data !== 'object') return {};
    
    return {
      title: this.sanitizeText(data.title || ''),
      description: this.sanitizeRichText(data.description || ''),
      category: this.sanitizeText(data.category || ''),
      subCategory: this.sanitizeText(data.subCategory || ''),
      condition: this.sanitizeText(data.condition || ''),
      location: this.sanitizeText(data.location || ''),
      price: this.sanitizeNumber(data.price),
      contactPreference: this.sanitizeText(data.contactPreference || ''),
      churchName: this.sanitizeText(data.churchName || ''),
    };
  }

  /**
   * Sanitize user profile data
   */
  static sanitizeUserProfile(data: any): any {
    if (!data || typeof data !== 'object') return {};
    
    return {
      name: this.sanitizeText(data.name || ''),
      email: this.sanitizeEmail(data.email || ''),
      churchName: this.sanitizeText(data.churchName || ''),
      bio: this.sanitizeComment(data.bio || ''),
      phone: this.sanitizePhone(data.phone || ''),
      website: this.sanitizeUrl(data.website || ''),
    };
  }

  /**
   * Sanitize message content
   */
  static sanitizeMessage(data: any): any {
    if (!data || typeof data !== 'object') return {};
    
    return {
      text: this.sanitizeComment(data.text || ''),
      senderId: this.sanitizeText(data.senderId || ''),
      conversationId: this.sanitizeText(data.conversationId || ''),
    };
  }

  /**
   * Sanitize numbers
   */
  static sanitizeNumber(input: any): number | null {
    if (input === null || input === undefined) return null;
    
    const num = parseFloat(input);
    if (isNaN(num) || !isFinite(num)) return null;
    
    return num;
  }

  /**
   * Sanitize boolean values
   */
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      return input.toLowerCase() === 'true';
    }
    return Boolean(input);
  }

  /**
   * Sanitize arrays
   */
  static sanitizeArray(input: any, sanitizer: (item: any) => any): any[] {
    if (!Array.isArray(input)) return [];
    
    return input.map(sanitizer).filter(item => item !== null && item !== undefined);
  }

  /**
   * Rate limit sensitive operations
   */
  static validateContentLength(content: string, maxLength: number): boolean {
    return content.length <= maxLength;
  }

  /**
   * Check for spam patterns
   */
  static detectSpam(content: string): boolean {
    if (!content || typeof content !== 'string') return false;
    
    const spamPatterns = [
      // Excessive capitalization
      /[A-Z]{10,}/,
      // Excessive repeated characters
      /(.)\1{5,}/,
      // Multiple URLs
      /(https?:\/\/[^\s]+.*){3,}/i,
      // Excessive special characters
      /[!@#$%^&*()]{5,}/,
    ];
    
    return spamPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Comprehensive content validation
   */
  static validateContent(content: string, type: 'text' | 'rich' | 'comment' = 'text'): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        sanitized: '',
        errors: ['Content is required']
      };
    }
    
    // Check length limits
    const maxLengths = {
      text: 500,
      rich: 5000,
      comment: 1000
    };
    
    if (content.length > maxLengths[type]) {
      errors.push(`Content exceeds maximum length of ${maxLengths[type]} characters`);
    }
    
    // Check for spam
    if (this.detectSpam(content)) {
      errors.push('Content appears to be spam');
    }
    
    // Sanitize based on type
    let sanitized: string;
    switch (type) {
      case 'rich':
        sanitized = this.sanitizeRichText(content);
        break;
      case 'comment':
        sanitized = this.sanitizeComment(content);
        break;
      default:
        sanitized = this.sanitizeText(content);
    }
    
    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }
}

export default InputSanitizer;
export { SanitizationConfigs };
