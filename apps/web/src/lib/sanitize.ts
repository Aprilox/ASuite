/**
 * Text sanitization utilities for user input
 * Using DOMPurify for robust XSS protection
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side
const window = typeof globalThis.window === 'undefined'
    ? new JSDOM('').window
    : globalThis.window;

const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize text to prevent XSS attacks
 * Removes all HTML tags and dangerous content using DOMPurify
 * 
 * @param text - Input text that may contain HTML
 * @returns Plain text with HTML tags and dangerous content removed
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // Use DOMPurify to sanitize - more robust than regex
    // ALLOWED_TAGS: [] means no HTML tags allowed (pure text)
    const sanitized = DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [], // Strip all attributes
        KEEP_CONTENT: true, // Keep the text content
    });

    return sanitized.trim();
}

/**
 * Sanitize HTML to allow safe HTML content
 * Useful for rich text editors - allows safe HTML tags
 * 
 * @param html - Input HTML that may contain dangerous content
 * @returns Sanitized HTML with dangerous content removed
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // Allow common safe HTML tags for rich text
    const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    return sanitized;
}

/**
 * Validate text length
 * @param text - Text to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Field name for error message
 * @returns Error message if invalid, null if valid
 */
export function validateTextLength(
    text: string,
    maxLength: number,
    fieldName: string
): string | null {
    if (!text || text.trim().length === 0) {
        return `${fieldName} est requis`;
    }

    if (text.length > maxLength) {
        return `${fieldName} est trop long (max ${maxLength} caractères)`;
    }

    return null;
}
